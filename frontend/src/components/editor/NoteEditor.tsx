import { useState, useEffect, useRef } from "react";
import { useEditor, EditorContent, ReactNodeViewRenderer } from "@tiptap/react";
import { StarterKit } from "@tiptap/starter-kit";
import { Underline } from "@tiptap/extension-underline";
import { Link } from "@tiptap/extension-link";
import { Image } from "@tiptap/extension-image";
import { Placeholder } from "@tiptap/extension-placeholder";
import { CodeBlockLowlight } from "@tiptap/extension-code-block-lowlight";
import { common, createLowlight } from "lowlight";
import {
  Check,
  Clock,
  Copy,
  FolderOpen,
  Lock,
  MoreHorizontal,
  Pin,
  Trash2,
  Loader2,
} from "lucide-react";
import type { Note } from "@/types/note";
import { EditorBubbleMenu } from "./EditorBubbleMenu";
import { CodeBlockNodeView } from "./CodeBlockNodeView";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
  onBack?: () => void;
  onSave?: (updated: {
    id: string;
    title: string;
    excerpt: string;
    content?: string;
  }) => void;
  onDelete?: (id: string) => void;
  onToggleLock?: (id: string) => void;
}

const DEFAULT_SAMPLE_CONTENT = `
<p>Hệ thống lưu trữ phân tán cho NoteVault được thiết kế dựa trên nguyên lý <strong>Zero-Knowledge Architecture</strong>. Dữ liệu văn bản được mã hóa đối xứng bằng khóa AES-GCM 256-bit ngay tại trình duyệt client trước khi truyền tải qua môi trường Internet.</p>

<h3>Nguyên lý an ninh chính:</h3>
<ul>
  <li><p><strong>Khóa phiên (Session Key)</strong> sinh từ thuật toán PBKDF2 với 600,000 vòng lặp kèm salt ngẫu nhiên cấp máy khách.</p></li>
  <li><p><strong>Đồng bộ phân tán (CRDT)</strong> hỗ trợ giải quyết xung đột khi chỉnh sửa ngoại tuyến (Offline-first) mà không cần để lộ bản rõ trên server relay.</p></li>
</ul>

<pre><code class="language-typescript">const cipher = await crypto.subtle.encrypt(
  { name: "AES-GCM", iv },
  key,
  encodedData
);</code></pre>

<p>Nhờ phương pháp tiếp cận này, nhà cung cấp cơ sở hạ tầng đám mây chỉ lưu trữ blob nhị phân đã xáo trộn hoàn toàn và không có bất kỳ khả năng nào giải mã nội dung ngay cả khi có yêu cầu trát lệnh tòa án.</p>
`;

