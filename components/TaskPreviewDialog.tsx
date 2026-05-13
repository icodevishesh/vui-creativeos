'use client';

import { X, Calendar as CalendarIcon, Clock, User, Image as ImageIcon, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';

type TaskPreviewMedia = {
  url: string;
  isVideo: boolean;
};

interface TaskAttachment {
  id: string;
  fileName: string;
  fileUrl: string;
  mimeType: string | null;
}

export interface CalendarTaskPreview {
  id: string;
  title: string;
  description?: string | null;
  status: string;
  priority?: string | null;
  startDate?: string | Date | null;
  endDate?: string | Date | null;
  mediaUrls?: string[] | null;
  feedbacks?: string[] | null;
  attachments?: TaskAttachment[] | null;
  assignedTo?: { id: string; name: string } | null;
  project?: { name: string } | null;
  client?: { companyName: string } | null;
}

interface TaskPreviewDialogProps {
  task: CalendarTaskPreview | null;
  onClose: () => void;
}

const STATUS_LABELS: Record<string, string> = {
  OPEN: 'Open',
  OPENED: 'Opened',
  IN_PROGRESS: 'In Progress',
  ON_HOLD: 'On Hold',
  INTERNAL_REVIEW: 'Internal Review',
  CLIENT_REVIEW: 'Client Review',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
};

const STATUS_STYLES: Record<string, string> = {
  OPEN: 'bg-slate-100 text-slate-700 border-slate-200',
  OPENED: 'bg-teal-50 text-teal-700 border-teal-200',
  IN_PROGRESS: 'bg-blue-50 text-blue-700 border-blue-200',
  ON_HOLD: 'bg-amber-50 text-amber-700 border-amber-200',
  INTERNAL_REVIEW: 'bg-violet-50 text-violet-700 border-violet-200',
  CLIENT_REVIEW: 'bg-amber-50 text-amber-700 border-amber-200',
  APPROVED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  REJECTED: 'bg-rose-50 text-rose-700 border-rose-200',
};

const isVideoUrl = (url: string) => /\.(mp4|webm|mov|m4v|ogg)(\?|$)/i.test(url);

const resolveMediaUrl = (input: string) => {
  const normalized = String(input ?? '').replace(/\\/g, '/');
  if (!normalized) return '/image.png';
  if (normalized.includes('nopreview.png')) return '/image.png';
  return normalized.replace(/^\/?public\//, '/');
};

export function TaskPreviewDialog({ task, onClose }: TaskPreviewDialogProps) {
  if (!task) return null;

  const mediaFromUrls: TaskPreviewMedia[] = (task.mediaUrls ?? []).map((url) => {
    const resolved = resolveMediaUrl(url);
    return { url: resolved, isVideo: isVideoUrl(resolved) };
  });

  const mediaFromAttachments: TaskPreviewMedia[] = (task.attachments ?? [])
    .filter(a => a.mimeType?.startsWith('image/') || a.mimeType?.startsWith('video/'))
    .map(a => ({ url: a.fileUrl, isVideo: !!a.mimeType?.startsWith('video/') }));

  const media: TaskPreviewMedia[] = mediaFromAttachments.length > 0
    ? mediaFromAttachments
    : mediaFromUrls;

  const statusStyle = STATUS_STYLES[task.status] ?? STATUS_STYLES.OPEN;
  const statusLabel = STATUS_LABELS[task.status] ?? task.status;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="absolute inset-0 bg-gray-950/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-gray-50 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between px-5 py-4 shrink-0">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-gray-900 truncate">{task.title}</h2>
          </div>
          <button
            onClick={onClose}
            className="ml-4 text-gray-400 hover:text-gray-700 transition-colors shrink-0 mt-0.5"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto bg-gray-50 pb-6">
          <div className="flex flex-col bg-white mx-6 py-4 border border-gray-200 rounded-2xl">

            {/* Badge row */}
            <div className="flex items-center gap-2 px-5 pb-4 flex-wrap">
              {/* <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${statusStyle}`}>
                {statusLabel}
              </span> */}
              {task.client?.companyName && (
              <p className="text-sm font-semibold text-gray-700">{task.client.companyName}</p>
            )}
              {task.project?.name && (
                <span className="text-xs font-semibold text-green-400 uppercase tracking-wider">
                  <span className="mr-1 text-gray-700">•</span>
                  {task.project.name}
                </span>
              )}
            </div>

            {/* Media */}
            {media.length > 0 && (
              <div className="px-5 pt-2 space-y-2">
                <div className="rounded-lg overflow-hidden bg-black">
                  {media[0].isVideo ? (
                    <video src={media[0].url} controls className="w-full aspect-square object-contain" />
                  ) : (
                    <img
                      src={media[0].url}
                      alt=""
                      className="w-full aspect-square object-contain"
                      onError={(e) => {
                        const img = e.currentTarget;
                        if (img.dataset.fallbackApplied === 'true') return;
                        img.dataset.fallbackApplied = 'true';
                        img.src = '/image.png';
                      }}
                    />
                  )}
                </div>
                {media.length > 1 && (
                  <div className="grid grid-cols-3 gap-2 pt-1">
                    {media.slice(1).map((item, index) => (
                      <div key={`${item.url}-${index}`} className="rounded-lg overflow-hidden bg-black">
                        {item.isVideo ? (
                          <video src={item.url} controls className="w-full aspect-square object-contain" />
                        ) : (
                          <img src={item.url} alt="" className="w-full aspect-square object-contain"
                            onError={(e) => {
                              const img = e.currentTarget;
                              if (img.dataset.fallbackApplied === 'true') return;
                              img.dataset.fallbackApplied = 'true';
                              img.src = '/image.png';
                            }}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Info grid */}
            {/* {(task.assignedTo || task.startDate || task.endDate) && (
              <div className="grid grid-cols-3 gap-px bg-gray-100 border-y border-gray-100 mx-5 rounded-xl overflow-hidden mb-4">
                {task.assignedTo && (
                  <div className="bg-gray-50 px-4 py-3">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">
                      <User className="w-3 h-3" />
                      Assigned To
                    </div>
                    <div className="text-sm font-medium text-gray-800">{task.assignedTo.name}</div>
                  </div>
                )}
                {task.startDate && (
                  <div className="bg-gray-50 px-4 py-3">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">
                      <CalendarIcon className="w-3 h-3" />
                      Start Date
                    </div>
                    <div className="text-sm font-medium text-gray-800">
                      {format(new Date(task.startDate), 'MMM d, yyyy')}
                    </div>
                  </div>
                )}
                {task.endDate && (
                  <div className="bg-gray-50 px-4 py-3">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">
                      <Clock className="w-3 h-3" />
                      Due Date
                    </div>
                    <div className="text-sm font-medium text-gray-800">
                      {format(new Date(task.endDate), 'MMM d, yyyy')}
                    </div>
                  </div>
                )}
              </div>
            )} */}

            {/* Description */}
            <div className="px-5 space-y-1 mt-4">
              <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                <MessageSquare className="w-3 h-3" />
                Description
              </div>
              <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                {task.description?.trim() || 'No description provided.'}
              </p>
            </div>

            {/* Feedback */}
            {task.feedbacks && task.feedbacks.length > 0 && (
              <div className="px-5 pt-4 space-y-2">
                <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                  <MessageSquare className="w-3 h-3" />
                  Feedback
                </div>
                <div className="space-y-2">
                  {task.feedbacks.map((feedback, index) => (
                    <div key={index} className="rounded-xl border border-amber-100 bg-amber-50/60 px-4 py-3">
                      <p className="text-sm text-amber-900 whitespace-pre-wrap leading-relaxed">{feedback}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
