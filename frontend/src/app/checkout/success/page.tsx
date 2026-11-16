'use client';

import React, { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, Package, ArrowRight, Home } from 'lucide-react';
import { formatPrice } from '@/lib/utils';

function SuccessContent() {
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get('orderNumber') || 'ORD-2026-98124';
  const total = searchParams.get('total') ? parseFloat(searchParams.get('total')!) : null;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-20 text-center">
      <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mx-auto mb-6 shadow-sm">
        <CheckCircle2 className="w-12 h-12" />
      </div>

      <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
        Order Placed Successfully
      </span>

      <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-4 mb-2">
        Thank You for Your Order!
      </h1>

      <p className="text-slate-600 max-w-md mx-auto text-sm sm:text-base leading-relaxed mb-6">
        We have received your order and an automated order confirmation email has been dispatched to your email address.
      </p>

      {/* Order Reference Box */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm max-w-md mx-auto text-left space-y-3 mb-8">
        <div className="flex justify-between items-center text-sm">
          <span className="text-slate-500 font-medium">Order Number:</span>
          <span className="font-mono font-bold text-slate-900">{orderNumber}</span>
        </div>
        {total !== null && (
          <div className="flex justify-between items-center text-sm">
            <span className="text-slate-500 font-medium">Total Paid:</span>
            <span className="font-bold text-emerald-600 text-base">{formatPrice(total)}</span>
          </div>
        )}
        <div className="flex justify-between items-center text-sm">
          <span className="text-slate-500 font-medium">Estimated Delivery:</span>
          <span className="font-semibold text-slate-800">3 - 5 Business Days</span>
        </div>
      </div>

      {/* CTA Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        <Link
          href="/profile#orders"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm shadow-md shadow-emerald-600/20 transition"
        >
          <Package className="w-4 h-4" />
          View Order History
        </Link>
        <Link
          href="/"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl font-bold text-sm transition"
        >
          <Home className="w-4 h-4" />
          Return to Home
        </Link>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={<div className="text-center py-20">Loading order receipt...</div>}>
      <SuccessContent />
    </Suspense>
  );
}
