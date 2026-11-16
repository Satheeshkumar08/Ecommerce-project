import { Request, Response } from 'express';
import { prisma } from '../config/db';

export const getCategories = async (req: Request, res: Response): Promise<void> => {
  const categories = await prisma.category.findMany({
    include: {
      _count: {
        select: { products: { where: { isArchived: false } } },
      },
    },
    orderBy: { name: 'asc' },
  });

  const formatted = categories.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    description: c.description,
    image: c.image,
    productCount: c._count.products,
  }));

  res.json({ categories: formatted });
};

export const getCategoryBySlug = async (req: Request, res: Response): Promise<void> => {
  const { slug } = req.params;

  const category = await prisma.category.findUnique({
    where: { slug },
    include: {
      _count: {
        select: { products: { where: { isArchived: false } } },
      },
    },
  });

  if (!category) {
    res.status(404).json({ message: 'Category not found.' });
    return;
  }

  res.json({
    category: {
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description,
      image: category.image,
      productCount: category._count.products,
    },
  });
};
