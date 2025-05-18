import express from "express";
import {
  divideSongIntoSections,
  generateEssayJson,
} from "../controllers/sectionController";

const router = express.Router();

router.post("/divide", divideSongIntoSections);
router.post("/generate-json", generateEssayJson);

export default router;
