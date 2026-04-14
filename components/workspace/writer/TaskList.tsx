"use client";

import React, { useMemo } from 'react';
import {
  ChevronRight,
  Briefcase,
  FileText,
  Camera,
  Mail,
  Building2,
  Clock
} from 'lucide-react';
import { format } from 'date-fns';

interface Task {
  id: string;
  title: string;
  status: string;
  endDate?: string | Date;
  client?: {
    companyName: string;
  };
}

interface TaskListProps {
  tasks: Task[];
  isLoading: boolean;
  onTaskClick?: (task: Task) => void;
}

const getTaskIcon = (title: string) => {
  const t = title.toLowerCase();
  if (t.includes('linkedin')) return Briefcase;
  if (t.includes('blog')) return FileText;
  if (t.includes('ig') || t.includes('instagram')) return Camera;
  if (t.includes('email') || t.includes('newsletter')) return Mail;
  return FileText;
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'OPEN':
      return { label: 'Open Task', classes: 'bg-gray-100 text-gray-600' };
    case 'IN_PROGRESS':
      return { label: 'Draft', classes: 'bg-blue-100 text-blue-600' };
    case 'INTERNAL_REVIEW':
      return { label: 'Internal Review', classes: 'bg-amber-100 text-amber-600' };
    case 'CLIENT_REVIEW':
      return { label: 'Internal Review', classes: 'bg-amber-100 text-amber-600' }; // Matching mockup label
    case 'APPROVED':
      return { label: 'Approved', classes: 'bg-emerald-100 text-emerald-600' };
    default:
      return { label: status, classes: 'bg-gray-100 text-gray-600' };
  }
};

const SkeletonRow = () => (
  <div className="flex items-center gap-4 bg-white border border-gray-100 rounded-2xl p-4 animate-pulse">
    <div className="w-10 h-10 rounded-xl bg-gray-100"></div>
    <div className="flex-1 space-y-2">
      <div className="h-5 bg-gray-100 rounded w-1/3"></div>
      <div className="flex gap-4">
        <div className="h-4 bg-gray-100 rounded w-20"></div>
        <div className="h-4 bg-gray-100 rounded w-20"></div>
      </div>
    </div>
    <div className="w-8 h-8 rounded-lg bg-gray-50"></div>
  </div>
);

export const TaskList: React.FC<TaskListProps> = ({ tasks, isLoading, onTaskClick }) => {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <SkeletonRow key={i} />
        ))}
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="bg-white border border-dashed border-gray-200 rounded-2xl p-12 text-center">
        <div className="mx-auto w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-4">
          <FileText className="text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900">No tasks assigned</h3>
        <p className="text-gray-500">You're all caught up! Check back later for new briefs.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {tasks.map((task) => {
        const Icon = getTaskIcon(task.title);
        const status = getStatusBadge(task.status);

        return (
          <button
            key={task.id}
            onClick={() => onTaskClick?.(task)}
            className="w-full flex items-center gap-4 bg-white border border-gray-100 rounded-2xl p-4 shadow-sm hover:shadow-md hover:border-blue-100 transition-all group text-left"
          >
            <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center group-hover:bg-blue-50 transition-colors">
              <Icon className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors" />
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-semibold text-gray-900">{task.title}</h4>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${status.classes}`}>
                  {status.label}
                </span>
              </div>

              <div className="flex items-center gap-4 text-xs text-gray-500">
                <div className="flex items-center gap-1">
                  <Building2 size={14} />
                  {task.client?.companyName || 'No Client'}
                </div>
                {task.endDate && (
                  <div className="flex items-center gap-1">
                    <Clock size={14} />
                    Due {format(new Date(task.endDate), 'MMM d')}
                  </div>
                )}
              </div>
            </div>

            <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all text-gray-400">
              <ChevronRight size={18} />
            </div>
          </button>
        );
      })}
    </div>
  );
};
