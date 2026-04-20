'use client';

import { useQuery } from '@tanstack/react-query';
import { Building2, Mail, Phone, User, RefreshCw, Briefcase, Globe } from 'lucide-react';

export default function PortalProfilePage() {
  const { data: profile, isLoading } = useQuery({
    queryKey: ['portal-profile'],
    queryFn: async () => {
      const res = await fetch('/api/portal/profile');
      if (!res.ok) throw new Error('Failed to fetch profile');
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <RefreshCw className="w-6 h-6 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!profile) return null;

  const statusColors: Record<string, string> = {
    ACTIVE: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    PENDING: 'bg-amber-50 text-amber-600 border-amber-100',
    INACTIVE: 'bg-gray-100 text-gray-500 border-gray-200',
  };

  const fields = [
    { label: 'Company Name', value: profile.companyName, icon: Building2 },
    { label: 'Contact Person', value: profile.contactPerson, icon: User },
    { label: 'Email', value: profile.email, icon: Mail },
    { label: 'Phone', value: profile.phone, icon: Phone },
    { label: 'Industry', value: profile.industry, icon: Globe },
    { label: 'Engagement Type', value: profile.engagementType?.replace(/_/g, ' '), icon: Briefcase },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">My Profile</h1>
        <p className="text-sm text-gray-400 mt-1">Your company information on file with us</p>
      </div>

      {/* Profile header card */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-indigo-200">
            {profile.companyName?.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">{profile.companyName}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full border uppercase tracking-widest ${statusColors[profile.status] ?? statusColors.PENDING}`}>
                {profile.status}
              </span>
              <span className="text-xs text-gray-400">{profile.engagementType?.replace(/_/g, ' ')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Details */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-sm font-bold text-gray-900">Company Details</h3>
        </div>
        <div className="divide-y divide-gray-50">
          {fields.map(({ label, value, icon: Icon }) => (
            <div key={label} className="flex items-center gap-4 px-6 py-4">
              <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center shrink-0">
                <Icon className="w-4 h-4 text-gray-400" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{label}</p>
                <p className="text-sm font-medium text-gray-900 mt-0.5">{value || '—'}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Services */}
      {profile.services?.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
          <h3 className="text-sm font-bold text-gray-900 mb-4">Subscribed Services</h3>
          <div className="flex flex-wrap gap-2">
            {profile.services.map((s: any) => (
              <span key={s.id} className="px-3 py-1.5 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-full text-xs font-semibold">
                {s.service.replace(/_/g, ' ')}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Team members */}
      {profile.teamMembers?.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="text-sm font-bold text-gray-900">Your Account Team</h3>
          </div>
          <div className="divide-y divide-gray-50">
            {profile.teamMembers.map((member: any) => (
              <div key={member.id} className="flex items-center gap-3 px-6 py-3.5">
                <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0">
                  {member.userName?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{member.userName}</p>
                  <p className="text-xs text-gray-400">{member.userRole}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
