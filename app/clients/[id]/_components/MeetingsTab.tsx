'use client';

import * as React from 'react';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { MessageSquare, Plus, X, Calendar, Clock, User, RefreshCw, ChevronDown } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface MeetingsTabProps {
  clientId: string;
}

export function MeetingsTab({ clientId }: MeetingsTabProps) {
  const queryClient = useQueryClient();
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    notes: '',
    meetingDate: new Date().toISOString().split('T')[0],
  });

  const { data: meetings, isLoading } = useQuery({
    queryKey: ['client-meetings', clientId],
    queryFn: () => fetch(`/api/clients/${clientId}/meetings`).then(res => res.json()),
  });

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch(`/api/clients/${clientId}/meetings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to log meeting');
      return res.json();
    },
    onSuccess: () => {
      toast.success('Meeting log saved!');
      queryClient.invalidateQueries({ queryKey: ['client-meetings', clientId] });
      setIsAdding(false);
      setFormData({ title: '', notes: '', meetingDate: new Date().toISOString().split('T')[0] });
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
          <h2 className="text-xl font-semibold text-gray-900 tracking-tight">Meeting History</h2>
          <p className="text-sm text-gray-500 font-medium">Chronological record of all syncs and reviews.</p>
        </div>
        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all"
        >
          <Plus className="w-4 h-4" />
          Log Meeting
        </button>
      </div>

      <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-indigo-100 before:via-gray-100 before:to-transparent">
        {meetings?.map((meeting: any) => (
          <div key={meeting.id} className="relative flex items-start gap-8 animate-in slide-in-from-left duration-500">
            <div className="relative flex items-center justify-center p-2 bg-white border-2 border-indigo-100 rounded-full z-10 shadow-sm mt-1">
              <Calendar className="w-5 h-5 text-indigo-600" />
            </div>

            <div className="flex-1 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:border-indigo-100 transition-all">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 tracking-tight">{meeting.title}</h4>
                  <div className="flex items-center gap-4 mt-1 text-[10px] font-semibold uppercase tracking-widest text-gray-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(meeting.meetingDate).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      Logged by {meeting.createdBy?.name || 'Admin'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-sm text-gray-600 font-medium leading-relaxed bg-gray-50 p-4 rounded-xl border border-gray-100/50">
                {meeting.notes}
              </div>
            </div>
          </div>
        ))}

        {meetings?.length === 0 && (
          <div className="pl-16 py-12">
            <p className="text-gray-400 font-medium italic">No meetings logged yet.</p>
          </div>
        )}
      </div>

      {/* Log Meeting Modal */}
      {isAdding && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-3xl p-8 shadow-2xl">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-semibold text-gray-900 tracking-tight">Log Meeting Sync</h3>
              <button
                onClick={() => setIsAdding(false)}
                className="p-2 text-gray-400 hover:text-gray-900 rounded-lg"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); mutation.mutate(formData); }} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Meeting Title</label>
                <input
                  type="text"
                  placeholder="e.g. Weekly Strategy Review"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium"
                  value={formData.title}
                  onChange={(e) => setFormData(p => ({ ...p, title: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Date of Meeting</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="date"
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium"
                    value={formData.meetingDate}
                    onChange={(e) => setFormData(p => ({ ...p, meetingDate: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Detailed Notes</label>
                <textarea
                  placeholder="Summarize the key takeaways and action items..."
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm min-h-[150px] focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium"
                  value={formData.notes}
                  onChange={(e) => setFormData(p => ({ ...p, notes: e.target.value }))}
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
                  {mutation.isPending ? 'Logging...' : 'Save Sync Log'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
