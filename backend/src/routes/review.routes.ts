import { Router } from 'express';
import { createReview, getProductReviews } from '../controllers/review.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validateRequest } from '../middlewares/validate.middleware';
import { createReviewSchema } from '../schemas/review.schema';

const router = Router();

router.get('/product/:productId', getProductReviews);
router.post('/product/:productId', authenticate, validateRequest(createReviewSchema), createReview);

export default router;
