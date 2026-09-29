import { Extension, type Editor, type Range } from "@tiptap/core";
import { Suggestion, type SuggestionOptions } from "@tiptap/suggestion";
import { ReactRenderer } from "@tiptap/react";
import {
  SlashCommandList,
  SLASH_COMMAND_ITEMS,
  type CommandItem,
  type SlashCommandListRef,
} from "../slash-command/SlashCommandList";

export const SlashCommand = Extension.create({
  name: "slashCommand",

  addOptions() {
    return {
      suggestion: {
        char: "/",
        command: ({
          editor,
          range,
          props,
        }: {
          editor: Editor;
          range: Range;
          props: CommandItem;
        }) => {
          props.command({ editor, range });
        },
      } as Partial<SuggestionOptions<CommandItem>>,
    };
  },

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        ...this.options.suggestion,
        items: ({ query }: { query: string }) => {
          const normalized = query.toLowerCase().trim();
          if (!normalized) return SLASH_COMMAND_ITEMS;
          return SLASH_COMMAND_ITEMS.filter((item) => {
            if (item.title.toLowerCase().includes(normalized)) return true;
            if (
              item.keywords?.some((k) => k.toLowerCase().includes(normalized))
            ) {
              return true;
            }
            return false;
          });
        },
        render: () => {
          let component: ReactRenderer<SlashCommandListRef> | null = null;
          let popupEl: HTMLDivElement | null = null;
          let removeClickListener: (() => void) | null = null;

          const destroyPopup = () => {
            if (removeClickListener) {
              removeClickListener();
              removeClickListener = null;
            }
            if (popupEl?.parentElement) {
              popupEl.parentElement.removeChild(popupEl);
            }
            component?.destroy();
            component = null;
            popupEl = null;
          };

          const updatePosition = (rect: DOMRect | null | undefined) => {
            if (!rect || !popupEl) return;

            const viewportHeight = window.innerHeight;
            const viewportWidth = window.innerWidth;
            const menuHeight = popupEl.offsetHeight || 300;
            const menuWidth = popupEl.offsetWidth || 272;

            const spaceBelow = viewportHeight - rect.bottom;
            const spaceAbove = rect.top;

            // If not enough space below and more space above, flip upwards
            if (spaceBelow < menuHeight + 16 && spaceAbove > spaceBelow) {
              popupEl.style.top = "auto";
              popupEl.style.bottom = `${String(Math.max(8, viewportHeight - rect.top + 6))}px`;
            } else {
              popupEl.style.bottom = "auto";
              popupEl.style.top = `${String(Math.min(viewportHeight - menuHeight - 8, rect.bottom + 6))}px`;
            }

            // Clamp horizontal position within viewport
            let left = rect.left;
            if (left + menuWidth > viewportWidth - 16) {
              left = viewportWidth - menuWidth - 16;
            }
            popupEl.style.left = `${String(Math.max(16, left))}px`;
          };

          return {
            onStart: (props) => {
              component = new ReactRenderer(SlashCommandList, {
                props,
                editor: props.editor,
              });

              popupEl = document.createElement("div");
              popupEl.className = "fixed z-50 transition-all duration-75";
              popupEl.appendChild(component.element);
              document.body.appendChild(popupEl);

              updatePosition(props.clientRect?.());
              requestAnimationFrame(() => {
                updatePosition(props.clientRect?.());
              });

              const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
                if (
                  popupEl &&
                  e.target instanceof Node &&
                  !popupEl.contains(e.target)
                ) {
                  destroyPopup();
                }
              };

              window.addEventListener("mousedown", handleOutsideClick, true);
              window.addEventListener("touchstart", handleOutsideClick, true);
              removeClickListener = () => {
                window.removeEventListener(
                  "mousedown",
                  handleOutsideClick,
                  true,
                );
                window.removeEventListener(
                  "touchstart",
                  handleOutsideClick,
                  true,
                );
              };
            },

            onUpdate: (props) => {
              component?.updateProps(props);
              updatePosition(props.clientRect?.());
            },

            onKeyDown: (props) => {
              if (props.event.key === "Escape") {
                destroyPopup();
                return true;
              }
              return component?.ref?.onKeyDown(props) ?? false;
            },

            onExit: () => {
              destroyPopup();
            },
          };
        },
      }),
    ];
  },
});
