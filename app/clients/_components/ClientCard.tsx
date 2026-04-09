'use client';

import * as React from 'react';
import { User, Briefcase, ChevronRight } from 'lucide-react';
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
}

export function ClientCard({ client }: ClientCardProps) {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const statusColors: Record<string, string> = {
    ACTIVE: 'bg-green-50 text-green-700 border-green-100',
    PENDING: 'bg-amber-50 text-amber-700 border-amber-100',
    INACTIVE: 'bg-gray-50 text-gray-700 border-gray-100',
    ARCHIVED: 'bg-gray-50 text-gray-700 border-gray-100',
    DELAYED: 'bg-orange-50 text-orange-700 border-orange-100',
    REJECTED: 'bg-red-50 text-red-700 border-red-100',
  };

  const engagementLabels = {
    RETAINER: 'Retainer',
    PROJECT_BASED: 'Project',
  };

  return (
    <Link 
      href={`/clients/${client.id}`}
      className="group bg-white rounded-lg border border-gray-100 p-2.5 hover:border-indigo-100 hover:shadow-sm transition-all cursor-pointer block"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-indigo-50 flex items-center justify-center rounded-lg text-indigo-600 font-semibold text-sm">
            {getInitials(client.companyName)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
                {client.companyName}
              </h3>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusColors[client.status as string] || statusColors.PENDING}`}>
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
        </div>

        <div className="flex items-center gap-6">
          <div className="hidden sm:flex items-center gap-1.5 flex-wrap justify-end max-w-[200px]">
            {client.services.map((s) => (
              <span 
                key={s.service} 
                className="text-[10px] font-medium px-2 py-1 bg-gray-50 text-gray-600 rounded-md border border-gray-100"
              >
                {s.service.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (l) => l.toUpperCase())}
              </span>
            ))}
          </div>
          <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-indigo-400 transition-colors" />
        </div>
      </div>
    </Link>
  );
}
