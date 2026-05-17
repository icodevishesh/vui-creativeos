'use client';

import { useState, useEffect } from 'react';
import { X, Calendar as CalendarIcon, Clock, Globe, Film, FolderOpen, ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';

export interface CalendarCopy {
  id: string;
  content: string;
  caption?: string | null;
  hashtags?: string | null;
  publishDate?: string | Date | null;
  publishTime?: string | null;
  platform?: string | null;
  mediaType?: string | null;
  status: string;
  calendarName?: string;
  bucket?: { id: string; name: string } | null;
  isCarousel?: boolean;
  frames?: Array<{
    id: string;
    frameNumber: number;
    caption?: string | null;
    hashtags?: string | null;
  }>;
}

interface CalendarCopyPreviewDialogProps {
  copy: CalendarCopy | null;
  onClose: () => void;
}

const STATUS_CONFIG: Record<string, { pill: string; dot: string; label: string }> = {
  DRAFT: { pill: 'bg-slate-100 text-slate-700 border border-slate-200', dot: 'bg-slate-400', label: 'Draft' },
  UNDER_REVIEW: { pill: 'bg-amber-50 text-amber-700 border border-amber-200', dot: 'bg-amber-400', label: 'Under Review' },
  APPROVED: { pill: 'bg-emerald-50 text-emerald-700 border border-emerald-200', dot: 'bg-emerald-500', label: 'Approved' },
};

export function CalendarCopyPreviewDialog({ copy, onClose }: CalendarCopyPreviewDialogProps) {
  const [frameIdx, setFrameIdx] = useState(0);

  useEffect(() => {
    setFrameIdx(0);
  }, [copy?.id]);

  if (!copy) return null;

  const st = STATUS_CONFIG[copy.status] ?? STATUS_CONFIG.DRAFT;

  const prevFrame = () => {
    if (!copy?.frames) return;
    setFrameIdx((i) => (i - 1 + copy.frames!.length) % copy.frames!.length);
  };

  const nextFrame = () => {
    if (!copy?.frames) return;
    setFrameIdx((i) => (i + 1) % copy.frames!.length);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-5 border-b border-gray-100 shrink-0">
          <div className="space-y-0.5">
            <h2 className="text-sm font-bold text-gray-900">
              {copy.publishDate
                ? format(new Date(copy.publishDate), 'EEEE, MMMM d, yyyy')
                : 'Content Preview'}
            </h2>
            {copy.calendarName && (
              <p className="text-xs text-gray-400">{copy.calendarName}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="ml-4 text-gray-400 hover:text-gray-700 transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto p-6 space-y-4">
          {/* Badge row */}
          <div className="flex items-center gap-2 flex-wrap">
            {copy.platform && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-semibold">
                <Globe className="w-3 h-3 shrink-0" />
                {copy.platform}
              </span>
            )}
            {copy.mediaType && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-semibold">
                <Film className="w-3 h-3 shrink-0" />
                {copy.mediaType}
              </span>
            )}
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${st.pill}`}>
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${st.dot}`} />
              {st.label}
            </span>
            {copy.bucket && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-semibold">
                <FolderOpen className="w-3 h-3 shrink-0" />
                {copy.bucket.name}
              </span>
            )}
          </div>

          {/* Schedule metadata */}
          {(copy.publishDate || copy.publishTime) && (
            <div className="flex items-center gap-4 text-xs text-gray-500">
              {copy.publishDate && (
                <span className="flex items-center gap-1.5">
                  <CalendarIcon className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  {format(new Date(copy.publishDate), 'MMM d, yyyy')}
                </span>
              )}
              {copy.publishTime && (
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  {copy.publishTime}
                </span>
              )}
            </div>
          )}

          {/* Content card */}
          <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 space-y-3">
            {copy.mediaType !== 'CAROUSEL' && (
              <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">{copy.content}</p>
            )}

            {copy.mediaType === 'CAROUSEL' && copy.frames && copy.frames.length > 0 && (
              <div className="relative bg-white border border-gray-200 rounded-xl px-12 py-8 min-h-[180px] flex flex-col justify-center">
                <div className="mb-3">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">
                    Copy {copy.frames[frameIdx].frameNumber}
                  </p>
                </div>
                <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed text-center">
                  {copy.frames[frameIdx].caption || <span className="italic text-gray-400">No caption</span>}
                </p>
                {copy.frames[frameIdx].hashtags && (
                  <p className="text-[10px] text-blue-600 font-medium mt-3 text-center">
                    {copy.frames[frameIdx].hashtags}
                  </p>
                )}

                {copy.frames.length > 1 && (
                  <>
                    <button
                      onClick={prevFrame}
                      className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-gray-50 hover:bg-gray-100 rounded-full flex items-center justify-center shadow-sm border border-gray-200 transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4 text-gray-600" />
                    </button>
                    <button
                      onClick={nextFrame}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-gray-50 hover:bg-gray-100 rounded-full flex items-center justify-center shadow-sm border border-gray-200 transition-colors"
                    >
                      <ChevronRight className="w-4 h-4 text-gray-600" />
                    </button>
                    
                    {/* Dots */}
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                      {copy.frames.map((_, idx) => (
                        <span
                          key={idx}
                          className={`w-1.5 h-1.5 rounded-full transition-all ${
                            idx === frameIdx ? 'bg-primary' : 'bg-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    {/* Count */}
                    <div className="absolute bottom-3 right-4 text-[10px] text-gray-400 font-medium">
                      {frameIdx + 1} / {copy.frames.length}
                    </div>
                  </>
                )}
              </div>
            )}

            {copy.mediaType !== 'CAROUSEL' && copy.caption && copy.caption !== copy.content && (
              <>
                <hr className="border-gray-200" />
                <div>
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Caption</p>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{copy.caption}</p>
                </div>
              </>
            )}

            {copy.mediaType !== 'CAROUSEL' && copy.hashtags && (
              <>
                <hr className="border-gray-200" />
                <div>
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Hashtags</p>
                  <p className="text-xs text-blue-600 font-medium leading-relaxed">{copy.hashtags}</p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
