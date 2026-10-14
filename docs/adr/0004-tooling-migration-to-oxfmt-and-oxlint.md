---
status: "accepted"
date: "2026-10-11"
deciders: "ngxccc"
---

# 4. Chuyển đổi toàn diện Tooling sang Oxfmt và Oxlint (Oxc Toolchain)

## Context

Dự án NoteVault ban đầu kết hợp ESLint/Oxlint và Prettier (`prettier-plugin-tailwindcss`) để kiểm tra chất lượng mã nguồn và định dạng file. Tuy nhiên kiến trúc cũ gặp các bất cập:

1. **Thời gian chạy định dạng chậm**: Prettier chạy trên môi trường Node.js tốn từ 2-4 giây cho mỗi lần commit hoặc chạy toàn bộ monorepo, làm chậm feedback loop của lập trình viên.
2. **Xung đột cấu hình giữa Editor và Dự án**: Neovim và VSCode thường kích hoạt Prettier mặc định với printWidth 80 cột, làm ghi đè và lệch pha chuẩn định dạng 100 cột của dự án.
3. **Phân mảnh Toolchain**: Phải duy trì nhiều công cụ và dependency riêng biệt (`prettier`, plugins, config files).

## Decision

Thay thế hoàn toàn Prettier bằng **Oxfmt** trên toàn bộ monorepo (root, backend, frontend) và sử dụng **Oxlint** với chế độ Type-Aware làm linter duy nhất:

1. **Thay thế Formatter**: Gỡ bỏ `prettier` và các plugin liên quan. Sử dụng binary `oxfmt` với file cấu hình `.oxfmtrc.json` đồng nhất (`printWidth: 100`, `semi: true`, `tabWidth: 2`).
2. **Tích hợp Git Hooks**: Cập nhật `.lintstagedrc.json` để chạy `oxfmt --write` và `oxlint --type-aware --fix` trên các file được staged.
3. **Đồng bộ hóa Editor (Neovim)**: Cập nhật `conform.nvim` ưu tiên `oxfmt` khi phát hiện `.oxfmtrc.json` và chặn fallback tự động về Prettier mặc định.

## Positive Consequences

- Tốc độ định dạng toàn bộ dự án giảm từ 3 giây xuống chỉ còn ~300 mili-giây nhờ nhân Rust đa luồng.
- Giảm thiểu dependency tree của Node.js, loại bỏ các plugin Prettier nặng nề.
- Đảm bảo tính nhất quán tuyệt đối giữa lệnh format trong editor (Neovim/VSCode) và pre-commit hook của dự án.

## Negative Consequences / Risks

- Oxfmt là công cụ mới trong hệ sinh thái Oxc, số lượng tùy biến plugin chuyên biệt (như tự động sắp xếp class Tailwind CSS) chưa phong phú như Prettier.
- Cần cài đặt cấu hình tương thích riêng cho các editor chưa hỗ trợ tự động nhận diện `oxfmt`.

## Explicit Tradeoffs

- **Tốc độ thực thi cực nhanh vs Plugin sắp xếp Tailwind**: Chấp nhận bỏ plugin sắp xếp class Tailwind của Prettier để đổi lấy tốc độ format tức thì (~300ms) trên toàn bộ 90+ file mã nguồn.
- **Áp dụng Toolchain Oxc hiện đại vs Hệ sinh thái Prettier truyền thống**: Chấp nhận chuyển đổi file cấu hình sang `.oxfmtrc.json` để đồng bộ hoàn toàn với `oxlint`.
