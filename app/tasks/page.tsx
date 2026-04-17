"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  AlertCircle,
  Clock,
  CheckCircle2

} from "lucide-react";
import { TaskStatus, TaskPriority } from "@prisma/client";
import { NewTaskModal } from "@/components/tasks/NewTaskModal";
import { TaskDetailModal } from "@/components/tasks/TaskDetailModal";
import { TaskTable } from "@/components/tasks/TaskTable";
import { KanbanBoard } from "@/components/KanbanBoard";
import { toast } from "react-hot-toast";


// ─── Types ────────────────────────────────────────────────────────────────────

interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  startDate?: string;
  endDate?: string;
  clientId: string;
  projectId: string;
  organizationId: string;
  mediaUrls?: string[];
  feedbacks: string[];
  countSubTask: number;
  project: { name: string };
  client: { companyName: string };
  assignedTo?: { id: string; name: string };
  _count?: any;
}

interface Client {
  id: string;
  companyName: string;
}

interface Project {
  id: string;
  name: string;
}

// ─── API Helpers ──────────────────────────────────────────────────────────────

const fetchTasks = async (filters: {
  projectId?: string;
  clientId?: string;
  organizationId?: string
}) => {
  const params = new URLSearchParams();
  if (filters.projectId) params.append("projectId", filters.projectId);
  if (filters.clientId) params.append("clientId", filters.clientId);
  const res = await fetch(`/api/tasks?${params.toString()}`);
  if (!res.ok) throw new Error("Failed to fetch tasks");
  return res.json();
};

const fetchClients = async () => {
  const res = await fetch("/api/clients");
  return res.json();
};

const fetchProjects = async () => {
  const res = await fetch("/api/projects");
  return res.json();
};

const fetchMembers = async () => {
  const res = await fetch("/api/members");
  if (!res.ok) throw new Error("Failed to fetch members");
  const data = await res.json();
  // Map to a simpler structure for the form
  return data.map((m: any) => ({
    id: m.user.id,
    name: m.user.name,
  }));
};


// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_MAP: Record<TaskStatus, { label: string; color: string; icon: any }> = {
  OPEN: { label: "Open", color: "text-green-600 bg-green-100", icon: Clock },
  OPENED: { label: "Opened", color: "text-teal-600 bg-teal-50", icon: Clock },
  IN_PROGRESS: { label: "In Progress", color: "text-blue-600 bg-blue-50", icon: Clock },
  INTERNAL_REVIEW: { label: "Internal Review", color: "text-violet-600 bg-violet-50", icon: AlertCircle },
  CLIENT_REVIEW: { label: "Client Review", color: "text-amber-600 bg-amber-50", icon: AlertCircle },
  APPROVED: { label: "Approved", color: "text-emerald-600 bg-emerald-50", icon: CheckCircle2 },
  REJECTED: { label: "Rejected", color: "text-red-600 bg-red-50", icon: AlertCircle },
};

// ─── Main Component ───────────────────────────────────────────────────────────

export default function TasksPage() {
  const queryClient = useQueryClient();
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const { data: tasks = [], isLoading: isLoadingTasks } = useQuery({
    queryKey: ["tasks", selectedProjectId, selectedClientId],
    queryFn: () => fetchTasks({ projectId: selectedProjectId, clientId: selectedClientId }),
  });

  // Separate query for all tasks to show in Kanban board (ignores client filter)
  const { data: allTasks = [] } = useQuery({
    queryKey: ["allTasks", selectedProjectId],
    queryFn: () => fetchTasks({ projectId: selectedProjectId }),
  });

  const { data: clients = [] } = useQuery({
    queryKey: ["clients"],
    queryFn: fetchClients,
  });

  const { data: projects = [] } = useQuery({
    queryKey: ["projects"],
    queryFn: fetchProjects,
  });

  const { data: members = [] } = useQuery({
    queryKey: ["members"],
    queryFn: fetchMembers,
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: any) => fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...data,
        organizationId: projects.find((p: any) => p.id === data.projectId)?.organizationId || "demo-org-id",
        createdById: members[0]?.id
      })
    }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      setIsNewModalOpen(false);
      toast.success("Task created successfully!");
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: any }) => fetch(`/api/tasks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    }).then(res => res.json()),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      setSelectedTask(prev => prev?.id === updated.id ? { ...prev, ...updated } : prev);
      toast.success("Task updated");
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => fetch(`/api/tasks/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      setSelectedTask(null);
      toast.success("Task deleted");
    }
  });

  const subTaskMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: any }) => fetch(`/api/tasks/${id}/subtasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    }).then(res => res.json()),
    onSuccess: () => {
      // Refetch the full task details
      if (selectedTask) {
        fetch(`/api/tasks/${selectedTask.id}`).then(res => res.json()).then(data => {
          setSelectedTask(data);
          queryClient.invalidateQueries({ queryKey: ["tasks"] });
          toast.success("Subtask added");
        });
      }
    }
  });

  const handleOpenDetail = (task: Task) => {
    // Fetch full detail including subtasks
    fetch(`/api/tasks/${task.id}`).then(res => res.json()).then(data => {
      setSelectedTask(data);
    });
  };


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-1">Task Board</h1>
          <p className="text-gray-500 text-sm">Kanban view of all tasks.</p>
        </div>

      </div>
      <div>
      </div>
      {/* Kanban Board */}
      <KanbanBoard
        tasks={allTasks}
        onTaskClick={handleOpenDetail}
      />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mt-8">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 mb-1">Tasks List</h1>
          <p className="text-gray-500 text-sm">Manage all tasks in a list view.</p>
        </div>

        <button
          onClick={() => setIsNewModalOpen(true)}
          className="inline-flex items-center gap-2 bg-black text-white px-4 py-2.5 rounded-lg font-semibold text-sm hover:bg-black/90 transition-all"
        >
          <Plus className="w-4 h-4" />
          New Task
        </button>
      </div>
      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border border-gray-100 shadow-sm flex flex-wrap gap-4 items-center">
        <div className="flex items-center gap-3 w-full justify-start">
          <select
            className="pl-3 pr-8 py-2 rounded-lg border border-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all appearance-none bg-gray-50/50 text-gray-900"
            value={selectedClientId}
            onChange={(e) => setSelectedClientId(e.target.value)}
          >
            <option value="">All Clients</option>
            {clients.map((c: any) => (
              <option key={c.id} value={c.id}>{c.companyName}</option>
            ))}
          </select>

          <select
            className="pl-3 pr-8 py-2 rounded-lg border border-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all appearance-none bg-gray-50/50 text-gray-900"
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
          >
            <option value="">All Projects</option>
            {projects.map((p: any) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Content */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <TaskTable
          data={tasks}
          onRowClick={handleOpenDetail}
          isLoading={isLoadingTasks}
        />
      </div>

      {/* Modals */}
      <NewTaskModal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        onSubmit={(data) => createMutation.mutate(data)}
        clients={clients}
        projects={projects}
        members={members}
        isLoading={createMutation.isPending}
      />

      {selectedTask && (
        <TaskDetailModal
          isOpen={!!selectedTask}
          onClose={() => setSelectedTask(null)}
          task={selectedTask}
          onUpdate={(id, data) => updateMutation.mutate({ id, data })}
          onDelete={(id) => deleteMutation.mutate(id)}
          onCreateSubTask={(id, data) => subTaskMutation.mutate({ id, data })}
          isUpdating={updateMutation.isPending}
          isDeleting={deleteMutation.isPending}
        />
      )}
    </div>
  );
}
