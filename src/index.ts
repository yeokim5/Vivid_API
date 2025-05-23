import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import dotenv from "dotenv";
import session from "express-session";
import cookieParser from "cookie-parser";
import { ErrorWithStack } from "./types";
import connectDB from "./config/db";
import passport from "./config/passport";
import authRoutes from "./routes/authRoutes";
import essayRoutes from "./routes/essayRoutes";
import sectionRoutes from "./routes/sectionRoutes";
import imageRoutes from "./routes/imageRoutes";
import "./config/firebase"; // Import Firebase configuration
import path from "path";

// Load environment variables
dotenv.config();

console.log("=============== SERVER STARTUP ===============");
console.log("Environment variables loaded");
console.log("NODE_ENV:", process.env.NODE_ENV);
console.log("CLIENT_URL:", process.env.CLIENT_URL);
console.log("PORT:", process.env.PORT || 5000);

// Connect to MongoDB
connectDB();

// Initialize express app
const app = express();

// Middleware
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
  })
);
console.log(
  "CORS configured with origin:",
  process.env.CLIENT_URL || "http://localhost:3000"
);

// Configure Helmet with CSP
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        styleSrcElem: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        imgSrc: ["'self'", "data:", "https:", "blob:", "https://assets.lummi.ai"],
        connectSrc: ["'self'", "https://api.unsplash.com", "https://assets.lummi.ai", "https://fonts.googleapis.com", "https://fonts.gstatic.com"],
        fontSrc: ["'self'", "data:", "https:", "https://fonts.gstatic.com"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'self'"],
      },
    },
  })
);

app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Session configuration
app.use(
  session({
    secret: process.env.SESSION_SECRET || "fallback_secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      maxAge: 10 * 60 * 1000, // 10 minutes as per requirements
    },
  })
);
console.log("Session middleware configured");

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());
console.log("Passport initialized");

// Welcome route
app.get("/", (_req: Request, res: Response) => {
  res.json({ message: "Welcome to MagicEssay API" });
});

// Routes
console.log("Registering routes...");
app.use("/api/auth", authRoutes);
console.log("Auth routes registered at /api/auth");
app.use("/api/essays", essayRoutes);
console.log("Essay routes registered at /api/essays");
app.use("/api/sections", sectionRoutes);
console.log("Section routes registered at /api/sections");
app.use("/api/images", imageRoutes);
console.log("Image routes registered at /api/images");

// Serve static files from the uploads directory
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// List all registered routes
console.log("Registered routes:");
app._router.stack.forEach((middleware: any) => {
  if (middleware.route) {
    // Routes registered directly on the app
    console.log(
      `${Object.keys(middleware.route.methods)} ${middleware.route.path}`
    );
  } else if (middleware.name === "router" && middleware.handle.stack) {
    // Router middleware
    const path = middleware.regexp
      .toString()
      .replace("\\^", "")
      .replace("\\/?(?=\\/|$)", "")
      .replace(/\\\//g, "/");
    middleware.handle.stack.forEach((handler: any) => {
      if (handler.route) {
        const method = Object.keys(handler.route.methods)[0];
        console.log(`${method.toUpperCase()} ${path}${handler.route.path}`);
      }
    });
  }
});

// Error handling middleware
app.use(
  (err: ErrorWithStack, _req: Request, res: Response, _next: NextFunction) => {
    console.error(err.stack);
    res.status(500).json({
      message: "Something went wrong!",
      error: process.env.NODE_ENV === "development" ? err.message : {},
    });
  }
);

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log("=======================================");
});

export default app;
