'use client';

import { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Download,
  Image as ImageIcon,
  Pencil,
  Trash2,
  X,
  Hash,
  Globe,
  Calendar,
  Clock,
  Link as LinkIcon,
  Layers,
  CheckCircle2,
  User,
} from 'lucide-react';
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
  referenceUrl?: string;
  status?: string;
  bucket?: { id: string; name: string } | null;
  isCarousel?: boolean;
  frameCount?: number | null;
  frames?: Array<{
    id: string;
    frameNumber: number;
    caption?: string;
    hashtags?: string;
    creativeUrl?: string;
    creativeStatus?: string;
  }>;
}

export interface ApprovalTaskPreview {
  id: string;
  title: string;
  client?: { companyName: string } | null;
  approvedBy?: string;
  approvedDate?: string;
  approverRole?: string;
  calendarCopy?: CalendarCopyRef | null;
  attachments?: Attachment[] | null;
}

const PLATFORM_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  Instagram: { bg: 'bg-pink-50',  text: 'text-pink-600',  border: 'border-pink-200' },
  Facebook:  { bg: 'bg-blue-50',  text: 'text-blue-600',  border: 'border-blue-200' },
  LinkedIn:  { bg: 'bg-sky-50',   text: 'text-sky-700',   border: 'border-sky-200'  },
  Twitter:   { bg: 'bg-gray-100', text: 'text-gray-700',  border: 'border-gray-300' },
  YouTube:   { bg: 'bg-red-50',   text: 'text-red-600',   border: 'border-red-200'  },
  Pinterest: { bg: 'bg-rose-50',  text: 'text-rose-600',  border: 'border-rose-200' },
};

