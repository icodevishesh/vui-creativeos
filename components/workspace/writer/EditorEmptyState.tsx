"use client";

import React from 'react';
import { FileText } from 'lucide-react';

export const EditorEmptyState: React.FC = () => {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-20 flex flex-col items-center justify-center text-center shadow-sm">
      <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-6">
        <FileText size={32} className="text-gray-300" />
      </div>
      <p className="text-lg font-medium text-gray-500">
        Select a task from the "My Tasks" tab to start writing.
      </p>
    </div>
  );
};
