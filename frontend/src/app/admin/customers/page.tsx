'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { Users, Ban, CheckCircle, ShieldAlert, Check } from 'lucide-react';

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState('');

  const fetchCustomers = async () => {
    try {
      const res = await api.get('/admin/customers');
      setCustomers(res.customers || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleToggleBlock = async (id: string, name: string) => {
    try {
      const res = await api.patch(`/admin/customers/${id}/toggle-block`);
      setFeedback(res.message || `Customer status updated.`);
      fetchCustomers();
      setTimeout(() => setFeedback(''), 3000);
    } catch (err: any) {
      alert(err.message || 'Failed to update customer status');
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">Customer Accounts</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Registered customer records, activity metrics, and account security
          </p>
        </div>
      </div>

      {feedback && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs rounded-xl flex items-center gap-2">
          <Check className="w-4 h-4" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Customers Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-800/60 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4">Customer</th>
                <th className="py-3.5 px-4">Email</th>
                <th className="py-3.5 px-4">Total Orders</th>
                <th className="py-3.5 px-4">Joined Date</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Access Control</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    Loading customers...
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    No customer accounts found.
                  </td>
                </tr>
              ) : (
                customers.map((cust) => (
                  <tr key={cust.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-slate-800 text-emerald-400 font-bold text-xs flex items-center justify-center">
                          {cust.name[0]?.toUpperCase()}
                        </div>
                        <span className="font-semibold text-white">{cust.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-400">{cust.email}</td>
                    <td className="py-3 px-4 font-mono font-bold text-white">
                      {cust._count?.orders || 0} orders
                    </td>
                    <td className="py-3 px-4 text-slate-400">{formatDate(cust.createdAt)}</td>
                    <td className="py-3 px-4">
                      {cust.isBlocked ? (
                        <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-400 font-bold text-[11px]">
                          Suspended
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-bold text-[11px]">
                          Active
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleToggleBlock(cust.id, cust.name)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ml-auto ${
                          cust.isBlocked
                            ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                            : 'bg-red-500/20 hover:bg-red-500/30 text-red-300'
                        }`}
                      >
                        {cust.isBlocked ? (
                          <>
                            <CheckCircle className="w-3.5 h-3.5" />
                            Unblock
                          </>
                        ) : (
                          <>
                            <Ban className="w-3.5 h-3.5" />
                            Suspend
                          </>
                        )}
                      </button>
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
