'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  CheckSquare,
  FileText,
  Settings,
  X,
  UserPlus,
  Calendar,
  Pen
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const NAV_ITEMS = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Clients', href: '/clients', icon: Users },
  { name: 'Projects', href: '/projects', icon: FolderKanban },
  { name: 'Gantt Chart', href: '/gantt-chart', icon: FolderKanban },
  { name: 'Task Board', href: '/tasks', icon: CheckSquare },
  { name: 'Content Calendar', href: '/calendar', icon: Calendar },
  { name: 'Writers Workspace', href: '/workspace/writer', icon: Pen },
  { name: 'Approvals', href: '/approvals', icon: FileText },
  { name: 'Members', href: '/members', icon: UserPlus },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={`fixed top-0 left-0 z-50 h-full w-58 bg-white border-r border-gray-200
        transform transition-transform duration-200 ease-in-out
        lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      aria-label="Sidebar navigation"
    >
      {/* Logo / brand */}
      <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
        <div className="flex items-center gap-1">
          <div className="w-9 h-9 bg-indigo-600 rounded-full flex items-center justify-center">
            <span className="text-white font-semibold">VUI</span>
          </div>
          <h2 className="text-lg font-semibold text-gray-900 tracking-tight">CreativeOS</h2>
        </div>
        <button
          onClick={onClose}
          className="lg:hidden text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Close sidebar"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <nav className="p-4 space-y-1" aria-label="Primary navigation">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => {
                if (window.innerWidth < 1024) onClose();
              }}
              className={`flex items-center gap-3 px-3 py-2.5 text-sm font-semibold rounded-xl transition-all ${isActive
                ? 'bg-indigo-50 text-indigo-600 shadow-sm shadow-indigo-100/50'
                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                }`}
              aria-current={isActive ? 'page' : undefined}
            >
              <item.icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-indigo-600' : 'text-gray-400'}`} aria-hidden="true" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Bottom info */}
      {/* <div className="absolute bottom-0 left-0 w-full p-4 border-t border-gray-100">
        <div className="bg-gray-50 rounded-xl p-4">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Status</p>
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-700">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            Live Environment
          </div>
        </div>
      </div> */}
    </aside>
  );
}
