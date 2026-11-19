import Stripe from 'stripe';
import { env } from '../config/env';

export const stripe = env.STRIPE_SECRET_KEY
  ? new Stripe(env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-01-27.acacia' as any,
    })
  : null;

export const createPaymentIntent = async (
  amount: number,
  currency: string = 'inr',
  metadata: Record<string, string> = {}
) => {
  if (!stripe) {
    // In dev / test mode without a real secret key, return a mock client_secret for smooth testing
    console.warn('[Stripe Service] STRIPE_SECRET_KEY is not set. Generating mock payment intent client_secret.');
    return {
      clientSecret: `pi_mock_${Date.now()}_secret_${Math.random().toString(36).substring(7)}`,
      id: `pi_mock_${Date.now()}`,
    };
  }

  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(amount * 100), // Stripe takes amounts in smallest currency unit (paise/cents)
    currency,
    automatic_payment_methods: {
      enabled: true,
    },
    metadata,
  });

  return {
    clientSecret: paymentIntent.client_secret,
    id: paymentIntent.id,
  };
};
