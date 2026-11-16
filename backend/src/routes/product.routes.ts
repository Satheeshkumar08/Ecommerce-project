import { Router } from 'express';
import {
  getProducts,
  getProductBySlug,
  getRelatedProducts,
  getTrendingProducts,
} from '../controllers/product.controller';
import { validateRequest } from '../middlewares/validate.middleware';
import { productQuerySchema } from '../schemas/product.schema';

const router = Router();

router.get('/', validateRequest(productQuerySchema), getProducts);
router.get('/trending', getTrendingProducts);
router.get('/:slug', getProductBySlug);
router.get('/:slug/related', getRelatedProducts);

export default router;
