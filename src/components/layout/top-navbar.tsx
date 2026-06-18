"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { AuthControls } from "@/components/layout/auth-controls";
import { SearchBar } from "@/components/search/search-bar";

type TopNavbarProps = {
  title: string;
  workspaceId?: string;
  backHref?: string;
  actions?: React.ReactNode;
};

export function TopNavbar({
  title,
  workspaceId,
  backHref,
  actions,
}: TopNavbarProps) {
  return (
    <header className="flex h-14 items-center gap-4 border-b border-zinc-200 bg-white px-4 dark:border-zinc-800 dark:bg-zinc-950">
      {backHref && (
        <Link
          href={backHref}
          className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800"
          aria-label="Go back"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
      )}

      <div className="min-w-0 flex-1">
        <h1 className="truncate text-sm font-semibold">{title}</h1>
      </div>

      {workspaceId && (
        <div className="hidden w-72 md:block">
          <SearchBar workspaceId={workspaceId} />
        </div>
      )}

      <div className="flex items-center gap-2">{actions}</div>
      <AuthControls />
    </header>
  );
}
