"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const sectionController_1 = require("../controllers/sectionController");
const router = express_1.default.Router();
router.post("/divide", authMiddleware_1.verifyToken, sectionController_1.divideSongIntoSections);
router.post("/generate-json", sectionController_1.generateEssayJson);
exports.default = router;
