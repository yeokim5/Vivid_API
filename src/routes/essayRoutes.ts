import express, { RequestHandler } from "express";
import { verifyToken } from "../middleware/authMiddleware";
import {
  createEssay,
  getUserEssays,
  getEssayById,
  updateEssay,
  deleteEssay,
  renderEssayById,
  createHtmlEssay
} from "../controllers/essayController";

const router = express.Router();

// Create a new essay
router.post("/", verifyToken, createEssay as unknown as RequestHandler);

// Create HTML essay
router.post("/html", verifyToken, createHtmlEssay as unknown as RequestHandler);

// Get all essays for the authenticated user
router.get("/user", verifyToken, getUserEssays as unknown as RequestHandler);

// Render HTML essay by ID (public route)
router.get("/:id/render", renderEssayById as unknown as RequestHandler);

// Get essay by ID
router.get("/:id", getEssayById as unknown as RequestHandler);

// Update essay
router.put("/:id", verifyToken, updateEssay as unknown as RequestHandler);

// Delete essay
router.delete("/:id", verifyToken, deleteEssay as unknown as RequestHandler);

export default router;
