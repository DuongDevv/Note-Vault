---
status: "accepted"
date: "2026-10-14"
deciders: "ngxccc"
---

# 6. Hợp đồng OpenAPI 3.1 Tự động và An toàn Kiểu dữ liệu Đầu-cuối (End-to-End Type Safety)

## Context

Trong kiến trúc Monorepo (`backend/` Express 5 và `frontend/` React 19), việc gọi API giữa client và server tiềm ẩn nguy cơ sai lệch kiểu dữ liệu:

1. **Lệch pha kiểu dữ liệu thời gian chạy (Runtime Drift)**: Khi backend thay đổi schema dữ liệu trả về (ví dụ bổ sung `hasPrivatePin`, thay đổi kiểu `content` hoặc cấu trúc envelope `ApiResponse`), phía frontend không được cảnh báo ở thời điểm build-time nếu các interface TypeScript được viết thủ công.
2. **Chi phí bảo trì wrapper thủ công**: Việc duy trì lớp wrapper `safeFetchJson` và tự viết hàm gọi `fetchAndParse` dẫn đến lặp lại code, khó kiểm soát lỗi mạng, và dễ lạm dụng ép kiểu thô (`as unknown as Note`) để qua mặt bộ kiểm tra kiểu.
3. **Thiếu đặc tả API chuẩn hóa**: Việc thiếu tài liệu OpenAPI chuẩn hóa khiến việc kiểm thử tích hợp, tạo tài liệu tương tác (Swagger/Scalar), hoặc mở rộng client đa nền tảng (Mobile, CLI) gặp nhiều rào cản.

## Decision

Triển khai kiến trúc **An toàn kiểu dữ liệu đầu-cuối (End-to-End Type Safety)** dựa trên Zod Schema, chuẩn OpenAPI 3.1 và client `openapi-fetch`:

1. **Bộ sinh đặc tả OpenAPI 3.1 từ Zod Schemas**: Xây dựng module `backend/src/openapi/spec.ts` chuyển đổi trực tiếp các Zod schema hiện có (`auth.schema.ts`, `note.schema.ts`, `topic.schema.ts`, `response.schema.ts`) thành đặc tả OpenAPI 3.1 hoàn chỉnh, bao gồm toàn bộ endpoints nghiệp vụ, định nghĩa bảo mật `bearerAuth` và `vaultTokenAuth`.
2. **Điểm cuối Contract và CLI Generator**:
   - Cung cấp CLI `bun run openapi:generate` biên dịch và xuất file tĩnh `docs/openapi.json`.
   - Mở endpoint `GET /api/v1/openapi.json` trên Express router để cung cấp schema trực tiếp tại runtime.
3. **Đồng bộ Kiểu dữ liệu tự động cho Frontend**:
   - Tích hợp công cụ `openapi-typescript` để tự động dịch `docs/openapi.json` thành 100% type definitions TypeScript tại `frontend/src/types/api.generated.d.ts`.
   - Kết hợp lệnh `gen:api` vào quy trình đồng bộ monorepo `bun run sync:types`.
4. **Client Tiêu thụ `openapi-fetch` và Chuyển đổi DTO**:
   - Xây dựng `frontend/src/services/apiClient.ts` sử dụng `openapi-fetch` với middleware tự động gán header `Authorization` (JWT) và `x-vault-token`.
   - Tách riêng `frontend/src/services/tokens.ts` nhằm triệt tiêu hoàn toàn rủi ro phụ thuộc vòng (circular import).
   - Chuẩn hóa các hàm ánh xạ thuần túy `normalizeNote` và `normalizeTopic` để chuyển đổi DTO sang domain UI model mà không cần ép kiểu không an toàn.
   - Loại bỏ hoàn toàn wrapper cũ `frontend/src/services/http.ts`.

## Positive Consequences

- **100% Compile-time Type Safety**: Mọi thay đổi về URL route, query params, request body hoặc response data trên backend đều được trình biên dịch TypeScript phát hiện ngay lập tức tại frontend.
- **Trải nghiệm lập trình vượt trội**: Autocomplete chính xác từng URL, query param và payload body với gợi ý kiểu thông minh.
- **Tài liệu API luôn tươi mới (Living Documentation)**: File `docs/openapi.json` phản ánh chính xác 100% logic xác thực Zod hiện hành, sẵn sàng kết nối với bất kỳ công cụ OpenAPI nào.
- **Zero Runtime Overhead**: `openapi-fetch` chỉ có kích thước ~6KB gzipped, không làm phình to bundle frontend so với Axios hay tRPC.

## Negative Consequences / Risks

- Quy trình build đòi hỏi một bước trung gian: khi backend thay đổi schema, lập trình viên cần chạy `bun run gen:api` (hoặc `bun run sync:types`) để cập nhật kiểu dữ liệu phía frontend.
- Cần duy trì tính đồng bộ giữa Zod schema và routing Express khi bổ sung các endpoint mới.

## Explicit Tradeoffs

- **Zod OpenAPI Generator vs tRPC**: Lựa chọn OpenAPI 3.1 thay vì tRPC nhằm duy trì bản chất REST API tiêu chuẩn của Express 5, phục vụ dễ dàng cho cả client web nội bộ lẫn các tích hợp bên thứ ba sau này.
- **Đồng bộ File tĩnh (`docs/openapi.json`) vs Sinh mã qua Network**: Sinh mã từ file JSON tĩnh trong repo thay vì gọi qua HTTP giúp pipeline CI/CD và type-check frontend chạy độc lập không phụ thuộc vào trạng thái khởi động của backend server.
