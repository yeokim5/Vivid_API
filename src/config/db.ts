import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || "";

if (!MONGODB_URI) {
  // console.error("MongoDB URI is not defined in environment variables");
  process.exit(1);
}

const connectDB = async (): Promise<void> => {
  try {
    await mongoose.connect(MONGODB_URI, {
      // Connection pool settings to reduce memory usage
      maxPoolSize: 5, // Limit connection pool size (default is 100)
      minPoolSize: 1, // Minimum connections to maintain
      maxIdleTimeMS: 30000, // Close connections after 30 seconds of inactivity
      serverSelectionTimeoutMS: 5000, // How long to try selecting a server
      socketTimeoutMS: 45000, // How long a send or receive on a socket can take
    });
    // console.log("MongoDB connected successfully");
  } catch (error) {
    // console.error("MongoDB connection error:", error);
    process.exit(1);
  }
};

export default connectDB;
