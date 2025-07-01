import express, { RequestHandler } from "express";
import { verifyToken } from "../middleware/authMiddleware";
import {
  getQueueStatus,
  checkRateLimit,
  leaveQueue,
  startProcessing,
  completeProcessing,
  getQueueStats,
  resetQueue,
} from "../controllers/queueController";

const router = express.Router();

// Get current queue status for the authenticated user
router.get("/status", verifyToken, getQueueStatus as unknown as RequestHandler);

// Check rate limit and add to queue if needed
router.post("/check", verifyToken, checkRateLimit as unknown as RequestHandler);

// Leave the queue
router.post("/leave", verifyToken, leaveQueue as unknown as RequestHandler);

// Start processing (when it's user's turn)
router.post(
  "/start",
  verifyToken,
  startProcessing as unknown as RequestHandler
);

// Complete processing (when essay generation is done)
router.post(
  "/complete",
  verifyToken,
  completeProcessing as unknown as RequestHandler
);

// Get queue statistics (public endpoint for debugging)
router.get("/stats", getQueueStats as unknown as RequestHandler);

// Debug endpoint to reset processing state (emergency use only)
router.post("/reset", resetQueue as unknown as RequestHandler);

export default router;
