import { Pool } from "pg";
import { config } from "./env";

// Tạo Connection Pool kết nối đến Postgres
export const dbPool = new Pool({
  host: config.DB.HOST,
  port: config.DB.PORT,
  user: config.DB.USER,
  password: config.DB.PASSWORD,
  database: config.DB.NAME,
  max: 20, // Tối đa 20 active connections trong Pool
  idleTimeoutMillis: 30000, // Tự động đóng Connection free sau 30 giây
  connectionTimeoutMillis: 2000,
});

// Event listener
dbPool.on("connect", () => {
  console.log("Kết nối Database thành công!");
});

dbPool.on("error", (err) => {
  console.error("Lỗi kết nối Database: ", err);
  process.exit(-1);
});
