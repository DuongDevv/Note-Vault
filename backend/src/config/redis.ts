import { createClient } from "redis";
import { config } from "./env";

const redisUrl =
  config.REDIS.URL ??
  `redis://${config.REDIS.HOST}:${String(config.REDIS.PORT)}`;

export const redisClient = createClient({
  url: redisUrl,
  socket: {
    reconnectStrategy: (retries: number) => {
      // Giới hạn số lần thử lại kết nối Redis tối đa 2 lần để tránh lặp log vô tận khi ở môi trường Cloud Standalone
      if (retries > 2) {
        return new Error("Redis connection retries exhausted");
      }
      return 500;
    },
  },
});

redisClient.on("error", (err: unknown) => {
  console.log("[REDIS] Thông báo trạng thái Client:", err);
});

redisClient.on("connect", () => {
  console.log("[REDIS] In-Memory-Store kết nối thành công!");
});

export const connectRedis = async (): Promise<void> => {
  if (!redisClient.isOpen) {
    await redisClient.connect();
  }
};
