'use client';

import * as React from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { ClientList } from './_components/ClientList';

export default function ClientsPage() {
  return (
    <div className="space-y-6 tracking-tight">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-1">Clients</h1>
          <p className="text-gray-400 text-sm">Manage and track your client accounts and engagements.</p>
        </div>
        <Link
          href="/onboarding"
          className="h-10 px-4 text-sm font-semibold text-white bg-gray-900 rounded-xl hover:bg-gray-800 transition-all flex items-center gap-2 shadow-md hover:shadow-lg active:scale-95"
        >
          <Plus className="w-4 h-4" />
          New Client
        </Link>
      </div>

      {/* Client List Section */}
      <ClientList />
    </div>
  );
}
