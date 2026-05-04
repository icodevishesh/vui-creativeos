"use client";

import React, { useState } from 'react';
import {
  ChevronRight,
  Briefcase,
  FileText,
  Camera,
  Mail,
  Building2,
  Clock,
  ChevronDown,
  Upload,
  File,
  Link
} from 'lucide-react';
import { format } from 'date-fns';

interface Task {
  id: string;
  title: string;
  status: string;
  description?: string;
  endDate?: string | Date;
  client?: {
    companyName: string;
  };
  attachments?: any[];
  calendarCopy?: {
    id: string;
    content: string;
    caption?: string;
    platform?: string;
    mediaType?: string;
    publishDate?: string;
    publishTime?: string;
    referenceUrl?: string;
    status: string;
    bucket?: { id: string; name: string } | null;
  } | null;
}

interface DesignerTaskListProps {
  tasks: Task[];
  isLoading: boolean;
  onTaskClick?: (task: Task) => void;
  onUploadDesign?: (task: Task) => void;
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
      return { label: 'In Progress', classes: 'bg-blue-100 text-blue-600' };
    case 'INTERNAL_REVIEW':
      return { label: 'Internal Review', classes: 'bg-amber-100 text-amber-600' };
    case 'CLIENT_REVIEW':
      return { label: 'Internal Review', classes: 'bg-amber-100 text-amber-600' };
    case 'APPROVED':
      return { label: 'Approved', classes: 'bg-emerald-100 text-emerald-600' };
    default:
      return { label: status, classes: 'bg-gray-100 text-gray-600' };
  }
};

const SkeletonRow = () => (
  <div className="flex items-center gap-4 bg-white border border-gray-100 rounded-lg p-4 animate-pulse">
    <div className="w-10 h-10 rounded-xl bg-gray-50"></div>
    <div className="flex-1 space-y-2">
      <div className="h-5 bg-gray-50 rounded w-1/3"></div>
      <div className="flex gap-4">
        <div className="h-4 bg-gray-50 rounded w-20"></div>
        <div className="h-4 bg-gray-50 rounded w-20"></div>
      </div>
    </div>
    <div className="w-8 h-8 rounded-lg bg-gray-50"></div>
  </div>
);

export const DesignerTaskList: React.FC<DesignerTaskListProps> = ({
  tasks,
  isLoading,
  onTaskClick,
  onUploadDesign
}) => {
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <SkeletonRow key={i} />
        ))}
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="bg-white border border-dashed border-gray-200 rounded-lg p-12 text-center">
        <div className="mx-auto w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-4">
          <Upload className="text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900">No design tasks</h3>
        <p className="text-gray-500">You're all caught up! New briefs will appear here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {tasks.filter(t => t.status !== 'APPROVED').map((task) => {
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
                  <h4 className="font-bold text-gray-900">{task.title}</h4>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${status.classes}`}>
                    {status.label}
                  </span>
                </div>

                <div className="flex items-center gap-4 text-xs text-gray-500 font-medium">
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
                <div className="pt-4 border-t border-gray-100 flex flex-col gap-6">
                  <div>
                    <h5 className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-2">Design Brief</h5>
                    <p className="text-sm text-gray-700 leading-relaxed font-medium">
                      {task.description || "No specific design requirements provided."}
                    </p>
                  </div>

                  {/* Copy Context */}
                  {task.calendarCopy && (
                    <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-4 space-y-2">
                      <h5 className="text-[10px] font-semibold text-indigo-400 uppercase tracking-wide">Copy Reference</h5>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {task.calendarCopy.platform && (
                          <span className="text-[10px] font-bold bg-white border border-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full">{task.calendarCopy.platform}</span>
                        )}
                        {task.calendarCopy.mediaType && (
                          <span className="text-[10px] font-bold bg-white border border-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full">{task.calendarCopy.mediaType}</span>
                        )}
                        {task.calendarCopy.bucket && (
                          <span className="text-[10px] font-bold bg-white border border-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full">{task.calendarCopy.bucket.name}</span>
                        )}
                        {task.calendarCopy.publishDate && (
                          <span className="text-[10px] font-bold bg-white border border-indigo-100 text-gray-500 px-2 py-0.5 rounded-full">
                            Publish: {new Date(task.calendarCopy.publishDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            {task.calendarCopy.publishTime && ` at ${task.calendarCopy.publishTime}`}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-indigo-800 leading-relaxed line-clamp-3">{task.calendarCopy.content}</p>
                      {task.calendarCopy.caption && (
                        <p className="text-[11px] text-indigo-600 italic line-clamp-2">{task.calendarCopy.caption}</p>
                      )}
                      <span className="text-[11px] font-semibold text-indigo-600 mr-1">Reference URL:</span>
                      {task.calendarCopy.referenceUrl && (
                        <a
                          href={task.calendarCopy.referenceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-500 hover:text-indigo-700 hover:underline break-all"
                        >
                          <Link size={11} className="shrink-0" /> {task.calendarCopy.referenceUrl}
                        </a>
                      )}
                    </div>
                  )}

                  {/* Assets Section */}
                  <div>
                    <h5 className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-2">Assets Provided</h5>
                    <div className="flex flex-wrap gap-2">
                      {task.attachments && task.attachments.length > 0 ? (
                        task.attachments.map((asset: any, idx: number) => (
                          <div key={idx} className="flex items-center gap-2 bg-gray-100 px-3 py-1.5 rounded-lg text-xs font-bold text-gray-600 border border-gray-200">
                            <File size={14} />
                            {asset.fileName}
                          </div>
                        ))
                      ) : (
                        <div className="text-xs text-gray-400 italic">No assets attached to this task.</div>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => onUploadDesign?.(task)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-bold flex items-center gap-2 transition-all shadow-md shadow-blue-100 active:scale-95 w-fit"
                  >
                    <Upload size={18} />
                    Upload Design
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
