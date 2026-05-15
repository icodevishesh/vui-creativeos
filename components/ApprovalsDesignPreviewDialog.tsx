'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Download, Image as ImageIcon, Pencil, Trash2, X } from 'lucide-react';
import { format } from 'date-fns';

interface Attachment {
  id: string;
  fileName: string;
  fileUrl: string;
  mimeType: string;
  fileSize?: number;
  platform?: string;
  platformType?: string;
}

interface CalendarCopyRef {
  id: string;
  content: string;
  caption?: string;
  hashtags?: string;
  platform?: string;
  platforms?: string[];
  mediaType?: string;
  publishDate?: string;
  publishTime?: string;
  status?: string;
  bucket?: { id: string; name: string } | null;
  isCarousel?: boolean;
  frames?: Array<{
    id: string;
    frameNumber: number;
    caption?: string;
    hashtags?: string;
  }>;
}

export interface ApprovalTaskPreview {
  id: string;
  title: string;
  client?: { companyName: string } | null;
  calendarCopy?: CalendarCopyRef | null;
  attachments?: Attachment[] | null;
}

interface DesignPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: ApprovalTaskPreview | null;
  onEdit?: () => void;
  onDelete?: () => void;
}

const STATUS_LABEL: Record<string, string> = {
  DRAFT: 'Draft',
  UNDER_REVIEW: 'Under Review',
  APPROVED: 'Approved',
};

const STATUS_PILL: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-500',
  UNDER_REVIEW: 'bg-amber-50 text-amber-600',
  APPROVED: 'bg-emerald-50 text-emerald-700',
};

const isImageFile = (mime?: string) => !!mime && mime.startsWith('image/');
const isVideoFile = (mime?: string) => !!mime && mime.startsWith('video/');

const downloadFile = async (url: string, name: string) => {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  } catch {
    window.open(url, '_blank');
  }
};

export function DesignPreviewModal({ isOpen, onClose, task, onEdit, onDelete }: DesignPreviewModalProps) {
  const [mediaIdx, setMediaIdx] = useState(0);

  if (!isOpen || !task) return null;

  const copy = task.calendarCopy;
  const media = (task.attachments ?? []).filter(a => isImageFile(a.mimeType) || isVideoFile(a.mimeType));
  const current = media[mediaIdx];

  const headerDate = copy?.publishDate
    ? format(new Date(copy.publishDate), 'EEEE, MMMM d, yyyy')
    : task.title;

  const statusLabel = copy?.status ? (STATUS_LABEL[copy.status] ?? copy.status) : null;
  const statusPill = copy?.status ? (STATUS_PILL[copy.status] ?? 'bg-gray-100 text-gray-500') : 'bg-gray-100 text-gray-500';

  const prev = () => setMediaIdx(i => (i - 1 + media.length) % media.length);
  const next = () => setMediaIdx(i => (i + 1) % media.length);

  return (
    <div
      className="fixed inset-0 z-70 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="absolute inset-0 bg-gray-950/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-gray-50 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 shrink-0">
          <h2 className="text-lg font-semibold text-gray-900">{headerDate}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto bg-gray-50">

          <div className='flex flex-col bg-white m-6 py-4 border border-gray-200 rounded-2xl'>
            {/* Badge row */}
            <div className="flex items-center gap-2.5 px-5 pb-3 flex-wrap">
              {task.client && (
                <span className="flex items-center gap-1.5 text-xs font-bold text-gray-700">
                  <span className="w-2 h-2 rounded-full bg-green-400 shrink-0" />
                  {task.client.companyName.toUpperCase()}
                </span>
              )}
              {copy?.bucket && (
                <span className="text-xs font-bold text-teal-600">
                  {copy.bucket.name.toUpperCase()}
                </span>
              )}
              {(copy?.platform ?? copy?.platforms?.[0]) && (
                <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">
                  {copy?.platform ?? copy?.platforms?.[0]}
                </span>
              )}
              {statusLabel && (
                <span className={`ml-auto text-xs font-semibold px-2.5 py-0.5 rounded-full capitalize ${statusPill}`}>
                  {statusLabel}
                </span>
              )}
            </div>

            {/* Media area */}
            <div className="relative bg-black mx-5 rounded-lg">
              {media.length === 0 ? (
                <div className="aspect-square flex items-center justify-center">
                  <ImageIcon className="w-12 h-12 text-gray-600" />
                </div>
              ) : (
                <>
                  {isImageFile(current?.mimeType) ? (
                    <img
                      src={current.fileUrl}
                      alt={current.fileName}
                      className="w-full aspect-square object-contain block"
                    />
                  ) : (
                    <video
                      src={current?.fileUrl}
                      controls
                      className="w-full aspect-square object-contain block"
                    />
                  )}

                  {/* Download button */}
                  <button
                    onClick={() => downloadFile(current.fileUrl, current.fileName)}
                    className="absolute top-2 right-2 w-8 h-8 bg-white/80 hover:bg-white rounded-full flex items-center justify-center shadow transition-all"
                    title="Download"
                  >
                    <Download className="w-4 h-4 text-gray-700" />
                  </button>

                  {/* Carousel controls */}
                  {media.length > 1 && (
                    <>
                      <button
                        onClick={prev}
                        className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 hover:bg-white rounded-full flex items-center justify-center shadow"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        onClick={next}
                        className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 hover:bg-white rounded-full flex items-center justify-center shadow"
                      >
                        <ChevronRight className="w-4 h-4" />
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
                </>
              )}
            </div>

            {/* Content section */}
            <div className="px-5 pt-4 pb-5 space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                {copy?.mediaType && (
                  <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                    {copy.mediaType}
                  </span>
                )}
                {copy?.content && copy.mediaType !== 'CAROUSEL' && (
                  <p className="text-md font-semibold text-gray-900 leading-relaxed whitespace-pre-wrap">
                    {copy.content}
                  </p>
                )}
                {/* <p className="font-semibold text-gray-900">{task.title}</p> */}
              </div>

              {copy?.mediaType === 'CAROUSEL' ? (
                <>
                  {copy.frames?.[mediaIdx]?.caption && (
                    <div className="space-y-1">
                      <p className="text-md text-gray-900 leading-relaxed">
                        {copy.frames[mediaIdx].caption}
                      </p>
                    </div>
                  )}
                </>
              ) : (
                copy?.caption && (
                  <p className="text-sm text-gray-500 leading-relaxed italic">{copy.caption}</p>
                )
              )}

              {copy?.hashtags && (
                <p className="text-xs text-blue-600 font-medium">{copy.hashtags}</p>
              )}

              {(copy?.publishDate || copy?.publishTime) && (
                <p className="text-xs text-gray-400">
                  Scheduled
                  {copy.publishDate
                    ? ` · ${format(new Date(copy.publishDate), 'MMM d')}`
                    : ''}
                  {copy.publishTime ? ` · ${copy.publishTime}` : ''}
                </p>
              )}

              {(onEdit || onDelete) && (
                <div className="flex justify-end items-center gap-2 pt-1">
                  {onEdit && (
                    <button
                      onClick={onEdit}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-600 font-medium hover:bg-gray-50 transition-all"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      Edit
                    </button>
                  )}
                  {onDelete && (
                    <button
                      onClick={onDelete}
                      className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
