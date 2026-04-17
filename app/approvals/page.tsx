"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle2,
  XCircle,
  MessageSquare,
  Clock,
  User,
  X,
  Send,
  ShieldCheck,
  Eye,
  Check,
  FileText,
  Download,
  Image as ImageIcon,
  Hash,
  Globe,
  Calendar,
  Film,
} from "lucide-react";
import { toast } from "react-hot-toast";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Attachment {
  id: string;
  fileName: string;
  fileUrl: string;
  mimeType: string;
  fileSize?: number;
}

interface CalendarCopyRef {
  id: string;
  content: string;
  caption?: string;
  hashtags?: string;
  platform?: string;
  mediaType?: string;
  publishDate?: string;
  publishTime?: string;
  status?: string;
  bucket?: { id: string; name: string } | null;
}

interface CalendarRef {
  id: string;
  name: string;
  objective?: string;
  copies: CalendarCopyRef[];
}

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
  calendarCopy?: CalendarCopyRef | null;
  calendar?: CalendarRef | null;
  attachments?: Attachment[];
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
  { key: "INTERNAL_REVIEW", label: "Internal Review", icon: ShieldCheck },
  { key: "CLIENT_REVIEW", label: "Client Review", icon: User },
] as const;

// ─── Copies Preview Modal (writer tasks) ─────────────────────────────────────

