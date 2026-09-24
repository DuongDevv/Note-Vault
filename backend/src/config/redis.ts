import { createClient } from "redis";
import { config } from "./env";

export const redisClient = createClient({
  url: `redis://${config.REDIS.HOST}:${String(config.REDIS.PORT)}`,
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
