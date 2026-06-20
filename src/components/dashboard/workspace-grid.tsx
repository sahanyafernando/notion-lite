"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { FileText, Plus, Trash2 } from "lucide-react";
import { createWorkspace, deleteWorkspace } from "@/server/actions/workspaces";
import { TopNavbar } from "@/components/layout/top-navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Workspace = {
  id: string;
  name: string;
  _count: { pages: number };
  canDelete: boolean;
};

type DashboardClientProps = {
  workspaces: Workspace[];
};

export function DashboardClient({ workspaces }: DashboardClientProps) {
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleCreate = () => {
    setError(null);
    startTransition(async () => {
      try {
        const workspace = await createWorkspace(name);
        window.location.href = `/workspace/${workspace.id}`;
      } catch (createError) {
        setError(
          createError instanceof Error
            ? createError.message
            : "Failed to create workspace",
        );
      }
    });
  };

  const handleDelete = (workspaceId: string) => {
    if (!confirm("Delete this workspace and all pages?")) return;

    setError(null);
    startTransition(async () => {
      try {
        await deleteWorkspace(workspaceId);
        window.location.reload();
      } catch (deleteError) {
        setError(
          deleteError instanceof Error
            ? deleteError.message
            : "Failed to delete workspace",
        );
      }
    });
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <TopNavbar title="NotionLite Dashboard" />

      <main className="mx-auto max-w-5xl px-6 py-10">
        <div className="mb-8">
          <h2 className="text-2xl font-bold">Your workspaces</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Create a workspace to organize nested pages, tags, and AI summaries.
          </p>
        </div>

        <div className="mb-10 flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-4 sm:flex-row dark:border-zinc-800 dark:bg-zinc-900">
          <Input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Workspace name"
            onKeyDown={(event) => {
              if (event.key === "Enter") handleCreate();
            }}
          />
          <Button onClick={handleCreate} disabled={isPending || !name.trim()}>
            <Plus className="h-4 w-4" />
            Create workspace
          </Button>
        </div>
        {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

        <div className="grid gap-4 sm:grid-cols-2">
          {workspaces.map((workspace) => (
            <article
              key={workspace.id}
              className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-lg font-semibold">{workspace.name}</h3>
                  <p className="mt-1 text-sm text-zinc-500">
                    {workspace._count.pages} page
                    {workspace._count.pages === 1 ? "" : "s"}
                  </p>
                </div>
                {workspace.canDelete && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDelete(workspace.id)}
                    disabled={isPending}
                    aria-label="Delete workspace"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>

              <Button asChild className="mt-4 w-full" variant="secondary">
                <Link href={`/workspace/${workspace.id}`}>
                  <FileText className="h-4 w-4" />
                  Open workspace
                </Link>
              </Button>
            </article>
          ))}
        </div>

        {workspaces.length === 0 && (
          <p className="text-sm text-zinc-500">
            No workspaces yet. Create your first one above.
          </p>
        )}
      </main>
    </div>
  );
}
