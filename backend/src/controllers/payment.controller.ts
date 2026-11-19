import { Request, Response } from 'express';
import { createPaymentIntent, stripe } from '../services/stripe.service';
import { env } from '../config/env';
import { prisma } from '../config/db';
import { PaymentStatus, OrderStatus } from '@prisma/client';

export const createIntent = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ message: 'Authentication required' });
    return;
  }

  const { amount } = req.body; // In INR (Indian Rupees)

  if (!amount || amount <= 0) {
    res.status(400).json({ message: 'Invalid payment amount.' });
    return;
  }

  try {
    const paymentIntent = await createPaymentIntent(amount, 'inr', {
      userId: req.user.id,
      userEmail: req.user.email,
    });

    res.json(paymentIntent);
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Payment intent creation failed.' });
  }
};

export const handleWebhook = async (req: Request, res: Response): Promise<void> => {
  const sig = req.headers['stripe-signature'];

  if (!stripe || !env.STRIPE_WEBHOOK_SECRET || !sig) {
    res.json({ received: true, note: 'Mock or unconfigured webhook mode' });
    return;
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, env.STRIPE_WEBHOOK_SECRET);
  } catch (err: any) {
    res.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }

  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object as any;
    console.log(`PaymentIntent for ${paymentIntent.amount} was successful!`);

    await prisma.order.updateMany({
      where: { stripePaymentIntentId: paymentIntent.id },
      data: {
        paymentStatus: PaymentStatus.COMPLETED,
        status: OrderStatus.PAID,
      },
    });
  }

  res.json({ received: true });
};
