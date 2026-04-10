'use client';

// =====================================================
// GanttChart — Production Component
//
// Architecture:
//  • TanStack Query owns the READ path (tasks + links).
//  • RestDataProvider owns the WRITE path (auto-maps
//    Gantt actions → REST calls via api.setNext).
//  • useMemo: server instance, scales array (prevent re-mount).
//  • useCallback: init (stable reference keeps Gantt from re-mounting).
//
// Scroll strategy:
//  • SVAR Gantt's .wx-gantt has `overflow-y: auto` built-in.
//  • It ONLY activates when it receives a concrete pixel height.
//  • Willow is an opaque wrapper that breaks flex height inheritance.
//  • Fix: callback refs measure outer container + toolbar heights,
//    compute chartHeight = container - toolbar, pass as explicit px inline style.
//  • isReady only gates on mounted — height is for scroll, not rendering.
// =====================================================

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Gantt, Toolbar, Willow, Editor } from '@svar-ui/react-gantt';
import { RestDataProvider } from '@svar-ui/gantt-data-provider';
import type { IApi, ITask, ILink } from '@svar-ui/react-gantt';
import '@svar-ui/react-gantt/all.css';

import { useGanttData, useGanttInvalidate } from '@/lib/gantt/hooks';
import { GanttSkeleton } from './gantt/GanttSkeleton';
import { Plus, Maximize2, Minimize2 } from 'lucide-react';

// ---- Props -----------------------------------------------------------

export interface GanttChartProps {
    projectId: string | null;
    /** ISO string of when the project was created — used as the Gantt start date (minus 1 day) */
    projectCreatedAt?: string | null;
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

export default function GanttChart({ projectId, projectCreatedAt, onApiReady }: GanttChartProps) {
    const [mounted, setMounted] = useState(false);
    const [api, setApi] = useState<IApi | undefined>();

    // Hydration guard — Gantt is SSR-incompatible
    useEffect(() => { setMounted(true); }, []);

    // ── Native Fullscreen ─────────────────────────────────────────────
    const [isFullscreen, setIsFullscreen] = useState(false);
    const containerIdRef = useRef('gantt-chart-container');

    useEffect(() => {
        const onFsChange = () => setIsFullscreen(!!document.fullscreenElement);
        document.addEventListener('fullscreenchange', onFsChange);
        return () => document.removeEventListener('fullscreenchange', onFsChange);
    }, []);

    const toggleFullscreen = useCallback(() => {
        const el = document.getElementById(containerIdRef.current);
        if (!el) return;
        if (!document.fullscreenElement) {
            el.requestFullscreen().catch(() => { });
        } else {
            document.exitFullscreen().catch(() => { });
        }
    }, []);

    // ── Data (TanStack Query) ─────────────────────────────────────────
    const { tasks: tasksQuery, links: linksQuery, isLoading, isError } = useGanttData(projectId);
    const invalidate = useGanttInvalidate();

    const tasks = useMemo<ITask[]>(
        () => (tasksQuery.data ?? []) as unknown as ITask[],
        [tasksQuery.data]
    );
    const links = useMemo<ILink[]>(
        () => (linksQuery.data ?? []) as unknown as ILink[],
        [linksQuery.data]
    );

    // ── Time Range ───────────────────────────────────────────────────
    // rangeStart = project creation date - 1 day (so the first task isn't flush at the edge)
    // rangeEnd   = 3 months after rangeStart
    const { rangeStart, rangeEnd } = useMemo(() => {
        const base = projectCreatedAt ? new Date(projectCreatedAt) : new Date();
        const start = new Date(base);
        start.setDate(start.getDate() - 1);
        start.setHours(0, 0, 0, 0);
        const end = new Date(start);
        end.setMonth(end.getMonth() + 3);
        return { rangeStart: start, rangeEnd: end };
    }, [projectCreatedAt]);

    // ── Height measurement via callback refs ─────────────────────────
    // Callback refs fire whenever the element mounts/unmounts, regardless
    // of when projectId changes — this avoids the stale-closure bug of
    // useEffect([mounted]) not re-running after project selection.
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

    // chartHeight = available space for the Gantt chart (enables SVAR's internal scroll)
    const chartHeight = containerHeight > 0
        ? containerHeight - (toolbarHeight > 0 ? toolbarHeight : 48)
        : 0;

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

    // ── Guard: no project selected ────────────────────────────────────
    if (!projectId) {
        return (
            <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                Select a project above to view its Gantt chart.
            </div>
        );
    }

    // ── Guard: SSR — isReady ONLY gates on mounted, not on height ────
    // Height is needed for scroll only, not for rendering the chart.
    // Decoupling these prevents the "stuck at skeleton" bug where
    // containerHeight is 0 because the effect ran before projectId was set.
    if (!mounted) return <GanttSkeleton />;

    return (
        <div
            ref={outerCallbackRef}
            className="w-full h-full flex flex-col overflow-hidden bg-white rounded-xl shadow-inner border border-gray-100/50"
            id="gantt-chart-container"
        >
            {isError && (
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

            {!isError && isLoading && <GanttSkeleton />}

            {!isError && !isLoading && (
                <Willow>
                    {/* Toolbar row: toolbar left, fullscreen button right */}
                    <div ref={toolbarCallbackRef} style={{ position: 'relative' }}>
                        <Toolbar api={api} />
                        {/* Fullscreen toggle — native browser API */}
                        <button
                            onClick={toggleFullscreen}
                            title={isFullscreen ? 'Exit fullscreen (Esc)' : 'Enter fullscreen'}
                            style={{
                                position: 'absolute',
                                top: '50%',
                                right: '8px',
                                transform: 'translateY(-50%)',
                                zIndex: 20,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '28px',
                                height: '28px',
                                borderRadius: '6px',
                                border: '1px solid #e5e7eb',
                                background: '#fff',
                                cursor: 'pointer',
                                color: '#6b7280',
                                transition: 'background 0.15s, color 0.15s',
                            }}
                            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#f3f4f6'; (e.currentTarget as HTMLButtonElement).style.color = '#111827'; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = '#fff'; (e.currentTarget as HTMLButtonElement).style.color = '#6b7280'; }}
                        >
                            {isFullscreen
                                ? <Minimize2 size={14} />
                                : <Maximize2 size={14} />}
                        </button>
                    </div>

                    {/* Chart area: explicit pixel height so SVAR's overflow-y:auto scrollbar fires.
                        Falls back to calc() until the ResizeObserver fires on first render. */}
                    <div
                        style={{
                            height: chartHeight > 0 ? `${chartHeight}px` : 'calc(100% - 48px)',
                            width: '100%',
                            position: 'relative',
                            overflow: 'hidden',
                        }}
                    >
                        {tasks.length === 0 && (
                            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-gray-50/80 backdrop-blur-[2px]">
                                <div className="p-4 bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center gap-2 max-w-xs text-center">
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
                        {/* height + width 100% propagates into .wx-gantt { overflow-y:auto } */}
                        <div style={{ height: '100%', width: '100%' }}>
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
                    </div>

                    {api && <Editor api={api} />}
                </Willow>
            )}
        </div>
    );
}