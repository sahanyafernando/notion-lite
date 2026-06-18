import { describe, it, expect, beforeEach, vi } from "vitest";

// Mock auth to return a test user
vi.mock("@/lib/auth", () => ({
  requireDbUser: vi.fn(async () => ({ id: "user-1", email: "test@example.com" })),
}));

// Mock permissions to allow actions
vi.mock("@/lib/permissions", () => ({
  canEditWorkspace: vi.fn(async () => true),
  canViewWorkspace: vi.fn(async () => true),
  canEditPage: vi.fn(async () => true),
  canViewPage: vi.fn(async () => true),
}));

// Mock prisma methods used by actions (inline to avoid hoisting issues)
vi.mock("@/lib/prisma", () => {
  const mockPrisma = {
    workspace: {
      create: vi.fn(async (args: any) => ({ id: "ws-1", name: args.data.name })),
      findMany: vi.fn(async () => []),
      findUnique: vi.fn(async () => null),
      delete: vi.fn(async () => ({})),
    },
    page: {
      create: vi.fn(async (args: any) => ({ id: "page-1", title: args.data.title, workspaceId: args.data.workspaceId })),
      findMany: vi.fn(async () => []),
      findUnique: vi.fn(async (q: any) => ({ id: q.where.id, title: "Test", content: { type: "doc", content: [{ type: "paragraph", content: [{ text: "hello world" }] }] }, workspaceId: "ws-1" })),
      update: vi.fn(async (args: any) => ({ id: args.where.id, ...args.data })),
      delete: vi.fn(async () => ({})),
      findFirst: vi.fn(async () => ({ id: "parent-1" })),
    },
    user: {
      findUnique: vi.fn(async () => ({ id: "user-2", email: "invitee@example.com" })),
      upsert: vi.fn(async (args: any) => ({ id: "user-1", clerkId: "clerk-1", email: "test@example.com", name: "Test User" })),
    },
    tag: {
      upsert: vi.fn(async () => ({ id: "tag-1", name: "tag" })),
    },
    pageTag: {
      upsert: vi.fn(async () => ({})),
      delete: vi.fn(async () => ({})),
    },
    sharePermission: {
      upsert: vi.fn(async () => ({})),
      delete: vi.fn(async () => ({})),
    },
    workspaceMember: {
      upsert: vi.fn(async () => ({})),
    },
  };
  return { prisma: mockPrisma };
});

// Mock next/cache revalidatePath to avoid runtime invariant in tests
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

// Mock OpenAI as a constructible function so `new OpenAI()` works
vi.mock("openai", () => {
  function OpenAIMock() {
    return {
      chat: {
        completions: {
          create: async () => ({ choices: [{ message: { content: "Summary text" } }] }),
        },
      },
    };
  }
  return { default: OpenAIMock };
});

import * as workspaces from "@/server/actions/workspaces";
import * as pages from "@/server/actions/pages";
import * as share from "@/server/actions/share";
import { POST as summarizePOST } from "@/app/api/pages/[id]/summarize/route";
import { prisma as mockPrisma } from "@/lib/prisma";

describe("Feature smoke tests with mocks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.OPENAI_API_KEY = "test-key";
  });

  it("creates a workspace", async () => {
    const ws = await workspaces.createWorkspace("My Workspace");
    expect(ws).toHaveProperty("id");
    expect(mockPrisma.workspace.create).toHaveBeenCalled();
  });

  it("creates a page under a workspace", async () => {
    const page = await pages.createPage("ws-1", null);
    expect(page).toHaveProperty("id");
    expect(mockPrisma.page.create).toHaveBeenCalled();
  });

  it("adds a tag to a page", async () => {
    await share.addTagToPage("page-1", "TagName");
    expect(mockPrisma.tag.upsert).toHaveBeenCalled();
    expect(mockPrisma.pageTag.upsert).toHaveBeenCalled();
  });

  it("shares a page with a user", async () => {
    await share.sharePage("page-1", "invitee@example.com", "VIEW");
    expect(mockPrisma.sharePermission.upsert).toHaveBeenCalled();
  });

  it("generates an AI summary via API route", async () => {
    // Build a fake Request and params
    const req = new Request("http://localhost/api/pages/page-1/summarize", { method: "POST" });
    const res = await summarizePOST(req, { params: Promise.resolve({ id: "page-1" }) } as any);
    const json = await res.json();
    console.log('summarize route response:', json);
    expect(json).toHaveProperty("summary");
    expect(json.summary).toBe("Summary text");
    expect(mockPrisma.page.update).toHaveBeenCalled();
  });

  it("searches pages and returns empty on blank query", async () => {
    const results = await pages.searchPages("ws-1", "   ");
    expect(Array.isArray(results)).toBeTruthy();
    expect(results.length).toBe(0);
  });
});
