import app from "./app";
import { config } from "./config/env";
import { connectRedis } from "./config/redis";

const PORT = config.PORT;

const startServer = async () => {
  try {
    // Kết nối Redis
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
      console.log(`Server Note-Vault Enterprise running on Port: ${PORT}`);
      console.log(`Healthcheck: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error("Thất bại khi khởi động hệ thống:", error);
    process.exit(1);
  }
};

void startServer();
