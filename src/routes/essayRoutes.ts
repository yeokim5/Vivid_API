import express, { RequestHandler } from "express";
import { verifyToken } from "../middleware/authMiddleware";
import { logEssayCreation, logEssayView } from "../middleware/activityLogger";
import {
  createEssay,
  getUserEssays,
  getEssayById,
  updateEssay,
  deleteEssay,
  renderEssayById,
  createHtmlEssay,
  getAllPublishedEssays,
  incrementEssayViews,
} from "../controllers/essayController";

const router = express.Router();

// Get all published essays (public route)
router.get("/", getAllPublishedEssays as unknown as RequestHandler);

// Create a new essay
router.post("/", verifyToken, createEssay as unknown as RequestHandler);

// Create HTML essay
router.post(
  "/html",
  verifyToken,
  logEssayCreation as unknown as RequestHandler,
  createHtmlEssay as unknown as RequestHandler
);

// Get all essays for the authenticated user
router.get("/user", verifyToken, getUserEssays as unknown as RequestHandler);

// Increment essay views
router.post("/:id/view", incrementEssayViews as unknown as RequestHandler);

// Render HTML essay by ID (public route)
router.get(
  "/:id/render",
  logEssayView as unknown as RequestHandler,
  renderEssayById as unknown as RequestHandler
);

// Get essay by ID
router.get("/:id", getEssayById as unknown as RequestHandler);

// Update essay
router.put("/:id", verifyToken, updateEssay as unknown as RequestHandler);

// Delete essay
router.delete("/:id", verifyToken, deleteEssay as unknown as RequestHandler);

export default router;
