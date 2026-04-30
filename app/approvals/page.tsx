"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
  ChevronRight,
  ChevronDown,
  BookOpen,
  Building2,
} from "lucide-react";
import { toast } from "react-hot-toast";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Attachment {
  id: string;
  fileName: string;
  fileUrl: string;
  mimeType: string;
  fileSize?: number;
  platform?: string;
  platformType?: string;
}

// Returns CSS aspect-ratio value based on platform + type
function getAspectRatio(platform?: string | null, platformType?: string | null): string {
  if (platform === 'Twitter') return '16/9';
  if (platform === 'Instagram') {
    if (platformType === 'story' || platformType === 'reel') return '9/16';
    return '4/5';
  }
  if (platform === 'Facebook') {
    if (platformType === 'story') return '9/16';
    return '4/5';
  }
  if (platform === 'LinkedIn') return '4/5';
  return '4/5';
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
  calendarCopyId?: string | null;
  calendarCopy?: CalendarCopyRef | null;
  calendar?: CalendarRef | null;
  calendarId?: string | null;
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

const fetchAllCalendarTasks = async (): Promise<ApprovalTask[]> => {
  const res = await fetch("/api/approvals?calendarOnly=true");
  if (!res.ok) throw new Error("Failed to fetch calendar tasks");
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
  // { key: "CLIENT_REVIEW", label: "Client Review", icon: User },
] as const;

// ─── Calendar Approval Card (writer tasks) ────────────────────────────────────

const TASK_STATUS_BADGE: Record<string, { label: string; className: string }> = {
  INTERNAL_REVIEW: { label: "Internal Review", className: "bg-[#FFF8E6] text-[#D97706]" },
  CLIENT_REVIEW: { label: "Client Review", className: "bg-indigo-50 text-indigo-600" },
  APPROVED: { label: "Approved", className: "bg-emerald-50 text-emerald-700" },
};

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

  const isImage = (mime?: string) => !!mime && mime.startsWith("image/");
  const isPdf = (mime?: string) => mime === "application/pdf";

  const formatBytes = (bytes?: number) => {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gray-950/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden">
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

        <div className="flex flex-1 min-h-0 overflow-hidden">
          <div className="w-72 shrink-0 border-r border-gray-100 overflow-y-auto p-5 space-y-4 bg-gray-50/50">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Copy Reference</p>
            {copy ? (
              <div className="space-y-3">
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
                      {new Date(copy.publishDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      {copy.publishTime && ` · ${copy.publishTime}`}
                    </span>
                  )}
                </div>
                <div className="bg-white border border-gray-100 rounded-lg p-3 space-y-2">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Creative Copy</p>
                  <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">{copy.content}</p>
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

            {attachments.length > 0 && (() => {
              const PILL: Record<string, string> = {
                Instagram: 'bg-pink-50 text-pink-600 border-pink-100',
                LinkedIn:  'bg-blue-50 text-blue-700 border-blue-100',
                Twitter:   'bg-sky-50 text-sky-600 border-sky-100',
                Facebook:  'bg-indigo-50 text-indigo-600 border-indigo-100',
              };
              const pill = (p: string) => PILL[p] ?? 'bg-gray-50 text-gray-500 border-gray-200';

              // Group files by platform; ungrouped files go under 'General'
              const groups: Record<string, Array<{ file: Attachment; idx: number }>> = {};
              attachments.forEach((file, idx) => {
                const key = file.platform || 'General';
                if (!groups[key]) groups[key] = [];
                groups[key].push({ file, idx });
              });
              const hasPlatforms = Object.keys(groups).some(k => k !== 'General');

              return (
                <div className="pt-3 border-t border-gray-100 space-y-3">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    Uploaded Files ({attachments.length})
                  </p>
                  {Object.entries(groups).map(([platform, items]) => (
                    <div key={platform} className="space-y-1">
                      {hasPlatforms && (
                        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[10px] font-bold ${pill(platform)}`}>
                          <Globe className="w-3 h-3 shrink-0" />
                          {platform}
                          {items[0]?.file.platformType && (
                            <span className="capitalize opacity-80">· {items[0].file.platformType}</span>
                          )}
                          <span className="ml-auto opacity-60">{items.length} file{items.length !== 1 ? 's' : ''}</span>
                        </div>
                      )}
                      {items.map(({ file, idx }) => (
                        <button
                          key={file.id}
                          onClick={() => setActiveFile(idx)}
                          className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-left transition-all text-xs font-medium ${activeFile === idx
                            ? "bg-indigo-50 text-indigo-700 border border-indigo-100"
                            : "text-gray-600 hover:bg-gray-100 border border-transparent"
                          }`}
                        >
                          {isImage(file.mimeType) ? (
                            <ImageIcon className="w-3.5 h-3.5 shrink-0" />
                          ) : (
                            <FileText className="w-3.5 h-3.5 shrink-0" />
                          )}
                          <span className="truncate">{file.fileName}</span>
                          {file.fileSize && (
                            <span className="ml-auto shrink-0 text-[10px] text-gray-400">{formatBytes(file.fileSize)}</span>
                          )}
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>

          <div className="flex-1 overflow-auto bg-gray-900 flex flex-col items-center justify-center p-6 gap-4">
            {attachments.length === 0 ? (
              <div className="flex flex-col items-center gap-3 text-gray-500">
                <ImageIcon className="w-10 h-10 opacity-40" />
                <p className="text-sm font-medium">No files uploaded yet</p>
              </div>
            ) : currentFile ? (
              <>
                {/* Platform + type badge above preview */}
                {currentFile.platform && (
                  <div className="flex items-center gap-2 flex-wrap justify-center shrink-0">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-white/10 text-white border border-white/20">
                      <Globe className="w-3 h-3" />
                      {currentFile.platform}
                    </span>
                    {currentFile.platformType && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-white/10 text-white border border-white/20 capitalize">
                        {currentFile.platformType}
                      </span>
                    )}
                    {currentFile.platform && (
                      <span className="text-[10px] text-white/40 font-medium">
                        {getAspectRatio(currentFile.platform, currentFile.platformType).replace('/', ' : ')} ratio
                      </span>
                    )}
                  </div>
                )}

                {/* Aspect-ratio-constrained preview */}
                {isImage(currentFile.mimeType) && (
                  <img
                    src={currentFile.fileUrl}
                    alt={currentFile.fileName}
                    className="rounded-lg shadow-2xl shrink-0 block"
                    style={{
                      aspectRatio: getAspectRatio(currentFile.platform, currentFile.platformType),
                      maxHeight: 'calc(90vh - 220px)',
                      maxWidth: '100%',
                      objectFit: 'cover',
                    }}
                  />
                )}

                {isPdf(currentFile.mimeType) && (
                  <iframe
                    src={currentFile.fileUrl}
                    className="w-full rounded-lg shrink-0"
                    style={{ height: 'calc(90vh - 220px)' }}
                    title={currentFile.fileName}
                  />
                )}

                {!isImage(currentFile.mimeType) && !isPdf(currentFile.mimeType) && (
                  <div className="flex flex-col items-center gap-4 text-white shrink-0">
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

                {/* File name + download */}
                <div className="flex items-center gap-3 flex-wrap justify-center shrink-0">
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

                {/* Dot nav */}
                {attachments.length > 1 && (
                  <div className="flex items-center gap-2 shrink-0">
                    {attachments.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setActiveFile(idx)}
                        className={`w-2 h-2 rounded-full transition-all ${idx === activeFile ? "bg-white" : "bg-white/30 hover:bg-white/60"}`}
                      />
                    ))}
                  </div>
                )}
              </>
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
        <div
          className={`px-6 py-4 flex items-center justify-between ${isReject
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
                {currentUser?.roles?.[0]?.replace(/_/g, ' ') || currentUser?.userType || "User"}
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
              placeholder={
                isReject
                  ? "Explain why this task is being rejected..."
                  : "Share your feedback or revision notes..."
              }
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

// ─── Design Approval Card (designer tasks) ────────────────────────────────────

function DesignApprovalCard({
  task,
  onApprove,
  onReject,
  onFeedback,
  onPreview,
  isActioning,
}: {
  task: ApprovalTask;
  onApprove: () => void;
  onReject: () => void;
  onFeedback: () => void;
  onPreview: () => void;
  isActioning: boolean;
}) {
  const isInternal = task.status === "INTERNAL_REVIEW";
  const currentVersion = `v${(task.subTasks?.length || 0) + 1}`;
  const approveLabel = isInternal ? "Approve → Client Review" : "Approve & Publish";
  const hasFiles = (task.attachments?.length ?? 0) > 0;
  const copy = task.calendarCopy;

  return (
    <div className="bg-white rounded-lg border border-gray-100 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_4px_6px_-2px_rgba(0,0,0,0.05)] overflow-hidden">
      <div className="p-6 space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-0.5 min-w-0">
            <h3 className="text-base font-medium text-gray-900 tracking-tight truncate">{task.title}</h3>
            <div className="flex items-center gap-2 text-xs font-medium text-gray-400 flex-wrap">
              <span>{task.client?.companyName}</span>
              {copy?.platform && (
                <>
                  <span className="opacity-50">•</span>
                  <span>{copy.platform}</span>
                </>
              )}
              {copy?.publishDate && (
                <>
                  <span className="opacity-50">•</span>
                  <span>
                    {new Date(copy.publishDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </span>
                </>
              )}
              <span className="opacity-50">•</span>
              <span>{currentVersion}</span>
            </div>
          </div>
          <span
            className={`shrink-0 px-3 py-1 text-[11px] font-bold uppercase tracking-wider rounded-lg ${isInternal ? "bg-[#FFF8E6] text-[#D97706]" : "bg-indigo-50 text-indigo-600"
              }`}
          >
            {isInternal ? "Internal Review" : ""}
          </span>
        </div>

        {copy && (
          <div className="bg-gray-50 border border-gray-100 rounded-lg px-4 py-3 flex items-start gap-3">
            <div className="w-6 h-6 rounded-md bg-indigo-100 flex items-center justify-center shrink-0 mt-0.5">
              <FileText className="w-3.5 h-3.5 text-indigo-600" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Copy Reference</p>
              <p className="text-xs text-gray-700 font-medium line-clamp-2 leading-relaxed">{copy.content}</p>
              {copy.caption && (
                <p className="text-[11px] text-gray-400 italic mt-1 line-clamp-1">{copy.caption}</p>
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
          {hasFiles && (
            <button
              onClick={onPreview}
              className="ml-auto inline-flex items-center gap-2 px-5 py-2 text-xs font-medium text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-lg hover:bg-indigo-100 transition-all shadow-sm"
            >
              <Eye className="w-3.5 h-3.5" />
              Preview Design
            </button>
          )}
        </div>

        {(task.subTasks?.length || 0) > 0 && (
          <div className="pt-5 border-t border-gray-100 space-y-4">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Iteration History</p>
            <div className="space-y-3">
              {task.subTasks.map((sub, index) => {
                const isRejectedStatus = sub.description?.toLowerCase().includes("rejected");
                const cleanDescription = sub.description?.replace(/^(Rejected — |Feedback — )/, "");
                return (
                  <div key={sub.id} className="flex items-center justify-between group">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <span className="text-sm font-medium text-gray-400 w-8 shrink-0">v{index + 1}</span>
                      <span
                        className={`shrink-0 px-3 py-1 text-[11px] font-bold uppercase tracking-wider rounded-full shadow-sm ${isRejectedStatus ? "bg-[#FFE4E6] text-[#E11D48]" : "bg-[#FFF8E6] text-[#B45309]"
                          }`}
                      >
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
                  <p className="text-xs font-medium text-gray-400">Awaiting review</p>
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

// ─── Client Calendar Group ────────────────────────────────────────────────────

function ClientCalendarGroup({
  client,
  tasks,
}: {
  client: { id: string; companyName: string };
  tasks: ApprovalTask[];
}) {
  const [open, setOpen] = useState(true);
  const isMulti = tasks.length > 1;

  const statusCounts = tasks.reduce<Record<string, number>>((acc, t) => {
    acc[t.status] = (acc[t.status] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Client header row */}
      <div
        className={`flex items-center gap-3 px-5 py-4 border-b border-gray-50 ${
          isMulti ? "cursor-pointer hover:bg-gray-50/60 transition-colors" : ""
        }`}
        onClick={isMulti ? () => setOpen((v) => !v) : undefined}
      >
        <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
          <Building2 className="w-4 h-4 text-indigo-600" />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-gray-900 truncate">{client.companyName}</p>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <span className="text-[10px] font-semibold text-gray-400">
              {tasks.length} calendar{tasks.length !== 1 ? "s" : ""}
            </span>
            {statusCounts["INTERNAL_REVIEW"] && (
              <span className="text-[10px] font-bold bg-amber-50 text-amber-600 border border-amber-100 px-1.5 py-0.5 rounded-full">
                {statusCounts["INTERNAL_REVIEW"]} internal review
              </span>
            )}
            {statusCounts["CLIENT_REVIEW"] && (
              <span className="text-[10px] font-bold bg-indigo-50 text-indigo-600 border border-indigo-100 px-1.5 py-0.5 rounded-full">
                {statusCounts["CLIENT_REVIEW"]} client review
              </span>
            )}
            {statusCounts["APPROVED"] && (
              <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 px-1.5 py-0.5 rounded-full">
                {statusCounts["APPROVED"]} approved
              </span>
            )}
          </div>
        </div>

        {isMulti && (
          <ChevronDown
            className={`w-4 h-4 text-gray-400 shrink-0 transition-transform duration-200 ${
              open ? "rotate-180" : ""
            }`}
          />
        )}
      </div>

      {/* Calendar cards — always shown for single, toggleable for multi */}
      {(!isMulti || open) && (
        <div className="divide-y divide-gray-50">
          {tasks.map((task) => (
            <CalendarApprovalCardInline key={task.id} task={task} />
          ))}
        </div>
      )}
    </div>
  );
}

// Inline variant of CalendarApprovalCard (no outer border/shadow — sits inside the group)
function CalendarApprovalCardInline({ task }: { task: ApprovalTask }) {
  const router = useRouter();
  const calendar = task.calendar!;
  const copyCount = calendar.copies?.length ?? 0;
  const badge = TASK_STATUS_BADGE[task.status] ?? { label: task.status, className: "bg-gray-100 text-gray-500" };

  const platforms = Array.from(
    new Set(calendar.copies?.map((c) => c.platform).filter(Boolean))
  ) as string[];

  return (
    <div
      className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-gray-50/60 transition-colors group"
      onClick={() => router.push(`/approvals/calendar/${calendar.id}`)}
    >
      <div className="w-7 h-7 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0 group-hover:border-indigo-100 group-hover:bg-indigo-50 transition-colors">
        <BookOpen className="w-3.5 h-3.5 text-gray-400 group-hover:text-indigo-500 transition-colors" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-800 truncate group-hover:text-indigo-700 transition-colors">
          {task.title}
        </p>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          <span className="text-[11px] text-gray-400">{task.project?.name}</span>
          {task.assignedTo && (
            <>
              <span className="text-gray-200">·</span>
              <span className="text-[11px] text-gray-400 flex items-center gap-1">
                <User className="w-3 h-3" />
                {task.assignedTo.name}
              </span>
            </>
          )}
          <span className="text-gray-200">·</span>
          <span className="text-[11px] text-gray-400 flex items-center gap-1">
            <FileText className="w-3 h-3" />
            {copyCount} {copyCount === 1 ? "copy" : "copies"}
          </span>
          {platforms.slice(0, 3).map((p) => (
            <span
              key={p}
              className="text-[9px] font-bold bg-gray-50 border border-gray-200 text-gray-400 px-1.5 py-0.5 rounded-full"
            >
              {p}
            </span>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${badge.className}`}>
          {badge.label}
        </span>
        <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-indigo-400 transition-colors" />
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

  const { data: profile } = useQuery({ queryKey: ["profile"], queryFn: fetchProfile });

  // All calendars (INTERNAL_REVIEW + CLIENT_REVIEW + APPROVED) — not tab-filtered
  const { data: allCalendarTasks = [], isLoading: calLoading } = useQuery({
    queryKey: ["approvals-calendars"],
    queryFn: fetchAllCalendarTasks,
  });

  // Tab-filtered tasks for design approvals only
  const { data: tabTasks = [], isLoading: tabLoading } = useQuery({
    queryKey: ["approvals", activeTab],
    queryFn: () => fetchApprovals(activeTab),
  });

  const calendarTasks = allCalendarTasks.filter(
    (t: ApprovalTask) => t.calendarId && !t.calendarCopyId && t.calendar
  );
  const designTasks = tabTasks.filter((t: ApprovalTask) => !!t.calendarCopyId);

  // Group calendar tasks by client
  const calendarsByClient = calendarTasks.reduce<
    Record<string, { client: { id: string; companyName: string }; tasks: ApprovalTask[] }>
  >((acc, task) => {
    const clientId = task.client.id;
    if (!acc[clientId]) acc[clientId] = { client: task.client, tasks: [] };
    acc[clientId].tasks.push(task);
    return acc;
  }, {});
  const clientGroups = Object.values(calendarsByClient);

  const isLoading = calLoading || tabLoading;

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
      queryClient.invalidateQueries({ queryKey: ["approvals-calendars"] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["allTasks"] });
      const label =
        variables.action === "approve"
          ? "approved"
          : variables.action === "reject"
            ? "rejected"
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
    else if (profile.roles?.includes("TEAM_LEAD")) reviewerType = "TEAM_LEAD";
    else if (profile.roles?.includes("ACCOUNT_MANAGER")) reviewerType = "ACCOUNT_MANAGER";
    actionMutation.mutate({
      taskId: modalState.task.id,
      action: modalState.actionType,
      feedback,
      reviewerId: profile.id,
      reviewerType,
      reviewerName: profile.name,
    });
  };

  const internalDesignCount = tabTasks.filter(
    (t: ApprovalTask) => t.status === "INTERNAL_REVIEW" && !!t.calendarCopyId
  ).length;
  const clientDesignCount = tabTasks.filter(
    (t: ApprovalTask) => t.status === "CLIENT_REVIEW" && !!t.calendarCopyId
  ).length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-0.5">
        <h1 className="text-2xl font-semibold text-gray-900 mb-1">Approvals</h1>
        <p className="text-gray-400 text-sm">
          {calendarTasks.length} calendar{calendarTasks.length !== 1 ? "s" : ""} · {designTasks.length} design approval{designTasks.length !== 1 ? "s" : ""} pending
        </p>
      </div>

      {/* Content Calendars section — always visible, not tab-filtered */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Content Calendars</p>
          <span className="text-[10px] font-bold bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full">
            {clientGroups.length} client{clientGroups.length !== 1 ? "s" : ""} · {calendarTasks.length} calendar{calendarTasks.length !== 1 ? "s" : ""}
          </span>
        </div>

        {calLoading ? (
          <div className="flex items-center gap-3 text-gray-400 py-6">
            <Clock className="w-4 h-4 animate-spin" />
            <span className="text-sm">Loading calendars...</span>
          </div>
        ) : clientGroups.length === 0 ? (
          <div className="bg-white border border-gray-100 rounded-lg p-8 text-center">
            <p className="text-sm text-gray-400">No calendars found.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {clientGroups.map(({ client, tasks }) => (
              <ClientCalendarGroup key={client.id} client={client} tasks={tasks} />
            ))}
          </div>
        )}
      </div>

      {/* Design approvals section — tab-filtered */}
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Design Approvals</p>
          {TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            const count = tab.key === "INTERNAL_REVIEW" ? internalDesignCount : clientDesignCount;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${isActive
                  ? "bg-white text-gray-900 border border-gray-100 shadow-sm"
                  : "text-gray-400 hover:text-gray-600"
                  }`}
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

        {tabLoading ? (
          <div className="flex items-center gap-3 text-gray-400 py-6">
            <Clock className="w-4 h-4 animate-spin" />
            <span className="text-sm">Loading...</span>
          </div>
        ) : designTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center mb-3">
              <CheckCircle2 className="w-6 h-6 text-emerald-400" />
            </div>
            <p className="text-sm text-gray-400">No design approvals pending.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {designTasks.map((task: ApprovalTask) => (
              <DesignApprovalCard
                key={task.id}
                task={task}
                onApprove={() => handleApprove(task)}
                onReject={() => handleOpenModal(task, "reject")}
                onFeedback={() => handleOpenModal(task, "feedback")}
                onPreview={() => setPreviewTask(task)}
                isActioning={actionMutation.isPending}
              />
            ))}
          </div>
        )}
      </div>

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

      {/* Design Preview Modal */}
      <DesignPreviewModal
        isOpen={!!previewTask}
        onClose={() => setPreviewTask(null)}
        task={previewTask}
      />
    </div>
  );
}
