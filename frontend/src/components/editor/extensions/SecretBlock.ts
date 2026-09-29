import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { SecretBlockNodeView } from "../SecretBlockNodeView";

export type SecretCategory =
  "api_key" | "password" | "note" | "database" | "card" | "seed" | "other";
export interface SecretBlockAttrs {
  title: string;
  value: string;
  category: SecretCategory;
  isMasked: boolean;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    secretBlock: {
      insertSecretBlock: (attrs?: Partial<SecretBlockAttrs>) => ReturnType;
    };
  }
}

export const SecretBlock = Node.create({
  name: "secretBlock",
  group: "block",
  atom: true,
  draggable: false,
  selectable: false,

  addAttributes() {
    return {
      title: {
        default: "Khối bí mật",
      },
      value: {
        default: "",
      },
      category: {
        default: "note",
      },
      isMasked: {
        default: true,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="secret-block"]',
      },
      {
        tag: 'div[data-type="api-key-block"]',
        getAttrs: () => ({ category: "api_key", title: "API Key" }),
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, { "data-type": "secret-block" }),
    ];
  },

  addCommands() {
    return {
      insertSecretBlock:
        (attrs = {}) =>
        ({ chain }) => {
          return chain()
            .insertContent({
              type: this.name,
              attrs: {
                title: attrs.title ?? "Khối bí mật",
                value: attrs.value ?? "",
                category: attrs.category ?? "note",
                isMasked: true,
              },
            })
            .run();
        },
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(SecretBlockNodeView, {
      stopEvent: () => true,
    });
  },
});
