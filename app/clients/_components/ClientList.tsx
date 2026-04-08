'use client';

import * as React from 'react';
import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Users } from 'lucide-react';
import { ClientCard } from './ClientCard';
import { ClientListSkeleton } from './ClientSkeletons';

async function fetchClients() {
  const response = await fetch('/api/clients');
  if (!response.ok) throw new Error('Failed to fetch clients');
  return response.json();
}

export function ClientList() {
  const [search, setSearch] = useState('');

  const { data: clients, isLoading, error } = useQuery({
    queryKey: ['clients'],
    queryFn: fetchClients,
  });

  /**
   * useMemo - Memoize the filtered list to optimize performance.
   * Only re-calculates when search or clients data changes.
   */
  const filteredClients = useMemo(() => {
    if (!clients) return [];
    return clients.filter((client: any) =>
      client.companyName.toLowerCase().includes(search.toLowerCase())
    );
  }, [clients, search]);

  if (isLoading) return <ClientListSkeleton />;

  if (error) {
    return (
      <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-200">
        <p className="text-red-500 font-medium">Error loading clients. Please try again.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search clients..."
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 text-xs font-medium text-gray-400 bg-gray-50 px-3 py-2 rounded-lg border border-gray-100">
          <Users className="w-4 h-4" />
          {filteredClients.length} total clients
        </div>
      </div>

      {/* List */}
      {filteredClients.length > 0 ? (
        <div className="grid grid-cols-1 gap-4">
          {filteredClients.map((client: any) => (
            <ClientCard key={client.id} client={client} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-100">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-gray-300" />
          </div>
          <h4 className="text-gray-900 font-medium mb-1">No clients found</h4>
          <p className="text-gray-500 text-sm">Try adjusting your search or add a new client.</p>
        </div>
      )}
    </div>
  );
}
