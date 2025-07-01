"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.queueManager = void 0;
class QueueManager {
    constructor() {
        this.queue = [];
        this.lastProcessedTime = Date.now() - 68000; // Initialize to allow immediate first processing
        this.isProcessing = false;
        this.currentProcessingUserId = null;
        this.currentProcessingItemId = null; // Track specific item being processed
        this.PROCESSING_INTERVAL = 68000; // 1 minute + 8 seconds buffer in milliseconds
        // Start the queue processor
        this.startQueueProcessor();
    }
    /**
     * Add a user to the queue
     */
    addToQueue(item) {
        // Check if this specific queue item (by ID) is already in queue
        const existingIndex = this.queue.findIndex((q) => q.id === item.id);
        if (existingIndex !== -1) {
            // Update existing queue item
            this.queue[existingIndex] = item;
            console.log(`[QUEUE] Updated existing queue item ${item.id} for user ${item.userId}`);
            const status = this.getQueueStatusByItemId(item.id);
            if (!status) {
                throw new Error("Failed to get status for updated queue item");
            }
            return status;
        }
        this.queue.push(item);
        console.log(`[QUEUE] User ${item.userId} added to queue with ID ${item.id}. Position: ${this.queue.length}, Total in queue: ${this.queue.length}`);
        const status = this.getQueueStatusByItemId(item.id);
        if (!status) {
            throw new Error("Failed to get status for newly added queue item");
        }
        return status;
    }
    /**
     * Remove user from queue (by userId - removes ALL items for this user)
     */
    removeFromQueue(userId) {
        const initialLength = this.queue.length;
        this.queue = this.queue.filter((item) => item.userId !== userId);
        const removed = this.queue.length < initialLength;
        if (removed) {
            console.log(`[QUEUE] Removed all queue items for user ${userId}`);
        }
        return removed;
    }
    /**
     * Remove specific queue item by ID
     */
    removeFromQueueByItemId(itemId) {
        const initialLength = this.queue.length;
        this.queue = this.queue.filter((item) => item.id !== itemId);
        const removed = this.queue.length < initialLength;
        if (removed) {
            console.log(`[QUEUE] Removed queue item ${itemId}`);
        }
        return removed;
    }
    /**
     * Get queue status for a specific user (gets the first item for this user)
     */
    getQueueStatus(userId) {
        const position = this.queue.findIndex((q) => q.userId === userId) + 1;
        const totalInQueue = this.queue.length;
        // Calculate estimated wait time
        let estimatedWaitTime = 0;
        if (position > 0) {
            if (this.isProcessing) {
                // Someone is currently processing - don't show countdown, just indicate waiting
                estimatedWaitTime = -1; // Special value meaning "waiting for current processing"
            }
            else {
                // No one is processing - calculate based on rate limit
                const timeSinceLastProcess = Date.now() - this.lastProcessedTime;
                const timeUntilNextProcess = Math.max(0, this.PROCESSING_INTERVAL - timeSinceLastProcess);
                estimatedWaitTime =
                    timeUntilNextProcess + (position - 1) * this.PROCESSING_INTERVAL;
            }
        }
        console.log(`[QUEUE] Status for user ${userId}: position=${position}, totalInQueue=${totalInQueue}, isProcessing=${this.isProcessing}, estimatedWait=${estimatedWaitTime}ms`);
        return {
            position: position > 0 ? position : 0,
            totalInQueue,
            estimatedWaitTime,
            isProcessing: this.isProcessing,
        };
    }
    /**
     * Get queue status for a specific queue item by ID
     */
    getQueueStatusByItemId(itemId) {
        const itemIndex = this.queue.findIndex((q) => q.id === itemId);
        // If item not found, return null to indicate it's no longer in queue
        if (itemIndex === -1) {
            console.log(`[QUEUE] Item ${itemId} not found in queue`);
            return null;
        }
        const position = itemIndex + 1;
        const totalInQueue = this.queue.length;
        // Calculate estimated wait time
        let estimatedWaitTime = 0;
        if (this.isProcessing) {
            // Someone is currently processing - don't show countdown, just indicate waiting
            // We'll use a special value to indicate "waiting for current processing to complete"
            estimatedWaitTime = -1; // Special value meaning "waiting for current processing"
            console.log(`[QUEUE] Item ${itemId} waiting for current processing to finish.`);
        }
        else {
            // No one is processing - calculate based on rate limit
            const timeSinceLastProcess = Date.now() - this.lastProcessedTime;
            const timeUntilNextProcess = Math.max(0, this.PROCESSING_INTERVAL - timeSinceLastProcess);
            estimatedWaitTime =
                timeUntilNextProcess + (position - 1) * this.PROCESSING_INTERVAL;
        }
        console.log(`[QUEUE] Status for item ${itemId}: position=${position}, totalInQueue=${totalInQueue}, isProcessing=${this.isProcessing}, estimatedWait=${estimatedWaitTime}ms`);
        return {
            position,
            totalInQueue,
            estimatedWaitTime,
            isProcessing: this.isProcessing,
        };
    }
    /**
     * Check if processing is currently allowed (rate limit check)
     */
    canProcess() {
        const timeSinceLastProcess = Date.now() - this.lastProcessedTime;
        // Use a slightly lower threshold (67 seconds instead of 68) for more forgiving timing
        const EFFECTIVE_INTERVAL = this.PROCESSING_INTERVAL - 1000; // 67 seconds
        const canProcessNow = timeSinceLastProcess >= EFFECTIVE_INTERVAL && !this.isProcessing;
        // Add debug logging for timing issues
        if (!canProcessNow && this.queue.length > 0) {
            console.log(`[QUEUE] canProcess=false: timeSince=${timeSinceLastProcess}ms, required=${EFFECTIVE_INTERVAL}ms, isProcessing=${this.isProcessing}`);
        }
        return canProcessNow;
    }
    /**
     * Get the next item from the queue for processing
     */
    getNextForProcessing() {
        if (this.queue.length === 0) {
            console.log(`[QUEUE] getNextForProcessing: No items in queue`);
            return null;
        }
        if (!this.canProcess()) {
            const timeSinceLastProcess = Date.now() - this.lastProcessedTime;
            const EFFECTIVE_INTERVAL = this.PROCESSING_INTERVAL - 1000; // 67 seconds
            console.log(`[QUEUE] getNextForProcessing: canProcess=false, timeSince=${timeSinceLastProcess}ms, required=${EFFECTIVE_INTERVAL}ms`);
            return null;
        }
        console.log(`[QUEUE] getNextForProcessing: Returning item ${this.queue[0].id} for user ${this.queue[0].userId}`);
        return this.queue[0]; // Return first item without removing it yet
    }
    /**
     * Try to start processing immediately (atomic check-and-set)
     */
    tryStartImmediateProcessing(userId) {
        // Atomic check: can process AND not currently processing AND no queue
        if (this.canProcess() && !this.isProcessing && this.queue.length === 0) {
            this.isProcessing = true;
            this.currentProcessingUserId = userId;
            this.currentProcessingItemId = null; // No queue item for immediate processing
            console.log(`[QUEUE] Started immediate processing for user ${userId}`);
            return true;
        }
        return false;
    }
    /**
     * Mark processing as started (for queued items)
     */
    startProcessing(userId) {
        // Case 1: User is first in queue
        const item = this.queue[0];
        if (item &&
            item.userId === userId &&
            this.canProcess() &&
            !this.isProcessing) {
            this.isProcessing = true;
            this.currentProcessingUserId = userId;
            this.currentProcessingItemId = item.id; // Track specific item being processed
            console.log(`[QUEUE] Started processing for user ${userId} with item ${item.id} (from queue)`);
            return true;
        }
        return false;
    }
    /**
     * Mark processing as completed and remove from queue
     */
    completeProcessing(userId) {
        if (!this.isProcessing || this.currentProcessingUserId !== userId) {
            console.log(`[QUEUE] Complete processing failed: isProcessing=${this.isProcessing}, currentUser=${this.currentProcessingUserId}, requestUser=${userId}`);
            return false;
        }
        // Set completion time for rate limiting
        this.lastProcessedTime = Date.now();
        console.log(`[QUEUE] Setting lastProcessedTime to ${this.lastProcessedTime} for user ${userId}`);
        // Case 1: Processing a specific queue item
        if (this.currentProcessingItemId) {
            const itemId = this.currentProcessingItemId;
            const removed = this.removeFromQueueByItemId(this.currentProcessingItemId);
            this.isProcessing = false;
            this.currentProcessingUserId = null;
            this.currentProcessingItemId = null;
            console.log(`[QUEUE] Completed processing for user ${userId} with item ${itemId} (removed: ${removed})`);
            return true;
        }
        // Case 2: Immediate processing (no queue item)
        this.isProcessing = false;
        this.currentProcessingUserId = null;
        this.currentProcessingItemId = null;
        console.log(`[QUEUE] Completed processing for user ${userId} (immediate processing)`);
        return true;
    }
    /**
     * Get all queue statuses (for broadcasting updates)
     */
    getAllQueueStatuses() {
        const statuses = {};
        this.queue.forEach((item) => {
            statuses[item.userId] = this.getQueueStatus(item.userId);
        });
        return statuses;
    }
    /**
     * Queue processor that runs every few seconds to check for ready items
     */
    startQueueProcessor() {
        setInterval(() => {
            if (this.queue.length > 0 && this.canProcess() && !this.isProcessing) {
                const nextItem = this.queue[0];
                console.log(`[QUEUE] Ready to process next item for user ${nextItem.userId} (item ${nextItem.id}). Queue length: ${this.queue.length}, isProcessing: ${this.isProcessing}`);
                // Note: The actual processing start is handled by the frontend calling /queue/start
                // This is just for monitoring that someone is ready
            }
        }, 10000); // Check every 10 seconds (reduced frequency)
    }
    /**
     * Get queue length
     */
    getQueueLength() {
        return this.queue.length;
    }
    /**
     * Check if user is in queue
     */
    isUserInQueue(userId) {
        return this.queue.some((q) => q.userId === userId);
    }
    /**
     * Check if a specific user is currently processing
     */
    isUserProcessing(userId) {
        return this.isProcessing && this.currentProcessingUserId === userId;
    }
    /**
     * Reset processing state (for error recovery)
     */
    resetProcessing() {
        this.isProcessing = false;
        this.currentProcessingUserId = null;
        this.currentProcessingItemId = null;
        console.log("[QUEUE] Processing state reset");
    }
    /**
     * Clean up stale queue items (items older than 10 minutes)
     */
    cleanupStaleItems() {
        const now = Date.now();
        const staleThreshold = 10 * 60 * 1000; // 10 minutes
        const initialLength = this.queue.length;
        this.queue = this.queue.filter((item) => {
            const age = now - item.timestamp;
            return age < staleThreshold;
        });
        const removed = initialLength - this.queue.length;
        if (removed > 0) {
            console.log(`[QUEUE] Cleaned up ${removed} stale queue items`);
        }
    }
    /**
     * Get debug information about the queue
     */
    getDebugInfo() {
        return {
            queueLength: this.queue.length,
            isProcessing: this.isProcessing,
            currentProcessingUserId: this.currentProcessingUserId,
            currentProcessingItemId: this.currentProcessingItemId,
            lastProcessedTime: this.lastProcessedTime,
            timeSinceLastProcess: Date.now() - this.lastProcessedTime,
            canProcess: this.canProcess(),
            queueItems: this.queue.map((item) => ({
                id: item.id,
                userId: item.userId,
                timestamp: item.timestamp,
                age: Date.now() - item.timestamp,
                requestData: item.requestData,
            })),
        };
    }
}
// Export singleton instance
exports.queueManager = new QueueManager();
// Cleanup stale items every 5 minutes
setInterval(() => {
    exports.queueManager.cleanupStaleItems();
}, 5 * 60 * 1000);
