import app from "./app";
import { config } from "./config/env";
import { connectRedis } from "./config/redis";

const PORT = config.PORT;

const startServer = async () => {
  try {
    // Kết nối Redis
    await connectRedis();

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
