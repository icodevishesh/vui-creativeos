'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CheckCircle2, XCircle, MessageSquare, Clock, X, Send, Eye,
  FileText, Download, Image as ImageIcon, Hash, Globe, Calendar,
  Film, Check, RefreshCw, BadgeCheck, Building2, BookOpen, User,
  ChevronRight, ChevronDown,
} from 'lucide-react';
import { toast } from 'react-hot-toast';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Attachment {
  id: string; fileName: string; fileUrl: string; mimeType: string; fileSize?: number; platform?: string; platformType?: string;
}

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
  id: string; content: string; caption?: string; hashtags?: string;
  platforms?: string[]; mediaType?: string; publishDate?: string;
  publishTime?: string; status?: string;
  bucket?: { id: string; name: string } | null;
}
interface CalendarRef {
  id: string; name: string; objective?: string; copies: CalendarCopyRef[];
}
interface ApprovalTask {
  id: string; title: string; description?: string;
  status: 'CLIENT_REVIEW'; priority: string;
  mediaUrls: string[]; feedbacks: string[]; countSubTask: number;
  startDate?: string; endDate?: string; createdAt: string; updatedAt: string;
  project: { id: string; name: string };
  client: { id: string; companyName: string };
  assignedTo?: { id: string; name: string };
  calendarCopy?: CalendarCopyRef | null;
  calendar?: CalendarRef | null;
  attachments?: Attachment[];
  subTasks: Array<{ id: string; title: string; description: string; status: string; createdAt: string }>;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TASK_STATUS_BADGE: Record<string, { label: string; className: string }> = {
  INTERNAL_REVIEW: { label: 'Internal Review', className: 'bg-[#FFF8E6] text-[#D97706]' },
  CLIENT_REVIEW: { label: 'Client Review', className: 'bg-indigo-50 text-indigo-600' },
  APPROVED: { label: 'Approved', className: 'bg-emerald-50 text-emerald-700' },
  PUBLISHED: { label: 'Published', className: 'bg-emerald-50 text-emerald-700' },
};

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
          isMulti ? 'cursor-pointer hover:bg-gray-50/60 transition-colors' : ''
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
              {tasks.length} calendar{tasks.length !== 1 ? 's' : ''}
            </span>
            {statusCounts['CLIENT_REVIEW'] ? (
              <span className="text-[10px] font-bold bg-indigo-50 text-indigo-600 border border-indigo-100 px-1.5 py-0.5 rounded-full">
                {statusCounts['CLIENT_REVIEW']} awaiting review
              </span>
            ) : null}
            {statusCounts['APPROVED'] ? (
              <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 px-1.5 py-0.5 rounded-full">
                {statusCounts['APPROVED']} approved
              </span>
            ) : null}
          </div>
        </div>

