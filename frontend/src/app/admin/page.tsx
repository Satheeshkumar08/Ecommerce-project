'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { formatPrice, formatDate } from '@/lib/utils';
import {
  DollarSign,
  ShoppingBag,
  Users,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Package,
} from 'lucide-react';

export default function AdminOverviewPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/overview')
      .then((res) => setData(res))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="py-20 text-center text-slate-400">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm">Loading admin dashboard metrics...</p>
      </div>
    );
  }

  const { metrics, ordersBreakdown, lowStockProducts = [], recentOrders = [] } = data || {};

  return (
    <div className="space-y-10">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Admin Overview</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Real-time telemetry, revenue analytics, and inventory alerts
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/admin/products/new"
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs sm:text-sm font-bold shadow-lg shadow-emerald-600/20 transition flex items-center gap-2"
          >
            <Package className="w-4 h-4" />
            Create Product
          </Link>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Sales</p>
              <h3 className="text-2xl font-black text-white mt-1">
                {formatPrice(metrics?.totalSales || 0)}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1.5 text-xs text-emerald-400">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Active AWS RDS Postgres Database</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Orders</p>
              <h3 className="text-2xl font-black text-white mt-1">
                {metrics?.totalOrders || 0}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 text-xs text-slate-400">
            {ordersBreakdown?.pending || 0} Pending · {ordersBreakdown?.paid || 0} Paid
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Registered Customers</p>
              <h3 className="text-2xl font-black text-white mt-1">
                {metrics?.totalCustomers || 0}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 text-xs text-slate-400">
            Verified accounts in PostgreSQL
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Low-Stock Warnings</p>
              <h3 className={`text-2xl font-black mt-1 ${metrics?.lowStockCount > 0 ? 'text-amber-400' : 'text-white'}`}>
                {metrics?.lowStockCount || 0}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 text-xs text-slate-400">
            Items with ≤ 5 units in warehouse
          </div>
        </div>
      </div>

      {/* Grid: Low Stock Warnings & Recent Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Low Stock Alerts */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h2 className="font-bold text-white text-base flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              Low Inventory Alerts
            </h2>
            <Link href="/admin/products" className="text-xs text-emerald-400 hover:underline">
              Manage Stock
            </Link>
          </div>

          {lowStockProducts.length === 0 ? (
            <p className="text-xs text-slate-500 py-6 text-center">All inventory stock levels are healthy.</p>
          ) : (
            <div className="divide-y divide-slate-800">
              {lowStockProducts.map((p: any) => (
                <div key={p.id} className="py-3 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-semibold text-white">{p.name}</p>
                    <p className="text-slate-400 font-mono text-[11px]">{p.sku}</p>
                  </div>
                  <div className="text-right">
                    <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold">
                      {p.stock} units left
                    </span>
                    <p className="text-slate-400 mt-1">{formatPrice(p.price)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Orders */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h2 className="font-bold text-white text-base flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-blue-400" />
              Recent Orders
            </h2>
            <Link href="/admin/orders" className="text-xs text-emerald-400 hover:underline">
              View All Orders
            </Link>
          </div>

          {recentOrders.length === 0 ? (
            <p className="text-xs text-slate-500 py-6 text-center">No orders recorded yet.</p>
          ) : (
            <div className="divide-y divide-slate-800">
              {recentOrders.map((ord: any) => (
                <div key={ord.id} className="py-3 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-mono font-semibold text-white">{ord.orderNumber}</p>
                    <p className="text-slate-400">{ord.user?.email || 'Guest'}</p>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-emerald-400 text-sm block">
                      {formatPrice(ord.total)}
                    </span>
                    <span className="text-[10px] text-slate-400">{formatDate(ord.createdAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
