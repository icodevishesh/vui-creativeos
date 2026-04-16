'use client';

import * as React from 'react';
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const pathname = usePathname();
  if (['/', '/sign-in', '/sign-up'].includes(pathname)) return <>{children}</>;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile backdrop only */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-gray-900/50 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      <Sidebar
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((v) => !v)}
      />

      {/* Content shifts based on collapsed state */}
      <div
        className={`flex flex-col min-h-screen transition-[padding] duration-200 ease-in-out ${collapsed ? 'lg:pl-24' : 'lg:pl-60'
          }`}
      >
        <Header onOpenMobile={() => setMobileOpen(true)} />

        <main className="flex-1 p-6 bg-gray-50" id="main-content">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}
