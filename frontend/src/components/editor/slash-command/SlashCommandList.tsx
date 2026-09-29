import { useState, useImperativeHandle, forwardRef } from "react";
import type { Editor, Range } from "@tiptap/core";
import {
  Type,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Code,
  Lock,
  Image as ImageIcon,
  Quote,
} from "lucide-react";
export interface CommandItem {
  title: string;
  description: string;
  icon: typeof Type;
  command: (props: { editor: Editor; range: Range }) => void;
  keywords?: string[];
}

export const SLASH_COMMAND_ITEMS: CommandItem[] = [
  {
    title: "Văn bản",
    description: "Đoạn văn bản thông thường",
    icon: Type,
    keywords: ["p", "paragraph", "text", "van ban"],
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setParagraph().run();
    },
  },
  {
    title: "Tiêu đề 1",
    description: "Tiêu đề lớn H1",
    icon: Heading1,
    keywords: ["h1", "heading1", "tieu de 1"],
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setHeading({ level: 1 }).run();
    },
  },
  {
    title: "Tiêu đề 2",
    description: "Tiêu đề vừa H2",
    icon: Heading2,
    keywords: ["h2", "heading2", "tieu de 2"],
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setHeading({ level: 2 }).run();
    },
  },
  {
    title: "Tiêu đề 3",
    description: "Tiêu đề nhỏ H3",
    icon: Heading3,
    keywords: ["h3", "heading3", "tieu de 3"],
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setHeading({ level: 3 }).run();
    },
  },
  {
    title: "Secret Block",
    description: "Lưu API Key, mật khẩu, thẻ, token (mã hóa & ẩn)",
    icon: Lock,
    keywords: [
      "secret",
      "pass",
      "password",
      "api",
      "key",
      "token",
      "card",
      "seed",
      "bi mat",
      "khoa",
    ],
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).insertSecretBlock().run();
    },
  },
  {
    title: "Code Block",
    description: "Khối code highlight cú pháp đa ngôn ngữ",
    icon: Code,
    keywords: ["code", "lap trinh", "codeblock"],
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setCodeBlock().run();
    },
  },
  {
    title: "Hình ảnh",
    description: "Chèn ảnh từ máy tính hoặc liên kết URL",
    icon: ImageIcon,
    keywords: ["image", "anh", "hinh anh", "picture", "photo", "upload"],
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).run();
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("notevault:open-image-dialog"));
      }
    },
  },
  {
    title: "Danh sách chấm đầu dòng",
    description: "Tạo bullet list",
    icon: List,
    keywords: ["bullet", "list", "danh sach"],
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleBulletList().run();
    },
  },
  {
    title: "Danh sách đánh số",
    description: "Tạo danh sách 1, 2, 3...",
    icon: ListOrdered,
    keywords: ["ordered", "number", "so"],
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleOrderedList().run();
    },
  },
  {
    title: "Trích dẫn",
    description: "Khối trích dẫn văn bản",
    icon: Quote,
    keywords: ["quote", "blockquote", "trich dan"],
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleBlockquote().run();
    },
  },
];

export interface SlashCommandListProps {
  items: CommandItem[];
  command: (item: CommandItem) => void;
}

export interface SlashCommandListRef {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean;
}

export const SlashCommandList = forwardRef<
  SlashCommandListRef,
  SlashCommandListProps
>(function SlashCommandList({ items, command }, ref) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const safeIndex = items.length > 0 ? selectedIndex % items.length : 0;

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }) => {
      if (event.key === "ArrowUp") {
        setSelectedIndex((prev) => (prev + items.length - 1) % items.length);
        return true;
      }
      if (event.key === "ArrowDown") {
        setSelectedIndex((prev) => (prev + 1) % items.length);
        return true;
      }
      if (event.key === "Enter") {
        if (items.length > 0) {
          command(items[safeIndex]);
          return true;
        }
      }
      return false;
    },
  }));

  if (items.length === 0) {
    return (
      <div className="border-border bg-popover text-muted-foreground w-64 rounded-xl border p-3 text-center text-xs shadow-xl select-none">
        Không tìm thấy lệnh phù hợp
      </div>
    );
  }

  return (
    <div className="border-border bg-popover text-popover-foreground max-h-72 w-68 overflow-y-auto rounded-xl border p-1 shadow-2xl backdrop-blur-md select-none">
      <div className="text-muted-foreground px-2 py-1 text-[11px] font-semibold tracking-wider uppercase">
        Lệnh định dạng & Bảo mật
      </div>

      <div className="space-y-0.5">
        {items.map((item, index) => {
          const isSelected = index === safeIndex;
          const IconComponent = item.icon;
          return (
            <button
              key={item.title}
              type="button"
              onClick={() => command(item)}
              onMouseEnter={() => setSelectedIndex(index)}
              className={`flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left text-xs transition-colors ${
                isSelected
                  ? "bg-accent text-accent-foreground font-medium"
                  : "text-foreground hover:bg-accent/50"
              }`}
            >
              <div
                className={`flex size-6 shrink-0 items-center justify-center rounded-md border ${
                  isSelected
                    ? "border-primary/30 bg-primary/10 text-primary"
                    : "border-border bg-muted/40 text-muted-foreground"
                }`}
              >
                <IconComponent className="size-3.5" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="truncate text-[12px] leading-tight font-medium">
                  {item.title}
                </div>
                <div className="text-muted-foreground truncate text-[11px]">
                  {item.description}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
});
