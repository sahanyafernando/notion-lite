import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentDbUser } from "@/lib/auth";
import { canEditWorkspace, canViewWorkspace, getWorkspaceAccess } from "@/lib/permissions";
import { getWorkspacePages } from "@/server/actions/pages";
import { getWorkspace } from "@/server/actions/workspaces";
import { Sidebar } from "@/components/layout/sidebar";
import { TopNavbar } from "@/components/layout/top-navbar";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";

export default async function WorkspacePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentDbUser();
  if (!user) redirect("/sign-in");

  const canView = await canViewWorkspace(user.id, id);
  if (!canView) notFound();

  const [workspace, pages] = await Promise.all([
    getWorkspace(id),
    getWorkspacePages(id),
  ]);

  if (!workspace) notFound();

  const firstPage = await prisma.page.findFirst({
    where: { workspaceId: id },
    orderBy: { createdAt: "asc" },
  });

  if (firstPage) {
    redirect(`/page/${firstPage.id}`);
  }

  const canEdit = await canEditWorkspace(user.id, id);
  const access = await getWorkspaceAccess(user.id, id);
  const canManage = access === "owner";

  return (
    <div className="flex h-screen flex-col">
      <TopNavbar title={workspace.name} workspaceId={id} backHref="/dashboard" />
      <div className="flex min-h-0 flex-1">
        <Sidebar
          workspaceId={id}
          workspaceName={workspace.name}
          pages={pages}
          canEdit={canEdit}
          canManage={canManage}
        />
        <main className="flex flex-1 items-center justify-center bg-white dark:bg-zinc-950">
          <div className="text-center">
            <h2 className="text-xl font-semibold">This workspace is empty</h2>
            <p className="mt-2 text-sm text-zinc-500">
              Create your first page from the sidebar.
            </p>
            {canEdit && (
              <Button asChild className="mt-4">
                <Link href={`/workspace/${id}`}>Refresh</Link>
              </Button>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
