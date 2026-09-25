import { Router } from "express";
import authRoutes from "./v1/auth.routes";
import topicRoutes from "./v1/topic.routes";
import noteRoutes from "./v1/note.routes";

const router = Router();

// Gom tất cả API v1 Routes
router.use("/", authRoutes);
router.use("/", topicRoutes);
router.use("/", noteRoutes);

export default router;
