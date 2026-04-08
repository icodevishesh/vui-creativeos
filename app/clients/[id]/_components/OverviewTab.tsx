'use client';

import * as React from 'react';
import { useState } from 'react';
import { Edit2, Sparkles, Target, Compass } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';

interface OverviewTabProps {
  client: any;
}

export function OverviewTab({ client }: OverviewTabProps) {
  const queryClient = useQueryClient();
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch(`/api/clients/${client.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Update failed');
      return res.json();
    },
    onSuccess: () => {
      toast.success('Information updated!');
      queryClient.invalidateQueries({ queryKey: ['client', client.id] });
      setEditingField(null);
    },
    onError: () => toast.error('Something went wrong'),
  });

  const handleEdit = (field: string, initial: string) => {
    setEditingField(field);
    setEditValue(initial || '');
  };

  const handleSave = () => {
    mutation.mutate({ [editingField!]: editValue });
  };

  const CARDS = [
    { 
      id: 'onboardingNotes', 
      title: 'Onboarding Notes', 
      content: client.onboardingNotes, 
      icon: Sparkles,
      color: 'text-amber-500',
      bg: 'bg-amber-50'
    },
    { 
      id: 'requirementNotes', 
      title: 'Requirement Notes', 
      content: client.requirementNotes, 
      icon: Target,
      color: 'text-indigo-500',
      bg: 'bg-indigo-50'
    },
    { 
      id: 'competitors', 
      title: 'Competitors', 
      content: client.competitors, 
      icon: Compass,
      color: 'text-emerald-500',
      bg: 'bg-emerald-50'
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {CARDS.map((card) => (
        <div 
          key={card.id} 
          className={`relative group bg-white p-8 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all ${card.id === 'competitors' ? 'md:col-span-2' : ''}`}
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl ${card.bg} ${card.color}`}>
                <card.icon className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 tracking-tight">{card.title}</h3>
            </div>
            <button 
              onClick={() => handleEdit(card.id, card.content)}
              className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
            >
              <Edit2 className="w-4 h-4" />
            </button>
          </div>

          <div className="prose prose-sm max-w-none text-gray-600 font-medium leading-relaxed">
            {card.content ? (
              card.id === 'competitors' ? (
                <div className="flex flex-wrap gap-2">
                  {card.content.split(',').map((c: string) => (
                    <span key={c} className="px-3 py-1 bg-gray-100 rounded-lg text-xs font-bold text-gray-700">
                      {c.trim()}
                    </span>
                  ))}
                </div>
              ) : (
                <p>{card.content}</p>
              )
            ) : (
              <p className="italic text-gray-400">No details provided yet.</p>
            )}
          </div>
        </div>
      ))}

      {/* Edit Modal (Simulated for brevity, in real app use a portal) */}
      {editingField && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-3xl p-8 shadow-2xl">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">Edit {editingField.replace(/([A-Z])/g, ' $1').trim()}</h3>
            <textarea
              className="w-full min-h-[200px] p-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              placeholder="Enter details..."
            />
            <div className="flex items-center justify-end gap-3 mt-8">
              <button 
                onClick={() => setEditingField(null)}
                className="px-6 py-2.5 text-sm font-bold text-gray-500 hover:text-gray-900"
              >
                Cancel
              </button>
              <button 
                onClick={handleSave}
                disabled={mutation.isPending}
                className="px-8 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all"
              >
                {mutation.isPending ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
