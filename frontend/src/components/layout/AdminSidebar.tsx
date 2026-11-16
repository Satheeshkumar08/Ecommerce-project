'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  LayoutDashboard,
  Package,
  Layers,
  Users,
  ShoppingBag,
  ExternalLink,
  LogOut,
  ShieldAlert,
} from 'lucide-react';

export default function AdminSidebar() {
  const pathname = usePathname();
  const { logout, user } = useAuth();

  const navigation = [
    { name: 'Overview', href: '/admin', icon: LayoutDashboard },
    { name: 'Products', href: '/admin/products', icon: Package },
    { name: 'Categories', href: '/admin/categories', icon: Layers },
    { name: 'Orders', href: '/admin/orders', icon: ShoppingBag },
    { name: 'Customers', href: '/admin/customers', icon: Users },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 min-h-screen flex flex-col border-r border-slate-800">
      {/* Brand Header */}
      <div className="p-6 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-slate-900 font-bold">
            <ShieldAlert className="w-5 h-5 text-slate-900" />
          </div>
          <div>
            <h1 className="text-white font-bold text-sm tracking-wide">Apex Admin</h1>
            <p className="text-[10px] text-emerald-400 font-semibold uppercase tracking-wider">Cloud Console</p>
          </div>
        </div>
      </div>

      {/* Admin User Badge */}
      <div className="px-6 py-4 border-b border-slate-800/60 bg-slate-800/30">
        <p className="text-xs text-slate-400">Logged in as</p>
        <p className="text-sm font-semibold text-white truncate">{user?.name || 'Administrator'}</p>
        <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
          ROLE: ADMIN
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 font-semibold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <item.icon className="w-4 h-4" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Actions */}
      <div className="p-4 border-t border-slate-800 space-y-2">
        <Link
          href="/"
          target="_blank"
          className="flex items-center justify-between w-full px-3.5 py-2 text-xs font-semibold text-slate-400 hover:text-emerald-400 hover:bg-slate-800/50 rounded-lg transition"
        >
          <span className="flex items-center gap-2">
            <ExternalLink className="w-3.5 h-3.5" />
            Live Customer Store
          </span>
          <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-400">View</span>
        </Link>

        <button
          onClick={() => logout()}
          className="flex items-center gap-2 w-full px-3.5 py-2 text-xs font-semibold text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition"
        >
          <LogOut className="w-3.5 h-3.5" />
          Sign Out of Admin
        </button>
      </div>
    </aside>
  );
}
