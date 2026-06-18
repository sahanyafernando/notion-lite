import { notFound, redirect } from "next/navigation";
import { getCurrentDbUser } from "@/lib/auth";
import { canEditPage, canViewPage, getWorkspaceAccess } from "@/lib/permissions";
import { getPage, getWorkspacePages } from "@/server/actions/pages";
import { PageView } from "@/components/pages/page-view";

export default async function PageDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentDbUser();
  if (!user) redirect("/sign-in");

  const canView = await canViewPage(user.id, id);
  if (!canView) notFound();

  const [page, pages] = await Promise.all([getPage(id), getWorkspacePages(id)]);

  if (!page) notFound();

  const canEdit = await canEditPage(user.id, id);
  const access = await getWorkspaceAccess(user.id, page.workspaceId);
  const canManage = access === "owner";

  return (
    <PageView
      page={page}
      pages={pages}
      canEdit={canEdit}
      canManage={canManage}
    />
  );
}
