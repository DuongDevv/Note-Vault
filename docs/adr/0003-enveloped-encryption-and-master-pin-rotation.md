---
status: "accepted"
date: "2026-09-30"
deciders: "ngxccc"
---

# 3. Kiến trúc mã hóa phong bì (Enveloped Encryption), Xoay vòng khóa Master PIN và Bộ nhớ đệm phiên Vault Redis

## Context

Trong thiết kế ban đầu, các ghi chú có khóa PIN được mã hóa trực tiếp bằng khóa đối xứng dẫn xuất từ Master PIN của người dùng (`vaultKey`).

Khi người dùng thay đổi Master PIN, cách mã hóa trực tiếp này gây ra các rủi ro hệ thống:

1. **Nguy cơ mất dữ liệu vĩnh viễn (Key Drift)**: Cập nhật hash PIN trong database mà không mã hóa lại các ghi chú cũ sẽ khiến toàn bộ ghi chú trước đó không bao giờ giải mã lại được.
2. **Nghẽn hiệu năng tính toán**: Mã hóa lại toàn bộ thân tài liệu đòi hỏi tải, giải mã và mã hóa lại khối lượng dữ liệu lớn của tất cả ghi chú, gây nghẽn CPU Node.js và dẫn đến HTTP 504 Gateway Timeout.
3. **Chi phí băm lặp đi lặp lại khi đọc ghi chú**: Mỗi lần người dùng mở xem ghi chú, server lại phải query hash và tính toán hàm băm bộ nhớ nặng Argon2id/scryptSync.

## Decision

Áp dụng mô hình **Mã hóa phong bì (Enveloped Encryption / KEK-DEK)** kết hợp với **Bộ nhớ đệm phiên Vault trên Redis (Redis Vault Session Caching)**:

1. **Phân cấp hai tầng khóa (Two-Tier Key Hierarchy)**:
   - **Khóa mã hóa dữ liệu (DEK - Data Encryption Key)**: Một khóa ngẫu nhiên 256-bit (`dataKey`) sinh riêng cho từng ghi chú, dùng để mã hóa và giải mã nội dung tài liệu bằng AES-256-GCM.
   - **Khóa bọc khóa (KEK - Key Encryption Key)**: Khóa dẫn xuất từ Master PIN của người dùng (`vaultKey`), dùng duy nhất để bọc và bảo vệ `dataKey` của ghi chú.
2. **Lưu trữ phong bì**:
   - Nội dung tài liệu mã hóa bằng DEK lưu tại cột `notes.content`.
   - DEK đã được bọc bằng KEK lưu tại cột `notes.encrypted_key`.
3. **Xoay vòng khóa nguyên tử (Atomic Key Rotation)**:
   - Khi đổi PIN, nội dung tài liệu (`notes.content`) được giữ nguyên hoàn toàn. Server chỉ mở bọc 32-byte `dataKey` bằng KEK cũ, bọc lại bằng KEK mới và cập nhật `encrypted_key` trong một Database Transaction duy nhất cùng với `private_pin_hash`.
4. **Bộ nhớ đệm phiên Vault qua Redis (Vault Session Caching)**:
   - Khi xác thực Master PIN thành công, server sinh `vaultToken` ngẫu nhiên và lưu KEK vào Redis với TTL 15 phút (`vault_session:<userId>:<token>`).
   - Các request đọc ghi chú sau đó sử dụng `x-vault-token` để lấy KEK từ Redis (~0.5ms), bỏ qua hoàn toàn chi phí tính toán băm Argon2id và scryptSync.
   - Khi người dùng khóa két, server gọi lệnh bất đồng bộ `UNLINK` trên Redis để hủy phiên truy cập ngay lập tức.

## Positive Consequences

- Tốc độ xoay vòng khóa tỷ lệ thuận với số lượng ghi chú thay vì kích thước nội dung, hoàn thành trong vài phần nghìn giây.
- Loại bỏ hoàn toàn chi phí băm nặng Argon2id trên mỗi request đọc ghi chú nhờ Redis session cache.
- Thao tác khóa vault lập tức thu hồi phiên làm việc trên toàn hệ thống chỉ bằng một lệnh `UNLINK`.
- Tính toàn vẹn dữ liệu được bảo đảm 100% nhờ giao dịch ACID trong PostgreSQL.

## Negative Consequences / Risks

- Cần bổ sung cột `encrypted_key` vào cơ sở dữ liệu `notes`.
- Cần duy trì service Redis phục vụ cho việc lưu trữ session token và KEK tạm thời (có cơ chế fail-open fallback qua mã PIN thô khi Redis offline).

## Explicit Tradeoffs

- **Lưu trữ KEK tạm thời trên Redis vs Chi phí CPU Database**: Chấp nhận lưu KEK trong RAM Redis với thời hạn TTL 15 phút để giảm thiểu chi phí băm Argon2id lặp lại trên PostgreSQL.
- **Thêm cột Encrypted Key vs Mã hóa trực tiếp**: Chấp nhận thêm cột `encrypted_key` để đổi lấy khả năng đổi PIN tức thì mà không cần ghi đè nội dung tài liệu.
- **Hai bước giải mã vs Một bước giải mã**: Đọc ghi chú khóa cần mở bọc DEK rồi mới giải mã nội dung, nhưng overhead thêm vào chỉ tính bằng microsecond.
