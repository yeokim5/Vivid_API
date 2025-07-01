"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const dotenv_1 = __importDefault(require("dotenv"));
const express_session_1 = __importDefault(require("express-session"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const db_1 = __importDefault(require("./config/db"));
const passport_1 = __importDefault(require("./config/passport"));
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const essayRoutes_1 = __importDefault(require("./routes/essayRoutes"));
const sectionRoutes_1 = __importDefault(require("./routes/sectionRoutes"));
const imageRoutes_1 = __importDefault(require("./routes/imageRoutes"));
const creditRoutes_1 = __importDefault(require("./routes/creditRoutes"));
const queueRoutes_1 = __importDefault(require("./routes/queueRoutes"));
require("./config/firebase"); // Import Firebase configuration
const path_1 = __importDefault(require("path"));
const ensureTemplateAssets_1 = __importDefault(require("./utils/ensureTemplateAssets"));
// Load environment variables
dotenv_1.default.config();
// Conditional morgan import for development only
let morganLogger = null;
if (process.env.NODE_ENV !== "production") {
    const morgan = require("morgan");
    morganLogger = morgan("dev");
}
console.log("🚀 Starting Vivid server...");
// Connect to MongoDB
(0, db_1.default)();
// Ensure template asset directories exist
(0, ensureTemplateAssets_1.default)();
// Initialize express app
const app = (0, express_1.default)();
// Middleware
app.use((0, cors_1.default)({
    origin: function (origin, callback) {
        const allowedOrigins = [
            process.env.CLIENT_URL || "http://localhost:3000",
            "https://vivid-eight.vercel.app",
            "https://vivid-eight.vercel.app/",
        ];
        // Check if origin is allowed
        if (!origin ||
            allowedOrigins.some((allowedOrigin) => {
                if (allowedOrigin.includes("*")) {
                    const pattern = new RegExp("^" + allowedOrigin.replace("*", ".*") + "$");
                    return pattern.test(origin);
                }
                return allowedOrigin === origin;
            })) {
            callback(null, true);
        }
        else {
            callback(new Error("Not allowed by CORS"));
        }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
}));
// Configure Helmet with CSP
app.use((0, helmet_1.default)({
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
}));
// Only use morgan in development
if (morganLogger) {
    app.use(morganLogger);
}
// Handle webhooks with raw bodies first
app.use("/api/credits/webhook", express_1.default.raw({ type: "application/json" }));
// Then parse JSON for the rest
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use((0, cookie_parser_1.default)());
// Session configuration
app.use((0, express_session_1.default)({
    secret: process.env.SESSION_SECRET || "fallback_secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === "production",
        maxAge: 10 * 60 * 1000, // 10 minutes as per requirements
    },
    // Memory optimization: limit session store size
    rolling: true, // Reset expiry on activity
    unset: "destroy", // Remove session data when unset
}));
// Initialize Passport
app.use(passport_1.default.initialize());
app.use(passport_1.default.session());
// Welcome route
app.get("/", (_req, res) => {
    res.sendFile(path_1.default.join(__dirname, "../public/index.html"));
});
// Routes
app.use("/api/auth", authRoutes_1.default);
app.use("/api/essays", essayRoutes_1.default);
app.use("/api/sections", sectionRoutes_1.default);
app.use("/api/images", imageRoutes_1.default);
app.use("/api/credits", creditRoutes_1.default);
app.use("/api/queue", queueRoutes_1.default);
// Serve static files from the uploads directory
app.use("/uploads", express_1.default.static(path_1.default.join(__dirname, "../uploads")));
// Serve static files from the public directory with proper MIME types
app.use(express_1.default.static(path_1.default.join(__dirname, "../public"), {
    setHeaders: (res, path) => {
        if (path.endsWith(".js")) {
            res.setHeader("Content-Type", "application/javascript");
        }
        else if (path.endsWith(".mjs")) {
            res.setHeader("Content-Type", "application/javascript");
        }
        else if (path.endsWith(".css")) {
            res.setHeader("Content-Type", "text/css");
        }
        else if (path.endsWith(".html")) {
            res.setHeader("Content-Type", "text/html");
        }
    },
}));
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
app.use((err, _req, res, _next) => {
    console.error(err.stack);
    res.status(500).json({
        message: "Something went wrong!",
        error: process.env.NODE_ENV === "development" ? err.message : {},
    });
});
// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`✅ Vivid server running on port ${PORT}`);
});
exports.default = app;
