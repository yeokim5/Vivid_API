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
import creditRoutes from "./routes/creditRoutes";
import "./config/firebase"; // Import Firebase configuration
import path from "path";
import ensureTemplateAssets from "./utils/ensureTemplateAssets";

// Load environment variables
dotenv.config();

console.log("🚀 Starting Vivid server...");

// Connect to MongoDB
connectDB();

// Ensure template asset directories exist
ensureTemplateAssets();

// Initialize express app
const app = express();

// Middleware
app.use(
  cors({
    origin: function (origin, callback) {
      const allowedOrigins = [
        process.env.CLIENT_URL || "http://localhost:3000",
        "https://vivid-eight.vercel.app",
        "https://vivid-eight.vercel.app/",
      ];

      // Check if origin is allowed
      if (
        !origin ||
        allowedOrigins.some((allowedOrigin) => {
          if (allowedOrigin.includes("*")) {
            const pattern = new RegExp(
              "^" + allowedOrigin.replace("*", ".*") + "$"
            );
            return pattern.test(origin);
          }
          return allowedOrigin === origin;
        })
      ) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Configure Helmet with CSP
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          "'unsafe-inline'",
          "'unsafe-eval'",
          "https://js.stripe.com",
          "https://*.stripe.com",
        ],
        styleSrc: [
          "'self'",
          "'unsafe-inline'",
          "https://fonts.googleapis.com",
          "https://js.stripe.com",
          "https://*.stripe.com",
        ],
        styleSrcElem: [
          "'self'",
          "'unsafe-inline'",
          "https://fonts.googleapis.com",
          "https://js.stripe.com",
          "https://*.stripe.com",
        ],
        imgSrc: [
          "'self'",
          "data:",
          "https:",
          "blob:",
          "https://assets.lummi.ai",
          "https://*.stripe.com",
        ],
        connectSrc: [
          "'self'",
          "https://api.unsplash.com",
          "https://assets.lummi.ai",
          "https://fonts.googleapis.com",
          "https://fonts.gstatic.com",
          "https://api.stripe.com",
          "https://*.stripe.com",
          "https://*.ngrok-free.app",
        ],
        fontSrc: ["'self'", "data:", "https:", "https://fonts.gstatic.com"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: [
          "'self'",
          "https://js.stripe.com",
          "https://*.stripe.com",
          "https://*.stripe.network",
        ],
      },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: false,
    crossOriginResourcePolicy: false,
  })
);

app.use(morgan("dev"));

// Handle webhooks with raw bodies first
app.use("/api/credits/webhook", express.raw({ type: "application/json" }));

// Then parse JSON for the rest
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
// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Welcome route
app.get("/", (_req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/essays", essayRoutes);
app.use("/api/sections", sectionRoutes);
app.use("/api/images", imageRoutes);
app.use("/api/credits", creditRoutes);

// Serve static files from the uploads directory
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Serve static files from the public directory with proper MIME types
app.use(
  express.static(path.join(__dirname, "../public"), {
    setHeaders: (res, path) => {
      if (path.endsWith(".js")) {
        res.setHeader("Content-Type", "application/javascript");
      } else if (path.endsWith(".mjs")) {
        res.setHeader("Content-Type", "application/javascript");
      } else if (path.endsWith(".css")) {
        res.setHeader("Content-Type", "text/css");
      } else if (path.endsWith(".html")) {
        res.setHeader("Content-Type", "text/html");
      }
    },
  })
);

// Remove frontend static file serving since they are now served from the frontend deployment
// app.use("/styles", express.static(path.join(__dirname, "../../front/public/styles")));
// app.use("/js", express.static(path.join(__dirname, "../../front/public/js")));

// Add a new route for serving module scripts with correct MIME type
app.get("*.js", (req, res, next) => {
  res.set("Content-Type", "application/javascript");
  next();
});

// Add a route for serving ES modules with correct MIME type
app.get("*.mjs", (req, res, next) => {
  res.set("Content-Type", "application/javascript");
  next();
});

// Add a route for serving CSS files with correct MIME type
app.get("*.css", (req, res, next) => {
  res.set("Content-Type", "text/css");
  next();
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
  console.log(`✅ Vivid server running on port ${PORT}`);
});

export default app;
