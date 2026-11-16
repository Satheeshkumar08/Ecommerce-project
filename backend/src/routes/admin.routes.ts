import { Router } from 'express';
import multer from 'multer';
import {
  getOverviewMetrics,
  getAdminProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  uploadImage,
  createCategory,
  updateCategory,
  deleteCategory,
  getCustomers,
  getCustomerById,
  toggleBlockCustomer,
  getAdminOrders,
  updateOrderStatus,
} from '../controllers/admin.controller';
import { authenticate, requireAdmin } from '../middlewares/auth.middleware';
import { validateRequest } from '../middlewares/validate.middleware';
import { createProductSchema, updateProductSchema } from '../schemas/product.schema';
import { createCategorySchema, updateCategorySchema } from '../schemas/category.schema';
import { updateOrderStatusSchema } from '../schemas/order.schema';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  },
});

// Admin-only middleware pipeline
router.use(authenticate, requireAdmin);

// Overview metrics
router.get('/overview', getOverviewMetrics);

// Product management
router.get('/products', getAdminProducts);
router.post('/products', validateRequest(createProductSchema), createProduct);
router.put('/products/:id', validateRequest(updateProductSchema), updateProduct);
router.delete('/products/:id', deleteProduct);
router.post('/upload', upload.single('image'), uploadImage);

// Category management
router.post('/categories', validateRequest(createCategorySchema), createCategory);
router.put('/categories/:id', validateRequest(updateCategorySchema), updateCategory);
router.delete('/categories/:id', deleteCategory);

// Customer management
router.get('/customers', getCustomers);
router.get('/customers/:id', getCustomerById);
router.patch('/customers/:id/toggle-block', toggleBlockCustomer);

// Order management
router.get('/orders', getAdminOrders);
router.put('/orders/:id/status', validateRequest(updateOrderStatusSchema), updateOrderStatus);

export default router;
