'use client';

import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Users, X, RefreshCw } from 'lucide-react';
import { ClientStatus, EngagementType, ServiceType } from '@prisma/client';
import { toast } from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';
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
  { value: ClientStatus.ACTIVE,   label: 'Active' },
  { value: ClientStatus.PENDING,  label: 'Pending' },
  { value: ClientStatus.INACTIVE, label: 'Inactive' },
];

const ENGAGEMENT_OPTIONS: { value: EngagementType; label: string }[] = [
  { value: 'RETAINER',      label: 'Retainer' },
  { value: 'PROJECT_BASED', label: 'Project Based' },
];

// ── Edit Modal ───────────────────────────────────────────────────────────────

interface EditClientModalProps {
  client: ClientProfileWithServices;
  onClose: () => void;
  onSaved: () => void;
}

function EditClientModal({ client, onClose, onSaved }: EditClientModalProps) {
  const [form, setForm] = useState({
    companyName:   client.companyName,
    contactPerson: client.contactPerson,
    email:         client.email,
    phone:         client.phone,
    industry:      client.industry,
    engagementType: client.engagementType,
    status:        client.status,
  });
  const [isSaving, setIsSaving] = useState(false);

  const set = (field: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm(prev => ({ ...prev, [field]: e.target.value }));

  const handleSave = async () => {
    if (!form.companyName.trim() || !form.contactPerson.trim() || !form.email.trim()) {
      toast.error('Company name, contact person and email are required');
      return;
    }
    setIsSaving(true);
    try {
      const res = await fetch(`/api/clients/${client.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error('Failed to update client');
      toast.success('Client updated');
      onSaved();
      onClose();
    } catch {
      toast.error('Failed to update client');
    } finally {
      setIsSaving(false);
    }
  };

  const inputCls = 'w-full h-10 px-3 rounded-xl border border-gray-200 bg-white text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all';
  const labelCls = 'block text-xs font-semibold text-gray-500 mb-1.5';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gray-950/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-gray-50 rounded-2xl shadow-2xl w-full max-w-lg flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Edit Client</h2>
            <p className="text-xs text-gray-400 mt-0.5">{client.companyName}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <div className="px-6 py-5 space-y-4 overflow-y-auto max-h-[70vh]">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Company Name</label>
              <input className={inputCls} value={form.companyName} onChange={set('companyName')} placeholder="Acme Corp" />
            </div>
            <div>
              <label className={labelCls}>Contact Person</label>
              <input className={inputCls} value={form.contactPerson} onChange={set('contactPerson')} placeholder="John Doe" />
            </div>
            <div>
              <label className={labelCls}>Email</label>
              <input type="email" className={inputCls} value={form.email} onChange={set('email')} placeholder="john@acme.com" />
            </div>
            <div>
              <label className={labelCls}>Phone</label>
              <input className={inputCls} value={form.phone} onChange={set('phone')} placeholder="+1 555 000 0000" />
            </div>
            <div>
              <label className={labelCls}>Industry</label>
              <input className={inputCls} value={form.industry} onChange={set('industry')} placeholder="e.g. E-commerce" />
            </div>
            <div>
              <label className={labelCls}>Engagement Type</label>
              <select className={inputCls} value={form.engagementType} onChange={set('engagementType')}>
                {ENGAGEMENT_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Status</label>
              <select className={inputCls} value={form.status} onChange={set('status')}>
                {STATUS_FILTERS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-primary rounded-xl hover:opacity-90 transition-all disabled:opacity-60"
          >
            {isSaving ? <><RefreshCw className="w-4 h-4 animate-spin" /> Saving...</> : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────

async function fetchClients() {
  const response = await fetch('/api/clients');
  if (!response.ok) throw new Error('Failed to fetch clients');
  return response.json() as Promise<ClientProfileWithServices[]>;
}

export function ClientList() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ClientStatus>(ClientStatus.ACTIVE);
  const [editClient, setEditClient] = useState<ClientProfileWithServices | null>(null);

  const canAdmin =
    user?.userType === 'ADMIN_OWNER' ||
    (user?.roles ?? []).some(r => ['ADMIN', 'ACCOUNT_MANAGER'].includes(r));

  const canDelete =
    user?.userType === 'ADMIN_OWNER' ||
    (user?.roles ?? []).some(r => r === 'ADMIN');

  const { data: clients, isLoading, error } = useQuery<ClientProfileWithServices[]>({
    queryKey: ['clients'],
    queryFn: fetchClients,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/clients/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete client');
    },
    onSuccess: () => {
      toast.success('Client deleted');
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
    onError: () => toast.error('Failed to delete client'),
  });

  const handleDelete = (client: ClientProfileWithServices) => {
    if (!window.confirm(`Permanently delete "${client.companyName}"? This cannot be undone.`)) return;
    deleteMutation.mutate(client.id);
  };

  const statusCounts = useMemo(() => {
    return STATUS_FILTERS.reduce<Record<ClientStatus, number>>((acc, filter) => {
      acc[filter.value] = clients?.filter(c => c.status === filter.value).length ?? 0;
      return acc;
    }, { [ClientStatus.ACTIVE]: 0, [ClientStatus.PENDING]: 0, [ClientStatus.INACTIVE]: 0 });
  }, [clients]);

  const filteredClients = useMemo(() => {
    if (!clients) return [];
    const q = search.trim().toLowerCase();
    return clients.filter(c =>
      c.status === statusFilter &&
      c.companyName.toLowerCase().includes(q)
    );
  }, [clients, search, statusFilter]);

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
      {/* Search + filter */}
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
            onChange={(e) => setStatusFilter(e.target.value as ClientStatus)}
            aria-label="Filter clients by status"
            className="h-10 min-w-36 appearance-none rounded-lg border border-gray-100 bg-gray-50 px-3 pr-9 text-xs font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all"
          >
            {STATUS_FILTERS.map((filter) => (
              <option key={filter.value} value={filter.value}>
                {filter.label} ({statusCounts[filter.value]})
              </option>
            ))}
          </select>
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-gray-400">▼</span>
        </div>
      </div>

      {/* List */}
      {filteredClients.length > 0 ? (
        <div className="grid grid-cols-1 gap-4">
          {filteredClients.map((client) => (
            <ClientCard
              key={client.id}
              client={client}
              canAdmin={canAdmin}
              canDelete={canDelete}
              onEdit={setEditClient}
              onDelete={handleDelete}
            />
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

      {/* Edit modal */}
      {editClient && (
        <EditClientModal
          client={editClient}
          onClose={() => setEditClient(null)}
          onSaved={() => queryClient.invalidateQueries({ queryKey: ['clients'] })}
        />
      )}
    </div>
  );
}