export function NoteEditor({
  note,
  topicName = "Học tập",
  onSave,
  onDelete,
  onToggleLock,
}: NoteEditorProps) {
  const [title, setTitle] = useState(note.title);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState<string>("vừa xong");
  const saveTimeoutRef = useRef<number | undefined>(undefined);

  const initialContent = note.excerpt
    ? `<p>${note.excerpt}</p>${DEFAULT_SAMPLE_CONTENT}`
    : DEFAULT_SAMPLE_CONTENT;

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false,
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        autolink: true,
      }),
      Image,
      Placeholder.configure({
        placeholder: "Tiếp tục gõ hoặc gõ '/' để xem lệnh tắt...",
      }),
      CustomCodeBlock,
    ],
    content: initialContent,
    editorProps: {
      attributes: {
        class:
          "prose prose-slate dark:prose-invert max-w-none focus:outline-none min-h-[420px] text-foreground text-sm sm:text-base leading-relaxed",
      },
    },
    onUpdate: () => {
      setIsSaving(true);
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => {
        setIsSaving(false);
        setLastSavedTime("vừa xong");
        if (onSave) {
          onSave({
            id: note.id,
            title,
            excerpt: editor.getText().slice(0, 160) || note.excerpt,
            content: editor.getHTML(),
          });
        }
      }, 1000);
    },
  });

  useEffect(() => {
    return () => {
      clearTimeout(saveTimeoutRef.current);
    };
  }, []);

  return (
    <div className="mx-auto flex w-full max-w-[760px] flex-col gap-4">
      {/* Editorial Canvas Card */}
      <div className="bg-card border-border relative flex w-full flex-col rounded-2xl border p-6 shadow-xs transition-shadow md:p-10">
        {/* Top Action Ribbon - Minimal & Functional */}
        <div className="border-border/60 flex items-center justify-between border-b pb-4">
          <div className="text-muted-foreground flex items-center gap-2 text-xs select-none">
            {isSaving ? (
              <span className="text-primary flex items-center gap-1.5 font-medium">
                <Loader2 className="size-3.5 animate-spin" />
                <span>Đang lưu…</span>
              </span>
            ) : (
              <span className="text-muted-foreground flex items-center gap-1.5">
                <Check className="text-primary size-3.5" />
                <span>Đã đồng bộ</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Context Trigger & Floating Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="text-muted-foreground hover:text-foreground size-8 cursor-pointer rounded-lg"
                    aria-label="Thao tác khác"
                  >
                    <MoreHorizontal className="size-4" />
                  </Button>
                }
              />
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem
                  onClick={() => onToggleLock?.(note.id)}
                  className="cursor-pointer gap-2 text-xs"
                >
                  <Pin className="text-muted-foreground size-3.5" />
                  <span>
                    {note.isLocked ? "Bỏ khóa ghi chú" : "Khóa bảo mật"}
                  </span>
                </DropdownMenuItem>

                <DropdownMenuItem
                  onClick={() => {
                    if (typeof navigator !== "undefined") {
                      void navigator.clipboard.writeText(
                        `${title}\n\n${editor.getText()}`,
                      );
                    }
                  }}
                  className="cursor-pointer gap-2 text-xs"
                >
                  <Copy className="text-muted-foreground size-3.5" />
                  <span>Sao chép toàn bộ</span>
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  onClick={() => onDelete?.(note.id)}
                  className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer gap-2 text-xs"
                >
                  <Trash2 className="size-3.5" />
                  <span>Xóa ghi chú</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Note Header / Title Input */}
        <div className="mt-5">
          <input
            type="text"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              setIsSaving(true);
              clearTimeout(saveTimeoutRef.current);
              saveTimeoutRef.current = setTimeout(() => {
                setIsSaving(false);
                setLastSavedTime("vừa xong");
              }, 1000);
            }}
            placeholder="Tiêu đề ghi chú…"
            className="text-foreground placeholder:text-muted-foreground/40 w-full border-0 bg-transparent p-0 text-2xl leading-tight font-bold tracking-tight focus:ring-0 focus:outline-none sm:text-3xl"
          />
        </div>

        {/* Metadata Line */}
        <div className="text-muted-foreground border-border/60 my-4 flex flex-wrap items-center gap-3 border-b pb-4 text-xs sm:gap-4">
          <span className="flex items-center gap-1.5">
            <Clock className="text-muted-foreground/70 size-3.5" />
            <span>
              Tạo {note.date || "12/03/2025"} · Cập nhật {lastSavedTime}
            </span>
          </span>

          <span className="bg-secondary text-secondary-foreground inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium">
            <FolderOpen className="size-3" />
            <span>{topicName}</span>
          </span>
          {note.isLocked && (
            <span className="bg-primary/10 text-primary border-primary/20 inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium">
              <Lock className="text-primary size-3" />
              <span>Đã mã hóa E2EE</span>
            </span>
          )}
        </div>

        {/* Document Body Area with Floating Inline Toolbar */}
        <div className="relative flex flex-1 flex-col pt-2">
          <EditorBubbleMenu editor={editor} />
          <EditorContent editor={editor} />
        </div>
      </div>
    </div>
  );
}
