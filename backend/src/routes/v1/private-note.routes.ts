import { Router } from "express";
import { PrivateNoteController } from "../../controllers/private-note.controller";
import { authenticateJWT } from "../../middlewares/auth.middleware";
import { verifyPrivateSession } from "../../middlewares/private-pin.middleware";
import { rateLimiter } from "../../middlewares/rate-limiter.middleware";

const router = Router();

// Verify PIN (Cần JWT + Rate Limit 5 req/min)
router.post(
  "/private/verify-pin",
  authenticateJWT,
  rateLimiter(5, 60),
  (req, res) => void PrivateNoteController.verifyPin(req, res),
);

// Các API Private Notes (Bắt buộc cần cả JWT lẫn X-Private-Token)
router.get(
  "/private/notes",
  authenticateJWT,
  verifyPrivateSession,
  (req, res) => void PrivateNoteController.getPrivateNotes(req, res),
);
router.post(
  "/private/notes",
  authenticateJWT,
  verifyPrivateSession,
  (req, res) => void PrivateNoteController.createPrivateNote(req, res),
);
router.delete(
  "/private/notes/:id",
  authenticateJWT,
  verifyPrivateSession,
  (req, res) => void PrivateNoteController.deletePrivateNote(req, res),
);

export default router;
