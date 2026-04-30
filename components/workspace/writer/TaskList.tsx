"use client";

import React, { useMemo, useState } from 'react';
import {
  ChevronRight,
  Briefcase,
  FileText,
  Camera,
  Mail,
  Building2,
  Clock,
  ChevronDown,
  CalendarPlus,
  Edit3,
  Send,
  Loader2
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';

interface RevisionSubTask {
  id: string;
  title: string;
  description?: string;
  status: string;
  feedbacks: string[];
}

interface Task {
  id: string;
  title: string;
  status: string;
  description?: string;
  endDate?: string | Date;
  client?: {
    id: string;
    companyName: string;
  };
  writerContent?: {
    content: string;
  };
  revisionSubTasks?: RevisionSubTask[];
  calendarId?: string | null;
  calendar?: {
    id: string;
    name: string;
    copyCount: number;
  } | null;
}

interface TaskListProps {
  tasks: Task[];
  isLoading: boolean;
  onTaskClick?: (task: Task) => void;
  onCreateCalendar?: (task: Task) => void;
  onRefresh?: () => void;
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
      return { label: 'Open', classes: 'bg-gray-100 text-gray-600' };
    case 'IN_PROGRESS':
      return { label: 'In Progress', classes: 'bg-blue-100 text-blue-600' };
    case 'ON_HOLD':
      return { label: 'On Hold', classes: 'bg-orange-100 text-orange-600' };
    case 'INTERNAL_REVIEW':
      return { label: 'Internal Review', classes: 'bg-amber-100 text-amber-600' };
    case 'CLIENT_REVIEW':
      return { label: 'Client Review', classes: 'bg-amber-100 text-amber-600' };
    case 'APPROVED':
      return { label: 'Approved', classes: 'bg-emerald-100 text-emerald-600' };
    case 'REJECTED':
      return { label: 'Rejected', classes: 'bg-red-100 text-red-600' };
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

export const TaskList: React.FC<TaskListProps> = ({
  tasks,
  isLoading,
  onTaskClick,
  onCreateCalendar,
  onRefresh,
}) => {
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const [submittingTaskId, setSubmittingTaskId] = useState<string | null>(null);

  const handleSubmitForReview = async (task: Task, e: React.MouseEvent) => {
    e.stopPropagation();
    setSubmittingTaskId(task.id);
    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'INTERNAL_REVIEW' }),
      });
      if (res.ok) {
        toast.success('Submitted for internal review');
        onRefresh?.();
      } else {
        toast.error('Failed to submit for review');
      }
    } catch {
      toast.error('Failed to submit for review');
    } finally {
      setSubmittingTaskId(null);
    }
  };

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
      <div className="bg-white border border-dashed border-gray-200 rounded-lg p-12 text-center">
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
        const isExpanded = expandedTaskId === task.id;

        return (
          <div
            key={task.id}
            className={`bg-white border transition-all overflow-hidden ${isExpanded ? 'border-blue-500 ring-1 ring-blue-500/10 rounded-lg shadow-lg shadow-blue-500/5' : 'border-gray-100 rounded-lg shadow-sm hover:shadow-md hover:border-blue-100'
              }`}
          >
            <button
              onClick={() => {
                setExpandedTaskId(isExpanded ? null : task.id);
                onTaskClick?.(task);
              }}
              className="w-full flex items-center gap-4 p-4 text-left"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold text-gray-900">{task.title}</h4>

                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${status.classes}`}>
                    {status.label}
                  </span>

                  {task.calendar && task.calendar.copyCount > 0 && (
                    <div className='flex items-center justify-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-600'>
                      <span>{task.calendar.copyCount}</span>
                      copies
                    </div>
                  )}

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

              <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${isExpanded ? 'bg-blue-50 text-blue-600' : 'bg-gray-50 text-gray-400'}`}>
                {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
              </div>
            </button>

            {/* Expanded Content */}
            {isExpanded && (
              <div className="px-4 pb-4 animate-in slide-in-from-top-2 duration-200">
                <div className="pt-2 border-t border-gray-50">
                  <div className="mb-4">
                    <div className='border-t border-gray-300 mb-2'></div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Client Brief</p>
                    <p className="text-sm text-gray-600 leading-relaxed font-medium">
                      {task.description || "No specific brief provided for this task."}
                    </p>
                  </div>

                  {/* Revision subtasks — shown for REJECTED or feedback tasks */}
                  {task.revisionSubTasks && task.revisionSubTasks.length > 0 && (
                    <div className="mb-4 space-y-2">
                      <p className="text-xs font-bold text-amber-600 uppercase tracking-widest">Revision Required</p>
                      {task.revisionSubTasks.map((sub) => (
                        <div key={sub.id} className="bg-amber-50 border border-amber-100 rounded-lg p-3">
                          <p className="text-xs font-semibold text-amber-800 mb-1">{sub.title}</p>
                          {sub.feedbacks.length > 0 && (
                            <p className="text-xs text-amber-700 mb-2 leading-relaxed">{sub.feedbacks[sub.feedbacks.length - 1]}</p>
                          )}
                          <div className="flex items-center gap-2 text-[10px] font-bold text-amber-600 uppercase">
                            <Clock size={12} /> Pending Revision
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Only show Start Writing for non-rejected tasks */}
                  {task.status !== 'REJECTED' && (
                    <div className="flex items-center gap-3 flex-wrap">
                      <button
                        onClick={() => onCreateCalendar?.(task)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg font-semibold flex items-center gap-2 transition-all shadow-md shadow-blue-100 active:scale-95"
                      >
                        <CalendarPlus size={16} />
                        <span className="text-sm">{(task.calendar || task.calendarId) ? 'Continue Calendar' : 'Create Calendar'}</span>
                      </button>

                      {/* Submit for Review — only visible when copies exist and task hasn't been submitted yet */}
                      {task.calendar && task.calendar.copyCount > 0 &&
                        task.status !== 'INTERNAL_REVIEW' &&
                        task.status !== 'CLIENT_REVIEW' &&
                        task.status !== 'APPROVED' && (
                          <button
                            onClick={(e) => handleSubmitForReview(task, e)}
                            disabled={submittingTaskId === task.id}
                            className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-all shadow-md shadow-emerald-100 active:scale-95"
                          >
                            {submittingTaskId === task.id
                              ? <Loader2 size={15} className="animate-spin" />
                              : <Send size={15} />
                            }
                            Submit for Review
                          </button>
                        )
                      }
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
