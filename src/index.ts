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

console.log("=============== SERVER STARTUP ===============");
console.log("Environment variables loaded");
console.log("NODE_ENV:", process.env.NODE_ENV);
console.log("CLIENT_URL:", process.env.CLIENT_URL);
console.log("PORT:", process.env.PORT || 5000);

// Connect to MongoDB
connectDB();

// Ensure template asset directories exist
ensureTemplateAssets();

// Initialize express app
const app = express();

// Middleware
app.use(
  cors({
    origin: function(origin, callback) {
      const allowedOrigins = [
        process.env.CLIENT_URL || "http://localhost:3000", 
        "https://vivid-eight.vercel.app",
        "https://vivid-eight.vercel.app/"
      ];
      
      // Check if origin is allowed
      if (!origin || allowedOrigins.some(allowedOrigin => {
        if (allowedOrigin.includes('*')) {
          const pattern = new RegExp('^' + allowedOrigin.replace('*', '.*') + '$');
          return pattern.test(origin);
        }
        return allowedOrigin === origin;
      })) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);
console.log(
  "CORS configured with origins including:",
  process.env.CLIENT_URL || "http://localhost:3000"
);

// Configure Helmet with CSP
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://js.stripe.com", "https://*.stripe.com"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://js.stripe.com", "https://*.stripe.com"],
        styleSrcElem: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://js.stripe.com", "https://*.stripe.com"],
        imgSrc: ["'self'", "data:", "https:", "blob:", "https://assets.lummi.ai", "https://*.stripe.com"],
        connectSrc: ["'self'", "https://api.unsplash.com", "https://assets.lummi.ai", "https://fonts.googleapis.com", "https://fonts.gstatic.com", "https://api.stripe.com", "https://*.stripe.com", "https://*.ngrok-free.app"],
        fontSrc: ["'self'", "data:", "https:", "https://fonts.gstatic.com"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'self'", "https://js.stripe.com", "https://*.stripe.com", "https://*.stripe.network"],
      },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: false,
    crossOriginResourcePolicy: false
  })
);

app.use(morgan("dev"));

// Handle webhooks with raw bodies first
app.use("/api/credits/webhook", express.raw({ type: 'application/json' }));

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
console.log("Session middleware configured");

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());
console.log("Passport initialized");

// Welcome route
app.get("/", (_req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));
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
app.use("/api/credits", creditRoutes);
console.log("Credit routes registered at /api/credits");

// Serve static files from the uploads directory
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Serve static files from the public directory with proper MIME types
app.use(express.static(path.join(__dirname, "../public"), {
  setHeaders: (res, path) => {
    if (path.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript');
    } else if (path.endsWith('.mjs')) {
      res.setHeader('Content-Type', 'application/javascript');
    } else if (path.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css');
    } else if (path.endsWith('.html')) {
      res.setHeader('Content-Type', 'text/html');
    }
  }
}));

// Serve static files for the essay templates
app.use("/styles", express.static(path.join(__dirname, "../../front/public/styles")));
app.use("/js", express.static(path.join(__dirname, "../../front/public/js"), {
  setHeaders: (res, path) => {
    if (path.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript');
    } else if (path.endsWith('.mjs')) {
      res.setHeader('Content-Type', 'application/javascript');
    }
  }
}));

// Add a new route for serving module scripts with correct MIME type
app.get('*.js', (req, res, next) => {
  res.set('Content-Type', 'application/javascript');
  next();
});

// Add a route for serving ES modules with correct MIME type
app.get('*.mjs', (req, res, next) => {
  res.set('Content-Type', 'application/javascript');
  next();
});

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
