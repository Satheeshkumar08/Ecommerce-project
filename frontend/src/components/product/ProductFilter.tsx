'use client';

import React from 'react';
import { RotateCcw } from 'lucide-react';

interface ProductFilterProps {
  categories: Array<{ id: string; name: string; slug: string; productCount?: number }>;
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  minPrice: string;
  maxPrice: string;
  onPriceChange: (min: string, max: string) => void;
  inStock: boolean;
  onInStockChange: (inStock: boolean) => void;
  selectedRating: string;
  onRatingChange: (rating: string) => void;
  onReset: () => void;
}

export default function ProductFilter({
  categories,
  selectedCategory,
  onSelectCategory,
  minPrice,
  maxPrice,
  onPriceChange,
  inStock,
  onInStockChange,
  selectedRating,
  onRatingChange,
  onReset,
}: ProductFilterProps) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <h3 className="font-bold text-slate-900 text-base">Filter Products</h3>
        <button
          onClick={onReset}
          className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold flex items-center gap-1 transition"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset All
        </button>
      </div>

      {/* Categories */}
      <div>
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Categories</h4>
        <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
          <button
            onClick={() => onSelectCategory('all')}
            className={`w-full text-left px-3 py-1.5 rounded-lg text-sm font-medium transition ${
              selectedCategory === 'all' || !selectedCategory
                ? 'bg-emerald-50 text-emerald-700 font-bold'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            All Categories
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.slug)}
              className={`w-full text-left px-3 py-1.5 rounded-lg text-sm font-medium flex items-center justify-between transition ${
                selectedCategory === cat.slug
                  ? 'bg-emerald-50 text-emerald-700 font-bold'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <span className="truncate">{cat.name}</span>
              {cat.productCount !== undefined && (
                <span className="text-xs text-slate-400 font-normal ml-2">({cat.productCount})</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div>
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Price Range ($)</h4>
        <div className="flex items-center gap-2">
          <input
            type="number"
            placeholder="Min"
            value={minPrice}
            onChange={(e) => onPriceChange(e.target.value, maxPrice)}
            className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-emerald-500"
          />
          <span className="text-slate-400 text-xs font-bold">to</span>
          <input
            type="number"
            placeholder="Max"
            value={maxPrice}
            onChange={(e) => onPriceChange(minPrice, e.target.value)}
            className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Customer Rating */}
      <div>
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Rating</h4>
        <div className="space-y-1">
          {['4', '3', '2'].map((star) => (
            <label
              key={star}
              className="flex items-center gap-2.5 text-sm text-slate-700 cursor-pointer hover:text-slate-900"
            >
              <input
                type="radio"
                name="rating"
                checked={selectedRating === star}
                onChange={() => onRatingChange(star)}
                className="text-emerald-600 focus:ring-emerald-500 rounded"
              />
              <span>{star} Stars & Above</span>
            </label>
          ))}
        </div>
      </div>

      {/* In-Stock Only */}
      <div className="pt-2 border-t border-slate-100">
        <label className="flex items-center gap-2.5 text-sm font-medium text-slate-700 cursor-pointer">
          <input
            type="checkbox"
            checked={inStock}
            onChange={(e) => onInStockChange(e.target.checked)}
            className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
          />
          <span>In Stock Only</span>
        </label>
      </div>
    </div>
  );
}
