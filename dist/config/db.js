"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const MONGODB_URI = process.env.MONGODB_URI || "";
if (!MONGODB_URI) {
    // console.error("MongoDB URI is not defined in environment variables");
    process.exit(1);
}
const connectDB = async () => {
    try {
        await mongoose_1.default.connect(MONGODB_URI, {
            // Connection pool settings to reduce memory usage
            maxPoolSize: 5, // Limit connection pool size (default is 100)
            minPoolSize: 1, // Minimum connections to maintain
            maxIdleTimeMS: 30000, // Close connections after 30 seconds of inactivity
            serverSelectionTimeoutMS: 5000, // How long to try selecting a server
            socketTimeoutMS: 45000, // How long a send or receive on a socket can take
        });
        // console.log("MongoDB connected successfully");
    }
    catch (error) {
        // console.error("MongoDB connection error:", error);
        process.exit(1);
    }
};
exports.default = connectDB;
