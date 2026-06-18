import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { AuthControls } from "@/components/layout/auth-controls";
import { Button } from "@/components/ui/button";

export default async function HomePage() {
  const { userId } = await auth();

  if (userId) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-zinc-50 to-white dark:from-zinc-950 dark:to-zinc-900">
      <header className="flex items-center justify-between border-b border-zinc-200/80 px-6 py-4 dark:border-zinc-800">
        <Link
          href="/"
          className="text-sm font-semibold uppercase tracking-widest text-violet-600"
        >
          NotionLite
        </Link>
        <AuthControls />
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-6 pb-16">
        <div className="max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-violet-600">
            Notes app
          </p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
            A mini Notion clone 
          </h1>
          <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-300">
            Workspaces, nested pages, rich text editing, tags, search, sharing,
            RBAC, and AI study-note summaries.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/sign-up">Get started free</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/sign-in">Sign in</Link>
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
