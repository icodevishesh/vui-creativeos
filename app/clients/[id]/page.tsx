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
  RefreshCw,
  KeyRound,
  Copy,
  CheckCircle2,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

import { OverviewTab } from './_components/OverviewTab';
import { TeamTab } from './_components/TeamTab';
import { ScopeTab } from './_components/ScopeTab';
import { DocumentsTab } from './_components/DocumentsTab';
import { MeetingsTab } from './_components/MeetingsTab';

type TabType = 'overview' | 'team' | 'scope' | 'documents' | 'meetings';

function CredentialsModal({ isOpen, email, password, onClose }: {
  isOpen: boolean; email: string; password: string; onClose: () => void;
}) {
  const [copied, setCopied] = React.useState<'email' | 'password' | null>(null);
  const copy = (text: string, field: 'email' | 'password') => {
    navigator.clipboard.writeText(text);
    setCopied(field);
    setTimeout(() => setCopied(null), 2000);
  };
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-600 to-indigo-500 px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-white/20 rounded-lg flex items-center justify-center"><KeyRound className="w-5 h-5 text-white" /></div>
              <div>
                <h2 className="text-sm font-bold text-white">Client Portal Credentials</h2>
                <p className="text-xs text-indigo-200">{email}</p>
              </div>
            </div>
            <button onClick={onClose} className="text-white/70 hover:text-white"><X className="w-5 h-5" /></button>
          </div>
        </div>
        <div className="p-6 space-y-4">
          <div className="bg-amber-50 border border-amber-100 rounded-lg px-4 py-3">
            <p className="text-xs text-amber-700 font-medium">Save these credentials now — the password cannot be recovered after closing this window.</p>
          </div>
          {([['Email', email, 'email'], ['Password', password, 'password']] as const).map(([label, value, field]) => (
            <div key={field} className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-widest">{label}</label>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2.5 font-mono text-sm text-gray-900 truncate">{value}</div>
                <button onClick={() => copy(value, field)} className="shrink-0 w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-100 transition-all text-gray-500 hover:text-gray-900">
                  {copied === field ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
          ))}
          <div className="pt-2 space-y-1.5">
            <p className="text-xs text-gray-400 font-medium">Client portal login</p>
            <p className="font-mono text-xs text-indigo-600 bg-indigo-50 px-3 py-2 rounded-lg">{typeof window !== 'undefined' ? window.location.origin : ''}/sign-in</p>
          </div>
        </div>
        <div className="px-6 pb-6">
          <button onClick={onClose} className="w-full py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-all">Done</button>
        </div>
      </div>
    </div>
  );
}

export default function ClientProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [credModal, setCredModal] = useState<{ email: string; password: string } | null>(null);

  const generateCredentials = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/clients/${id}/credentials`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to generate credentials');
      return res.json();
    },
    onSuccess: (data) => {
      setCredModal({ email: data.email, password: data.generatedPassword });
    },
    onError: () => toast.error('Failed to generate credentials'),
  });

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
    <div className="space-y-6 animate-in fade-in duration-500">
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 bg-white p-6 rounded-lg border border-gray-100 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-indigo-600 rounded-lg flex items-center justify-center text-white text-lg font-semibold shadow-xl shadow-indigo-100/50">
            {client.companyName.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <h1 className="text-xl font-semibold text-gray-900 tracking-tight">{client.companyName}</h1>
              <span className={`px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-widest border ${statusColors[client.status] || statusColors.PENDING}`}>
                {client.status}
              </span>
            </div>
            <p className="text-gray-400 text-[11px] font-normal uppercase tracking-wider flex items-center gap-2">
              {client.engagementType.replace(/_/g, ' ')}
              <span className="w-1 h-1 bg-gray-200 rounded-full" />
              Managed by <span className=" tracking-normal text-gray-900 font-semibold capitalize">{accountManagerName}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => generateCredentials.mutate()}
            disabled={generateCredentials.isPending}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-lg text-xs font-bold hover:bg-indigo-100 transition-all shadow-sm disabled:opacity-50"
          >
            <KeyRound className="w-3.5 h-3.5" />
            {generateCredentials.isPending ? 'Generating...' : 'Portal Credentials'}
          </button>
          <select
            value={client.status}
            onChange={(e) => updateStatus.mutate(e.target.value)}
            disabled={updateStatus.isPending}
            className="px-3.5 py-2 bg-white border border-gray-200 text-gray-900 rounded-lg text-xs font-bold hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm cursor-pointer disabled:opacity-50"
          >
            <option value="ACTIVE">Active</option>
            <option value="PENDING">Pending</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>
      </div>

      {credModal && (
        <CredentialsModal
          isOpen={!!credModal}
          email={credModal.email}
          password={credModal.password}
          onClose={() => setCredModal(null)}
        />
      )}

      {/* Tabs Navigation */}
      <div className="flex items-center gap-1 bg-gray-100 p-1.5 rounded-lg w-fit">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${isActive
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
