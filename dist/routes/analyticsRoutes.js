"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const analyticsController_1 = require("../controllers/analyticsController");
const router = (0, express_1.Router)();
// Analytics routes - public for internal use
// TODO: Add admin authentication for production
// Dashboard overview - key metrics at a glance
router.get("/dashboard", analyticsController_1.getDashboardOverview);
// User registration statistics over time
router.get("/users/registration-stats", analyticsController_1.getUserRegistrationStats);
// Essay creation statistics over time
router.get("/essays/creation-stats", analyticsController_1.getEssayCreationStats);
// User activity breakdown
router.get("/activity/stats", analyticsController_1.getUserActivityStats);
// Recent activity feed
router.get("/activity/recent", analyticsController_1.getRecentActivity);
exports.default = router;
