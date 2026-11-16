import { z } from 'zod';

export const createProductSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Product name is required'),
    description: z.string().min(10, 'Description must be at least 10 characters'),
    price: z.coerce.number().positive('Price must be greater than zero'),
    compareAtPrice: z.coerce.number().positive().optional().nullable(),
    stock: z.coerce.number().int().min(0, 'Stock cannot be negative'),
    sku: z.string().min(3, 'SKU must be at least 3 characters'),
    categoryId: z.string().min(1, 'Category ID is required'),
    isFeatured: z.coerce.boolean().optional().default(false),
    images: z.array(z.string().url('Must be a valid image URL')).optional().default([]),
  }),
});

export const updateProductSchema = z.object({
  params: z.object({
    id: z.string().min(1, 'Product ID is required'),
  }),
  body: z.object({
    name: z.string().min(2).optional(),
    description: z.string().min(10).optional(),
    price: z.coerce.number().positive().optional(),
    compareAtPrice: z.coerce.number().positive().optional().nullable(),
    stock: z.coerce.number().int().min(0).optional(),
    sku: z.string().min(3).optional(),
    categoryId: z.string().optional(),
    isFeatured: z.coerce.boolean().optional(),
    isArchived: z.coerce.boolean().optional(),
    images: z.array(z.string().url()).optional(),
  }),
});

export const productQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().optional().default(1),
    limit: z.coerce.number().int().positive().optional().default(12),
    search: z.string().optional(),
    category: z.string().optional(),
    minPrice: z.coerce.number().min(0).optional(),
    maxPrice: z.coerce.number().min(0).optional(),
    rating: z.coerce.number().min(1).max(5).optional(),
    inStock: z.enum(['true', 'false']).optional(),
    sortBy: z.enum(['price_asc', 'price_desc', 'newest', 'rating', 'name_asc']).optional().default('newest'),
  }),
});
