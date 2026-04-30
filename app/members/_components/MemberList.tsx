'use client';

import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Mail, Shield, Calendar, UserCheck } from 'lucide-react';

export function MemberList() {
  const { data: members, isLoading, error } = useQuery({
    queryKey: ['members'],
    queryFn: async () => {
      const res = await fetch('/api/members');
      if (!res.ok) throw new Error('Failed to fetch members');
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-20 bg-gray-100 rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (error) return <div className="text-red-500 text-sm font-bold">Failed to load members.</div>;

  return (
    <div className="grid grid-cols-1 gap-4">
      {members?.map((member: any) => (
        <div key={member.id} className="bg-white border border-gray-100 rounded-2xl p-5 hover:border-indigo-100 transition-all flex items-center justify-between group">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 font-bold">
              {member.user?.name?.slice(0, 2).toUpperCase() || '??'}
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-900 group-hover:text-indigo-600 transition-colors">
                {member.user?.name || 'Unknown Member'}
              </h3>
              <div className="flex items-center gap-3 mt-1">
                <span className="flex items-center gap-1 text-xs text-gray-500 font-medium">
                  <Mail className="w-3 h-3" />
                  {member.user?.email || 'No Email'}
                </span>
                {(member.roles && member.roles.length > 0
                  ? member.roles.map((r: string) => (
                      <span key={r} className="flex items-center gap-1 text-[10px] font-medium text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-full uppercase tracking-wider">
                        <Shield className="w-3 h-3" />
                        {r.replace(/_/g, ' ')}
                      </span>
                    ))
                  : (
                    <span className="flex items-center gap-1 text-[10px] font-medium text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-full uppercase tracking-wider">
                      <Shield className="w-3 h-3" />
                      {member.customRole?.name || 'Member'}
                    </span>
                  )
                )}
              </div>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-4 text-xs font-medium text-gray-400">
            <div className="flex flex-col items-end">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Joined {new Date(member.joinedAt).toLocaleDateString()}
              </span>
              <span className="flex items-center gap-1 text-green-500 mt-0.5">
                <UserCheck className="w-3 h-3" />
                Active
              </span>
            </div>
          </div>
        </div>
      ))}

      {members?.length === 0 && (
        <div className="text-center py-12 border-2 border-dashed border-gray-100 rounded-2xl">
          <p className="text-gray-400 text-sm font-medium">No members found.</p>
        </div>
      )}
    </div>
  );
}
