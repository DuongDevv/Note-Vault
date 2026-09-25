import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import babel from "@rolldown/plugin-babel";
import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] }),
    tailwindcss(),
  ],
  resolve: {
    tsconfigPaths: true,
  },
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
    },
  },
  build: {
    chunkSizeWarningLimit: 600,
    rolldownOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes("node_modules")) {
            if (id.includes("@tiptap") || id.includes("prosemirror")) {
              return "vendor-tiptap";
            }
            if (id.includes("highlight.js") || id.includes("lowlight")) {
              return "vendor-syntax";
            }
            if (
              id.includes("react-router") ||
              id.includes("react-dom") ||
              id.includes("/react/")
            ) {
              return "vendor-react";
            }
            if (
              id.includes("@base-ui") ||
              id.includes("lucide-react") ||
              id.includes("zod")
            ) {
              return "vendor-ui";
            }
          }
          return undefined;
        },
      },
    },
  },
});
