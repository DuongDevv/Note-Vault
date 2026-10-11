# 5. Chiến lược Giới hạn Tần suất Yêu cầu (Rate Limiting) qua Redis và Cơ chế Dự phòng Sẵn sàng (Fail-Open)

Status: Accepted
Date: 2026-10-11
Deciders: ngxc

## Context

Các API nhạy cảm của NoteVault như Đăng nhập (`/auth/login`), Đăng ký (`/auth/register`), và Xác thực Master PIN (`/profile/verify-pin`) là mục tiêu hàng đầu của các cuộc tấn công dò mật khẩu tự động (brute-force) và quét từ điển (dictionary attack).

Nếu triển khai rate limiter cục bộ trong bộ nhớ tiến trình Node.js:

1. Khi triển khai cụm đa tiến trình hoặc scale ngang nhiều container, các ngưỡng đếm bị phân mảnh và không chia sẻ được.
2. Nếu dịch vụ lưu trữ đếm bên ngoài (như Redis) gặp sự cố mạng hoặc sập container, việc cấu hình sai có thể chặn đứng toàn bộ người dùng hợp lệ truy cập hệ thống (Fail-Closed gây Denial of Service diện rộng).

## Decision

Triển khai middleware Rate Limiting sử dụng Redis làm kho lưu trữ bộ đếm tập trung theo cửa sổ trượt (sliding-window / counter với TTL) và áp dụng triệt để chiến lược **Dự phòng sẵn sàng (Fail-Open)**:

1. **Khóa phân định theo Endpoint và IP**: Sử dụng mẫu key `rate_limit:${req.path}:${ip}` để theo dõi số lượt request từ từng địa chỉ mạng.
2. **Nguyên tử hóa bộ đếm**: Sử dụng lệnh `redisClient.incr(key)` và kích hoạt `redisClient.expire(key, windowInSeconds)` ở request đầu tiên.
3. **Cơ chế Fail-Open**: Trong trường hợp Redis mất kết nối (`!redisClient.isOpen`) hoặc khối lệnh Redis throw exception, middleware sẽ ghi log cảnh báo và gọi `next()` để chuyển request đi tiếp, ưu tiên bảo vệ tính sẵn sàng của dịch vụ cốt lõi.

## Positive Consequences

- Bảo vệ vững chắc các route nhạy cảm trước các đợt brute-force PIN và mật khẩu (giới hạn 5 requests/phút).
- Tương thích tốt với kiến trúc mở rộng đa container khi chạy sau Reverse Proxy hoặc Load Balancer.
- Hệ thống không bị sập hay tê liệt hoàn toàn khi Redis tạm thời offline.

## Negative Consequences / Risks

- Trong khoảng thời gian Redis sập và hệ thống rơi vào trạng thái Fail-Open, các route nhạy cảm tạm thời mất đi lớp bảo vệ rate limit.
- Kẻ tấn công có thể giả mạo IP nếu hạ tầng Reverse Proxy phía trước không cấu hình `trust proxy` chuẩn xác.

## Explicit Tradeoffs

- **Tính sẵn sàng của dịch vụ (Availability) vs Tính bảo vệ tuyệt đối (Strict Security)**: Chấp nhận rủi ro bị brute-force trong thời gian ngắn khi Redis gặp sự cố để đảm bảo người dùng hợp lệ không bị chặn hoàn toàn khỏi hệ thống.
- **Lưu trữ Redis tập trung vs Bộ đếm RAM cục bộ**: Chấp nhận overhead I/O mạng của Redis để có khả năng chia sẻ ngưỡng giới hạn trên toàn bộ các container backend.
