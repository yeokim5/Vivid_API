import { Request, Response } from "express";
import { AuthRequest } from "../types";
import { queueManager, QueueItem } from "../utils/queueManager";
import { v4 as uuidv4 } from "uuid";

/**
 * Check current queue status for a user
 */
export const getQueueStatus = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Not authenticated",
      });
    }

    const { queueItemId } = req.query;

    if (!queueItemId || typeof queueItemId !== "string") {
      return res.status(400).json({
        success: false,
        message: "Queue item ID is required",
      });
    }

    const status = queueManager.getQueueStatusByItemId(queueItemId);

    if (!status) {
      return res.status(404).json({
        success: false,
        message: "Queue item not found. It may have been processed or removed.",
        data: {
          inQueue: false,
          position: 0,
          totalInQueue: queueManager.getQueueLength(),
          estimatedWaitTime: 0,
          isProcessing: false,
        },
      });
    }

    res.json({
      success: true,
      data: {
        inQueue: true,
        ...status,
      },
    });
  } catch (error) {
    console.error("Queue status error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get queue status",
    });
  }
};

/**
 * Add user to queue or check if they can process immediately
 */
export const checkRateLimit = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Not authenticated",
      });
    }

    const { title, content } = req.body;
    if (!title || !content) {
      return res.status(400).json({
        success: false,
        message: "Title and content are required",
      });
    }

    const userId = req.user.id || req.user._id;

    // Try to start immediate processing (atomic check-and-set)
    if (queueManager.tryStartImmediateProcessing(userId)) {
      return res.json({
        success: true,
        data: {
          canProcess: true,
          inQueue: false,
          position: 0,
          totalInQueue: queueManager.getQueueLength(),
          estimatedWaitTime: 0,
          isProcessing: false,
        },
      });
    }

    // Add to queue (allow multiple entries per user for different tabs)
    const queueItem: QueueItem = {
      id: uuidv4(),
      userId,
      timestamp: Date.now(),
      requestData: { title, content },
    };

    const status = queueManager.addToQueue(queueItem);

    res.json({
      success: true,
      data: {
        canProcess: false,
        inQueue: true,
        queueItemId: queueItem.id, // Return the queue item ID for the frontend to track
        ...status,
      },
    });
  } catch (error) {
    console.error("Rate limit check error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to check rate limit",
    });
  }
};

/**
 * Remove user from queue (when they cancel)
 */
export const leaveQueue = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Not authenticated",
      });
    }

    const { queueItemId } = req.body;

    if (!queueItemId || typeof queueItemId !== "string") {
      return res.status(400).json({
        success: false,
        message: "Queue item ID is required",
      });
    }

    const removed = queueManager.removeFromQueueByItemId(queueItemId);

    res.json({
      success: true,
      data: {
        removed,
        message: removed ? "Removed from queue" : "Not in queue",
      },
    });
  } catch (error) {
    console.error("Leave queue error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to leave queue",
    });
  }
};

/**
 * Start processing (called when user's turn arrives)
 */
export const startProcessing = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Not authenticated",
      });
    }

    const userId = req.user.id || req.user._id;

    // Check if user can process immediately (no queue)
    if (queueManager.canProcess() && !queueManager.isUserInQueue(userId)) {
      // User can start processing immediately
      const started = queueManager.tryStartImmediateProcessing(userId);
      if (started) {
        return res.json({
          success: true,
          data: {
            message: "Processing started (immediate)",
            requestData: null,
          },
        });
      }
    }

    // Check if user is next in queue
    const nextItem = queueManager.getNextForProcessing();
    if (!nextItem || nextItem.userId !== userId) {
      console.log(
        `[QUEUE] Start processing denied for user ${userId}. Next item: ${
          nextItem ? `${nextItem.userId} (${nextItem.id})` : "none"
        }`
      );
      return res.status(403).json({
        success: false,
        message: "Not your turn to process",
        debug: {
          nextUserId: nextItem?.userId || null,
          nextItemId: nextItem?.id || null,
          currentUserId: userId,
          queueLength: queueManager.getQueueLength(),
          canProcess: queueManager.canProcess(),
          isProcessing: queueManager.isUserProcessing(userId),
        },
      });
    }

    const started = queueManager.startProcessing(userId);
    if (!started) {
      return res.status(403).json({
        success: false,
        message: "Failed to start processing",
        debug: {
          canProcess: queueManager.canProcess(),
          isProcessing: queueManager.isUserProcessing(userId),
          queueLength: queueManager.getQueueLength(),
        },
      });
    }

    res.json({
      success: true,
      data: {
        message: "Processing started",
        requestData: nextItem.requestData,
      },
    });
  } catch (error) {
    console.error("Start processing error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to start processing",
    });
  }
};

/**
 * Complete processing (called when essay generation is done)
 */
export const completeProcessing = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Not authenticated",
      });
    }

    const userId = req.user.id || req.user._id;

    // Check if user is actually processing before attempting completion
    if (!queueManager.isUserProcessing(userId)) {
      console.log(
        `[QUEUE] Complete processing skipped - user ${userId} not currently processing`
      );
      return res.json({
        success: true,
        data: {
          completed: false,
          message: "No active processing to complete",
          debug: {
            userId,
            isProcessing: queueManager.isUserProcessing(userId),
            queueLength: queueManager.getQueueLength(),
          },
        },
      });
    }

    const completed = queueManager.completeProcessing(userId);

    if (!completed) {
      console.log(`[QUEUE] Complete processing failed for user ${userId}`);
    }

    res.json({
      success: true,
      data: {
        completed,
        message: completed ? "Processing completed" : "Completion failed",
        debug: {
          userId,
          isProcessing: queueManager.isUserProcessing(userId),
          queueLength: queueManager.getQueueLength(),
        },
      },
    });
  } catch (error) {
    console.error("Complete processing error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to complete processing",
    });
  }
};

/**
 * Get queue statistics (enhanced for debugging)
 */
export const getQueueStats = async (req: Request, res: Response) => {
  try {
    const debugInfo = queueManager.getDebugInfo();

    res.json({
      success: true,
      data: {
        ...debugInfo,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Queue stats error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get queue stats",
    });
  }
};

/**
 * Debug endpoint to reset processing state (emergency use only)
 */
export const resetQueue = async (req: Request, res: Response) => {
  try {
    // Only allow in development or with specific debug key
    const debugKey = req.headers["x-debug-key"] || req.query.debugKey;
    if (
      process.env.NODE_ENV === "production" &&
      debugKey !== process.env.DEBUG_KEY
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized",
      });
    }

    queueManager.resetProcessing();

    res.json({
      success: true,
      data: {
        message: "Queue processing state reset",
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("Queue reset error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to reset queue",
    });
  }
};
