"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, ChevronRight, FileText, Plus } from "lucide-react";
import { useState, useTransition } from "react";
import type { PageTreeNode } from "@/server/actions/pages";
import { createPage } from "@/server/actions/pages";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type PageListProps = {
  workspaceId: string;
  pages: PageTreeNode[];
  canEdit: boolean;
};

export function PageList({ workspaceId, pages, canEdit }: PageListProps) {
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const handleCreate = (parentId?: string) => {
    startTransition(async () => {
      const page = await createPage(workspaceId, parentId);
      window.location.href = `/page/${page.id}`;
    });
  };

  return (
    <div className="space-y-1">
      <div className="mb-2 flex items-center justify-between px-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
          Pages
        </span>
        {canEdit && (
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7"
            disabled={isPending}
            onClick={() => handleCreate()}
            aria-label="New page"
          >
            <Plus className="h-4 w-4" />
          </Button>
        )}
      </div>

      {pages.length === 0 ? (
        <p className="px-2 text-sm text-zinc-500">No pages yet.</p>
      ) : (
        pages.map((page) => (
          <PageTreeItem
            key={page.id}
            node={page}
            depth={0}
            pathname={pathname}
            canEdit={canEdit}
            onCreateChild={handleCreate}
            isPending={isPending}
          />
        ))
      )}
    </div>
  );
}

function PageTreeItem({
  node,
  depth,
  pathname,
  canEdit,
  onCreateChild,
  isPending,
}: {
  node: PageTreeNode;
  depth: number;
  pathname: string;
  canEdit: boolean;
  onCreateChild: (parentId: string) => void;
  isPending: boolean;
}) {
  const [expanded, setExpanded] = useState(true);
  const isActive = pathname === `/page/${node.id}`;
  const hasChildren = node.children.length > 0;

  return (
    <div>
      <div
        className="group flex items-center gap-1 rounded-md pr-1 hover:bg-zinc-100 dark:hover:bg-zinc-800"
        style={{ paddingLeft: `${depth * 12 + 4}px` }}
      >
        <button
          type="button"
          className="flex h-6 w-6 items-center justify-center text-zinc-400"
          onClick={() => setExpanded((value) => !value)}
          aria-label={expanded ? "Collapse" : "Expand"}
        >
          {hasChildren ? (
            expanded ? (
              <ChevronDown className="h-3.5 w-3.5" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5" />
            )
          ) : (
            <span className="h-3.5 w-3.5" />
          )}
        </button>

        <Link
          href={`/page/${node.id}`}
          className={cn(
            "flex min-w-0 flex-1 items-center gap-2 rounded-md px-2 py-1.5 text-sm",
            isActive && "bg-zinc-200 font-medium dark:bg-zinc-700",
          )}
        >
          <FileText className="h-4 w-4 shrink-0 text-zinc-500" />
          <span className="truncate">{node.title}</span>
        </Link>

        {canEdit && (
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 opacity-0 group-hover:opacity-100"
            disabled={isPending}
            onClick={() => onCreateChild(node.id)}
            aria-label="Add subpage"
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>

      {expanded &&
        node.children.map((child) => (
          <PageTreeItem
            key={child.id}
            node={child}
            depth={depth + 1}
            pathname={pathname}
            canEdit={canEdit}
            onCreateChild={onCreateChild}
            isPending={isPending}
          />
        ))}
    </div>
  );
}
