"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logout = exports.getCurrentUser = exports.googleAuthCallback = exports.firebaseLogin = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = __importDefault(require("../models/User"));
const activityLogger_1 = require("../middleware/activityLogger");
// Generate JWT token
const generateToken = (user) => {
    const payload = {
        id: user._id,
        email: user.email,
    };
    return jsonwebtoken_1.default.sign(payload, process.env.SESSION_SECRET || "fallback_secret", {
        expiresIn: "7d",
    });
};
// Handle Firebase authentication
const firebaseLogin = async (req, res) => {
    try {
        const { uid, email, name, photoURL } = req.body;
        if (!uid || !email) {
            res.status(400).json({ message: "User ID and email are required" });
            return;
        }
        // First check if user exists with this email or firebase UID
        let user = await User_1.default.findOne({ $or: [{ email }, { firebaseUid: uid }] });
        let isNewUser = false;
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
        }
        else {
            // Create new user only if no user exists with this email
            isNewUser = true;
            const nameParts = name ? name.split(" ") : ["", ""];
            try {
                user = await User_1.default.create({
                    firebaseUid: uid,
                    email,
                    name: name || email,
                    firstName: nameParts[0] || "",
                    lastName: nameParts.slice(1).join(" ") || "",
                    profilePicture: photoURL || "",
                    lastLogin: new Date(),
                });
                // Log user registration activity
                await (0, activityLogger_1.logActivity)(user._id.toString(), "user_registered", {
                    email: user.email,
                    name: user.name,
                    registrationMethod: "firebase",
                }, req);
            }
            catch (error) {
                // If duplicate key error, try to find the user again
                if (error.code === 11000 && error.keyPattern?.email) {
                    user = await User_1.default.findOne({ email });
                    if (user) {
                        // Update the existing user with Firebase UID
                        user.firebaseUid = uid;
                        if (photoURL && !user.profilePicture) {
                            user.profilePicture = photoURL;
                        }
                        if (name && !user.name) {
                            user.name = name;
                        }
                        user.lastLogin = new Date();
                        await user.save();
                    }
                    else {
                        throw error; // Re-throw if we can't find the user
                    }
                }
                else {
                    throw error; // Re-throw for other errors
                }
            }
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
            isNewUser,
        });
    }
    catch (error) {
        console.error("Firebase authentication error:", error);
        res.status(500).json({ message: "Authentication failed" });
    }
};
exports.firebaseLogin = firebaseLogin;
// Handle successful Google authentication
const googleAuthCallback = (req, res) => {
    try {
        const authResult = req.user;
        if (!authResult || !authResult.user) {
            res.redirect(`${process.env.CLIENT_URL || "http://localhost:3000"}/login?error=auth_failed`);
            return;
        }
        const { user, isNewUser } = authResult;
        // Generate JWT token
        const token = generateToken(user);
        // Redirect to frontend with token and new user flag
        res.redirect(`${process.env.CLIENT_URL || "http://localhost:3000"}/auth/callback?token=${token}&isNewUser=${isNewUser}`);
    }
    catch (error) {
        console.error("Auth callback error:", error);
        res.redirect(`${process.env.CLIENT_URL || "http://localhost:3000"}/login?error=server_error`);
    }
};
exports.googleAuthCallback = googleAuthCallback;
// Get current user data
const getCurrentUser = async (req, res) => {
    try {
        // Access user from request (added by verifyToken middleware)
        const requestUser = req.user;
        if (!requestUser) {
            res.status(401).json({ message: "Not authenticated" });
            return;
        }
        // Get fresh user data from database to ensure we have latest credits
        const user = await User_1.default.findById(requestUser.id);
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
    }
    catch (error) {
        console.error("Get current user error:", error);
        res.status(500).json({ message: "Server error" });
    }
};
exports.getCurrentUser = getCurrentUser;
// Logout user
const logout = (req, res) => {
    res.status(200).json({ message: "Logged out successfully" });
};
exports.logout = logout;
