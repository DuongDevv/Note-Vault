import { useState, useRef, useEffect } from "react";
import { NodeViewWrapper, type NodeViewProps } from "@tiptap/react";
import {
  Lock,
  KeyRound,
  CreditCard,
  Database,
  ShieldAlert,
  Eye,
  EyeOff,
  Copy,
  Check,
  Pencil,
  Trash2,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { copySecretWithAutoClear } from "@/utils/clipboard";
import type { SecretCategory } from "./extensions/SecretBlock";

interface CategoryMeta {
  label: string;
  icon: typeof Lock;
  badgeClass: string;
}

const CATEGORY_CONFIG: Record<SecretCategory, CategoryMeta> = {
  api_key: {
    label: "API Key / Token",
    icon: KeyRound,
    badgeClass: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  },
  password: {
    label: "Mật khẩu",
    icon: KeyRound,
    badgeClass: "text-sky-400 bg-sky-500/10 border-sky-500/20",
  },
  note: {
    label: "Ghi chú bí mật",
    icon: Lock,
    badgeClass: "text-zinc-400 bg-zinc-500/10 border-zinc-500/20",
  },
  database: {
    label: "Database / URI",
    icon: Database,
    badgeClass: "text-purple-400 bg-purple-500/10 border-purple-500/20",
  },
  card: {
    label: "Thẻ / Tài chính",
    icon: CreditCard,
    badgeClass: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  },
  seed: {
    label: "Recovery Seed",
    icon: ShieldAlert,
    badgeClass: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  },
  other: {
    label: "Khác",
    icon: ShieldCheck,
    badgeClass: "text-zinc-400 bg-zinc-500/10 border-zinc-500/20",
  },
};
function parseCategory(val: string): SecretCategory {
  if (
    val === "api_key" ||
    val === "password" ||
    val === "card" ||
    val === "database" ||
    val === "seed" ||
    val === "other"
  ) {
    return val;
  }
  return "note";
}

export function SecretBlockNodeView({
  node,
  updateAttributes,
  deleteNode,
}: NodeViewProps) {
  // Support both unified secretBlock attrs and legacy apiKeyBlock attrs
  const rawAttrs = node.attrs as {
    title?: string;
    name?: string;
    value?: string;
    key?: string;
    category?: SecretCategory;
  };

  const title = rawAttrs.title ?? rawAttrs.name ?? "Khối bí mật";
  const value = rawAttrs.value ?? rawAttrs.key ?? "";
  const category: SecretCategory = rawAttrs.category
    ? parseCategory(rawAttrs.category)
    : (rawAttrs.name ?? rawAttrs.key)
      ? "api_key"
      : "note";

  const [isMasked, setIsMasked] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(!value);

  // Edit draft state
  const [draftTitle, setDraftTitle] = useState<string>(title);
  const [draftValue, setDraftValue] = useState<string>(value);
  const [draftCategory, setDraftCategory] = useState<SecretCategory>(category);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${String(Math.max(68, textareaRef.current.scrollHeight))}px`;
    }
  }, [isEditing]);

  const meta = CATEGORY_CONFIG[category];
  const IconComponent = meta.icon;

  const handleCopy = async () => {
    if (!value) return;
    const ok = await copySecretWithAutoClear(value, 30000);
    if (ok) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleSave = () => {
    updateAttributes({
      title: draftTitle.trim() || "Khối bí mật",
      value: draftValue.trim(),
      category: draftCategory,
    });
    setIsEditing(false);
  };

  const handleCancel = () => {
    setDraftTitle(title);
    setDraftValue(value);
    setDraftCategory(category);
    setIsEditing(false);
  };

  return (
    <NodeViewWrapper className="secret-block-wrapper my-4">
      <div className="border-border/70 bg-card/40 dark:bg-card/25 overflow-hidden rounded-xl border shadow-xs transition-all">
        {/* Header Bar */}
        <div className="border-border/60 bg-muted/30 flex items-center justify-between border-b px-3.5 py-2 select-none">
          <div className="flex min-w-0 items-center gap-2">
            <div className="bg-primary/10 text-primary border-primary/20 flex size-6 shrink-0 items-center justify-center rounded-md border">
              <IconComponent className="size-3.5" />
            </div>

            <span className="text-foreground truncate text-[13px] font-semibold tracking-tight">
              {title || "Khối bí mật"}
            </span>
          </div>

          <div className="flex items-center gap-1">
            {!isEditing && (
              <>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => setIsEditing(true)}
                  className="text-muted-foreground hover:text-foreground size-6 cursor-pointer rounded"
                  title="Chỉnh sửa nội dung bí mật"
                >
                  <Pencil className="size-3" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => deleteNode()}
                  className="text-muted-foreground hover:text-destructive size-6 cursor-pointer rounded"
                  title="Xóa khối bí mật"
                >
                  <Trash2 className="size-3" />
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Content Section */}
        {isEditing ? (
          <div className="space-y-3 p-3.5 text-xs">
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              <div>
                <label className="text-muted-foreground mb-1 block font-medium">
                  Tiêu đề định danh
                </label>
                <input
                  type="text"
                  value={draftTitle}
                  onChange={(e) => setDraftTitle(e.target.value)}
                  placeholder="Ví dụ: OpenAI API Key, Mật khẩu WiFi, Token..."
                  className="border-input bg-background/50 focus-visible:ring-ring w-full rounded-md border px-2.5 py-1.5 text-xs focus-visible:ring-1 focus-visible:outline-none"
                />
              </div>

              <div>
                <label className="text-muted-foreground mb-1 block font-medium">
                  Loại nội dung
                </label>
                <Select
                  value={draftCategory}
                  onValueChange={(val) => {
                    if (typeof val === "string") {
                      setDraftCategory(parseCategory(val));
                    }
                  }}
                >
                  <SelectTrigger className="border-input bg-background/50 h-8 w-full text-xs">
                    <SelectValue placeholder="Chọn loại">
                      {(val: unknown) => {
                        if (typeof val !== "string") return "Chọn loại";
                        const cat = parseCategory(val);
                        return CATEGORY_CONFIG[cat].label;
                      }}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="text-xs">
                    <SelectItem value="api_key" className="text-xs">
                      API Key / Token
                    </SelectItem>
                    <SelectItem value="password" className="text-xs">
                      Mật khẩu tài khoản
                    </SelectItem>
                    <SelectItem value="note" className="text-xs">
                      Ghi chú bí mật
                    </SelectItem>
                    <SelectItem value="database" className="text-xs">
                      Database / URI
                    </SelectItem>
                    <SelectItem value="card" className="text-xs">
                      Thẻ / Tài chính
                    </SelectItem>
                    <SelectItem value="seed" className="text-xs">
                      Recovery Seed Words
                    </SelectItem>
                    <SelectItem value="other" className="text-xs">
                      Khác
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="text-muted-foreground mb-1 block font-medium">
                Nội dung bí mật cần ẩn (Mật khẩu, Key, Ghi chú riêng tư...)
              </label>
              <textarea
                ref={textareaRef}
                rows={2}
                value={draftValue}
                onChange={(e) => {
                  setDraftValue(e.target.value);
                  const target = e.currentTarget;
                  target.style.height = "auto";
                  target.style.height = `${String(Math.max(68, target.scrollHeight))}px`;
                }}
                placeholder="Nhập nội dung bảo mật tại đây..."
                className="border-input bg-background/50 focus-visible:ring-ring w-full resize-none overflow-hidden rounded-md border px-2.5 py-1.5 font-mono text-xs transition-[height] duration-75 focus-visible:ring-1 focus-visible:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              {value && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleCancel}
                  className="h-7 text-xs"
                >
                  Hủy
                </Button>
              )}
              <Button
                type="button"
                variant="default"
                size="sm"
                onClick={handleSave}
                disabled={!draftValue.trim()}
                className="h-7 cursor-pointer text-xs font-medium"
              >
                Lưu khối bí mật
              </Button>
            </div>
          </div>
        ) : (
          <div className="p-3.5">
            <div className="border-border/60 bg-muted/20 flex flex-wrap items-start justify-between gap-2 rounded-lg border p-2.5">
              {/* Secret Value or Masked State */}
              <div className="flex min-w-0 flex-1 items-start gap-2 pt-0.5">
                <span className="text-muted-foreground/60 mt-0.5 shrink-0 select-none">
                  <ShieldCheck className="size-3.5" />
                </span>

                {isMasked ? (
                  <div className="text-muted-foreground font-mono text-xs tracking-widest select-none">
                    ••••••••••••••••••••••••••••••••••••••••
                  </div>
                ) : (
                  <div className="text-foreground selection:text-foreground cursor-text font-mono text-[12px] leading-relaxed break-all whitespace-pre-wrap select-text selection:bg-blue-500/35">
                    {value}
                  </div>
                )}
              </div>

              {/* Action Controls */}
              <div className="flex shrink-0 items-center gap-1.5">
                {/* Toggle Eye */}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => setIsMasked(!isMasked)}
                  className="text-muted-foreground hover:text-foreground size-6.5 cursor-pointer rounded"
                  title={
                    isMasked ? "Hiện nội dung bí mật" : "Ẩn nội dung bí mật"
                  }
                >
                  {isMasked ? (
                    <Eye className="size-3.5" />
                  ) : (
                    <EyeOff className="size-3.5" />
                  )}
                </Button>

                {/* Quick Copy with Ephemeral Purge */}
                <Button
                  type="button"
                  variant={copied ? "default" : "outline"}
                  size="sm"
                  onClick={() => void handleCopy()}
                  className="h-6.5 cursor-pointer gap-1.5 px-2 text-[11px] font-medium transition-all"
                  title="Sao chép vào clipboard (tự hủy sau 30s)"
                >
                  {copied ? (
                    <>
                      <Check className="size-3" />
                      <span>Đã chép (xóa sau 30s)</span>
                    </>
                  ) : (
                    <>
                      <Copy className="size-3" />
                      <span>Sao chép</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </NodeViewWrapper>
  );
}
