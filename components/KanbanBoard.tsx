import React from 'react';
import { TaskStatus, TaskPriority } from '@prisma/client';
import { Clock, AlertCircle, CheckCircle2, Building2, User } from 'lucide-react';

interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  startDate?: string;
  endDate?: string;
  clientId: string;
  projectId: string;
  organizationId: string;
  mediaUrls?: string[];
  feedbacks: string[];
  countSubTask: number;
  project: { name: string };
  client: { companyName: string };
  assignedTo?: { id: string; name: string };
  _count?: any;
}

interface KanbanBoardProps {
  tasks: Task[];
  onTaskClick?: (task: Task) => void;
}

const PRIORITY_CONFIG = {
  [TaskPriority.LOW]: {
    label: 'Low',
    color: 'text-gray-600 bg-gray-100',
  },
  [TaskPriority.MEDIUM]: {
    label: 'Medium',
    color: 'text-yellow-600 bg-yellow-100',
  },
  [TaskPriority.HIGH]: {
    label: 'High',
    color: 'text-red-600 bg-red-100',
  },
  [TaskPriority.URGENT]: {
    label: 'Urgent',
    color: 'text-red-700 bg-red-200',
  },
};

const STATUS_CONFIG = {
  [TaskStatus.OPEN]: {
    label: 'Open Task',
    color: 'border-gray-200 bg-gray-50',
    headerColor: 'bg-gray-100 text-gray-700',
  },
  [TaskStatus.OPENED]: {
    label: 'Opened',
    color: 'border-teal-200 bg-teal-50',
    headerColor: 'bg-teal-100 text-teal-700',
  },
  [TaskStatus.IN_PROGRESS]: {
    label: 'In Progress',
    color: 'border-blue-200 bg-blue-50',
    headerColor: 'bg-blue-100 text-blue-700',
  },
  [TaskStatus.ON_HOLD]: {
    label: 'On Hold',
    color: 'border-orange-200 bg-orange-50',
    headerColor: 'bg-orange-100 text-orange-700',
  },
  [TaskStatus.INTERNAL_REVIEW]: {
    label: 'Internal Review',
    color: 'border-purple-200 bg-purple-50',
    headerColor: 'bg-purple-100 text-purple-700',
  },
  [TaskStatus.CLIENT_REVIEW]: {
    label: 'Client Review',
    color: 'border-amber-200 bg-amber-50',
    headerColor: 'bg-amber-100 text-amber-700',
  },
  [TaskStatus.APPROVED]: {
    label: 'Approved',
    color: 'border-green-200 bg-green-50',
    headerColor: 'bg-green-100 text-green-700',
  },
  [TaskStatus.REJECTED]: {
    label: 'Rejected',
    color: 'border-red-200 bg-red-50',
    headerColor: 'bg-red-100 text-red-700',
  },
};

const KanbanTaskCard: React.FC<{ task: Task; onClick?: () => void }> = ({ task, onClick }) => {
  const priorityConfig = PRIORITY_CONFIG[task.priority];

  return (
    <div
      className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer mb-2"
      onClick={onClick}
    >
      {/* Task Title */}
      <div className="font-medium text-sm text-gray-900 mb-2 leading-tight">
        {task.title}
      </div>

      {/* Client Name */}
      <div className="text-xs text-gray-600 mb-2">
        <Building2 className="inline mr-1 w-4 h-4" />
        {task.client.companyName}
      </div>

      {/* Bottom Row: Priority Badge */}
      <div className="flex items-center justify-between mb-2">
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${priorityConfig.color}`}>
          {priorityConfig.label}
        </span>
      </div>

      {/* Assignee */}
      <div className="flex items-center gap-1 text-xs text-gray-500">
        <User className="w-3 h-3 shrink-0 text-gray-400" />
        <span className="font-medium text-gray-400">Assigned to:</span>
        <span className="font-semibold text-gray-700 truncate">
          {task.assignedTo?.name ?? 'Unassigned'}
        </span>
      </div>
    </div>
  );
};

export const KanbanBoard: React.FC<KanbanBoardProps> = ({ tasks, onTaskClick }) => {
  // Group tasks by status
  const tasksByStatus = tasks.reduce((acc, task) => {
    if (!acc[task.status]) {
      acc[task.status] = [];
    }
    acc[task.status].push(task);
    return acc;
  }, {} as Record<TaskStatus, Task[]>);

  // Define the order of columns
  const statusOrder: TaskStatus[] = [
    TaskStatus.OPEN,
    TaskStatus.IN_PROGRESS,
    TaskStatus.INTERNAL_REVIEW,
    TaskStatus.CLIENT_REVIEW,
    TaskStatus.APPROVED,
  ];

  return (
    <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-6">
      <div className="flex gap-4 overflow-x-auto pb-4">
        {statusOrder.map((status) => {
          const statusConfig = STATUS_CONFIG[status];
          const statusTasks = tasksByStatus[status] || [];

          return (
            <div
              key={status}
              className={`flex-shrink-0 w-72 min-h-[400px] ${statusConfig.color} rounded-lg border ${statusConfig.color.includes('border-') ? statusConfig.color : 'border-gray-200'}`}
            >
              {/* Column Header */}
              <div className={`p-3 rounded-t-lg ${statusConfig.headerColor} font-medium text-xs`}>
                <div className="flex items-center justify-between">
                  <span>{statusConfig.label}</span>
                  <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs">
                    {statusTasks.length}
                  </span>
                </div>
              </div>

              {/* Tasks Container */}
              <div className="p-3 space-y-2 max-h-[400px] overflow-y-auto">
                {statusTasks.map((task) => (
                  <KanbanTaskCard
                    key={task.id}
                    task={task}
                    onClick={() => onTaskClick?.(task)}
                  />
                ))}

                {statusTasks.length === 0 && (
                  <div className="text-center text-gray-500 text-xs py-8">
                    No tasks in this column
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
