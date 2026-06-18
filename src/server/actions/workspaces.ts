"use server";

import { revalidatePath } from "next/cache";
import { requireDbUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  canEditWorkspace,
  canViewWorkspace,
  roleCanManageWorkspace,
} from "@/lib/permissions";

export async function createWorkspace(name: string) {
  const user = await requireDbUser();
  const trimmed = name.trim();
  if (!trimmed) throw new Error("Workspace name is required");

  const workspace = await prisma.workspace.create({
    data: {
      name: trimmed,
      ownerId: user.id,
      members: {
        create: {
          userId: user.id,
          role: "OWNER",
        },
      },
      pages: {
        create: {
          title: "Getting Started",
          content: {
            type: "doc",
            content: [
              {
                type: "heading",
                attrs: { level: 1 },
                content: [{ type: "text", text: "Welcome to NotionLite" }],
              },
              {
                type: "paragraph",
                content: [
                  {
                    type: "text",
                    text: "Create nested pages from the sidebar, add tags, search, and summarize with AI.",
                  },
                ],
              },
            ],
          },
        },
      },
    },
  });

  revalidatePath("/dashboard");
  return workspace;
}

export async function getUserWorkspaces() {
  const user = await requireDbUser();

  return prisma.workspace.findMany({
    where: {
      OR: [
        { ownerId: user.id },
        {
          members: {
            some: { userId: user.id },
          },
        },
      ],
    },
    include: {
      _count: {
        select: { pages: true },
      },
    },
    orderBy: { updatedAt: "desc" },
  });
}

export async function getWorkspace(workspaceId: string) {
  const user = await requireDbUser();
  const canView = await canViewWorkspace(user.id, workspaceId);
  if (!canView) throw new Error("Forbidden");

  return prisma.workspace.findUnique({
    where: { id: workspaceId },
    include: {
      members: {
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
      },
      tags: {
        orderBy: { name: "asc" },
      },
    },
  });
}

export async function inviteWorkspaceMember(
  workspaceId: string,
  email: string,
  role: "EDITOR" | "VIEWER",
) {
  const user = await requireDbUser();
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    include: {
      members: {
        where: { userId: user.id },
      },
    },
  });

  if (!workspace) throw new Error("Workspace not found");

  const membership = workspace.members[0];
  const isOwner =
    workspace.ownerId === user.id ||
    roleCanManageWorkspace(membership?.role ?? "VIEWER");

  if (!isOwner) throw new Error("Only owners can invite members");

  const invitedUser = await prisma.user.findUnique({
    where: { email: email.trim().toLowerCase() },
  });

  if (!invitedUser) {
    throw new Error("User must sign up before they can be invited");
  }

  await prisma.workspaceMember.upsert({
    where: {
      workspaceId_userId: {
        workspaceId,
        userId: invitedUser.id,
      },
    },
    update: { role },
    create: {
      workspaceId,
      userId: invitedUser.id,
      role,
    },
  });

  revalidatePath(`/workspace/${workspaceId}`);
}

export async function deleteWorkspace(workspaceId: string) {
  const user = await requireDbUser();
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
  });

  if (!workspace || workspace.ownerId !== user.id) {
    throw new Error("Only the owner can delete this workspace");
  }

  await prisma.workspace.delete({ where: { id: workspaceId } });
  revalidatePath("/dashboard");
}
