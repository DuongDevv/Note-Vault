<div align="center">

# NoteVault Frontend Client

### Notion-Style Document Canvas & Zero-Knowledge Vault UI

[![React](https://img.shields.io/badge/React-19.2-61DAFB?logo=react&logoColor=black)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-8.3-646CFF?logo=vite&logoColor=white)](https://vitejs.dev)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS-v4.3-38B2AC?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![TipTap](https://img.shields.io/badge/TipTap-Editor_v3-2F3437)](https://tiptap.dev)

</div>

---

## Tính năng giao diện chính

1. **Notion-Style Canvas**: Trình soạn thảo văn bản TipTap tối giản, hỗ trợ code highlighting, định dạng và autosave dưới dạng JSON AST.
2. **Master PIN Modal**: Giao diện khóa bảo mật, hiển thị modal nhập mã PIN khi xem ghi chú nhạy cảm, hỗ trợ đổi mã PIN trực tiếp.
3. **Phân loại & Tagging**: Quản lý chủ đề (Topics), gắn thẻ (Tags) với bảng màu trực quan và tìm kiếm nhanh.
4. **Theme Tự Động**: Hỗ trợ Dark Mode / Light Mode.

---

## Quickstart

```bash
# Cài đặt dependencies
bun install

# Đồng bộ types từ backend
bun run --cwd .. sync:types

# Khởi động Vite dev server
bun run dev
```

Truy cập: [http://localhost:5173](http://localhost:5173)

---

## Quality Checks

```bash
bun run check-types  # Type checking
bun run lint         # Oxlint
bun run build        # Production build
```
