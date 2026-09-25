import { http, HttpResponse } from "msw";
import { INITIAL_NOTES, INITIAL_TOPICS } from "@/data/mock-data";
import type { Note, Topic } from "@/types/note";

// In-memory data store for MSW worker session
let topics: Topic[] = [...INITIAL_TOPICS];
let notes: Note[] = [...INITIAL_NOTES];

export const handlers = [
  // GET /api/topics
  http.get("/api/topics", () => {
    return HttpResponse.json(topics);
  }),

  // POST /api/topics
  http.post<never, Partial<Topic>>("/api/topics", async ({ request }) => {
    const body = await request.json();
    if (!body.name) {
      return new HttpResponse("Tên chủ đề là bắt buộc", { status: 400 });
    }

    const id = body.name
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/đ/g, "d")
      .replace(/[^a-z0-9]+/g, "-");

    const newTopic: Topic = {
      id: id || `topic-${Date.now()}`,
      name: body.name.trim(),
      icon: "folder",
      count: 0,
      path: id,
    };

    topics.push(newTopic);
    return HttpResponse.json(newTopic, { status: 201 });
  }),

  // GET /api/notes
  http.get("/api/notes", ({ request }) => {
    const url = new URL(request.url);
    const topicId = url.searchParams.get("topicId");
    const query = url.searchParams.get("q")?.toLowerCase().trim();

    let result = notes;
    if (topicId) {
      result = result.filter((n) => n.topicId === topicId);
    }
    if (query) {
      result = result.filter(
        (n) =>
          n.title.toLowerCase().includes(query) ||
          n.tag.toLowerCase().includes(query) ||
          n.excerpt.toLowerCase().includes(query),
      );
    }

    return HttpResponse.json(result);
  }),

  // POST /api/notes
  http.post<never, Partial<Note>>("/api/notes", async ({ request }) => {
    const body = await request.json();
    if (!body.title) {
      return new HttpResponse("Tiêu đề ghi chú là bắt buộc", { status: 400 });
    }

    const newNote: Note = {
      id: `note-${Date.now()}`,
      title: body.title.trim(),
      tag: body.tag?.startsWith("#") ? body.tag : `#${body.tag ?? "GhiChú"}`,
      topicId: body.topicId ?? "hoc-tap",
      isLocked: Boolean(body.isLocked),
      excerpt:
        body.excerpt?.trim() ??
        "Nội dung ghi chú mới được khởi tạo và lưu an toàn trong NoteVault...",
      date: "Hôm nay",
      meta: body.meta ?? "Mới tạo",
      metaType: body.metaType ?? "size",
    };

    notes = [newNote, ...notes];

    // Increment topic count
    topics = topics.map((t) =>
      t.id === newNote.topicId ? { ...t, count: t.count + 1 } : t,
    );

    return HttpResponse.json(newNote, { status: 201 });
  }),

  // PATCH /api/notes/:id/toggle-lock
  http.patch("/api/notes/:id/toggle-lock", ({ params }) => {
    const { id } = params;
    const note = notes.find((n) => n.id === id);
    if (!note) {
      return new HttpResponse("Không tìm thấy ghi chú", { status: 404 });
    }

    note.isLocked = !note.isLocked;
    return HttpResponse.json(note);
  }),

  // DELETE /api/notes/:id
  http.delete("/api/notes/:id", ({ params }) => {
    const { id } = params;
    const target = notes.find((n) => n.id === id);
    if (!target) {
      return new HttpResponse("Không tìm thấy ghi chú", { status: 404 });
    }

    notes = notes.filter((n) => n.id !== id);
    // Decrement topic count
    topics = topics.map((t) =>
      t.id === target.topicId ? { ...t, count: Math.max(0, t.count - 1) } : t,
    );

    return HttpResponse.json({ success: true, id });
  }),
];
