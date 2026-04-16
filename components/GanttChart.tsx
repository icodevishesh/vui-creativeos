'use client';

// =====================================================
// GanttChart — Production Component
//
// Data strategy — frozen-per-project:
//  • TanStack Query loads data; we pass it to <Gantt> once per project.
//  • frozenProjectId ref tracks which project the ganttTasks/ganttLinks
//    belong to. On project switch → update. Same project refetch → skip.
//  • This prevents SVAR from reinitializing (which destroys open editors)
//    while still correctly loading a fresh dataset when the project changes.
//  • RestDataProvider owns all writes — no invalidation event listeners.
//
// Scroll strategy:
//  • SVAR Gantt's .wx-gantt { overflow-y: auto } needs a concrete px height.
//  • Willow breaks flex height inheritance.
//  • Callback refs measure outer container + toolbar, pass chartHeight as px.
// =====================================================

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Gantt, Toolbar, Willow, Editor } from '@svar-ui/react-gantt';
import { RestDataProvider } from '@svar-ui/gantt-data-provider';
import type { IApi, ITask, ILink } from '@svar-ui/react-gantt';
import '@svar-ui/react-gantt/all.css';

import { useGanttData } from '@/lib/gantt/hooks';
import { GanttSkeleton } from './gantt/GanttSkeleton';
import { Plus, Maximize2, Minimize2 } from 'lucide-react';

// ---- Props -----------------------------------------------------------

export interface GanttChartProps {
    projectId: string | null;
    projectCreatedAt?: string | null;
    onApiReady?: (api: IApi) => void;
}

// ---- Scales ----------------------------------------------------------

const SCALES = [
    { unit: 'month' as const, step: 1, format: '%F %Y' },
    { unit: 'week' as const, step: 1, format: 'Week %W' },
    { unit: 'day' as const, step: 1, format: '%j' },
];

// ---- Component -------------------------------------------------------

