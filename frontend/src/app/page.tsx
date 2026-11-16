'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import ProductCard from '@/components/product/ProductCard';
import { api } from '@/lib/api';
import {
  ArrowRight,
  Sparkles,
  ShieldCheck,
  TrendingUp,
  Zap,
  ShoppingBag,
  Percent,
} from 'lucide-react';

export default function HomePage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [trendingProducts, setTrendingProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [catRes, trendRes] = await Promise.all([
          api.get('/categories').catch(() => ({ categories: [] })),
          api.get('/products/trending').catch(() => ({ products: [] })),
        ]);
        setCategories(catRes.categories || []);
        setTrendingProducts(trendRes.products || []);
      } catch (err) {
        console.error('Failed to load home page data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="space-y-16 sm:space-y-24 pb-20">
      {/* 1. HERO BANNER */}
      <section className="relative overflow-hidden bg-slate-900 text-white">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-950/80 via-slate-900/90 to-slate-950/90 z-10" />
        <div
          className="absolute inset-0 bg-cover bg-center opacity-30 scale-105 transition-transform duration-1000"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1800&q=80')",
          }}
        />

        <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-32 lg:py-40">
          <div className="max-w-2xl space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold tracking-wide uppercase">
              <Sparkles className="w-3.5 h-3.5" />
              Next-Gen Cloud E-Commerce Platform
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight text-white">
              Curated Essentials for <span className="text-emerald-400">Elevated Living</span>.
            </h1>

            <p className="text-base sm:text-lg text-slate-300 max-w-xl leading-relaxed">
              Experience hand-picked electronics, artisanal lifestyle products, and modern apparel. Ultra-fast global shipping with enterprise cloud reliability.
            </p>

            <div className="flex flex-wrap gap-4 pt-4">
              <Link
                href="/products"
                className="inline-flex items-center gap-2.5 px-6 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold text-sm shadow-lg shadow-emerald-600/30 transition transform hover:-translate-y-0.5"
              >
                <ShoppingBag className="w-4 h-4" />
                Explore Catalog
              </Link>
              <Link
                href="/products?category=electronics"
                className="inline-flex items-center gap-2 px-6 py-3.5 bg-slate-800/80 hover:bg-slate-800 text-slate-200 border border-slate-700 rounded-xl font-semibold text-sm transition"
              >
                Top Tech Gadgets
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 2. FEATURED CATEGORIES */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <div className="flex items-center gap-2 text-emerald-600 text-xs font-bold uppercase tracking-wider mb-1">
              <Zap className="w-4 h-4" />
              Browse Collections
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Featured Categories
            </h2>
          </div>
          <Link
            href="/products"
            className="text-sm font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1.5 transition"
          >
            View all categories
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-6">
          {categories.slice(0, 6).map((cat) => (
            <Link
              key={cat.id}
              href={`/products?category=${cat.slug}`}
              className="group relative rounded-2xl overflow-hidden bg-white border border-slate-200/80 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col text-center"
            >
              <div className="aspect-square w-full overflow-hidden bg-slate-100">
                <img
                  src={cat.image || 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=400&q=80'}
                  alt={cat.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
              </div>
              <div className="p-3 bg-white">
                <h3 className="font-semibold text-slate-900 text-xs sm:text-sm truncate group-hover:text-emerald-600 transition">
                  {cat.name}
                </h3>
                <span className="text-[11px] text-slate-400">
                  {cat.productCount !== undefined ? `${cat.productCount} items` : 'Explore'}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* 3. TRENDING PRODUCTS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <div className="flex items-center gap-2 text-emerald-600 text-xs font-bold uppercase tracking-wider mb-1">
              <TrendingUp className="w-4 h-4" />
              Most Popular Right Now
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Trending Products
            </h2>
          </div>
          <Link
            href="/products"
            className="text-sm font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1.5 transition"
          >
            Browse entire collection ({trendingProducts.length}+)
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="animate-pulse bg-white border border-slate-200 rounded-2xl p-4 h-80 flex flex-col justify-between">
                <div className="bg-slate-200 h-44 rounded-xl w-full" />
                <div className="space-y-2 mt-4">
                  <div className="bg-slate-200 h-4 rounded w-3/4" />
                  <div className="bg-slate-200 h-4 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {trendingProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* 4. SPECIAL PROMOTIONAL BANNER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-emerald-600 to-teal-700 text-white p-8 sm:p-12 lg:p-16 shadow-2xl">
          <div className="relative z-10 max-w-xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-bold uppercase tracking-wider backdrop-blur-sm">
              <Percent className="w-3.5 h-3.5" />
              Seasonal Cloud Special
            </div>
            <h3 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Upgrade Your Setup with Up to 25% Off
            </h3>
            <p className="text-emerald-100 text-sm sm:text-base leading-relaxed">
              Premium wireless audio, ergonomic mechanical keyboards, and 4K monitors on sale this week only. Free shipping on all orders over $100.
            </p>
            <div className="pt-2">
              <Link
                href="/products?category=electronics"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white text-slate-900 hover:bg-slate-100 rounded-xl font-bold text-sm shadow-md transition"
              >
                Shop Electronics Offers
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          {/* Decorative Background Elements */}
          <div className="absolute right-0 bottom-0 top-0 w-1/2 opacity-20 pointer-events-none hidden md:block">
            <div className="w-96 h-96 bg-white/30 rounded-full blur-3xl absolute -bottom-10 -right-10" />
          </div>
        </div>
      </section>
    </div>
  );
}
