import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import User from "../models/User";

// Middleware to verify JWT token
export const verifyToken = async (
  req: any,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({ message: "Access denied. No token provided." });
      return;
    }

    const token = authHeader.split(" ")[1];

    // Verify token
    const decoded = jwt.verify(
      token,
      process.env.SESSION_SECRET || "fallback_secret"
    ) as { id: string };

    // Find user by id
    const user = await User.findById(decoded.id);

    if (!user) {
      res.status(401).json({ message: "Invalid token. User not found." });
      return;
    }

    // Attach user to request
    req.user = {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      profilePicture: user.profilePicture,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ message: "Token expired. Please login again." });
      return;
    }

    res.status(401).json({ message: "Invalid token." });
  }
};
