'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ShoppingBag, ShieldCheck, Truck, RotateCcw, Mail, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function Footer() {
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newsletterEmail) {
      setSubscribed(true);
      setNewsletterEmail('');
    }
  };

  return (
    <footer className="bg-slate-900 text-slate-300 pt-16 pb-12 border-t border-slate-800">
      {/* Trust & Guarantee Banner */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12 border-b border-slate-800">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-800/50">
            <div className="w-12 h-12 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center flex-shrink-0">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-semibold text-white text-sm">Free Express Delivery</h4>
              <p className="text-xs text-slate-400">On all orders over ₹999 across India</p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-800/50">
            <div className="w-12 h-12 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-semibold text-white text-sm">Secure Payment Gateway</h4>
              <p className="text-xs text-slate-400">End-to-end encrypted 256-bit Stripe checkout</p>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-800/50">
            <div className="w-12 h-12 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center flex-shrink-0">
              <RotateCcw className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-semibold text-white text-sm">30-Day Hassle-Free Returns</h4>
              <p className="text-xs text-slate-400">Money-back guarantee if not satisfied</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <span className="text-xl font-bold tracking-tight text-white">ApexCommerce</span>
            </div>
            <p className="text-sm text-slate-400 max-w-sm">
              Discover carefully curated premium electronics, fashion, lifestyle items, and home decor designed for modern living.
            </p>
            <div className="text-xs text-slate-500 space-y-1">
              <p>AWS Cloud Architecture: ECS Fargate • RDS PostgreSQL • S3</p>
              <p>Stripe Certified Payments • Real-time Order Tracking</p>
            </div>
          </div>

          {/* Quick Categories */}
          <div>
            <h5 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Categories</h5>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/products?category=electronics" className="hover:text-emerald-400 transition">
                  Electronics
                </Link>
              </li>
              <li>
                <Link href="/products?category=fashion" className="hover:text-emerald-400 transition">
                  Fashion & Apparel
                </Link>
              </li>
              <li>
                <Link href="/products?category=home-living" className="hover:text-emerald-400 transition">
                  Home & Living
                </Link>
              </li>
              <li>
                <Link href="/products?category=beauty-wellness" className="hover:text-emerald-400 transition">
                  Beauty & Wellness
                </Link>
              </li>
              <li>
                <Link href="/products?category=sports-outdoors" className="hover:text-emerald-400 transition">
                  Sports & Outdoors
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h5 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Support</h5>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/profile#orders" className="hover:text-emerald-400 transition">
                  Track Your Order
                </Link>
              </li>
              <li>
                <Link href="/products" className="hover:text-emerald-400 transition">
                  Catalog Search
                </Link>
              </li>
              <li>
                <span className="text-slate-400">Shipping Policy</span>
              </li>
              <li>
                <span className="text-slate-400">Returns & Refunds</span>
              </li>
              <li>
                <span className="text-slate-400">Privacy & Terms</span>
              </li>
            </ul>
          </div>

          {/* Newsletter Form */}
          <div>
            <h5 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Newsletter</h5>
            <p className="text-sm text-slate-400 mb-3">
              Subscribe to get exclusive early access to product drops and seasonal discounts.
            </p>
            {subscribed ? (
              <div className="flex items-center gap-2 text-emerald-400 text-sm py-2">
                <CheckCircle2 className="w-5 h-5" />
                <span>Thank you for subscribing!</span>
              </div>
            ) : (
              <form onSubmit={handleNewsletterSubmit} className="space-y-2">
                <div className="relative">
                  <input
                    type="email"
                    required
                    placeholder="Enter your email"
                    value={newsletterEmail}
                    onChange={(e) => setNewsletterEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    type="submit"
                    className="absolute right-1 top-1 bottom-1 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-medium flex items-center transition"
                  >
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
                <span className="text-xs text-slate-500">We respect your privacy. No spam.</span>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 border-t border-slate-800 text-center text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p>© {new Date().getFullYear()} ApexCommerce Cloud Inc. All rights reserved.</p>
        <div className="flex gap-6">
          <span>Terms of Service</span>
          <span>Privacy Policy</span>
          <span>Cookie Settings</span>
        </div>
      </div>
    </footer>
  );
}
