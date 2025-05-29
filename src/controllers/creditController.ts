import { Request, Response } from "express";
import User from "../models/User";
import stripe from "../config/stripe";

// Get user credits
export const getUserCredits = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    
    const user = await User.findById(userId);
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

// Use a credit
export const useCredit = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    
    const user = await User.findById(userId);
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
      credits: user.credits 
    });
  } catch (error) {
    console.error("Error using credit:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Credit package type
type CreditPackage = {
  credits: number;
  amount: number;
  productId: string;
};

type CreditPackages = {
  [key: string]: CreditPackage;
};

// Create payment intent for Stripe
export const createPaymentIntent = async (req: Request, res: Response): Promise<void> => {
  try {
    const { packageId } = req.body;
    
    // Define credit packages
    const creditPackages: CreditPackages = {
      "10credits": { 
        credits: 10, 
        amount: 299, // $2.99 in cents
        productId: process.env.STRIPE_CREDIT_PRODUCT_ID || 'prod_SOhlgeRRAcipbG'
      },
      "20credits": { credits: 20, amount: 550, productId: '' }, // $5.50 in cents
      "50credits": { credits: 50, amount: 1299, productId: '' } // $12.99 in cents
    };
    
    // Validate package selection
    if (!packageId || !creditPackages[packageId]) {
      res.status(400).json({ message: "Invalid package selected" });
      return;
    }
    
    const selectedPackage = creditPackages[packageId];
    
    // Create a PaymentIntent with the order amount and currency
    const paymentIntent = await stripe.paymentIntents.create({
      amount: selectedPackage.amount,
      currency: "usd",
      metadata: {
        userId: (req as any).user.id,
        credits: selectedPackage.credits.toString(),
        packageId,
        productId: selectedPackage.productId
      }
    });

    res.status(200).json({
      clientSecret: paymentIntent.client_secret,
      amount: selectedPackage.amount,
      credits: selectedPackage.credits
    });
  } catch (error) {
    console.error("Error creating payment intent:", error);
    res.status(500).json({ message: "Failed to create payment" });
  }
};

// Purchase credits
export const purchaseCredits = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = (req as any).user.id;
    const { credits, amount } = req.body;
    
    if (!credits || !amount) {
      res.status(400).json({ message: "Credits and amount are required" });
      return;
    }
    
    const user = await User.findById(userId);
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
      credits: user.credits
    });
  } catch (error) {
    console.error("Error purchasing credits:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Stripe webhook handler
export const stripeWebhook = async (req: Request, res: Response): Promise<void> => {
  const sig = req.headers['stripe-signature'] as string;
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
  
  let event;
  
  try {
    // If we have a webhook secret, verify the signature
    if (endpointSecret) {
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } else {
      // Otherwise, assume the event is properly formatted
      event = req.body;
    }
    
    // Handle the event
    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object;
      
      // Extract metadata from payment intent
      const { userId, credits } = paymentIntent.metadata;
      
      if (userId && credits) {
        // Update user's credits
        const user = await User.findById(userId);
        if (user) {
          user.credits += parseInt(credits);
          await user.save();
          console.log(`Added ${credits} credits to user ${userId}`);
        }
      }
    }
    
    // Return a 200 response to acknowledge receipt of the event
    res.status(200).json({ received: true });
  } catch (err: unknown) {
    console.error('Webhook Error:', err);
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    res.status(400).send(`Webhook Error: ${errorMessage}`);
  }
}; 