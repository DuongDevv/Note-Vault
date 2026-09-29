# UI Design Philosophy & Visual Language

## 1. Core Paradigm: Document-First Canvas

NoteVault operates on a **Document-First Canvas** paradigm, modeling after modern personal knowledge environments (Notion, Obsidian, Craft) rather than traditional analytical dashboard/admin portals.

- **Content as the Hero**: The writing canvas is the primary surface, not an auxiliary modal or secondary drill-down view.
- **Elimination of Fragmented Cards**: The legacy card-grid dashboard ("Thẻ ghi chú vụn vặt") is completely replaced by an uninterrupted, high-focus document surface.
- **Immediate Writing Readiness**: Clicking a note or creating a new document instantly mounts the editor at the exact caret position without page-switching friction or layout shift.
- **Subtle Context Switching**: Navigation between topics and notes occurs inline within the canvas while retaining continuous spatial orientation.

---

## 2. Monochrome Color System & Visual Restraint

The visual identity is built upon an **enterprise deep charcoal monochrome palette**, prioritizing visual calm, deep contrast, and long-session legibility.

### Color Tokens & Hex Values

| Token                  | Light Mode (`light`)   | Dark Mode (`dark`)          | Semantic Role                        |
| :--------------------- | :--------------------- | :-------------------------- | :----------------------------------- |
| **Canvas Background**  | `#ffffff`              | `#191919`                   | Primary document writing surface     |
| **Sidebar / Chrome**   | `#f7f7f5`              | `#202020`                   | Secondary hierarchical navigation    |
| **Borders & Dividers** | `rgba(0, 0, 0, 0.08)`  | `rgba(255, 255, 255, 0.08)` | Subtle structural separation         |
| **Primary Text**       | `#111827` (`zinc-900`) | `#f4f4f5` (`zinc-100`)      | Document body & primary headings     |
| **Muted Text**         | `#6b7280` (`zinc-500`) | `#a1a1aa` (`zinc-400`)      | Metadata, timestamps, breadcrumbs    |
| **Accent / Focus**     | `#18181b` (`zinc-900`) | `#fafafa` (`zinc-50`)       | Active selection, primary CTA        |
| **Destructive**        | `#ef4444` (`red-500`)  | `#f87171` (`red-400`)       | Irreversible actions (Delete, Purge) |

### Strict Visual Rules

- **No Loud Accent Colors**: Strictly avoid saturated amber, yellow, or generic bootstrap blue buttons. Focus and selection states use high-contrast monochrome inversion.
- **Destructive State Scoping**: Red / destructive tokens are reserved strictly for permanent deletion dialogs and destructive context menu items.
- **Dark Mode Elevation**: Depth is conveyed through subtle tonal background shifts (`#191919` canvas vs `#202020` sidebar) and delicate 1px borders (`border-border/60`), never heavy drop-shadows or colored glows.

---

## 3. Typography & Information Density

Typography communicates hierarchy through scale, weight, and spatial breathing room rather than color variation.

- **Primary UI & Document Body**: `Geist Sans` / `Inter` with optical kerning (`tracking-normal` to `tracking-tight`).
- **Code & Cryptographic Representation**: `JetBrains Mono` for syntax-highlighted code blocks, PIN input cells, and hashes.
- **Flat Section Headers**: Section labels (e.g. "Gần đây", "Chủ đề") use clean, flat, low-contrast typography (`text-xs font-medium text-muted-foreground`) without decorative badges or nested button noise.
- **Prose Breathing Room**: The editor canvas limits line length (`max-w-none` with responsive horizontal padding) and enforces comfortable line heights (`leading-relaxed`) to prevent reading fatigue.

---

## 4. Hierarchical Navigation & Spatial Rhythm

### Collapsible Tree-View Sidebar

