import { Request, Response } from 'express';
import { prisma } from '../config/db';
import slugify from 'slugify';
import { uploadFileToS3 } from '../services/s3.service';
import { OrderStatus, PaymentStatus } from '@prisma/client';

// 1. OVERVIEW & METRICS
export const getOverviewMetrics = async (req: Request, res: Response): Promise<void> => {
  const [
    totalCustomers,
    totalOrders,
    ordersAggregation,
    lowStockCount,
    recentOrders,
    recentCustomers,
  ] = await Promise.all([
    prisma.user.count({ where: { role: 'CUSTOMER' } }),
    prisma.order.count(),
    prisma.order.aggregate({
      _sum: {
        total: true,
      },
      where: {
        paymentStatus: { in: ['COMPLETED', 'PENDING'] },
      },
    }),
    prisma.product.count({
      where: {
        stock: { lte: 5 },
        isArchived: false,
      },
    }),
    prisma.order.findMany({
      take: 6,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, name: true, email: true } },
        items: true,
      },
    }),
    prisma.user.findMany({
      where: { role: 'CUSTOMER' },
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: { id: true, name: true, email: true, createdAt: true, isBlocked: true },
    }),
  ]);

  // Low stock products list
  const lowStockProducts = await prisma.product.findMany({
    where: { stock: { lte: 5 }, isArchived: false },
    take: 6,
    select: { id: true, name: true, stock: true, sku: true, price: true },
  });

  const totalSales = Number(ordersAggregation._sum.total || 0);

  // Status breakdown
  const [pendingOrders, paidOrders, shippedOrders, deliveredOrders] = await Promise.all([
    prisma.order.count({ where: { status: OrderStatus.PENDING } }),
    prisma.order.count({ where: { status: OrderStatus.PAID } }),
    prisma.order.count({ where: { status: OrderStatus.SHIPPED } }),
    prisma.order.count({ where: { status: OrderStatus.DELIVERED } }),
  ]);

  res.json({
    metrics: {
      totalSales,
      totalOrders,
      totalCustomers,
      lowStockCount,
    },
    ordersBreakdown: {
      pending: pendingOrders,
      paid: paidOrders,
      shipped: shippedOrders,
      delivered: deliveredOrders,
    },
    lowStockProducts,
    recentOrders,
    recentCustomers,
  });
};

// 2. PRODUCT MANAGEMENT
export const getAdminProducts = async (req: Request, res: Response): Promise<void> => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));
  const skip = (page - 1) * limit;
  const search = req.query.search as string;
  const categoryId = req.query.categoryId as string;

  const where: any = {};
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { sku: { contains: search, mode: 'insensitive' } },
    ];
  }
  if (categoryId) {
    where.categoryId = categoryId;
  }

  const [totalCount, products] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      skip,
      take: limit,
      include: {
        category: true,
        images: true,
      },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  res.json({
    products,
    pagination: {
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      page,
      limit,
    },
  });
};

