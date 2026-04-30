'use client';

import * as React from 'react';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Briefcase,
  Plus,
  X,
  ListTodo,
  DollarSign,
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
import { ServiceType } from '@prisma/client';
import { motion, AnimatePresence } from 'framer-motion';

interface ScopeTabProps {
  clientId: string;
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

const CONTENT_TYPES = ['Static', 'Video', 'Carousel'];

const SERVICE_OPTIONS = [
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

export function ScopeTab({ clientId }: ScopeTabProps) {
  const queryClient = useQueryClient();
  const [isConfirming, setIsConfirming] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  // Fetch client to get defaultService and isScopeFinalized
  const { data: client, isLoading: isClientLoading } = useQuery({
    queryKey: ['client', clientId],
    queryFn: () => fetch(`/api/clients/${clientId}`).then(res => res.json()),
  });

  const { data: scope, isLoading: isScopeLoading } = useQuery({
    queryKey: ['client-scope', clientId],
    queryFn: () => fetch(`/api/clients/${clientId}/scope`).then(res => res.json()),
  });

  const [formData, setFormData] = useState<any>({
    service: '',
    description: '',
    budget: '',
    details: {
      platforms: [],
      deliverables: {},
      contentSplit: [],
      currency: 'USD'
    }
  });

  // Set default service once client data is loaded
  React.useEffect(() => {
    if (client?.services?.length > 0 && !formData.service) {
      setFormData((prev: any) => ({ ...prev, service: client.services[0].service }));
    }
  }, [client]);

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch(`/api/clients/${clientId}/scope`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Missing fields');
      return res.json();
    },
    onSuccess: () => {
      toast.success('Scope of Work finalized!');
      queryClient.invalidateQueries({ queryKey: ['client-scope', clientId] });
      queryClient.invalidateQueries({ queryKey: ['client', clientId] });
      setIsConfirming(false);
      setIsAdding(false);
    },
    onError: (err: any) => {
      toast.error(err.message || 'Something went wrong');
    }
  });

  const handleTogglePlatform = (platformId: string) => {
    setFormData((prev: any) => {
      const platforms = prev.details.platforms.includes(platformId)
        ? prev.details.platforms.filter((p: string) => p !== platformId)
        : [...prev.details.platforms, platformId];

      return {
        ...prev,
        details: { ...prev.details, platforms }
      };
    });
  };

  const handleDeliverableChange = (platformId: string, count: string) => {
    setFormData((prev: any) => ({
      ...prev,
      details: {
        ...prev.details,
        deliverables: { ...prev.details.deliverables, [platformId]: count }
      }
    }));
  };

  const handleToggleContentSplit = (type: string) => {
    setFormData((prev: any) => {
      const contentSplit = prev.details.contentSplit.includes(type)
        ? prev.details.contentSplit.filter((t: string) => t !== type)
        : [...prev.details.contentSplit, type];

      return {
        ...prev,
        details: { ...prev.details, contentSplit }
      };
    });
  };

  if (isClientLoading || isScopeLoading) return (
    <div className="flex justify-center p-20">
      <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
    </div>
  );

  const isFinalized = client?.isScopeFinalized;
  const hasScope = scope && scope.length > 0;

