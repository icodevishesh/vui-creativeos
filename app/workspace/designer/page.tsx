"use client";

import React, { useState, useMemo, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { DesignerStats } from '@/components/workspace/designer/DesignerStats';
import { DesignerTabNavigation } from '@/components/workspace/designer/DesignerTabNavigation';
import { DesignerTaskList } from '@/components/workspace/designer/DesignerTaskList';
import { UploadAndSubmitTab } from '@/components/workspace/designer/UploadAndSubmitTab';
import { DesignerVersionHistory } from '@/components/workspace/designer/DesignerVersionHistory';

// In production this would filter by the current user's role/ID
const fetchDesignerTasks = async () => {
  const res = await fetch('/api/tasks');
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
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight mb-2">
            Designer's Workspace
          </h1>
          <p className="text-base text-gray-500 font-medium">
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
