import { useState } from "react";
import { BubbleMenu } from "@tiptap/react/menus";
import { useEditorState, type Editor } from "@tiptap/react";
import { Globe, ExternalLink, Copy, Check, Pencil, Unlink, Link2, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EditorLinkBubbleMenuProps {
  editor: Editor | null;
}

function normalizeUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return "";
  if (/^(https?:\/\/|mailto:|tel:|#|\/)/i.test(trimmed)) {
    return trimmed;
  }
  return `https://${trimmed}`;
}

export function EditorLinkBubbleMenu({ editor }: EditorLinkBubbleMenuProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editUrl, setEditUrl] = useState("");
  const [copied, setCopied] = useState(false);

  const href =
    useEditorState({
      editor,
      selector: (ctx) => {
        if (!ctx.editor || !ctx.editor.isActive("link")) {
          return "";
        }
        const rawAttrs: Record<string, unknown> = ctx.editor.getAttributes("link");
        return typeof rawAttrs.href === "string" ? rawAttrs.href : "";
      },
    }) ?? "";

  if (!editor) return null;

  const handleCopy = async () => {
    if (!href) return;
    try {
      await navigator.clipboard.writeText(href);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.error("Failed to copy URL:", err);
    }
  };

  const handleUnlink = () => {
    editor.chain().focus().extendMarkRange("link").unsetLink().run();
    setIsEditing(false);
  };

  const handleSave = () => {
    const trimmed = editUrl.trim();
    if (!trimmed) {
      handleUnlink();
      return;
    }
    const normalized = normalizeUrl(trimmed);
    editor.chain().focus().extendMarkRange("link").setLink({ href: normalized }).run();
    setIsEditing(false);
  };

  return (
    <BubbleMenu
      editor={editor}
      pluginKey="editorLinkBubbleMenu"
      updateDelay={50}
      shouldShow={({ editor: currentEditor }) => {
        return currentEditor.isActive("link");
      }}
      getReferencedVirtualElement={() => {
        const { view, state } = editor;
        const { from } = state.selection;
        try {
          const dom = view.domAtPos(from);
          let el: Node | null = dom.node;
          if (el.nodeType === Node.TEXT_NODE) {
            el = el.parentElement;
          }
          const anchor = el instanceof HTMLElement ? el.closest("a") : null;
          if (anchor) {
            return {
              getBoundingClientRect: () => anchor.getBoundingClientRect(),
              getClientRects: () => anchor.getClientRects(),
            };
          }
        } catch {
          // fallback to caret selection rect
        }
        return null;
      }}
      options={{
        placement: "bottom-start",
        offset: 8,
        flip: true,
        shift: true,
        onHide: () => {
          setIsEditing(false);
          setCopied(false);
        },
      }}
      className="z-50 select-none"
    >
      <div className="border-border bg-popover/95 text-popover-foreground flex items-center gap-1 rounded-xl border p-1 shadow-2xl backdrop-blur-md">
        {isEditing ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSave();
            }}
            className="flex items-center gap-1.5 p-0.5"
          >
            <Link2 className="text-muted-foreground ml-1 size-3.5 shrink-0" />
            <input
              type="text"
              value={editUrl}
              onChange={(e) => setEditUrl(e.target.value)}
              placeholder="Nhập địa chỉ URL..."
              className="border-input bg-background text-foreground placeholder:text-muted-foreground focus:ring-ring h-7 w-52 rounded-md border px-2 text-xs focus:ring-1 focus:outline-none sm:w-64"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  setIsEditing(false);
                }
              }}
            />
            <Button
              type="submit"
              variant="ghost"
              size="icon-sm"
              className="text-primary hover:bg-primary/10 cursor-pointer"
              title="Lưu thay đổi"
            >
              <Check className="size-3.5 text-emerald-500" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => setIsEditing(false)}
              className="text-muted-foreground hover:bg-muted cursor-pointer"
              title="Hủy"
            >
              <X className="size-3.5" />
            </Button>
          </form>
        ) : (
          <>
            {/* Clickable link preview */}
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground hover:bg-muted/70 hover:text-primary group flex max-w-[200px] items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium transition-colors sm:max-w-[280px]"
              title={`Mở trong tab mới: ${href}`}
            >
              <Globe className="text-muted-foreground group-hover:text-primary size-3.5 shrink-0 transition-colors" />
              <span className="truncate underline-offset-2 group-hover:underline">{href}</span>
              <ExternalLink className="text-muted-foreground group-hover:text-primary size-3 shrink-0 transition-colors" />
            </a>

            <div className="bg-border/60 mx-0.5 h-4 w-px" />

            {/* Copy button */}
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => void handleCopy()}
              className="text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer"
              title={copied ? "Đã sao chép liên kết!" : "Sao chép liên kết"}
            >
              {copied ? (
                <Check className="size-3.5 text-emerald-500" />
              ) : (
                <Copy className="size-3.5" />
              )}
            </Button>

            {/* Edit button */}
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={() => {
                setEditUrl(href);
                setIsEditing(true);
              }}
              className="text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer"
              title="Chỉnh sửa liên kết"
            >
              <Pencil className="size-3.5" />
            </Button>

            {/* Unlink button */}
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={handleUnlink}
              className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive cursor-pointer"
              title="Hủy liên kết"
            >
              <Unlink className="size-3.5" />
            </Button>
          </>
        )}
      </div>
    </BubbleMenu>
  );
}
