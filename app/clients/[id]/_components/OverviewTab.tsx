'use client';

import * as React from 'react';
import { useState } from 'react';
import {
  Edit2,
  Sparkles,
  Target,
  Compass,
  Plus,
  X,
  Camera,
  Globe,
  Video,
  Briefcase,
  MessageCircle,
  Link as LinkIcon,
  Save,
  Trash2
} from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

interface OverviewTabProps {
  client: any;
}

export function OverviewTab({ client }: OverviewTabProps) {
  const queryClient = useQueryClient();
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  // Competitors local state for interactive list
  const [newCompetitor, setNewCompetitor] = useState('');

  // Social Links local state
  const [socialLinks, setSocialLinks] = useState<any>(client.socialLinks || {
    instagram: '',
    facebook: '',
    youtube: '',
    linkedin: '',
    others: []
  });

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

  const handleEdit = (field: string, initial: any) => {
    setEditingField(field);
    setEditValue(initial || '');
  };

  const handleSave = () => {
    mutation.mutate({ [editingField!]: editValue });
  };

  const handleAddCompetitor = () => {
    if (!newCompetitor.trim()) return;
    const currentCompetitors = Array.isArray(client.competitors) ? client.competitors : [];
    if (currentCompetitors.includes(newCompetitor.trim())) {
      toast.error('Competitor already exists');
      return;
    }
    mutation.mutate({
      competitors: [...currentCompetitors, newCompetitor.trim()]
    });
    setNewCompetitor('');
  };

  const handleRemoveCompetitor = (name: string) => {
    const currentCompetitors = Array.isArray(client.competitors) ? client.competitors : [];
    mutation.mutate({
      competitors: currentCompetitors.filter((c: string) => c !== name)
    });
  };

  const handleSaveSocialLinks = () => {
    mutation.mutate({ socialLinks });
  };

  const handleAddOtherSocial = () => {
    setSocialLinks((prev: any) => ({
      ...prev,
      others: [...(prev.others || []), { label: '', url: '' }]
    }));
  };

  const updateOtherSocial = (index: number, field: string, value: string) => {
    const updatedOthers = [...socialLinks.others];
    updatedOthers[index] = { ...updatedOthers[index], [field]: value };
    setSocialLinks({ ...socialLinks, others: updatedOthers });
  };

  const removeOtherSocial = (index: number) => {
    setSocialLinks((prev: any) => ({
      ...prev,
      others: prev.others.filter((_: any, i: number) => i !== index)
    }));
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
    }
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {CARDS.map((card) => (
          <div
            key={card.id}
            className="relative group bg-white p-2 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl ${card.bg} ${card.color}`}>
                  <card.icon className="w-4 h-4" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 tracking-tight">{card.title}</h3>
              </div>
              <button
                onClick={() => handleEdit(card.id, card.content)}
                className="p-2.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50/50 rounded-xl transition-all"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            </div>

            <div className="text-gray-600 text-sm font-medium leading-relaxed bg-gray-50/50 p-2 rounded-xl border border-gray-50 italic">
              {card.content ? (
                <p>"{card.content}"</p>
              ) : (
                <p className="text-gray-400">No details provided yet.</p>
              )}
            </div>
          </div>
        ))}

        {/* Competitors Card */}
        <div className="md:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-10 opacity-5 pointer-events-none">
            <Compass className="w-32 h-32 text-emerald-600" />
          </div>

          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <Compass className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 tracking-tight">Market Competitors</h3>
              <p className="text-xs text-gray-500 font-medium">Track who we're up against.</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex flex-wrap gap-3">
              <AnimatePresence>
                {Array.isArray(client.competitors) && client.competitors.map((c: string) => (
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    key={c}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-50 text-gray-700 text-sm font-semibold rounded-2xl border border-gray-100 group/item hover:border-emerald-200 hover:bg-emerald-50/30 transition-all"
                  >
                    {c}
                    <button
                      onClick={() => handleRemoveCompetitor(c)}
                      className="text-gray-400 hover:text-rose-500 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Add competitor..."
                  className="px-4 py-2 bg-white border border-gray-200 rounded-2xl text-sm font-semibold focus:outline-none focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 transition-all w-48"
                  value={newCompetitor}
                  onChange={(e) => setNewCompetitor(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddCompetitor()}
                />
                <button
                  onClick={handleAddCompetitor}
                  className="p-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {(!client.competitors || client.competitors.length === 0) && (
              <p className="text-gray-400 italic text-sm font-medium">No competitors listed yet. Start adding them above.</p>
            )}
          </div>
        </div>

        {/* Social Media Presence Card */}
        <div className="md:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                <LinkIcon className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 tracking-tight">Social Media Presence</h3>
                <p className="text-xs text-gray-500 font-medium">Digital footprints and social properties.</p>
              </div>
            </div>
            <button
              onClick={handleSaveSocialLinks}
              disabled={mutation.isPending}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all active:scale-95 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {mutation.isPending ? 'Syncing...' : 'Save Presence'}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-1">Instagram</label>
              <div className="relative">
                <Camera className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="instagram.com/handle"
                  className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-semibold focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all"
                  value={socialLinks.instagram}
                  onChange={(e) => setSocialLinks({ ...socialLinks, instagram: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-1">Facebook</label>
              <div className="relative">
                <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="facebook.com/page"
                  className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-semibold focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all"
                  value={socialLinks.facebook}
                  onChange={(e) => setSocialLinks({ ...socialLinks, facebook: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-1">YouTube</label>
              <div className="relative">
                <Video className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="youtube.com/@channel"
                  className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-semibold focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all"
                  value={socialLinks.youtube}
                  onChange={(e) => setSocialLinks({ ...socialLinks, youtube: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-1">LinkedIn</label>
              <div className="relative">
                <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="linkedin.com/company/handle"
                  className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-semibold focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all"
                  value={socialLinks.linkedin}
                  onChange={(e) => setSocialLinks({ ...socialLinks, linkedin: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 ml-1">Custom Links</h4>
            <div className="space-y-3">
              {socialLinks.others?.map((item: any, idx: number) => (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  key={idx}
                  className="flex gap-3"
                >
                  <input
                    type="text"
                    placeholder="Platform (e.g. TikTok)"
                    className="w-32 px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-xs font-semibold focus:outline-none focus:border-indigo-500"
                    value={item.label}
                    onChange={(e) => updateOtherSocial(idx, 'label', e.target.value)}
                  />
                  <input
                    type="text"
                    placeholder="URL"
                    className="flex-1 px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-xs font-semibold focus:outline-none focus:border-indigo-500"
                    value={item.url}
                    onChange={(e) => updateOtherSocial(idx, 'url', e.target.value)}
                  />
                  <button
                    onClick={() => removeOtherSocial(idx)}
                    className="p-2.5 text-gray-300 hover:text-rose-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </motion.div>
              ))}
              <button
                onClick={handleAddOtherSocial}
                className="group flex items-center gap-2 px-4 py-2 border-2 border-dashed border-gray-100 rounded-xl text-gray-400 hover:border-indigo-200 hover:text-indigo-600 transition-all"
              >
                <Plus className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
                <span className="text-[10px] font-bold uppercase tracking-wider">Add Custom Property</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal (Onboarding/Requirements) */}
      <AnimatePresence>
        {editingField && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingField(null)}
              className="absolute inset-0 bg-gray-900/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative bg-white w-full max-w-xl rounded-3xl p-8 shadow-2xl overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500" />

              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-bold text-gray-900 tracking-tight">Edit {editingField.replace(/([A-Z])/g, ' $1').trim()}</h3>
                <button
                  onClick={() => setEditingField(null)}
                  className="p-2 text-gray-400 hover:text-gray-900 rounded-xl"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <textarea
                className="w-full min-h-[250px] p-6 bg-gray-50 border border-gray-100 rounded-3xl text-sm focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500 transition-all font-medium leading-relaxed"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                placeholder="Enter detailed notes..."
              />

              <div className="flex items-center justify-end gap-4 mt-10">
                <button
                  onClick={() => setEditingField(null)}
                  className="px-8 py-3 text-sm font-bold text-gray-400 hover:text-gray-900 transition-all font-bold"
                >
                  Discard Changes
                </button>
                <button
                  onClick={handleSave}
                  disabled={mutation.isPending}
                  className="px-8 py-3 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all active:scale-95 disabled:opacity-50"
                >
                  {mutation.isPending ? 'Saving...' : 'Confirm Update'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
