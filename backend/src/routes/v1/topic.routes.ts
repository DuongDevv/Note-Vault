import { Router } from "express";
import { TopicController } from "../../controllers/topic.controller";
import { authenticateJWT } from "../../middlewares/auth.middleware";

const router = Router();

router.use(authenticateJWT); // Bắt buộc đăng nhập cho toàn bộ API Topic

router.get("/topics", (req, res) => void TopicController.getTopics(req, res));
router.post(
  "/topics",
  (req, res) => void TopicController.createTopic(req, res),
);
router.delete(
  "/topics/:id",
  (req, res) => void TopicController.deleteTopic(req, res),
);

export default router;