export const createProduct = async (req: Request, res: Response): Promise<void> => {
  const {
    name,
    description,
    price,
    compareAtPrice,
    stock,
    sku,
    categoryId,
    isFeatured = false,
    images = [],
  } = req.body;

  let baseSlug = slugify(name, { lower: true, strict: true });
  let slug = baseSlug;
  let counter = 1;
  while (await prisma.product.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${counter++}`;
  }

  const product = await prisma.product.create({
    data: {
      name,
      slug,
      description,
      price,
      compareAtPrice,
      stock,
      sku,
      categoryId,
      isFeatured,
      images: {
        create: images.map((url: string, index: number) => ({
          url,
          isPrimary: index === 0,
        })),
      },
    },
    include: {
      images: true,
      category: true,
    },
  });

  res.status(201).json({
    message: 'Product created successfully',
    product,
  });
};

export const updateProduct = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const {
    name,
    description,
    price,
    compareAtPrice,
    stock,
    sku,
    categoryId,
    isFeatured,
    isArchived,
    images,
  } = req.body;

  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) {
    res.status(404).json({ message: 'Product not found.' });
    return;
  }

  const updateData: any = {};
  if (name !== undefined) {
    updateData.name = name;
    updateData.slug = slugify(name, { lower: true, strict: true });
  }
  if (description !== undefined) updateData.description = description;
  if (price !== undefined) updateData.price = price;
  if (compareAtPrice !== undefined) updateData.compareAtPrice = compareAtPrice;
  if (stock !== undefined) updateData.stock = stock;
  if (sku !== undefined) updateData.sku = sku;
  if (categoryId !== undefined) updateData.categoryId = categoryId;
  if (isFeatured !== undefined) updateData.isFeatured = isFeatured;
  if (isArchived !== undefined) updateData.isArchived = isArchived;

  // If new images provided, replace existing images
  if (Array.isArray(images) && images.length > 0) {
    await prisma.productImage.deleteMany({ where: { productId: id } });
    await prisma.productImage.createMany({
      data: images.map((url: string, index: number) => ({
        productId: id,
        url,
        isPrimary: index === 0,
      })),
    });
  }

  const updated = await prisma.product.update({
    where: { id },
    data: updateData,
    include: {
      images: true,
      category: true,
    },
  });

  res.json({
    message: 'Product updated successfully',
    product: updated,
  });
};

export const deleteProduct = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) {
    res.status(404).json({ message: 'Product not found.' });
    return;
  }

  // Soft delete / archive to preserve historic order data
  await prisma.product.update({
    where: { id },
    data: { isArchived: true },
  });

  res.json({ message: 'Product archived successfully.' });
};

export const uploadImage = async (req: Request, res: Response): Promise<void> => {
  const file = req.file;
  if (!file) {
    res.status(400).json({ message: 'No image file uploaded.' });
    return;
  }

  try {
    const uploadResult = await uploadFileToS3(
      file.buffer,
      file.originalname,
      file.mimetype
    );

    res.json({
      message: 'Image uploaded successfully to AWS S3',
      url: uploadResult.url,
      key: uploadResult.key,
    });
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Image upload failed.' });
  }
};

// 3. CATEGORY MANAGEMENT
export const createCategory = async (req: Request, res: Response): Promise<void> => {
  const { name, description, image } = req.body;

  let baseSlug = slugify(name, { lower: true, strict: true });
  let slug = baseSlug;
  let counter = 1;
  while (await prisma.category.findUnique({ where: { slug } })) {
    slug = `${baseSlug}-${counter++}`;
  }

  const category = await prisma.category.create({
    data: {
      name,
      slug,
      description,
      image,
    },
  });

  res.status(201).json({
    message: 'Category created successfully',
    category,
  });
};

export const updateCategory = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { name, description, image } = req.body;

  const updateData: any = {};
  if (name) {
    updateData.name = name;
    updateData.slug = slugify(name, { lower: true, strict: true });
  }
  if (description !== undefined) updateData.description = description;
  if (image !== undefined) updateData.image = image;

  const category = await prisma.category.update({
    where: { id },
    data: updateData,
  });

  res.json({
    message: 'Category updated successfully',
    category,
  });
};

export const deleteCategory = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  const count = await prisma.product.count({ where: { categoryId: id } });
  if (count > 0) {
    res.status(400).json({
      message: `Cannot delete category containing ${count} products. Reassign products first.`,
    });
    return;
  }

  await prisma.category.delete({ where: { id } });
  res.json({ message: 'Category deleted successfully.' });
};

// 4. CUSTOMER MANAGEMENT
export const getCustomers = async (req: Request, res: Response): Promise<void> => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));
  const skip = (page - 1) * limit;

  const [totalCount, customers] = await Promise.all([
    prisma.user.count({ where: { role: 'CUSTOMER' } }),
    prisma.user.findMany({
      where: { role: 'CUSTOMER' },
      skip,
      take: limit,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isBlocked: true,
        createdAt: true,
        _count: {
          select: { orders: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  res.json({
    customers,
    pagination: {
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      page,
      limit,
    },
  });
};

export const getCustomerById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  const customer = await prisma.user.findUnique({
    where: { id },
    include: {
      addresses: true,
      orders: {
        include: { items: true },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (!customer) {
    res.status(404).json({ message: 'Customer not found.' });
    return;
  }

  res.json({ customer });
};

export const toggleBlockCustomer = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    res.status(404).json({ message: 'User not found.' });
    return;
  }

  const updated = await prisma.user.update({
    where: { id },
    data: { isBlocked: !user.isBlocked },
    select: { id: true, name: true, email: true, isBlocked: true },
  });

  res.json({
    message: `Customer successfully ${updated.isBlocked ? 'blocked' : 'unblocked'}.`,
    user: updated,
  });
};

// 5. ORDER MANAGEMENT
export const getAdminOrders = async (req: Request, res: Response): Promise<void> => {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));
  const skip = (page - 1) * limit;
  const status = req.query.status as OrderStatus;

  const where: any = {};
  if (status && Object.values(OrderStatus).includes(status)) {
    where.status = status;
  }

  const [totalCount, orders] = await Promise.all([
    prisma.order.count({ where }),
    prisma.order.findMany({
      where,
      skip,
      take: limit,
      include: {
        user: { select: { id: true, name: true, email: true } },
        items: true,
        address: true,
      },
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  res.json({
    orders,
    pagination: {
      totalCount,
      totalPages: Math.ceil(totalCount / limit),
      page,
      limit,
    },
  });
};

export const updateOrderStatus = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { status, paymentStatus } = req.body;

  const order = await prisma.order.findUnique({ where: { id } });
  if (!order) {
    res.status(404).json({ message: 'Order not found.' });
    return;
  }

  const updateData: any = {};
  if (status) updateData.status = status as OrderStatus;
  if (paymentStatus) updateData.paymentStatus = paymentStatus as PaymentStatus;

  const updatedOrder = await prisma.order.update({
    where: { id },
    data: updateData,
    include: {
      user: { select: { id: true, name: true, email: true } },
      items: true,
    },
  });

  res.json({
    message: 'Order status updated successfully',
    order: updatedOrder,
  });
};
