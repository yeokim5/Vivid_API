"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getQueueStats = exports.completeProcessing = exports.startProcessing = exports.leaveQueue = exports.checkRateLimit = exports.getQueueStatus = void 0;
const queueManager_1 = require("../utils/queueManager");
const uuid_1 = require("uuid");
/**
 * Check current queue status for a user
 */
const getQueueStatus = async (req, res) => {
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
        const status = queueManager_1.queueManager.getQueueStatusByItemId(queueItemId);
        if (!status) {
            return res.status(404).json({
                success: false,
                message: "Queue item not found. It may have been processed or removed.",
                data: {
                    inQueue: false,
                    position: 0,
                    totalInQueue: queueManager_1.queueManager.getQueueLength(),
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
    }
    catch (error) {
        console.error("Queue status error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to get queue status",
        });
    }
};
exports.getQueueStatus = getQueueStatus;
/**
 * Add user to queue or check if they can process immediately
 */
const checkRateLimit = async (req, res) => {
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
        if (queueManager_1.queueManager.tryStartImmediateProcessing(userId)) {
            return res.json({
                success: true,
                data: {
                    canProcess: true,
                    inQueue: false,
                    position: 0,
                    totalInQueue: queueManager_1.queueManager.getQueueLength(),
                    estimatedWaitTime: 0,
                    isProcessing: false,
                },
            });
        }
        // Add to queue (allow multiple entries per user for different tabs)
        const queueItem = {
            id: (0, uuid_1.v4)(),
            userId,
            timestamp: Date.now(),
            requestData: { title, content },
        };
        const status = queueManager_1.queueManager.addToQueue(queueItem);
        res.json({
            success: true,
            data: {
                canProcess: false,
                inQueue: true,
                queueItemId: queueItem.id, // Return the queue item ID for the frontend to track
                ...status,
            },
        });
    }
    catch (error) {
        console.error("Rate limit check error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to check rate limit",
        });
    }
};
exports.checkRateLimit = checkRateLimit;
/**
 * Remove user from queue (when they cancel)
 */
const leaveQueue = async (req, res) => {
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
        const removed = queueManager_1.queueManager.removeFromQueueByItemId(queueItemId);
        res.json({
            success: true,
            data: {
                removed,
                message: removed ? "Removed from queue" : "Not in queue",
            },
        });
    }
    catch (error) {
        console.error("Leave queue error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to leave queue",
        });
    }
};
exports.leaveQueue = leaveQueue;
/**
 * Start processing (called when user's turn arrives)
 */
const startProcessing = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "Not authenticated",
            });
        }
        const userId = req.user.id || req.user._id;
        // Check if user can process immediately (no queue)
        if (queueManager_1.queueManager.canProcess() && !queueManager_1.queueManager.isUserInQueue(userId)) {
            // User can start processing immediately
            const started = queueManager_1.queueManager.startProcessing(userId);
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
        const nextItem = queueManager_1.queueManager.getNextForProcessing();
        if (!nextItem || nextItem.userId !== userId) {
            return res.status(403).json({
                success: false,
                message: "Not your turn to process",
            });
        }
        const started = queueManager_1.queueManager.startProcessing(userId);
        if (!started) {
            return res.status(403).json({
                success: false,
                message: "Failed to start processing",
            });
        }
        res.json({
            success: true,
            data: {
                message: "Processing started",
                requestData: nextItem.requestData,
            },
        });
    }
    catch (error) {
        console.error("Start processing error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to start processing",
        });
    }
};
exports.startProcessing = startProcessing;
/**
 * Complete processing (called when essay generation is done)
 */
const completeProcessing = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "Not authenticated",
            });
        }
        const userId = req.user.id || req.user._id;
        const completed = queueManager_1.queueManager.completeProcessing(userId);
        res.json({
            success: true,
            data: {
                completed,
                message: completed ? "Processing completed" : "No active processing",
            },
        });
    }
    catch (error) {
        console.error("Complete processing error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to complete processing",
        });
    }
};
exports.completeProcessing = completeProcessing;
/**
 * Get overall queue statistics (for admin or debugging)
 */
const getQueueStats = async (req, res) => {
    try {
        const debugInfo = queueManager_1.queueManager.getDebugInfo();
        console.log("[QUEUE DEBUG]", JSON.stringify(debugInfo, null, 2));
        res.json({
            success: true,
            data: {
                queueLength: queueManager_1.queueManager.getQueueLength(),
                canProcess: queueManager_1.queueManager.canProcess(),
                allStatuses: queueManager_1.queueManager.getAllQueueStatuses(),
                debug: debugInfo,
            },
        });
    }
    catch (error) {
        console.error("Queue stats error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to get queue stats",
        });
    }
};
exports.getQueueStats = getQueueStats;
