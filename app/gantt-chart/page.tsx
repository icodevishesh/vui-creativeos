'use client';

import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { IApi } from '@svar-ui/react-gantt';
import '@svar-ui/react-gantt/all.css';
import { Plus, ChevronDown, Building2, Copy } from 'lucide-react';
import { toast } from 'react-hot-toast';

import GanttChart from '@/components/GanttChart';
import { ProjectSelector } from '@/components/gantt/ProjectSelector';
import { CreateProjectModal } from '@/components/gantt/CreateProjectModal';
import { DuplicateGanttModal } from '@/components/gantt/DuplicateGanttModal';
import { ganttKeys, useGanttProjects, useGanttClients } from '@/lib/gantt/hooks';
import { useAuth } from '@/context/AuthContext';

const EDIT_ROLES = new Set(['ADMIN', 'TEAM_LEAD', 'ACCOUNT_MANAGER']);

export default function GanttPage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [projectId, setProjectId] = useState<string | null>(null);
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [ganttApi, setGanttApi] = useState<IApi | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDuplicateModalOpen, setIsDuplicateModalOpen] = useState(false);

  const canEdit =
    user?.userType === 'ADMIN_OWNER' ||
    (user?.roles ?? []).some((r: string) => EDIT_ROLES.has(r));

  // Client filter list — only needed for internal users
  const { data: clients } = useGanttClients();

  // Derive the selected project's createdAt for the Gantt date range
  const { data: projects } = useGanttProjects(selectedClientId || undefined);
  const selectedProject = projects?.find((p) => p.id === projectId);
  const projectCreatedAt = selectedProject?.createdAt ?? null;

  const handleApiReady = useCallback((api: IApi) => {
    setGanttApi(api);
  }, []);

  const handleClientChange = useCallback((clientId: string) => {
    setSelectedClientId(clientId);
    setProjectId(null); // reset project when client changes
  }, []);

  const handleProjectCreated = useCallback((newId: string) => {
    queryClient.invalidateQueries({ queryKey: ganttKeys.projects() });
    setProjectId(newId);
  }, [queryClient]);

  const handleDuplicateSuccess = useCallback((targetProjectId: string) => {
    queryClient.invalidateQueries({ queryKey: ganttKeys.tasks(targetProjectId) });
    queryClient.invalidateQueries({ queryKey: ganttKeys.links(targetProjectId) });
    toast.success('Gantt chart duplicated successfully!');
    setProjectId(targetProjectId);
  }, [queryClient]);

  return (
    <div className="flex flex-col h-full gap-4 max-w-1600px mx-auto w-full">
      {/* ── Header ────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 shrink-0">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 mb-1">Gantt Chart</h1>
            <p className="text-sm text-gray-400">Strategic planning and phase tracking</p>
          </div>

          {canEdit && (
            <div className="flex items-center gap-2">
              {projectId && (
                <button
                  onClick={() => setIsDuplicateModalOpen(true)}
                  className="
                    h-10 px-4 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-lg
                    hover:bg-gray-50 transition-all flex items-center gap-2
                    shadow-sm hover:shadow active:scale-95
                  "
                  title="Duplicate this Gantt chart to another project"
                >
                  <Copy className="w-4 h-4" />
                  Duplicate
                </button>
              )}
              <button
                onClick={() => setIsModalOpen(true)}
                className="
                  h-10 px-4 text-sm font-semibold text-white bg-gray-900 rounded-lg
                  hover:bg-gray-800 transition-all flex items-center gap-2
                  shadow-md hover:shadow-lg active:scale-95
                "
              >
                <Plus className="w-4 h-4" />
                New Project
              </button>
            </div>
          )}
        </div>

        {/* ── Toolbar row ─────────────────────────────────────── */}
        <div className="flex items-center justify-between flex-wrap gap-4 p-4 bg-white border border-gray-100 rounded-lg shadow-sm">
          <div className="flex items-center gap-3 flex-wrap">
            {/* Client filter dropdown */}
            <div className="relative flex items-center gap-2">
              <div className="relative">
                <Building2 className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <select
                  value={selectedClientId}
                  onChange={(e) => handleClientChange(e.target.value)}
                  className="
                    appearance-none h-9 pl-8 pr-8 rounded-lg border border-gray-300 bg-white
                    text-sm font-medium text-gray-700 leading-none
                    focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent
                    hover:border-gray-400 transition-colors cursor-pointer min-w-160px
                  "
                  aria-label="Filter by client"
                >
                  <option value="">All Clients</option>
                  {clients?.map((c) => (
                    <option key={c.id} value={c.id}>{c.companyName}</option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              </div>
            </div>

            <ProjectSelector
              value={projectId}
              onChange={setProjectId}
              clientId={selectedClientId || undefined}
            />
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
          projectCreatedAt={projectCreatedAt}
          onApiReady={handleApiReady}
          readOnly={!canEdit}
        />
      </div>

      {canEdit && (
        <>
          <CreateProjectModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onSuccess={handleProjectCreated}
          />
          {isDuplicateModalOpen && projectId && (
            <DuplicateGanttModal
              sourceProjectId={projectId}
              sourceProjectName={selectedProject?.name ?? 'this project'}
              onClose={() => setIsDuplicateModalOpen(false)}
              onSuccess={handleDuplicateSuccess}
            />
          )}
        </>
      )}
    </div>
  );
}
