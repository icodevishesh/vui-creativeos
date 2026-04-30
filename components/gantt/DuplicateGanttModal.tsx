'use client';

import { useState, useMemo, useEffect } from 'react';
import { X, Copy, Loader2, ChevronDown } from 'lucide-react';
import type { GanttProject } from '@/lib/gantt/types';

interface DuplicateGanttModalProps {
  sourceProjectId: string;
  sourceProjectName: string;
  onClose: () => void;
  onSuccess: (targetProjectId: string) => void;
}

export function DuplicateGanttModal({
  sourceProjectId,
  sourceProjectName,
  onClose,
  onSuccess,
}: DuplicateGanttModalProps) {
  const [targetProjectId, setTargetProjectId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [allProjects, setAllProjects] = useState<GanttProject[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);

  // Fetch ALL projects (no client filter) so user can duplicate across any client
  useEffect(() => {
    setIsLoadingProjects(true);
    fetch('/api/gantt/projects')
      .then((r) => r.json())
      .then((data: GanttProject[]) => setAllProjects(data))
      .catch(() => setError('Failed to load projects'))
      .finally(() => setIsLoadingProjects(false));
  }, []);

  // Exclude the source project; group by client for readability
  const grouped = useMemo(() => {
    const others = allProjects.filter((p) => p.id !== sourceProjectId);
    return others.reduce<Record<string, GanttProject[]>>((acc, p) => {
      (acc[p.clientName] ??= []).push(p);
      return acc;
    }, {});
  }, [allProjects, sourceProjectId]);

  const totalOptions = useMemo(
    () => allProjects.filter((p) => p.id !== sourceProjectId).length,
    [allProjects, sourceProjectId]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetProjectId) return;
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/gantt/${sourceProjectId}/duplicate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetProjectId }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to duplicate');
      }

      onSuccess(targetProjectId);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Duplicate Gantt Chart</h2>
            <p className="text-sm text-gray-400 mt-0.5">Copy all tasks &amp; links from <span className="font-medium text-gray-600">{sourceProjectName}</span></p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
              {error}
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700">Copy into project</label>
            {isLoadingProjects ? (
              <div className="flex items-center gap-2 text-sm text-gray-400 h-10">
                <Loader2 className="w-4 h-4 animate-spin" /> Loading projects…
              </div>
            ) : totalOptions === 0 ? (
              <p className="text-sm text-gray-400 italic">No other projects available.</p>
            ) : (
              <div className="relative">
                <select
                  required
                  value={targetProjectId}
                  onChange={(e) => setTargetProjectId(e.target.value)}
                  className="w-full h-10 pl-3 pr-10 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:bg-white transition-all text-sm appearance-none"
                >
                  <option value="" disabled>Select target project…</option>
                  {Object.entries(grouped).map(([clientName, projs]) => (
                    <optgroup key={clientName} label={clientName}>
                      {projs.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-2.5 w-4 h-4 text-gray-400" />
              </div>
            )}
          </div>

          <p className="text-xs text-gray-400">
            All tasks and dependency links will be appended to the selected project. Existing tasks in the target project will not be removed.
          </p>

          <div className="flex items-center gap-3 pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-10 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !targetProjectId || totalOptions === 0}
              className="flex-1 h-10 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Copying…</>
              ) : (
                <><Copy className="w-4 h-4" /> Duplicate</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