- **Hierarchical Grouping**: Workspaces are structured logically into "Gần đây" (Recent notes) and "Chủ đề" (Folder/Topic trees).
- **Expandable Folders**: Topics expand inline without triggering full page reloads, showing child notes with hierarchical indentations.
- **Isolated Hover Scoping**: Hover actions (options menus, add-note triggers) are scoped using Tailwind named groups (`group/topic-item`, `group/recents-item`). Hovering over a parent container never triggers sibling or descendant button highlights.
- **Single-Click vs Right-Click**:
  - Left-click: Primary navigation and note selection.
  - Right-click (Context Menu): Quick management actions (Lock PIN, Copy title, Delete note/topic).

### Top Navigation & Breadcrumbs

- Minimalist top bar (`TopNav.tsx`) containing:
  - Sidebar toggle trigger (`⌘B`).
  - Hierarchical breadcrumbs (`Topic / Note Title`).
  - Discrete auto-save indicator ("Đã lưu", "Đang lưu...").
  - Quick action buttons (PIN Lock toggle, Options menu).

### Keyboard-First Access

- `⌘K` / `Ctrl+K`: Global spotlight search across titles, excerpts, and tags (`SearchModal.tsx`).
- `⌘B` / `Ctrl+B`: Toggle sidebar visibility for distraction-free focus.
- `Escape`: Instantly dismiss modals, menus, and context overlays.

---

## 5. Zero-Knowledge Security & Vault Representation

Security states are seamlessly integrated into the document canvas rather than isolated into separate jarring screens or modals.

### Inline PIN Unlock Canvas (`DocumentCanvas.tsx` / `UnlockCard.tsx`)

- When a locked note (`is_locked: true`) is accessed, the canvas renders an inline 6-cell PIN card:
  - Masked OTP input cells (`type="password"`, `inputMode="numeric"`).
  - Clear cryptographic messaging without revealing sensitive metadata.
  - Automatic focus management and paste handling for 6-digit codes.
- **Instant In-Memory Purge**:
  - When locking a note, client-side React state immediately zeroes out content (`content: null`) to prevent in-memory plaintext inspection via DevTools.
  - Decrypted content is only repopulated after the server confirms vault key derivation.

### Discrete Security Badges

- Locked notes in sidebar trees and search lists display a minimalist padlock icon (`Lock` from Lucide, `size-3.5`).
- No loud warning banners or alarmist red tags; security is presented as a quiet, natural property of the document.

---

## 6. Micro-Interactions & Component Standards

- **Standardized shadcn Buttons**: All raw `<button>` elements are prohibited in favor of configured shadcn `Button` variants (`sidebar`, `pill`, `subtle`, `ghost`).
- **Interactive Feedback**: Transitions operate on fast, subtle curves (`duration-150 ease-out`). Button clicks provide subtle opacity shifts (`active:scale-[0.98]`).
- **Scrollbar Invisibility**: Raw white browser scrollbars are eliminated across both sidebar and editor canvas using standard CSS rules (`scrollbar-width: none;`).
- **Context Menus**: Menus opened via right-click inherit theme tokens with high-contrast text and explicit red hover retention for destructive items (`variant="destructive"`).

---

## 7. Anti-Patterns & Prohibitions

| Banned Anti-Pattern                   | Reason for Ban                                                        | Correct Architecture Pattern                                     |
| :------------------------------------ | :-------------------------------------------------------------------- | :--------------------------------------------------------------- |
| **Nested `<button>` tags**            | Violates HTML5 spec; causes hydration crashes and broken focus traps. | Use `SidebarMenuAction` or separate sibling click targets.       |
| **Card Grid Dashboards**              | Disrupts writing continuity; treats notes as fragmented data cards.   | Notion Document-First Canvas with immediate editor focus.        |
| **Unscoped Hover Cascades**           | Moving mouse over sidebar causes random buttons to flash.             | Scoped Tailwind groups (`group/topic-item`).                     |
| **Amber/Yellow Warning Badges**       | Breaks monochrome aesthetics and causes visual noise.                 | Neutral zinc badge tokens (`bg-muted/60 text-muted-foreground`). |
| **Plaintext Content in Locked State** | Critical security leak via client memory and React DevTools.          | Optimistically nullify `content: null` upon locking.             |
| **Raw Browser Scrollbars**            | High-contrast white bars disrupt dark charcoal themes.                | Global custom utility (`scrollbar-width: none`).                 |
