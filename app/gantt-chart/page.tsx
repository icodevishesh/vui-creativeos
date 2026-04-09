'use client';

import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { IApi } from '@svar-ui/react-gantt';
import '@svar-ui/react-gantt/all.css';
import { Calendar, Download, Plus } from 'lucide-react';

import GanttChart from '@/components/GanttChart';
import { ProjectSelector } from '@/components/gantt/ProjectSelector';
import { CreateProjectModal } from '@/components/gantt/CreateProjectModal';
import { ganttKeys } from '@/lib/gantt/hooks';

export default function GanttPage() {
  const queryClient = useQueryClient();
  const [projectId, setProjectId] = useState<string | null>(null);
  const [ganttApi, setGanttApi] = useState<IApi | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Stable callback — avoids GanttChart re-mounting on every parent render
  const handleApiReady = useCallback((api: IApi) => {
    setGanttApi(api);
  }, []);

  const handleAddTask = useCallback(() => {
    if (!ganttApi || !projectId) return;
    ganttApi.exec('add-task', {
      task: {
        text: 'New Task',
        start: new Date(),
        duration: 5,
        progress: 0,
        type: 'task',
        projectId,
      },
    });
  }, [ganttApi, projectId]);

  const handleProjectCreated = useCallback((newId: string) => {
    // Invalidate project list to show the new one in the selector
    queryClient.invalidateQueries({ queryKey: ganttKeys.projects() });
    
    // Switch to the new project
    setProjectId(newId);
  }, [queryClient]);

  const handleExport = useCallback(() => {
    if (!projectId) return;
    alert('Exporting to CSV... (This would generate a downloadable file in a production environment)');
  }, [projectId]);

  return (
    <div className="flex flex-col h-full gap-4 max-w-[1600px] mx-auto w-full">
      {/* ── Header ────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 shrink-0">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight mb-1">Project Timeline</h1>
            <p className="text-sm text-gray-500 font-medium">Strategic planning and phase tracking</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleExport}
              disabled={!projectId}
              className="
                h-10 px-4 text-sm font-semibold text-gray-600 bg-white border border-gray-200
                rounded-xl hover:bg-gray-50 transition-all flex items-center gap-2
                disabled:opacity-30 disabled:cursor-not-allowed shadow-sm
              "
            >
              <Download className="w-4 h-4" />
              Export
            </button>

            <button
              onClick={() => setIsModalOpen(true)}
              className="
                h-10 px-4 text-sm font-semibold text-white bg-gray-900 rounded-xl
                hover:bg-gray-800 transition-all flex items-center gap-2
                shadow-md hover:shadow-lg active:scale-95
              "
            >
              <Plus className="w-4 h-4" />
              New Project
            </button>
          </div>
        </div>

        {/* ── Toolbar row ─────────────────────────────────────── */}
        <div className="flex items-center justify-between flex-wrap gap-4 p-4 bg-white border border-gray-100 rounded-2xl shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-100">
              <Calendar className="w-4 h-4 text-gray-500" />
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Active Workspace</span>
            </div>
            <ProjectSelector value={projectId} onChange={setProjectId} />
          </div>

          {/* Legend */}
          <div className="flex items-center gap-6 px-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-teal-500 shadow-sm" />
              <span className="text-xs font-semibold text-gray-600">Summary</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-blue-500 shadow-sm" />
              <span className="text-xs font-semibold text-gray-600">Task</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-pink-500 shadow-sm" />
              <span className="text-xs font-semibold text-gray-600">Milestone</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Gantt Chart ───────────────────────────────────────── */}
      <div className="flex-1 overflow-hidden mb-2">
        <GanttChart
          projectId={projectId}
          onApiReady={handleApiReady}
        />
      </div>

      <CreateProjectModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleProjectCreated}
      />
    </div>
  );
}