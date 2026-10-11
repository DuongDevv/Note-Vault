# 2. Khối bảo mật ẩn thông tin, Thành phần thông tin định danh và Cơ chế tự động xóa Clipboard

Status: Accepted
Date: 2026-09-29
Deciders: ngxc

## Context

Lập trình viên và người làm kỹ thuật thường xuyên lưu trữ các thông tin bảo mật vận hành như API keys, biến môi trường, chuỗi kết nối database, webhook secrets trong tài liệu và ghi chú công việc.

Mặc dù toàn bộ ghi chú có thể được bảo vệ bằng Master PIN (`is_locked: true`), nhưng khi ghi chú đã được mở khóa, các secret này sẽ hiển thị dạng văn bản thô trên màn hình soạn thảo. Điều này dẫn đến các rủi ro:

1. **Rò rỉ khi chia sẻ màn hình hoặc nhìn trộm**: Làm việc tại nơi công cộng hoặc livestream/chia sẻ màn hình họp trực tuyến dễ làm lộ các secret nhạy cảm.
2. **Khó khăn khi sao chép và dễ thao tác nhầm**: Việc bôi đen secret dài bằng chuột dễ bị thiếu ký tự hoặc vô tình sửa đổi giá trị.
3. **Lưu vết trên bộ nhớ Clipboard**: Secret sau khi sao chép tồn tại vô thời hạn trong lịch sử clipboard của hệ điều hành.

## Decision

Xây dựng Tiptap Node extension tùy chỉnh (`SecretBlock`) được render qua React NodeView với trạng thái mặc định được che phủ (masked) và tiện ích tự động xóa clipboard tạm thời:

1. **Cấu trúc ProseMirror Node**: Mô hình hóa secret dưới dạng node tài liệu chứa các thuộc tính (`label`, `value`, `environment`, `service`).
2. **Trạng thái che phủ mặc định**: Hiển thị token bằng các chấm bảo mật (`••••••••••••••••••••`) cho đến khi người dùng chủ động bấm xem.
3. **Sao chép một chạm**: Cung cấp nút copy tức thì mà không cần người dùng phải mở hiển thị secret hoặc bôi đen văn bản.
4. **Xóa Clipboard tạm thời**: Tự động dọn dẹp và ghi đè dữ liệu secret trong clipboard hệ điều hành sau đúng 30 giây.

## Positive Consequences

- Không bị lộ secret khi chia sẻ màn hình hoặc làm việc tại nơi công cộng.
- Trải nghiệm làm việc mượt mà với tính năng sao chép thông tin chỉ bằng một cú nhấp chuột.
- Giảm thiểu rủi ro tấn công đọc trộm lịch sử clipboard của hệ điều hành.
- Cấu trúc tài liệu sạch sẽ, tương thích 100% với cơ chế mã hóa AES-256-GCM mặc định mà không cần đổi database schema.

## Negative Consequences / Risks

- Chi phí hiệu năng khi render React NodeView DOM cao hơn so với định dạng Markdown thông thường.
- Secret đã giải mã vẫn tồn tại tạm thời trong bộ nhớ heap của client khi mở tài liệu; việc giải phóng hoàn toàn đòi hỏi phải khóa tài liệu hoặc unmount canvas.

## Explicit Tradeoffs

- **Chi phí NodeView Component vs Tính đơn giản của Markdown**: Chấp nhận overhead render DOM của React NodeView để có tính năng toggle che/mở và nút copy tiện lợi.
- **Bảo mật bộ nhớ Client vs Tính khả dụng**: Cho phép secret tồn tại trong bộ nhớ RAM client khi đang xem tài liệu để đảm bảo trải nghiệm chỉnh sửa mượt mà.
- **Độ tin cậy của Timer tự xóa Clipboard vs Quyền hệ điều hành**: Tự động xóa clipboard phụ thuộc vào quyền Permissions API của trình duyệt và trạng thái focus của tab (best-effort clearance).
