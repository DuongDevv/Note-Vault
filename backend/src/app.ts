import type { Application, Request, Response } from "express";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import { config } from "./config/env";
import { globalErrorHandler } from "./middlewares/error.middleware";
import { ApiResponse } from "./utils/response.util";
import routes from "./routes/index";

const app: Application = express();

// Security Middlewares (HTTP Headers & CORS)
app.use(helmet());
app.use(cors());

// Body Parser Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Healthcheck Endpoint
app.get("/health", (_req: Request, res: Response) => {
  return ApiResponse.success(
    res,
    200,
    "Server Note-Vault Enterprise đang chạy ngon lành!",
    {
      environment: config.NODE_ENV,
      uptime: `${String(Math.floor(process.uptime()))} seconds`,
      timestamp: new Date().toISOString(),
    },
  );
});

// Mount Master API v1 Routes
app.use("/api/v1", routes);

// Global Error Handler Middleware
app.use(globalErrorHandler);

export default app;
