import express from "express";
import {
  getUserCredits,
  useCredit,
  purchaseCredits,
  createPaymentIntent,
  stripeWebhook,
} from "../controllers/creditController";
import { verifyToken } from "../middleware/authMiddleware";
import {
  logCreditUsage,
  logCreditPurchase,
} from "../middleware/activityLogger";

const router = express.Router();

// Get user credits
router.get("/", verifyToken, getUserCredits);

// Use a credit
router.post("/use", verifyToken, logCreditUsage as any, useCredit);

// Purchase credits
router.post(
  "/purchase",
  verifyToken,
  logCreditPurchase as any,
  purchaseCredits
);

// Create Stripe payment intent
router.post("/create-payment-intent", verifyToken, createPaymentIntent);

// Stripe webhook handler - no auth needed as it comes from Stripe
router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  stripeWebhook
);

export default router;
