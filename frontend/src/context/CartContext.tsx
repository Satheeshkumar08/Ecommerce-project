'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '@/lib/api';
import { useAuth } from './AuthContext';

export interface CartItem {
  id: string;
  productId: string;
  name: string;
  slug: string;
  price: number;
  image: string;
  stock: number;
  quantity: number;
  total: number;
}

export interface CartSummary {
  subtotal: number;
  tax: number;
  shipping: number;
  grandTotal: number;
  itemCount: number;
}

interface CartContextType {
  items: CartItem[];
  summary: CartSummary;
  loading: boolean;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  addToCart: (product: any, quantity?: number) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeFromCart: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Compute summary values
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const tax = Number((subtotal * 0.08).toFixed(2));
  const shipping = subtotal > 100 || subtotal === 0 ? 0 : 15.0;
  const grandTotal = Number((subtotal + tax + shipping).toFixed(2));
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const summary: CartSummary = {
    subtotal,
    tax,
    shipping,
    grandTotal,
    itemCount,
  };

  const fetchBackendCart = async () => {
    try {
      const res = await api.get('/cart');
      setItems(res.items || []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  // On mount or auth state change
  useEffect(() => {
    if (isAuthenticated) {
      // Sync local items if any exist
      const local = localStorage.getItem('guest_cart');
      if (local) {
        try {
          const guestItems = JSON.parse(local);
          if (Array.isArray(guestItems) && guestItems.length > 0) {
            api
              .post('/cart/sync', {
                items: guestItems.map((g: any) => ({
                  productId: g.productId,
                  quantity: g.quantity,
                })),
              })
              .then(() => {
                localStorage.removeItem('guest_cart');
                fetchBackendCart();
              });
            return;
          }
        } catch {}
      }
      fetchBackendCart();
    } else {
      // Load guest cart from localStorage
      const local = localStorage.getItem('guest_cart');
      if (local) {
        try {
          setItems(JSON.parse(local));
        } catch {
          setItems([]);
        }
      } else {
        setItems([]);
      }
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Persist guest cart to localStorage
  const saveGuestCart = (newItems: CartItem[]) => {
    setItems(newItems);
    if (!isAuthenticated && typeof window !== 'undefined') {
      localStorage.setItem('guest_cart', JSON.stringify(newItems));
    }
  };

  const addToCart = async (product: any, quantity: number = 1) => {
    if (isAuthenticated) {
      await api.post('/cart/add', {
        productId: product.id,
        quantity,
      });
      await fetchBackendCart();
    } else {
      const existing = items.find((i) => i.productId === product.id);
      let updated: CartItem[];
      if (existing) {
        updated = items.map((i) =>
          i.productId === product.id
            ? {
                ...i,
                quantity: i.quantity + quantity,
                total: (i.quantity + quantity) * i.price,
              }
            : i
        );
      } else {
        const newItem: CartItem = {
          id: `guest_${Date.now()}_${Math.random().toString(36).substring(7)}`,
          productId: product.id,
          name: product.name,
          slug: product.slug,
          price: Number(product.price),
          image: product.images?.[0]?.url || product.image || '',
          stock: product.stock,
          quantity,
          total: Number(product.price) * quantity,
        };
        updated = [...items, newItem];
      }
      saveGuestCart(updated);
    }
    setIsCartOpen(true);
  };

  const updateQuantity = async (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      await removeFromCart(itemId);
      return;
    }

    if (isAuthenticated) {
      await api.put(`/cart/${itemId}`, { quantity });
      await fetchBackendCart();
    } else {
      const updated = items.map((i) =>
        i.id === itemId
          ? {
              ...i,
              quantity,
              total: i.price * quantity,
            }
          : i
      );
      saveGuestCart(updated);
    }
  };

  const removeFromCart = async (itemId: string) => {
    if (isAuthenticated) {
      await api.delete(`/cart/${itemId}`);
      await fetchBackendCart();
    } else {
      const updated = items.filter((i) => i.id !== itemId);
      saveGuestCart(updated);
    }
  };

  const clearCart = async () => {
    if (isAuthenticated) {
      await api.delete('/cart');
      setItems([]);
    } else {
      saveGuestCart([]);
    }
  };

  const refreshCart = async () => {
    if (isAuthenticated) {
      await fetchBackendCart();
    }
  };

  return (
    <CartContext.Provider
      value={{
        items,
        summary,
        loading,
        isCartOpen,
        setIsCartOpen,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        refreshCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
