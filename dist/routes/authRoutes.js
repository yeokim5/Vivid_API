"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const passport_1 = __importDefault(require("passport"));
const authController_1 = require("../controllers/authController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = express_1.default.Router();
console.log("=============== AUTH ROUTES ===============");
console.log("Setting up auth routes...");
// Firebase authentication route
router.post("/firebase-login", authController_1.firebaseLogin);
// Google OAuth routes
router.get("/google", (req, res, next) => {
    console.log("Google auth route accessed with URL:", req.url);
    console.log("Full request path:", req.originalUrl);
    console.log("Request headers:", req.headers);
    next();
}, passport_1.default.authenticate("google", { scope: ["profile", "email"] }));
router.get("/google/callback", (req, res, next) => {
    console.log("Google auth callback route accessed");
    console.log("Callback URL params:", req.query);
    next();
}, passport_1.default.authenticate("google", {
    failureRedirect: `${process.env.CLIENT_URL || "http://localhost:3000"}/login?error=auth_failed`,
    session: false,
}), authController_1.googleAuthCallback);
// Get current user route
router.get("/me", authMiddleware_1.verifyToken, authController_1.getCurrentUser);
// Logout route
router.post("/logout", authController_1.logout);
console.log("Auth routes setup complete");
console.log("=======================================");
exports.default = router;
