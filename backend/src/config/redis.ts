import { createClient } from "redis";
import { config } from "./env";

const redisUrl =
  config.REDIS.URL ??
  `redis://${config.REDIS.HOST}:${String(config.REDIS.PORT)}`;

export const redisClient = createClient({
  url: redisUrl,
  socket: {
    reconnectStrategy: (retries: number) => {
      if (retries > 1) {
        return new Error("Redis connection retries exhausted");
      }
      return 500;
    },
  },
});

redisClient.on("error", (err: unknown) => {
  // Chỉ log warning thay vì làm crash app
  if (config.NODE_ENV !== "production") {
    console.log("[REDIS] Warning trạng thái Client:", err);
  }
});

redisClient.on("connect", () => {
  console.log("[REDIS] In-Memory-Store kết nối thành công!");
});

export const connectRedis = async (): Promise<void> => {
  // Nếu ở môi trường Cloud Production mà không truyền REDIS_URL hoặc REDIS_HOST riêng -> Tự bỏ qua Redis để ứng dụng chạy Standalone mượt mà
  const isCloudWithoutRedis =
    config.NODE_ENV === "production" &&
    !process.env["REDIS_URL"] &&
    (!process.env["REDIS_HOST"] ||
      process.env["REDIS_HOST"] === "localhost" ||
      process.env["REDIS_HOST"] === "127.0.0.1" ||
      process.env["REDIS_HOST"] === "redis");

  if (isCloudWithoutRedis) {
    console.log(
      "ℹ️ [REDIS] Phát hiện môi trường Cloud không có Redis riêng. Tự động chạy ở chế độ Standalone High-Performance.",
    );
    return;
  }

  try {
    if (!redisClient.isOpen) {
      await redisClient.connect();
    }
  } catch (err) {
    console.warn(
      "⚠️ [REDIS] Không thể kết nối Redis. Chuyển sang Standalone Mode:",
      err,
    );
  }
};
