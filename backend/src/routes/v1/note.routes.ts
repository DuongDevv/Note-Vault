import { Router } from "express";
import { NoteController } from "../../controllers/note.controller";
import { authenticateJWT } from "../../middlewares/auth.middleware";

const router = Router();

router.use(authenticateJWT); // Bắt buộc đăng nhập cho mọi API Note

router.get("/notes", (req, res) => void NoteController.getNotes(req, res));
router.get(
  "/notes/:id",
  (req, res) => void NoteController.getNoteById(req, res),
);
router.post("/notes", (req, res) => void NoteController.createNote(req, res));
router.put(
  "/notes/:id",
  (req, res) => void NoteController.updateNote(req, res),
);
router.delete(
  "/notes/:id",
  (req, res) => void NoteController.deleteNote(req, res),
);

export default router;
