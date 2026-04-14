"use client";

import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Stats } from '@/components/workspace/writer/Stats';
import { TabNavigation } from '@/components/workspace/writer/TabNavigation';
import { TaskList } from '@/components/workspace/writer/TaskList';
import { EditorEmptyState } from '@/components/workspace/writer/EditorEmptyState';
import { ContentCalendar } from '@/components/workspace/writer/ContentCalendar';

// Dummy fetch function - in production this would use the actual API
const fetchWriterTasks = async () => {
  // We specify a mock assignedToId if we want to filter, 
  // or leave it empty to fetch all for the demonstration
  const res = await fetch('/api/tasks');
  if (!res.ok) throw new Error('Network response was not ok');
  return res.json();
};

export default function WriterWorkspacePage() {
  const [activeTab, setActiveTab] = useState('tasks');

  const { data: tasks, isLoading, error } = useQuery({
    queryKey: ['writer-tasks'],
    queryFn: fetchWriterTasks,
  });

  // Performance: Memoize view transition to avoid unmounting logic overhead
  const renderTabContent = useMemo(() => {
    switch (activeTab) {
      case 'tasks':
        return <TaskList tasks={tasks || []} isLoading={isLoading} />;
      case 'write':
        return <EditorEmptyState />;
      case 'calendar':
        return <ContentCalendar isLoading={isLoading} />;
      default:
        return null;
    }
  }, [activeTab, tasks, isLoading]);

  return (
    <main className="min-h-screen">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight mb-2">
            Writer's Workspace
          </h1>
          <p className="text-base text-gray-500">
            Your allocated tasks, briefs, and content pipeline
          </p>
        </header>

        {/* Top Stats Section */}
        <Stats tasks={tasks || []} isLoading={isLoading} />

        {/* Navigation Tabs */}
        <TabNavigation activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* Dynamic Content Area */}
        <div className="min-h-[500px]">
          {error ? (
            <div className="bg-red-50 border border-red-100 p-4 rounded-xl text-red-600 font-medium">
              Error loading tasks. Please try refreshing the page.
            </div>
          ) : (
            renderTabContent
          )}
        </div>
      </div>
    </main>
  );
}
