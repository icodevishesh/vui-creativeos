'use client';

import * as React from 'react';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, CheckCircle2, User, LogOut, Menu, X, BarChart2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';

const NAV_ITEMS = [
  { href: '/portal/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/portal/gantt', label: 'Gantt Chart', icon: BarChart2 },
  { href: '/portal/approvals', label: 'Approvals', icon: CheckCircle2 },
  { href: '/portal/profile', label: 'My Profile', icon: User },
];

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Guard: only CLIENT users may access the portal
  const { data: me, isLoading: meLoading } = useQuery({
    queryKey: ['auth-me'],
    queryFn: async () => {
      const res = await fetch('/api/auth/me');
      if (!res.ok) return null;
      return res.json();
    },
    staleTime: 60_000,
  });

  React.useEffect(() => {
    if (!meLoading && me && me.userType !== 'CLIENT') {
      router.replace('/sign-in');
    }
  }, [me, meLoading, router]);

  const { data: profile } = useQuery({
    queryKey: ['portal-profile'],
    queryFn: async () => {
      const res = await fetch('/api/portal/profile');
      if (!res.ok) throw new Error('Failed to fetch profile');
      return res.json();
    },
    enabled: me?.userType === 'CLIENT',
  });

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    toast.success('Logged out');
    router.push('/sign-in');
  };

  const Sidebar = ({ mobile = false }: { mobile?: boolean }) => (
    <div className={`flex flex-col h-full bg-white border-r border-gray-100 ${mobile ? 'w-full' : 'w-60'}`}>
      {/* Logo */}
      <div className="px-6 py-5 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <span className="text-white text-xs font-bold">C</span>
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900">CreativeOS</p>
            <p className="text-[10px] text-gray-400 font-medium">Client Portal</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-4 space-y-1">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${isActive
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200'
                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>


      <div className='flex flex-col gap-4 py-4 px-4 border-t border-gray-100'>
        {/* Client info */}

        {profile && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0">
              {profile.companyName?.slice(0, 2).toUpperCase() || 'CL'}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-gray-900 truncate">{profile.companyName}</p>
              <p className="text-[10px] text-gray-500 truncate">{profile.email}</p>
            </div>
          </div>
        )}
        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center p-2 bg-indigo-50 gap-3 rounded-lg text-indigo-600 hover:text-red-600 hover:bg-red-50 transition-all"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <span className='text-sm font-semibold'>Sign Out</span>
        </button>
      </div>

    </div>
  );

  return (
    <div className="h-screen bg-gray-50 flex overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:w-60 z-30">
        <Sidebar />
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="relative w-72 bg-white h-full shadow-xl">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-700"
            >
              <X className="w-5 h-5" />
            </button>
            <Sidebar mobile />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex flex-col flex-1 lg:pl-60">
        {/* Mobile header */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-gray-100 sticky top-0 z-20">
          <button onClick={() => setMobileOpen(true)} className="p-2 text-gray-500 hover:text-gray-900">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-indigo-600 rounded-md flex items-center justify-center">
              <span className="text-white text-[10px] font-bold">C</span>
            </div>
            <span className="text-sm font-bold text-gray-900">Client Portal</span>
          </div>
          <div className="w-9" />
        </header>

        <main className="flex-1 overflow-auto p-6">
          <div className="w-full h-full">{children}</div>
        </main>
      </div>
    </div>
  );
}
