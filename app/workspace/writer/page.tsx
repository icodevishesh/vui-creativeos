"use client";

import React, { useState, useMemo, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Stats } from '@/components/workspace/writer/Stats';
import { TabNavigation } from '@/components/workspace/writer/TabNavigation';
import { TaskList } from '@/components/workspace/writer/TaskList';
import { EditorEmptyState } from '@/components/workspace/writer/EditorEmptyState';
import { VersionHistory } from '@/components/workspace/writer/VersionHistory';
import { WritingModal } from '@/components/workspace/writer/WritingModal';

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
  const [selectedSubTaskId, setSelectedSubTaskId] = useState<string | undefined>(undefined);
  const [draftContent, setDraftContent] = useState("");

  const { data: tasks, isLoading, error } = useQuery({
    queryKey: ['writer-tasks'],
    queryFn: fetchWriterTasks,
  });

  const handleStartWriting = useCallback(async (task: any, subtaskId?: string) => {
    setSelectedTask(task);
    setSelectedSubTaskId(subtaskId);
    try {
      const res = await fetch(`/api/tasks/${task.id}/content`);
      const data = await res.json();
      setDraftContent(data.content || "");
      setIsWritingModalOpen(true);
    } catch (error) {
      console.error("Error fetching draft:", error);
      setDraftContent("");
      setIsWritingModalOpen(true);
    }
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
            onStartWriting={(task, subtaskId) => handleStartWriting(task, subtaskId)}
          />
        );
      case 'write': {
        const inProgressTasks = (tasks || []).filter((t: any) =>
          t.status === 'IN_PROGRESS' || (t.writerContent && t.writerContent.content)
        );

        if (inProgressTasks.length === 0) return <EditorEmptyState />;

        return (
          <TaskList
            tasks={inProgressTasks}
            isLoading={isLoading}
            onStartWriting={(task, subtaskId) => handleStartWriting(task, subtaskId)}
          />
        );
      }
      case 'version':
        return <VersionHistory tasks={tasks || []} isLoading={isLoading} />;
      default:
        return null;
    }
  }, [activeTab, tasks, isLoading, handleStartWriting]);

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
        <TabNavigation activeTab={activeTab} setActiveTab={setActiveTab} />

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

      {/* Shared Modals */}
      <WritingModal
        isOpen={isWritingModalOpen}
        onClose={() => setIsWritingModalOpen(false)}
        task={selectedTask}
        subtaskId={selectedSubTaskId}
        initialContent={draftContent}
        onSuccess={handleRefresh}
      />
    </main>
  );
}
