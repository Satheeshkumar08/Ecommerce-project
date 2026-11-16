import { z } from 'zod';

export const createReviewSchema = z.object({
  params: z.object({
    productId: z.string().min(1, 'Product ID is required'),
  }),
  body: z.object({
    rating: z.coerce.number().int().min(1, 'Rating must be between 1 and 5').max(5, 'Rating must be between 1 and 5'),
    title: z.string().optional(),
    comment: z.string().min(5, 'Review comment must be at least 5 characters'),
  }),
});
