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

    // Find or create user
    let user = await User.findOne({ firebaseUid: uid });

    if (!user) {
      // Check if user exists with this email
      user = await User.findOne({ email });

      if (user) {
        // Update existing user with Firebase UID
        user.firebaseUid = uid;
        if (photoURL && !user.profilePicture) {
          user.profilePicture = photoURL;
        }
        user.lastLogin = new Date();
        await user.save();
      } else {
        // Create new user
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
    } else {
      // Update last login time
      user.lastLogin = new Date();
      await user.save();
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
export const getCurrentUser = (req: Request, res: Response): void => {
  try {
    // Access user from request (added by verifyToken middleware)
    const user = (req as any).user;

    if (!user) {
      res.status(401).json({ message: "Not authenticated" });
      return;
    }

    // Return user data
    res.status(200).json({
      id: user.id || user._id?.toString(),
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
