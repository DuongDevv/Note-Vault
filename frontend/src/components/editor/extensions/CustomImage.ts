import { Image as BaseImage } from "@tiptap/extension-image";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { ImageNodeView } from "../ImageNodeView";

export type ImageAlignment = "left" | "center" | "right";

export interface CustomImageAttrs {
  src: string;
  alt?: string;
  title?: string;
  width?: string;
  alignment?: ImageAlignment;
}

export const CustomImage = BaseImage.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: "100%",
        parseHTML: (element) =>
          element.getAttribute("data-width") ??
          (element.style.width ? element.style.width : "100%"),
        renderHTML: (attributes: { width?: string }) => {
          const widthVal = attributes.width ?? "100%";
          return {
            "data-width": widthVal,
            style: `width: ${widthVal}`,
          };
        },
      },
      alignment: {
        default: "center",
        parseHTML: (element) => {
          const align = element.getAttribute("data-alignment");
          if (align === "left" || align === "right" || align === "center") {
            return align;
          }
          return "center";
        },
        renderHTML: (attributes: { alignment?: ImageAlignment }) => ({
          "data-alignment": attributes.alignment ?? "center",
        }),
      },
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(ImageNodeView);
  },
});
