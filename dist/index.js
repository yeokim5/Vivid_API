"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const dotenv_1 = __importDefault(require("dotenv"));
const express_session_1 = __importDefault(require("express-session"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const db_1 = __importDefault(require("./config/db"));
const passport_1 = __importDefault(require("./config/passport"));
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const essayRoutes_1 = __importDefault(require("./routes/essayRoutes"));
const sectionRoutes_1 = __importDefault(require("./routes/sectionRoutes"));
const imageRoutes_1 = __importDefault(require("./routes/imageRoutes"));
require("./config/firebase"); // Import Firebase configuration
const path_1 = __importDefault(require("path"));
// Load environment variables
dotenv_1.default.config();
console.log("=============== SERVER STARTUP ===============");
console.log("Environment variables loaded");
console.log("NODE_ENV:", process.env.NODE_ENV);
console.log("CLIENT_URL:", process.env.CLIENT_URL);
console.log("PORT:", process.env.PORT || 5000);
// Connect to MongoDB
(0, db_1.default)();
// Initialize express app
const app = (0, express_1.default)();
// Middleware
app.use((0, cors_1.default)({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
}));
console.log("CORS configured with origin:", process.env.CLIENT_URL || "http://localhost:3000");
app.use((0, helmet_1.default)());
app.use((0, morgan_1.default)("dev"));
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
}));
console.log("Session middleware configured");
// Initialize Passport
app.use(passport_1.default.initialize());
app.use(passport_1.default.session());
console.log("Passport initialized");
// Welcome route
app.get("/", (_req, res) => {
    res.json({ message: "Welcome to MagicEssay API" });
});
// Routes
console.log("Registering routes...");
app.use("/api/auth", authRoutes_1.default);
console.log("Auth routes registered at /api/auth");
app.use("/api/essays", essayRoutes_1.default);
console.log("Essay routes registered at /api/essays");
app.use("/api/sections", sectionRoutes_1.default);
console.log("Section routes registered at /api/sections");
app.use("/api/images", imageRoutes_1.default);
console.log("Image routes registered at /api/images");
// Serve static files from the uploads directory
app.use("/uploads", express_1.default.static(path_1.default.join(__dirname, "../uploads")));
// List all registered routes
console.log("Registered routes:");
app._router.stack.forEach((middleware) => {
    if (middleware.route) {
        // Routes registered directly on the app
        console.log(`${Object.keys(middleware.route.methods)} ${middleware.route.path}`);
    }
    else if (middleware.name === "router" && middleware.handle.stack) {
        // Router middleware
        const path = middleware.regexp
            .toString()
            .replace("\\^", "")
            .replace("\\/?(?=\\/|$)", "")
            .replace(/\\\//g, "/");
        middleware.handle.stack.forEach((handler) => {
            if (handler.route) {
                const method = Object.keys(handler.route.methods)[0];
                console.log(`${method.toUpperCase()} ${path}${handler.route.path}`);
            }
        });
    }
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
    console.log(`Server running on port ${PORT}`);
    console.log("=======================================");
});
exports.default = app;
