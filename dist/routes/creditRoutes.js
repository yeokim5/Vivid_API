"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const creditController_1 = require("../controllers/creditController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const activityLogger_1 = require("../middleware/activityLogger");
const router = express_1.default.Router();
// Get user credits
router.get("/", authMiddleware_1.verifyToken, creditController_1.getUserCredits);
// Use a credit
router.post("/use", authMiddleware_1.verifyToken, activityLogger_1.logCreditUsage, creditController_1.useCredit);
// Purchase credits
router.post("/purchase", authMiddleware_1.verifyToken, activityLogger_1.logCreditPurchase, creditController_1.purchaseCredits);
// Create Stripe payment intent
router.post("/create-payment-intent", authMiddleware_1.verifyToken, creditController_1.createPaymentIntent);
// Stripe webhook handler - no auth needed as it comes from Stripe
router.post("/webhook", express_1.default.raw({ type: "application/json" }), creditController_1.stripeWebhook);
exports.default = router;
