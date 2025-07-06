"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const firebase_admin_1 = __importDefault(require("firebase-admin"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
// For development, initialize Firebase Admin SDK without credentials
// In production, you should use a service account
try {
    firebase_admin_1.default.initializeApp({
        projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
    });
    // console.log("Firebase Admin SDK initialized successfully");
}
catch (error) {
    // console.error("Firebase Admin SDK initialization error:", error);
}
exports.default = firebase_admin_1.default;
