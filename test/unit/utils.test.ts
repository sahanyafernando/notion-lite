import { describe, expect, it } from "vitest";
import { cn, extractTextFromTipTapContent } from "@/lib/utils";

describe("utils", () => {
  it("returns an empty string when content is missing", () => {
    expect(extractTextFromTipTapContent(null)).toBe("");
    expect(extractTextFromTipTapContent(undefined)).toBe("");
    expect(extractTextFromTipTapContent("string")).toBe("");
  });

  it("extracts nested text nodes and respects max length", () => {
    const content = {
      content: [
        { text: "hello" },
        { content: [{ text: "world" }, { text: "from" }] },
      ],
    };

    expect(extractTextFromTipTapContent(content)).toBe("hello world from");
    expect(extractTextFromTipTapContent(content, 5)).toBe("hello");
  });

  it("merges class names using Tailwind merge rules", () => {
    expect(cn("foo", "bar", "foo")).toBe("foo bar foo");
    expect(cn("text-sm", "text-sm", "font-bold")).toContain("text-sm");
    expect(cn("text-sm", "text-sm", "font-bold")).toContain("font-bold");
  });
});