const MEDIA_TYPE_STYLE: Record<string, string> = {
  IMAGE:    'bg-violet-50 text-violet-700 border-violet-200',
  VIDEO:    'bg-blue-50 text-blue-700 border-blue-200',
  REEL:     'bg-pink-50 text-pink-700 border-pink-200',
  CAROUSEL: 'bg-amber-50 text-amber-700 border-amber-200',
  TEXT:     'bg-gray-100 text-gray-600 border-gray-200',
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

export function DesignPreviewModal({
  isOpen,
  onClose,
  task,
  onEdit,
  onDelete,
  onPrev,
  onNext,
}: {
  isOpen: boolean;
  onClose: () => void;
  task: ApprovalTaskPreview | null;
  onEdit?: () => void;
  onDelete?: () => void;
  onPrev?: () => void;
  onNext?: () => void;
}) {
  const [mediaIdx, setMediaIdx] = useState(0);

  if (!isOpen || !task) return null;

  const copy = task.calendarCopy;

  // Build media list: carousel frames first (if carousel), else task attachments
  const isCarousel = copy?.isCarousel && copy.frames && copy.frames.length > 0;
  const media: Array<{ url: string; name: string; mime: string }> = isCarousel
    ? (copy!.frames ?? []).map((f) => ({
        url: f.creativeUrl || '',
        name: `Frame ${f.frameNumber}`,
        mime: 'image/png',
      }))
    : (task.attachments ?? [])
        .filter((a) => isImageFile(a.mimeType) || isVideoFile(a.mimeType))
        .map((a) => ({ url: a.fileUrl, name: a.fileName, mime: a.mimeType }));

  const current = media[mediaIdx] ?? null;
  const safeIdx = Math.min(mediaIdx, Math.max(0, media.length - 1));
  const activeFrame = isCarousel ? copy?.frames?.[safeIdx] : null;

  const prev = () => setMediaIdx((i) => (i - 1 + media.length) % media.length);
  const next = () => setMediaIdx((i) => (i + 1) % media.length);

  // All platforms — prefer the array
  const platforms = copy?.platforms?.length
    ? copy.platforms
    : copy?.platform
    ? [copy.platform]
    : [];

  const publishLabel = [
    copy?.publishDate ? format(new Date(copy.publishDate), 'EEE, MMM d, yyyy') : null,
    copy?.publishTime ?? null,
  ]
    .filter(Boolean)
    .join(' · ');

  const approverLabel = [
    task.approvedBy,
    task.approverRole
      ? task.approverRole.split('_').map((w) => w[0] + w.slice(1).toLowerCase()).join(' ')
      : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <div
      className="fixed inset-0 z-70 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="absolute inset-0 bg-gray-950/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-gray-900 truncate">{task.title}</h2>
            {task.client && (
              <p className="text-xs text-gray-400 mt-0.5">{task.client.companyName}</p>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0 ml-4">
            {(onPrev || onNext) && (
              <div className="flex items-center gap-1 border border-gray-200 rounded-lg overflow-hidden">
                <button
                  onClick={onPrev}
                  disabled={!onPrev}
                  className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <div className="w-px h-4 bg-gray-200" />
                <button
                  onClick={onNext}
                  disabled={!onNext}
                  className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
            {onEdit && (
              <button
                onClick={onEdit}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-all"
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
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── Body: two panels ── */}
        <div className="flex flex-1 min-h-0 overflow-hidden">

          {/* Left panel — metadata + copy content */}
          <div className="w-72 shrink-0 border-r border-gray-100 overflow-y-auto p-5 space-y-5 bg-gray-50/40">

            {/* Platforms */}
            {platforms.length > 0 && (
              <div className="space-y-2">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
                  <Globe className="w-3 h-3" /> Platform{platforms.length > 1 ? 's' : ''}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {platforms.map((p) => {
                    const style = PLATFORM_STYLES[p] ?? { bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-200' };
                    return (
                      <span
                        key={p}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-[11px] font-bold ${style.bg} ${style.text} ${style.border}`}
                      >
                        {p}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Media type + bucket row */}
            <div className="flex flex-wrap gap-2">
              {copy?.mediaType && (
                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-[11px] font-bold ${MEDIA_TYPE_STYLE[copy.mediaType] ?? 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                  {copy.isCarousel && <Layers className="w-3 h-3" />}
                  {copy.mediaType}
                  {copy.isCarousel && copy.frameCount ? ` · ${copy.frameCount}F` : ''}
                </span>
              )}
              {copy?.bucket && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-[11px] font-bold bg-amber-50 text-amber-700 border-amber-200">
                  <Hash className="w-3 h-3" />
                  {copy.bucket.name}
                </span>
              )}
            </div>

            {/* Publish date/time */}
            {publishLabel && (
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> Scheduled
                </p>
                <p className="text-xs font-semibold text-gray-700">{publishLabel}</p>
              </div>
            )}

            {/* Copy content */}
            {copy?.content && (
              <div className="space-y-1.5">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Creative Copy</p>
                <div className="bg-white border border-gray-100 rounded-xl p-3">
                  <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">{copy.content}</p>
                </div>
              </div>
            )}

            {/* Per-frame caption (carousel active frame) */}
            {isCarousel && activeFrame?.caption && (
              <div className="space-y-1.5">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  Frame {activeFrame.frameNumber} Caption
                </p>
                <div className="bg-white border border-gray-100 rounded-xl p-3">
                  <p className="text-xs text-gray-700 leading-relaxed italic">{activeFrame.caption}</p>
                </div>
              </div>
            )}

            {/* Caption */}
            {!isCarousel && copy?.caption && (
              <div className="space-y-1.5">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Caption</p>
                <div className="bg-white border border-gray-100 rounded-xl p-3">
                  <p className="text-xs text-gray-600 leading-relaxed italic">{copy.caption}</p>
                </div>
              </div>
            )}

            {/* Hashtags */}
            {copy?.hashtags && (
              <div className="space-y-1.5">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
                  <Hash className="w-3 h-3" /> Hashtags
                </p>
                <p className="text-xs text-primary font-medium break-words">{copy.hashtags}</p>
              </div>
            )}

            {/* Reference URL */}
            {copy?.referenceUrl && (
              <div className="space-y-1.5">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
                  <LinkIcon className="w-3 h-3" /> Reference
                </p>
                <a
                  href={copy.referenceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary hover:underline break-all leading-relaxed"
                >
                  {copy.referenceUrl}
                </a>
              </div>
            )}

            {/* Approved by */}
            {task.approvedBy && (
              <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 space-y-1.5">
                <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Approved
                </p>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-emerald-200 flex items-center justify-center shrink-0">
                    <User className="w-3 h-3 text-emerald-700" />
                  </div>
                  <span className="text-xs font-semibold text-emerald-800">{approverLabel}</span>
                </div>
                {task.approvedDate && (
                  <p className="text-[10px] text-emerald-600 flex items-center gap-1">
                    <Clock className="w-2.5 h-2.5" />
                    {format(new Date(task.approvedDate), 'MMM d, yyyy · h:mm a')}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Right panel — media preview */}
          <div className="flex-1 bg-gray-900 flex flex-col items-center justify-center overflow-hidden relative">
            {media.length === 0 ? (
              <div className="flex flex-col items-center gap-3 text-gray-500">
                <ImageIcon className="w-12 h-12 opacity-30" />
                <p className="text-sm font-medium text-gray-400">No media uploaded</p>
              </div>
            ) : (
              <>
                {/* Media */}
                <div className="flex-1 w-full flex items-center justify-center p-6 min-h-0">
                  {isImageFile(current?.mime) ? (
                    <img
                      src={current.url}
                      alt={current.name}
                      className="max-w-full max-h-full object-contain rounded-xl shadow-2xl block"
                    />
                  ) : isVideoFile(current?.mime) ? (
                    <video
                      src={current.url}
                      controls
                      className="max-w-full max-h-full rounded-xl shadow-2xl block"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-3 text-white">
                      <ImageIcon className="w-10 h-10 opacity-40" />
                      <p className="text-sm text-white/60">{current?.name}</p>
                    </div>
                  )}
                </div>

                {/* Carousel nav */}
                {media.length > 1 && (
                  <>
                    <button
                      onClick={prev}
                      className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/10 hover:bg-white/20 border border-white/20 rounded-full flex items-center justify-center text-white transition-all"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={next}
                      className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/10 hover:bg-white/20 border border-white/20 rounded-full flex items-center justify-center text-white transition-all"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </>
                )}

                {/* Bottom bar: filename + dots + download */}
                <div className="shrink-0 w-full px-5 py-3 bg-black/30 backdrop-blur-sm flex items-center gap-3">
                  <p className="text-xs text-white/60 truncate flex-1">{current?.name}</p>
                  {media.length > 1 && (
                    <div className="flex items-center gap-1.5 shrink-0">
                      {media.map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => setMediaIdx(idx)}
                          className={`w-1.5 h-1.5 rounded-full transition-all ${
                            idx === mediaIdx ? 'bg-white' : 'bg-white/30 hover:bg-white/60'
                          }`}
                        />
                      ))}
                    </div>
                  )}
                  {current?.url && (
                    <button
                      onClick={() => downloadFile(current.url, current.name)}
                      className="shrink-0 w-7 h-7 bg-white/10 hover:bg-white/20 rounded-lg flex items-center justify-center text-white/70 hover:text-white transition-all"
                      title="Download"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
