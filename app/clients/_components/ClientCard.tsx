'use client';

import * as React from 'react';
import { Briefcase, ChevronRight, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { ClientStatus, EngagementType, ServiceType } from '@prisma/client';

interface ClientProfileWithServices {
  id: string;
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  industry: string;
  engagementType: EngagementType;
  status: ClientStatus;
  services: { service: ServiceType }[];
}

interface ClientCardProps {
  client: ClientProfileWithServices;
  canAdmin?: boolean;
  canDelete?: boolean;
  onEdit?: (client: ClientProfileWithServices) => void;
  onDelete?: (client: ClientProfileWithServices) => void;
}

export function ClientCard({ client, canAdmin, canDelete, onEdit, onDelete }: ClientCardProps) {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  React.useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  const getInitials = (name: string) =>
    name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

  const statusColors: Record<string, string> = {
    ACTIVE:   'bg-green-50 text-green-700 border-green-100',
    PENDING:  'bg-amber-50 text-amber-700 border-amber-100',
    INACTIVE: 'bg-gray-50 text-gray-700 border-gray-100',
    ARCHIVED: 'bg-gray-50 text-gray-700 border-gray-100',
    DELAYED:  'bg-orange-50 text-orange-700 border-orange-100',
    REJECTED: 'bg-red-50 text-red-700 border-red-100',
  };

  const engagementLabels = { RETAINER: 'Retainer', PROJECT_BASED: 'Project' };

  return (
    <div className="group bg-white rounded-lg border border-gray-100 p-2.5 hover:border-primary/20 hover:shadow-sm transition-all">
      <div className="flex items-center justify-between">
        {/* Left — navigates to detail */}
        <Link href={`/clients/${client.id}`} className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-9 h-9 bg-primary/10 flex items-center justify-center rounded-lg text-primary font-semibold text-sm shrink-0">
            {getInitials(client.companyName)}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-semibold text-gray-900 group-hover:text-primary transition-colors truncate">
                {client.companyName}
              </h3>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${statusColors[client.status] || statusColors.PENDING}`}>
                {client.status.charAt(0) + client.status.slice(1).toLowerCase()}
              </span>
            </div>
            <div className="flex items-center gap-3 mt-1">
              <span className="flex items-center gap-1 text-xs text-gray-500">
                <Briefcase className="w-3 h-3" />
                {engagementLabels[client.engagementType]} • {client.contactPerson}
              </span>
            </div>
          </div>
        </Link>

        {/* Right */}
        <div className="flex items-center gap-4 shrink-0 ml-4">
          <div className="hidden sm:flex items-center gap-1.5 flex-wrap justify-end max-w-[200px]">
            {client.services.map((s) => (
              <span key={s.service} className="text-xs font-medium px-2 py-1 bg-gray-50 text-gray-600 rounded-md border border-gray-100">
                {s.service.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (l) => l.toUpperCase())}
              </span>
            ))}
          </div>

          {canAdmin ? (
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                onClick={(e) => { e.preventDefault(); setMenuOpen(v => !v); }}
                className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-all"
                title="More options"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>

              {menuOpen && (
                <div className="absolute right-0 top-full mt-1 w-36 bg-white border border-gray-100 rounded-xl shadow-lg z-20 overflow-hidden">
                  <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); setMenuOpen(false); onEdit?.(client); }}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <Pencil className="w-3.5 h-3.5 text-gray-400" />
                    Edit
                  </button>
                  {canDelete && (
                    <button
                      type="button"
                      onClick={(e) => { e.preventDefault(); setMenuOpen(false); onDelete?.(client); }}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete
                    </button>
                  )}
                </div>
              )}
            </div>
          ) : (
            <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-primary/60 transition-colors" />
          )}
        </div>
      </div>
    </div>
  );
}
