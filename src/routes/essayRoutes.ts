import express from "express";
import { verifyToken } from "../middleware/authMiddleware";
import {
  createEssay,
  getUserEssays,
  getEssayById,
  updateEssay,
  deleteEssay,
} from "../controllers/essayController";

const router = express.Router();

// Create a new essay
router.post("/", verifyToken, createEssay as any);

// Get all essays for the authenticated user
router.get("/user", verifyToken, getUserEssays as any);

// Get essay by ID
router.get("/:id", getEssayById);

// Update essay
router.put("/:id", verifyToken, updateEssay as any);

// Delete essay
router.delete("/:id", verifyToken, deleteEssay as any);

export default router;
