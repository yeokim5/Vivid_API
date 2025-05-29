import { Stripe } from 'stripe';

declare module 'stripe' {
  namespace Stripe {
    interface StripeConfig {
      apiVersion: '2025-04-30.basil';
    }
  }
} 