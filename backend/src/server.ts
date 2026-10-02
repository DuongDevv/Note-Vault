import app from "./app";
import { dbPool } from "./config/database";
import { config } from "./config/env";
import { connectRedis } from "./config/redis";

const PORT = config.PORT;

async function ensureTablesExist() {
  try {
    await dbPool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        display_name TEXT NOT NULL,
        private_pin_hash TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS topics (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        slug TEXT NOT NULL,
        icon TEXT NOT NULL DEFAULT 'folder',
        color TEXT NOT NULL DEFAULT '#000000',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT topics_user_id_slug_key UNIQUE (user_id, slug)
      );

      CREATE TABLE IF NOT EXISTS notes (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        topic_id TEXT REFERENCES topics(id) ON DELETE SET NULL,
        title TEXT NOT NULL,
        content TEXT,
        is_locked BOOLEAN NOT NULL DEFAULT FALSE,
        is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
        tags TEXT[] NOT NULL DEFAULT '{}',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    console.log("✅ [DATABASE] Schema tables verified and ready!");
  } catch (err) {
    console.error("⚠️ [DATABASE] Table verification error:", err);
  }
}

const startServer = async () => {
  try {
    // Tự động kiểm tra & tạo bảng trên Database Cloud nếu chưa có
    await ensureTablesExist();

    // Kết nối Redis với Graceful Fallback cho Cloud Environments
    try {
      await connectRedis();
    } catch (redisErr) {
      console.warn(
        "⚠️ [REDIS] Không thể kết nối Redis Cache, hệ thống chuyển sang chế độ Standalone:",
        redisErr,
      );
    }

    // Khởi động HTTP Server
    app.listen(PORT, () => {
      console.log(`================================================`);
      console.log(`Server Note-Vault Enterprise running on Port: ${PORT}`);
      console.log(`Healthcheck: http://localhost:${PORT}/health`);
      console.log(`================================================`);
    });
  } catch (error) {
    console.error("Thất bại khi khởi động hệ thống:", error);
    process.exit(1);
  }
};

void startServer();
