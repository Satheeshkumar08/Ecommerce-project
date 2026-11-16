import { Request, Response } from 'express';
import { prisma } from '../config/db';
import { OrderStatus, PaymentStatus, PaymentMethod } from '@prisma/client';
import { sendOrderConfirmationEmail } from '../services/email.service';

export const createOrder = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ message: 'Authentication required' });
    return;
  }

  const { shippingAddress, paymentMethod, stripePaymentIntentId, items } = req.body;

  if (!items || items.length === 0) {
    res.status(400).json({ message: 'Cannot place an order with empty items.' });
    return;
  }

  try {
    // Execute order creation in a database transaction to ensure atomicity & avoid race conditions
    const order = await prisma.$transaction(async (tx) => {
      // 1. Validate items and stock
      let subtotal = 0;
      const orderItemsData = [];

      for (const item of items) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
          include: {
            images: {
              where: { isPrimary: true },
              take: 1,
            },
          },
        });

        if (!product || product.isArchived) {
          throw new Error(`Product not found or is no longer available.`);
        }

        if (product.stock < item.quantity) {
          throw new Error(
            `Insufficient stock for "${product.name}". Only ${product.stock} available.`
          );
        }

        // Decrement product stock
        await tx.product.update({
          where: { id: product.id },
          data: { stock: { decrement: item.quantity } },
        });

        const itemTotal = Number(product.price) * item.quantity;
        subtotal += itemTotal;

        orderItemsData.push({
          productId: product.id,
          productName: product.name,
          productPrice: product.price,
          productImage: product.images[0]?.url || '',
          quantity: item.quantity,
          total: itemTotal,
        });
      }

      const tax = Number((subtotal * 0.08).toFixed(2));
      const shippingCost = subtotal > 100 ? 0.0 : 15.0;
      const grandTotal = Number((subtotal + tax + shippingCost).toFixed(2));

      // 2. Save or link Address
      let address = await tx.address.findFirst({
        where: {
          userId: req.user!.id,
          addressLine1: shippingAddress.addressLine1,
          postalCode: shippingAddress.postalCode,
        },
      });

      if (!address) {
        address = await tx.address.create({
          data: {
            userId: req.user!.id,
            fullName: shippingAddress.fullName,
            addressLine1: shippingAddress.addressLine1,
            addressLine2: shippingAddress.addressLine2,
            city: shippingAddress.city,
            state: shippingAddress.state,
            postalCode: shippingAddress.postalCode,
            country: shippingAddress.country,
            phone: shippingAddress.phone,
            isDefault: false,
          },
        });
      }

      // Generate human-readable order number
      const orderNumber = `ORD-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;

      const paymentStat =
        paymentMethod === PaymentMethod.STRIPE
          ? PaymentStatus.COMPLETED
          : PaymentStatus.PENDING;

      // 3. Create Order
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          userId: req.user!.id,
          addressId: address.id,
          status: paymentMethod === PaymentMethod.STRIPE ? OrderStatus.PAID : OrderStatus.PENDING,
          paymentStatus: paymentStat,
          paymentMethod: paymentMethod as PaymentMethod,
          stripePaymentIntentId: stripePaymentIntentId || null,
          subtotal,
          tax,
          shippingCost,
          total: grandTotal,
          items: {
            create: orderItemsData,
          },
        },
        include: {
          items: true,
          address: true,
        },
      });

      // 4. Clear user's cart in database
      await tx.cartItem.deleteMany({
        where: { userId: req.user!.id },
      });

      return newOrder;
    });

    // 5. Send order confirmation email asynchronously
    const emailItems = order.items.map((i) => ({
      name: i.productName,
      quantity: i.quantity,
      price: Number(i.productPrice),
    }));

    sendOrderConfirmationEmail(
      req.user.email,
      req.user.name,
      order.orderNumber,
      emailItems,
      Number(order.total)
    ).catch(console.error);

    res.status(201).json({
      message: 'Order created successfully!',
      order,
    });
  } catch (error: any) {
    res.status(400).json({ message: error.message || 'Failed to create order.' });
  }
};

export const getMyOrders = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ message: 'Authentication required' });
    return;
  }

  const orders = await prisma.order.findMany({
    where: { userId: req.user.id },
    include: {
      items: true,
      address: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  res.json({ orders });
};

export const getOrderById = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ message: 'Authentication required' });
    return;
  }

  const { id } = req.params;

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: true,
      address: true,
      user: {
        select: { id: true, name: true, email: true },
      },
    },
  });

  if (!order) {
    res.status(404).json({ message: 'Order not found.' });
    return;
  }

  // Only allow user to view their own order (unless admin)
  if (order.userId !== req.user.id && req.user.role !== 'ADMIN') {
    res.status(403).json({ message: 'Access denied.' });
    return;
  }

  res.json({ order });
};
