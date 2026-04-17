"use client";

import React, { useState, useMemo, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Stats } from '@/components/workspace/writer/Stats';
import { TabNavigation } from '@/components/workspace/writer/TabNavigation';
import { TaskList } from '@/components/workspace/writer/TaskList';
import { EditorEmptyState } from '@/components/workspace/writer/EditorEmptyState';
import { VersionHistory } from '@/components/workspace/writer/VersionHistory';
import { WritingModal } from '@/components/workspace/writer/WritingModal';
import { CalendarWorkspace } from '@/components/workspace/writer/CalendarWorkspace';

const fetchWriterTasks = async () => {
  const res = await fetch('/api/workspace/writer');
  if (!res.ok) throw new Error('Network response was not ok');
  return res.json();
};

export default function WriterWorkspacePage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('tasks');
  const [isWritingModalOpen, setIsWritingModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [initialClientId, setInitialClientId] = useState<string | undefined>(undefined);
  const [initialCalendarId, setInitialCalendarId] = useState<string | undefined>(undefined);
  const [activeTaskId, setActiveTaskId] = useState<string | undefined>(undefined);

  const { data: tasks, isLoading, error } = useQuery({
    queryKey: ['writer-tasks'],
    queryFn: fetchWriterTasks,
  });

  const handleCreateCalendar = useCallback((task: any) => {
    setSelectedTask(task);
    setInitialClientId(task.client?.id);
    setInitialCalendarId(task.calendar?.id);
    setActiveTaskId(task.id);
    setActiveTab('calendar');
  }, []);

  const handleRefresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['writer-tasks'] });
  }, [queryClient]);

  // Performance: Memoize view transition to avoid unmounting logic overhead
  const renderTabContent = useMemo(() => {
    switch (activeTab) {
      case 'tasks':
        return (
          <TaskList
            tasks={tasks || []}
            isLoading={isLoading}
            onCreateCalendar={(task) => handleCreateCalendar(task)}
          />
        );
      case 'calendar':
        return (
          <CalendarWorkspace
            initialClientId={initialClientId}
            initialCalendarId={initialCalendarId}
            taskId={activeTaskId}
            onBack={() => {
              setActiveTab('tasks');
              handleRefresh();
            }}
          />
        );
      default:
        return null;
    }
  }, [activeTab, tasks, isLoading, handleCreateCalendar, initialClientId, initialCalendarId, activeTaskId, handleRefresh]);

  return (
    <main className="min-h-screen">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-2xl font-semibold text-gray-900 mb-1">
            Writer's Workspace
          </h1>
          <p className="text-gray-400 text-sm">
            Your allocated tasks, briefs, and content pipeline
          </p>
        </header>

        {/* Top Stats Section */}
        <Stats tasks={tasks || []} isLoading={isLoading} />

        {/* Navigation Tabs */}
        <TabNavigation
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          calendarName={activeTab === 'calendar' ? 'TechFlow' : undefined}
        />

        {/* Dynamic Content Area */}
        <div className="min-h-[500px]">
          {error ? (
            <div className="bg-red-50 border border-red-100 p-4 rounded-lg text-red-600 font-medium">
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
