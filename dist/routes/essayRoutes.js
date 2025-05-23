"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const essayController_1 = require("../controllers/essayController");
const router = express_1.default.Router();
// Create a new essay
router.post("/", authMiddleware_1.verifyToken, essayController_1.createEssay);
// Create HTML essay
router.post("/create-html", authMiddleware_1.verifyToken, essayController_1.createHtmlEssay);
// Get all essays for the authenticated user
router.get("/user", authMiddleware_1.verifyToken, essayController_1.getUserEssays);
// Get essay by ID
router.get("/:id", essayController_1.getEssayById);
// Update essay
router.put("/:id", authMiddleware_1.verifyToken, essayController_1.updateEssay);
// Delete essay
router.delete("/:id", authMiddleware_1.verifyToken, essayController_1.deleteEssay);
// Render HTML essay by ID
router.get("/:id/render", essayController_1.renderEssayById);
exports.default = router;
