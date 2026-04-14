"use client";

import React, { useMemo } from 'react';
import { FileText, Clock, Eye } from 'lucide-react';

interface Task {
  id: string;
  status: string;
}

interface StatsProps {
  tasks: Task[];
  isLoading: boolean;
}

const StatCard = ({ 
  label, 
  value, 
  icon: Icon, 
  colorClass, 
  bgColorClass, 
  iconColorClass,
  isLoading 
}: { 
  label: string; 
  value: number; 
  icon: any; 
  colorClass: string; 
  bgColorClass: string; 
  iconColorClass: string;
  isLoading: boolean;
}) => {
  if (isLoading) {
    return (
      <div className="flex-1 min-w-[200px] bg-white border border-gray-100 rounded-2xl p-6 animate-pulse">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gray-100"></div>
          <div className="space-y-2">
            <div className="h-6 w-8 bg-gray-100 rounded"></div>
            <div className="h-4 w-20 bg-gray-100 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 min-w-[200px] bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-xl ${bgColorClass} flex items-center justify-center`}>
          <Icon className={`w-6 h-6 ${iconColorClass}`} />
        </div>
        <div>
          <div className="text-2xl font-bold text-gray-900">{value}</div>
          <div className="text-sm font-medium text-gray-500">{label}</div>
        </div>
      </div>
    </div>
  );
};

export const Stats: React.FC<StatsProps> = ({ tasks, isLoading }) => {
  const stats = useMemo(() => {
    return {
      openTasks: tasks.filter(t => t.status === 'OPEN').length,
      inDraft: tasks.filter(t => t.status === 'IN_PROGRESS').length,
      underReview: tasks.filter(t => t.status === 'INTERNAL_REVIEW' || t.status === 'CLIENT_REVIEW').length,
    };
  }, [tasks]);

  return (
    <div className="flex flex-wrap gap-4 mb-8">
      <StatCard
        label="Open Tasks"
        value={stats.openTasks}
        icon={FileText}
        colorClass="text-indigo-600"
        bgColorClass="bg-indigo-50"
        iconColorClass="text-indigo-500"
        isLoading={isLoading}
      />
      <StatCard
        label="In Draft"
        value={stats.inDraft}
        icon={Clock}
        colorClass="text-amber-600"
        bgColorClass="bg-amber-50"
        iconColorClass="text-amber-500"
        isLoading={isLoading}
      />
      <StatCard
        label="Under Review"
        value={stats.underReview}
        icon={Eye}
        colorClass="text-emerald-600"
        bgColorClass="bg-emerald-50"
        iconColorClass="text-emerald-500"
        isLoading={isLoading}
      />
    </div>
  );
};
