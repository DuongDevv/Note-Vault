import { useState, useEffect, useRef, useMemo } from "react";
import {
  useEditor,
  EditorContent,
  ReactNodeViewRenderer,
  type Content,
  type Editor,
} from "@tiptap/react";
import { StarterKit } from "@tiptap/starter-kit";
import { Underline } from "@tiptap/extension-underline";
import { Link } from "@tiptap/extension-link";
import { Placeholder } from "@tiptap/extension-placeholder";
import { CodeBlockLowlight } from "@tiptap/extension-code-block-lowlight";
import { common, createLowlight } from "lowlight";
import { Lock, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Note } from "@/types/note";
import { useWorkspaceStore } from "@/stores/useWorkspaceStore";
import { useUIStore } from "@/stores/useUIStore";
import { normalizeTag } from "@/utils/tag";
import { TagInputPopover } from "./TagInputPopover";
import { EditorBubbleMenu } from "./EditorBubbleMenu";
import { EditorDragHandle } from "./EditorDragHandle";
import { CodeBlockNodeView } from "./CodeBlockNodeView";
import { ApiKeyBlock } from "./extensions/ApiKeyBlock";
import { SecretBlock } from "./extensions/SecretBlock";
import { SlashCommand } from "./extensions/SlashCommand";
import { CustomImage } from "./extensions/CustomImage";
import { InsertImageDialog } from "./InsertImageDialog";
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
    tags?: string[];
  }) => void;
  onSavingStatusChange?: (isSaving: boolean) => void;
}

