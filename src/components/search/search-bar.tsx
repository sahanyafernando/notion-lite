"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { Search } from "lucide-react";
import { searchPages } from "@/server/actions/pages";
import { Input } from "@/components/ui/input";

type SearchBarProps = {
  workspaceId: string;
};

export function SearchBar({ workspaceId }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<
    Array<{ id: string; title: string; updatedAt: Date }>
  >([]);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!query.trim()) {
      startTransition(() => {
        setResults([]);
      });
      return;
    }

    const timeout = setTimeout(() => {
      startTransition(async () => {
        const pages = await searchPages(workspaceId, query);
        setResults(pages);
      });
    }, 300);

    return () => clearTimeout(timeout);
  }, [query, workspaceId, startTransition]);

  return (
    <div className="relative">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
      <Input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search pages and tags..."
        className="pl-9"
      />

      {query.trim() && (
        <div className="absolute left-0 right-0 top-full z-20 mt-2 overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
          {isPending ? (
            <p className="px-4 py-3 text-sm text-zinc-500">Searching...</p>
          ) : results.length === 0 ? (
            <p className="px-4 py-3 text-sm text-zinc-500">No results found.</p>
          ) : (
            <ul>
              {results.map((page) => (
                <li key={page.id}>
                  <Link
                    href={`/page/${page.id}`}
                    className="block px-4 py-2 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800"
                    onClick={() => setQuery("")}
                  >
                    {page.title}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
