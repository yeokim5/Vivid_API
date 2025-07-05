"use strict";
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, "__esModule", { value: true });
exports.stripeWebhook =
  exports.purchaseCredits =
  exports.createPaymentIntent =
  exports.useCredit =
  exports.getUserCredits =
    void 0;
const User_1 = __importDefault(require("../models/User"));
const stripe_1 = __importDefault(require("../config/stripe"));
// Get user credits
const getUserCredits = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User_1.default.findById(userId);
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }
    res.status(200).json({ credits: user.credits });
  } catch (error) {
    console.error("Error getting user credits:", error);
    res.status(500).json({ message: "Server error" });
  }
};
exports.getUserCredits = getUserCredits;
// Use a credit
const useCredit = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User_1.default.findById(userId);
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }
    if (user.credits <= 0) {
      res.status(400).json({ message: "Not enough credits" });
      return;
    }
    user.credits -= 1;
    await user.save();
    res.status(200).json({
      success: true,
      message: "Credit used successfully",
      credits: user.credits,
    });
  } catch (error) {
    console.error("Error using credit:", error);
    res.status(500).json({ message: "Server error" });
  }
};
exports.useCredit = useCredit;
// Create payment intent for Stripe
const createPaymentIntent = async (req, res) => {
  try {
    const { packageId } = req.body;
    // Define credit packages
    const creditPackages = {
      "10credits": {
        credits: 10,
        amount: 499, // $4.99 in cents
        productId:
          process.env.STRIPE_CREDIT_PRODUCT_ID || "prod_Sch3JXuKAgGoES",
      },
    };
    // Validate package selection
    if (!packageId || !creditPackages[packageId]) {
      res.status(400).json({ message: "Invalid package selected" });
      return;
    }
    const selectedPackage = creditPackages[packageId];
    // Create a PaymentIntent with the order amount and currency
    const paymentIntent = await stripe_1.default.paymentIntents.create({
      amount: selectedPackage.amount,
      currency: "usd",
      metadata: {
        userId: req.user.id,
        credits: selectedPackage.credits.toString(),
        packageId,
        productId: selectedPackage.productId,
      },
    });
    res.status(200).json({
      clientSecret: paymentIntent.client_secret,
      amount: selectedPackage.amount,
      credits: selectedPackage.credits,
    });
  } catch (error) {
    console.error("Error creating payment intent:", error);
    res.status(500).json({ message: "Failed to create payment" });
  }
};
exports.createPaymentIntent = createPaymentIntent;
// Purchase credits
const purchaseCredits = async (req, res) => {
  try {
    const userId = req.user.id;
    const { credits, amount } = req.body;
    if (!credits || !amount) {
      res.status(400).json({ message: "Credits and amount are required" });
      return;
    }
    const user = await User_1.default.findById(userId);
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }
    // Add the credits to the user's account
    user.credits += credits;
    await user.save();
    res.status(200).json({
      success: true,
      message: `Successfully purchased ${credits} credits`,
      credits: user.credits,
    });
  } catch (error) {
    console.error("Error purchasing credits:", error);
    res.status(500).json({ message: "Server error" });
  }
};
exports.purchaseCredits = purchaseCredits;
// Stripe webhook handler
const stripeWebhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
  let event;
  try {
    // If we have a webhook secret, verify the signature
    if (endpointSecret) {
      event = stripe_1.default.webhooks.constructEvent(
        req.body,
        sig,
        endpointSecret
      );
    } else {
      // Otherwise, assume the event is properly formatted
      event = req.body;
    }
    // Handle the event
    if (event.type === "payment_intent.succeeded") {
      const paymentIntent = event.data.object;
      // Extract metadata from payment intent
      const { userId, credits } = paymentIntent.metadata;
      if (userId && credits) {
        // Update user's credits
        const user = await User_1.default.findById(userId);
        if (user) {
          user.credits += parseInt(credits);
          await user.save();
          console.log(`Added ${credits} credits to user ${userId}`);
        }
      }
    }
    // Return a 200 response to acknowledge receipt of the event
    res.status(200).json({ received: true });
  } catch (err) {
    console.error("Webhook Error:", err);
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    res.status(400).send(`Webhook Error: ${errorMessage}`);
  }
};
exports.stripeWebhook = stripeWebhook;