        {isMulti && (
          <ChevronDown
            className={`w-4 h-4 text-gray-400 shrink-0 transition-transform duration-200 ${
              open ? 'rotate-180' : ''
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

  // Derive effective status from copies: task is only APPROVED when ALL copies are APPROVED/PUBLISHED
  const copies = calendar.copies ?? [];
  const effectiveStatus = copies.length > 0 && copies.every(c => c.status === 'APPROVED' || c.status === 'PUBLISHED')
    ? 'APPROVED'
    : 'CLIENT_REVIEW';

  const badge = TASK_STATUS_BADGE[effectiveStatus] ?? { label: effectiveStatus, className: 'bg-gray-100 text-gray-500' };

  const platforms = Array.from(
    new Set(calendar.copies?.map((c) => c.platforms?.[0]).filter(Boolean))
  ) as string[];

  return (
    <div
      className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-gray-50/60 transition-colors group"
      onClick={() => router.push(`/portal/approvals/calendar/${calendar.id}`)}
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
            {copyCount} {copyCount === 1 ? 'copy' : 'copies'}
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

// ─── Copies Preview Modal ────────────────────────────────────────────────────

function CopiesPreviewModal({ isOpen, onClose, task }: { isOpen: boolean; onClose: () => void; task: ApprovalTask | null }) {
  const [activeIdx, setActiveIdx] = useState(0);
  if (!isOpen || !task || !task.calendar) return null;
  const { calendar } = task;
  const copies = calendar.copies ?? [];
  const activeCopy = copies[activeIdx];

  const platformColor: Record<string, string> = {
    Instagram: 'bg-pink-50 text-pink-600 border-pink-100',
    LinkedIn: 'bg-blue-50 text-blue-700 border-blue-100',
    Twitter: 'bg-sky-50 text-sky-600 border-sky-100',
    Facebook: 'bg-indigo-50 text-indigo-600 border-indigo-100',
  };

  return (
    <div className="fixed inset-0 z-70 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gray-950/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <div>
            <h2 className="text-sm font-bold text-gray-900">{task.title}</h2>
            <p className="text-xs text-gray-400 mt-0.5">{copies.length} {copies.length === 1 ? 'copy' : 'copies'}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100"><X className="w-4 h-4" /></button>
        </div>
        <div className="flex flex-1 min-h-0 overflow-hidden">
          <div className="w-64 shrink-0 border-r border-gray-100 overflow-y-auto bg-gray-50/40 p-3 space-y-1.5">
            {calendar.objective && (
              <div className="mb-3 px-3 py-2.5 bg-indigo-50 border border-indigo-100 rounded-lg">
                <p className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest mb-1">Objective</p>
                <p className="text-[11px] text-indigo-800 leading-relaxed">{calendar.objective}</p>
              </div>
            )}
            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest px-1 pb-1">Copies ({copies.length})</p>
            {copies.map((copy, idx) => (
              <button key={copy.id} onClick={() => setActiveIdx(idx)}
                className={`w-full text-left px-3 py-2.5 rounded-lg border transition-all ${activeIdx === idx ? 'bg-white border-indigo-200 shadow-sm' : 'border-transparent hover:bg-white hover:border-gray-100'}`}>
                <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                  {copy.mediaType && <span className="text-[9px] font-bold bg-violet-50 text-violet-600 border border-violet-100 px-1.5 py-0.5 rounded-full">{copy.mediaType}</span>}
                </div>
                <p className="text-[11px] text-gray-700 font-medium line-clamp-2 leading-snug">{copy.content}</p>
                {copy.publishDate && (
                  <p className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
                    <Calendar className="w-2.5 h-2.5" />
                    {new Date(copy.publishDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    {copy.publishTime && ` · ${copy.publishTime}`}
                  </p>
                )}
              </button>
            ))}
          </div>
          {activeCopy ? (
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              <div className="flex flex-wrap items-center gap-2">
                {activeCopy.bucket && <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-100 px-2.5 py-1 rounded-full"><Hash className="w-3 h-3" />{activeCopy.bucket.name}</span>}
                {activeCopy.publishDate && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-white text-gray-500 border border-gray-200 px-2.5 py-1 rounded-full">
                    <Calendar className="w-3 h-3" />
                    {new Date(activeCopy.publishDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    {activeCopy.publishTime && ` · ${activeCopy.publishTime}`}
                  </span>
                )}
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Creative Copy</p>
                <div className="bg-gray-50 border border-gray-100 rounded-lg p-4">
                  <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">{activeCopy.content}</p>
                </div>
              </div>
              {activeCopy.caption && (
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Caption</p>
                  <div className="bg-gray-50 border border-gray-100 rounded-lg p-4">
                    <p className="text-sm text-gray-600 leading-relaxed italic">{activeCopy.caption}</p>
                  </div>
                </div>
              )}
              {activeCopy.hashtags && (
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Hashtags</p>
                  <p className="text-sm font-semibold text-indigo-500 wrap-break-word">{activeCopy.hashtags}</p>
                </div>
              )}
              {activeCopy.platforms && activeCopy.platforms.length > 0 && (
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Platforms</p>
                  <p className="text-sm font-semibold text-indigo-500 wrap-break-word">{activeCopy.platforms.join(", ")}</p>
                </div>
              )}
              {activeCopy.mediaType &&
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Media Type</p>
                  <p className="text-sm font-semibold text-indigo-500 wrap-break-word">{activeCopy.mediaType}</p>
                </div>}

              {copies.length > 1 && (
                <div className="flex items-center gap-2 pt-2">
                  {copies.map((_, i) => (
                    <button key={i} onClick={() => setActiveIdx(i)} className={`w-2 h-2 rounded-full transition-all ${i === activeIdx ? 'bg-indigo-500 scale-125' : 'bg-gray-200 hover:bg-gray-300'}`} />
                  ))}
                  <span className="ml-2 text-xs text-gray-400">{activeIdx + 1} / {copies.length}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400"><p className="text-sm">No copies found.</p></div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Design Preview Modal ─────────────────────────────────────────────────────

function DesignPreviewModal({ isOpen, onClose, task }: { isOpen: boolean; onClose: () => void; task: ApprovalTask | null }) {
  const [activeFile, setActiveFile] = useState(0);
  if (!isOpen || !task) return null;
  const attachments = task.attachments ?? [];
  const copy = task.calendarCopy;
  const currentFile = attachments[activeFile];
  const isImage = (mime?: string) => !!mime && mime.startsWith('image/');
  const isPdf = (mime?: string) => mime === 'application/pdf';
  const formatBytes = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="fixed inset-0 z-70 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gray-950/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-lg shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <div>
            <h2 className="text-sm font-semibold text-gray-900">{task.title}</h2>
            <p className="text-xs text-gray-400 mt-0.5">{task.client?.companyName}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100"><X className="w-4 h-4" /></button>
        </div>
        <div className="flex flex-1 min-h-0 overflow-hidden">
          <div className="w-72 shrink-0 border-r border-gray-100 overflow-y-auto p-5 space-y-4 bg-gray-50/50">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Copy Reference</p>
            {copy ? (
              <div className="space-y-3">
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
                    <p className="text-xs text-indigo-500 font-medium wrap-break-word">{copy.hashtags}</p>
                  </div>
                )}
              </div>
            ) : <p className="text-xs text-gray-400 italic">No copy linked.</p>}
            {attachments.length > 0 && (() => {
              const PILL: Record<string, string> = {
                Instagram: 'bg-pink-50 text-pink-600 border-pink-100',
                LinkedIn:  'bg-blue-50 text-blue-700 border-blue-100',
                Twitter:   'bg-sky-50 text-sky-600 border-sky-100',
                Facebook:  'bg-indigo-50 text-indigo-600 border-indigo-100',
              };
              const pill = (p: string) => PILL[p] ?? 'bg-gray-50 text-gray-500 border-gray-200';

              const groups: Record<string, Array<{ file: Attachment; idx: number }>> = {};
              attachments.forEach((file, idx) => {
                const key = file.platform || 'General';
                if (!groups[key]) groups[key] = [];
                groups[key].push({ file, idx });
              });
              const hasPlatforms = Object.keys(groups).some(k => k !== 'General');

              return (
                <div className="pt-3 border-t border-gray-100 space-y-3">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Uploaded Files ({attachments.length})</p>
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
                        <button key={file.id} onClick={() => setActiveFile(idx)}
                          className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-left transition-all text-xs font-medium ${activeFile === idx ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' : 'text-gray-600 hover:bg-gray-100 border border-transparent'}`}>
                          {isImage(file.mimeType) ? <ImageIcon className="w-3.5 h-3.5 shrink-0" /> : <FileText className="w-3.5 h-3.5 shrink-0" />}
                          <span className="truncate">{file.fileName}</span>
                          {file.fileSize && <span className="ml-auto shrink-0 text-[10px] text-gray-400">{formatBytes(file.fileSize)}</span>}
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
              <div className="flex flex-col items-center gap-3 text-gray-500"><ImageIcon className="w-10 h-10 opacity-40" /><p className="text-sm font-medium">No files uploaded yet</p></div>
            ) : currentFile ? (
              <>
                {/* Platform + type badge */}
                {currentFile.platform && (
                  <div className="flex items-center gap-2 flex-wrap justify-center shrink-0">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-white/10 text-white border border-white/20">
                      <Globe className="w-3 h-3" />{currentFile.platform}
                    </span>
                    {currentFile.platformType && (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-white/10 text-white border border-white/20 capitalize">
                        {currentFile.platformType}
                      </span>
                    )}
                    <span className="text-[10px] text-white/40 font-medium">
                      {getAspectRatio(currentFile.platform, currentFile.platformType).replace('/', ' : ')} ratio
                    </span>
                  </div>
                )}

                {/* Aspect-ratio preview */}
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
                  <iframe src={currentFile.fileUrl} className="w-full rounded-lg shrink-0" style={{ height: 'calc(90vh - 220px)' }} title={currentFile.fileName} />
                )}

