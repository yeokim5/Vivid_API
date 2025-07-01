import express from "express";
import passport from "passport";
import {
  googleAuthCallback,
  getCurrentUser,
  logout,
  firebaseLogin,
} from "../controllers/authController";
import { verifyToken } from "../middleware/authMiddleware";
import { logUserLogin } from "../middleware/activityLogger";

const router = express.Router();

// Firebase authentication route
router.post("/firebase-login", firebaseLogin, logUserLogin as any);

// Google OAuth routes
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: `${
      process.env.CLIENT_URL || "http://localhost:3000"
    }/login?error=auth_failed`,
    session: false,
  }),
  googleAuthCallback,
  logUserLogin as any
);

// Get current user route
router.get("/me", verifyToken, getCurrentUser);

// Logout route
router.post("/logout", logout);

export default router;
