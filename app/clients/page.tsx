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
          <h1 className="text-xl font-bold text-gray-900 leading-none">Clients</h1>
          <p className="text-gray-500 mt-2 text-sm font-medium">Manage and track your client accounts and engagements.</p>
        </div>
        <Link
          href="/onboarding"
          className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all w-full sm:w-auto"
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
