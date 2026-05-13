'use client';

import * as React from 'react';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ServiceType } from '@prisma/client';
import {
  Briefcase,
  Plus,
  X,
  Pencil,
  Trash2,
  ListTodo,
  RefreshCw,
  CheckCircle2,
  Camera,
  Globe,
  Video,
  MessageCircle,
  Pin,
  Monitor,
  ChevronDown
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';

interface ScopeTabProps {
  clientId: string;
  canEdit: boolean;
}

interface ScopeDetails {
  platforms: string[];
  deliverables: Record<string, string | number>;
  contentSplit: string[];
  currency: string;
}

interface ScopeFormData {
  service: ServiceType | '';
  description: string;
  budget: string;
  details: ScopeDetails;
}

interface ScopeItem {
  id: string;
  service: ServiceType;
  description?: string;
  budget?: number | null;
  details?: Partial<ScopeDetails> | null;
}

interface ClientScopeData {
  isScopeFinalized?: boolean;
  services?: { service: ServiceType }[];
}

const PLATFORMS = {
  SOCIAL_MEDIA: [
    { id: 'instagram', name: 'Instagram', icon: Camera },
    { id: 'facebook', name: 'Facebook', icon: Globe },
    { id: 'linkedin', name: 'LinkedIn', icon: Briefcase },
    { id: 'youtube', name: 'YouTube', icon: Video },
    { id: 'twitter', name: 'Twitter', icon: MessageCircle },
    { id: 'pinterest', name: 'Pinterest', icon: Pin },
  ],
  PAID_MEDIA: [
    { id: 'meta_ads', name: 'Meta Ads' },
    { id: 'google_ads', name: 'Google Ads' },
    { id: 'linkedin_ads', name: 'LinkedIn Ads' },
    { id: 'amazon_ads', name: 'Amazon Ads' },
    { id: 'others', name: 'Others' },
  ]
};

const CONTENT_TYPES = ['Static', 'Video', 'Carousel'] as const;

const SERVICE_OPTIONS: ServiceType[] = [
  'SOCIAL_MEDIA',
  'PAID_MEDIA',
  'INFLUENCER_MARKETING',
  'EMAIL_MARKETING',
  'WHATSAPP_MARKETING',
  'SEO',
  'CONTENT_CREATION',
  'BRANDING',
  'WEB_DEVELOPMENT'
];

const INITIAL_FORM_DATA: ScopeFormData = {
  service: '',
  description: '',
  budget: '',
  details: {
    platforms: [],
    deliverables: {},
    contentSplit: [],
    currency: 'USD',
  },
};

export function ScopeTab({ clientId, canEdit }: ScopeTabProps) {
  const queryClient = useQueryClient();
  const [isConfirming, setIsConfirming] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingScopeId, setEditingScopeId] = useState<string | null>(null);
  const [serviceError, setServiceError] = useState('');
  const { user } = useAuth();
  const canDelete = user?.userType === 'ADMIN_OWNER' || (user?.roles ?? []).includes('ADMIN');

  const { data: client, isLoading: isClientLoading } = useQuery<ClientScopeData>({
    queryKey: ['client', clientId],
    queryFn: async (): Promise<ClientScopeData> => {
      const res = await fetch(`/api/clients/${clientId}`);
      if (!res.ok) {
        throw new Error('Failed to load client');
      }
      return res.json() as Promise<ClientScopeData>;
    },
  });

  const { data: scope, isLoading: isScopeLoading } = useQuery<ScopeItem[]>({
    queryKey: ['client-scope', clientId],
    queryFn: async (): Promise<ScopeItem[]> => {
      const res = await fetch(`/api/clients/${clientId}/scope`);
      if (!res.ok) {
        throw new Error('Failed to load scope');
      }
      return res.json() as Promise<ScopeItem[]>;
    },
  });

  const [formData, setFormData] = useState<ScopeFormData>(INITIAL_FORM_DATA);

  React.useEffect(() => {
    if (!client?.services?.length || editingScopeId) {
      return;
    }

    const takenServices = new Set((scope ?? []).map((item) => item.service));
    const currentService = formData.service;

    if (currentService && !takenServices.has(currentService)) {
      return;
    }

    const defaultService = client.services.find((service) => !takenServices.has(service.service))?.service ?? '';

    if (defaultService && defaultService !== currentService) {
      setFormData((prev) => ({ ...prev, service: defaultService }));
    }
  }, [client, scope, formData.service, editingScopeId]);

  const formatServiceLabel = (service: string) => service.replace(/_/g, ' ');

  const isServiceDuplicate = (service: string, scopeId: string | null = editingScopeId) => {
    if (!service) {
      return false;
    }

    return (scope ?? []).some((item) => item.service === service && item.id !== scopeId);
  };

  const validateServiceSelection = () => {
    if (!formData.service) {
      const message = 'Please select a service.';
      setServiceError(message);
      toast.error(message);
      return false;
    }

    if (isServiceDuplicate(formData.service)) {
      const message = `The service "${formatServiceLabel(formData.service)}" has already been added. Each service can only be added once.`;
      setServiceError(message);
      toast.error(message);
      return false;
    }

    setServiceError('');
    return true;
  };

  const resetForm = () => {
    setFormData(INITIAL_FORM_DATA);
    setEditingScopeId(null);
    setServiceError('');
  };

  const openCreateForm = () => {
    resetForm();
    setIsConfirming(false);
    setIsFormOpen(true);
  };

  const openEditForm = (item: ScopeItem) => {
    setEditingScopeId(item.id);
    setServiceError('');
    setFormData({
      service: item.service || '',
      description: item.description || '',
      budget: item.budget?.toString?.() || '',
      details: {
        platforms: item.details?.platforms ?? [],
        deliverables: item.details?.deliverables ?? {},
        contentSplit: item.details?.contentSplit ?? [],
        currency: item.details?.currency || 'USD',
      },
    });
    setIsConfirming(false);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setIsConfirming(false);
    setEditingScopeId(null);
    setServiceError('');
    resetForm();
  };

  const mutation = useMutation({
    mutationFn: async (data: ScopeFormData) => {
      const res = await fetch(`/api/clients/${clientId}/scope`, {
        method: editingScopeId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingScopeId ? { ...data, scopeId: editingScopeId } : data),
      });
      if (!res.ok) {
        throw new Error((await res.text()) || 'Failed to save scope');
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success(editingScopeId ? 'Scope of Work updated!' : 'Scope of Work finalized!');
      queryClient.invalidateQueries({ queryKey: ['client-scope', clientId] });
      queryClient.invalidateQueries({ queryKey: ['client', clientId] });
      setIsConfirming(false);
      closeForm();
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : 'Something went wrong');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (scopeId: string) => {
      const res = await fetch(`/api/clients/${clientId}/scope`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scopeId }),
      });
      if (!res.ok) {
        throw new Error((await res.text()) || 'Failed to delete scope item');
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success('Scope item deleted');
      queryClient.invalidateQueries({ queryKey: ['client-scope', clientId] });
      queryClient.invalidateQueries({ queryKey: ['client', clientId] });
      if (editingScopeId) {
        closeForm();
      }
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : 'Failed to delete scope item');
    },
  });

  const handleTogglePlatform = (platformId: string) => {
    setFormData((prev) => {
      const platforms = prev.details.platforms.includes(platformId)
        ? prev.details.platforms.filter((p) => p !== platformId)
        : [...prev.details.platforms, platformId];

      return {
        ...prev,
        details: { ...prev.details, platforms },
      };
    });
  };

  const handleDeliverableChange = (platformId: string, count: string) => {
    setFormData((prev) => ({
      ...prev,
      details: {
        ...prev.details,
        deliverables: { ...prev.details.deliverables, [platformId]: count },
      },
    }));
  };

  const handleToggleContentSplit = (type: string) => {
    setFormData((prev) => {
      const contentSplit = prev.details.contentSplit.includes(type)
        ? prev.details.contentSplit.filter((t) => t !== type)
        : [...prev.details.contentSplit, type];

      return {
        ...prev,
        details: { ...prev.details, contentSplit },
      };
    });
  };

  if (isClientLoading || isScopeLoading) {
    return (
      <div className="flex justify-center p-20">
        <RefreshCw className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  const isFinalized = client?.isScopeFinalized;
  const hasScope = (scope?.length ?? 0) > 0;

  if (isFinalized && !isFormOpen && hasScope) {
    return (
      <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900 tracking-tight">Scope of Work</h2>
            <p className="text-xs text-gray-500 font-medium mt-1">Detailed roadmap and confirmed deliverables for this account.</p>
          </div>
          {canEdit && (
            <button
              onClick={openCreateForm}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold hover:bg-primary shadow-lg shadow-primary/20 transition-all"
            >
              <Plus className="w-4 h-4" />
              Add New Service
            </button>
          )}
        </div>
        <div className="bg-emerald-50 border border-emerald-100 p-5 rounded-lg flex items-center gap-4">
          <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-white">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-md font-semibold text-emerald-900">Scope Finalized</h3>
            <p className="text-sm text-emerald-700 font-normal">This scope was confirmed and is now active for execution.</p>
          </div>
        </div>

        <div className="space-y-6">
          {scope?.map((item) => (
            <div key={item.id} className="bg-white p-8 rounded-lg border border-gray-100 shadow-sm space-y-8">
              <div className="flex items-center justify-between">
                <div className='flex gap-6 items-center'>
                  <div className='text-left'>
                    <p className="text-[9px] font-semibold uppercase tracking-widest text-gray-400 mb-0.5">Service Type</p>
                    <h2 className="text-xl font-semibold text-gray-900">{item.service.replace(/_/g, ' ')}</h2>
                  </div>
                  {/* monthly budget */}
                  {canEdit && item.budget && (
                    <div className="border-l border-gray-200 pl-6 text-start">
                      <p className="text-[9px] font-semibold uppercase tracking-widest text-gray-400 mb-0.5">Monthly Budget</p>
                      <p className="text-xl font-bold text-primary">
                      {item.details?.currency === 'INR' ? '₹' : '$'}{item.budget.toLocaleString()}
                      </p>
                    </div>
              )}
                </div>
                {(canEdit || canDelete) && (
                  <div className="flex items-center gap-2">
                    {canEdit && (
                      <button
                        onClick={() => openEditForm(item)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 text-gray-600 hover:text-primary hover:border-primary/30 hover:bg-primary/5 transition-all text-xs font-semibold"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        Edit
                      </button>
                    )}
                    {canDelete && (
                      <button
                        onClick={() => {
                          if (window.confirm('Delete this scope item? This action cannot be undone.')) {
                            deleteMutation.mutate(item.id);
                          }
                        }}
                        disabled={deleteMutation.isPending}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-all text-xs font-semibold disabled:opacity-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete
                      </button>
                    )}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-gray-50">
                <div className="flex flex-col space-y-4">
                  {item.details?.platforms && item.details.platforms.length > 0 && (
                    <>
                    
                      <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                        <Monitor className="w-4 h-4 text-gray-400" />
                        Selected Platforms
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {item.details.platforms.map((p) => (
                          <span key={p} className="px-3 py-1.5 bg-gray-50 text-gray-700 text-[9px] font-black uppercase tracking-widest rounded-lg border border-gray-100">
                            {p.replace(/_/g, ' ')}
                          </span>
                        ))}
                      </div>
                    </>
                  )}
                  {item.description && item.description.trim() !== '' && (
                    <div className="mt-4">
                      <h4 className="text-sm font-semibold text-gray-900">Detailed Description</h4>
                      <p className="text-gray-600 text-sm leading-relaxed font-medium bg-gray-50 p-5 rounded-xl border border-gray-100 italic">
                        &quot;{item.description}&quot;
                      </p>
                    </div>
                  )}
                </div>

                {item.details?.deliverables && Object.keys(item.details.deliverables).length > 0 && (
                  <div className="space-y-4">
                    <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                      <ListTodo className="w-4 h-4 text-gray-400" />
                      Deliverables Count
                    </h4>
                    <div className="space-y-2">
                      {Object.entries(item.details.deliverables as Record<string, string | number>).map(([p, count]) => (
                        <div key={p} className="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl">
                          <span className="text-xs font-bold text-gray-600 uppercase tracking-tight">{p.replace(/_/g, ' ')}</span>
                          <span className="text-xs font-bold text-primary">{count} posts / mo</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-4">

                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!canEdit && !isFinalized) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
          <Briefcase className="w-7 h-7 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-700 mb-1">Scope Not Yet Defined</h3>
        <p className="text-sm text-gray-400 font-medium">The account manager will finalize the scope of work soon.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 tracking-tight">Scope of Work</h2>
          <p className="text-sm text-gray-400 font-medium mt-1">
            {isFormOpen || !isFinalized
              ? `Define specific deliverables for your ${formData.service.replace(/_/g, ' ')} engagement.`
              : 'Detailed roadmap and confirmed deliverables for this account.'}
          </p>
        </div>
        {canEdit && (
          <button
            onClick={() => {
              if (isFormOpen) {
                closeForm();
              } else {
                openCreateForm();
              }
            }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-lg cursor-pointer ${
              isFormOpen
                ? 'bg-gray-100 text-gray-600 hover:bg-gray-200 shadow-none'
                : 'bg-primary text-white hover:bg-primary shadow-primary/20'
            }`}
          >
            {isFormOpen ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
            {isFormOpen ? 'Cancel' : 'Add New Service'}
          </button>
        )}
      </div>

      {/* {isFinalized && client?.services?.length! > 0 && ( */}
        <div className="bg-white p-6 rounded-lg border border-gray-100 shadow-sm">
          <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-primary" />
            Services Requested during Onboarding
          </h3>
          <div className="flex flex-wrap gap-2">
            {client?.services?.map((s) => (
              <span key={s.service} className="px-3 py-1.5 bg-primary/10 text-[#00786f] text-[10px] font-semibold uppercase tracking-widest rounded-lg border border-primary/20">
                {s.service.replace(/_/g, ' ')}
              </span>
            ))}
          </div>
        </div>
      {/* } */}

      <div className="bg-white p-6 rounded-lg border border-gray-100 shadow-sm space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-700">Service Category</label>
            <div className="relative">
              <select
                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-primary text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all cursor-pointer appearance-none"
                value={formData.service}
                onChange={(e) => {
                  const nextService = e.target.value as ServiceType;

                  if (isServiceDuplicate(nextService)) {
                    const message = `The service "${formatServiceLabel(nextService)}" has already been added. Each service can only be added once.`;
                    setServiceError(message);
                    toast.error(message);
                    return;
                  }

                  setServiceError('');
                  setFormData((prev) => ({ ...prev, service: nextService }));
                }}
              >
                <option value="" disabled>Select a service...</option>
                {SERVICE_OPTIONS.map((type) => (
                  <option
                    key={type}
                    value={type}
                    disabled={isServiceDuplicate(type) && formData.service !== type}
                  >
                    {formatServiceLabel(type)}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary pointer-events-none" />
            </div>
            {serviceError && <p className="text-xs font-medium text-red-500">{serviceError}</p>}
          </div>
          {canEdit && (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-700">Monthly Budget Estimate</label>
              <div className="flex bg-gray-50 border border-gray-100 rounded-xl focus-within:ring-2 focus-within:ring-primary/10 focus-within:border-primary transition-all overflow-hidden relative">
                <select
                  className="pl-4 pr-8 py-3 bg-gray-100 border-r border-gray-200 text-gray-700 text-sm font-bold focus:outline-none appearance-none cursor-pointer"
                  value={formData.details.currency || 'USD'}
                  onChange={(e) => setFormData((prev) => ({
                    ...prev,
                    details: { ...prev.details, currency: e.target.value }
                  }))}
                >
                  <option value="USD">$ USD</option>
                  <option value="INR">&#8377; INR</option>
                </select>
                <ChevronDown className="absolute left-[5.2rem] top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  type="number"
                  placeholder="5000"
                  className="w-full px-4 py-3 bg-transparent text-sm focus:outline-none font-bold"
                  value={formData.budget}
                  onChange={(e) => setFormData((prev) => ({ ...prev, budget: e.target.value }))}
                />
              </div>
            </div>
          )}
        </div>

        {formData.service === 'SOCIAL_MEDIA' && (
          <div className="space-y-8 pt-8 border-t border-gray-50">
            <div className="space-y-4">
              <label className="text-sm font-bold text-gray-900">Select Social Platforms</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                {PLATFORMS.SOCIAL_MEDIA.map((platform) => {
                  const isSelected = formData.details.platforms.includes(platform.id);
                  return (
                    <button
                      key={platform.id}
                      onClick={() => handleTogglePlatform(platform.id)}
                      className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                        isSelected
                          ? 'border-primary bg-primary/50 text-primary'
                          : 'border-gray-50 bg-gray-50/50 text-gray-400 hover:border-gray-100'
                      }`}
                    >
                      <platform.icon className="w-5 h-5" />
                      <span className="text-[9px] font-bold uppercase tracking-tighter">{platform.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {formData.details.platforms.length > 0 && (
              <div className="space-y-4 animate-in slide-in-from-top-2 duration-300">
                <label className="text-sm font-bold text-gray-900">Monthly Deliverables (Post Count)</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {formData.details.platforms.map((platformId: string) => (
                    <div key={platformId} className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl border border-gray-100">
                      <span className="text-[9px] font-black uppercase text-gray-400 w-20">
                        {platformId.replace(/_/g, ' ')}
                      </span>
                      <input
                        type="number"
                        placeholder="0"
                        className="flex-1 bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-primary/10"
                        value={formData.details.deliverables[platformId] || ''}
                        onChange={(e) => handleDeliverableChange(platformId, e.target.value)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-4">
              <label className="text-sm font-bold text-gray-900">Content Split (Optional)</label>
              <div className="flex gap-3">
                {CONTENT_TYPES.map((type) => (
                  <button
                    key={type}
                    onClick={() => handleToggleContentSplit(type)}
                    className={`px-4 py-2 rounded-lg text-xs font-bold border-2 transition-all ${
                      formData.details.contentSplit.includes(type)
                        ? 'bg-primary border-primary text-white'
                        : 'bg-white border-gray-100 text-gray-500 hover:border-primary/20'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {formData.service === 'PAID_MEDIA' && (
          <div className="space-y-8 pt-8 border-t border-gray-50">
            <div className="space-y-4">
              <label className="text-sm font-bold text-gray-900">Select Ad Platforms</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {PLATFORMS.PAID_MEDIA.map((platform) => {
                  const isSelected = formData.details.platforms.includes(platform.id);
                  return (
                    <button
                      key={platform.id}
                      onClick={() => handleTogglePlatform(platform.id)}
                      className={`flex items-center justify-between p-5 rounded-lg border-2 transition-all ${
                        isSelected
                          ? 'border-primary bg-primary/50 text-primary'
                          : 'border-gray-50 bg-gray-50/50 text-gray-400 hover:border-gray-100'
                      }`}
                    >
                      <span className="font-bold text-sm">{platform.name}</span>
                      {isSelected ? <CheckCircle2 className="w-5 h-5" /> : <Plus className="w-5 h-5 opacity-50" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4 pt-8 border-t border-gray-50">
          <label className="text-xs font-bold text-gray-900">Brief Scope Description <span className="text-gray-400 font-normal">(Optional)</span></label>
          <textarea
            placeholder="Outline specific objectives, goals, and any additional notes for this service..."
            className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-xs min-h-[120px] focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all font-medium leading-relaxed"
            value={formData.description}
            onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
          />
        </div>

        {canEdit && (
          <div className="flex items-center justify-end pt-4">
            <button
              onClick={() => {
                if (!validateServiceSelection()) {
                  return;
                }

                if (editingScopeId) {
                  mutation.mutate(formData);
                } else {
                  setIsConfirming(true);
                }
              }}
              className="px-8 py-3 bg-primary text-white rounded-xl text-sm font-bold hover:bg-primary shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              {editingScopeId ? 'Update Scope of Work' : 'Finalize Scope of Work'}
            </button>
          </div>
        )}
      </div>

      <AnimatePresence>
        {isConfirming && (
          <div className="fixed inset-0 z-200 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsConfirming(false)}
              className="absolute inset-0 bg-gray-900/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative bg-white w-full max-w-lg rounded-lg p-8 shadow-2xl overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-linear-to-r from-primary via-purple-500 to-primary" />

              <div className="flex flex-col items-center text-center space-y-6">
                <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                  <CheckCircle2 className="w-8 h-8" />
                </div>

                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-gray-900 tracking-tight">Final Confirmation</h3>
                  <p className="text-gray-500 font-medium px-4">
                    Are you sure you want to finalize this scope? This action <span className="text-primary font-bold underline decoration-primary/30 underline-offset-4">cannot be reversed</span> and will set the official roadmap for the client.
                  </p>
                </div>

                <div className="w-full flex flex-col gap-3 pt-4">
                  <button
                    disabled={mutation.isPending}
                    onClick={() => {
                      if (validateServiceSelection()) {
                        mutation.mutate(formData);
                      }
                    }}
                    className="w-full py-4 bg-primary text-white rounded-lg font-bold hover:bg-primary transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
                  >
                    {mutation.isPending ? 'Processing...' : 'Yes, Finalize Now'}
                  </button>
                  <button
                    onClick={() => setIsConfirming(false)}
                    className="w-full py-4 text-gray-400 font-bold hover:text-gray-900 transition-all"
                  >
                    Go back and edit
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
