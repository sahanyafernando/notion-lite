import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function extractTextFromTipTapContent(
  content: unknown,
  maxLength = 5000,
): string {
  if (!content || typeof content !== "object") return "";

  const parts: string[] = [];

  function walk(node: unknown) {
    if (!node || typeof node !== "object") return;

    const record = node as Record<string, unknown>;
    if (typeof record.text === "string") {
      parts.push(record.text);
    }

    if (Array.isArray(record.content)) {
      for (const child of record.content) {
        walk(child);
      }
    }
  }

  walk(content);
  return parts.join(" ").slice(0, maxLength);
}
