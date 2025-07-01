"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const passport_1 = __importDefault(require("passport"));
const authController_1 = require("../controllers/authController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const activityLogger_1 = require("../middleware/activityLogger");
const router = express_1.default.Router();
// Firebase authentication route
router.post("/firebase-login", authController_1.firebaseLogin, activityLogger_1.logUserLogin);
// Google OAuth routes
router.get("/google", passport_1.default.authenticate("google", { scope: ["profile", "email"] }));
router.get("/google/callback", passport_1.default.authenticate("google", {
    failureRedirect: `${process.env.CLIENT_URL || "http://localhost:3000"}/login?error=auth_failed`,
    session: false,
}), authController_1.googleAuthCallback, activityLogger_1.logUserLogin);
// Get current user route
router.get("/me", authMiddleware_1.verifyToken, authController_1.getCurrentUser);
// Logout route
router.post("/logout", authController_1.logout);
exports.default = router;
