<div align="center">

# NoteVault Frontend Client

### Modern Notion-Style Knowledge Canvas, Secure TipTap Editor & Zero-Knowledge Vault UI

[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-8.3-646CFF?logo=vite&logoColor=white)](https://vitejs.dev)
[![React](https://img.shields.io/badge/React-19.2-61DAFB?logo=react&logoColor=black)](https://react.dev)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS-v4.3-38B2AC?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![TipTap](https://img.shields.io/badge/TipTap-Editor_v3-2F3437)](https://tiptap.dev)
[![Zustand](https://img.shields.io/badge/Zustand-5.0-4338CA)](https://github.com/pmndrs/zustand)
[![Oxlint](https://img.shields.io/badge/Oxlint-Fast_Linter-FFA500)](https://oxc.rs)

</div>

---

## Architectural Highlights

- **Notion-Style Canvas Document Editor**:
  - Distraction-free, centered canvas document layout (`max-w-3xl`) with auto-expanding margins.
  - Powered by **TipTap v3**, supporting heading levels, code blocks with syntax highlighting via `lowlight`, tables, bullet lists, bubble menus, and rich-text shortcuts.
- **Structured JSON AST Document Persistence**:
  - Documents are serialized and autosaved as structured JSON Abstract Syntax Tree (AST), ensuring clean bidirectional rendering, template compatibility, and zero raw HTML escaping issues.
- **Client-Side Vault Security & PIN States**:
  - Secure Master PIN keypad with masked inputs, immediate PIN dialogs on locked notes, and session unlock state cached in memory.
  - Master PIN settings modal allows setting and rotating Master PINs with real-time feedback.
- **Tag System & Categorization Taxonomy**:
  - Tag creation, color palettes, multi-tag filtering, tag autocomplete, and topic grouping.
- **Adaptive Dark / Light Theming**:
  - Clean Tailwind CSS v4 styling matching Notion aesthetic, synchronized with system theme or persisted `.dark` class in `localStorage`.
- **Contract-Synchronized Types**:
  - Types exported directly from backend Prisma contracts into `src/types/backend-contract.d.ts` via monorepo build hooks (`bun run sync:types`).

---

## System Architecture

```text
frontend/
├── src/
│   ├── assets/               # Static media & icons
│   ├── components/           # UI components
│   │   ├── auth/             # Login, register & auth guards
│   │   ├── editor/           # TipTap editor, bubble menu, tag selector, toolbar
│   │   ├── layout/           # Sidebar, header, workspace layout
│   │   ├── modals/           # Master PIN verification dialog, settings modals
│   │   └── ui/               # Reusable shadcn/ui primitives & buttons
│   ├── hooks/                # Custom React hooks (editor state, debounce autosave)
│   ├── lib/                  # Utility functions (cn class combiner)
│   ├── routes/               # React Router DOM v7 route definitions
│   ├── services/             # Axios API client instances & API service calls
│   ├── stores/               # Zustand state stores (auth, notes, topics, ui)
│   ├── types/                # Synchronized backend contract & frontend typings
│   ├── utils/                # Date formatting, token persistence helpers
│   ├── App.tsx               # Root component & route provider
│   ├── main.tsx              # Application entrypoint
│   └── index.css             # Tailwind CSS v4 token definition
├── index.html                # HTML entrypoint
├── vite.config.ts            # Vite configuration with React compiler & Tailwind v4
└── package.json              # Frontend dependencies and scripts
```

---

## Key User Interfaces & Workflows

1. **Workspace Document Canvas**:
   - Clean, centered document container with inline editable title, topic selector, tag chips, and auto-saving indicator.
2. **Master PIN & Locked Note Security**:
   - Notes flagged as private show locked place-holders until user authenticates with their 6-digit Master PIN.
   - Master PIN verification modal triggers on demand and securely reveals document contents.
3. **Sidebar & Topic Management**:
   - Instant search with hotkey navigation, topic tree, tags list, and quick note creation.
4. **Theme Switcher**:
   - Effortless toggle between clean light theme and low-contrast dark canvas.

---

## Quickstart

### Prerequisites

- **Bun** `v1.4+` (or Node.js 20+)
- **Backend API Server** running at `http://localhost:5000`

### Setup & Run

```bash
# 1. Install dependencies
bun install

# 2. Synchronize contract typings from backend (run from root or backend)
bun run --cwd .. sync:types

# 3. Start Vite development server
bun run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## Code Quality & Verification

```bash
# Type check TypeScript
bun run check-types

# Run Oxlint linter
bun run lint

# Build production bundle
bun run build
```
