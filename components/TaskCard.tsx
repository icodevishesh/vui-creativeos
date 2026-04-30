import React from 'react';
import { TaskStatus } from '@prisma/client';
import { format } from 'date-fns';
import { Calendar, User, Briefcase, Building2, Tag } from 'lucide-react';

interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  startDate: Date | null;
  endDate: Date | null;
  clientId: string;
  projectId: string;
  assignedTo?: {
    id: string;
    name: string;
  } | null;
  project: {
    name: string;
  };
  client: {
    companyName: string;
  };
}

interface TaskCardProps {
  task: Task;
}

const STATUS_CONFIG = {
  [TaskStatus.OPEN]: {
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-700',
    borderColor: 'border-gray-300',
    label: 'Open'
  },
  [TaskStatus.OPENED]: {
    bgColor: 'bg-teal-50',
    textColor: 'text-teal-700',
    borderColor: 'border-teal-200',
    label: 'Opened'
  },
  [TaskStatus.IN_PROGRESS]: {
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-700',
    borderColor: 'border-blue-200',
    label: 'In Progress'
  },
  [TaskStatus.INTERNAL_REVIEW]: {
    bgColor: 'bg-purple-50',
    textColor: 'text-purple-700',
    borderColor: 'border-purple-200',
    label: 'Review'
  },
  [TaskStatus.CLIENT_REVIEW]: {
    bgColor: 'bg-amber-50',
    textColor: 'text-amber-700',
    borderColor: 'border-amber-200',
    label: 'Client Review'
  },
  [TaskStatus.APPROVED]: {
    bgColor: 'bg-green-50',
    textColor: 'text-green-700',
    borderColor: 'border-green-200',
    label: 'Approved'
  },
  [TaskStatus.REJECTED]: {
    bgColor: 'bg-red-50',
    textColor: 'text-red-700',
    borderColor: 'border-red-200',
    label: 'Rejected'
  }
};

export const TaskCard: React.FC<TaskCardProps> = ({ task }) => {
  const statusConfig = STATUS_CONFIG[task.status];

  return (
    <div className="relative group">
      <div className={`border ${statusConfig.borderColor} ${statusConfig.bgColor} rounded p-2 shadow-sm hover:shadow-md transition-shadow cursor-pointer`}>
        {/* Assignee Name */}
        <div className="text-xs font-medium text-gray-600 mb-1">
          {task.assignedTo?.name || 'Unassigned'}
        </div>

        {/* Task Name */}
        <div className="text-xs font-semibold text-gray-900 mb-1 leading-tight">
          {task.title}
        </div>

        {/* Date Range */}
        {task.endDate && (
          <div className="flex items-center gap-1 text-xs text-red-500/80 mb-1">
            <span>Due date: {format(task.endDate, 'MMM d')}</span>
          </div>
        )}

        {/* Status Badge */}
        <div className={`inline-flex bg-black/10 rounded-lg items-center px-2 py-0.5 text-xs font-medium ${statusConfig.textColor}`}>
          {statusConfig.label}
        </div>
      </div>

      {/* Hover Tooltip */}
      <div className="pointer-events-none absolute z-50 bottom-full left-0 mb-2 w-56 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
        <div className="bg-gray-900 text-white rounded-lg shadow-xl p-3 text-xs space-y-2">
          <p className="font-semibold text-sm leading-tight">{task.title}</p>
          <div className="border-t border-white/10 pt-2 space-y-1.5">
            <div className="flex items-center gap-2">
              <Tag className="w-3 h-3 shrink-0 text-gray-400" />
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${statusConfig.bgColor} ${statusConfig.textColor}`}>
                {statusConfig.label}
              </span>
            </div>
            {(task.startDate || task.endDate) && (
              <div className="flex items-center gap-2 text-gray-300">
                <Calendar className="w-3 h-3 shrink-0 text-gray-400" />
                <span>
                  {task.startDate ? format(new Date(task.startDate), 'MMM d') : '—'}
                  {' → '}
                  {task.endDate ? format(new Date(task.endDate), 'MMM d') : '—'}
                </span>
              </div>
            )}
            <div className="flex items-center gap-2 text-gray-300">
              <User className="w-3 h-3 shrink-0 text-gray-400" />
              <span>{task.assignedTo?.name ?? 'Unassigned'}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-300">
              <Briefcase className="w-3 h-3 shrink-0 text-gray-400" />
              <span className="truncate">{task.project.name}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-300">
              <Building2 className="w-3 h-3 shrink-0 text-gray-400" />
              <span className="truncate">{task.client.companyName}</span>
            </div>
          </div>
        </div>
        {/* Arrow */}
        <div className="w-2.5 h-2.5 bg-gray-900 rotate-45 ml-3 -mt-1.5" />
      </div>
    </div>
  );
};