                {!isImage(currentFile.mimeType) && !isPdf(currentFile.mimeType) && (
                  <div className="flex flex-col items-center gap-4 text-white shrink-0">
                    <div className="w-20 h-20 bg-white/10 rounded-2xl flex items-center justify-center"><FileText className="w-10 h-10 text-white/60" /></div>
                    <p className="text-sm font-medium">{currentFile.fileName}</p>
                    <a href={currentFile.fileUrl} download={currentFile.fileName} className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-gray-900 rounded-lg text-sm font-semibold hover:bg-gray-100">
                      <Download className="w-4 h-4" />Download File
                    </a>
                  </div>
                )}

                <div className="flex items-center gap-3 flex-wrap justify-center shrink-0">
                  <p className="text-xs text-white/60">{currentFile.fileName}</p>
                  <a href={currentFile.fileUrl} download={currentFile.fileName} className="inline-flex items-center gap-1.5 text-xs text-white/60 hover:text-white transition-colors">
                    <Download className="w-3.5 h-3.5" />Download
                  </a>
                </div>

                {attachments.length > 1 && (
                  <div className="flex items-center gap-2 shrink-0">
                    {attachments.map((_, idx) => (
                      <button key={idx} onClick={() => setActiveFile(idx)} className={`w-2 h-2 rounded-full transition-all ${idx === activeFile ? 'bg-white' : 'bg-white/30 hover:bg-white/60'}`} />
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

function FeedbackModal({ isOpen, onClose, onSubmit, actionType, taskTitle, isLoading }: {
  isOpen: boolean; onClose: () => void; onSubmit: (f: string) => void;
  actionType: 'reject' | 'feedback'; taskTitle: string; isLoading: boolean;
}) {
  const [feedback, setFeedback] = useState('');
  if (!isOpen) return null;
  const isReject = actionType === 'reject';

  const handleSubmit = () => {
    if (!feedback.trim()) { toast.error('Please enter your feedback'); return; }
    onSubmit(feedback.trim());
    setFeedback('');
  };

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center">
      <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-lg shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
        <div className={`px-6 py-4 flex items-center justify-between ${isReject ? 'bg-linear-to-r from-red-500 to-rose-500' : 'bg-linear-to-r from-amber-500 to-orange-500'}`}>
          <div className="flex items-center gap-3">
            {isReject ? <XCircle className="w-5 h-5 text-white" /> : <MessageSquare className="w-5 h-5 text-white" />}
            <h3 className="text-sm font-medium text-white">{isReject ? 'Reject Task' : 'Give Feedback'}</h3>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-500 font-medium mb-1">Task</p>
            <p className="text-xs font-medium text-gray-900">{taskTitle}</p>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1.5">
              {isReject ? 'Reason for Rejection' : 'Your Feedback'}
            </label>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder={isReject ? 'Explain why this needs changes...' : 'Share your revision notes...'}
              rows={4}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 bg-white text-gray-900 placeholder:text-gray-400 resize-none"
            />
          </div>
        </div>
        <div className="px-6 py-4 bg-gray-50 flex items-center justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100">Cancel</button>
          <button onClick={handleSubmit} disabled={isLoading}
            className={`inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white rounded-lg transition-all shadow-sm disabled:opacity-50 ${isReject ? 'bg-red-600 hover:bg-red-700' : 'bg-amber-600 hover:bg-amber-700'}`}>
            <Send className="w-4 h-4" />
            {isLoading ? 'Submitting...' : isReject ? 'Reject' : 'Send Feedback'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Approval Card ────────────────────────────────────────────────────────────

function ApprovalCard({ task, onApprove, onReject, onFeedback, onPreview, onPreviewCopies, isActioning }: {
  task: ApprovalTask; onApprove: () => void; onReject: () => void;
  onFeedback: () => void; onPreview: () => void; onPreviewCopies: () => void;
  isActioning: boolean;
}) {
  const currentVersion = `v${(task.subTasks?.length || 0) + 1}`;
  const isDesignerTask = !!task.calendarCopy;
  const isWriterTask = !isDesignerTask;
  const hasFiles = (task.attachments?.length ?? 0) > 0;
  const copyCount = task.calendar?.copies?.length ?? 0;

  return (
    <div className="bg-white rounded-lg border border-gray-100 shadow-sm overflow-hidden">
      <div className="p-6 space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-0.5 min-w-0">
            <h3 className="text-base font-semibold text-gray-900 truncate">{task.title}</h3>
            <div className="flex items-center gap-2 text-xs font-medium text-gray-400 flex-wrap">
              <span>{task.project?.name}</span>
              {task.calendarCopy?.platforms && task.calendarCopy.platforms.length > 0 && <><span className="opacity-50">•</span><span>{task.calendarCopy.platforms[0]}</span></>}
              {task.calendarCopy?.publishDate && (
                <><span className="opacity-50">•</span>
                  <span>{new Date(task.calendarCopy.publishDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                </>
              )}
              <span className="opacity-50">•</span>
              <span>{currentVersion}</span>
            </div>
          </div>
          <span className="shrink-0 px-3 py-1 text-[11px] font-bold uppercase tracking-wider rounded-lg bg-indigo-50 text-indigo-600">
            Awaiting Your Review
          </span>
        </div>

        {/* Writer task: copies summary */}
        {isWriterTask && copyCount > 0 && task.calendar && (
          <div className="bg-gray-50 border border-gray-100 rounded-lg px-4 py-3 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-emerald-100 flex items-center justify-center shrink-0">
                  <FileText className="w-3.5 h-3.5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Calendar Copies</p>
                  <p className="text-xs text-gray-600 font-medium">{copyCount} {copyCount === 1 ? 'copy' : 'copies'} ready for your review</p>
                </div>
              </div>
              <span className="text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100 px-2 py-0.5 rounded-full">{copyCount} copies</span>
            </div>
            <div className="space-y-1.5 pt-1">
              {task.calendar.copies.slice(0, 2).map((copy, idx) => (
                <div key={copy.id} className="flex items-start gap-2">
                  <span className="text-[10px] font-bold text-gray-300 w-4 pt-0.5">#{idx + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                      {copy.platforms && copy.platforms.length > 0 && <span className="text-[9px] font-bold bg-white border border-gray-200 text-gray-500 px-1.5 py-0.5 rounded-full">{copy.platforms.join(", ")}</span>}
                      {copy.mediaType && <span className="text-[9px] font-bold bg-white border border-gray-200 text-gray-500 px-1.5 py-0.5 rounded-full">{copy.mediaType}</span>}
                      {copy.publishDate && <span className="text-[9px] font-bold text-gray-400">{new Date(copy.publishDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>}
                    </div>
                    <p className="text-[11px] text-gray-600 line-clamp-1 leading-relaxed">{copy.content}</p>
                  </div>
                </div>
              ))}
              {copyCount > 2 && <p className="text-[10px] text-gray-400 pl-6">+{copyCount - 2} more</p>}
            </div>
          </div>
        )}

        {/* Designer task: copy snippet */}
        {isDesignerTask && task.calendarCopy && (
          <div className="bg-gray-50 border border-gray-100 rounded-lg px-4 py-3 flex items-start gap-3">
            <div className="w-6 h-6 rounded-md bg-indigo-100 flex items-center justify-center shrink-0 mt-0.5">
              <FileText className="w-3.5 h-3.5 text-indigo-600" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Creative Brief</p>
              <p className="text-xs text-gray-700 font-medium line-clamp-2 leading-relaxed">{task.calendarCopy.content}</p>
              {task.calendarCopy.caption && <p className="text-[11px] text-gray-400 italic mt-1 line-clamp-1">{task.calendarCopy.caption}</p>}
            </div>
            {hasFiles && (
              <span className="ml-auto shrink-0 inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100 px-2 py-0.5 rounded-full">
                <ImageIcon className="w-2.5 h-2.5" />{task.attachments!.length} file{task.attachments!.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={onApprove} disabled={isActioning}
            className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-[#00AB55] rounded-lg hover:bg-[#00964b] transition-all shadow-sm disabled:opacity-50">
            <Check className="w-3.5 h-3.5" />Approve
          </button>
          <button onClick={onFeedback} disabled={isActioning}
            className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-all shadow-sm disabled:opacity-50">
            <MessageSquare className="w-3.5 h-3.5" />Feedback
          </button>
          <button onClick={onReject} disabled={isActioning}
            className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold text-rose-500 bg-white border border-rose-100 rounded-lg hover:bg-rose-50 transition-all shadow-sm disabled:opacity-50">
            <X className="w-3.5 h-3.5" />Reject
          </button>
          {isWriterTask && copyCount > 0 && (
            <button onClick={onPreviewCopies}
              className="ml-auto inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-100 rounded-lg hover:bg-emerald-100 transition-all">
              <Eye className="w-3.5 h-3.5" />Preview Copies ({copyCount})
            </button>
          )}
          {isDesignerTask && hasFiles && (
            <button onClick={onPreview}
              className="ml-auto inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-lg hover:bg-indigo-100 transition-all">
              <Eye className="w-3.5 h-3.5" />Preview Design
            </button>
          )}
        </div>

        {/* Iteration history */}
        {(task.subTasks?.length || 0) > 0 && (
          <div className="pt-5 border-t border-gray-100 space-y-4">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Revision History</p>
            <div className="space-y-3">
              {task.subTasks.map((sub, index) => {
                const isRej = sub.description?.toLowerCase().includes('rejected');
                const cleanDesc = sub.description?.replace(/^(Rejected — |Feedback — )/, '');
                return (
                  <div key={sub.id} className="flex items-center justify-between group">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <span className="text-sm font-medium text-gray-400 w-8 shrink-0">v{index + 1}</span>
                      <span className={`shrink-0 px-3 py-1 text-[11px] font-bold uppercase tracking-wider rounded-full shadow-sm ${isRej ? 'bg-[#FFE4E6] text-[#E11D48]' : 'bg-[#FFF8E6] text-[#B45309]'}`}>
                        {isRej ? 'Rejected' : 'Feedback'}
                      </span>
                      <p className="text-xs font-medium text-gray-500 line-clamp-1 min-w-0">{cleanDesc}</p>
                    </div>
                    <span className="text-xs font-semibold text-gray-400 ml-4 tabular-nums shrink-0">
                      {new Date(sub.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                );
              })}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                  <span className="text-sm font-medium text-gray-400 w-8">v{task.subTasks.length + 1}</span>
                  <span className="px-3 py-1 text-[11px] font-bold uppercase tracking-wider rounded-full bg-[#F1F5F9] text-[#64748B] shadow-sm">Current</span>
                  <p className="text-xs font-medium text-gray-400">Awaiting your review</p>
                </div>
                <span className="text-xs font-semibold text-gray-400 ml-4 tabular-nums">
                  {new Date(task.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function PortalApprovalsPage() {
  const queryClient = useQueryClient();
  const [modalState, setModalState] = useState<{ isOpen: boolean; actionType: 'reject' | 'feedback'; task: ApprovalTask | null }>({
    isOpen: false, actionType: 'reject', task: null,
  });
  const [previewTask, setPreviewTask] = useState<ApprovalTask | null>(null);
  const [copiesPreviewTask, setCopiesPreviewTask] = useState<ApprovalTask | null>(null);

  const { data: tasks = [], isLoading, error } = useQuery<ApprovalTask[]>({
    queryKey: ['portal-approvals'],
    queryFn: async () => {
      const res = await fetch('/api/portal/approvals');
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Error ${res.status}`);
      }
      return res.json();
    },
  });

  const { data: approvedTasks = [] } = useQuery<ApprovalTask[]>({
    queryKey: ['portal-approvals-approved'],
    queryFn: async () => {
      const res = await fetch('/api/portal/approvals?status=APPROVED');
      if (!res.ok) return [];
      return res.json();
    },
  });

  const actionMutation = useMutation({
    mutationFn: (payload: { taskId: string; action: string; feedback?: string }) =>
      fetch('/api/portal/approvals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }).then((res) => {
        if (!res.ok) throw new Error('Action failed');
        return res.json();
      }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['portal-approvals'] });
      queryClient.invalidateQueries({ queryKey: ['portal-approvals-approved'] });
      queryClient.invalidateQueries({ queryKey: ['portal-profile'] });
      const label = variables.action === 'approve' ? 'approved' : variables.action === 'reject' ? 'rejected' : 'feedback sent';
      toast.success(`Task ${label}!`);
      setModalState({ isOpen: false, actionType: 'reject', task: null });
    },
    onError: () => toast.error('Something went wrong. Please try again.'),
  });

  const handleApprove = (task: ApprovalTask) => {
    actionMutation.mutate({ taskId: task.id, action: 'approve' });
  };

  const handleModalSubmit = (feedback: string) => {
    if (!modalState.task) return;
    actionMutation.mutate({ taskId: modalState.task.id, action: modalState.actionType, feedback });
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Approvals</h1>
        <p className="text-sm text-gray-400 mt-1">
          {isLoading ? 'Loading...' : `${tasks.length} item${tasks.length !== 1 ? 's' : ''} awaiting your review`}
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <RefreshCw className="w-5 h-5 animate-spin text-indigo-400" />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-lg border border-red-100">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
            <X className="w-8 h-8 text-red-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-700 mb-1">Could not load approvals</h3>
          <p className="text-sm text-gray-400">{(error as Error).message}</p>
        </div>
      ) : tasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-lg border border-gray-100">
          <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mb-4">
            <CheckCircle2 className="w-8 h-8 text-emerald-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-700 mb-1">All caught up!</h3>
          <p className="text-sm text-gray-400">No items are waiting for your review right now.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {/* Content Calendars Section Header */}
          {(() => {
            // Group tasks by client
            type ClientGroup = { client: { id: string; companyName: string }; tasks: ApprovalTask[] };
            const grouped = tasks.reduce<Record<string, ClientGroup>>((acc: Record<string, ClientGroup>, task: ApprovalTask) => {
              const clientId = task.client.id;
              if (!acc[clientId]) acc[clientId] = { client: task.client, tasks: [] };
              acc[clientId].tasks.push(task);
              return acc;
            }, {});
            const clientGroups = Object.values(grouped) as ClientGroup[];

            return (
              <>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Content Calendars</span>
                  <span className="text-[10px] font-bold bg-indigo-50 text-indigo-600 border border-indigo-100 px-2 py-0.5 rounded-full">
                    {clientGroups.length} client{clientGroups.length !== 1 ? 's' : ''} · {tasks.length} calendar{tasks.length !== 1 ? 's' : ''}
                  </span>
                </div>

                {/* Client Groups */}
                {clientGroups.map(({ client, tasks: clientTasks }: ClientGroup) => (
                  <ClientCalendarGroup
                    key={client.id}
                    client={client}
                    tasks={clientTasks}
                  />
                ))}
              </>
            );
          })()}
        </div>
      )}

      {/* Approved Works */}
      {approvedTasks.length > 0 && (
        <div className="space-y-4 pt-4 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <BadgeCheck className="w-5 h-5 text-violet-500" />
            <h2 className="text-base font-bold text-gray-900">Approved Works</h2>
            <span className="ml-1 px-2 py-0.5 text-[11px] font-bold bg-violet-50 text-violet-600 border border-violet-100 rounded-full">
              {approvedTasks.length}
            </span>
          </div>
          <div className="flex flex-col gap-4">
            {approvedTasks.map((task: ApprovalTask) => {
              const isDesignerTask = !!task.calendarCopy;
              const copyCount = task.calendar?.copies?.length ?? 0;
              const hasFiles = (task.attachments?.length ?? 0) > 0;
              return (
                <div key={task.id} className="bg-white rounded-lg border border-gray-100 shadow-sm overflow-hidden opacity-80">
                  <div className="p-5 flex items-start justify-between gap-4">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-semibold text-gray-900 truncate">{task.title}</h3>
                        <span className="shrink-0 inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-full">
                          <CheckCircle2 className="w-3 h-3" /> Approved
                        </span>
                      </div>
                      <p className="text-xs text-gray-400">
                        {task.project?.name}
                        {isDesignerTask && task.calendarCopy?.platforms && task.calendarCopy.platforms.length > 0 && ` · ${task.calendarCopy.platforms.join(", ")}`}
                        {isDesignerTask && task.calendarCopy?.publishDate && ` · ${new Date(task.calendarCopy.publishDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
                        {!isDesignerTask && copyCount > 0 && ` · ${copyCount} ${copyCount === 1 ? 'copy' : 'copies'}`}
                        {hasFiles && ` · ${task.attachments!.length} file${task.attachments!.length !== 1 ? 's' : ''}`}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs text-gray-400 tabular-nums">
                      {new Date(task.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <FeedbackModal
        isOpen={modalState.isOpen}
        onClose={() => setModalState({ isOpen: false, actionType: 'reject', task: null })}
        onSubmit={handleModalSubmit}
        actionType={modalState.actionType}
        taskTitle={modalState.task?.title ?? ''}
        isLoading={actionMutation.isPending}
      />
      <DesignPreviewModal isOpen={!!previewTask} onClose={() => setPreviewTask(null)} task={previewTask} />
      <CopiesPreviewModal isOpen={!!copiesPreviewTask} onClose={() => setCopiesPreviewTask(null)} task={copiesPreviewTask} />
    </div>
  );
}
