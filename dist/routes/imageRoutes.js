"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const imageController_1 = require("../controllers/imageController");
const router = express_1.default.Router();
// Route for searching images based on a prompt
router.post("/", imageController_1.searchImages);
// Route for processing multiple background image suggestions
router.post("/background-suggestions", imageController_1.processBackgroundImageSuggestions);
exports.default = router;
