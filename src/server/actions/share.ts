"use server";

import { revalidatePath } from "next/cache";
import type { ShareRole } from "@/generated/prisma/client";
import { requireDbUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canEditPage } from "@/lib/permissions";

export async function addTagToPage(pageId: string, tagName: string) {
  const user = await requireDbUser();
  const canEdit = await canEditPage(user.id, pageId);
  if (!canEdit) throw new Error("Forbidden");

  const page = await prisma.page.findUnique({ where: { id: pageId } });
  if (!page) throw new Error("Page not found");

  const name = tagName.trim().toLowerCase();
  if (!name) throw new Error("Tag name is required");

  const tag = await prisma.tag.upsert({
    where: {
      workspaceId_name: {
        workspaceId: page.workspaceId,
        name,
      },
    },
    update: {},
    create: {
      workspaceId: page.workspaceId,
      name,
    },
  });

  await prisma.pageTag.upsert({
    where: {
      pageId_tagId: {
        pageId,
        tagId: tag.id,
      },
    },
    update: {},
    create: {
      pageId,
      tagId: tag.id,
    },
  });

  revalidatePath(`/page/${pageId}`);
}

export async function removeTagFromPage(pageId: string, tagId: string) {
  const user = await requireDbUser();
  const canEdit = await canEditPage(user.id, pageId);
  if (!canEdit) throw new Error("Forbidden");

  await prisma.pageTag.delete({
    where: {
      pageId_tagId: {
        pageId,
        tagId,
      },
    },
  });

  revalidatePath(`/page/${pageId}`);
}

export async function sharePage(
  pageId: string,
  email: string,
  role: ShareRole,
) {
  const user = await requireDbUser();
  const canEdit = await canEditPage(user.id, pageId);
  if (!canEdit) throw new Error("Forbidden");

  const targetUser = await prisma.user.findUnique({
    where: { email: email.trim().toLowerCase() },
  });

  if (!targetUser) {
    throw new Error("User must sign up before they can be invited");
  }

  await prisma.sharePermission.upsert({
    where: {
      pageId_userId: {
        pageId,
        userId: targetUser.id,
      },
    },
    update: { role },
    create: {
      pageId,
      userId: targetUser.id,
      role,
    },
  });

  revalidatePath(`/page/${pageId}`);
}

export async function removePageShare(pageId: string, userId: string) {
  const user = await requireDbUser();
  const canEdit = await canEditPage(user.id, pageId);
  if (!canEdit) throw new Error("Forbidden");

  await prisma.sharePermission.delete({
    where: {
      pageId_userId: {
        pageId,
        userId,
      },
    },
  });

  revalidatePath(`/page/${pageId}`);
}
