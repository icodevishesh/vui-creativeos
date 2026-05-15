"use client";

import React from 'react';
import { History, MessageSquare, Clock, FileText, Eye } from 'lucide-react';

interface Task {
  id: string;
  title: string;
  status: string;
  description?: string;
  endDate?: string | Date | null;
  client?: { companyName: string } | null;
  attachments?: Array<{
    id: string;
    fileName: string;
    fileUrl: string;
    mimeType: string;
  }>;
  calendarCopy?: {
    id: string;
    content: string;
    caption?: string;
    platform?: string;
    platforms?: string[];
    mediaType?: string;
    publishDate?: string;
    publishTime?: string;
    referenceUrl?: string;
    status: string;
    bucket?: { id: string; name: string } | null;
  } | null;
  mediaUrls?: string[] | null;
  countSubTask: number;
  feedbacks: string[];
  updatedAt: string | Date;
}

interface DesignerVersionHistoryProps {
  tasks: Task[];
  isLoading: boolean;
  onTaskClick?: (task: Task) => void;
}

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'APPROVED':
      return { label: 'Approved', classes: 'bg-emerald-100 text-emerald-600 border-emerald-200' };
    case 'REJECTED':
      return { label: 'Rejected', classes: 'bg-rose-100 text-rose-600 border-rose-200' };
    case 'CLIENT_REVIEW':
      return { label: 'In Review', classes: 'bg-amber-100 text-amber-600 border-amber-200' };
    default:
      return { label: status.replace('_', ' '), classes: 'bg-gray-100 text-gray-600 border-gray-200' };
  }
};

export const DesignerVersionHistory: React.FC<DesignerVersionHistoryProps> = ({ tasks, isLoading, onTaskClick }) => {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <div key={i} className="h-32 bg-white border border-gray-100 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  // Show tasks that are either approved, rejected, or have undergone revisions
  const historyTasks = tasks.filter(t => 
    t.status === 'APPROVED' || 
    t.status === 'REJECTED' || 
    t.countSubTask > 0
  );

  if (historyTasks.length === 0) {
    return (
      <div className="bg-white border border-dashed border-gray-200 rounded-lg p-12 text-center">
        <div className="mx-auto w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-4">
          <History className="text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900">No work history yet</h3>
        <p className="text-gray-500">Approved designs, revisions, and feedback will appear here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {historyTasks.map((task) => {
        const status = getStatusBadge(task.status);
        return (
          <div
            key={task.id}
            className="bg-white border border-gray-100 rounded-lg overflow-hidden shadow-sm hover:border-blue-100 transition-colors"
          >
            <button
              type="button"
              onClick={() => onTaskClick?.(task)}
              className="w-full bg-gray-50/50 px-5 py-4 border-b border-gray-100 flex items-center justify-between text-left"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="bg-blue-600 rounded-lg flex items-center justify-center text-white px-2 py-0.5">
                  <span className="text-xs font-bold">v{task.countSubTask + 1}</span>
                </div>
                <h4 className="font-bold text-gray-900 truncate">{task.title}</h4>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${status.classes}`}>
                  {status.label}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest border border-gray-200 px-2 py-0.5 rounded-md">
                 <Clock size={12} />
                 {task.status === 'APPROVED' ? 'Approved' : 'Updated'} {new Date(task.updatedAt).toLocaleDateString()}
                </div>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold rounded-md border border-gray-200 text-gray-500">
                  <Eye size={12} />
                  Preview
                </span>
              </div>
            </button>

            <div className="p-5">
              {/* Feedback History */}
              {task.feedbacks.length > 0 && (
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-4">
                     <MessageSquare size={16} className="text-blue-500" />
                     <span className="text-sm font-bold text-gray-700">Revision History & Feedback</span>
                  </div>
                  
                  <div className="space-y-4 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-100">
                     {[...task.feedbacks].reverse().map((feedback, idx) => (
                       <div key={idx} className="relative pl-8 pb-2 last:pb-0">
                          <div className="absolute left-1.5 top-1.5 w-3 h-3 rounded-full bg-white border-2 border-blue-500 z-10" />
                          <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                             <p className="text-sm text-gray-600 leading-relaxed italic">
                                {feedback}
                             </p>
                          </div>
                       </div>
                     ))}
                  </div>
                </div>
              )}

              {/* Latest Designs */}
              {task.attachments && task.attachments.length > 0 && (
                <div>
                  <h5 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Latest Design Files</h5>
                  <div className="flex flex-wrap gap-2">
                    {task.attachments.map((file) => (
                      <a 
                        key={file.id}
                        href={file.fileUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 bg-white border border-gray-200 px-3 py-2 rounded-lg text-xs font-bold text-blue-600 hover:border-blue-300 transition-colors"
                      >
                        <FileText size={14} className="text-gray-400" />
                        <span className="max-w-[200px] truncate">{file.fileName}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {task.feedbacks.length === 0 && (!task.attachments || task.attachments.length === 0) && (
                <p className="text-sm text-gray-400 italic">No feedback or attachments recorded for this task.</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
