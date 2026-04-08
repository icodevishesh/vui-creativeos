'use client';

import * as React from 'react';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { 
  ArrowLeft, 
  Layout, 
  Users, 
  Briefcase, 
  FileText, 
  MessageSquare,
  ChevronRight,
  RefreshCw 
} from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

import { OverviewTab } from './_components/OverviewTab';
import { TeamTab } from './_components/TeamTab';
import { ScopeTab } from './_components/ScopeTab';
import { DocumentsTab } from './_components/DocumentsTab';
import { MeetingsTab } from './_components/MeetingsTab';

type TabType = 'overview' | 'team' | 'scope' | 'documents' | 'meetings';

export default function ClientProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  const { data: client, isLoading, error } = useQuery({
    queryKey: ['client', id],
    queryFn: async () => {
      const res = await fetch(`/api/clients/${id}`);
      if (!res.ok) throw new Error('Client not found');
      return res.json();
    },
  });

  const TABS = [
    { id: 'overview', name: 'Overview', icon: Layout },
    { id: 'team', name: 'Team', icon: Users },
    { id: 'scope', name: 'Scope of Work', icon: Briefcase },
    { id: 'documents', name: 'Documents', icon: FileText },
    { id: 'meetings', name: 'Meeting Logs', icon: MessageSquare },
  ] as const;

  const statusColors: Record<string, string> = {
    ACTIVE: 'bg-green-50 text-green-600 border-green-100',
    INACTIVE: 'bg-gray-50 text-gray-600 border-gray-100',
    PENDING: 'bg-amber-50 text-amber-600 border-amber-100',
    ARCHIVED: 'bg-gray-50 text-gray-600 border-gray-100',
    DELAYED: 'bg-orange-50 text-orange-600 border-orange-100',
    REJECTED: 'bg-red-50 text-red-600 border-red-100',
  };

  const updateStatus = useMutation({
    mutationFn: async (newStatus: string) => {
      const res = await fetch(`/api/clients/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error('Failed to update status');
      return res.json();
    },
    onSuccess: () => {
      toast.success('Status updated');
      queryClient.invalidateQueries({ queryKey: ['client', id] });
    },
    onError: () => {
      toast.error('Failed to update status');
    },
  });

  const accountManager = client?.teamMembers?.find(
    (m: any) => m.userRole.toLowerCase() === 'account manager'
  );
  const accountManagerName = accountManager ? accountManager.userName : 'Unassigned';

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
        <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">Loading Client Context...</p>
      </div>
    );
  }

  if (error || !client) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold text-gray-900">Client not found</h2>
        <Link href="/clients" className="text-indigo-600 hover:underline mt-4 inline-block">
          Back to all clients
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Breadcrumbs / Back */}
      <div className="flex items-center gap-2 text-sm font-medium text-gray-400">
        <Link href="/clients" className="hover:text-indigo-600 transition-colors flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" />
          Back to Clients
        </Link>
        <ChevronRight className="w-4 h-4" />
        <span className="text-gray-900 font-bold">{client.companyName}</span>
      </div>

      {/* Profile Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 bg-indigo-600 rounded-3xl flex items-center justify-center text-white text-2xl font-semibold shadow-xl shadow-indigo-100">
            {client.companyName.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-3xl font-semibold text-gray-900 tracking-tight">{client.companyName}</h1>
              <span className={`px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-widest border ${statusColors[client.status] || statusColors.PENDING}`}>
                {client.status}
              </span>
            </div>
            <p className="text-gray-500 font-medium flex items-center gap-2">
              {client.engagementType.replace(/_/g, ' ')} 
              <span className="w-1 h-1 bg-gray-300 rounded-full" />
              Managed by <span className="text-gray-900 font-bold">{accountManagerName}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <select 
            value={client.status}
            onChange={(e) => updateStatus.mutate(e.target.value)}
            disabled={updateStatus.isPending}
            className="px-4 py-2.5 bg-white border border-gray-200 text-gray-900 rounded-xl text-sm font-bold hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm cursor-pointer disabled:opacity-50"
          >
            <option value="ACTIVE">Active</option>
            <option value="PENDING">Pending</option>
            <option value="DELAYED">Delayed</option>
            <option value="REJECTED">Rejected</option>
            <option value="INACTIVE">Inactive</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-1 bg-gray-100 p-1.5 rounded-2xl w-fit">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
                isActive
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <tab.icon className={`w-4 h-4 ${isActive ? 'text-indigo-600' : 'text-gray-400'}`} />
              {tab.name}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'overview' && <OverviewTab client={client} />}
            {activeTab === 'team' && <TeamTab clientId={id} />}
            {activeTab === 'scope' && <ScopeTab clientId={id} />}
            {activeTab === 'documents' && <DocumentsTab clientId={id} companyName={client.companyName} />}
            {activeTab === 'meetings' && <MeetingsTab clientId={id} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
