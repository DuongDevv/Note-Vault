import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { SecretBlockNodeView } from "../SecretBlockNodeView";

export interface ApiKeyBlockAttrs {
  name: string;
  key: string;
  service: string;
  isMasked: boolean;
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    apiKeyBlock: {
      insertApiKeyBlock: (attrs?: Partial<ApiKeyBlockAttrs>) => ReturnType;
    };
  }
}

/**
 * Legacy compatibility extension mapping old apiKeyBlock nodes to unified SecretBlock.
 */
export const ApiKeyBlock = Node.create({
  name: "apiKeyBlock",
  group: "block",
  atom: true,
  draggable: false,
  selectable: false,

  addAttributes() {
    return {
      title: {
        default: "API Key",
        parseHTML: (element) =>
          element.getAttribute("data-title") ??
          element.getAttribute("data-name") ??
          "API Key",
      },
      name: {
        default: "API Key",
      },
      value: {
        default: "",
        parseHTML: (element) =>
          element.getAttribute("data-value") ??
          element.getAttribute("data-key") ??
          "",
      },
      key: {
        default: "",
      },
      category: {
        default: "api_key",
      },
      isMasked: {
        default: true,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="api-key-block"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        "data-type": "secret-block",
        "data-category": "api_key",
      }),
    ];
  },

  addCommands() {
    return {
      insertApiKeyBlock:
        (attrs = {}) =>
        ({ chain }) => {
          return chain()
            .insertContent({
              type: "secretBlock",
              attrs: {
                title: attrs.name ?? "API Key",
                value: attrs.key ?? "",
                category: "api_key",
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
