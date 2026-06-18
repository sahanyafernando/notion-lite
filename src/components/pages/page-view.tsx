"use client";

import { useState, useTransition } from "react";
import { Sparkles, X } from "lucide-react";
import { addTagToPage, removeTagFromPage } from "@/server/actions/share";
import { updatePage } from "@/server/actions/pages";
import { PageEditor } from "@/components/editor/page-editor";
import { ShareModal } from "@/components/share/share-modal";
import { TopNavbar } from "@/components/layout/top-navbar";
import { Sidebar } from "@/components/layout/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { PageTreeNode } from "@/server/actions/pages";

type PageViewProps = {
  page: {
    id: string;
    title: string;
    content: unknown;
    summary: string | null;
    workspaceId: string;
    workspace: { id: string; name: string };
    tags: Array<{ tag: { id: string; name: string } }>;
    sharePermissions: Array<{
      id: string;
      role: "VIEW" | "EDIT";
      user: { id: string; name: string | null; email: string };
    }>;
  };
  pages: PageTreeNode[];
  canEdit: boolean;
  canManage: boolean;
};

export function PageView({ page, pages, canEdit, canManage }: PageViewProps) {
  const [title, setTitle] = useState(page.title);
  const [summary, setSummary] = useState(page.summary);
  const [tagInput, setTagInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleTitleBlur = () => {
    const trimmed = title.trim() || "Untitled";
    if (trimmed === page.title) return;

    startTransition(async () => {
      await updatePage(page.id, { title: trimmed });
    });
  };

  const handleSaveContent = async (content: unknown) => {
    await updatePage(page.id, { content: content as object });
  };

  const handleAddTag = () => {
    if (!tagInput.trim()) return;
    startTransition(async () => {
      await addTagToPage(page.id, tagInput);
      setTagInput("");
    });
  };

  const handleSummarize = () => {
    setError(null);
    startTransition(async () => {
      try {
        const response = await fetch(`/api/pages/${page.id}/summarize`, {
          method: "POST",
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error ?? "Failed to summarize");
        }
        setSummary(data.summary);
      } catch (summarizeError) {
        setError(
          summarizeError instanceof Error
            ? summarizeError.message
            : "Failed to summarize",
        );
      }
    });
  };

  return (
    <div className="flex h-screen flex-col">
      <TopNavbar
        title={page.workspace.name}
        workspaceId={page.workspaceId}
        backHref="/dashboard"
        actions={
          <>
            <ShareModal
              pageId={page.id}
              shares={page.sharePermissions}
              canManage={canEdit}
            />
            <Button
              variant="secondary"
              size="sm"
              onClick={handleSummarize}
              disabled={isPending}
            >
              <Sparkles className="h-4 w-4" />
              Summarize
            </Button>
          </>
        }
      />

      <div className="flex min-h-0 flex-1">
        <Sidebar
          workspaceId={page.workspaceId}
          workspaceName={page.workspace.name}
          pages={pages}
          canEdit={canEdit}
          canManage={canManage}
        />

        <main className="flex-1 overflow-y-auto bg-white p-6 dark:bg-zinc-950">
          <div className="mx-auto max-w-4xl space-y-6">
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              onBlur={handleTitleBlur}
              readOnly={!canEdit}
              className="w-full border-none bg-transparent text-4xl font-bold outline-none placeholder:text-zinc-300"
              placeholder="Untitled"
            />

            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                {page.tags.map(({ tag }) => (
                  <span
                    key={tag.id}
                    className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
                  >
                    #{tag.name}
                    {canEdit && (
                      <button
                        type="button"
                        onClick={() =>
                          startTransition(async () => {
                            await removeTagFromPage(page.id, tag.id);
                          })
                        }
                        className="rounded-full p-0.5 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                        aria-label={`Remove tag ${tag.name}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </span>
                ))}

                {canEdit && (
                  <div className="flex items-center gap-2">
                    <Input
                      value={tagInput}
                      onChange={(event) => setTagInput(event.target.value)}
                      placeholder="Add tag"
                      className="h-8 w-36"
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          handleAddTag();
                        }
                      }}
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleAddTag}
                      disabled={isPending || !tagInput.trim()}
                    >
                      Add
                    </Button>
                  </div>
                )}
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}

              {summary && (
                <section className="rounded-lg border border-violet-200 bg-violet-50 p-4 dark:border-violet-900 dark:bg-violet-950/40">
                  <h2 className="mb-2 text-sm font-semibold text-violet-700 dark:text-violet-300">
                    AI Study Summary
                  </h2>
                  <p className="whitespace-pre-wrap text-sm leading-6 text-zinc-700 dark:text-zinc-200">
                    {summary}
                  </p>
                </section>
              )}
            </div>

            <PageEditor
              pageId={page.id}
              initialContent={page.content}
              readOnly={!canEdit}
              onSave={handleSaveContent}
            />
          </div>
        </main>
      </div>
    </div>
  );
}
