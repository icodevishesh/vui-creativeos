'use client';

import * as React from 'react';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { UserPlus, Mail, Shield, Copy, CheckCircle2, RefreshCw } from 'lucide-react';
import { toast } from 'react-hot-toast';

export function AddMemberForm() {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    roleId: '', // Can be an enum value or a custom role ID
  });
  const [generatedPass, setGeneratedPass] = useState<string | null>(null);

  // Fetch roles (predefined + custom)
  const { data: rolesData, isLoading: isLoadingRoles } = useQuery({
    queryKey: ['roles'],
    queryFn: async () => {
      const res = await fetch('/api/roles');
      if (!res.ok) throw new Error('Failed to fetch roles');
      return res.json();
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      // Determine if it's a predefined role or custom role
      const isCustom = rolesData?.custom?.some((r: any) => r.id === data.roleId);

      const payload = {
        name: data.name,
        email: data.email,
        role: isCustom ? 'TEAM_LEAD' : data.roleId, // Fallback role if custom
        customRoleId: isCustom ? data.roleId : null,
      };

      const res = await fetch('/api/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.text();
        throw new Error(err || 'Failed to add member');
      }
      return res.json();
    },
    onSuccess: (data) => {
      toast.success('Member added successfully!');
      setGeneratedPass(data.password);
      queryClient.invalidateQueries({ queryKey: ['members'] });
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.roleId) {
      toast.error('Please fill all fields');
      return;
    }
    mutation.mutate(formData);
  };

  const copyPassword = () => {
    if (generatedPass) {
      navigator.clipboard.writeText(generatedPass);
      toast.success('Password copied to clipboard');
    }
  };

  const resetForm = () => {
    setFormData({ name: '', email: '', roleId: '' });
    setGeneratedPass(null);
  };

  if (generatedPass) {
    return (
      <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-8 text-center animate-in fade-in zoom-in duration-300">
        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
          <CheckCircle2 className="w-8 h-8 text-green-500" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Member Onboarded!</h3>
        <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto">
          User account created successfully. Please share this temporary password with
          <span className="font-bold text-gray-900"> {formData.name}</span>.
        </p>

        <div className="bg-white border border-indigo-200 rounded-xl p-4 flex items-center justify-between mb-8 max-w-md mx-auto shadow-sm">
          <code className="text-lg font-mono font-bold text-indigo-600">{generatedPass}</code>
          <button
            onClick={copyPassword}
            className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
          >
            <Copy className="w-5 h-5" />
          </button>
        </div>

        <button
          onClick={resetForm}
          className="text-sm font-bold text-indigo-600 hover:text-indigo-700 underline underline-offset-4"
        >
          Add another member
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white p-8 rounded-lg border border-gray-100 shadow-sm">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-sm font-normal text-gray-700 flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-indigo-500" />
            Full Name
          </label>
          <input
            type="text"
            placeholder="e.g. Sarah Jenkins"
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
            value={formData.name}
            onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-normal text-gray-700 flex items-center gap-2">
            <Mail className="w-4 h-4 text-indigo-500" />
            Email Address
          </label>
          <input
            type="email"
            placeholder="sarah@agency.com"
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
            value={formData.email}
            onChange={(e) => setFormData(p => ({ ...p, email: e.target.value }))}
          />
        </div>

        <div className="md:col-span-2 space-y-2">
          <label className="text-sm font-normal text-gray-700 flex items-center gap-2">
            <Shield className="w-4 h-4 text-indigo-500" />
            Select System Role
          </label>
          <select
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
            value={formData.roleId}
            onChange={(e) => setFormData(p => ({ ...p, roleId: e.target.value }))}
          >
            <option value="">Select a role...</option>
            <optgroup label="System Roles">
              {rolesData?.predefined?.map((role: string) => (
                <option key={role} value={role}>
                  {role.replace(/_/g, ' ')}
                </option>
              ))}
            </optgroup>
            {rolesData?.custom?.length > 0 && (
              <optgroup label="Custom Roles">
                {rolesData?.custom?.map((role: any) => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
              </optgroup>
            )}
          </select>
        </div>
      </div>

      <div className="pt-4 flex flex-col items-center">
        <button
          type="submit"
          disabled={mutation.isPending || isLoadingRoles}
          className="w-full sm:w-64 flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all disabled:opacity-70"
        >
          {mutation.isPending ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              Onboarding...
            </>
          ) : (
            'Generate & Onboard'
          )}
        </button>
      </div>
    </form>
  );
}
