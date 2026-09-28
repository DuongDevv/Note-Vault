import { Pool } from "pg";
import { config } from "./env";

export const dbPool = new Pool(
  config.DB.URL
    ? {
        connectionString: config.DB.URL,
        ssl: { rejectUnauthorized: false },
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000,
      }
    : {
        host: config.DB.HOST,
        port: config.DB.PORT,
        user: config.DB.USER,
        password: config.DB.PASSWORD,
        database: config.DB.NAME,
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      },
);

// Event listener
dbPool.on("connect", () => {
  console.log("Kết nối Database thành công!");
});

dbPool.on("error", (err) => {
  console.error("Lỗi kết nối Database: ", err);
  process.exit(-1);
});
