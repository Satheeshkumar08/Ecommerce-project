import express, { Router } from 'express';
import { createIntent, handleWebhook } from '../controllers/payment.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

// Note: webhook needs raw body, mounted separately or parsed accordingly
router.post('/create-intent', authenticate, createIntent);
router.post('/webhook', express.raw({ type: 'application/json' }), handleWebhook);

export default router;
