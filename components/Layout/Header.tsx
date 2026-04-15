'use client';

import * as React from 'react';
import Link from 'next/link';
import { Menu, Bell } from 'lucide-react';
import { useAuth, formatRole } from '@/context/AuthContext';

interface HeaderProps {
  onOpenMobile: () => void;
}

export function Header({ onOpenMobile }: HeaderProps) {
  const { user, isLoading } = useAuth();

  const initials = user?.name
    ? user.name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
    : '?';

  const roleLabel = user ? formatRole(user.role, user.userType) : '';

  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-200">
      <div className="flex items-center justify-between h-16 px-6">
        {/* Mobile hamburger — hidden on desktop since sidebar is always present */}
        <button
          onClick={onOpenMobile}
          className="lg:hidden p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="Open sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Spacer so right side aligns regardless of hamburger visibility */}
        <div className="hidden lg:block" />

        {/* Right side */}
        <div className="flex items-center gap-3">
          <Link
            href="/notifications"
            className="relative p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
          </Link>

          <div className="h-8 w-px bg-gray-200 hidden sm:block" />

          <div className="flex items-center gap-3 pl-1">
            {!isLoading && user && (
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold text-gray-900 leading-tight">{user.name}</p>
                <p className="text-[10px] font-semibold text-indigo-600 uppercase tracking-wider leading-tight">
                  {roleLabel}
                </p>
              </div>
            )}
            <div
              className="w-9 h-9 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-xs font-bold"
              aria-label="User avatar"
            >
              {isLoading ? '…' : initials}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
