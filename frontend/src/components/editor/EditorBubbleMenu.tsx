import { BubbleMenu } from "@tiptap/react/menus";
import type { Editor } from "@tiptap/react";
import { StarterKit as _StarterKit } from "@tiptap/starter-kit";
import { Underline as _Underline } from "@tiptap/extension-underline";
import { Link as _Link } from "@tiptap/extension-link";
import { Image as _Image } from "@tiptap/extension-image";
import { List, ListOrdered, Link2, Image as ImageIcon } from "lucide-react";
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

export function EditorBubbleMenu({ editor }: EditorBubbleMenuProps) {
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

  const addImage = () => {
    const url = window.prompt("Nhập liên kết hình ảnh:");
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  return (
    <BubbleMenu
      editor={editor}
      shouldShow={({ state, from, to }) => {
        return !state.selection.empty && from !== to;
      }}
      className="border-border bg-popover/95 text-popover-foreground animate-in fade-in zoom-in-95 z-50 flex items-center gap-0.5 rounded-xl border p-1 shadow-xl backdrop-blur-md duration-150 select-none"
    >
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
        onClick={addImage}
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
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
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
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
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
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        className={`text-[11px] font-semibold tracking-wider ${getButtonClass(
          editor.isActive("heading", { level: 3 }),
        )}`}
        title="Tiêu đề 3"
      >
        H3
      </Button>
    </BubbleMenu>
  );
}
