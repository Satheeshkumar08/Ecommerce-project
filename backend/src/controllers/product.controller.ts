import { Request, Response } from 'express';
import { prisma } from '../config/db';
import { Prisma } from '@prisma/client';

export const getProducts = async (req: Request, res: Response): Promise<void> => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 12));
  const skip = (page - 1) * limit;

  const { search, category, minPrice, maxPrice, inStock, sortBy, rating } = req.query;

  const where: Prisma.ProductWhereInput = {
    isArchived: false,
  };

  // Search filter (name or description)
  if (search && typeof search === 'string' && search.trim() !== '') {
    where.OR = [
      { name: { contains: search.trim(), mode: 'insensitive' } },
      { description: { contains: search.trim(), mode: 'insensitive' } },
    ];
  }

  // Category filter (slug or id)
  if (category && typeof category === 'string' && category !== 'all') {
    where.category = {
      slug: category,
    };
  }

  // Price range filter
  if (minPrice || maxPrice) {
    where.price = {};
    if (minPrice) where.price.gte = parseFloat(minPrice as string);
    if (maxPrice) where.price.lte = parseFloat(maxPrice as string);
  }

  // In-stock filter
  if (inStock === 'true') {
    where.stock = { gt: 0 };
  }

  // Sorting
  let orderBy: Prisma.ProductOrderByWithRelationInput = { createdAt: 'desc' };
  if (sortBy === 'price_asc') {
    orderBy = { price: 'asc' };
  } else if (sortBy === 'price_desc') {
    orderBy = { price: 'desc' };
  } else if (sortBy === 'name_asc') {
    orderBy = { name: 'asc' };
  }

  // Fetch products and total count
  const [totalCount, products] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      skip,
      take: limit,
      orderBy,
      include: {
        category: {
          select: { id: true, name: true, slug: true },
        },
        images: {
          orderBy: { isPrimary: 'desc' },
        },
        reviews: {
          select: { rating: true },
        },
      },
    }),
  ]);

  // Compute average rating and review counts
  let formattedProducts = products.map((product) => {
    const totalReviews = product.reviews.length;
    const avgRating =
      totalReviews > 0
        ? Number((product.reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(1))
        : 5.0;

    return {
      id: product.id,
      name: product.name,
      slug: product.slug,
      description: product.description,
      price: Number(product.price),
      compareAtPrice: product.compareAtPrice ? Number(product.compareAtPrice) : null,
      stock: product.stock,
      sku: product.sku,
      isFeatured: product.isFeatured,
      category: product.category,
      images: product.images,
      avgRating,
      totalReviews,
      createdAt: product.createdAt,
    };
  });

  // Filter by minimum rating if requested
  if (rating) {
    const minRating = parseFloat(rating as string);
    formattedProducts = formattedProducts.filter((p) => p.avgRating >= minRating);
  }

  const totalPages = Math.ceil(totalCount / limit);

  res.json({
    products: formattedProducts,
    pagination: {
      totalItems: totalCount,
      totalPages,
      currentPage: page,
      limit,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  });
};

export const getProductBySlug = async (req: Request, res: Response): Promise<void> => {
  const { slug } = req.params;

  const product = await prisma.product.findUnique({
    where: { slug },
    include: {
      category: true,
      images: {
        orderBy: { isPrimary: 'desc' },
      },
      reviews: {
        include: {
          user: {
            select: { id: true, name: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!product) {
    res.status(404).json({ message: 'Product not found.' });
    return;
  }

  const totalReviews = product.reviews.length;
  const avgRating =
    totalReviews > 0
      ? Number((product.reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(1))
      : 5.0;

  // Rating breakdown distribution
  const ratingDistribution = [5, 4, 3, 2, 1].map((stars) => ({
    stars,
    count: product.reviews.filter((r) => r.rating === stars).length,
  }));

  res.json({
    product: {
      id: product.id,
      name: product.name,
      slug: product.slug,
      description: product.description,
      price: Number(product.price),
      compareAtPrice: product.compareAtPrice ? Number(product.compareAtPrice) : null,
      stock: product.stock,
      sku: product.sku,
      isFeatured: product.isFeatured,
      category: product.category,
      images: product.images,
      avgRating,
      totalReviews,
      ratingDistribution,
      reviews: product.reviews,
      createdAt: product.createdAt,
    },
  });
};

export const getRelatedProducts = async (req: Request, res: Response): Promise<void> => {
  const { slug } = req.params;

  const currentProduct = await prisma.product.findUnique({
    where: { slug },
    select: { id: true, categoryId: true },
  });

  if (!currentProduct) {
    res.status(404).json({ message: 'Product not found.' });
    return;
  }

  const related = await prisma.product.findMany({
    where: {
      categoryId: currentProduct.categoryId,
      id: { not: currentProduct.id },
      isArchived: false,
    },
    take: 4,
    include: {
      category: true,
      images: {
        orderBy: { isPrimary: 'desc' },
      },
      reviews: {
        select: { rating: true },
      },
    },
  });

  const formatted = related.map((p) => {
    const totalReviews = p.reviews.length;
    const avgRating =
      totalReviews > 0
        ? Number((p.reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(1))
        : 5.0;

    return {
      id: p.id,
      name: p.name,
      slug: p.slug,
      price: Number(p.price),
      compareAtPrice: p.compareAtPrice ? Number(p.compareAtPrice) : null,
      stock: p.stock,
      category: p.category,
      images: p.images,
      avgRating,
      totalReviews,
    };
  });

  res.json({ products: formatted });
};

export const getTrendingProducts = async (req: Request, res: Response): Promise<void> => {
  const trending = await prisma.product.findMany({
    where: { isFeatured: true, isArchived: false },
    take: 8,
    include: {
      category: true,
      images: {
        orderBy: { isPrimary: 'desc' },
      },
      reviews: {
        select: { rating: true },
      },
    },
  });

  const formatted = trending.map((p) => {
    const totalReviews = p.reviews.length;
    const avgRating =
      totalReviews > 0
        ? Number((p.reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(1))
        : 5.0;

    return {
      id: p.id,
      name: p.name,
      slug: p.slug,
      description: p.description,
      price: Number(p.price),
      compareAtPrice: p.compareAtPrice ? Number(p.compareAtPrice) : null,
      stock: p.stock,
      category: p.category,
      images: p.images,
      avgRating,
      totalReviews,
    };
  });

  res.json({ products: formatted });
};
