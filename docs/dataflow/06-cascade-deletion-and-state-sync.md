---
title: "Dataflow 06: Note & Topic Cascade Deletion with State Sync"
docType: "feature-workflow"
status: "approved"
date: "2026-09-29"
version: "1.0.0"
---

# Dataflow 06: Note & Topic Cascade Deletion with State Sync

## 1. Overview & Architectural Intent

Quy trình xóa tài liệu và xóa chủ đề trong NoteVault, đảm bảo tính toàn vẹn dữ liệu quan hệ và trải nghiệm người dùng mượt mà:

- **Xóa ghi chú đơn lẻ**: Xóa record khỏi bảng `notes`, đồng thời cập nhật state danh sách và điều hướng URL thông minh (fallback về note đầu tiên còn lại hoặc trang chủ `/`).
- **Xóa chủ đề liên đới (Cascade Delete)**:
  - Ở tầng Database: Foreign Key `Note.topic` định nghĩa `onDelete: Cascade` trong `contract.prisma` và `schema.prisma`.
  - Khi xóa một Topic, PostgreSQL tự động dọn sạch toàn bộ các ghi chú con thuộc chủ đề đó.
- **Xác nhận an toàn (Confirm Modal)**: Ngăn chặn thao tác xóa nhầm thông qua hộp thoại `ConfirmDeleteDialog`.

---

## 2. Sequence Diagram

```mermaid
sequenceDiagram
    autonumber
    actor User as Người dùng
    participant Sidebar as AppSidebar (Context Menu)
    participant Store as useWorkspaceStore (deleteTopic)
    participant API as api.deleteTopic
    participant Backend as Backend (DELETE /topics/:id)
    participant DB as PostgreSQL (Foreign Key Cascade)

    User->>Sidebar: Click chuột phải vào Topic -> Chọn "Xóa chủ đề"
    Sidebar->>Store: deleteTopic(topicId, currentNote?.topicId)
    Store->>API: deleteTopic(topicId)
    API->>Backend: DELETE /api/v1/topics/:id

    Backend->>DB: DELETE FROM topics WHERE id = $1 AND user_id = $2
    Note over DB: ON DELETE CASCADE kích hoạt tự động
    DB->>DB: Tự động xóa sạch toàn bộ notes thuộc topicId
    DB-->>Backend: Success (Deleted Rows)
    Backend-->>API: HTTP 200 { success: true, message: "Xóa chủ đề thành công" }
    API-->>Store: DeleteResponse

    Note over Store: Đồng bộ State Client trong Zustand
    Store->>Store: set({ topics: remainingTopics, notes: remainingNotes })
    Store-->>Sidebar: return remainingNotes[0]?.id

    alt Note hiện tại vừa bị xóa theo Topic
        Sidebar->>Sidebar: navigate(remainingId ? `/notes/${remainingId}` : "/")
    end
    Sidebar-->>User: Giao diện cập nhật ngay lập tức
```

---

## 3. Database Schema Relation (Cascade Constraint)

```prisma
model Topic {
  id        String   @id @default(uuid()) @db.Uuid
  userId    String   @map("user_id") @db.Uuid
  name      String   @db.VarChar(100)
  slug      String   @db.VarChar(100)
  // ...
  notes     Note[]

  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@map("topics")
}

model Note {
  id        String   @id @default(uuid()) @db.Uuid
  userId    String   @map("user_id") @db.Uuid
  topicId   String?  @map("topic_id") @db.Uuid
  // ...
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  topic     Topic?   @relation(fields: [topicId], references: [id], onDelete: Cascade)
  @@map("notes")
}
```

---

## 4. Defense-in-Depth & Error Edge Cases

1. **User Isolation**: Câu lệnh `DELETE` luôn đi kèm điều kiện `user_id = $2` để ngăn chặn việc một người dùng gửi ID của chủ đề thuộc tài khoản khác nhằm xóa trộm.
2. **Không còn dữ liệu mồ côi (No Orphan Notes)**: Ràng buộc `onDelete: Cascade` ở mức Database Engine đảm bảo không bao giờ để lại các ghi chú có `topic_id` trỏ vào một chủ đề không còn tồn tại.
3. **Seamless Navigation**: Khi xóa ghi chú đang mở, hệ thống tự động chuyển vùng xem sang ghi chú kế tiếp hoặc canvas rỗng mà không gây lỗi 404.
