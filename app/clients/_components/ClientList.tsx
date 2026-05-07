'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Users } from 'lucide-react';
import { ClientStatus, EngagementType, ServiceType } from '@prisma/client';
import { ClientCard } from './ClientCard';
import { ClientListSkeleton } from './ClientSkeletons';

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

const STATUS_FILTERS: { value: ClientStatus; label: string }[] = [
  { value: ClientStatus.ACTIVE, label: 'Active' },
  { value: ClientStatus.PENDING, label: 'Pending' },
  { value: ClientStatus.INACTIVE, label: 'Inactive' },
];

async function fetchClients() {
  const response = await fetch('/api/clients');
  if (!response.ok) throw new Error('Failed to fetch clients');
  return response.json() as Promise<ClientProfileWithServices[]>;
}

export function ClientList() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ClientStatus>(ClientStatus.ACTIVE);

  const { data: clients, isLoading, error } = useQuery<ClientProfileWithServices[]>({
    queryKey: ['clients'],
    queryFn: fetchClients,
  });

  const statusCounts = useMemo(() => {
    return STATUS_FILTERS.reduce<Record<ClientStatus, number>>((acc, filter) => {
      acc[filter.value] = clients?.filter((client) => client.status === filter.value).length ?? 0;
      return acc;
    }, {
      [ClientStatus.ACTIVE]: 0,
      [ClientStatus.PENDING]: 0,
      [ClientStatus.INACTIVE]: 0,
    });
  }, [clients]);

  /**
   * useMemo - Memoize the filtered list to optimize performance.
   * Only re-calculates when search, status, or clients data changes.
   */
  const filteredClients = useMemo(() => {
    if (!clients) return [];
    const normalizedSearch = search.trim().toLowerCase();

    return clients.filter((client) =>
      client.status === statusFilter &&
      client.companyName.toLowerCase().includes(normalizedSearch)
    );
  }, [clients, search, statusFilter]);

  const activeStatusLabel = STATUS_FILTERS.find((filter) => filter.value === statusFilter)?.label ?? 'Clients';

  if (isLoading) return <ClientListSkeleton />;

  if (error) {
    return (
      <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-200">
        <p className="text-red-500 font-medium">Error loading clients. Please try again.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-2.5 rounded-lg border border-gray-100 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search clients..."
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as ClientStatus)}
            aria-label="Filter clients by status"
            className="h-10 min-w-36 appearance-none rounded-lg border border-gray-100 bg-gray-50 px-3 pr-9 text-xs font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all"
          >
            {STATUS_FILTERS.map((filter) => (
              <option key={filter.value} value={filter.value}>
                {filter.label} ({statusCounts[filter.value]})
              </option>
            ))}
          </select>
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-gray-400">
            ▼
          </span>
        </div>
      </div>

      {/* List */}
      {filteredClients.length > 0 ? (
        <div className="grid grid-cols-1 gap-4">
          {filteredClients.map((client) => (
            <ClientCard key={client.id} client={client} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-100">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-gray-300" />
          </div>
          <h4 className="text-gray-900 font-medium mb-1">No clients found</h4>
          <p className="text-gray-500 text-sm">Try adjusting your search or status filter.</p>
        </div>
      )}
    </div>
  );
}
