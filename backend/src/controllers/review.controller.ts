import { Request, Response } from 'express';
import { prisma } from '../config/db';

export const createReview = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ message: 'Authentication required' });
    return;
  }

  const { productId } = req.params;
  const { rating, title, comment } = req.body;

  const product = await prisma.product.findUnique({
    where: { id: productId },
  });

  if (!product) {
    res.status(404).json({ message: 'Product not found.' });
    return;
  }

  const review = await prisma.review.upsert({
    where: {
      userId_productId: {
        userId: req.user.id,
        productId,
      },
    },
    update: {
      rating,
      title,
      comment,
    },
    create: {
      userId: req.user.id,
      productId,
      rating,
      title,
      comment,
    },
    include: {
      user: {
        select: { id: true, name: true },
      },
    },
  });

  res.status(201).json({
    message: 'Review submitted successfully',
    review,
  });
};

export const getProductReviews = async (req: Request, res: Response): Promise<void> => {
  const { productId } = req.params;

  const reviews = await prisma.review.findMany({
    where: { productId },
    include: {
      user: {
        select: { id: true, name: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  res.json({ reviews });
};
