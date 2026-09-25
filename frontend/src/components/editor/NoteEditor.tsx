import { useState, useEffect, useRef } from "react";
import {
  useEditor,
  EditorContent,
  ReactNodeViewRenderer,
  type Content,
} from "@tiptap/react";
import { StarterKit } from "@tiptap/starter-kit";
import { Underline } from "@tiptap/extension-underline";
import { Link } from "@tiptap/extension-link";
import { Image } from "@tiptap/extension-image";
import { Placeholder } from "@tiptap/extension-placeholder";
import { CodeBlockLowlight } from "@tiptap/extension-code-block-lowlight";
import { common, createLowlight } from "lowlight";
import { Folder, Lock } from "lucide-react";
import type { Note } from "@/types/note";
import { EditorBubbleMenu } from "./EditorBubbleMenu";
import { CodeBlockNodeView } from "./CodeBlockNodeView";

const lowlight = createLowlight(common);

const CustomCodeBlock = CodeBlockLowlight.extend({
  addNodeView() {
    return ReactNodeViewRenderer(CodeBlockNodeView);
  },
}).configure({
  lowlight,
});

interface NoteEditorProps {
  note: Note;
  topicName?: string;
  onSave?: (updated: {
    id: string;
    title: string;
    excerpt: string;
    content?: string;
  }) => void;
  onSavingStatusChange?: (isSaving: boolean) => void;
}

export function NoteEditor({
  note,
  topicName,
  onSave,
  onSavingStatusChange,
}: NoteEditorProps) {
  const [title, setTitle] = useState(note.title);
  const saveTimeoutRef = useRef<number | undefined>(undefined);
  const currentTitleRef = useRef(note.title);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false,
        link: false,
        underline: false,
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        autolink: true,
      }),
      Image,
      Placeholder.configure({
        placeholder: "Gõ '/' để thực hiện lệnh hoặc bắt đầu viết...",
      }),
      CustomCodeBlock,
    ],
    content: ((): Content => {
      if (!note.content) {
        return note.excerpt ? `<p>${note.excerpt}</p>` : "";
      }
      if (typeof note.content === "object") {
        return note.content;
      }
      try {
        const parsed: unknown = JSON.parse(note.content);
        if (typeof parsed === "string") return parsed;
        if (typeof parsed === "object" && parsed !== null) {
          return parsed;
        }
        return note.content;
      } catch {
        return note.content;
      }
    })(),
    editorProps: {
      attributes: {
        class:
          "prose prose-neutral dark:prose-invert max-w-none focus:outline-none min-h-[400px] text-foreground text-sm sm:text-base leading-relaxed tracking-normal",
      },
    },
    onUpdate: ({ editor: currentEditor }) => {
      onSavingStatusChange?.(true);
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => {
        onSavingStatusChange?.(false);
        if (onSave) {
          onSave({
            id: note.id,
            title: currentTitleRef.current,
            excerpt: currentEditor.getText().slice(0, 160) || note.excerpt,
            content: JSON.stringify(currentEditor.getJSON()),
          });
        }
      }, 800);
    },
  });

  useEffect(() => {
    return () => {
      clearTimeout(saveTimeoutRef.current);
    };
  }, []);

  const handleTitleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    currentTitleRef.current = newTitle;
    onSavingStatusChange?.(true);
    clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      onSavingStatusChange?.(false);
      if (onSave) {
        onSave({
          id: note.id,
          title: newTitle,
          excerpt: editor.getText().slice(0, 160) || note.excerpt,
          content: JSON.stringify(editor.getJSON()),
        });
      }
    }, 800);
  };

  return (
    <div className="mx-auto min-h-[calc(100vh-5rem)] w-full max-w-3xl px-6 py-6 sm:px-12 sm:py-10 xl:max-w-4xl">
      {/* Document Meta Tag / Topic Header */}
      <div className="text-muted-foreground mb-4 flex items-center gap-2 text-xs select-none">
        {topicName && (
          <span className="bg-muted/60 text-foreground/80 inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 font-medium">
            <Folder className="size-3 opacity-70" />
            <span>{topicName}</span>
          </span>
        )}

        {note.isLocked && (
          <span className="bg-muted/60 text-muted-foreground inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 font-medium">
            <Lock className="size-3 opacity-70" />
            <span>Đã khóa PIN</span>
          </span>
        )}

        {note.tags.length > 0 && (
          <div className="flex items-center gap-1">
            {note.tags.map((tag) => (
              <span
                key={tag}
                className="bg-muted/40 text-muted-foreground rounded-md px-2 py-0.5 text-[11px]"
              >
                {tag.startsWith("#") ? tag : `#${tag}`}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Large Borderless Document Title */}
      <textarea
        rows={1}
        value={title}
        onChange={handleTitleChange}
        placeholder="Chưa có tiêu đề"
        className="text-foreground placeholder:text-muted-foreground/30 mb-6 w-full resize-none border-none bg-transparent p-0 text-3xl leading-tight font-bold tracking-tight focus:ring-0 focus:outline-none sm:text-4xl"
        onInput={(e) => {
          const target = e.currentTarget;
          target.style.height = "auto";
          target.style.height = `${String(target.scrollHeight)}px`;
        }}
      />

      {/* Tiptap Editor Surface with Floating Menu */}
      <div className="relative">
        <EditorBubbleMenu editor={editor} />
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
