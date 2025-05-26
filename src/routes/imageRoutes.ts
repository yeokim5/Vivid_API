import express from "express";
import {
  searchImages,
  processBackgroundImageSuggestions,
  cleanupOngoingFetches,
} from "../controllers/imageController";

const router = express.Router();

// Route for searching images based on a prompt
router.post("/", searchImages);

// Route for processing multiple background image suggestions
router.post("/background-suggestions", processBackgroundImageSuggestions);

// Route for cleaning up ongoing image fetches
router.post("/cleanup", (req, res) => {
  const { sectionId } = req.body;
  cleanupOngoingFetches(sectionId);
  res.json({ success: true, message: "Cleanup completed" });
});

export default router;
