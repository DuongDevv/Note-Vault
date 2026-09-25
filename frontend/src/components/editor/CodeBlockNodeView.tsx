import { useState } from "react";
import { NodeViewWrapper, NodeViewContent } from "@tiptap/react";
import type { NodeViewProps } from "@tiptap/react";
import { Check, Copy, Terminal } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CodeBlockNodeView({ node, updateAttributes }: NodeViewProps) {
  const [copied, setCopied] = useState<boolean>(false);
  const language =
    typeof node.attrs.language === "string"
      ? node.attrs.language
      : "typescript";

  const handleCopy = () => {
    const text = node.textContent;
    if (typeof navigator !== "undefined") {
      void navigator.clipboard.writeText(text).then(() => {
        setCopied(true);
        setTimeout(() => {
          setCopied(false);
        }, 2000);
      });
    }
  };

  return (
    <NodeViewWrapper className="code-block-node-wrapper my-5">
      <div className="border-border overflow-hidden rounded-xl border bg-slate-50 shadow-xs dark:bg-slate-900/70">
        {/* Header bar */}
        <div className="border-border/80 bg-muted/40 text-muted-foreground flex items-center justify-between border-b px-3.5 py-1.5 text-xs select-none">
          <div className="flex items-center gap-2">
            <Terminal className="text-primary size-3.5" />
            <span className="text-foreground/80 font-mono text-[11px] font-semibold tracking-wider uppercase">
              {language}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <select
              aria-label="Chọn ngôn ngữ lập trình"
              contentEditable={false}
              value={language}
              onChange={(e) => updateAttributes({ language: e.target.value })}
              className="text-muted-foreground hover:text-foreground cursor-pointer bg-transparent font-mono text-[11px] outline-none"
            >
              <option
                value="typescript"
                className="bg-popover text-popover-foreground"
              >
                typescript
              </option>
              <option
                value="javascript"
                className="bg-popover text-popover-foreground"
              >
                javascript
              </option>
              <option
                value="python"
                className="bg-popover text-popover-foreground"
              >
                python
              </option>
              <option
                value="bash"
                className="bg-popover text-popover-foreground"
              >
                bash
              </option>
              <option
                value="sql"
                className="bg-popover text-popover-foreground"
              >
                sql
              </option>
              <option
                value="json"
                className="bg-popover text-popover-foreground"
              >
                json
              </option>
              <option
                value="html"
                className="bg-popover text-popover-foreground"
              >
                html
              </option>
              <option
                value="css"
                className="bg-popover text-popover-foreground"
              >
                css
              </option>
            </select>

            <Button
              type="button"
              variant="ghost"
              size="xs"
              contentEditable={false}
              onClick={handleCopy}
              className="text-muted-foreground hover:text-foreground h-6 cursor-pointer gap-1 px-1.5 font-mono text-[11px]"
              title="Sao chép mã nguồn"
            >
              {copied ? (
                <>
                  <Check className="text-primary size-3" />
                  <span className="text-primary font-medium">Đã chép</span>
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

        {/* Code content */}
        <pre className="text-foreground overflow-x-auto p-4 font-mono text-[13px] leading-relaxed">
          <NodeViewContent className="block font-mono" />
        </pre>
      </div>
    </NodeViewWrapper>
  );
}
