import { BubbleMenu } from "@tiptap/react/menus";
import { useEditorState, type Editor } from "@tiptap/react";
import { NodeSelection } from "@tiptap/pm/state";
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
  const editorState = useEditorState({
    editor,
    selector: (ctx) => {
      if (!ctx.editor) {
        return {
          isBold: false,
          isItalic: false,
          isUnderline: false,
          isBulletList: false,
          isOrderedList: false,
          isLink: false,
          isCodeBlock: false,
          isH1: false,
          isH2: false,
          isH3: false,
        };
      }
      return {
        isBold: ctx.editor.isActive("bold"),
        isItalic: ctx.editor.isActive("italic"),
        isUnderline: ctx.editor.isActive("underline"),
        isBulletList: ctx.editor.isActive("bulletList"),
        isOrderedList: ctx.editor.isActive("orderedList"),
        isLink: ctx.editor.isActive("link"),
        isCodeBlock: ctx.editor.isActive("codeBlock"),
        isH1: ctx.editor.isActive("heading", { level: 1 }),
        isH2: ctx.editor.isActive("heading", { level: 2 }),
        isH3: ctx.editor.isActive("heading", { level: 3 }),
      };
    },
  });

  if (!editor || !editorState) return null;

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
          className={`font-bold ${getButtonClass(editorState.isBold)}`}
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
          className={`font-serif italic ${getButtonClass(editorState.isItalic)}`}
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
          className={`font-medium underline ${getButtonClass(editorState.isUnderline)}`}
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
          className={getButtonClass(editorState.isBulletList)}
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
          className={getButtonClass(editorState.isOrderedList)}
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
          className={getButtonClass(editorState.isLink)}
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
          className={`font-mono text-[11px] ${getButtonClass(editorState.isCodeBlock)}`}
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
            editorState.isH1,
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
            editorState.isH2,
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
            editorState.isH3,
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
