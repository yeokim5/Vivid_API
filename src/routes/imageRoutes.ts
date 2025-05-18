import express from "express";
import {
  searchImages,
  processBackgroundImageSuggestions,
} from "../controllers/imageController";

const router = express.Router();

// Route for searching images based on a prompt
router.post("/", searchImages);

// Route for processing multiple background image suggestions
router.post("/background-suggestions", processBackgroundImageSuggestions);

export default router;
