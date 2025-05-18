"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = __importDefault(require("../models/User"));
// Middleware to verify JWT token
const verifyToken = async (req, res, next) => {
    try {
        // Get token from Authorization header
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            res.status(401).json({ message: "Access denied. No token provided." });
            return;
        }
        const token = authHeader.split(" ")[1];
        // Verify token
        const decoded = jsonwebtoken_1.default.verify(token, process.env.SESSION_SECRET || "fallback_secret");
        // Find user by id
        const user = await User_1.default.findById(decoded.id);
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
    }
    catch (error) {
        if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
            res.status(401).json({ message: "Token expired. Please login again." });
            return;
        }
        res.status(401).json({ message: "Invalid token." });
    }
};
exports.verifyToken = verifyToken;
