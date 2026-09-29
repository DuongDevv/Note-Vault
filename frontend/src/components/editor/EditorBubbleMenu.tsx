import { useState, useEffect } from "react";
import { BubbleMenu } from "@tiptap/react/menus";
import type { Editor } from "@tiptap/react";
import { NodeSelection } from "@tiptap/pm/state";
import { Underline as _Underline } from "@tiptap/extension-underline";
import { Link as _Link } from "@tiptap/extension-link";
import { Image as _Image } from "@tiptap/extension-image";
import {
  List,
  ListOrdered,
  Link2,
  Image as ImageIcon,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface EditorBubbleMenuProps {
  editor: Editor | null;
}

const getButtonClass = (isActive: boolean) =>
  `cursor-pointer ${
    isActive
      ? "bg-primary/15 text-primary hover:bg-primary/20 hover:text-primary font-semibold"
      : "text-muted-foreground hover:bg-muted hover:text-foreground"
  }`;

const handleOpenImageDialog = () => {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("notevault:open-image-dialog"));
  }
};

export function EditorBubbleMenu({ editor }: EditorBubbleMenuProps) {
  const [, setTick] = useState(0);

  useEffect(() => {
    if (!editor) return undefined;

    const handleUpdate = () => {
      setTick((t) => t + 1);
    };

    editor.on("selectionUpdate", handleUpdate);
    editor.on("transaction", handleUpdate);

    return () => {
      editor.off("selectionUpdate", handleUpdate);
      editor.off("transaction", handleUpdate);
    };
  }, [editor]);

  if (!editor) return null;
  const setLink = () => {
    const rawAttrs: Record<string, unknown> = editor.getAttributes("link");
    const previousUrl =
      typeof rawAttrs.href === "string" ? rawAttrs.href : undefined;
    const url = window.prompt("Nhập địa chỉ URL:", previousUrl);

    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  return (
    <BubbleMenu
      editor={editor}
      shouldShow={({ editor: currentEditor, state, from, to }) => {
        if (state.selection.empty || from === to) {
          return false;
        }
        if (
          currentEditor.isActive("apiKeyBlock") ||
          currentEditor.isActive("secretBlock") ||
          currentEditor.isActive("codeBlock")
        ) {
          return false;
        }
        if (state.selection instanceof NodeSelection) {
          return false;
        }
        return true;
      }}
      className="z-50 select-none"
    >
      <div className="border-border bg-popover text-popover-foreground flex items-center gap-0.5 rounded-xl border p-1 shadow-2xl backdrop-blur-md">
        {/* Bold */}
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`font-bold ${getButtonClass(editor.isActive("bold"))}`}
          title="Đậm (Ctrl+B)"
        >
          B
        </Button>

        {/* Italic */}
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`font-serif italic ${getButtonClass(editor.isActive("italic"))}`}
          title="Nghiêng (Ctrl+I)"
        >
          I
        </Button>

        {/* Underline */}
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={`font-medium underline ${getButtonClass(editor.isActive("underline"))}`}
          title="Gạch chân (Ctrl+U)"
        >
          U
        </Button>

        <div className="bg-border mx-1 h-3.5 w-px" />

        {/* Bullet List */}
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={getButtonClass(editor.isActive("bulletList"))}
          title="Danh sách không thứ tự"
        >
          <List className="size-3.5" />
        </Button>

        {/* Ordered List */}
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={getButtonClass(editor.isActive("orderedList"))}
          title="Danh sách đánh số"
        >
          <ListOrdered className="size-3.5" />
        </Button>

        <div className="bg-border mx-1 h-3.5 w-px" />

        {/* Link */}
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={setLink}
          className={getButtonClass(editor.isActive("link"))}
          title="Chèn liên kết"
        >
          <Link2 className="size-3.5" />
        </Button>

        {/* Image */}
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={handleOpenImageDialog}
          className="text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer"
          title="Chèn hình ảnh"
        >
          <ImageIcon className="size-3.5" />
        </Button>

        {/* Code Block */}
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          className={`font-mono text-[11px] ${getButtonClass(editor.isActive("codeBlock"))}`}
          title="Khối mã nguồn"
        >
          &lt;/&gt;
        </Button>

        <div className="bg-border mx-1 h-3.5 w-px" />

        {/* Heading 1 */}
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 1 }).run()
          }
          className={`text-[11px] font-semibold tracking-wider ${getButtonClass(
            editor.isActive("heading", { level: 1 }),
          )}`}
          title="Tiêu đề 1"
        >
          H1
        </Button>

        {/* Heading 2 */}
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
          className={`text-[11px] font-semibold tracking-wider ${getButtonClass(
            editor.isActive("heading", { level: 2 }),
          )}`}
          title="Tiêu đề 2"
        >
          H2
        </Button>

        {/* Heading 3 */}
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 3 }).run()
          }
          className={`text-[11px] font-semibold tracking-wider ${getButtonClass(
            editor.isActive("heading", { level: 3 }),
          )}`}
          title="Tiêu đề 3"
        >
          H3
        </Button>

        <div className="bg-border/60 mx-0.5 h-4 w-px" />

        {/* Insert Secret Block */}
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={() => editor.chain().focus().insertSecretBlock().run()}
          className="text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer"
          title="Chèn khối bí mật (API Key, Mật khẩu, Token...)"
        >
          <Lock className="size-3.5" />
        </Button>
      </div>
    </BubbleMenu>
  );
}
