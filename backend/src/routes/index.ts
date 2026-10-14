import { Router } from "express";
import authRoutes from "./v1/auth.routes";
import topicRoutes from "./v1/topic.routes";
import noteRoutes from "./v1/note.routes";
import { buildOpenApiSpec } from "../openapi/spec";

const router = Router();

// Public OpenAPI 3.1.0 Contract
router.get("/openapi.json", (_req, res) => {
  const spec = buildOpenApiSpec();
  res.setHeader("Content-Type", "application/json");
  res.status(200).json(spec);
});

// Gom tất cả API v1 Routes
router.use("/", authRoutes);
router.use("/", topicRoutes);
router.use("/", noteRoutes);

export default router;
