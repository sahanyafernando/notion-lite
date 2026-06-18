import Link from "next/link";
import { PageList } from "@/components/pages/page-list";
import { SearchBar } from "@/components/search/search-bar";
import { WorkspaceInviteModal } from "@/components/share/workspace-invite-modal";
import type { PageTreeNode } from "@/server/actions/pages";

type SidebarProps = {
  workspaceId: string;
  workspaceName: string;
  pages: PageTreeNode[];
  canEdit: boolean;
  canManage?: boolean;
};

export function Sidebar({
  workspaceId,
  workspaceName,
  pages,
  canEdit,
  canManage = false,
}: SidebarProps) {
  return (
    <aside className="flex h-full w-72 flex-col border-r border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="border-b border-zinc-200 p-4 dark:border-zinc-800">
        <Link
          href="/dashboard"
          className="text-xs font-medium uppercase tracking-wide text-zinc-500 hover:text-zinc-800"
        >
          Workspaces
        </Link>
        <h2 className="mt-1 truncate text-lg font-semibold">{workspaceName}</h2>
        <div className="mt-3 md:hidden">
          <SearchBar workspaceId={workspaceId} />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        <PageList workspaceId={workspaceId} pages={pages} canEdit={canEdit} />
      </div>

      <div className="border-t border-zinc-200 p-3 dark:border-zinc-800">
        <WorkspaceInviteModal workspaceId={workspaceId} canManage={canManage} />
      </div>
    </aside>
  );
}
