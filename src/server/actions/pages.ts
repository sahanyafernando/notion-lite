"use server";

import { revalidatePath } from "next/cache";
import type { Prisma } from "@/generated/prisma/client";
import { requireDbUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  canEditPage,
  canEditWorkspace,
  canViewPage,
  canViewWorkspace,
} from "@/lib/permissions";

export type PageTreeNode = {
  id: string;
  title: string;
  parentId: string | null;
  children: PageTreeNode[];
};

function buildPageTree(
  pages: Array<{ id: string; title: string; parentId: string | null }>,
): PageTreeNode[] {
  const map = new Map<string, PageTreeNode>();
  const roots: PageTreeNode[] = [];

  for (const page of pages) {
    map.set(page.id, { ...page, children: [] });
  }

  for (const page of pages) {
    const node = map.get(page.id)!;
    if (page.parentId && map.has(page.parentId)) {
      map.get(page.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  return roots;
}

export async function getWorkspacePages(workspaceId: string) {
  const user = await requireDbUser();
  const canView = await canViewWorkspace(user.id, workspaceId);
  if (!canView) throw new Error("Forbidden");

  const pages = await prisma.page.findMany({
    where: { workspaceId },
    select: {
      id: true,
      title: true,
      parentId: true,
    },
    orderBy: { createdAt: "asc" },
  });

  return buildPageTree(pages);
}

export async function createPage(
  workspaceId: string,
  parentId?: string | null,
) {
  const user = await requireDbUser();
  const canEdit = await canEditWorkspace(user.id, workspaceId);
  if (!canEdit) throw new Error("Forbidden");

  if (parentId) {
    const parent = await prisma.page.findFirst({
      where: { id: parentId, workspaceId },
    });
    if (!parent) throw new Error("Parent page not found");
  }

  const page = await prisma.page.create({
    data: {
      title: "Untitled",
      workspaceId,
      parentId: parentId ?? null,
      content: {
        type: "doc",
        content: [{ type: "paragraph" }],
      },
    },
  });

  revalidatePath(`/workspace/${workspaceId}`);
  return page;
}

export async function getPage(pageId: string) {
  const user = await requireDbUser();
  const canView = await canViewPage(user.id, pageId);
  if (!canView) throw new Error("Forbidden");

  return prisma.page.findUnique({
    where: { id: pageId },
    include: {
      workspace: {
        select: { id: true, name: true },
      },
      tags: {
        include: {
          tag: true,
        },
      },
      sharePermissions: {
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
      },
    },
  });
}

export async function updatePage(
  pageId: string,
  data: {
    title?: string;
    content?: Prisma.InputJsonValue;
    summary?: string | null;
  },
) {
  const user = await requireDbUser();
  const canEdit = await canEditPage(user.id, pageId);
  if (!canEdit) throw new Error("Forbidden");

  const page = await prisma.page.update({
    where: { id: pageId },
    data,
  });

  revalidatePath(`/page/${pageId}`);
  revalidatePath(`/workspace/${page.workspaceId}`);
  return page;
}

export async function deletePage(pageId: string) {
  const user = await requireDbUser();
  const page = await prisma.page.findUnique({ where: { id: pageId } });
  if (!page) throw new Error("Page not found");

  const canEdit = await canEditPage(user.id, pageId);
  if (!canEdit) throw new Error("Forbidden");

  await prisma.page.delete({ where: { id: pageId } });
  revalidatePath(`/workspace/${page.workspaceId}`);
}

export async function searchPages(workspaceId: string, query: string) {
  const user = await requireDbUser();
  const canView = await canViewWorkspace(user.id, workspaceId);
  if (!canView) throw new Error("Forbidden");

  const trimmed = query.trim();
  if (!trimmed) return [];

  return prisma.page.findMany({
    where: {
      workspaceId,
      OR: [
        { title: { contains: trimmed, mode: "insensitive" } },
        {
          tags: {
            some: {
              tag: {
                name: { contains: trimmed, mode: "insensitive" },
              },
            },
          },
        },
      ],
    },
    select: {
      id: true,
      title: true,
      parentId: true,
      updatedAt: true,
    },
    orderBy: { updatedAt: "desc" },
    take: 20,
  });
}
