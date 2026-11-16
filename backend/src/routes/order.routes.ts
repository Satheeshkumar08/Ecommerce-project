import { Router } from 'express';
import { createOrder, getMyOrders, getOrderById } from '../controllers/order.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validateRequest } from '../middlewares/validate.middleware';
import { createOrderSchema } from '../schemas/order.schema';

const router = Router();

router.use(authenticate);

router.post('/', validateRequest(createOrderSchema), createOrder);
router.get('/my-orders', getMyOrders);
router.get('/:id', getOrderById);

export default router;
