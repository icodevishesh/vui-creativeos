"use client";

import React, { useState, useMemo, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { DesignerStats } from '@/components/workspace/designer/DesignerStats';
import { DesignerTabNavigation } from '@/components/workspace/designer/DesignerTabNavigation';
import { DesignerTaskList } from '@/components/workspace/designer/DesignerTaskList';
import { UploadAndSubmitTab } from '@/components/workspace/designer/UploadAndSubmitTab';
import { DesignerVersionHistory } from '@/components/workspace/designer/DesignerVersionHistory';

const fetchDesignerTasks = async () => {
  const res = await fetch('/api/workspace/designer');
  if (!res.ok) throw new Error('Network response was not ok');
  return res.json();
};

export default function DesignerWorkspacePage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('tasks');
  const [selectedTask, setSelectedTask] = useState<any>(null);

  const { data: tasks, isLoading, error } = useQuery({
    queryKey: ['designer-tasks'],
    queryFn: fetchDesignerTasks,
  });

  const handleUploadDesign = useCallback((task: any) => {
    setSelectedTask(task);
    setActiveTab('upload');
    // Set status to IN_PROGRESS if it's currently OPEN
    if (task.status === 'OPEN') {
      fetch(`/api/tasks/${task.id}/designer-content`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'IN_PROGRESS' }),
      }).then(() => {
        queryClient.invalidateQueries({ queryKey: ['designer-tasks'] });
      });
    }
  }, [queryClient]);

  const handleRefresh = useCallback(() => {
    setActiveTab('tasks');
    queryClient.invalidateQueries({ queryKey: ['designer-tasks'] });
  }, [queryClient]);

  const renderTabContent = useMemo(() => {
    switch (activeTab) {
      case 'tasks':
        return (
          <DesignerTaskList
            tasks={tasks || []}
            isLoading={isLoading}
            onUploadDesign={handleUploadDesign}
          />
        );
      case 'upload':
        return (
          <UploadAndSubmitTab
            task={selectedTask}
            onSuccess={handleRefresh}
          />
        );
      case 'version':
        return <DesignerVersionHistory tasks={tasks || []} isLoading={isLoading} />;
      default:
        return null;
    }
  }, [activeTab, tasks, isLoading, handleUploadDesign, handleRefresh, selectedTask]);

  return (
    <main className="min-h-screen">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900 mb-1">
            Designer's Workspace
          </h1>
          <p className="text-gray-400 text-sm">
            Manage your design tasks, upload assets, and track revisions
          </p>
        </header>

        {/* Stats */}
        <DesignerStats tasks={tasks || []} isLoading={isLoading} />

        {/* Tab Navigation */}
        <DesignerTabNavigation activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* Dynamic Content */}
        <div className="min-h-[500px]">
          {error ? (
            <div className="bg-red-50 border border-red-100 p-4 rounded-lg text-red-600 font-bold">
              Error fetching tasks. Please try refreshing.
            </div>
          ) : (
            renderTabContent
          )}
        </div>
      </div>
    </main>
  );
}
