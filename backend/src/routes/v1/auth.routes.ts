import { Router } from "express";
import { AuthController } from "../../controllers/auth.controller";
import { authenticateJWT } from "../../middlewares/auth.middleware";
import { rateLimiter } from "../../middlewares/rate-limiter.middleware";

const router = Router();

// Public Routes (Giới hạn Rate Limit chống dò mật khẩu)
router.post(
  "/auth/register",
  rateLimiter(10, 60),
  (req, res) => void AuthController.register(req, res),
);
router.post(
  "/auth/login",
  rateLimiter(5, 60),
  (req, res) => void AuthController.login(req, res),
);

// Protected Routes (Yêu cầu JWT Token)
router.get(
  "/profile",
  authenticateJWT,
  (req, res) => void AuthController.getProfile(req, res),
);
router.post(
  "/profile/private-pin",
  authenticateJWT,
  rateLimiter(5, 60),
  (req, res) => void AuthController.setPrivatePin(req, res),
);
router.post(
  "/profile/verify-pin",
  authenticateJWT,
  rateLimiter(5, 60),
  (req, res) => void AuthController.verifyPin(req, res),
);

export default router;
