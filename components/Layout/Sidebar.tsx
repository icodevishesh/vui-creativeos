'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  ListTodo,
  Archive,
  CheckCircle2,
  Settings,
  X,
  UserPlus,
  Calendar,
  PenTool,
  Layout,
  Palette,
  UploadCloud,
  Folder
} from 'lucide-react';
import { title } from 'process';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const SIDEBAR_SECTIONS = [
  {
    title: 'OVERVIEW',
    items: [
      { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      { name: 'Clients', href: '/clients', icon: Users },
      { name: 'Onboarding', href: '/members', icon: UserPlus },
    ]
  },
  {
    title: 'PROJECTS',
    items: [
      { name: 'Projects', href: '/projects', icon: Folder },
      { name: 'Gantt Chart', href: '/gantt-chart', icon: ListTodo },
      { name: 'Content Calendar', href: '/calendar', icon: Calendar },
      { name: 'Task Board', href: '/tasks', icon: Layout },
      { name: 'Approvals', href: '/approvals', icon: CheckCircle2 },
      { name: 'Creative Upload', href: '/creative-upload', icon: UploadCloud },
    ]
  },
  {
    title: 'WORKSPACES',
    items: [
      { name: "Writer's Workspace", href: '/workspace/writer', icon: PenTool },
      { name: "Designer's Workspace", href: '/workspace/designer', icon: Palette },
    ]
  },
  {
    title: 'MORE',
    items: [
      { name: 'File Repository', href: '/file-repository', icon: Archive },
      { name: 'Settings', href: '/settings', icon: Settings },
    ]
  }
];

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={`fixed top-0 left-0 z-50 h-full w-60 bg-white border-r border-gray-200
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

      <nav className="p-4 space-y-6 overflow-y-auto h-[calc(100vh-64px)] scrollbar-hide" aria-label="Primary navigation">
        {SIDEBAR_SECTIONS.map((section) => (
          <div key={section.title} className="space-y-1">
            <h3 className="px-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider font-inter">
              {section.title}
            </h3>
            <div className="space-y-1">
              {section.items.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => {
                      if (window.innerWidth < 1024) onClose();
                    }}
                    className={`flex items-center gap-3 px-3 py-2 text-sm font-semibold rounded-xl transition-all ${isActive
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
            </div>
          </div>
        ))}

        {/* Settings always at bottom of groups */}
        {/* <div className="pt-4 mt-4 border-t border-gray-100">
          <Link
            href="/settings"
            onClick={() => {
              if (window.innerWidth < 1024) onClose();
            }}
            className={`flex items-center gap-3 px-3 py-2 text-sm font-semibold rounded-xl transition-all ${pathname === '/settings'
              ? 'bg-indigo-50 text-indigo-600'
              : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
              }`}
          >
            <Settings className={`w-5 h-5 flex-shrink-0 ${pathname === '/settings' ? 'text-indigo-600' : 'text-gray-400'}`} />
            Settings
          </Link>
        </div> */}
      </nav>
    </aside>
  );
}
