'use client';

import * as React from 'react';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Briefcase, Plus, X, ListTodo, DollarSign, Layout, ChevronRight, RefreshCw } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { ServiceType } from '@prisma/client';

interface ScopeTabProps {
  clientId: string;
}

export function ScopeTab({ clientId }: ScopeTabProps) {
  const queryClient = useQueryClient();
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({
    service: '' as ServiceType | '',
    description: '',
    budget: '',
  });

  const { data: scope, isLoading } = useQuery({
    queryKey: ['client-scope', clientId],
    queryFn: () => fetch(`/api/clients/${clientId}/scope`).then(res => res.json()),
  });

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch(`/api/clients/${clientId}/scope`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to add scope');
      return res.json();
    },
    onSuccess: () => {
      toast.success('Scope of Work updated!');
      queryClient.invalidateQueries({ queryKey: ['client-scope', clientId] });
      setIsAdding(false);
      setFormData({ service: '', description: '', budget: '' });
    },
  });

  if (isLoading) return (
    <div className="flex justify-center p-20">
      <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 tracking-tight">Scope of Work</h2>
          <p className="text-sm text-gray-500 font-medium">Defined services and deliverables for this engagement.</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all"
        >
          <Plus className="w-4 h-4" />
          Add Service
        </button>
      </div>

      <div className="space-y-4">
        {scope?.map((item: any) => (
          <div 
            key={item.id} 
            className="flex items-center justify-between bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:border-indigo-100 transition-all group"
          >
            <div className="flex items-center gap-6">
              <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 group-hover:text-indigo-600 group-hover:bg-indigo-50 transition-colors">
                <Briefcase className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
                  {item.service.replace(/_/g, ' ')}
                </h4>
                <p className="text-sm text-gray-500 font-medium">{item.description}</p>
              </div>
            </div>

            <div className="flex items-center gap-8">
              {item.budget && (
                <div className="text-right">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Monthly Budget</p>
                  <p className="text-sm font-semibold text-gray-900">${item.budget.toLocaleString()}</p>
                </div>
              )}
              <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-indigo-600 transition-colors" />
            </div>
          </div>
        ))}

        {scope?.length === 0 && (
          <div className="text-center py-20 bg-gray-50/50 border-2 border-dashed border-gray-100 rounded-3xl">
            <Layout className="w-12 h-12 text-gray-200 mx-auto mb-4" />
            <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">No Scope Defined</p>
          </div>
        )}
      </div>

      {/* Add Scope Modal */}
      {isAdding && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-3xl p-8 shadow-2xl">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-semibold text-gray-900 tracking-tight">Add Service Scope</h3>
              <button 
                onClick={() => setIsAdding(false)}
                className="p-2 text-gray-400 hover:text-gray-900 rounded-lg"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); mutation.mutate(formData); }} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Service Category</label>
                <select 
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium"
                  value={formData.service}
                  onChange={(e) => setFormData(p => ({ ...p, service: e.target.value as ServiceType }))}
                >
                  <option value="">Select a service...</option>
                  {Object.values(ServiceType).map((type) => (
                    <option key={type} value={type}>{type.replace(/_/g, ' ')}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Scope Description</label>
                <textarea 
                  placeholder="e.g. Daily Instagram management and 4 Paid campaigns monthly"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm min-h-[100px] focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium"
                  value={formData.description}
                  onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-emerald-500" />
                  Allocated Budget (Monthly)
                </label>
                <input 
                  type="number"
                  placeholder="e.g. 5000"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium"
                  value={formData.budget}
                  onChange={(e) => setFormData(p => ({ ...p, budget: e.target.value }))}
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-6">
                <button 
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-6 py-3 text-sm font-bold text-gray-500 hover:text-gray-900"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={mutation.isPending}
                  className="px-10 py-3 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all disabled:opacity-70"
                >
                  {mutation.isPending ? 'Updating...' : 'Add Service'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
