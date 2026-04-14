"use client";

import React, { useMemo } from 'react';
import { FileText, Clock, Eye } from 'lucide-react';

interface Task {
  id: string;
  status: string;
}

interface DesignerStatsProps {
  tasks: Task[];
  isLoading: boolean;
}

const StatCard = ({
  label,
  value,
  icon: Icon,
  bgColorClass,
  iconColorClass,
  isLoading
}: {
  label: string;
  value: number;
  icon: any;
  bgColorClass: string;
  iconColorClass: string;
  isLoading: boolean;
}) => {
  if (isLoading) {
    return (
      <div className="flex-1 min-w-[200px] bg-white border border-gray-100 rounded-lg p-6 animate-pulse">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gray-50"></div>
          <div className="space-y-2">
            <div className="h-6 w-8 bg-gray-50 rounded"></div>
            <div className="h-4 w-20 bg-gray-50 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 min-w-[200px] bg-white border border-gray-100 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center gap-4">
        <div className={`w-12 h-12 rounded-xl ${bgColorClass} flex items-center justify-center`}>
          <Icon className={`w-6 h-6 ${iconColorClass}`} />
        </div>
        <div>
          <div className="text-2xl font-bold text-gray-900">{value}</div>
          <div className="text-sm font-semibold text-gray-500">{label}</div>
        </div>
      </div>
    </div>
  );
};

export const DesignerStats: React.FC<DesignerStatsProps> = ({ tasks, isLoading }) => {
  const stats = useMemo(() => {
    return {
      openTasks: tasks.filter(t => t.status === 'OPEN').length,
      inProgress: tasks.filter(t => t.status === 'IN_PROGRESS').length,
      underReview: tasks.filter(t => t.status === 'INTERNAL_REVIEW' || t.status === 'CLIENT_REVIEW').length,
    };
  }, [tasks]);

  return (
    <div className="flex flex-wrap gap-4 mb-8">
      <StatCard
        label="Open Tasks"
        value={stats.openTasks}
        icon={FileText}
        bgColorClass="bg-blue-50"
        iconColorClass="text-blue-500"
        isLoading={isLoading}
      />
      <StatCard
        label="In Progress"
        value={stats.inProgress}
        icon={Clock}
        bgColorClass="bg-amber-50"
        iconColorClass="text-amber-500"
        isLoading={isLoading}
      />
      <StatCard
        label="Under Review"
        value={stats.underReview}
        icon={Eye}
        bgColorClass="bg-emerald-50"
        iconColorClass="text-emerald-500"
        isLoading={isLoading}
      />
    </div>
  );
};
