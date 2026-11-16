import { Request, Response } from 'express';
import { prisma } from '../config/db';

export const getCart = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ message: 'Authentication required' });
    return;
  }

  const items = await prisma.cartItem.findMany({
    where: { userId: req.user.id },
    include: {
      product: {
        include: {
          images: {
            where: { isPrimary: true },
            take: 1,
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  const formattedItems = items.map((item) => ({
    id: item.id,
    productId: item.productId,
    name: item.product.name,
    slug: item.product.slug,
    price: Number(item.product.price),
    image: item.product.images[0]?.url || '',
    stock: item.product.stock,
    quantity: item.quantity,
    total: Number(item.product.price) * item.quantity,
  }));

  const subtotal = formattedItems.reduce((acc, curr) => acc + curr.total, 0);
  const tax = Number((subtotal * 0.08).toFixed(2));
  const shipping = subtotal > 100 || subtotal === 0 ? 0 : 15.0;
  const grandTotal = Number((subtotal + tax + shipping).toFixed(2));

  res.json({
    items: formattedItems,
    summary: {
      subtotal,
      tax,
      shipping,
      grandTotal,
      itemCount: formattedItems.reduce((acc, curr) => acc + curr.quantity, 0),
    },
  });
};

export const addToCart = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ message: 'Authentication required' });
    return;
  }

  const { productId, quantity = 1 } = req.body;

  const product = await prisma.product.findUnique({
    where: { id: productId },
  });

  if (!product || product.isArchived) {
    res.status(404).json({ message: 'Product not found.' });
    return;
  }

  if (product.stock < quantity) {
    res.status(400).json({ message: `Only ${product.stock} items remaining in stock.` });
    return;
  }

  const existingItem = await prisma.cartItem.findUnique({
    where: {
      userId_productId: {
        userId: req.user.id,
        productId,
      },
    },
  });

  if (existingItem) {
    const newQty = existingItem.quantity + quantity;
    if (newQty > product.stock) {
      res.status(400).json({ message: `Cannot add more than available stock (${product.stock}).` });
      return;
    }

    await prisma.cartItem.update({
      where: { id: existingItem.id },
      data: { quantity: newQty },
    });
  } else {
    await prisma.cartItem.create({
      data: {
        userId: req.user.id,
        productId,
        quantity,
      },
    });
  }

  res.json({ message: 'Item added to cart successfully.' });
};

export const updateCartItem = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ message: 'Authentication required' });
    return;
  }

  const { id } = req.params;
  const { quantity } = req.body;

  if (quantity <= 0) {
    await prisma.cartItem.delete({
      where: { id, userId: req.user.id },
    });
    res.json({ message: 'Item removed from cart.' });
    return;
  }

  const item = await prisma.cartItem.findUnique({
    where: { id },
    include: { product: true },
  });

  if (!item || item.userId !== req.user.id) {
    res.status(404).json({ message: 'Cart item not found.' });
    return;
  }

  if (item.product.stock < quantity) {
    res.status(400).json({ message: `Only ${item.product.stock} items in stock.` });
    return;
  }

  await prisma.cartItem.update({
    where: { id },
    data: { quantity },
  });

  res.json({ message: 'Cart updated successfully.' });
};

export const removeFromCart = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ message: 'Authentication required' });
    return;
  }

  const { id } = req.params;

  await prisma.cartItem.deleteMany({
    where: { id, userId: req.user.id },
  });

  res.json({ message: 'Item removed from cart.' });
};

export const clearCart = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ message: 'Authentication required' });
    return;
  }

  await prisma.cartItem.deleteMany({
    where: { userId: req.user.id },
  });

  res.json({ message: 'Cart cleared successfully.' });
};

export const syncCart = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ message: 'Authentication required' });
    return;
  }

  const { items } = req.body; // Array of { productId, quantity }

  if (Array.isArray(items)) {
    for (const item of items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
      });

      if (product && product.stock > 0) {
        const qty = Math.min(item.quantity, product.stock);
        await prisma.cartItem.upsert({
          where: {
            userId_productId: {
              userId: req.user.id,
              productId: item.productId,
            },
          },
          update: { quantity: qty },
          create: {
            userId: req.user.id,
            productId: item.productId,
            quantity: qty,
          },
        });
      }
    }
  }

  res.json({ message: 'Cart synced successfully.' });
};
