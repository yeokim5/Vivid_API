import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import User, { IUser } from "../models/User";
import admin from "firebase-admin";

// Generate JWT token
const generateToken = (user: IUser): string => {
  const payload = {
    id: user._id,
    email: user.email,
  };

  return jwt.sign(payload, process.env.SESSION_SECRET || "fallback_secret", {
    expiresIn: "7d",
  });
};

// Handle Firebase authentication
export const firebaseLogin = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { uid, email, name, photoURL } = req.body;

    if (!uid || !email) {
      res.status(400).json({ message: "User ID and email are required" });
      return;
    }

    // First check if user exists with this email
    let user = await User.findOne({ email });

    if (user) {
      // Update existing user with Firebase UID and other info
      user.firebaseUid = uid;
      if (photoURL && !user.profilePicture) {
        user.profilePicture = photoURL;
      }
      if (name && !user.name) {
        user.name = name;
      }
      user.lastLogin = new Date();
      await user.save();
    } else {
      // Create new user only if no user exists with this email
      const nameParts = name ? name.split(" ") : ["", ""];
      user = await User.create({
        firebaseUid: uid,
        email,
        name: name || email,
        firstName: nameParts[0] || "",
        lastName: nameParts.slice(1).join(" ") || "",
        profilePicture: photoURL || "",
        lastLogin: new Date(),
      });
    }

    // Generate JWT token
    const token = generateToken(user);

    // Return user data and token
    res.status(200).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        profilePicture: user.profilePicture,
        credits: user.credits,
      },
    });
  } catch (error) {
    console.error("Firebase authentication error:", error);
    res.status(500).json({ message: "Authentication failed" });
  }
};

// Handle successful Google authentication
export const googleAuthCallback = (req: Request, res: Response): void => {
  try {
    const user = req.user as IUser;

    if (!user) {
      res.redirect(
        `${
          process.env.CLIENT_URL || "http://localhost:3000"
        }/login?error=auth_failed`
      );
      return;
    }

    // Generate JWT token
    const token = generateToken(user);

    // Redirect to frontend with token
    res.redirect(
      `${
        process.env.CLIENT_URL || "http://localhost:3000"
      }/auth/callback?token=${token}`
    );
  } catch (error) {
    console.error("Auth callback error:", error);
    res.redirect(
      `${
        process.env.CLIENT_URL || "http://localhost:3000"
      }/login?error=server_error`
    );
  }
};

// Get current user data
export const getCurrentUser = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Access user from request (added by verifyToken middleware)
    const requestUser = (req as any).user;

    if (!requestUser) {
      res.status(401).json({ message: "Not authenticated" });
      return;
    }

    // Get fresh user data from database to ensure we have latest credits
    const user = await User.findById(requestUser.id);

    if (!user) {
      res.status(401).json({ message: "User not found" });
      return;
    }

    // Return user data
    res.status(200).json({
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      profilePicture: user.profilePicture,
      credits: user.credits,
    });
  } catch (error) {
    console.error("Get current user error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Logout user
export const logout = (req: Request, res: Response): void => {
  res.status(200).json({ message: "Logged out successfully" });
};
