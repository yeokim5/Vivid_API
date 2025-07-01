"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logCreditPurchase = exports.logCreditUsage = exports.logEssayView = exports.logEssayCreation = exports.logUserLogin = exports.activityLogger = exports.logActivity = void 0;
const Activity_1 = __importDefault(require("../models/Activity"));
// Helper function to log activities
const logActivity = async (userId, action, details = {}, req) => {
    try {
        const activityData = {
            userId,
            action,
            details,
            ipAddress: req?.ip ||
                req?.headers["x-forwarded-for"] ||
                req?.connection?.remoteAddress,
            userAgent: req?.get("User-Agent"),
        };
        await Activity_1.default.create(activityData);
    }
    catch (error) {
        console.error("Error logging activity:", error);
        // Don't throw error to avoid breaking main functionality
    }
};
exports.logActivity = logActivity;
// Middleware to automatically log certain activities
const activityLogger = (action, getDetails) => {
    return (req, res, next) => {
        // Store original json method
        const originalJson = res.json;
        // Override json method to log after successful response
        res.json = function (body) {
            // Check if request was successful (status < 400)
            if (res.statusCode < 400 && req.user) {
                const userId = req.user.id || req.user._id;
                const details = getDetails ? getDetails(req, res) : { body: req.body };
                // Log activity asynchronously
                setImmediate(() => {
                    (0, exports.logActivity)(userId, action, details, req);
                });
            }
            // Call original json method
            return originalJson.call(this, body);
        };
        next();
    };
};
exports.activityLogger = activityLogger;
// Specific activity loggers for common actions
const logUserLogin = (req, res, next) => {
    if (req.user) {
        const userId = req.user.id || req.user._id;
        setImmediate(() => {
            (0, exports.logActivity)(userId, "user_login", {
                loginMethod: req.body.loginMethod || "unknown",
            }, req);
        });
    }
    next();
};
exports.logUserLogin = logUserLogin;
const logEssayCreation = (req, res, next) => {
    const originalJson = res.json;
    res.json = function (body) {
        if (res.statusCode === 201 && req.user && body.success) {
            const userId = req.user.id || req.user._id;
            setImmediate(() => {
                (0, exports.logActivity)(userId, "essay_created", {
                    essayId: body.essayId,
                    title: req.body.title,
                    isPrivate: req.body.isPrivate || false,
                }, req);
            });
        }
        return originalJson.call(this, body);
    };
    next();
};
exports.logEssayCreation = logEssayCreation;
const logEssayView = (req, res, next) => {
    const originalSend = res.send;
    res.send = function (body) {
        if (res.statusCode === 200) {
            // Skip logging essay views for now since they don't have authenticated users
            // TODO: Implement anonymous view tracking with IP-based identification
        }
        return originalSend.call(this, body);
    };
    next();
};
exports.logEssayView = logEssayView;
const logCreditUsage = (req, res, next) => {
    const originalJson = res.json;
    res.json = function (body) {
        if (res.statusCode === 200 && req.user && body.success) {
            const userId = req.user.id || req.user._id;
            setImmediate(() => {
                (0, exports.logActivity)(userId, "credit_used", {
                    creditsRemaining: body.credits,
                }, req);
            });
        }
        return originalJson.call(this, body);
    };
    next();
};
exports.logCreditUsage = logCreditUsage;
const logCreditPurchase = (req, res, next) => {
    const originalJson = res.json;
    res.json = function (body) {
        if (res.statusCode === 200 && req.user && body.success) {
            const userId = req.user.id || req.user._id;
            setImmediate(() => {
                (0, exports.logActivity)(userId, "credit_purchased", {
                    creditsAdded: req.body.credits,
                    amount: req.body.amount,
                    totalCredits: body.credits,
                }, req);
            });
        }
        return originalJson.call(this, body);
    };
    next();
};
exports.logCreditPurchase = logCreditPurchase;
