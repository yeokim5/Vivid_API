import admin from "firebase-admin";
import dotenv from "dotenv";

dotenv.config();

// For development, initialize Firebase Admin SDK without credentials
// In production, you should use a service account
try {
  admin.initializeApp({
    projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  });
  console.log("Firebase Admin SDK initialized successfully");
} catch (error) {
  console.error("Firebase Admin SDK initialization error:", error);
}

export default admin;
