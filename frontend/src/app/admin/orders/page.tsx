'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { formatPrice, formatDate } from '@/lib/utils';
import { ShoppingBag, Check, ChevronDown } from 'lucide-react';

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [feedback, setFeedback] = useState('');

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const url = statusFilter === 'ALL' ? '/admin/orders' : `/admin/orders?status=${statusFilter}`;
      const res = await api.get(url);
      setOrders(res.orders || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    try {
      await api.put(`/admin/orders/${orderId}/status`, { status: newStatus });
      setFeedback(`Order status updated to ${newStatus}.`);
      fetchOrders();
      setTimeout(() => setFeedback(''), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to update order status');
    }
  };

  const statuses = ['ALL', 'PENDING', 'PAID', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Orders Management</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Track fulfillment, update shipment lifecycle, and monitor transactions
          </p>
        </div>
      </div>

      {feedback && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs rounded-xl flex items-center gap-2">
          <Check className="w-4 h-4" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2">
        {statuses.map((stat) => (
          <button
            key={stat}
            onClick={() => setStatusFilter(stat)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
              statusFilter === stat
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            {stat}
          </button>
        ))}
      </div>

      {/* Orders Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-800/60 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4">Order Ref</th>
                <th className="py-3.5 px-4">Customer</th>
                <th className="py-3.5 px-4">Items</th>
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4">Payment</th>
                <th className="py-3.5 px-4">Total</th>
                <th className="py-3.5 px-4 text-right">Fulfillment Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    Loading customer orders...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    No orders found for status "{statusFilter}".
                  </td>
                </tr>
              ) : (
                orders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-white">
                      {ord.orderNumber}
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-semibold text-white">{ord.user?.name || 'Customer'}</p>
                      <p className="text-slate-400 text-[11px]">{ord.user?.email}</p>
                    </td>
                    <td className="py-3.5 px-4">
                      {ord.items?.length || 0} product(s)
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">{formatDate(ord.createdAt)}</td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[11px]">
                        {ord.paymentMethod} · {ord.paymentStatus}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-emerald-400 text-sm">
                      {formatPrice(ord.total)}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <select
                        value={ord.status}
                        onChange={(e) => handleUpdateStatus(ord.id, e.target.value)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border focus:outline-none transition ${
                          ord.status === 'DELIVERED'
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                            : ord.status === 'SHIPPED'
                            ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                            : ord.status === 'PAID'
                            ? 'bg-teal-500/20 text-teal-300 border-teal-500/30'
                            : ord.status === 'CANCELLED'
                            ? 'bg-red-500/20 text-red-300 border-red-500/30'
                            : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                        }`}
                      >
                        <option value="PENDING" className="bg-slate-900 text-white">PENDING</option>
                        <option value="PAID" className="bg-slate-900 text-white">PAID</option>
                        <option value="SHIPPED" className="bg-slate-900 text-white">SHIPPED</option>
                        <option value="DELIVERED" className="bg-slate-900 text-white">DELIVERED</option>
                        <option value="CANCELLED" className="bg-slate-900 text-white">CANCELLED</option>
                      </select>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