function CopiesPreviewModal({
  isOpen,
  onClose,
  task,
}: {
  isOpen: boolean;
  onClose: () => void;
  task: ApprovalTask | null;
}) {
  const [activeIdx, setActiveIdx] = useState(0);

  if (!isOpen || !task || !task.calendar) return null;

  const { calendar } = task;
  const copies = calendar.copies ?? [];
  const activeCopy = copies[activeIdx];

  const platformColor: Record<string, string> = {
    Instagram: "bg-pink-50 text-pink-600 border-pink-100",
    LinkedIn: "bg-blue-50 text-blue-700 border-blue-100",
    Twitter: "bg-sky-50 text-sky-600 border-sky-100",
    Facebook: "bg-indigo-50 text-indigo-600 border-indigo-100",
  };

  const statusColor = (s?: string) => {
    switch (s) {
      case "APPROVED": return "bg-emerald-50 text-emerald-600 border-emerald-100";
      case "UNDER_REVIEW": return "bg-amber-50 text-amber-600 border-amber-100";
      case "PUBLISHED": return "bg-violet-50 text-violet-600 border-violet-100";
      default: return "bg-gray-100 text-gray-500 border-gray-200";
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gray-950/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <div>
            <h2 className="text-sm font-bold text-gray-900">{task.title}</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {task.client?.companyName} · {copies.length} {copies.length === 1 ? "copy" : "copies"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* Left sidebar: copy navigator */}
          <div className="w-64 shrink-0 border-r border-gray-100 overflow-y-auto bg-gray-50/40 p-3 space-y-1.5">
            {/* Calendar objective */}
            {calendar.objective && (
              <div className="mb-3 px-3 py-2.5 bg-indigo-50 border border-indigo-100 rounded-lg">
                <p className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest mb-1">Objective</p>
                <p className="text-[11px] text-indigo-800 leading-relaxed">{calendar.objective}</p>
              </div>
            )}

            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest px-1 pb-1">
              Copies ({copies.length})
            </p>

            {copies.map((copy, idx) => (
              <button
                key={copy.id}
                onClick={() => setActiveIdx(idx)}
                className={`w-full text-left px-3 py-2.5 rounded-lg border transition-all ${activeIdx === idx
                  ? "bg-white border-indigo-200 shadow-sm"
                  : "border-transparent hover:bg-white hover:border-gray-100"
                  }`}
              >
                <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                  {copy.platform && (
                    <span className={`text-[9px] font-bold border px-1.5 py-0.5 rounded-full ${platformColor[copy.platform] ?? "bg-gray-50 text-gray-600 border-gray-100"}`}>
                      {copy.platform}
                    </span>
                  )}
                  {copy.mediaType && (
                    <span className="text-[9px] font-bold bg-violet-50 text-violet-600 border border-violet-100 px-1.5 py-0.5 rounded-full">
                      {copy.mediaType}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-gray-700 font-medium line-clamp-2 leading-snug">
                  {copy.content}
                </p>
                {copy.publishDate && (
                  <p className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
                    <Calendar className="w-2.5 h-2.5" />
                    {new Date(copy.publishDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    {copy.publishTime && ` · ${copy.publishTime}`}
                  </p>
                )}
              </button>
            ))}
          </div>

          {/* Right: active copy detail */}
          {activeCopy ? (
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* Meta pills row */}
              <div className="flex flex-wrap items-center gap-2">
                {activeCopy.platform && (
                  <span className={`inline-flex items-center gap-1 text-[10px] font-bold border px-2.5 py-1 rounded-full ${platformColor[activeCopy.platform] ?? "bg-gray-50 text-gray-600 border-gray-100"}`}>
                    <Globe className="w-3 h-3" /> {activeCopy.platform}
                  </span>
                )}
                {activeCopy.mediaType && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-violet-50 text-violet-600 border border-violet-100 px-2.5 py-1 rounded-full">
                    <Film className="w-3 h-3" /> {activeCopy.mediaType}
                  </span>
                )}
                {activeCopy.bucket && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-100 px-2.5 py-1 rounded-full">
                    <Hash className="w-3 h-3" /> {activeCopy.bucket.name}
                  </span>
                )}
                {activeCopy.publishDate && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-white text-gray-500 border border-gray-200 px-2.5 py-1 rounded-full">
                    <Calendar className="w-3 h-3" />
                    {new Date(activeCopy.publishDate).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                    {activeCopy.publishTime && ` · ${activeCopy.publishTime}`}
                  </span>
                )}
                {activeCopy.status && (
                  <span className={`ml-auto inline-flex text-[10px] font-bold border px-2.5 py-1 rounded-full ${statusColor(activeCopy.status)}`}>
                    {activeCopy.status}
                  </span>
                )}
              </div>

              {/* Creative copy */}
              <div className="space-y-2">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Creative Copy</p>
                <div className="bg-gray-50 border border-gray-100 rounded-lg p-4">
                  <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">{activeCopy.content}</p>
                </div>
              </div>

              {/* Caption */}
              {activeCopy.caption && (
                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Caption</p>
                  <div className="bg-gray-50 border border-gray-100 rounded-lg p-4">
                    <p className="text-sm text-gray-600 leading-relaxed italic">{activeCopy.caption}</p>
                  </div>
                </div>
              )}

              {/* Hashtags */}
              {activeCopy.hashtags && (
                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Hashtags</p>
                  <p className="text-sm font-semibold text-indigo-500 break-words">{activeCopy.hashtags}</p>
                </div>
              )}

              {/* Copy navigator dots */}
              {copies.length > 1 && (
                <div className="flex items-center gap-2 pt-2">
                  {copies.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveIdx(i)}
                      className={`w-2 h-2 rounded-full transition-all ${i === activeIdx ? "bg-indigo-500 scale-125" : "bg-gray-200 hover:bg-gray-300"}`}
                    />
                  ))}
                  <span className="ml-2 text-xs text-gray-400">{activeIdx + 1} / {copies.length}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400">
              <p className="text-sm">No copies found.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Design Preview Modal ─────────────────────────────────────────────────────

function DesignPreviewModal({
  isOpen,
  onClose,
  task,
}: {
  isOpen: boolean;
  onClose: () => void;
  task: ApprovalTask | null;
}) {
  const [activeFile, setActiveFile] = useState(0);

  if (!isOpen || !task) return null;

  const attachments = task.attachments ?? [];
  const copy = task.calendarCopy;
  const currentFile = attachments[activeFile];

  const isImage = (mime?: string) =>
    !!mime && mime.startsWith("image/");
  const isPdf = (mime?: string) =>
    mime === "application/pdf";

  const formatBytes = (bytes?: number) => {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-gray-950/70 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">{task.title}</h2>
            <p className="text-xs text-gray-400 mt-0.5">{task.client?.companyName}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex flex-1 min-h-0 overflow-hidden">

          {/* Left: Copy Reference */}
          <div className="w-72 shrink-0 border-r border-gray-100 overflow-y-auto p-5 space-y-4 bg-gray-50/50">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Copy Reference</p>

            {copy ? (
              <div className="space-y-3">
                {/* Meta pills */}
                <div className="flex flex-wrap gap-1.5">
                  {copy.platform && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-indigo-50 text-indigo-600 border border-indigo-100 px-2 py-0.5 rounded-full">
                      <Globe className="w-2.5 h-2.5" /> {copy.platform}
                    </span>
                  )}
                  {copy.mediaType && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-blue-50 text-blue-600 border border-blue-100 px-2 py-0.5 rounded-full">
                      <Film className="w-2.5 h-2.5" /> {copy.mediaType}
                    </span>
                  )}
                  {copy.bucket && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-violet-50 text-violet-600 border border-violet-100 px-2 py-0.5 rounded-full">
                      <Hash className="w-2.5 h-2.5" /> {copy.bucket.name}
                    </span>
                  )}
                  {copy.publishDate && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-100 px-2 py-0.5 rounded-full">
                      <Calendar className="w-2.5 h-2.5" />
                      {new Date(copy.publishDate).toLocaleDateString("en-US", {
                        month: "short", day: "numeric",
                      })}
                      {copy.publishTime && ` · ${copy.publishTime}`}
                    </span>
                  )}
                </div>

                {/* Copy content */}
                <div className="bg-white border border-gray-100 rounded-lg p-3 space-y-2">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Creative Copy</p>
                  <p className="text-xs text-gray-800 leading-relaxed whitespace-pre-wrap">{copy.content}</p>
                </div>

                {copy.caption && (
                  <div className="bg-white border border-gray-100 rounded-lg p-3 space-y-1.5">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Caption</p>
                    <p className="text-xs text-gray-600 leading-relaxed italic">{copy.caption}</p>
                  </div>
                )}

                {copy.hashtags && (
                  <div className="bg-white border border-gray-100 rounded-lg p-3 space-y-1.5">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Hashtags</p>
                    <p className="text-xs text-indigo-500 font-medium break-words">{copy.hashtags}</p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-gray-400 italic">No copy linked to this task.</p>
            )}

            {/* File list */}
            {attachments.length > 0 && (
              <div className="pt-3 border-t border-gray-100 space-y-2">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  Uploaded Files ({attachments.length})
                </p>
                <div className="space-y-1">
                  {attachments.map((file, idx) => (
                    <button
                      key={file.id}
                      onClick={() => setActiveFile(idx)}
                      className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-left transition-all text-xs font-medium ${activeFile === idx
                        ? "bg-indigo-50 text-indigo-700 border border-indigo-100"
                        : "text-gray-600 hover:bg-gray-100 border border-transparent"
                        }`}
                    >
                      {isImage(file.mimeType)
                        ? <ImageIcon className="w-3.5 h-3.5 shrink-0" />
                        : <FileText className="w-3.5 h-3.5 shrink-0" />
                      }
                      <span className="truncate">{file.fileName}</span>
                      {file.fileSize && (
                        <span className="ml-auto shrink-0 text-[10px] text-gray-400">{formatBytes(file.fileSize)}</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right: File Preview */}
          <div className="flex-1 overflow-auto bg-gray-900 flex flex-col items-center justify-center p-6">
            {attachments.length === 0 ? (
              <div className="flex flex-col items-center gap-3 text-gray-500">
                <ImageIcon className="w-10 h-10 opacity-40" />
                <p className="text-sm font-medium">No files uploaded yet</p>
              </div>
            ) : currentFile ? (
              <div className="w-full h-full flex flex-col items-center gap-4">
                {/* Image preview */}
                {isImage(currentFile.mimeType) && (
                  <img
                    src={currentFile.fileUrl}
                    alt={currentFile.fileName}
                    className="max-w-full max-h-[calc(90vh-180px)] object-contain rounded-lg shadow-2xl"
                  />
                )}

                {/* PDF preview */}
                {isPdf(currentFile.mimeType) && (
                  <iframe
                    src={currentFile.fileUrl}
                    className="w-full h-[calc(90vh-180px)] rounded-lg"
                    title={currentFile.fileName}
                  />
                )}

                {/* Other file types — download link */}
                {!isImage(currentFile.mimeType) && !isPdf(currentFile.mimeType) && (
                  <div className="flex flex-col items-center gap-4 text-white">
                    <div className="w-20 h-20 bg-white/10 rounded-2xl flex items-center justify-center">
                      <FileText className="w-10 h-10 text-white/60" />
                    </div>
                    <p className="text-sm font-medium">{currentFile.fileName}</p>
                    <p className="text-xs text-white/50">{currentFile.mimeType}</p>
                    <a
                      href={currentFile.fileUrl}
                      download={currentFile.fileName}
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-gray-900 rounded-lg text-sm font-semibold hover:bg-gray-100 transition-all"
                    >
                      <Download className="w-4 h-4" />
                      Download File
                    </a>
                  </div>
                )}

                {/* File name label */}
                {(isImage(currentFile.mimeType) || isPdf(currentFile.mimeType)) && (
                  <div className="flex items-center gap-3">
                    <p className="text-xs text-white/60 font-medium">{currentFile.fileName}</p>
                    <a
                      href={currentFile.fileUrl}
                      download={currentFile.fileName}
                      className="inline-flex items-center gap-1.5 text-xs text-white/60 hover:text-white transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Download
                    </a>
                  </div>
                )}

                {/* Multi-file navigation dots */}
                {attachments.length > 1 && (
                  <div className="flex items-center gap-2">
                    {attachments.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setActiveFile(idx)}
                        className={`w-2 h-2 rounded-full transition-all ${idx === activeFile ? "bg-white" : "bg-white/30 hover:bg-white/60"}`}
                      />
                    ))}
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

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
      <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-lg shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
        <div className={`px-6 py-4 flex items-center justify-between ${isReject
          ? "bg-gradient-to-r from-red-500 to-rose-500"
          : "bg-gradient-to-r from-amber-500 to-orange-500"}`}
        >
          <div className="flex items-center gap-3">
            {isReject
              ? <XCircle className="w-5 h-5 text-white" />
              : <MessageSquare className="w-5 h-5 text-white" />}
            <h3 className="text-sm font-medium text-white">
              {isReject ? "Reject Task" : "Give Feedback"}
            </h3>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-500 font-medium mb-1">Task</p>
            <p className="text-xs font-medium text-gray-900">{taskTitle}</p>
          </div>

          <div className="bg-gray-50 rounded-lg p-3 flex flex-col gap-1">
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

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
              {isReject ? "Reason for Rejection" : "Feedback"}
            </label>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder={isReject
                ? "Explain why this task is being rejected..."
                : "Share your feedback or revision notes..."}
              rows={4}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 bg-white text-gray-900 placeholder:text-gray-400 resize-none"
            />
          </div>
        </div>

        <div className="px-6 py-4 bg-gray-50 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className={`inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white rounded-lg transition-all shadow-sm disabled:opacity-50 ${isReject
              ? "bg-red-600 hover:bg-red-700 shadow-red-100"
              : "bg-amber-600 hover:bg-amber-700 shadow-amber-100"}`}
          >
            <Send className="w-4 h-4" />
            {isLoading ? "Submitting..." : isReject ? "Reject" : "Send Feedback"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Approval Card ────────────────────────────────────────────────────────────

function ApprovalCard({
  task,
  onApprove,
  onReject,
  onFeedback,
  onPreview,
  onPreviewCopies,
  isActioning,
}: {
  task: ApprovalTask;
  onApprove: () => void;
  onReject: () => void;
  onFeedback: () => void;
  onPreview: () => void;
  onPreviewCopies: () => void;
  isActioning: boolean;
}) {
  const isInternal = task.status === "INTERNAL_REVIEW";
  const currentVersion = `v${(task.subTasks?.length || 0) + 1}`;
  const approveLabel = isInternal ? "Approve → Client Review" : "Approve & Publish";
  const isDesignerTask = !!task.calendarCopy;
  const hasFiles = (task.attachments?.length ?? 0) > 0;
  const isWriterTask = !isDesignerTask;
  const copyCount = task.calendar?.copies?.length ?? 0;

  return (
    <div className="bg-white rounded-lg border border-gray-100 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_4px_6px_-2px_rgba(0,0,0,0.05)] overflow-hidden">
      <div className="p-6 space-y-5">

        {/* Header Row */}
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-0.5 min-w-0">
            <h3 className="text-base font-medium text-gray-900 tracking-tight truncate">
              {task.title}
            </h3>
            <div className="flex items-center gap-2 text-xs font-medium text-gray-400 flex-wrap">
              <span>{task.client?.companyName}</span>
              {task.calendarCopy?.platform && (
                <>
                  <span className="opacity-50">•</span>
                  <span>{task.calendarCopy.platform}</span>
                </>
              )}
              {task.calendarCopy?.publishDate && (
                <>
                  <span className="opacity-50">•</span>
                  <span>
                    {new Date(task.calendarCopy.publishDate).toLocaleDateString("en-US", {
                      month: "short", day: "numeric",
                    })}
                  </span>
                </>
              )}
              <span className="opacity-50">•</span>
              <span>{currentVersion}</span>
            </div>
          </div>
          <span
            className={`shrink-0 px-3 py-1 text-[11px] font-bold uppercase tracking-wider rounded-lg ${isInternal
              ? "bg-[#FFF8E6] text-[#D97706]"
              : "bg-indigo-50 text-indigo-600"}`}
          >
            {isInternal ? "Internal Review" : "Client Review"}
          </span>
        </div>

        {/* Writer task: copies summary strip */}
        {isWriterTask && copyCount > 0 && task.calendar && (
          <div className="bg-gray-50 border border-gray-100 rounded-lg px-4 py-3 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-emerald-100 flex items-center justify-center shrink-0">
                  <FileText className="w-3.5 h-3.5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Calendar Copies</p>
                  <p className="text-xs text-gray-600 font-medium">
                    {copyCount} {copyCount === 1 ? "copy" : "copies"} submitted for review
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100 px-2 py-0.5 rounded-full">
                {copyCount} copies
              </span>
            </div>

            {/* First 2 copies as a quick preview */}
            <div className="space-y-1.5 pt-1">
              {task.calendar.copies.slice(0, 2).map((copy, idx) => (
                <div key={copy.id} className="flex items-start gap-2">
                  <span className="text-[10px] font-bold text-gray-300 w-4 pt-0.5">#{idx + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                      {copy.platform && (
                        <span className="text-[9px] font-bold bg-white border border-gray-200 text-gray-500 px-1.5 py-0.5 rounded-full">{copy.platform}</span>
                      )}
                      {copy.mediaType && (
                        <span className="text-[9px] font-bold bg-white border border-gray-200 text-gray-500 px-1.5 py-0.5 rounded-full">{copy.mediaType}</span>
                      )}
                      {copy.publishDate && (
                        <span className="text-[9px] font-bold text-gray-400">
                          {new Date(copy.publishDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-gray-600 line-clamp-1 leading-relaxed">{copy.content}</p>
                  </div>
                </div>
              ))}
              {copyCount > 2 && (
                <p className="text-[10px] text-gray-400 pl-6">+{copyCount - 2} more {copyCount - 2 === 1 ? "copy" : "copies"}</p>
              )}
            </div>
          </div>
        )}

        {/* Designer task: copy reference snippet */}
        {isDesignerTask && task.calendarCopy && (
          <div className="bg-gray-50 border border-gray-100 rounded-lg px-4 py-3 flex items-start gap-3">
            <div className="w-6 h-6 rounded-md bg-indigo-100 flex items-center justify-center shrink-0 mt-0.5">
              <FileText className="w-3.5 h-3.5 text-indigo-600" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Copy Reference</p>
              <p className="text-xs text-gray-700 font-medium line-clamp-2 leading-relaxed">
                {task.calendarCopy.content}
              </p>
              {task.calendarCopy.caption && (
                <p className="text-[11px] text-gray-400 italic mt-1 line-clamp-1">{task.calendarCopy.caption}</p>
              )}
            </div>
            {hasFiles && (
              <span className="ml-auto shrink-0 inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100 px-2 py-0.5 rounded-full">
                <ImageIcon className="w-2.5 h-2.5" />
                {task.attachments!.length} file{task.attachments!.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={onApprove}
            disabled={isActioning}
            className="inline-flex items-center gap-2 px-5 py-2 text-xs font-medium text-white bg-[#00AB55] rounded-lg hover:bg-[#00964b] transition-all shadow-sm disabled:opacity-50"
          >
            <Check className="w-3.5 h-3.5" />
            {approveLabel}
          </button>

          <button
            onClick={onFeedback}
            disabled={isActioning}
            className="inline-flex items-center gap-2 px-5 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-all shadow-sm disabled:opacity-50"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            Feedback
          </button>

          <button
            onClick={onReject}
            disabled={isActioning}
            className="inline-flex items-center gap-2 px-5 py-2 text-xs font-medium text-rose-500 bg-white border border-rose-100 rounded-lg hover:bg-rose-50 transition-all shadow-sm disabled:opacity-50"
          >
            <X className="w-3.5 h-3.5" />
            Reject
          </button>

          {/* Preview Copies — writer tasks */}
          {isWriterTask && copyCount > 0 && (
            <button
              onClick={onPreviewCopies}
              className="ml-auto inline-flex items-center gap-2 px-5 py-2 text-xs font-medium text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-lg hover:bg-emerald-100 transition-all shadow-sm"
            >
              <Eye className="w-3.5 h-3.5" />
              Preview Copies ({copyCount})
            </button>
          )}

          {/* Preview Design — designer tasks with uploaded files */}
          {isDesignerTask && hasFiles && (
            <button
              onClick={onPreview}
              className="ml-auto inline-flex items-center gap-2 px-5 py-2 text-xs font-medium text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-lg hover:bg-indigo-100 transition-all shadow-sm"
            >
              <Eye className="w-3.5 h-3.5" />
              Preview Design
            </button>
          )}
        </div>

        {/* Iteration History */}
        {(task.subTasks?.length || 0) > 0 && (
          <div className="pt-5 border-t border-gray-100 space-y-4">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              Iteration History
            </p>
            <div className="space-y-3">
              {task.subTasks.map((sub, index) => {
                const isRejectedStatus = sub.description?.toLowerCase().includes("rejected");
                const cleanDescription = sub.description?.replace(/^(Rejected — |Feedback — )/, "");

                return (
                  <div key={sub.id} className="flex items-center justify-between group">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <span className="text-sm font-medium text-gray-400 w-8 shrink-0">v{index + 1}</span>
                      <span className={`shrink-0 px-3 py-1 text-[11px] font-bold uppercase tracking-wider rounded-full shadow-sm ${isRejectedStatus
                        ? "bg-[#FFE4E6] text-[#E11D48]"
                        : "bg-[#FFF8E6] text-[#B45309]"}`}>
                        {isRejectedStatus ? "Rejected" : "Feedback"}
                      </span>
                      <p className="text-xs font-medium text-gray-500 line-clamp-1 min-w-0">{cleanDescription}</p>
                    </div>
                    <span className="text-xs font-semibold text-gray-400 ml-4 tabular-nums shrink-0">
                      {new Date(sub.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </span>
                  </div>
                );
              })}

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                  <span className="text-sm font-medium text-gray-400 w-8">v{task.subTasks.length + 1}</span>
                  <span className="px-3 py-1 text-[11px] font-bold uppercase tracking-wider rounded-full bg-[#F1F5F9] text-[#64748B] shadow-sm">
                    Current
                  </span>
                  <p className="text-xs font-medium text-gray-400 ml-0">Awaiting review</p>
                </div>
                <span className="text-xs font-semibold text-gray-400 ml-4 tabular-nums">
                  {new Date(task.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
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
  const [activeTab, setActiveTab] = useState<string>("INTERNAL_REVIEW");

  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    actionType: "reject" | "feedback";
    task: ApprovalTask | null;
  }>({ isOpen: false, actionType: "reject", task: null });

  const [previewTask, setPreviewTask] = useState<ApprovalTask | null>(null);
  const [copiesPreviewTask, setCopiesPreviewTask] = useState<ApprovalTask | null>(null);

  const { data: profile } = useQuery({ queryKey: ["profile"], queryFn: fetchProfile });

  const statusFilter = activeTab === "all" ? undefined : activeTab;
  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ["approvals", statusFilter],
    queryFn: () => fetchApprovals(statusFilter),
  });

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

      const label =
        variables.action === "approve" ? "approved"
          : variables.action === "reject" ? "rejected"
            : "feedback sent";

      toast.success(`Task ${label} successfully!`);
      setModalState({ isOpen: false, actionType: "reject", task: null });
    },
    onError: () => toast.error("Something went wrong. Please try again."),
  });

  const handleApprove = (task: ApprovalTask) => {
    actionMutation.mutate({ taskId: task.id, action: "approve" });
  };

  const handleOpenModal = (task: ApprovalTask, type: "reject" | "feedback") => {
    setModalState({ isOpen: true, actionType: type, task });
  };

  const handleModalSubmit = (feedback: string) => {
    if (!modalState.task || !profile) return;

    let reviewerType: ReviewerType = "ADMIN";
    if (profile.userType === "CLIENT") reviewerType = "CLIENT";
    else if (profile.role === "TEAM_LEAD") reviewerType = "TEAM_LEAD";
    else if (profile.role === "ACCOUNT_MANAGER") reviewerType = "ACCOUNT_MANAGER";

    actionMutation.mutate({
      taskId: modalState.task.id,
      action: modalState.actionType,
      feedback,
      reviewerId: profile.id,
      reviewerType,
      reviewerName: profile.name,
    });
  };

  const internalCount = tasks.filter((t: ApprovalTask) => t.status === "INTERNAL_REVIEW").length;
  const clientCount = tasks.filter((t: ApprovalTask) => t.status === "CLIENT_REVIEW").length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-0.5">
        <h1 className="text-2xl font-semibold text-gray-900 mb-1">Approvals</h1>
        <p className="text-gray-400 text-sm">{tasks.length} items pending review</p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-4">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          const count = tab.key === "INTERNAL_REVIEW" ? internalCount : clientCount;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-lg transition-all ${isActive
                ? "bg-white text-gray-900 border border-gray-100 shadow-sm"
                : "text-gray-400 hover:text-gray-600"}`}
            >
              {tab.label}
              {count > 0 && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${isActive ? "bg-gray-100 text-gray-600" : "bg-gray-100 text-gray-400"}`}>
                  {count}
                </span>
              )}
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
          <h3 className="text-lg font-semibold text-gray-700 mb-1">All caught up!</h3>
          <p className="text-sm text-gray-400">No tasks are pending review right now.</p>
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
              onPreview={() => setPreviewTask(task)}
              onPreviewCopies={() => setCopiesPreviewTask(task)}
              isActioning={actionMutation.isPending}
            />
          ))}
        </div>
      )}

      {/* Feedback / Reject Modal */}
      <FeedbackModal
        isOpen={modalState.isOpen}
        onClose={() => setModalState({ isOpen: false, actionType: "reject", task: null })}
        onSubmit={handleModalSubmit}
        currentUser={profile}
        actionType={modalState.actionType}
        taskTitle={modalState.task?.title ?? ""}
        isLoading={actionMutation.isPending}
      />

      {/* Design Preview Modal (designer tasks) */}
      <DesignPreviewModal
        isOpen={!!previewTask}
        onClose={() => setPreviewTask(null)}
        task={previewTask}
      />

      {/* Copies Preview Modal (writer tasks) */}
      <CopiesPreviewModal
        isOpen={!!copiesPreviewTask}
        onClose={() => setCopiesPreviewTask(null)}
        task={copiesPreviewTask}
      />
    </div>
  );
}
