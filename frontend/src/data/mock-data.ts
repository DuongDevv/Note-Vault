import type { Note, Topic } from "@/types/note";
export const INITIAL_TOPICS: Topic[] = [
  {
    id: "hoc-tap",
    name: "Học tập",
    icon: "folder",
    count: 12,
    path: "hoc-tap",
  },
  {
    id: "cong-viec",
    name: "Công việc",
    icon: "folder",
    count: 8,
    path: "cong-viec",
  },
  { id: "y-tuong", name: "Ý tưởng", icon: "folder", count: 5, path: "y-tuong" },
];

export const INITIAL_NOTES: Note[] = [
  {
    id: "note-1",
    title: "Kiến trúc Hệ thống Phân tán",
    tag: "#KỹThuật",
    topicId: "hoc-tap",
    isLocked: true,
    excerpt:
      "Mô hình Event-driven và cách xử lý tính nhất quán dữ liệu với Kafka và Raft consensus protocol...",
    date: "12 Th05",
    meta: "1.8 KB",
    metaType: "size",
  },
  {
    id: "note-2",
    title: "Từ vựng IELTS Band 8.0 & Collocations",
    tag: "#NgoạiNgữ",
    topicId: "hoc-tap",
    isLocked: false,
    excerpt:
      "Tổng hợp các cụm từ học thuật chủ đề Environment, Technology, và Society kèm ngữ cảnh sử dụng...",
    date: "10 Th05",
    meta: "48 cụm từ",
    metaType: "words",
  },
  {
    id: "note-3",
    title: "Thuật toán Cấu trúc Dữ liệu Nâng cao",
    tag: "#ThuậtToán",
    topicId: "hoc-tap",
    isLocked: false,
    excerpt:
      "Segment Tree, Fenwick Tree và các dạng bài quy hoạch động tối ưu hóa bộ nhớ O(N)...",
    date: "08 Th05",
    meta: "C++ / Python",
    metaType: "code",
  },
  {
    id: "note-4",
    title: "Machine Learning Cơ bản & Toán học",
    tag: "#AI",
    topicId: "hoc-tap",
    isLocked: false,
    excerpt:
      "Đạo hàm riêng, ma trận hiệp phương sai, Gradient Descent và hàm loss Cross-Entropy...",
    date: "05 Th05",
    meta: "Công thức",
    metaType: "formula",
  },
  {
    id: "note-5",
    title: "Ghi chú Buổi thảo luận Đồ án Tốt nghiệp",
    tag: "#ĐồÁn",
    topicId: "hoc-tap",
    isLocked: true,
    excerpt:
      "Thống nhất yêu cầu bảo mật end-to-end, tiêu chuẩn mã hóa AES-GCM-256 và lộ trình báo vệ...",
    date: "02 Th05",
    meta: "4 thành viên",
    metaType: "members",
  },
  {
    id: "note-6",
    title: "Tóm tắt Sách 'Deep Work' - Cal Newport",
    tag: "#PhátTriển",
    topicId: "hoc-tap",
    isLocked: false,
    excerpt:
      "4 quy tắc vàng để tối ưu hóa khả năng tập trung sâu trong môi trường làm việc kỹ thuật số...",
    date: "28 Th04",
    meta: "5 bài học cốt lõi",
    metaType: "lessons",
  },
];
