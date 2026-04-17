import React from 'react';
import { TaskStatus } from '@prisma/client';
import { format } from 'date-fns';

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
  );
};
