"use client";

import { useState, use } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  LayoutGrid,
  Check,
  MessageSquare,
  X,
  XCircle,
  Send,
  Edit2,
  Globe,
  Film,
  Hash,
  Calendar,
  Clock,
  User,
  ChevronDown,
  ChevronUp,
  Building2,
  FolderOpen,
  BookOpen,
  Layers,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, getDay } from "date-fns";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CopyBucket {
  id: string;
  name: string;
}

interface CalendarCopy {
  id: string;
  content: string;
  caption?: string;
  hashtags?: string;
  publishDate?: string;
  publishTime?: string;
  platforms?: string[];
  mediaType?: string;
  status: string;
  bucketId: string;
  bucket?: CopyBucket | null;
}

interface CalendarBucket {
  id: string;
  name: string;
  description?: string;
}

interface ReviewTask {
  id: string;
  title: string;
  status: string;
  updatedAt: string;
  project: { id: string; name: string };
  subTasks: { id: string; title: string; description: string; status: string; createdAt: string }[];
  _count: { subTasks: number };
}

interface CalendarDetail {
  id: string;
  name: string;
  objective?: string;
  status?: string;
  client: { id: string; companyName: string };
  writer: { id: string; name: string };
  buckets: CalendarBucket[];
  copies: CalendarCopy[];
  tasks: ReviewTask[];
}

type ReviewerType = "CLIENT" | "ADMIN" | "TEAM_LEAD" | "ACCOUNT_MANAGER";

// ─── API Helpers ──────────────────────────────────────────────────────────────

const fetchCalendar = async (id: string): Promise<CalendarDetail> => {
  const res = await fetch(`/api/calendars/${id}`);
  if (!res.ok) throw new Error("Failed to fetch calendar");
  return res.json();
};

const fetchProfile = async () => {
  const res = await fetch("/api/auth/me");
  if (!res.ok) throw new Error("Failed to fetch profile");
  return res.json();
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const PLATFORM_STYLE: Record<string, string> = {
  Instagram: "bg-pink-50 text-pink-600 border-pink-100",
  LinkedIn: "bg-blue-50 text-blue-700 border-blue-100",
  Twitter: "bg-sky-50 text-sky-600 border-sky-100",
  Facebook: "bg-indigo-50 text-indigo-600 border-indigo-100",
};

const STATUS_STYLE: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-500 border-gray-200",
  UNDER_REVIEW: "bg-amber-50 text-amber-600 border-amber-200",
  INTERNAL_REVIEW: "bg-amber-50 text-amber-600 border-amber-200",
  CLIENT_REVIEW: "bg-indigo-50 text-indigo-600 border-indigo-200",
  APPROVED: "bg-emerald-50 text-emerald-600 border-emerald-200",
  PUBLISHED: "bg-violet-50 text-violet-600 border-violet-200",
};

const STATUS_DOT: Record<string, string> = {
  DRAFT: "bg-slate-400",
  UNDER_REVIEW: "bg-amber-400",
  INTERNAL_REVIEW: "bg-amber-400",
  CLIENT_REVIEW: "bg-indigo-400",
  APPROVED: "bg-emerald-500",
  PUBLISHED: "bg-violet-500",
};

const TASK_STATUS_STYLE: Record<string, string> = {
  INTERNAL_REVIEW: "bg-amber-50 text-amber-700 border-amber-200",
  CLIENT_REVIEW: "bg-indigo-50 text-indigo-600 border-indigo-200",
  APPROVED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  OPEN: "bg-gray-100 text-gray-500 border-gray-200",
};

function platformStyle(p?: string) {
  return p ? (PLATFORM_STYLE[p] ?? "bg-gray-50 text-gray-600 border-gray-100") : "";
}
function statusStyle(s: string) {
  return STATUS_STYLE[s] ?? STATUS_STYLE.DRAFT;
}

// ─── Visualize Modal ──────────────────────────────────────────────────────────