  if (isFinalized && !isAdding && hasScope) {
    return (
      <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900 tracking-tight">Scope of Work</h2>
            <p className="text-xs text-gray-500 font-medium mt-1">Detailed roadmap and confirmed deliverables for this account.</p>
          </div>
          <button
            onClick={() => {
              setFormData({
                service: '',
                description: '',
                budget: '',
                details: { platforms: [], deliverables: {}, contentSplit: [], currency: 'USD' }
              });
              setIsAdding(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all"
          >
            <Plus className="w-4 h-4" />
            Add New Service
          </button>
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
          {scope.map((item: any) => (
            <div key={item.id} className="bg-white p-8 rounded-lg border border-gray-100 shadow-sm space-y-8">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[9px] font-semibold uppercase tracking-widest text-gray-400 mb-0.5">Service Type</p>
                  <h2 className="text-xl font-semibold text-gray-900">{item.service.replace(/_/g, ' ')}</h2>
                </div>
                {item.budget && (
                  <div className="text-right">
                    <p className="text-[9px] font-semibold uppercase tracking-widest text-gray-400 mb-0.5">Monthly Budget</p>
                    <p className="text-xl font-bold text-indigo-600">
                      {item.details?.currency === 'INR' ? '₹' : '$'}{item.budget.toLocaleString()}
                    </p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-gray-50">
                <div className="flex flex-col space-y-4">
                  {item.details?.platforms && item.details.platforms.length > 0 && (
                    <>
                      <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                        <Monitor className="w-4 h-4 text-gray-400" />
                        Selected Platforms
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {item.details.platforms.map((p: string) => (
                          <span key={p} className="px-3 py-1.5 bg-gray-50 text-gray-700 text-[9px] font-black uppercase tracking-widest rounded-lg border border-gray-100">
                            {p.replace(/_/g, ' ')}
                          </span>
                        ))}
                      </div>
                    </>
                  )}
                  {item.description && item.description.trim() !== '' && (
                    <div className='mt-4'>
                      <h4 className="text-sm font-semibold text-gray-900">Detailed Description</h4>
                      <p className="text-gray-600 text-sm leading-relaxed font-medium bg-gray-50 p-5 rounded-xl border border-gray-100 italic">
                        "{item.description}"
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
                      {Object.entries(item.details.deliverables).map(([p, count]: any) => (
                        <div key={p} className="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl">
                          <span className="text-xs font-bold text-gray-600 uppercase tracking-tight">{p.replace(/_/g, ' ')}</span>
                          <span className="text-xs font-bold text-indigo-600">{count} posts / mo</span>
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

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 tracking-tight">Scope of Work</h2>
          <p className="text-sm text-gray-400 font-medium mt-1">
            {isAdding || !isFinalized
              ? `Define specific deliverables for your ${formData.service.replace(/_/g, ' ')} engagement.`
              : 'Detailed roadmap and confirmed deliverables for this account.'}
          </p>
        </div>
        <button
          onClick={() => {
            if (isAdding) {
              setIsAdding(false);
            } else {
              setFormData({
                service: '',
                description: '',
                budget: '',
                details: { platforms: [], deliverables: {}, contentSplit: [], currency: 'USD' }
              });
              setIsAdding(true);
            }
          }}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-lg ${isAdding
            ? 'bg-gray-100 text-gray-600 hover:bg-gray-200 shadow-none'
            : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-100'
            }`}
        >
          {isAdding ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
          {isAdding ? 'Cancel' : 'Add New Service'}
        </button>
      </div>

      {/* Show Services Requested during Onboarding */}
      {!isFinalized && client?.services?.length > 0 && (
        <div className="bg-white p-6 rounded-lg border border-gray-100 shadow-sm">
          <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Briefcase className="w-4 h-4 text-indigo-600" />
            Services Requested during Onboarding
          </h3>
          <div className="flex flex-wrap gap-2">
            {client.services.map((s: any) => (
              <span key={s.id} className="px-3 py-1.5 bg-indigo-50 text-indigo-700 text-[10px] font-black uppercase tracking-widest rounded-lg border border-indigo-100">
                {s.service.replace(/_/g, ' ')}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white p-6 rounded-lg border border-gray-100 shadow-sm space-y-6">
        {/* Service Selector */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-700">Service Category</label>
            <div className="relative">
              <select
                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-indigo-600 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all cursor-pointer appearance-none"
                value={formData.service}
                onChange={(e) => setFormData((p: any) => ({ ...p, service: e.target.value }))}
              >
                <option value="" disabled>Select a service...</option>
                {SERVICE_OPTIONS.map((type) => (
                  <option key={type} value={type}>{type.replace(/_/g, ' ')}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-indigo-600 pointer-events-none" />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-700">Monthly Budget Estimate</label>
            <div className="flex bg-gray-50 border border-gray-100 rounded-xl focus-within:ring-2 focus-within:ring-indigo-500/10 focus-within:border-indigo-500 transition-all overflow-hidden relative">
              <select
                className="pl-4 pr-8 py-3 bg-gray-100 border-r border-gray-200 text-gray-700 text-sm font-bold focus:outline-none appearance-none cursor-pointer"
                value={formData.details?.currency || 'USD'}
                onChange={(e) => setFormData((p: any) => ({
                  ...p,
                  details: { ...p.details, currency: e.target.value }
                }))}
              >
                <option value="USD">$ USD</option>
                <option value="INR">₹ INR</option>
              </select>
              <ChevronDown className="absolute left-[5.2rem] top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <input
                type="number"
                placeholder="5000"
                className="w-full px-4 py-3 bg-transparent text-sm focus:outline-none font-bold"
                value={formData.budget}
                onChange={(e) => setFormData((p: any) => ({ ...p, budget: e.target.value }))}
              />
            </div>
          </div>
        </div>

        {/* Dynamic Form Content */}
        {formData.service === 'SOCIAL_MEDIA' && (
          <div className="space-y-8 pt-8 border-t border-gray-50">
            <div className="space-y-4">
              <label className="text-sm font-bold text-gray-900">Select Social Platforms</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                {PLATFORMS.SOCIAL_MEDIA.map(platform => {
                  const isSelected = formData.details.platforms.includes(platform.id);
                  return (
                    <button
                      key={platform.id}
                      onClick={() => handleTogglePlatform(platform.id)}
                      className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${isSelected
                        ? 'border-indigo-600 bg-indigo-50/50 text-indigo-600'
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
                        className="flex-1 bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/10"
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
                {CONTENT_TYPES.map(type => (
                  <button
                    key={type}
                    onClick={() => handleToggleContentSplit(type)}
                    className={`px-4 py-2 rounded-lg text-xs font-bold border-2 transition-all ${formData.details.contentSplit.includes(type)
                      ? 'bg-indigo-600 border-indigo-600 text-white'
                      : 'bg-white border-gray-100 text-gray-500 hover:border-indigo-100'
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
                {PLATFORMS.PAID_MEDIA.map(platform => {
                  const isSelected = formData.details.platforms.includes(platform.id);
                  return (
                    <button
                      key={platform.id}
                      onClick={() => handleTogglePlatform(platform.id)}
                      className={`flex items-center justify-between p-5 rounded-lg border-2 transition-all ${isSelected
                        ? 'border-indigo-600 bg-indigo-50/50 text-indigo-600'
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
            className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-xs min-h-[120px] focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium leading-relaxed"
            value={formData.description}
            onChange={(e) => setFormData((p: any) => ({ ...p, description: e.target.value }))}
          />
        </div>

        <div className="flex items-center justify-end pt-4">
          <button
            onClick={() => setIsConfirming(true)}
            className="px-8 py-3 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            Finalize Scope of Work
          </button>
        </div>
      </div>

      {/* Confirmation Modal */}
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
              <div className="absolute top-0 left-0 w-full h-2 bg-linear-to-r from-indigo-500 via-purple-500 to-indigo-500" />

              <div className="flex flex-col items-center text-center space-y-6">
                <div className="w-16 h-16 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600">
                  <CheckCircle2 className="w-8 h-8" />
                </div>

                <div className="space-y-2">
                  <h3 className="text-xl font-bold text-gray-900 tracking-tight">Final Confirmation</h3>
                  <p className="text-gray-500 font-medium px-4">
                    Are you sure you want to finalize this scope? This action <span className="text-indigo-600 font-bold underline decoration-indigo-200 underline-offset-4">cannot be reversed</span> and will set the official roadmap for the client.
                  </p>
                </div>

                <div className="w-full flex flex-col gap-3 pt-4">
                  <button
                    disabled={mutation.isPending}
                    onClick={() => mutation.mutate(formData)}
                    className="w-full py-4 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 disabled:opacity-50"
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
