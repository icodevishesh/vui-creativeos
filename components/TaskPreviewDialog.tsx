'use client';

import { useState, useEffect } from 'react';
import { X, Calendar as CalendarIcon, Clock, User, Image as ImageIcon, MessageSquare, ChevronLeft, ChevronRight } from 'lucide-react';
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
  calendarCopy?: {
    id: string;
    mediaType?: string | null;
    content?: string | null;
    caption?: string | null;
    hashtags?: string | null;
    frames?: Array<{
      id: string;
      frameNumber: number;
      caption?: string | null;
      hashtags?: string | null;
    }>;
  } | null;
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
  const [mediaIdx, setMediaIdx] = useState(0);

  useEffect(() => {
    setMediaIdx(0);
  }, [task?.id]);

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

  const prev = () => setMediaIdx(i => (i - 1 + media.length) % media.length);
  const next = () => setMediaIdx(i => (i + 1) % media.length);

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
              <div className="px-5 pt-2">
                <div className="relative rounded-lg overflow-hidden bg-black">
                  {media[mediaIdx].isVideo ? (
                    <video src={media[mediaIdx].url} controls className="w-full aspect-square object-contain" />
                  ) : (
                    <img
                      src={media[mediaIdx].url}
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

                  {/* Carousel controls */}
                  {media.length > 1 && (
                    <>
                      <button
                        onClick={prev}
                        className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 hover:bg-white rounded-full flex items-center justify-center shadow"
                      >
                        <ChevronLeft className="w-4 h-4 text-gray-700" />
                      </button>
                      <button
                        onClick={next}
                        className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 hover:bg-white rounded-full flex items-center justify-center shadow"
                      >
                        <ChevronRight className="w-4 h-4 text-gray-700" />
                      </button>
                      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                        {media.map((_, idx) => (
                          <span
                            key={idx}
                            className={`w-1.5 h-1.5 rounded-full transition-all ${
                              idx === mediaIdx ? 'bg-white' : 'bg-white/50'
                            }`}
                          />
                        ))}
                      </div>
                      <div className="absolute bottom-2 right-3 text-[10px] text-white/60 font-medium">
                        {mediaIdx + 1} / {media.length}
                      </div>
                    </>
                  )}
                </div>
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

            {/* Dynamic Content / Description */}
            <div className="px-5 space-y-1 mt-4">
              <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                <MessageSquare className="w-3 h-3" />
                Description
              </div>

              {task.calendarCopy ? (
                <div className="space-y-3 mt-2">
                  {task.calendarCopy.mediaType && (
                    <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                      {task.calendarCopy.mediaType}
                    </span>
                  )}
                  
                  {task.calendarCopy.content && task.calendarCopy.mediaType !== 'CAROUSEL' && (
                    <p className="text-md font-semibold text-gray-900 leading-relaxed whitespace-pre-wrap">
                      {task.calendarCopy.content}
                    </p>
                  )}

                  {task.calendarCopy.mediaType === 'CAROUSEL' ? (
                    <>
                      {task.calendarCopy.frames?.[mediaIdx]?.caption && (
                        <p className="text-sm text-gray-900 leading-relaxed whitespace-pre-wrap">
                          {task.calendarCopy.frames[mediaIdx].caption}
                        </p>
                      )}
                      {task.calendarCopy.frames?.[mediaIdx]?.hashtags && (
                        <p className="text-xs text-blue-600 font-medium">
                          {task.calendarCopy.frames[mediaIdx].hashtags}
                        </p>
                      )}
                    </>
                  ) : (
                    task.calendarCopy.caption && (
                      <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap italic">
                        {task.calendarCopy.caption}
                      </p>
                    )
                  )}

                  {task.calendarCopy.mediaType !== 'CAROUSEL' && task.calendarCopy.hashtags && (
                    <p className="text-xs text-blue-600 font-medium">{task.calendarCopy.hashtags}</p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed mt-1">
                  {task.description?.trim() || 'No description provided.'}
                </p>
              )}
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
