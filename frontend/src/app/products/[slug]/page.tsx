'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import ImageGallery from '@/components/product/ImageGallery';
import ProductCard from '@/components/product/ProductCard';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { formatPrice, formatDate } from '@/lib/utils';
import {
  Star,
  ShoppingBag,
  Truck,
  ShieldCheck,
  RotateCcw,
  Plus,
  Minus,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
} from 'lucide-react';

export default function ProductDetailPage() {
  const params = useParams();
  const slug = params?.slug as string;

  const { addToCart } = useCart();
  const { isAuthenticated, user } = useAuth();

  const [product, setProduct] = useState<any>(null);
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);

  // Review form states
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);
  const [reviewError, setReviewError] = useState('');

  const fetchProductData = async () => {
    if (!slug) return;
    try {
      setLoading(true);
      const res = await api.get(`/products/${slug}`);
      setProduct(res.product);

      // Fetch related products
      const relRes = await api.get(`/products/${slug}/related`).catch(() => ({ products: [] }));
      setRelatedProducts(relRes.products || []);
    } catch (err) {
      console.error('Error fetching product detail:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProductData();
  }, [slug]);

  const handleAddToCart = async () => {
    if (!product || product.stock === 0) return;
    await addToCart(product, quantity);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) return;
    setSubmittingReview(true);
    setReviewError('');

    try {
      await api.post(`/reviews/product/${product.id}`, {
        rating: reviewRating,
        title: reviewTitle,
        comment: reviewComment,
      });
      setReviewSuccess(true);
      setReviewComment('');
      setReviewTitle('');
      await fetchProductData(); // Refresh product reviews
      setTimeout(() => setReviewSuccess(false), 3000);
    } catch (err: any) {
      setReviewError(err.message || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-500 font-medium text-sm">Loading product details...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Product Not Found</h2>
        <p className="text-slate-500 mb-6">The product you are looking for does not exist or has been removed.</p>
        <Link
          href="/products"
          className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-semibold text-sm shadow"
        >
          Back to Catalog
        </Link>
      </div>
    );
  }

  const discount =
    product.compareAtPrice && product.compareAtPrice > product.price
      ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
      : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-16">
      {/* Breadcrumb */}
      <nav className="text-xs text-slate-500 flex items-center gap-2">
        <Link href="/" className="hover:text-emerald-600">Home</Link>
        <span>/</span>
        <Link href="/products" className="hover:text-emerald-600">Products</Link>
        <span>/</span>
        {product.category && (
          <>
            <Link href={`/products?category=${product.category.slug}`} className="hover:text-emerald-600">
              {product.category.name}
            </Link>
            <span>/</span>
          </>
        )}
        <span className="text-slate-900 font-medium truncate max-w-xs">{product.name}</span>
      </nav>

      {/* Main Product Showcase */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
        {/* Left: Gallery */}
        <div>
          <ImageGallery images={product.images} productName={product.name} />
        </div>

        {/* Right: Product Details & Purchase Form */}
        <div className="flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            {/* Category & Stock Status */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
                {product.category?.name || 'General'}
              </span>
              <span className="text-xs text-slate-400 font-mono">SKU: {product.sku}</span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight">
              {product.name}
            </h1>

            {/* Ratings and Reviews Summary */}
            <div className="flex items-center gap-3">
              <div className="flex text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-4 h-4 ${
                      i < Math.floor(product.avgRating || 5) ? 'fill-current' : 'text-slate-200'
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm font-bold text-slate-800">{product.avgRating}</span>
              <span className="text-slate-400 text-sm">·</span>
              <a href="#reviews" className="text-sm font-medium text-emerald-600 hover:underline">
                {product.totalReviews} verified reviews
              </a>
            </div>

            {/* Price section */}
            <div className="pt-2 flex items-baseline gap-3">
              <span className="text-3xl sm:text-4xl font-black text-slate-900">
                {formatPrice(product.price)}
              </span>
              {product.compareAtPrice && product.compareAtPrice > product.price && (
                <>
                  <span className="text-lg text-slate-400 line-through">
                    {formatPrice(product.compareAtPrice)}
                  </span>
                  <span className="px-2.5 py-1 bg-red-100 text-red-600 text-xs font-bold rounded-lg">
                    Save {discount}%
                  </span>
                </>
              )}
            </div>

            {/* Stock status indicator */}
            <div className="pt-1">
              {product.stock > 10 ? (
                <div className="flex items-center gap-2 text-emerald-600 text-sm font-semibold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>In Stock & Ready to Ship</span>
                </div>
              ) : product.stock > 0 ? (
                <div className="flex items-center gap-2 text-amber-600 text-sm font-semibold">
                  <AlertCircle className="w-4 h-4" />
                  <span>Hurry! Only {product.stock} left in stock</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-red-500 text-sm font-semibold">
                  <AlertCircle className="w-4 h-4" />
                  <span>Currently Out of Stock</span>
                </div>
              )}
            </div>

            {/* Description */}
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed pt-2">
              {product.description}
            </p>
          </div>

          {/* Quantity selector & Add to Cart CTA */}
          <div className="pt-6 border-t border-slate-200 space-y-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              {/* Quantity incrementor */}
              <div className="flex items-center justify-between border border-slate-300 rounded-xl px-4 py-2.5 bg-white shadow-sm w-full sm:w-36">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={quantity <= 1 || product.stock === 0}
                  className="p-1 text-slate-500 hover:text-slate-800 disabled:opacity-40"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="font-bold text-slate-900 text-sm">{quantity}</span>
                <button
                  onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                  disabled={quantity >= product.stock || product.stock === 0}
                  className="p-1 text-slate-500 hover:text-slate-800 disabled:opacity-40"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Add to Cart button */}
              <button
                onClick={handleAddToCart}
                disabled={product.stock === 0}
                className={`flex-1 flex items-center justify-center gap-2.5 py-3.5 px-6 rounded-xl font-bold text-sm shadow-md transition ${
                  product.stock === 0
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    : added
                    ? 'bg-emerald-600 text-white'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
                }`}
              >
                {added ? (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    Added to Shopping Cart!
                  </>
                ) : (
                  <>
                    <ShoppingBag className="w-5 h-5" />
                    Add {quantity > 1 ? `(${quantity})` : ''} to Cart
                  </>
                )}
              </button>
            </div>

            {/* Perks grid */}
            <div className="grid grid-cols-3 gap-3 pt-4 border-t border-slate-100 text-center">
              <div className="p-3 bg-slate-50 rounded-xl">
                <Truck className="w-5 h-5 text-emerald-600 mx-auto mb-1" />
                <span className="text-[11px] font-semibold text-slate-700 block">Fast Delivery</span>
                <span className="text-[10px] text-slate-400">2-4 business days</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <ShieldCheck className="w-5 h-5 text-emerald-600 mx-auto mb-1" />
                <span className="text-[11px] font-semibold text-slate-700 block">Warranty</span>
                <span className="text-[10px] text-slate-400">1-Year Coverage</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <RotateCcw className="w-5 h-5 text-emerald-600 mx-auto mb-1" />
                <span className="text-[11px] font-semibold text-slate-700 block">Free Returns</span>
                <span className="text-[10px] text-slate-400">Within 30 Days</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Customer Reviews Section */}
      <div id="reviews" className="pt-12 border-t border-slate-200">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Customer Reviews & Ratings</h2>
            <p className="text-sm text-slate-500 mt-1">
              Read real thoughts from verified purchasers.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Review Submission Form */}
          <div className="bg-white p-6 border border-slate-200 rounded-2xl h-fit shadow-sm">
            <h3 className="font-bold text-slate-900 text-base mb-1">Write a Review</h3>
            <p className="text-xs text-slate-500 mb-4">Share your feedback to help other shoppers.</p>

            {isAuthenticated ? (
              <form onSubmit={handleReviewSubmit} className="space-y-4">
                {reviewSuccess && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-lg flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    Review submitted successfully!
                  </div>
                )}
                {reviewError && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-xs rounded-lg flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    {reviewError}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Rating
                  </label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setReviewRating(star)}
                        className="text-amber-400 hover:scale-110 transition"
                      >
                        <Star
                          className={`w-6 h-6 ${
                            star <= reviewRating ? 'fill-current' : 'text-slate-200'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Review Headline
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Incredible sound and comfort!"
                    value={reviewTitle}
                    onChange={(e) => setReviewTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Your Review
                  </label>
                  <textarea
                    rows={4}
                    required
                    placeholder="Describe your experience with the product..."
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submittingReview}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold shadow-sm transition disabled:opacity-50"
                >
                  {submittingReview ? 'Submitting...' : 'Post Customer Review'}
                </button>
              </form>
            ) : (
              <div className="p-4 bg-slate-50 rounded-xl text-center">
                <MessageSquare className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-xs text-slate-600 mb-3">Please sign in to leave a product review.</p>
                <Link
                  href="/auth/login"
                  className="inline-block px-4 py-2 bg-emerald-600 text-white text-xs font-semibold rounded-lg shadow-sm"
                >
                  Sign In
                </Link>
              </div>
            )}
          </div>

          {/* Reviews List */}
          <div className="lg:col-span-2 space-y-4">
            {product.reviews?.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center">
                <p className="text-sm text-slate-500">There are no reviews for this product yet. Be the first to share your thoughts!</p>
              </div>
            ) : (
              product.reviews?.map((review: any) => (
                <div
                  key={review.id}
                  className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center">
                        {review.user?.name?.[0] || 'U'}
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-slate-900">{review.user?.name || 'Verified Buyer'}</h4>
                        <div className="flex text-amber-400">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3.5 h-3.5 ${
                                i < review.rating ? 'fill-current' : 'text-slate-200'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                    <span className="text-xs text-slate-400">{formatDate(review.createdAt)}</span>
                  </div>

                  {review.title && (
                    <h5 className="text-sm font-bold text-slate-900 pt-1">{review.title}</h5>
                  )}
                  <p className="text-sm text-slate-600 leading-relaxed">{review.comment}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Related Products Grid */}
      {relatedProducts.length > 0 && (
        <div className="pt-12 border-t border-slate-200">
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight mb-8">Related Products</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {relatedProducts.map((rel) => (
              <ProductCard key={rel.id} product={rel} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
