"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2,
  XCircle,
  MessageSquare,
  Clock,
  AlertCircle,
  User,
  Calendar,
  FolderKanban,
  X,
  Send,
  ShieldCheck,
  Eye,
  Check,
} from "lucide-react";
import { toast } from "react-hot-toast";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ApprovalTask {
  id: string;
  title: string;
  description?: string;
  status: "INTERNAL_REVIEW" | "CLIENT_REVIEW";
  priority: string;
  mediaUrls: string[];
  feedbacks: string[];
  countSubTask: number;
  startDate?: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
  project: { id: string; name: string };
  client: { id: string; companyName: string };
  assignedTo?: { id: string; name: string };
  createdBy?: { id: string; name: string };
  _count?: { subTasks: number };
  subTasks: Array<{
    id: string;
    title: string;
    description: string;
    status: string;
    createdAt: string;
  }>;
}

type ReviewerType = "CLIENT" | "ADMIN" | "TEAM_LEAD" | "ACCOUNT_MANAGER";

// ─── API Helpers ──────────────────────────────────────────────────────────────

const fetchApprovals = async (status?: string): Promise<ApprovalTask[]> => {
  const params = new URLSearchParams();
  if (status) params.append("status", status);
  const res = await fetch(`/api/approvals?${params.toString()}`);
  if (!res.ok) throw new Error("Failed to fetch approvals");
  return res.json();
};

const fetchProfile = async () => {
  const res = await fetch("/api/auth/me");
  if (!res.ok) throw new Error("Failed to fetch profile");
  return res.json();
};

// ─── Constants ────────────────────────────────────────────────────────────────

const TABS = [
  { key: "all", label: "All Reviews", icon: Eye },
  { key: "INTERNAL_REVIEW", label: "Internal Review", icon: ShieldCheck },
  { key: "CLIENT_REVIEW", label: "Client Review", icon: User },
] as const;

const PRIORITY_STYLES: Record<string, string> = {
  LOW: "bg-slate-100 text-slate-600",
  MEDIUM: "bg-blue-50 text-blue-600",
  HIGH: "bg-orange-50 text-orange-600",
  URGENT: "bg-red-50 text-red-600",
};

const REVIEWER_TYPES: { value: ReviewerType; label: string }[] = [
  { value: "ADMIN", label: "Admin" },
  { value: "TEAM_LEAD", label: "Team Lead" },
  { value: "ACCOUNT_MANAGER", label: "Account Manager" },
  { value: "CLIENT", label: "Client" },
];

// ─── Feedback Modal ───────────────────────────────────────────────────────────

