"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { common, createLowlight } from "lowlight";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Bold,
  Code,
  Heading1,
  Heading2,
  Italic,
  List,
  ListOrdered,
  Quote,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const lowlight = createLowlight(common);

type PageEditorProps = {
  pageId: string;
  initialContent: unknown;
  readOnly?: boolean;
  onSave: (content: unknown) => Promise<void>;
};

export function PageEditor({
  pageId,
  initialContent,
  readOnly = false,
  onSave,
}: PageEditorProps) {
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">(
    "idle",
  );
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestContentRef = useRef<unknown>(initialContent);

  const persist = useCallback(
    async (content: unknown) => {
      setSaveState("saving");
      try {
        await onSave(content);
        setSaveState("saved");
      } catch {
        setSaveState("idle");
      }
    },
    [onSave],
  );

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false,
      }),
      CodeBlockLowlight.configure({ lowlight }),
      Placeholder.configure({
        placeholder: "Start writing...",
      }),
    ],
    content: initialContent as object,
    editable: !readOnly,
    immediatelyRender: false,
    onUpdate: ({ editor: currentEditor }) => {
      if (readOnly) return;
      const json = currentEditor.getJSON();
      latestContentRef.current = json;
      setSaveState("idle");

      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      saveTimeoutRef.current = setTimeout(() => {
        void persist(json);
      }, 1000);
    },
  });

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!editor) return;
    editor.setEditable(!readOnly);
  }, [editor, readOnly]);

  if (!editor) {
    return (
      <div className="rounded-lg border border-dashed border-zinc-200 p-8 text-sm text-zinc-500">
        Loading editor...
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {!readOnly && (
        <div className="flex flex-wrap items-center gap-1 rounded-lg border border-zinc-200 bg-zinc-50 p-2 dark:border-zinc-700 dark:bg-zinc-900">
          <ToolbarButton
            active={editor.isActive("heading", { level: 1 })}
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 1 }).run()
            }
            label="Heading 1"
          >
            <Heading1 className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            active={editor.isActive("heading", { level: 2 })}
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 2 }).run()
            }
            label="Heading 2"
          >
            <Heading2 className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            active={editor.isActive("bold")}
            onClick={() => editor.chain().focus().toggleBold().run()}
            label="Bold"
          >
            <Bold className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            active={editor.isActive("italic")}
            onClick={() => editor.chain().focus().toggleItalic().run()}
            label="Italic"
          >
            <Italic className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            active={editor.isActive("bulletList")}
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            label="Bullet list"
          >
            <List className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            active={editor.isActive("orderedList")}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            label="Numbered list"
          >
            <ListOrdered className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            active={editor.isActive("blockquote")}
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            label="Quote"
          >
            <Quote className="h-4 w-4" />
          </ToolbarButton>
          <ToolbarButton
            active={editor.isActive("codeBlock")}
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            label="Code block"
          >
            <Code className="h-4 w-4" />
          </ToolbarButton>
          <span className="ml-auto text-xs text-zinc-500">
            {saveState === "saving" && "Saving..."}
            {saveState === "saved" && "Saved"}
            {saveState === "idle" && "Auto-save on"}
          </span>
        </div>
      )}

      <EditorContent
        key={pageId}
        editor={editor}
        className="prose prose-zinc max-w-none min-h-[420px] rounded-lg border border-zinc-200 bg-white p-6 dark:prose-invert dark:border-zinc-700 dark:bg-zinc-950 [&_.ProseMirror]:min-h-[380px] [&_.ProseMirror]:outline-none"
      />
    </div>
  );
}

function ToolbarButton({
  active,
  onClick,
  label,
  children,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <Button
      type="button"
      size="icon"
      variant={active ? "secondary" : "ghost"}
      onClick={onClick}
      aria-label={label}
      className={cn("h-8 w-8")}
    >
      {children}
    </Button>
  );
}
