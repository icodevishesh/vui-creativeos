"use client";

import React from 'react';
import { History, MessageSquare, Clock, Hash } from 'lucide-react';

interface Task {
  id: string;
  title: string;
  status: string;
  countSubTask: number;
  feedbacks: string[];
  updatedAt: string | Date;
}

interface VersionHistoryProps {
  tasks: Task[];
  isLoading: boolean;
}

export const VersionHistory: React.FC<VersionHistoryProps> = ({ tasks, isLoading }) => {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 bg-white border border-gray-100 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  // Filter for tasks that have actually been versioned (v2 or higher)
  const versionedTasks = tasks.filter(t => t.countSubTask > 0);

  if (versionedTasks.length === 0) {
    return (
      <div className="bg-white border border-dashed border-gray-200 rounded-lg p-12 text-center">
        <div className="mx-auto w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-4">
          <History className="text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900">No Version History</h3>
        <p className="text-gray-500">Tasks with revisions and feedback will appear here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {versionedTasks.map((task) => (
        <div key={task.id} className="bg-white border border-gray-100 rounded-lg overflow-hidden shadow-sm">
          {/* Header */}
          <div className="bg-gray-50/50 px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white px-2">
                <span className="text-xs font-bold whitespace-nowrap">v{task.countSubTask + 1}</span>
              </div>
              <h4 className="font-bold text-gray-900">{task.title}</h4>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest border border-gray-200 px-2 py-0.5 rounded-md">
              <Clock size={12} />
              Last Revised {new Date(task.updatedAt).toLocaleDateString()}
            </div>
          </div>

          {/* Feedback Timeline */}
          <div className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <MessageSquare size={16} className="text-blue-500" />
              <span className="text-sm font-bold text-gray-700">Revision History & Feedback</span>
            </div>

            <div className="space-y-4 relative before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-100">
              {task.feedbacks.length > 0 ? (
                task.feedbacks.map((feedback, idx) => (
                  <div key={idx} className="relative pl-8 pb-2 last:pb-0">
                    <div className="absolute left-1.5 top-1.5 w-3 h-3 rounded-full bg-white border-2 border-blue-500 z-10" />
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 group hover:border-blue-100 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold text-blue-600 uppercase tracking-tighter bg-blue-50 px-2 py-0.5 rounded">
                          Feedback Layer {task.feedbacks.length - idx}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 leading-relaxed italic">
                        "{feedback}"
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="pl-8 text-sm text-gray-400 italic py-2">
                  No individual feedback entries recorded for these versions.
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};