import express, { RequestHandler } from "express";
import { verifyToken } from "../middleware/authMiddleware";
import {
  divideSongIntoSections,
  generateEssayJson,
} from "../controllers/sectionController";

const router = express.Router();

router.post(
  "/divide",
  verifyToken,
  divideSongIntoSections as unknown as RequestHandler
);
router.post("/generate-json", generateEssayJson as unknown as RequestHandler);

export default router;