function FeedbackModal({
  isOpen,
  onClose,
  onSubmit,
  actionType,
  taskTitle,
  isLoading,
  currentUser,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (feedback: string) => void;
  actionType: "reject" | "feedback";
  taskTitle: string;
  isLoading: boolean;
  currentUser: any;
}) {
  const [feedback, setFeedback] = useState("");

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (!feedback.trim()) {
      toast.error("Please enter feedback/reason");
      return;
    }
    onSubmit(feedback.trim());
    setFeedback("");
  };

  const isReject = actionType === "reject";

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div
        className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
        {/* Header */}
        <div
          className={`px-6 py-4 flex items-center justify-between ${
            isReject
              ? "bg-gradient-to-r from-red-500 to-rose-500"
              : "bg-gradient-to-r from-amber-500 to-orange-500"
          }`}
        >
          <div className="flex items-center gap-3">
            {isReject ? (
              <XCircle className="w-5 h-5 text-white" />
            ) : (
              <MessageSquare className="w-5 h-5 text-white" />
            )}
            <h3 className="text-sm font-medium text-white">
              {isReject ? "Reject Task" : "Give Feedback"}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-xs text-gray-500 font-medium mb-1">Task</p>
            <p className="text-xs font-medium text-gray-900">{taskTitle}</p>
          </div>

          <div className="bg-gray-50 rounded-xl p-3 flex flex-col gap-1">
            <p className="text-xs text-gray-500 font-medium">Auto-filled Reviewer</p>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[10px] font-bold">
                {currentUser?.name?.charAt(0) || "U"}
              </div>
              <p className="text-xs font-bold text-gray-900">{currentUser?.name || "Loading..."}</p>
              <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider bg-indigo-50 px-1.5 py-0.5 rounded">
                {currentUser?.role || currentUser?.userType || "User"}
              </span>
            </div>
          </div>

          {/* Feedback Text */}
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
              {isReject ? "Reason for Rejection" : "Feedback"}
            </label>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder={
                isReject
                  ? "Explain why this task is being rejected..."
                  : "Share your feedback or revision notes..."
              }
              rows={4}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm
                         focus:outline-none focus:ring-2 focus:ring-indigo-500/20
                         bg-white text-gray-900 placeholder:text-gray-400 resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-900
                       rounded-xl hover:bg-gray-100 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className={`inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold
                        text-white rounded-xl transition-all shadow-sm disabled:opacity-50
                        ${
                          isReject
                            ? "bg-red-600 hover:bg-red-700 shadow-red-100"
                            : "bg-amber-600 hover:bg-amber-700 shadow-amber-100"
                        }`}
          >
            <Send className="w-4 h-4" />
            {isLoading ? "Submitting..." : isReject ? "Reject" : "Send Feedback"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Task Card ────────────────────────────────────────────────────────────────

function ApprovalCard({
  task,
  onApprove,
  onReject,
  onFeedback,
  isActioning,
}: {
  task: ApprovalTask;
  onApprove: () => void;
  onReject: () => void;
  onFeedback: () => void;
  isActioning: boolean;
}) {
  const isInternal = task.status === "INTERNAL_REVIEW";
  const currentVersion = `v${(task.subTasks?.length || 0) + 1}`;

  return (
    <div className="bg-white rounded-[20px] border border-gray-100 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_4px_6px_-2px_rgba(0,0,0,0.05)] overflow-hidden">
      <div className="p-8 space-y-6">
        {/* Header Row */}
        <div className="flex items-start justify-between">
          <div className="space-y-0.5">
            <h3 className="text-base font-medium text-gray-900 tracking-tight">
              {task.title}
            </h3>
            <div className="flex items-center gap-2 text-xs font-medium text-gray-400">
              <span>{task.client?.companyName}</span>
              <span className="opacity-50">•</span>
              <span>Social Media</span> {/* Fallback or fetch from project/client */}
              <span className="opacity-50">•</span>
              <span>{currentVersion}</span>
            </div>
          </div>
          <span
            className={`px-3 py-1 text-[11px] font-bold uppercase tracking-wider rounded-lg ${
              isInternal
                ? "bg-[#FFF8E6] text-[#D97706]"
                : "bg-indigo-50 text-indigo-600"
            }`}
          >
            {isInternal ? "Internal Review" : "Client Review"}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={onApprove}
            disabled={isActioning}
            className="inline-flex items-center gap-2 px-5 py-2 text-xs font-medium text-white bg-[#00AB55] rounded-xl hover:bg-[#00964b] transition-all shadow-sm disabled:opacity-50"
          >
            <Check className="w-3.5 h-3.5" />
            Approve
          </button>
          
          <button
            onClick={onFeedback}
            disabled={isActioning}
            className="inline-flex items-center gap-2 px-5 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all shadow-sm disabled:opacity-50"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            Feedback
          </button>

          <button
            onClick={onReject}
            disabled={isActioning}
            className="inline-flex items-center gap-2 px-5 py-2 text-xs font-medium text-rose-500 bg-white border border-rose-100 rounded-xl hover:bg-rose-50 transition-all shadow-sm disabled:opacity-50"
          >
            <X className="w-3.5 h-3.5" />
            Reject
          </button>
        </div>

        {/* Iteration History */}
        {(task.subTasks?.length || 0) > 0 && (
          <div className="pt-6 border-t border-gray-100 space-y-4">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              Iteration History
            </p>
            <div className="space-y-4">
              {task.subTasks.map((sub, index) => {
                const isRejectedStatus = sub.description?.toLowerCase().includes("rejected");
                const cleanDescription = sub.description?.replace(/^(Rejected — |Feedback — )/, "");
                
                return (
                  <div key={sub.id} className="flex items-center justify-between group">
                    <div className="flex items-center gap-4 flex-1">
                      <span className="text-sm font-medium text-gray-400 w-8">
                        v{index + 1}
                      </span>
                      <span
                        className={`px-3 py-1 text-[11px] font-bold uppercase tracking-wider rounded-full shadow-sm ${
                          isRejectedStatus
                            ? "bg-[#FFE4E6] text-[#E11D48]"
                            : "bg-[#FFF8E6] text-[#B45309]"
                        }`}
                      >
                        {isRejectedStatus ? "Rejected" : "Internal Review"}
                      </span>
                      <p className="text-xs font-medium text-gray-500 line-clamp-1 ml-3">
                        {cleanDescription}
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-gray-400 ml-4 tabular-nums">
                      {new Date(sub.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                );
              })}
              {/* Current Version Indicator if needed in history, though screenshot shows it as the final row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                  <span className="text-sm font-medium text-gray-400 w-8">v{task.subTasks.length + 1}</span>
                  <span className="px-3 py-1 text-[11px] font-bold uppercase tracking-wider rounded-full bg-[#F1F5F9] text-[#64748B] shadow-sm">
                    Open Task
                  </span>
                  <p className="text-xs font-medium text-gray-400 ml-3">
                    Current version awaiting review
                  </p>
                </div>
                <span className="text-sm font-semibold text-gray-400 ml-4 tabular-nums">
                  {new Date(task.updatedAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ApprovalsPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<string>("all");
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    actionType: "reject" | "feedback";
    task: ApprovalTask | null;
  }>({ isOpen: false, actionType: "reject", task: null });

  // Fetch current user profile
  const { data: profile } = useQuery({
    queryKey: ["profile"],
    queryFn: fetchProfile,
  });

  // Fetch approval tasks
  const statusFilter = activeTab === "all" ? undefined : activeTab;
  const {
    data: tasks = [],
    isLoading,
  } = useQuery({
    queryKey: ["approvals", statusFilter],
    queryFn: () => fetchApprovals(statusFilter),
  });

  // Mutation for approval actions
  const actionMutation = useMutation({
    mutationFn: (payload: {
      taskId: string;
      action: string;
      feedback?: string;
      reviewerId?: string;
      reviewerType?: string;
      reviewerName?: string;
    }) =>
      fetch("/api/approvals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }).then((res) => {
        if (!res.ok) throw new Error("Action failed");
        return res.json();
      }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["approvals"] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["allTasks"] });

      const actionLabel =
        variables.action === "approve"
          ? "approved"
          : variables.action === "reject"
          ? "rejected"
          : "feedback sent";

      toast.success(`Task ${actionLabel} successfully!`);
      setModalState({ isOpen: false, actionType: "reject", task: null });
    },
    onError: () => {
      toast.error("Something went wrong. Please try again.");
    },
  });

  const handleApprove = (task: ApprovalTask) => {
    actionMutation.mutate({ taskId: task.id, action: "approve" });
  };

  const handleOpenModal = (task: ApprovalTask, type: "reject" | "feedback") => {
    setModalState({ isOpen: true, actionType: type, task });
  };

  const handleModalSubmit = (feedback: string) => {
    if (!modalState.task || !profile) return;

    // Map profile data to ReviewerType enum
    let reviewerType: ReviewerType = "ADMIN";
    const userType = profile.userType;
    const role = profile.role;

    if (userType === "CLIENT") {
      reviewerType = "CLIENT";
    } else if (role === "TEAM_LEAD") {
      reviewerType = "TEAM_LEAD";
    } else if (role === "ACCOUNT_MANAGER") {
      reviewerType = "ACCOUNT_MANAGER";
    } else if (role === "ADMIN" || userType === "ADMIN_OWNER") {
      reviewerType = "ADMIN";
    }

    actionMutation.mutate({
      taskId: modalState.task.id,
      action: modalState.actionType,
      feedback,
      reviewerId: profile.id,
      reviewerType: reviewerType,
      reviewerName: profile.name,
    });
  };

  // Count badges
  const internalCount = tasks.filter(
    (t: ApprovalTask) => t.status === "INTERNAL_REVIEW"
  ).length;
  const clientCount = tasks.filter(
    (t: ApprovalTask) => t.status === "CLIENT_REVIEW"
  ).length;

  const tabCounts: Record<string, number> = {
    all: tasks.length,
    INTERNAL_REVIEW: internalCount,
    CLIENT_REVIEW: clientCount,
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-0.5">
        <h1 className="text-xl font-medium text-gray-900 tracking-tight">
          Approvals
        </h1>
        <p className="text-gray-500 text-xs font-medium">
          {tasks.length} items pending review
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-4">
        {TABS.filter(t => t.key !== 'all').map((tab) => {
          const isActive = activeTab === tab.key;
          
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 text-sm font-bold rounded-xl transition-all ${
                isActive
                  ? "bg-white text-gray-900 border border-gray-100 shadow-sm"
                  : "text-gray-400 hover:text-gray-600"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="flex items-center gap-3 text-gray-400">
            <Clock className="w-5 h-5 animate-spin" />
            <span className="text-sm font-medium">Loading approvals...</span>
          </div>
        </div>
      ) : tasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mb-4">
            <CheckCircle2 className="w-8 h-8 text-emerald-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-700 mb-1">
            All caught up!
          </h3>
          <p className="text-sm text-gray-400">
            No tasks are pending review right now.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {tasks.map((task: ApprovalTask) => (
            <ApprovalCard
              key={task.id}
              task={task}
              onApprove={() => handleApprove(task)}
              onReject={() => handleOpenModal(task, "reject")}
              onFeedback={() => handleOpenModal(task, "feedback")}
              isActioning={actionMutation.isPending}
            />
          ))}
        </div>
      )}

      {/* Feedback/Reject Modal */}
      <FeedbackModal
        isOpen={modalState.isOpen}
        onClose={() =>
          setModalState({ isOpen: false, actionType: "reject", task: null })
        }
        onSubmit={handleModalSubmit}
        currentUser={profile}
        actionType={modalState.actionType}
        taskTitle={modalState.task?.title ?? ""}
        isLoading={actionMutation.isPending}
      />
    </div>
  );
}