const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function VisualizeModal({
  isOpen,
  onClose,
  calendar,
}: {
  isOpen: boolean;
  onClose: () => void;
  calendar: CalendarDetail;
}) {
  const [currentDate, setCurrentDate] = useState(new Date());

  if (!isOpen) return null;

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startDow = getDay(monthStart);
  const calendarDays: (Date | null)[] = [
    ...Array(startDow).fill(null),
    ...monthDays,
  ];

  const getCopiesForDay = (day: Date) =>
    calendar.copies.filter(
      (c) => c.publishDate && isSameDay(new Date(c.publishDate), day)
    );

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gray-950/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <div>
            <h2 className="text-sm font-bold text-gray-900">{calendar.name}</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {calendar.client.companyName} · {calendar.copies.length} copies
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  setCurrentDate((d) => new Date(d.getFullYear(), d.getMonth() - 1))
                }
                className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors"
              >
                ‹
              </button>
              <span className="text-sm font-semibold text-gray-700 min-w-[120px] text-center">
                {format(currentDate, "MMMM yyyy")}
              </span>
              <button
                onClick={() =>
                  setCurrentDate((d) => new Date(d.getFullYear(), d.getMonth() + 1))
                }
                className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors"
              >
                ›
              </button>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Legend */}
        <div className="px-6 py-2 flex items-center gap-5 border-b border-gray-50 bg-gray-50/50">
          {(["DRAFT", "INTERNAL_REVIEW", "CLIENT_REVIEW", "APPROVED", "PUBLISHED"] as const).map((s) => (
            <span key={s} className="flex items-center gap-1.5 text-[11px] font-medium text-gray-500">
              <span className={`w-2 h-2 rounded-full ${STATUS_DOT[s]}`} />
              {s === "INTERNAL_REVIEW" ? "Internal Review" : s === "CLIENT_REVIEW" ? "Client Review" : s.charAt(0) + s.slice(1).toLowerCase()}
            </span>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="flex-1 overflow-auto p-4">
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200">
              {DAYS_OF_WEEK.map((d) => (
                <div key={d} className="p-2 text-center border-r border-gray-200 last:border-r-0">
                  <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">{d}</span>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {calendarDays.map((day, i) => {
                if (!day) {
                  return (
                    <div
                      key={`empty-${i}`}
                      className="min-h-[110px] p-2 border-r border-b border-gray-100 last:border-r-0 bg-gray-50/40"
                    />
                  );
                }
                const dayCopies = getCopiesForDay(day);
                const isCurrentMonth = isSameMonth(day, currentDate);
                const isToday = isSameDay(day, new Date());

                return (
                  <div
                    key={day.toISOString()}
                    className={`min-h-[110px] p-2 border-r border-b border-gray-100 last:border-r-0 ${!isCurrentMonth ? "bg-gray-50/40" : "bg-white"
                      } ${isToday ? "ring-2 ring-blue-500 ring-inset" : ""}`}
                  >
                    <div className="mb-1.5">
                      <span
                        className={`text-xs font-medium ${isToday
                          ? "w-5 h-5 flex items-center justify-center bg-blue-600 text-white rounded-full text-[10px]"
                          : !isCurrentMonth
                            ? "text-gray-300"
                            : "text-gray-700"
                          }`}
                      >
                        {format(day, "d")}
                      </span>
                    </div>
                    {dayCopies.length > 0 && (
                      <div className="space-y-1">
                        {dayCopies.map((copy) => {
                          const dot = STATUS_DOT[copy.status] ?? STATUS_DOT.DRAFT;
                          const style = statusStyle(copy.status);
                          return (
                            <div
                              key={copy.id}
                              className={`flex items-start gap-1 px-1.5 py-1 rounded border text-[9px] font-medium leading-tight ${style}`}
                            >
                              <span className={`mt-0.5 w-1.5 h-1.5 rounded-full shrink-0 ${dot}`} />
                              <div className="min-w-0">
                                <p className="truncate font-semibold">
                                  {copy.platforms?.map((p) => (
                                    <span key={p} className={`mr-1`}>
                                      {p}
                                    </span>
                                  )) ?? "Post"}
                                  {copy.mediaType ? ` · ${copy.mediaType}` : ""}
                                </p>
                                <p className="truncate opacity-70">
                                  {copy.content.substring(0, 35)}
                                  {copy.content.length > 35 ? "…" : ""}
                                </p>
                                {copy.bucket && (
                                  <p className="truncate opacity-60">{copy.bucket.name}</p>
                                )}
                                {copy.publishTime && (
                                  <p className="opacity-60">{copy.publishTime}</p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Edit Copy Modal ──────────────────────────────────────────────────────────

function EditCopyModal({
  copy,
  calendarId,
  onClose,
  onSaved,
}: {
  copy: CalendarCopy;
  calendarId: string;
  onClose: () => void;
  onSaved: (updated: CalendarCopy) => void;
}) {
  const [content, setContent] = useState(copy.content);
  const [caption, setCaption] = useState(copy.caption ?? "");
  const [hashtags, setHashtags] = useState(copy.hashtags ?? "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/calendars/${calendarId}/copies/${copy.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, caption: caption || null, hashtags: hashtags || null }),
      });
      if (!res.ok) throw new Error();
      const updated = await res.json();
      onSaved(updated);
      toast.success("Copy updated");
      onClose();
    } catch {
      toast.error("Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gray-950/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h3 className="text-sm font-bold text-gray-900">Edit Copy</h3>
            <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1.5">
              {copy.platforms && copy.platforms.length > 0 && (
                <span className={`border px-1.5 py-0.5 rounded-full text-[9px] font-bold ${platformStyle(copy.platforms[0])}`}>
                  {copy.platforms.join(", ")}
                </span>
              )}
              {copy.bucket?.name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Creative Copy</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={5}
              className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Caption</label>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              rows={2}
              className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none"
              placeholder="Optional caption..."
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">Hashtags</label>
            <input
              type="text"
              value={hashtags}
              onChange={(e) => setHashtags(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              placeholder="#hashtag1 #hashtag2..."
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
            onClick={handleSave}
            disabled={saving || !content.trim()}
            className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-all shadow-sm disabled:opacity-50"
          >
            <Check className="w-4 h-4" />
            {saving ? "Saving..." : "Save Changes"}
          </button>
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
      toast.error("Please enter a reason");
      return;
    }
    onSubmit(feedback.trim());
    setFeedback("");
  };

  const isReject = actionType === "reject";

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center">
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
              {isReject ? "Reject Calendar" : "Give Feedback"}
            </h3>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-500 font-medium mb-1">Task</p>
            <p className="text-xs font-medium text-gray-900">{taskTitle}</p>
          </div>

          <div className="bg-gray-50 rounded-lg p-3 flex flex-col gap-1">
            <p className="text-xs text-gray-500 font-medium">Reviewer</p>
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
              placeholder={isReject ? "Explain why..." : "Share revision notes..."}
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
              ? "bg-red-600 hover:bg-red-700"
              : "bg-amber-600 hover:bg-amber-700"
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

// ─── Copy Row ─────────────────────────────────────────────────────────────────

function CopyRow({
  copy,
  calendarId,
  onUpdated,
}: {
  copy: CalendarCopy;
  calendarId: string;
  onUpdated: (updated: CalendarCopy) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  return (
    <>
      <div className="bg-white border border-gray-100 rounded-lg overflow-hidden">
        <div
          className="flex items-start gap-3 p-4 cursor-pointer hover:bg-gray-50/60 transition-colors"
          onClick={() => setExpanded((v) => !v)}
        >
          {/* Status dot */}
          <span
            className={`mt-1 w-2 h-2 rounded-full shrink-0 ${STATUS_DOT[copy.status] ?? STATUS_DOT.DRAFT}`}
          />

          {/* Main info */}
          <div className="flex-1 min-w-0 space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              {copy.mediaType && (
                <span className="text-[10px] font-bold bg-violet-50 text-violet-600 border border-violet-100 px-2 py-0.5 rounded-full">
                  {copy.mediaType}
                </span>
              )}
              {copy.bucket && (
                <span className="text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Hash className="w-2.5 h-2.5" />
                  {copy.bucket.name}
                </span>
              )}
              {copy.publishDate && (
                <span className="text-[10px] font-medium text-gray-400 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {new Date(copy.publishDate).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                  {copy.publishTime && ` · ${copy.publishTime}`}
                </span>
              )}
              <span
                className={`ml-auto text-[10px] font-bold border px-2 py-0.5 rounded-full ${statusStyle(copy.status)}`}
              >
                {copy.status}
              </span>
            </div>
            <p className={`text-xs text-gray-700 leading-relaxed ${expanded ? "" : "line-clamp-2"}`}>
              {copy.content}
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1.5 shrink-0 ml-2" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setEditOpen(true)}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-lg hover:bg-indigo-100 transition-colors"
            >
              <Edit2 className="w-3 h-3" />
              Edit
            </button>
            <button
              onClick={() => setExpanded((v) => !v)}
              className="p-1 rounded text-gray-400 hover:text-gray-600"
            >
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Expanded detail */}
        {expanded && (copy.caption || copy.hashtags) && (
          <div className="px-4 pb-4 space-y-3 border-t border-gray-50 pt-3">

            {copy.platforms && copy.platforms.length > 0 && (
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Platform</p>
                <span className="text-xs text-gray-600 italic leading-relaxed">{copy.platforms.join(", ")}</span>
              </div>
            )}
            {copy.caption && (
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Caption</p>
                <p className="text-xs text-gray-600 italic leading-relaxed">{copy.caption}</p>
              </div>
            )}
            {copy.hashtags && (
              <div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Hashtags</p>
                <p className="text-xs text-indigo-500 font-medium break-words">{copy.hashtags}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {editOpen && (
        <EditCopyModal
          copy={copy}
          calendarId={calendarId}
          onClose={() => setEditOpen(false)}
          onSaved={onUpdated}
        />
      )}
    </>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CalendarApprovalDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();

  const [visualizeOpen, setVisualizeOpen] = useState(false);
  const [activeBucketId, setActiveBucketId] = useState<string | null>(null);
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    actionType: "reject" | "feedback";
  }>({ isOpen: false, actionType: "reject" });

  const { data: calendar, isLoading, error } = useQuery({
    queryKey: ["calendar-detail", id],
    queryFn: () => fetchCalendar(id),
  });

  const { data: profile } = useQuery({ queryKey: ["profile"], queryFn: fetchProfile });

  // Local copies state for optimistic edits
  const [localCopies, setLocalCopies] = useState<CalendarCopy[] | null>(null);
  const displayCopies = localCopies ?? calendar?.copies ?? [];

  const handleCopyUpdated = (updated: CalendarCopy) => {
    setLocalCopies((prev) =>
      (prev ?? calendar?.copies ?? []).map((c) => (c.id === updated.id ? updated : c))
    );
  };

  // Find the active review task
  const reviewTask = calendar?.tasks.find(
    (t) => t.status === "INTERNAL_REVIEW" || t.status === "CLIENT_REVIEW"
  );

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
      queryClient.invalidateQueries({ queryKey: ["calendar-detail", id] });
      const label =
        variables.action === "approve"
          ? "approved"
          : variables.action === "reject"
            ? "rejected"
            : "feedback sent";
      toast.success(`Calendar ${label} successfully!`);
      setModalState({ isOpen: false, actionType: "reject" });
      if (variables.action === "approve" || variables.action === "reject") {
        router.push("/approvals");
      }
    },
    onError: () => toast.error("Something went wrong. Please try again."),
  });

  const handleApprove = () => {
    if (!reviewTask) return;
    actionMutation.mutate({ taskId: reviewTask.id, action: "approve" });
  };

  const handleModalSubmit = (feedback: string) => {
    if (!reviewTask || !profile) return;
    let reviewerType: ReviewerType = "ADMIN";
    if (profile.userType === "CLIENT") reviewerType = "CLIENT";
    else if (profile.role === "TEAM_LEAD") reviewerType = "TEAM_LEAD";
    else if (profile.role === "ACCOUNT_MANAGER") reviewerType = "ACCOUNT_MANAGER";
    actionMutation.mutate({
      taskId: reviewTask.id,
      action: modalState.actionType,
      feedback,
      reviewerId: profile.id,
      reviewerType,
      reviewerName: profile.name,
    });
  };

  const isApproveMove = reviewTask?.status === "INTERNAL_REVIEW";
  const approveLabel = isApproveMove ? "Approve → Client Review" : "Approve & Publish";

  // Filter copies by active bucket
  const bucketsWithCopies = calendar?.buckets.filter((b) =>
    displayCopies.some((c) => c.bucketId === b.id)
  );
  const filteredCopies =
    activeBucketId
      ? displayCopies.filter((c) => c.bucketId === activeBucketId)
      : displayCopies;

  // ─── Loading / Error ────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="flex items-center gap-3 text-gray-400">
          <Clock className="w-5 h-5 animate-spin" />
          <span className="text-sm font-medium">Loading calendar...</span>
        </div>
      </div>
    );
  }

  if (error || !calendar) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4">
        <p className="text-sm text-gray-500">Calendar not found.</p>
        <button
          onClick={() => router.push("/approvals")}
          className="text-xs text-indigo-600 hover:underline"
        >
          Back to Approvals
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        {/* Top bar */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <button
            onClick={() => router.push("/approvals")}
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Approvals
          </button>

          <button
            onClick={() => setVisualizeOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-lg hover:bg-indigo-100 transition-all"
          >
            <LayoutGrid className="w-4 h-4" />
            Visualize
          </button>
        </div>

        {/* Header card */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-5">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex items-start gap-4 min-w-0">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
                <BookOpen className="w-6 h-6 text-indigo-600" />
              </div>
              <div className="min-w-0">
                <h1 className="text-xl font-bold text-gray-900 tracking-tight">{calendar.name}</h1>
                {reviewTask && (
                  <span
                    className={`mt-1 inline-block text-[11px] font-bold border px-2.5 py-0.5 rounded-full ${TASK_STATUS_STYLE[reviewTask.status] ?? "bg-gray-100 text-gray-500 border-gray-200"
                      }`}
                  >
                    {reviewTask.status === "INTERNAL_REVIEW"
                      ? "Internal Review"
                      : reviewTask.status === "CLIENT_REVIEW"
                        ? "Client Review"
                        : reviewTask.status}
                  </span>
                )}
              </div>
            </div>

            {/* Action buttons — only shown while awaiting internal review */}
            {reviewTask && reviewTask.status === "INTERNAL_REVIEW" && (
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={handleApprove}
                  disabled={actionMutation.isPending}
                  className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-[#00AB55] hover:bg-[#00964b] rounded-lg transition-all shadow-sm disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  {approveLabel}
                </button>
                <button
                  onClick={() => setModalState({ isOpen: true, actionType: "feedback" })}
                  disabled={actionMutation.isPending}
                  className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-all shadow-sm disabled:opacity-50"
                >
                  <MessageSquare className="w-4 h-4" />
                  Feedback
                </button>
                <button
                  onClick={() => setModalState({ isOpen: true, actionType: "reject" })}
                  disabled={actionMutation.isPending}
                  className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold text-rose-500 bg-white border border-rose-100 rounded-lg hover:bg-rose-50 transition-all shadow-sm disabled:opacity-50"
                >
                  <X className="w-4 h-4" />
                  Reject
                </button>
              </div>
            )}
            {/* Awaiting client approval — show status badge only, no action buttons */}
            {reviewTask && reviewTask.status === "CLIENT_REVIEW" && (
              <div className="flex items-center gap-2 px-4 py-2 bg-indigo-50 border border-indigo-100 rounded-lg">
                <Clock className="w-4 h-4 text-indigo-500" />
                <span className="text-sm font-semibold text-indigo-600">Awaiting Client Approval</span>
              </div>
            )}
          </div>

          {/* Meta info */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2 border-t border-gray-50">
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
                <Building2 className="w-3 h-3" /> Client
              </p>
              <p className="text-sm font-semibold text-gray-800">{calendar.client.companyName}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
                <FolderOpen className="w-3 h-3" /> Project
              </p>
              <p className="text-sm font-semibold text-gray-800">
                {reviewTask?.project?.name ?? "—"}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
                <User className="w-3 h-3" /> Assigned To
              </p>
              <p className="text-sm font-semibold text-gray-800">{calendar.writer.name}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
                <Layers className="w-3 h-3" /> Copies
              </p>
              <p className="text-sm font-semibold text-gray-800">{displayCopies.length}</p>
            </div>
          </div>

          {/* Objective */}
          {calendar.objective && (
            <div className="bg-indigo-50 border border-indigo-100 rounded-lg px-4 py-3">
              <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-1">
                Calendar Objective
              </p>
              <p className="text-sm text-indigo-800 leading-relaxed">{calendar.objective}</p>
            </div>
          )}

          {/* Buckets */}
          {calendar.buckets.length > 0 && (
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Buckets</p>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => setActiveBucketId(null)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${activeBucketId === null
                    ? "bg-gray-900 text-white border-gray-900"
                    : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                    }`}
                >
                  All
                </button>
                {bucketsWithCopies?.map((bucket) => (
                  <button
                    key={bucket.id}
                    onClick={() => setActiveBucketId(bucket.id === activeBucketId ? null : bucket.id)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${activeBucketId === bucket.id
                      ? "bg-indigo-600 text-white border-indigo-600"
                      : "bg-white text-gray-600 border-gray-200 hover:border-indigo-200"
                      }`}
                  >
                    {bucket.name}
                    <span className="ml-1.5 text-[10px] opacity-70">
                      ({displayCopies.filter((c) => c.bucketId === bucket.id).length})
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Copies list */}
        <div className="space-y-3">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            Copies ({filteredCopies.length})
          </p>
          {filteredCopies.length === 0 ? (
            <div className="bg-white border border-gray-100 rounded-lg p-8 text-center text-gray-400 text-sm">
              No copies found.
            </div>
          ) : (
            filteredCopies.map((copy) => (
              <CopyRow
                key={copy.id}
                copy={copy}
                calendarId={id}
                onUpdated={handleCopyUpdated}
              />
            ))
          )}
        </div>

        {/* Iteration history */}
        {reviewTask && (reviewTask.subTasks?.length ?? 0) > 0 && (
          <div className="bg-white border border-gray-100 rounded-xl p-6 space-y-4">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              Iteration History
            </p>
            <div className="space-y-3">
              {reviewTask.subTasks.map((sub, index) => {
                const isRejected = sub.description?.toLowerCase().includes("rejected");
                const clean = sub.description?.replace(/^(Rejected — |Feedback — )/, "");
                return (
                  <div key={sub.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <span className="text-sm font-medium text-gray-400 w-8 shrink-0">v{index + 1}</span>
                      <span
                        className={`shrink-0 px-3 py-1 text-[11px] font-bold uppercase tracking-wider rounded-full shadow-sm ${isRejected ? "bg-[#FFE4E6] text-[#E11D48]" : "bg-[#FFF8E6] text-[#B45309]"
                          }`}
                      >
                        {isRejected ? "Rejected" : "Feedback"}
                      </span>
                      <p className="text-xs font-medium text-gray-500 line-clamp-1 min-w-0">{clean}</p>
                    </div>
                    <span className="text-xs font-semibold text-gray-400 ml-4 tabular-nums shrink-0">
                      {new Date(sub.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                );
              })}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium text-gray-400 w-8">
                    v{reviewTask.subTasks.length + 1}
                  </span>
                  <span className="px-3 py-1 text-[11px] font-bold uppercase tracking-wider rounded-full bg-[#F1F5F9] text-[#64748B] shadow-sm">
                    Current
                  </span>
                  <p className="text-xs font-medium text-gray-400">Awaiting review</p>
                </div>
                <span className="text-xs font-semibold text-gray-400 ml-4 tabular-nums">
                  {new Date(reviewTask.updatedAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Visualize modal */}
      <VisualizeModal
        isOpen={visualizeOpen}
        onClose={() => setVisualizeOpen(false)}
        calendar={{ ...calendar, copies: displayCopies }}
      />

      {/* Feedback / Reject modal */}
      <FeedbackModal
        isOpen={modalState.isOpen}
        onClose={() => setModalState({ isOpen: false, actionType: "reject" })}
        onSubmit={handleModalSubmit}
        currentUser={profile}
        actionType={modalState.actionType}
        taskTitle={reviewTask?.title ?? calendar.name}
        isLoading={actionMutation.isPending}
      />
    </>
  );
}
