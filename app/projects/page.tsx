"use client";

import { useState, useMemo, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { toast } from "react-hot-toast";

// ─── Types ────────────────────────────────────────────────────────────────────

type ClientStatus = "ACTIVE" | "INACTIVE" | "PENDING";
type ProjectStatus =
    | "PLANNING"
    | "IN_PROGRESS"
    | "REVIEW"
    | "COMPLETED"
    | "ON_HOLD"
    | "CANCELLED";
type EngagementType = "RETAINER" | "PROJECT_BASED";

interface ClientProfile {
    id: string;
    companyName: string;
    contactPerson: string;
    status: ClientStatus;
    engagementType: EngagementType;
}

interface Project {
    id: string;
    name: string;
    description?: string;
    status: ProjectStatus;
    startDate?: string;
    endDate?: string;
    budget?: number;
    createdAt: string;
    clientId: string;
    organizationId: string;
    client?: {
        companyName: string;
    };
}

interface CreateProjectPayload {
    name: string;
    clientId: string;
    startDate?: string;
    endDate?: string;
    description?: string;
}

// API Helpers 

const API_BASE = "/api";

async function fetchClients(): Promise<ClientProfile[]> {
    const res = await fetch(`${API_BASE}/clients`);
    if (!res.ok) throw new Error("Failed to fetch clients");
    return res.json();
}

async function fetchProjectsByClient(clientId: string): Promise<Project[]> {
    const res = await fetch(`${API_BASE}/clients/${clientId}/projects`);
    if (!res.ok) throw new Error("Failed to fetch projects");
    return res.json();
}

async function fetchAllProjects(): Promise<Project[]> {
    const res = await fetch(`${API_BASE}/projects`);
    if (!res.ok) throw new Error("Failed to fetch all projects");
    return res.json();
}

async function createProject(data: CreateProjectPayload): Promise<Project> {
    const res = await fetch(`${API_BASE}/clients/${data.clientId}/projects`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to create project");
    return res.json();
}

async function deleteProject(projectId: string): Promise<void> {
    const res = await fetch(`${API_BASE}/projects/${projectId}`, {
        method: "DELETE",
    });
    if (!res.ok) throw new Error("Failed to delete project");
}

async function updateProjectStatus(
    projectId: string,
    status: ProjectStatus
): Promise<Project> {
    const res = await fetch(`${API_BASE}/projects/${projectId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
    });
    if (!res.ok) throw new Error("Failed to update project");
    return res.json();
}

// Query Keys

const QUERY_KEYS = {
    clients: ["clients"] as const,
    projects: (clientId: string) => ["projects", clientId] as const,
};

// Utility

function formatDate(dateStr?: string) {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
}

function getInitials(name: string) {
    return name
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
}

// Sub-Components

const STATUS_CONFIG: Record<
    ProjectStatus,
    { label: string; bg: string; text: string }
> = {
    PLANNING: {
        label: "Planning",
        bg: "bg-violet-100",
        text: "text-violet-700",
    },
    IN_PROGRESS: {
        label: "In Progress",
        bg: "bg-blue-100",
        text: "text-blue-700",
    },
    REVIEW: { label: "Review", bg: "bg-amber-100", text: "text-amber-700" },
    COMPLETED: {
        label: "Completed",
        bg: "bg-emerald-100",
        text: "text-emerald-700",
    },
    ON_HOLD: { label: "On Hold", bg: "bg-gray-100", text: "text-gray-600" },
    CANCELLED: { label: "Cancelled", bg: "bg-red-100", text: "text-red-600" },
};

// Skeleton

function ProjectCardSkeleton() {
    return (
        <div className="bg-white rounded-lg border border-gray-100 p-5 animate-pulse">
            <div className="flex items-start justify-between mb-3">
                <div className="h-5 bg-gray-100 rounded w-2/5" />
                <div className="h-5 bg-gray-100 rounded-full w-20" />
            </div>
            <div className="h-4 bg-gray-100 rounded w-3/4 mb-1.5" />
            <div className="h-4 bg-gray-100 rounded w-1/2 mb-4" />
            <div className="flex gap-4 mb-4">
                <div className="h-3.5 bg-gray-100 rounded w-24" />
                <div className="h-3.5 bg-gray-100 rounded w-24" />
            </div>
            <div className="border-t border-gray-50 pt-4 flex gap-2">
                <div className="h-8 bg-gray-100 rounded-lg w-20" />
                <div className="h-8 bg-gray-100 rounded-lg w-20" />
                <div className="h-8 bg-gray-100 rounded-lg w-16 ml-auto" />
            </div>
        </div>
    );
}

function ClientDropdownSkeleton() {
    return (
        <div className="h-10 bg-gray-100 rounded-xl w-52 animate-pulse" />
    );
}

// Project Card

interface ProjectCardProps {
    project: Project;
    onApprove: (id: string) => void;
    onReject: (id: string) => void;
    onDelete: (id: string) => void;
    isUpdating: boolean;
    isDeleting: boolean;
}

function ProjectCard({
    project,
    onApprove,
    onReject,
    onDelete,
    isUpdating,
    isDeleting,
}: ProjectCardProps) {
    const cfg = STATUS_CONFIG[project.status];
    const busy = isUpdating || isDeleting;

    return (
        <div className="bg-white rounded-lg border border-gray-100 p-5 flex flex-col gap-0 hover:border-gray-200 hover:shadow-sm transition-all duration-200 group">
            {/* Header */}
            <div className="flex items-start justify-between mb-1">
                <div className="flex flex-col gap-0.5">
                    <h3 className="font-semibold text-gray-900 text-[15px] leading-snug line-clamp-1 group-hover:text-indigo-700 transition-colors">
                        {project.name}
                    </h3>
                    {project.client?.companyName && (
                        <span className="text-[11px] font-medium text-indigo-500 uppercase tracking-wider">
                            {project.client.companyName}
                        </span>
                    )}
                </div>
                <span
                    className={`text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap ml-2 ${cfg.bg} ${cfg.text}`}
                >
                    {cfg.label}
                </span>
            </div>

            {/* Description */}
            <p className="text-sm text-gray-600 line-clamp-2 mb-4 min-h-[40px]">
                {project.description || "No description provided."}
            </p>

            {/* Timeline */}
            <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
                <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <rect x="3" y="4" width="18" height="18" rx="2" />
                    <path d="M16 2v4M8 2v4M3 10h18" />
                </svg>
                <span>
                    {formatDate(project.startDate)} → {formatDate(project.endDate)}
                </span>
            </div>

            {/* Created at */}
            <div className="flex items-center gap-1 text-xs text-gray-400 mb-4">
                <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 6v6l4 2" />
                </svg>
                <span>Created {formatDate(project.createdAt)}</span>
            </div>

            {/* Budget */}
            {project.budget != null && (
                <div className="text-xs text-gray-400 mb-4">
                    Budget:{" "}
                    <span className="font-medium text-gray-600">
                        ₹{project.budget.toLocaleString("en-IN")}
                    </span>
                </div>
            )}

            {/* Actions */}
            <div className="border-t border-gray-50 pt-4 flex items-center gap-2 flex-wrap">
                <button
                    onClick={() => onDelete(project.id)}
                    disabled={busy}
                    className="inline-flex items-center gap-1 text-xs font-medium px-1 py-1 rounded-lg bg-gray-50 text-gray-500 hover:bg-red-100 hover:text-red-600 disabled:opacity-50 transition-colors ml-auto"
                >
                    {isDeleting ? (
                        <span className="w-3.5 h-3.5 rounded-full border-2 border-gray-300 border-t-gray-500 animate-spin" />
                    ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                    )}
                </button>
            </div>
        </div>
    );
}

// New Project Modal

interface NewProjectModalProps {
    clients: ClientProfile[];
    preselectedClientId?: string;
    onClose: () => void;
    onSubmit: (data: CreateProjectPayload) => void;
    isLoading: boolean;
}

function NewProjectModal({
    clients,
    preselectedClientId,
    onClose,
    onSubmit,
    isLoading,
}: NewProjectModalProps) {
    const [name, setName] = useState("");
    const [clientId, setClientId] = useState(preselectedClientId ?? "");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [description, setDescription] = useState("");

    const handleSubmit = useCallback(
        (e: React.FormEvent) => {
            e.preventDefault();
            if (!name.trim() || !clientId) return;
            onSubmit({
                name: name.trim(),
                clientId,
                startDate: startDate || undefined,
                endDate: endDate || undefined,
                description: description.trim() || undefined,
            });
        },
        [name, clientId, startDate, endDate, description, onSubmit]
    );

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: "rgba(0,0,0,0.35)" }}
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden">
                {/* Modal Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
                    <h2 className="text-[17px] font-semibold text-gray-900">New Project</h2>
                    <button
                        onClick={onClose}
                        className="w-7 h-7 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Modal Body */}
                <form onSubmit={handleSubmit} className="px-6 py-5 flex flex-col gap-4">
                    {/* Project Name */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-[13px] font-medium text-gray-600">
                            Project Name
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Q4 Marketing Campaign"
                            required
                            className="h-10 px-3.5 rounded-xl border border-gray-200 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all bg-gray-50/50"
                        />
                    </div>

                    {/* Client */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-[13px] font-medium text-gray-600">
                            Client
                        </label>
                        <div className="relative">
                            <select
                                value={clientId}
                                onChange={(e) => setClientId(e.target.value)}
                                required
                                className="w-full h-10 pl-3.5 pr-9 rounded-xl border border-gray-200 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all bg-gray-50/50 appearance-none"
                            >
                                <option value="" disabled>
                                    Select a client...
                                </option>
                                {clients.map((c) => (
                                    <option key={c.id} value={c.id}>
                                        {c.companyName}
                                    </option>
                                ))}
                            </select>
                            <svg
                                className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2}
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                            </svg>
                        </div>
                    </div>

                    {/* Dates */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[13px] font-medium text-gray-600">
                                Start Date
                            </label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="h-10 px-3.5 rounded-xl border border-gray-200 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all bg-gray-50/50"
                            />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-[13px] font-medium text-gray-600">
                                End Date
                            </label>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                min={startDate}
                                className="h-10 px-3.5 rounded-xl border border-gray-200 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all bg-gray-50/50"
                            />
                        </div>
                    </div>

                    {/* Description */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-[13px] font-medium text-gray-600">
                            Description
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Brief overview of the project objectives..."
                            rows={3}
                            className="px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all bg-gray-50/50 resize-none"
                        />
                    </div>

                    {/* Footer Actions */}
                    <div className="flex gap-3 mt-1">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 h-10 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading || !name.trim() || !clientId}
                            className="flex-1 h-10 rounded-xl bg-gray-900 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                <>
                                    <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                <>
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <rect x="3" y="4" width="18" height="18" rx="2" />
                                        <path d="M16 2v4M8 2v4M3 10h18" />
                                    </svg>
                                    Create Project
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// Empty State

function EmptyProjects({ onNew }: { onNew: () => void }) {
    return (
        <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-14 h-14 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center mb-4">
                <svg className="w-7 h-7 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <rect x="3" y="4" width="18" height="18" rx="2" />
                    <path d="M16 2v4M8 2v4M3 10h18M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01M16 18h.01" />
                </svg>
            </div>
            <p className="text-[15px] font-medium text-gray-500 mb-1">No projects yet</p>
            <p className="text-sm text-gray-300 mb-5">
                Get started by creating your first project.
            </p>
            <button
                onClick={onNew}
                className="inline-flex items-center gap-2 h-9 px-4 rounded-xl bg-gray-900 text-sm font-medium text-white hover:bg-gray-800 transition-colors"
            >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                New Project
            </button>
        </div>
    );
}

// Main Page

export default function ProjectsPage() {
    const queryClient = useQueryClient();
    const [selectedClientId, setSelectedClientId] = useState<string>("");
    const [showModal, setShowModal] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [updatingId, setUpdatingId] = useState<string | null>(null);
    const [projectId, setProjectId] = useState<string | null>(null);

    // Queries

    const {
        data: clients = [],
        isLoading: clientsLoading,
    } = useQuery({
        queryKey: QUERY_KEYS.clients,
        queryFn: fetchClients,
        staleTime: 5 * 60 * 1000,
    });

    const {
        data: projects = [],
        isLoading: projectsLoading,
        isFetching: projectsFetching,
    } = useQuery({
        queryKey: QUERY_KEYS.projects(selectedClientId || "all"),
        queryFn: () => (selectedClientId ? fetchProjectsByClient(selectedClientId) : fetchAllProjects()),
        staleTime: 2 * 60 * 1000,
    });

    // Mutations

    const createMutation = useMutation({
        mutationFn: createProject,
        onSuccess: (newProject) => {
            queryClient.setQueryData<Project[]>(
                QUERY_KEYS.projects(newProject.clientId),
                (old = []) => [newProject, ...old]
            );
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.projects(selectedClientId) });
            queryClient.invalidateQueries({ queryKey: QUERY_KEYS.projects('all') });
            setProjectId(newProject.id);
            setShowModal(false);
            toast.success('Project created successfully!');
        },
        onError: () => toast.error('Failed to create project'),
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => deleteProject(id),
        onMutate: (id) => setDeletingId(id),
        onSuccess: (_, id) => {
            queryClient.setQueryData<Project[]>(
                QUERY_KEYS.projects(selectedClientId),
                (old = []) => old.filter((p) => p.id !== id)
            );
        },
        onSettled: () => setDeletingId(null),
    });

    const statusMutation = useMutation({
        mutationFn: ({
            id,
            status,
        }: {
            id: string;
            status: ProjectStatus;
        }) => updateProjectStatus(id, status),
        onMutate: ({ id }) => setUpdatingId(id),
        onSuccess: (updated) => {
            queryClient.setQueryData<Project[]>(
                QUERY_KEYS.projects(selectedClientId),
                (old = []) => old.map((p) => (p.id === updated.id ? updated : p))
            );
        },
        onSettled: () => setUpdatingId(null),
    });

    // Handlers

    const handleApprove = useCallback(
        (id: string) => statusMutation.mutate({ id, status: "COMPLETED" }),
        [statusMutation]
    );

    const handleReject = useCallback(
        (id: string) => statusMutation.mutate({ id, status: "CANCELLED" }),
        [statusMutation]
    );

    const handleDelete = useCallback(
        (id: string) => {
            if (window.confirm("Delete this project? This action cannot be undone.")) {
                deleteMutation.mutate(id);
            }
        },
        [deleteMutation]
    );

    const handleCreate = useCallback(
        (data: CreateProjectPayload) => createMutation.mutate(data),
        [createMutation]
    );

    // Derived

    const selectedClient = useMemo(
        () => clients.find((c) => c.id === selectedClientId),
        [clients, selectedClientId]
    );

    const projectCount = projects.length;
    const isLoadingProjects = projectsLoading;

    // Render   

    return (
        <div className="min-h-screen">
            <div className="max-w-7xl mx-auto">

                {/* ── Page Header ── */}
                <div className="flex items-start justify-between mb-3">
                    <div>
                        <h1 className="text-2xl font-semibold text-gray-900 mb-1">Projects</h1>
                        <p className="text-sm text-gray-400">
                            Manage and track your client projects and deliverables.
                        </p>
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-black text-sm font-medium text-white hover:bg-black/90 transition-colors"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                        </svg>
                        New Project
                    </button>
                </div>

                {/* ── Filter Bar ── */}
                <div className="bg-white shadow-sm rounded-lg border border-gray-100 px-2.5 py-2.5 mb-6 flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-3 flex-wrap">
                        {/* Client Dropdown */}
                        {clientsLoading ? (
                            <ClientDropdownSkeleton />
                        ) : (
                            <div className="relative">
                                <select
                                    value={selectedClientId}
                                    onChange={(e) => setSelectedClientId(e.target.value)}
                                    className="h-10 pl-2 pr-9 rounded-lg border border-gray-200 text-[10px] text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all bg-white appearance-none min-w-[200px]"
                                >
                                    <option value="">All clients</option>
                                    {clients.map((c) => (
                                        <option key={c.id} value={c.id}>
                                            {c.companyName}
                                        </option>
                                    ))}
                                </select>
                                <svg
                                    className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    strokeWidth={2}
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                </svg>
                            </div>
                        )}

                        {/* Client badge */}
                        {selectedClient && (
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-indigo-50 border border-indigo-100">
                                <div className="w-6 h-6 rounded-lg bg-indigo-200 text-indigo-700 flex items-center justify-center text-[10px] font-bold">
                                    {getInitials(selectedClient.companyName)}
                                </div>
                                <span className="text-sm text-indigo-700 font-medium">
                                    {selectedClient.companyName}
                                </span>
                                <span
                                    className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${selectedClient.status === "ACTIVE"
                                        ? "bg-emerald-100 text-emerald-700"
                                        : selectedClient.status === "PENDING"
                                            ? "bg-amber-100 text-amber-700"
                                            : "bg-gray-100 text-gray-500"
                                        }`}
                                >
                                    {selectedClient.status.charAt(0) + selectedClient.status.slice(1).toLowerCase()}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Count */}
                    {selectedClientId && !isLoadingProjects && (
                        <div className="flex items-center gap-1.5 text-sm text-gray-400">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                                <rect x="3" y="4" width="18" height="18" rx="2" />
                                <path d="M16 2v4M8 2v4M3 10h18" />
                            </svg>
                            {projectCount} {projectCount === 1 ? "project" : "projects"}
                            {projectsFetching && !projectsLoading && (
                                <span className="w-3 h-3 rounded-full border-2 border-gray-200 border-t-gray-400 animate-spin ml-1" />
                            )}
                        </div>
                    )}
                </div>



                {/* ── Project Grid ── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">

                    {isLoadingProjects
                        ? Array.from({ length: 6 }).map((_, i) => (
                            <ProjectCardSkeleton key={i} />
                        ))
                        : projects.length === 0
                            ? null
                            : projects.map((project) => (
                                <ProjectCard
                                    key={project.id}
                                    project={project}
                                    onApprove={handleApprove}
                                    onReject={handleReject}
                                    onDelete={handleDelete}
                                    isUpdating={updatingId === project.id}
                                    isDeleting={deletingId === project.id}
                                />
                            ))}
                </div>

                {/* ── Empty state ── */}
                {!isLoadingProjects && projects.length === 0 && (
                    <EmptyProjects onNew={() => setShowModal(true)} />
                )}
            </div>

            {/* ── Modal ── */}
            {showModal && (
                <NewProjectModal
                    clients={clients}
                    preselectedClientId={selectedClientId || undefined}
                    onClose={() => setShowModal(false)}
                    onSubmit={handleCreate}
                    isLoading={createMutation.isPending}
                />
            )}
        </div>
    );
}