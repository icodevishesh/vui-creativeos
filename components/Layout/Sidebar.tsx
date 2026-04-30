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
  UserPlus,
  Calendar,
  PenTool,
  Layout,
  Palette,
  UploadCloud,
  Folder,
  Bell,
  BarChart2,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import { useAuth, formatRole } from '@/context/AuthContext';

interface SidebarProps {
  mobileOpen: boolean;
  onMobileClose: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

type NavItem = {
  name: string;
  href: string;
  icon: React.ElementType;
  roles?: string[];
};

type NavSection = {
  title: string;
  items: NavItem[];
};

const SIDEBAR_SECTIONS: NavSection[] = [
  {
    title: 'OVERVIEW',
    items: [
      { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      { name: 'Clients', href: '/clients', icon: Users, roles: ['ADMIN', 'ADMIN_OWNER', 'CLIENT', 'CLIENT_OWNER'] },
      { name: 'Team Members', href: '/members', icon: UserPlus, roles: ['ADMIN', 'ADMIN_OWNER'] },
    ],
  },
  {
    title: 'PROJECTS',
    items: [
      { name: 'Projects', href: '/projects', icon: Folder, roles: ['ADMIN', 'ADMIN_OWNER'] },
      { name: 'Gantt Chart', href: '/gantt-chart', icon: ListTodo, roles: ['ADMIN', 'ADMIN_OWNER', 'COPYWRITER', 'CONTENT_WRITER', 'GRAPHIC_DESIGNER', 'CLIENT', 'CLIENT_OWNER', 'CREATIVE_LEAD', 'TEAM_LEAD', 'SALESPERSON', 'ACCOUNT_MANAGER', 'SOCIAL_MEDIA_MANAGER', 'SEO_SPECIALIST'] },
      { name: 'Content Calendar', href: '/calendar', icon: Calendar },
      { name: 'Task Board', href: '/tasks', icon: Layout },
      { name: 'Approvals', href: '/approvals', icon: CheckCircle2, roles: ['ADMIN', 'ADMIN_OWNER', 'CLIENT', 'CLIENT_OWNER'] },
      { name: 'Creative Upload', href: '/creative-upload', icon: UploadCloud },
    ],
  },
  {
    title: 'WORKSPACES',
    items: [
      {
        name: "Writer's Workspace",
        href: '/workspace/writer',
        icon: PenTool,
        roles: ['COPYWRITER', 'CONTENT_WRITER', 'ADMIN', 'ADMIN_OWNER'],
      },
      {
        name: "Designer's Workspace",
        href: '/workspace/designer',
        icon: Palette,
        roles: ['GRAPHIC_DESIGNER', 'ADMIN', 'ADMIN_OWNER'],
      },
    ],
  },
  {
    title: 'OTHERS',
    items: [
      { name: 'File Repository', href: '/file-repository', icon: Archive },
      { name: 'Notifications', href: '/notifications', icon: Bell },
      { name: 'Analytics', href: '/analytics', icon: BarChart2 },
    ],
  },
];

function canSeeItem(item: NavItem, roles: string[], userType: string): boolean {
  if (!item.roles) return true;
  if (item.roles.includes(userType)) return true;
  return roles.some((r) => item.roles!.includes(r));
}

export function Sidebar({ mobileOpen, onMobileClose, collapsed, onToggleCollapse }: SidebarProps) {
  const pathname = usePathname();
  const { user, isLoading, logout } = useAuth();

  const initials = user?.name
    ? user.name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
    : '?';

  const roleLabel = user ? formatRole(user.roles, user.userType) : '';

  return (
    <aside
      className={`fixed top-0 left-0 z-50 h-full bg-white border-r border-gray-100
        flex flex-col transition-all duration-200 ease-in-out
        lg:translate-x-0
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
        ${collapsed ? 'w-24' : 'w-60'}`}
      aria-label="Sidebar navigation"
    >
      {/* ── Logo bar ───────────────────────────────────────────── */}
      <div className="flex items-center justify-between h-16 px-3 border-b border-gray-100 flex-shrink-0">
        {/* Logo — hidden when collapsed */}
        <div className={`flex items-center gap-2 ${collapsed ? 'hidden' : 'flex'}`}>
          <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs font-bold">VUI</span>
          </div>
          <h2 className="text-sm font-bold text-gray-900 tracking-tight">CreativeOS</h2>
        </div>

        {/* When collapsed: just the icon centered */}
        {collapsed && (
          <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center mx-auto">
            <span className="text-white text-xs font-bold">VUI</span>
          </div>
        )}

        {/* Collapse / expand toggle — top-right of sidebar */}
        <button
          onClick={onToggleCollapse}
          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all flex-shrink-0"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed
            ? <PanelLeftOpen className="w-4 h-4" />
            : <PanelLeftClose className="w-4 h-4" />
          }
        </button>
      </div>

      {/* ── Nav ────────────────────────────────────────────────── */}
      <nav
        className={`flex-1 overflow-y-auto overflow-x-hidden py-3 space-y-5 ${collapsed ? 'px-2' : 'px-3'}`}
        aria-label="Primary navigation"
      >
        {SIDEBAR_SECTIONS.map((section) => {
          const visibleItems = section.items.filter((item) =>
            canSeeItem(item, user?.roles ?? [], user?.userType ?? '')
          );
          if (visibleItems.length === 0) return null;

          return (
            <div key={section.title} className="space-y-0.5">
              {/* Section label — hidden when collapsed */}
              {!collapsed && (
                <h3 className="px-3 mb-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  {section.title}
                </h3>
              )}

              {visibleItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    title={collapsed ? item.name : undefined}
                    onClick={() => {
                      if (typeof window !== 'undefined' && window.innerWidth < 1024) onMobileClose();
                    }}
                    className={`flex items-center py-2 rounded-xl transition-all
                      ${collapsed ? 'justify-center px-2' : 'gap-3 px-3'}
                      ${isActive
                        ? 'bg-indigo-50 text-indigo-600'
                        : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                      }`}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <item.icon
                      className={`flex-shrink-0 ${collapsed ? 'w-5 h-5' : 'w-4 h-4'} ${isActive ? 'text-indigo-600' : 'text-gray-400'
                        }`}
                      aria-hidden="true"
                    />
                    {!collapsed && (
                      <span className="text-[13px] font-semibold">{item.name}</span>
                    )}
                  </Link>
                );
              })}
            </div>
          );
        })}
      </nav>

      {/* ── User + Logout ───────────────────────────────────────── */}
      <div className={`flex-shrink-0 border-t border-gray-100 ${collapsed ? 'p-2' : 'p-3'}`}>
        {isLoading ? (
          <div className="h-10 bg-gray-50 rounded-xl animate-pulse" />
        ) : user ? (
          collapsed ? (
            /* Collapsed: avatar + logout icon stacked */
            <div className="flex flex-col items-center gap-2">
              <div
                className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center text-xs font-bold"
                title={user.name}
              >
                {initials}
              </div>
              <button
                onClick={logout}
                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                title="Logout"
                aria-label="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            /* Expanded: avatar + name/role + logout */
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                {initials}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-gray-900 truncate leading-tight">
                  {user.name}
                </p>
                <p className="text-[10px] font-semibold text-indigo-500 uppercase tracking-wider leading-tight truncate">
                  {roleLabel}
                </p>
              </div>
              <button
                onClick={logout}
                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all flex-shrink-0"
                title="Logout"
                aria-label="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )
        ) : null}
      </div>
    </aside>
  );
}
