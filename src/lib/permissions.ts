import type { Role, ShareRole } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export type AccessLevel = "owner" | "editor" | "viewer" | null;

export async function getWorkspaceAccess(
  userId: string,
  workspaceId: string,
): Promise<AccessLevel> {
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    include: {
      members: {
        where: { userId },
      },
    },
  });

  if (!workspace) return null;
  if (workspace.ownerId === userId) return "owner";

  const membership = workspace.members[0];
  if (!membership) return null;

  if (membership.role === "OWNER") return "owner";
  if (membership.role === "EDITOR") return "editor";
  return "viewer";
}

export async function canEditWorkspace(
  userId: string,
  workspaceId: string,
): Promise<boolean> {
  const access = await getWorkspaceAccess(userId, workspaceId);
  return access === "owner" || access === "editor";
}

export async function canViewWorkspace(
  userId: string,
  workspaceId: string,
): Promise<boolean> {
  return (await getWorkspaceAccess(userId, workspaceId)) !== null;
}

export async function getPageAccess(
  userId: string,
  pageId: string,
): Promise<AccessLevel> {
  const page = await prisma.page.findUnique({
    where: { id: pageId },
    include: {
      sharePermissions: {
        where: { userId },
      },
    },
  });

  if (!page) return null;

  const workspaceAccess = await getWorkspaceAccess(userId, page.workspaceId);
  if (workspaceAccess === "owner" || workspaceAccess === "editor") {
    return workspaceAccess;
  }
  if (workspaceAccess === "viewer") return "viewer";

  const share = page.sharePermissions[0];
  if (!share) return null;
  return share.role === "EDIT" ? "editor" : "viewer";
}

export async function canEditPage(
  userId: string,
  pageId: string,
): Promise<boolean> {
  const access = await getPageAccess(userId, pageId);
  return access === "owner" || access === "editor";
}

export async function canViewPage(
  userId: string,
  pageId: string,
): Promise<boolean> {
  return (await getPageAccess(userId, pageId)) !== null;
}

export function roleCanManageWorkspace(role: Role | AccessLevel): boolean {
  return role === "OWNER" || role === "owner";
}

export function shareRoleLabel(role: ShareRole): string {
  return role === "EDIT" ? "Can edit" : "Can view";
}