export function NoteEditor({
  note,
  onSave,
  onSavingStatusChange,
}: NoteEditorProps) {
  const [title, setTitle] = useState(note.title);
  const [isImageDialogOpen, setIsImageDialogOpen] = useState<boolean>(false);
  const saveTimeoutRef = useRef<number | undefined>(undefined);
  const currentTitleRef = useRef(note.title);
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const setSearchOpen = useUIStore((s) => s.setSearchOpen);
  const allNotes = useWorkspaceStore((s) => s.notes);

  // Aggregate all unique tags across workspace for suggestions
  const allWorkspaceTags = useMemo(() => {
    const tagSet = new Set<string>();
    for (const n of allNotes) {
      if (Array.isArray(n.tags)) {
        for (const t of n.tags) {
          const clean = normalizeTag(t);
          if (clean) tagSet.add(clean);
        }
      }
    }
    return Array.from(tagSet).toSorted();
  }, [allNotes]);

  const handleAddTag = (newTag: string) => {
    const clean = normalizeTag(newTag);
    if (!clean || note.tags.includes(clean) || note.tags.length >= 8) return;
    const updatedTags = [...note.tags, clean];
    if (onSave) {
      onSave({
        id: note.id,
        title: currentTitleRef.current,
        excerpt: note.excerpt,
        content: JSON.stringify(editor.getJSON()),
        tags: updatedTags,
      });
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    const updatedTags = note.tags.filter((t) => t !== tagToRemove);
    if (onSave) {
      onSave({
        id: note.id,
        title: currentTitleRef.current,
        excerpt: note.excerpt,
        content: JSON.stringify(editor.getJSON()),
        tags: updatedTags,
      });
    }
  };
  const handleTagClick = (tag: string) => {
    setSearchOpen(true, `#${tag}`);
  };
  const scheduleAutoSave = (
    targetTitle: string,
    targetEditor: Editor | null,
  ) => {
    if (!targetEditor || !onSave) return;
    onSavingStatusChange?.(true);
    clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      onSavingStatusChange?.(false);
      onSave({
        id: note.id,
        title: targetTitle,
        excerpt: targetEditor.getText().slice(0, 160) || note.excerpt,
        content: JSON.stringify(targetEditor.getJSON()),
      });
    }, 800);
  };
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false,
        link: false,
        underline: false,
        dropcursor: false,
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        autolink: true,
      }),
      CustomImage.configure({
        allowBase64: true,
      }),
      Placeholder.configure({
        placeholder: "Gõ '/' để thực hiện lệnh hoặc bắt đầu viết...",
      }),
      CustomCodeBlock,
      ApiKeyBlock,
      SecretBlock,
      SlashCommand,
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
      handlePaste: (view, event) => {
        const items = event.clipboardData?.items;
        if (!items) return false;

        for (const item of items) {
          if (item.type.startsWith("image/")) {
            const file = item.getAsFile();
            if (file) {
              const reader = new FileReader();
              reader.addEventListener("load", () => {
                const content = reader.result;
                if (typeof content === "string") {
                  const node = view.state.schema.nodes.image.create({
                    src: content,
                    alt: file.name,
                  });
                  const transaction = view.state.tr.replaceSelectionWith(node);
                  view.dispatch(transaction);
                }
              });
              reader.readAsDataURL(file);
              return true;
            }
          }
        }
        return false;
      },
      handleDrop: (view, event) => {
        const files = event.dataTransfer?.files;
        if (!files || files.length === 0) return false;

        for (const file of files) {
          if (file.type.startsWith("image/")) {
            const coordinates = view.posAtCoords({
              left: event.clientX,
              top: event.clientY,
            });
            const reader = new FileReader();
            reader.addEventListener("load", () => {
              const content = reader.result;
              if (typeof content === "string") {
                const node = view.state.schema.nodes.image.create({
                  src: content,
                  alt: file.name,
                });
                const pos = coordinates?.pos ?? view.state.selection.from;
                const transaction = view.state.tr.insert(pos, node);
                view.dispatch(transaction);
              }
            });
            reader.readAsDataURL(file);
            return true;
          }
        }
        return false;
      },
    },
    onUpdate: ({ editor: currentEditor }) => {
      scheduleAutoSave(currentTitleRef.current, currentEditor);
    },
  });

  useEffect(() => {
    const handleOpenImageDialog = () => setIsImageDialogOpen(true);
    window.addEventListener(
      "notevault:open-image-dialog",
      handleOpenImageDialog,
    );
    return () => {
      window.removeEventListener(
        "notevault:open-image-dialog",
        handleOpenImageDialog,
      );
      clearTimeout(saveTimeoutRef.current);
    };
  }, []);

  const handleTitleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    currentTitleRef.current = newTitle;
    scheduleAutoSave(newTitle, editor);
  };

  return (
    <div className="mx-auto min-h-[calc(100vh-5rem)] w-full max-w-3xl px-6 pt-6 pb-40 sm:px-12 sm:pt-10 sm:pb-60 xl:max-w-4xl">
      <div className="text-muted-foreground mb-4 flex flex-wrap items-center justify-between gap-2 text-xs select-none">
        <div className="flex flex-wrap items-center gap-1.5">
          {note.isLocked && (
            <span className="bg-muted/60 text-muted-foreground inline-flex h-6 items-center gap-1.5 rounded-md px-2 text-xs font-medium">
              <Lock className="size-3.5 opacity-70" />
              <span>Đã khóa PIN</span>
            </span>
          )}

          {/* Tag Badges with Hover Remove and Click to Search */}
          {note.tags.map((tag) => (
            <span
              key={tag}
              className="group/tag bg-muted/40 hover:bg-muted/70 text-muted-foreground hover:text-foreground inline-flex h-6 items-center gap-1 rounded-md pr-1.5 pl-2 text-xs transition-colors"
            >
              <Button
                type="button"
                variant="ghost"
                size="xs"
                onClick={() => handleTagClick(tag)}
                className="hover:text-foreground h-auto cursor-pointer p-0 text-xs font-normal hover:bg-transparent hover:underline"
                title={`Tìm các trang có thẻ #${tag}`}
              >
                #{tag}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveTag(tag);
                }}
                className="text-muted-foreground/60 hover:text-foreground size-3.5 cursor-pointer rounded p-0 opacity-60 hover:opacity-100"
                title={`Gỡ thẻ #${tag}`}
                aria-label={`Gỡ thẻ #${tag}`}
              >
                <X className="size-3" />
              </Button>
            </span>
          ))}

          {/* Add Tag Popover Button */}
          <TagInputPopover
            currentTags={note.tags}
            allWorkspaceTags={allWorkspaceTags}
            onAddTag={handleAddTag}
            maxTags={8}
          />
        </div>
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

      {/* Tiptap Editor Surface with Floating Menu & Drag Handle */}
      <div ref={editorContainerRef} className="relative">
        <EditorDragHandle editor={editor} containerRef={editorContainerRef} />
        <EditorBubbleMenu editor={editor} />
        <EditorContent editor={editor} />
      </div>

      <InsertImageDialog
        editor={editor}
        open={isImageDialogOpen}
        onOpenChange={setIsImageDialogOpen}
      />
    </div>
  );
}
