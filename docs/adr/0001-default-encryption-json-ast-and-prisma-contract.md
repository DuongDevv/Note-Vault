# 1. Mã hóa mặc định khi lưu trữ (Encryption at Rest), Cấu trúc nội dung JSON-AST và Kiến trúc Prisma Contract

Status: Accepted
Date: 2026-09-25
Deciders: ngxc

## Context

NoteVault được thiết kế với mục tiêu bảo mật tối đa cho cơ sở tri thức cá nhân và kho lưu trữ ghi chú. Các thiết kế cũ có một số nhược điểm nghiêm trọng:

1. **Mã hóa không đồng bộ**: Chỉ mã hóa riêng bảng `private_notes`, khiến các ghi chú thông thường bị lưu trữ dưới dạng văn bản thô (plaintext) trong database.
2. **Lưu trữ HTML thô**: Dữ liệu HTML thô làm tăng rủi ro tấn công XSS, khó duyệt cây cú pháp AST và cản trở khả năng mở rộng.
3. **Phân mảnh định nghĩa Database Schema**: Vừa dùng migration DDL thô vừa dùng Prisma schema, dẫn đến lệch pha schema và phải định nghĩa thủ công các interface TypeScript.

## Decision

Áp dụng mã hóa mặc định khi lưu trữ bằng thuật toán AES-256-GCM cho toàn bộ ghi chú, tuần tự hóa nội dung qua ProseMirror JSON AST, và sử dụng Prisma 8 Contract làm nguồn sự thật duy nhất (Single Source of Truth):

1. **Mô hình mã hóa mặc định**: Toàn bộ ghi chú được lưu trữ dưới dạng ciphertext trong cột `content` gồm `encryptedContent`, `iv`, và `authTag`. Ghi chú thông thường dùng khóa mã hóa dẫn xuất từ tài khoản người dùng (`userKey`); ghi chú có khóa (`is_locked: true`) dùng khóa dẫn xuất từ Master PIN (`vaultKey`).
2. **Định dạng nội dung**: Nội dung trước khi mã hóa bắt buộc là đối tượng ProseMirror / Tiptap JSON AST (`editor.getJSON()`).
3. **Quản trị cơ sở dữ liệu**: Sử dụng Prisma 8 Data Contract (`backend/src/prisma/contract.prisma`) để quản lý schema và tự động biên dịch sang contract types (`contract.json`, `contract.d.ts`).

## Positive Consequences

- Ngăn chặn hoàn toàn việc rò rỉ dữ liệu plaintext khi database bị tấn công hoặc lộ dữ liệu.
- Loại bỏ hoàn toàn nguy cơ tấn công XSS nhờ cấu trúc JSON AST.
- Loại bỏ hoàn toàn boilerplate khai báo thủ công các kiểu dữ liệu database rows trong TypeScript.
- Đơn giản hóa các thao tác CRUD xung quanh một bảng `notes` duy nhất.

## Negative Consequences / Risks

- Không thể thực hiện tìm kiếm toàn văn (Full-Text Search) trực tiếp bằng câu lệnh SQL thông thường mà phải giải mã trên bộ nhớ client.
- Dung lượng lưu trữ tăng thêm do overhead của định dạng JSON AST và mã hóa base64.

## Explicit Tradeoffs

- **Bảo mật Zero-Knowledge vs Tìm kiếm phía Server**: Chấp nhận tìm kiếm trên bộ nhớ client để tránh lộ thông tin và chỉ mục tìm kiếm văn bản thô trên database engine.
- **Cấu trúc JSON AST vs Đơn giản hóa HTML**: Chấp nhận overhead xác thực schema cây tài liệu ProseMirror để đổi lấy tính an toàn XSS và khả năng mở rộng block ghi chú.
- **Quy trình biên dịch Contract vs Schema truyền thống**: Chấp nhận bước chạy `prisma contract emit` trong pipeline kiểm tra kiểu để đảm bảo đồng bộ contract types giữa frontend và backend.
