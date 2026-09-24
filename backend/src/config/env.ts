import { config as dotenvConfig } from "dotenv";
import path from "path";

// Load file .env vao process.env
dotenvConfig({ path: path.resolve(process.cwd(), ".env") });

export const config = {
  PORT: process.env["PORT"] ?? 5000,
  NODE_ENV: process.env["NODE_ENV"] ?? "development",

  // Database Config
  DB: {
    HOST: process.env["DB_HOST"] ?? "localhost",
    PORT: Number(process.env["DB_PORT"] ?? 5432),
    USER: process.env["DB_USER"] ?? "postgres",
    PASSWORD: process.env["DB_PASSWORD"] ?? "posgres_password",
    NAME: process.env["DB_NAME"] ?? "note_vault_db",
  },

  // Redis Config
  REDIS: {
    HOST: process.env["REDIS_HOST"] ?? "localhost",
    PORT: Number(process.env["REDIS_PORT"] ?? 6379),
  },

  // Security Secrets
  SECURITY: {
    JWT_SECRET:
      process.env["JWT_SECRET"] ?? "super_secret_jwt_access_key_default",
    JWT_EXPIRES_IN: 86400, // 24h in seconds
    PRIVATE_NOTE_MASTER_KEY:
      process.env["PRIVATE_NOTE_MASTER_KEY"] ??
      "default_32_bytes_key_for_aes_256",
  },
};
