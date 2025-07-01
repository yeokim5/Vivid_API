import { Router } from "express";
import {
  getUserRegistrationStats,
  getEssayCreationStats,
  getUserActivityStats,
  getDashboardOverview,
  getRecentActivity,
} from "../controllers/analyticsController";

const router = Router();

// Analytics routes - public for internal use
// TODO: Add admin authentication for production

// Dashboard overview - key metrics at a glance
router.get("/dashboard", getDashboardOverview);

// User registration statistics over time
router.get("/users/registration-stats", getUserRegistrationStats);

// Essay creation statistics over time
router.get("/essays/creation-stats", getEssayCreationStats);

// User activity breakdown
router.get("/activity/stats", getUserActivityStats);

// Recent activity feed
router.get("/activity/recent", getRecentActivity);

export default router;
