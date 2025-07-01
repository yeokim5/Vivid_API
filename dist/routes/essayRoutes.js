"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const activityLogger_1 = require("../middleware/activityLogger");
const essayController_1 = require("../controllers/essayController");
const router = express_1.default.Router();
// Get all published essays (public route)
router.get("/", essayController_1.getAllPublishedEssays);
// Create a new essay
router.post("/", authMiddleware_1.verifyToken, essayController_1.createEssay);
// Create HTML essay
router.post("/html", authMiddleware_1.verifyToken, activityLogger_1.logEssayCreation, essayController_1.createHtmlEssay);
// Get all essays for the authenticated user
router.get("/user", authMiddleware_1.verifyToken, essayController_1.getUserEssays);
// Increment essay views
router.post("/:id/view", essayController_1.incrementEssayViews);
// Render HTML essay by ID (public route)
router.get("/:id/render", activityLogger_1.logEssayView, essayController_1.renderEssayById);
// Get essay by ID
router.get("/:id", essayController_1.getEssayById);
// Update essay
router.put("/:id", authMiddleware_1.verifyToken, essayController_1.updateEssay);
// Delete essay
router.delete("/:id", authMiddleware_1.verifyToken, essayController_1.deleteEssay);
exports.default = router;
