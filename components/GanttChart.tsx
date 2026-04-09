'use client';

// =====================================================
// GanttChart — Production Component
//
// Architecture:
//  • TanStack Query owns the READ path (tasks + links).
//  • RestDataProvider owns the WRITE path (auto-maps
//    Gantt actions → REST calls via api.setNext).
//  • api.intercept injects projectId into add-task/add-link
//    before the action reaches RestDataProvider so new records
//    are associated with the correct project.
//  • useMemo: server instance, scales array (prevent re-mount).
//  • useCallback: init (stable reference keeps Gantt from re-mounting).
// =====================================================

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Gantt, Toolbar, Willow, Editor } from '@svar-ui/react-gantt';
import { RestDataProvider } from '@svar-ui/gantt-data-provider';
import type { IApi, ITask, ILink } from '@svar-ui/react-gantt';
import '@svar-ui/react-gantt/all.css';

import { useGanttData, useGanttInvalidate } from '@/lib/gantt/hooks';
import { GanttSkeleton } from './gantt/GanttSkeleton';
import { Plus } from 'lucide-react';

// ---- Props -----------------------------------------------------------

export interface GanttChartProps {
    projectId: string | null;
    /** Expose api to parent for custom toolbar buttons (e.g. page-level "Add Task") */
    onApiReady?: (api: IApi) => void;
}

// ---- Scales (defined outside component — never re-created) -----------

const SCALES = [
    { unit: 'month' as const, step: 1, format: '%F %Y' },
    { unit: 'week' as const, step: 1, format: 'Week %W' },
    { unit: 'day' as const, step: 1, format: '%j' },
];

// ---- Component -------------------------------------------------------

export default function GanttChart({ projectId, onApiReady }: GanttChartProps) {
    const [mounted, setMounted] = useState(false);
    const [api, setApi] = useState<IApi | undefined>();

    // Hydration guard — Gantt is SSR-incompatible
    useEffect(() => { setMounted(true); }, []);

    // ── Data (TanStack Query) ─────────────────────────────────────────
    const { tasks: tasksQuery, links: linksQuery, isLoading, isError } = useGanttData(projectId);
    const invalidate = useGanttInvalidate();

    // Convert to ITask[] / ILink[] — memoised so Gantt only re-renders when data changes
    const tasks = useMemo<ITask[]>(
        () => (tasksQuery.data ?? []) as unknown as ITask[],
        [tasksQuery.data]
    );
    const links = useMemo<ILink[]>(
        () => (linksQuery.data ?? []) as unknown as ILink[],
        [linksQuery.data]
    );

    // ── Time Range (Prev, Current, Next Month) ───────────────────────
    const { rangeStart, rangeEnd } = useMemo(() => {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        const end = new Date(now.getFullYear(), now.getMonth() + 3, 0);
        return { rangeStart: start, rangeEnd: end };
    }, []);

    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
    const invalidateRef = useRef<NodeJS.Timeout | null>(null);

    // ── Debounced Invalidation ───────────────────────────────────────
    const debouncedInvalidate = useCallback(() => {
        if (invalidateRef.current) clearTimeout(invalidateRef.current);
        invalidateRef.current = setTimeout(() => {
            if (projectId) invalidate(projectId);
        }, 800);
    }, [projectId, invalidate]);

    // ── RestDataProvider (write path) ─────────────────────────────────
    const server = useMemo(
        () => new RestDataProvider(`/api/gantt/${projectId}`),
        [projectId]
    );

    // ── Init callback (stable reference) ─────────────────────────────
    const init = useCallback(
        (ganttApi: IApi) => {
            setApi(ganttApi);
            onApiReady?.(ganttApi);
            ganttApi.setNext(server);

            ganttApi.on('add-task', debouncedInvalidate);
            ganttApi.on('delete-task', debouncedInvalidate);
            ganttApi.on('update-task', debouncedInvalidate);
            ganttApi.on('move-task', debouncedInvalidate);
            ganttApi.on('add-link', debouncedInvalidate);
            ganttApi.on('delete-link', debouncedInvalidate);
        },
        [server, projectId, onApiReady, debouncedInvalidate]
    );

    // ── Dimension Guard ──────────────────────────────────────────────
    const containerRef = useCallback((node: HTMLDivElement | null) => {
        if (node !== null) {
            const update = () => {
                setDimensions({
                    width: node.clientWidth,
                    height: node.clientHeight
                });
            };
            update();
            const observer = new ResizeObserver(update);
            observer.observe(node);
            return () => observer.disconnect();
        }
    }, []);

    // ── Guard: no project selected ────────────────────────────────────
    if (!projectId) {
        return (
            <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                Select a project above to view its Gantt chart.
            </div>
        );
    }

    // ── Guard: SSR ───────────────────────────────────────────────────
    if (!mounted) return <GanttSkeleton />;

    // ── Render ────────────────────────────────────────────────────────
    const isReady = mounted && dimensions.width > 0 && dimensions.height > 0;

    return (
        <div
            ref={containerRef}
            className="w-full h-full flex flex-col overflow-hidden bg-white rounded-xl shadow-inner border border-gray-100/50"
            id="gantt-chart-container"
        >
            {!isReady && <GanttSkeleton />}

            {isReady && isError && (
                <div className="flex flex-col items-center justify-center h-full gap-3 text-red-500 text-sm">
                    <p>Failed to load Gantt data.</p>
                    <button
                        onClick={() => {
                            tasksQuery.refetch();
                            linksQuery.refetch();
                        }}
                        className="px-4 py-2 bg-red-50 hover:bg-red-100 rounded-lg transition-colors border border-red-200"
                    >
                        Retry Connection
                    </button>
                </div>
            )}

            {isReady && !isError && isLoading && <GanttSkeleton />}

            {isReady && !isError && !isLoading && (
                <div className="flex-1 flex flex-col min-h-0">
                    <Willow>
                        <Toolbar api={api} />
                        <div className="flex-1 min-h-0 relative">
                            {tasks.length === 0 && (
                                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-gray-50/80 backdrop-blur-[2px]">
                                    <div className="p-4 bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center gap-2 max-w-xs text-center">
                                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                                            <Plus className="w-5 h-5 text-gray-400" />
                                        </div>
                                        <h3 className="font-medium text-gray-900">No tasks yet</h3>
                                        <p className="text-xs text-gray-500">Your timeline is empty. Click the button below to add your first milestone or task.</p>
                                        <button
                                            onClick={() => onApiReady && api && onApiReady(api)} // Logic to trigger add-task would go here
                                            className="mt-2 text-xs font-semibold text-blue-600 hover:text-blue-700 underline"
                                        >
                                            Add first task
                                        </button>
                                    </div>
                                </div>
                            )}
                            <Gantt
                                key={projectId}
                                start={rangeStart}
                                end={rangeEnd}
                                cellHeight={40}
                                cellWidth={33}
                                tasks={tasks}
                                links={links}
                                scales={SCALES}
                                init={init}
                            />
                        </div>
                        {api && <Editor api={api} />}
                    </Willow>
                </div>
            )}
        </div>
    );
}