export default function GanttChart({ projectId, projectCreatedAt, onApiReady }: GanttChartProps) {
    const [mounted, setMounted] = useState(false);
    const [api, setApi] = useState<IApi | undefined>();

    useEffect(() => { setMounted(true); }, []);

    // ── Native Fullscreen ─────────────────────────────────────────────
    const [isFullscreen, setIsFullscreen] = useState(false);
    const containerIdRef = useRef('gantt-chart-container');

    useEffect(() => {
        const onChange = () => setIsFullscreen(!!document.fullscreenElement);
        document.addEventListener('fullscreenchange', onChange);
        return () => document.removeEventListener('fullscreenchange', onChange);
    }, []);

    const toggleFullscreen = useCallback(() => {
        const el = document.getElementById(containerIdRef.current);
        if (!el) return;
        if (!document.fullscreenElement) el.requestFullscreen().catch(() => { });
        else document.exitFullscreen().catch(() => { });
    }, []);

    // ── Data: frozen-per-project strategy ────────────────────────────
    //
    // The rule:
    //   • When projectId changes (project switch) → reload ganttTasks/ganttLinks.
    //   • When projectId is the same (background refetch) → skip.
    //
    // Why: SVAR Gantt reinitializes its SvelteKit store on any prop change,
    // destroying open editors/dropdowns. We prevent prop changes during same-
    // project editing while still correctly reloading on project switch.
    //
    const { tasks: tasksQuery, links: linksQuery, isLoading, isError } = useGanttData(projectId);

    const rawTasks = useMemo<ITask[]>(
        () => (tasksQuery.data ?? []) as unknown as ITask[],
        [tasksQuery.data]
    );
    const rawLinks = useMemo<ILink[]>(
        () => (linksQuery.data ?? []) as unknown as ILink[],
        [linksQuery.data]
    );

    const [ganttTasks, setGanttTasks] = useState<ITask[]>([]);
    const [ganttLinks, setGanttLinks] = useState<ILink[]>([]);
    const [ganttDataReady, setGanttDataReady] = useState(false);

    // The projectId whose data is currently frozen in ganttTasks/ganttLinks
    const frozenProjectId = useRef<string | null>(null);

    useEffect(() => {
        // Wait for a genuine resolved state (not mid-fetch, not error)
        if (isLoading || isError || !projectId) return;

        // Only push new data when the project has actually changed
        if (frozenProjectId.current !== projectId) {
            setGanttTasks(rawTasks);
            setGanttLinks(rawLinks);
            setGanttDataReady(true);
            frozenProjectId.current = projectId;
        }
        // Same project + same projectId → background refetch → skip to keep editors alive
    }, [isLoading, isError, projectId, rawTasks, rawLinks]);

    // ── Time Range ───────────────────────────────────────────────────
    const { rangeStart, rangeEnd } = useMemo(() => {
        const base = projectCreatedAt ? new Date(projectCreatedAt) : new Date();
        const start = new Date(base);
        start.setDate(start.getDate() - 2);
        start.setHours(0, 0, 0, 0);
        const end = new Date(start);
        end.setMonth(end.getMonth() + 3);
        return { rangeStart: start, rangeEnd: end };
    }, [projectCreatedAt]);

    // ── Height measurement via callback refs ─────────────────────────
    const [containerHeight, setContainerHeight] = useState(0);
    const [toolbarHeight, setToolbarHeight] = useState(0);

    const outerRoRef = useRef<ResizeObserver | null>(null);
    const outerCallbackRef = useCallback((node: HTMLDivElement | null) => {
        outerRoRef.current?.disconnect();
        if (!node) { setContainerHeight(0); return; }
        const measure = () => setContainerHeight(node.clientHeight);
        measure();
        outerRoRef.current = new ResizeObserver(measure);
        outerRoRef.current.observe(node);
    }, []);

    const toolbarRoRef = useRef<ResizeObserver | null>(null);
    const toolbarCallbackRef = useCallback((node: HTMLDivElement | null) => {
        toolbarRoRef.current?.disconnect();
        if (!node) { setToolbarHeight(0); return; }
        const measure = () => setToolbarHeight(node.offsetHeight);
        measure();
        toolbarRoRef.current = new ResizeObserver(measure);
        toolbarRoRef.current.observe(node);
    }, []);

    const chartHeight = containerHeight > 0
        ? containerHeight - (toolbarHeight > 0 ? toolbarHeight : 48)
        : 0;

    // ── RestDataProvider (write path) ─────────────────────────────────
    const server = useMemo(
        () => new RestDataProvider(`/api/gantt/${projectId}`),
        [projectId]
    );

    // ── Init callback ─────────────────────────────────────────────────
    const init = useCallback(
        (ganttApi: IApi) => {
            setApi(ganttApi);
            onApiReady?.(ganttApi);
            ganttApi.setNext(server);

            // Normalize start/end to Date objects on every task mutation.
            // When RestDataProvider writes a task, SVAR may receive the new/updated
            // task with ISO string dates from the JSON response. The Editor then
            // calls start.getFullYear() and crashes. Intercepting here ensures dates
            // are always proper Date objects before they enter the internal store.
            const normalizeDates = (ev: Record<string, unknown>) => {
                if (ev.start && !(ev.start instanceof Date)) ev.start = new Date(ev.start as string);
                if (ev.end && !(ev.end instanceof Date)) ev.end = new Date(ev.end as string);
            };
            ganttApi.intercept('add-task', (ev: Record<string, unknown>) => { normalizeDates(ev); });
            ganttApi.intercept('update-task', (ev: Record<string, unknown>) => { normalizeDates(ev); });
        },
        [server, onApiReady]
    );

    // ── Guards ────────────────────────────────────────────────────────
    if (!projectId) {
        return (
            <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                Select a project above to view its Gantt chart.
            </div>
        );
    }

    if (!mounted) return <GanttSkeleton />;

    const showSkeleton = isLoading || !ganttDataReady;

    return (
        <div
            ref={outerCallbackRef}
            className="w-full h-full flex flex-col overflow-hidden bg-white rounded-lg shadow-inner border border-gray-100/50"
            id="gantt-chart-container"
        >
            {isError && (
                <div className="flex flex-col items-center justify-center h-full gap-3 text-red-500 text-sm">
                    <p>Failed to load Gantt data.</p>
                    <button
                        onClick={() => { tasksQuery.refetch(); linksQuery.refetch(); }}
                        className="px-4 py-2 bg-red-50 hover:bg-red-100 rounded-lg transition-colors border border-red-200"
                    >
                        Retry
                    </button>
                </div>
            )}

            {!isError && showSkeleton && <GanttSkeleton />}

            {!isError && !showSkeleton && (
                <Willow>
                    {/* Toolbar + fullscreen button */}
                    <div ref={toolbarCallbackRef} style={{ position: 'relative' }}>
                        <Toolbar api={api} />
                        <button
                            onClick={toggleFullscreen}
                            title={isFullscreen ? 'Exit fullscreen (Esc)' : 'Enter fullscreen'}
                            style={{
                                position: 'absolute', top: '50%', right: '8px',
                                transform: 'translateY(-50%)', zIndex: 20,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                width: '28px', height: '28px', borderRadius: '6px',
                                border: '1px solid #e5e7eb', background: '#fff',
                                cursor: 'pointer', color: '#6b7280',
                                transition: 'background 0.15s, color 0.15s',
                            }}
                            onMouseEnter={e => {
                                (e.currentTarget as HTMLButtonElement).style.background = '#f3f4f6';
                                (e.currentTarget as HTMLButtonElement).style.color = '#111827';
                            }}
                            onMouseLeave={e => {
                                (e.currentTarget as HTMLButtonElement).style.background = '#fff';
                                (e.currentTarget as HTMLButtonElement).style.color = '#6b7280';
                            }}
                        >
                            {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                        </button>
                    </div>

                    {/* Chart area */}
                    <div
                        style={{
                            height: chartHeight > 0 ? `${chartHeight}px` : 'calc(100% - 48px)',
                            width: '100%', position: 'relative', overflow: 'hidden',
                        }}
                    >
                        {ganttTasks.length === 0 && (
                            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-gray-50/80 backdrop-blur-[2px]">
                                <div className="p-4 bg-white rounded-lg shadow-sm border border-gray-100 flex flex-col items-center gap-2 max-w-xs text-center">
                                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                                        <Plus className="w-5 h-5 text-gray-400" />
                                    </div>
                                    <h3 className="font-medium text-gray-900">No tasks yet</h3>
                                    <p className="text-xs text-gray-500">Your timeline is empty. Click the button below to add your first milestone or task.</p>
                                    <button
                                        onClick={() => onApiReady && api && onApiReady(api)}
                                        className="mt-2 text-xs font-semibold text-blue-600 hover:text-blue-700 underline"
                                    >
                                        Add first task
                                    </button>
                                </div>
                            </div>
                        )}
                        <div style={{ height: '100%', width: '100%' }}>
                            <Gantt
                                key={projectId}
                                start={rangeStart}
                                end={rangeEnd}
                                cellHeight={40}
                                cellWidth={33}
                                tasks={ganttTasks}
                                links={ganttLinks}
                                scales={SCALES}
                                init={init}
                            />
                        </div>
                    </div>

                    {api && <Editor api={api} />}
                </Willow>
            )}
        </div>
    );
}