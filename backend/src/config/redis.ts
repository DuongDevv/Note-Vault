import { createClient } from "redis";
import { config } from "./env";

const redisUrl =
  config.REDIS.URL ??
  `redis://${config.REDIS.HOST}:${String(config.REDIS.PORT)}`;
export const redisClient = createClient({
  url: redisUrl,
  socket: {
    reconnectStrategy: (retries) => {
      if (retries > 3) return new Error("Redis connection exhausted");
      return Math.min(retries * 500, 2000);
    },
  },
});

redisClient.on("error", (err) => {
  console.log("[REDIS] Lỗi kết nối Client:", err);
});

redisClient.on("connect", () => {
  console.log("[REDIS] In-Memory-Store kết nối thành công!");
});

export const connectRedis = async (): Promise<void> => {
  if (!redisClient.isOpen) {
    await redisClient.connect();
  }
};
