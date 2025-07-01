"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.queueManager = void 0;
class QueueManager {
    constructor() {
        this.queue = [];
        this.lastProcessedTime = 0;
        this.isProcessing = false;
        this.currentProcessingUserId = null;
        this.PROCESSING_INTERVAL = 60000; // 1 minute in milliseconds
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
     * Remove a user from the queue
     */
    removeFromQueue(userId) {
        const index = this.queue.findIndex((q) => q.userId === userId);
        if (index !== -1) {
            this.queue.splice(index, 1);
            console.log(`[QUEUE] User ${userId} removed from queue`);
            return true;
        }
        return false;
    }
    /**
     * Remove a specific queue item by ID
     */
    removeFromQueueByItemId(itemId) {
        const index = this.queue.findIndex((q) => q.id === itemId);
        if (index !== -1) {
            const item = this.queue[index];
            this.queue.splice(index, 1);
            console.log(`[QUEUE] Queue item ${itemId} for user ${item.userId} removed from queue`);
            return true;
        }
        return false;
    }
    /**
     * Get queue status for a specific user
     */
    getQueueStatus(userId) {
        const position = this.queue.findIndex((q) => q.userId === userId) + 1;
        const totalInQueue = this.queue.length;
        // Calculate estimated wait time
        let estimatedWaitTime = 0;
        if (position > 0) {
            const timeSinceLastProcess = Date.now() - this.lastProcessedTime;
            const timeUntilNextProcess = Math.max(0, this.PROCESSING_INTERVAL - timeSinceLastProcess);
            estimatedWaitTime =
                timeUntilNextProcess + (position - 1) * this.PROCESSING_INTERVAL;
        }
        console.log(`[QUEUE] Status for user ${userId}: position=${position}, totalInQueue=${totalInQueue}, isProcessing=${this.isProcessing}`);
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
        const timeSinceLastProcess = Date.now() - this.lastProcessedTime;
        const timeUntilNextProcess = Math.max(0, this.PROCESSING_INTERVAL - timeSinceLastProcess);
        estimatedWaitTime =
            timeUntilNextProcess + (position - 1) * this.PROCESSING_INTERVAL;
        console.log(`[QUEUE] Status for item ${itemId}: position=${position}, totalInQueue=${totalInQueue}, isProcessing=${this.isProcessing}`);
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
        return (timeSinceLastProcess >= this.PROCESSING_INTERVAL && !this.isProcessing);
    }
    /**
     * Get the next item from the queue for processing
     */
    getNextForProcessing() {
        if (this.queue.length === 0 || !this.canProcess()) {
            return null;
        }
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
            console.log(`[QUEUE] Started processing for user ${userId} (from queue)`);
            return true;
        }
        return false;
    }
    /**
     * Mark processing as completed and remove from queue
     */
    completeProcessing(userId) {
        if (!this.isProcessing || this.currentProcessingUserId !== userId) {
            return false;
        }
        // Set completion time for rate limiting (moved from start methods)
        this.lastProcessedTime = Date.now();
        // Case 1: User was first in queue
        if (this.queue[0]?.userId === userId) {
            this.queue.shift(); // Remove the first item
            this.isProcessing = false;
            this.currentProcessingUserId = null;
            console.log(`[QUEUE] Completed processing for user ${userId} (from queue)`);
            return true;
        }
        // Case 2: Immediate processing (no queue item)
        if (this.queue.length === 0 ||
            !this.queue.some((q) => q.userId === userId)) {
            this.isProcessing = false;
            this.currentProcessingUserId = null;
            console.log(`[QUEUE] Completed processing for user ${userId} (immediate)`);
            return true;
        }
        return false;
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
            if (this.queue.length > 0 && this.canProcess()) {
                const nextItem = this.queue[0];
                console.log(`[QUEUE] Ready to process next item for user ${nextItem.userId}. Queue length: ${this.queue.length}, isProcessing: ${this.isProcessing}`);
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
        console.log("[QUEUE] Processing state reset");
    }
    /**
     * Get debug information about the queue
     */
    getDebugInfo() {
        return {
            queueLength: this.queue.length,
            isProcessing: this.isProcessing,
            currentProcessingUserId: this.currentProcessingUserId,
            lastProcessedTime: this.lastProcessedTime,
            timeSinceLastProcess: Date.now() - this.lastProcessedTime,
            canProcess: this.canProcess(),
            queueItems: this.queue.map((item) => ({
                userId: item.userId,
                timestamp: item.timestamp,
                requestData: item.requestData,
            })),
        };
    }
}
// Export singleton instance
exports.queueManager = new QueueManager();
