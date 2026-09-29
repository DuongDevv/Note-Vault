import {
  useState,
  useRef,
  useEffect,
  type MouseEvent as ReactMouseEvent,
} from "react";
import { NodeViewWrapper, type NodeViewProps } from "@tiptap/react";
import { AlignLeft, AlignCenter, AlignRight, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ImageAlignment } from "./extensions/CustomImage";

const SIZE_PRESETS = [
  { label: "25%", value: "25%" },
  { label: "50%", value: "50%" },
  { label: "75%", value: "75%" },
  { label: "100%", value: "100%" },
] as const;

const getAlignmentJustify = (align: ImageAlignment) => {
  switch (align) {
    case "left": {
      return "justify-start";
    }
    case "right": {
      return "justify-end";
    }
    default: {
      return "justify-center";
    }
  }
};

export function ImageNodeView({
  node,
  updateAttributes,
  deleteNode,
  selected,
  editor,
  getPos,
}: NodeViewProps) {
  const {
    src = "",
    alt = "Hình ảnh",
    width = "100%",
    alignment = "center",
  } = node.attrs as {
    src?: string;
    alt?: string;
    width?: string;
    alignment?: ImageAlignment;
  };

  const [isDismissed, setIsDismissed] = useState<boolean>(false);
  const [isResizing, setIsResizing] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!selected) return undefined;

    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      if (
        containerRef.current &&
        e.target instanceof Node &&
        !containerRef.current.contains(e.target)
      ) {
        setIsDismissed(true);
        try {
          const pos = getPos();
          if (typeof pos === "number") {
            editor.commands.setTextSelection(pos + 1);
          }
        } catch {
          // Ignore during unmount or transition
        }
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsDismissed(true);
        try {
          const pos = getPos();
          if (typeof pos === "number") {
            editor.commands.setTextSelection(pos + 1);
          }
        } catch {
          // Ignore
        }
      }
    };

    window.addEventListener("mousedown", handleOutsideClick, true);
    window.addEventListener("touchstart", handleOutsideClick, true);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("mousedown", handleOutsideClick, true);
      window.removeEventListener("touchstart", handleOutsideClick, true);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selected, editor, getPos]);

  const showToolbar = (selected && !isDismissed) || isResizing;
  const handleResizeStart = (
    e: ReactMouseEvent<HTMLDivElement>,
    direction: "left" | "right",
  ) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);

    const startX = e.clientX;
    const parentContainer = containerRef.current?.parentElement;
    const parentWidth = parentContainer ? parentContainer.clientWidth : 800;
    const initialWidthPx = containerRef.current
      ? containerRef.current.clientWidth
      : parentWidth;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX =
        direction === "right"
          ? moveEvent.clientX - startX
          : startX - moveEvent.clientX;

      const newWidthPx = Math.min(
        parentWidth,
        Math.max(160, initialWidthPx + deltaX),
      );
      const newWidthPercent = Math.round((newWidthPx / parentWidth) * 100);
      const clampedPercent = Math.min(100, Math.max(20, newWidthPercent));

      updateAttributes({ width: `${String(clampedPercent)}%` });
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  return (
    <NodeViewWrapper
      className={`image-block-wrapper my-5 flex w-full ${getAlignmentJustify(alignment)} select-none`}
      data-alignment={alignment}
      data-width={width}
    >
      <div
        ref={containerRef}
        onClick={() => setIsDismissed(false)}
        className="group relative max-w-full transition-[width] duration-75"
        style={{ width: width || "100%" }}
      >
        <div
          className={`border-border/80 bg-popover/95 text-popover-foreground absolute -top-11 left-1/2 z-20 flex -translate-x-1/2 items-center gap-0.5 rounded-lg border p-1 shadow-xl backdrop-blur-md transition-opacity duration-150 ${
            showToolbar
              ? "pointer-events-auto opacity-100"
              : "pointer-events-none opacity-0"
          }`}
        >
          {/* Alignment controls */}
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            onClick={() => updateAttributes({ alignment: "left" })}
            className={`size-6.5 cursor-pointer rounded ${
              alignment === "left"
                ? "bg-accent text-accent-foreground font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
            title="Căn trái"
          >
            <AlignLeft className="size-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            onClick={() => updateAttributes({ alignment: "center" })}
            className={`size-6.5 cursor-pointer rounded ${
              alignment === "center"
                ? "bg-accent text-accent-foreground font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
            title="Căn giữa"
          >
            <AlignCenter className="size-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            onClick={() => updateAttributes({ alignment: "right" })}
            className={`size-6.5 cursor-pointer rounded ${
              alignment === "right"
                ? "bg-accent text-accent-foreground font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
            title="Căn phải"
          >
            <AlignRight className="size-3.5" />
          </Button>

          <div className="bg-border/60 mx-1 h-3.5 w-px" />

          {/* Size Presets */}
          <div className="flex items-center gap-0.5">
            {SIZE_PRESETS.map((preset) => (
              <Button
                key={preset.value}
                type="button"
                variant="ghost"
                size="xs"
                onClick={() => updateAttributes({ width: preset.value })}
                className={`h-6.5 cursor-pointer rounded px-1.5 font-mono text-[11px] ${
                  width === preset.value
                    ? "bg-accent text-accent-foreground font-semibold"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                title={`Đặt kích thước ${preset.label}`}
              >
                {preset.label}
              </Button>
            ))}
          </div>

          <div className="bg-border/60 mx-1 h-3.5 w-px" />

          {/* Delete Action */}
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            onClick={() => deleteNode()}
            className="text-muted-foreground hover:text-destructive hover:bg-destructive/15 size-6.5 cursor-pointer rounded"
            title="Xóa hình ảnh"
          >
            <Trash2 className="size-3.5" />
          </Button>
        </div>

        {/* Image Display Surface */}
        <div className="relative overflow-hidden rounded-lg">
          <img
            src={src}
            alt={alt}
            className={`border-border/70 block h-auto w-full rounded-lg border object-cover shadow-xs transition-all ${
              selected
                ? "ring-primary ring-offset-background ring-2 ring-offset-2"
                : ""
            }`}
            draggable={false}
          />

          {/* Left Resize Handle */}
          <div
            onMouseDown={(e) => handleResizeStart(e, "left")}
            className="hover:bg-primary/40 absolute top-0 bottom-0 left-0 flex w-2.5 cursor-ew-resize items-center justify-center opacity-0 transition-opacity group-hover:opacity-100"
            title="Kéo để đổi kích thước"
          >
            <div className="bg-background/80 border-border/80 h-8 w-1 rounded-full border shadow-xs" />
          </div>

          {/* Right Resize Handle */}
          <div
            onMouseDown={(e) => handleResizeStart(e, "right")}
            className="hover:bg-primary/40 absolute top-0 right-0 bottom-0 flex w-2.5 cursor-ew-resize items-center justify-center opacity-0 transition-opacity group-hover:opacity-100"
            title="Kéo để đổi kích thước"
          >
            <div className="bg-background/80 border-border/80 h-8 w-1 rounded-full border shadow-xs" />
          </div>
        </div>
      </div>
    </NodeViewWrapper>
  );
}
