import { useState, useEffect, useRef, useCallback } from "react";
import type { Editor } from "@tiptap/react";
import { NodeSelection } from "@tiptap/pm/state";
import { GripVertical, Plus } from "lucide-react";

interface EditorDragHandleProps {
  editor: Editor | null;
  containerRef: React.RefObject<HTMLDivElement | null>;
}

export function EditorDragHandle({
  editor,
  containerRef,
}: EditorDragHandleProps) {
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(
    null,
  );
  const [isVisible, setIsVisible] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dropLineTop, setDropLineTop] = useState<number | null>(null);

  const activeBlockRef = useRef<{
    pos: number;
    dom: HTMLElement;
    nodeSize: number;
  } | null>(null);
  const targetDropPosRef = useRef<number | null>(null);
  const hideTimeoutRef = useRef<number | null>(null);
  const editorRef = useRef<Editor | null>(editor);

  useEffect(() => {
    editorRef.current = editor;
  }, [editor]);

  const cleanupDrag = useCallback(() => {
    if (activeBlockRef.current?.dom) {
      activeBlockRef.current.dom.style.opacity = "";
    }
    setIsDragging(false);
    setDropLineTop(null);
    targetDropPosRef.current = null;
    if (editorRef.current) {
      Object.assign(editorRef.current.view, { dragging: null });
    }
  }, []);

  // Track mouse movement to position the handle in the gutter
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) return;

      const currentEditor = editorRef.current;
      const container = containerRef.current;
      if (!currentEditor || !container) return;

      const editorDom = currentEditor.view.dom;
      const editorRect = editorDom.getBoundingClientRect();

      // If mouse is too far vertically above/below the editor, hide with debounce
      if (
        e.clientY < editorRect.top - 60 ||
        e.clientY > editorRect.bottom + 60 ||
        e.clientX > editorRect.right + 120
      ) {
        hideTimeoutRef.current ??= window.setTimeout(() => {
          setIsVisible(false);
        }, 350);
        return;
      }

      // Mouse is in the valid tracking area (inside editor or in left gutter / outer area)
      if (hideTimeoutRef.current !== null) {
        window.clearTimeout(hideTimeoutRef.current);
        hideTimeoutRef.current = null;
      }

      const target = e.target;
      if (
        target instanceof HTMLElement &&
        target.closest(".editor-drag-handle-root")
      ) {
        return;
      }

      // If mouse is inside editorDom, inspect target; if to the left/outside, sample element at editor's left edge
      let elementToInspect: Element | null = null;
      if (target instanceof Node && editorDom.contains(target)) {
        elementToInspect = target instanceof Element ? target : null;
      } else {
        // Horizontally sample into the editor at current vertical mouse position
        elementToInspect = document.elementFromPoint(
          editorRect.left + 24,
          e.clientY,
        );
      }

      if (!elementToInspect || !editorDom.contains(elementToInspect)) {
        return;
      }

      // Locate top-level block direct child of editorDom
      let current: HTMLElement | null =
        elementToInspect instanceof HTMLElement ? elementToInspect : null;
      let topLevelBlock: HTMLElement | null = null;
      while (current) {
        if (current.parentElement === editorDom) {
          topLevelBlock = current;
          break;
        }
        current = current.parentElement;
      }

      if (!topLevelBlock) return;

      try {
        const pos = currentEditor.view.posAtDOM(topLevelBlock, 0);
        const $pos = currentEditor.state.doc.resolve(pos);
        const blockPos = $pos.depth >= 1 ? $pos.before(1) : pos;
        const blockNode = currentEditor.state.doc.nodeAt(blockPos);

        if (!blockNode) return;

        const containerRect = container.getBoundingClientRect();
        const blockRect = topLevelBlock.getBoundingClientRect();

        activeBlockRef.current = {
          pos: blockPos,
          dom: topLevelBlock,
          nodeSize: blockNode.nodeSize,
        };

        // Align handle in the left gutter
        setCoords({
          top: blockRect.top - containerRect.top + 2,
          left: blockRect.left - containerRect.left - 60,
        });
        setIsVisible(true);
      } catch {
        // Safe fallback
      }
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      if (hideTimeoutRef.current !== null) {
        window.clearTimeout(hideTimeoutRef.current);
      }
    };
  }, [containerRef, isDragging]);

  // Window drag & drop tracking: renders gutter drop indicator even outside content div
  useEffect(() => {
    if (!isDragging) return undefined;

    const handleWindowDragOver = (e: DragEvent) => {
      e.preventDefault();
      if (e.dataTransfer) {
        e.dataTransfer.dropEffect = "move";
      }

      const currentEditor = editorRef.current;
      const container = containerRef.current;
      if (!currentEditor || !container) return;

      const editorDom = currentEditor.view.dom;
      const editorRect = editorDom.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();

      // Sample horizontally inside editor at clientY
      const sampleX = Math.min(
        Math.max(e.clientX, editorRect.left + 24),
        editorRect.right - 24,
      );
      const elementAtPoint = document.elementFromPoint(sampleX, e.clientY);
      if (!elementAtPoint || !editorDom.contains(elementAtPoint)) {
        return;
      }

      let current: HTMLElement | null =
        elementAtPoint instanceof HTMLElement ? elementAtPoint : null;
      let topLevelBlock: HTMLElement | null = null;
      while (current) {
        if (current.parentElement === editorDom) {
          topLevelBlock = current;
          break;
        }
        current = current.parentElement;
      }

      if (!topLevelBlock) return;

      try {
        const pos = currentEditor.view.posAtDOM(topLevelBlock, 0);
        const $pos = currentEditor.state.doc.resolve(pos);
        const blockPos = $pos.depth >= 1 ? $pos.before(1) : pos;
        const blockNode = currentEditor.state.doc.nodeAt(blockPos);
        if (!blockNode) return;

        const blockRect = topLevelBlock.getBoundingClientRect();
        const isBelow = e.clientY > blockRect.top + blockRect.height / 2;

        const calculatedTop = isBelow
          ? blockRect.bottom - containerRect.top
          : blockRect.top - containerRect.top;

        setDropLineTop(calculatedTop);
        targetDropPosRef.current = isBelow
          ? blockPos + blockNode.nodeSize
          : blockPos;
      } catch {
        // Ignore resolution error during high-frequency drag events
      }
    };

    const handleWindowDrop = (e: DragEvent) => {
      const currentEditor = editorRef.current;
      const source = activeBlockRef.current;
      const targetPos = targetDropPosRef.current;

      if (
        currentEditor &&
        source &&
        targetPos !== null &&
        targetPos !== source.pos
      ) {
        e.preventDefault();
        try {
          const { pos: fromPos, nodeSize } = source;
          const node = currentEditor.state.doc.nodeAt(fromPos);
          if (node) {
            let tr = currentEditor.state.tr;
            if (targetPos > fromPos) {
              tr = tr.delete(fromPos, fromPos + nodeSize);
              const adjustedTarget = targetPos - nodeSize;
              tr = tr.insert(adjustedTarget, node);
            } else {
              tr = tr.insert(targetPos, node);
              const adjustedFrom = fromPos + nodeSize;
              tr = tr.delete(adjustedFrom, adjustedFrom + nodeSize);
            }
            currentEditor.view.dispatch(tr);
          }
        } catch {
          // Safe fallback
        }
      }

      cleanupDrag();
    };

    const handleWindowDragEnd = () => {
      cleanupDrag();
    };

    window.addEventListener("dragover", handleWindowDragOver);
    window.addEventListener("drop", handleWindowDrop);
    window.addEventListener("dragend", handleWindowDragEnd);

    return () => {
      window.removeEventListener("dragover", handleWindowDragOver);
      window.removeEventListener("drop", handleWindowDrop);
      window.removeEventListener("dragend", handleWindowDragEnd);
    };
  }, [isDragging, containerRef, cleanupDrag]);
  const handleAddBlock = () => {
    const currentEditor = editorRef.current;
    if (!currentEditor || !activeBlockRef.current) return;
    const { pos, nodeSize } = activeBlockRef.current;
    const insertPos = pos + nodeSize;
    currentEditor
      .chain()
      .focus()
      .insertContentAt(insertPos, { type: "paragraph" })
      .setTextSelection(insertPos + 1)
      .run();
  };

  const handleDragStart = (e: React.DragEvent<HTMLButtonElement>) => {
    const currentEditor = editorRef.current;
    if (!currentEditor || !activeBlockRef.current) return;
    const { pos, dom, nodeSize } = activeBlockRef.current;

    setIsDragging(true);

    // Set NodeSelection on the block
    const tr = currentEditor.state.tr.setSelection(
      NodeSelection.create(currentEditor.state.doc, pos),
    );
    currentEditor.view.dispatch(tr);

    // Set ProseMirror dragging state so native dropCursor & drop repositioning operate
    const slice = currentEditor.state.doc.slice(pos, pos + nodeSize);
    Object.assign(currentEditor.view, {
      dragging: {
        slice,
        move: true,
      },
    });
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/html", dom.outerHTML);
    const textContent = currentEditor.state.doc.nodeAt(pos)?.textContent ?? "";
    e.dataTransfer.setData("text/plain", textContent);

    // Dim the dragged source block and suppress browser black snapshot with a transparent image
    dom.style.opacity = "0.35";
    const transparentImage = new Image();
    transparentImage.src =
      "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
    e.dataTransfer.setDragImage(transparentImage, 0, 0);
  };

  const handleClickGrip = () => {
    const currentEditor = editorRef.current;
    if (!currentEditor || !activeBlockRef.current) return;
    const { pos } = activeBlockRef.current;
    const tr = currentEditor.state.tr.setSelection(
      NodeSelection.create(currentEditor.state.doc, pos),
    );
    currentEditor.view.dispatch(tr);
  };

  if (!editor) return null;

  return (
    <>
      {/* Gutter Drop Indicator Line (Visible even when dragging in gutter outside content div) */}
      {isDragging && dropLineTop !== null && (
        <div
          className="bg-primary pointer-events-none absolute z-50 h-0.5 rounded-full shadow-xs transition-all duration-75"
          style={{
            top: `${dropLineTop}px`,
            left: "-48px",
            right: "0px",
          }}
        >
          <div className="bg-primary ring-background absolute -top-1 -left-1 size-2.5 rounded-full ring-2" />
        </div>
      )}

      {/* Hover Gutter Actions (Plus & Grip Handle) */}
      {coords && (
        <div
          className={`editor-drag-handle-root absolute z-30 flex items-center gap-0.5 rounded-md transition-opacity duration-150 select-none ${
            isVisible || isDragging
              ? "pointer-events-auto opacity-100"
              : "pointer-events-none opacity-0"
          }`}
          style={{
            top: `${coords.top}px`,
            left: `${coords.left}px`,
          }}
          onMouseEnter={() => {
            if (hideTimeoutRef.current !== null) {
              window.clearTimeout(hideTimeoutRef.current);
              hideTimeoutRef.current = null;
            }
            setIsVisible(true);
          }}
          onMouseLeave={() => {
            if (!isDragging) {
              hideTimeoutRef.current = window.setTimeout(() => {
                setIsVisible(false);
              }, 350);
            }
          }}
        >
          {/* Plus Button: Insert block below */}
          <button
            type="button"
            onClick={handleAddBlock}
            className={`flex size-6.5 cursor-pointer items-center justify-center rounded-md transition-all ${
              isDragging
                ? "pointer-events-none opacity-0"
                : "text-muted-foreground/60 hover:text-foreground hover:bg-muted/70 opacity-100"
            }`}
            title="Thêm khối bên dưới"
          >
            <Plus className="size-4.5" />
          </button>

          {/* Grip Button: Drag to reorder */}
          <button
            type="button"
            draggable
            onDragStart={handleDragStart}
            onDragEnd={cleanupDrag}
            onClick={handleClickGrip}
            className={`flex size-6.5 cursor-grab items-center justify-center rounded-md transition-colors active:cursor-grabbing ${
              isDragging
                ? "text-primary bg-primary/10 cursor-grabbing"
                : "text-muted-foreground/60 hover:text-foreground hover:bg-muted/70"
            }`}
            title="Kéo để di chuyển vị trí khối"
          >
            <GripVertical className="size-4.5" />
          </button>
        </div>
      )}
    </>
  );
}
