"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const queueController_1 = require("../controllers/queueController");
const router = express_1.default.Router();
// Get current queue status for the authenticated user
router.get("/status", authMiddleware_1.verifyToken, queueController_1.getQueueStatus);
// Check rate limit and add to queue if needed
router.post("/check", authMiddleware_1.verifyToken, queueController_1.checkRateLimit);
// Leave the queue
router.post("/leave", authMiddleware_1.verifyToken, queueController_1.leaveQueue);
// Start processing (when it's user's turn)
router.post("/start", authMiddleware_1.verifyToken, queueController_1.startProcessing);
// Complete processing (when essay generation is done)
router.post("/complete", authMiddleware_1.verifyToken, queueController_1.completeProcessing);
// Get queue statistics (public endpoint for debugging)
router.get("/stats", queueController_1.getQueueStats);
exports.default = router;
