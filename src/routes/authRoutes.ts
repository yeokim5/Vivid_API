import express from "express";
import passport from "passport";
import {
  googleAuthCallback,
  getCurrentUser,
  logout,
  firebaseLogin,
} from "../controllers/authController";
import { verifyToken } from "../middleware/authMiddleware";

const router = express.Router();

console.log("=============== AUTH ROUTES ===============");
console.log("Setting up auth routes...");

// Firebase authentication route
router.post("/firebase-login", firebaseLogin);

// Google OAuth routes
router.get(
  "/google",
  (req, res, next) => {
    console.log("Google auth route accessed with URL:", req.url);
    console.log("Full request path:", req.originalUrl);
    console.log("Request headers:", req.headers);
    next();
  },
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get(
  "/google/callback",
  (req, res, next) => {
    console.log("Google auth callback route accessed");
    console.log("Callback URL params:", req.query);
    next();
  },
  passport.authenticate("google", {
    failureRedirect: `${
      process.env.CLIENT_URL || "http://localhost:3000"
    }/login?error=auth_failed`,
    session: false,
  }),
  googleAuthCallback
);

// Get current user route
router.get("/me", verifyToken, getCurrentUser);

// Logout route
router.post("/logout", logout);

console.log("Auth routes setup complete");
console.log("=======================================");

export default router;
