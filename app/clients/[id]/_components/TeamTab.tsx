'use client';

import * as React from 'react';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { UserPlus, Trash2, Mail, Shield, Plus, X, RefreshCw } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface TeamTabProps {
  clientId: string;
}

export function TeamTab({ clientId }: TeamTabProps) {
  const queryClient = useQueryClient();
  const [isAssigning, setIsAssigning] = useState(false);
  const [formData, setFormData] = useState({ userId: '', role: '' });

  // 1. Fetch Client Team
  const { data: team, isLoading: isLoadingTeam } = useQuery({
    queryKey: ['client-team', clientId],
    queryFn: () => fetch(`/api/clients/${clientId}/team`).then(res => res.json()),
  });

  // 2. Fetch All Organization Members (to choose from)
  const { data: orgMembers } = useQuery({
    queryKey: ['members'],
    queryFn: () => fetch('/api/members').then(res => res.json()),
  });

  // 3. Mutation: Assign Member
  const assignMutation = useMutation({
    mutationFn: async (data: any) => {
      const selectedMember = orgMembers?.find((m: any) => m.userId === data.userId);
      const res = await fetch(`/api/clients/${clientId}/team`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: data.userId,
          userRole: data.role,
          userName: selectedMember?.user?.name || 'Unknown',
        }),
      });
      if (!res.ok) {
        const err = await res.text();
        throw new Error(err || 'Failed to assign member');
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success('Team member assigned!');
      queryClient.invalidateQueries({ queryKey: ['client-team', clientId] });
      setIsAssigning(false);
      setFormData({ userId: '', role: '' });
    },
    onError: (err: any) => toast.error(err.message),
  });

  // 4. Mutation: Remove Member
  const removeMutation = useMutation({
    mutationFn: async (memberId: string) => {
      const res = await fetch(`/api/clients/${clientId}/team/${memberId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to remove member');
    },
    onSuccess: () => {
      toast.success('Member removed from team');
      queryClient.invalidateQueries({ queryKey: ['client-team', clientId] });
    },
  });

  if (isLoadingTeam) return (
    <div className="flex justify-center p-20">
      <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 tracking-tight">Assigned Team Members</h2>
          <p className="text-sm text-gray-500 font-medium">Internal staff currently allocated to this account.</p>
        </div>
        <button
          onClick={() => setIsAssigning(true)}
          className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all"
        >
          <UserPlus className="w-4 h-4" />
          Assign Member
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {team?.map((member: any) => (
          <div
            key={member.id}
            className="group flex items-center justify-between bg-white p-5 rounded-lg border border-gray-100 shadow-sm hover:border-indigo-100 transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600 font-bold text-lg">
                {member.userName.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">{member.userName}</h4>
                <div className="flex items-center gap-3 mt-1">
                  <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-widest bg-gray-100 text-gray-500 px-2.5 py-1 rounded-lg">
                    <Shield className="w-3 h-3" />
                    {member.userRole}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={() => removeMutation.mutate(member.id)}
              disabled={removeMutation.isPending}
              className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}

        {team?.length === 0 && (
          <div className="text-center py-16 border-2 border-dashed border-gray-100 rounded-3xl">
            <p className="text-gray-400 font-medium">No team members assigned yet.</p>
          </div>
        )}
      </div>

      {/* Assign Modal */}
      {isAssigning && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-3xl p-8 shadow-2xl">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-semibold text-gray-900 tracking-tight">Assign Team Member</h3>
              <button
                onClick={() => setIsAssigning(false)}
                className="p-2 text-gray-400 hover:text-gray-900 rounded-lg"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); assignMutation.mutate(formData); }} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Select Member</label>
                <select
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium"
                  value={formData.userId}
                  onChange={(e) => {
                    const newUserId = e.target.value;
                    const selectedMember = orgMembers?.find((m: any) => m.userId === newUserId);
                    // Keep the raw enum value (e.g. GRAPHIC_DESIGNER) so task-assignment lookups match
                    const autoRole = selectedMember?.role ?? formData.role;
                    setFormData(p => ({ ...p, userId: newUserId, role: autoRole }));
                  }}
                >
                  <option value="">Select a staff member...</option>
                  {orgMembers?.map((m: any) => (
                    <option key={m.userId} value={m.userId}>{m.user.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Role</label>
                <div className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-xl text-sm font-medium text-gray-500 select-none">
                  {formData.role
                    ? formData.role.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
                    : <span className="text-gray-400">Auto-filled from selected member's role</span>
                  }
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-6">
                <button
                  type="button"
                  onClick={() => setIsAssigning(false)}
                  className="px-6 py-3 text-sm font-bold text-gray-500 hover:text-gray-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={assignMutation.isPending}
                  className="px-10 py-3 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all disabled:opacity-70"
                >
                  {assignMutation.isPending ? 'Assigning...' : 'Complete Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
