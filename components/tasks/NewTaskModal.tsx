"use client";

import { useState } from "react";
import { X, Calendar, User, Briefcase, Layout, AlertCircle, Loader2 } from "lucide-react";
import { TaskStatus, TaskPriority } from "@prisma/client";

interface NewTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  clients: any[];
  projects: any[];
  members: any[];
  isLoading?: boolean;
}

export function NewTaskModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  clients, 
  projects, 
  members,
  isLoading 
}: NewTaskModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [clientId, setClientId] = useState("");
  const [projectId, setProjectId] = useState("");
  const [assignedToId, setAssignedToId] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("MEDIUM");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      title,
      description,
      clientId,
      projectId,
      assignedToId,
      priority,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    });
  };

  const filteredProjects = projects.filter(p => !clientId || p.clientId === clientId);
  const selectedClient = clients.find(c => c.id === clientId);
  const clientTeamMembers = selectedClient?.teamMembers || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white w-full max-w-xl rounded-3xl shadow-2xl shadow-indigo-500/10 overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
          <h2 className="text-xl font-bold text-gray-900">Create New Task</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-50 rounded-xl transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Title */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider px-1">Task Title</label>
            <input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Design homepage banner"
              className="w-full px-4 py-3 rounded-2xl border border-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all font-medium"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Client */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider px-1">Client</label>
              <div className="relative">
                <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                <select
                  required
                  value={clientId}
                  onChange={(e) => {
                    setClientId(e.target.value);
                    setProjectId("");
                    setAssignedToId(""); // reset assignee on change
                  }}
                  className="w-full pl-10 pr-4 py-3 rounded-2xl border border-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 appearance-none bg-gray-50/30 transition-all font-medium text-sm"
                >
                  <option value="">Select Client</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.companyName}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Project */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider px-1">Project</label>
              <div className="relative">
                <Layout className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                <select
                  required
                  value={projectId}
                  disabled={!clientId}
                  onChange={(e) => setProjectId(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-2xl border border-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 appearance-none bg-gray-50/30 transition-all font-medium text-sm disabled:opacity-50"
                >
                  <option value="">Select Project</option>
                  {filteredProjects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Assignee & Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider px-1">Assignee</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                <select
                  value={assignedToId}
                  disabled={!clientId || clientTeamMembers.length === 0}
                  onChange={(e) => setAssignedToId(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-2xl border border-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 appearance-none bg-gray-50/30 transition-all font-medium text-sm disabled:opacity-50"
                >
                  <option value="">Unassigned</option>
                  {clientTeamMembers.map((m: any) => (
                    <option key={m.userId} value={m.userId}>{m.userName}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider px-1">Priority</label>
              <div className="relative">
                <AlertCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as TaskPriority)}
                  className="w-full pl-10 pr-4 py-3 rounded-2xl border border-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 appearance-none bg-gray-50/30 transition-all font-medium text-sm"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
             {/* Start Date */}
             <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider px-1">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all font-medium text-sm"
              />
            </div>

            {/* End Date */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider px-1">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border border-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all font-medium text-sm"
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider px-1">Description</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add details about the task..."
              className="w-full px-4 py-3 rounded-2xl border border-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all font-medium text-sm resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-indigo-600 text-white py-3.5 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 disabled:opacity-50 transition-all mt-4"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              "Create Task"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
