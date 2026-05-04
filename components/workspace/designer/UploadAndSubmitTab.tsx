"use client";

import React, { useState } from 'react';
import { FileText, Upload, Send, File, X, Image as ImageIcon, Clock, Plus, Globe, Link, Layers } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface Task {
  id: string;
  title: string;
  description?: string;
  client?: { companyName: string };
  endDate?: string | Date;
  status: string;
  attachments?: any[];
  calendarCopy?: {
    content: string;
    caption?: string;
    platforms?: string[];
    platform?: string;   // legacy fallback
    mediaType?: string;
    publishDate?: string;
    publishTime?: string;
    referenceUrl?: string;
    isCarousel?: boolean;
    frameCount?: number;
    frames?: Array<{
      id: string;
      frameNumber: number;
      caption?: string;
      hashtags?: string;
      creativeUrl?: string;
      creativeStatus: string;
    }>;
    bucket?: { name: string } | null;
  } | null;
}

interface UploadAndSubmitTabProps {
  task: Task | null;
  onSuccess?: () => void;
}

// ─── Platform config ──────────────────────────────────────────────────────────

const PLATFORM_STYLES: Record<string, { pill: string; zone: string; header: string; activeType: string }> = {
  Instagram: {
    pill:       'bg-pink-50 text-pink-600 border-pink-100',
    zone:       'border-pink-200 hover:border-pink-400 hover:bg-pink-50/30',
    header:     'text-pink-600 bg-pink-50 border-pink-100',
    activeType: 'bg-pink-500 text-white border-pink-500',
  },
  LinkedIn: {
    pill:       'bg-blue-50 text-blue-700 border-blue-100',
    zone:       'border-blue-200 hover:border-blue-400 hover:bg-blue-50/30',
    header:     'text-blue-700 bg-blue-50 border-blue-100',
    activeType: 'bg-blue-600 text-white border-blue-600',
  },
  Twitter: {
    pill:       'bg-sky-50 text-sky-600 border-sky-100',
    zone:       'border-sky-200 hover:border-sky-400 hover:bg-sky-50/30',
    header:     'text-sky-600 bg-sky-50 border-sky-100',
    activeType: 'bg-sky-500 text-white border-sky-500',
  },
  Facebook: {
    pill:       'bg-indigo-50 text-indigo-600 border-indigo-100',
    zone:       'border-indigo-200 hover:border-indigo-400 hover:bg-indigo-50/30',
    header:     'text-indigo-600 bg-indigo-50 border-indigo-100',
    activeType: 'bg-indigo-600 text-white border-indigo-600',
  },
};

const defaultStyle = {
  pill:       'bg-gray-50 text-gray-600 border-gray-200',
  zone:       'border-gray-200 hover:border-gray-400 hover:bg-gray-50/50',
  header:     'text-gray-600 bg-gray-50 border-gray-200',
  activeType: 'bg-gray-600 text-white border-gray-600',
};

// Types available per platform
const PLATFORM_TYPES: Record<string, { label: string; value: string }[]> = {
  Instagram: [
    { label: 'Post',  value: 'post'  },
    { label: 'Story', value: 'story' },
    { label: 'Reel',  value: 'reel'  },
  ],
  Facebook: [
    { label: 'Post',  value: 'post'  },
    { label: 'Story', value: 'story' },
  ],
  Twitter:  [{ label: 'Post', value: 'post' }],
  LinkedIn: [{ label: 'Post', value: 'post' }],
};

function getPlatformStyle(platform: string) {
  return PLATFORM_STYLES[platform] ?? defaultStyle;
}

// ─── Per-Platform Upload Zone ─────────────────────────────────────────────────

type FileItem = { file: File; type: string };

function PlatformUploadZone({
  platform,
  files,
  onAdd,
  onRemove,
  onTypeChange,
}: {
  platform: string;
  files: FileItem[];
  onAdd: (newFiles: File[]) => void;
  onRemove: (index: number) => void;
  onTypeChange: (index: number, type: string) => void;
}) {
  const style = getPlatformStyle(platform);
  const inputId = `upload-${platform}`;
  const types = PLATFORM_TYPES[platform] ?? [{ label: 'Post', value: 'post' }];
  const isSingleType = types.length === 1;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) onAdd(Array.from(e.target.files));
    e.target.value = '';
  };

  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50/40 overflow-hidden">
      {/* Platform header */}
      <div className={`flex items-center gap-2 px-4 py-2.5 border-b border-gray-100 text-xs font-bold ${style.header}`}>
        <Globe className="w-3.5 h-3.5" />
        {platform}
        <span className="ml-auto font-semibold opacity-60">{files.length} file{files.length !== 1 ? 's' : ''}</span>
      </div>

      <div className="p-4 space-y-3">
        {/* Dropzone */}
        <div className={`relative border-2 border-dashed rounded-lg p-5 flex flex-col items-center justify-center transition-all cursor-pointer group ${style.zone}`}>
          <input
            id={inputId}
            type="file"
            multiple
            onChange={handleChange}
            className="absolute inset-0 opacity-0 cursor-pointer"
          />
          <div className="w-9 h-9 rounded-full bg-white shadow-sm flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
            <Plus className="w-4 h-4 text-gray-400" />
          </div>
          <p className="text-xs font-semibold text-gray-500">Drop or click to add files</p>
          <p className="text-[10px] text-gray-400 mt-0.5">PNG, JPG, PSD, AI, PDF</p>
        </div>

        {/* File list — each file has its own type selector */}
        {files.length > 0 && (
          <div className="space-y-2">
            {files.map((item, idx) => (
              <div
                key={idx}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${style.pill}`}
              >
                <File className="w-3.5 h-3.5 shrink-0 opacity-70" />
                <span className="text-[11px] font-bold max-w-[130px] truncate flex-1">{item.file.name}</span>

                {/* Per-file type selector */}
                {isSingleType ? (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${style.activeType}`}>
                    {types[0].label}
                  </span>
                ) : (
                  <div className="flex items-center gap-1 flex-wrap">
                    {types.map(t => (
                      <button
                        key={t.value}
                        type="button"
                        onClick={() => onTypeChange(idx, t.value)}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border transition-all ${
                          item.type === t.value
                            ? style.activeType
                            : 'bg-white text-gray-500 border-gray-200 hover:border-gray-400'
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                    {!item.type && (
                      <span className="text-[9px] text-rose-400 font-semibold">pick type</span>
                    )}
                  </div>
                )}

                <button
                  onClick={() => onRemove(idx)}
                  className="ml-auto opacity-50 hover:opacity-100 transition-opacity shrink-0"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export const UploadAndSubmitTab: React.FC<UploadAndSubmitTabProps> = ({ task, onSuccess }) => {
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Each file carries its own type: { file, type }
  const [filesByPlatform, setFilesByPlatform] = useState<Record<string, FileItem[]>>({});
  // Per-frame files for carousel tasks: keyed by frameId
  const [filesByFrame, setFilesByFrame] = useState<Record<string, File | null>>({});
  const [uploadingFrameId, setUploadingFrameId] = useState<string | null>(null);

  if (!task) {
    return (
      <div className="bg-white border border-gray-100 rounded-lg p-12 text-center flex flex-col items-center">
        <Upload size={32} className="text-gray-300 mb-4" />
        <h3 className="font-bold text-gray-900">Select a task first</h3>
        <p className="text-gray-500 text-sm">Expand a task from the list and click "Upload Design"</p>
      </div>
    );
  }

  // Resolve platforms from the linked copy (support both legacy and new field)
  const copy = task.calendarCopy;

  // Carousel helpers (derived from copy — must come after copy is declared)
  const isCarouselTask = !!(copy?.isCarousel && Array.isArray(copy.frames) && copy.frames.length > 0);
  const carouselFrames = isCarouselTask ? (copy!.frames ?? []) : [];
  const allFramesHaveFiles = carouselFrames.length > 0
    ? carouselFrames.every(f => !!filesByFrame[f.id])
    : true;

  const uploadFrameFile = async (frameId: string, file: File) => {
    setUploadingFrameId(frameId);
    try {
      const copyId = (copy as any)?.id ?? '';
      const calendarIdVal = (copy as any)?.calendarId ?? '';
      const uploadRes = await fetch(`/api/tasks/${task.id}/designer-content`, {
        method: 'PATCH',
        body: (() => { const fd = new FormData(); fd.append('file_carousel_frame', file); fd.append('fileMetadata', JSON.stringify({ carousel_frame: [frameId] })); return fd; })()
      });
      if (!uploadRes.ok) throw new Error('Upload failed');
      const uploadData = await uploadRes.json();
      const fileUrl = uploadData?.attachments?.find((a: any) => a.fileName === file.name)?.fileUrl ?? '';
      if (fileUrl && copyId && calendarIdVal) {
        await fetch(`/api/calendars/${calendarIdVal}/copies/${copyId}/frames/${frameId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ creativeUrl: fileUrl }),
        });
      }
      setFilesByFrame(prev => ({ ...prev, [frameId]: file }));
      toast.success(`Frame ${carouselFrames.find(f => f.id === frameId)?.frameNumber ?? ''} uploaded`);
    } catch {
      toast.error('Frame upload failed');
    } finally {
      setUploadingFrameId(null);
    }
  };

  const platforms: string[] = copy
    ? (Array.isArray(copy.platforms) && copy.platforms.length > 0
        ? copy.platforms
        : copy.platform
        ? [copy.platform]
        : [])
    : [];

  const addFiles = (platform: string, newFiles: File[]) => {
    const types = PLATFORM_TYPES[platform] ?? [];
    const defaultType = types.length === 1 ? types[0].value : '';
    const items: FileItem[] = newFiles.map(file => ({ file, type: defaultType }));
    setFilesByPlatform(prev => ({
      ...prev,
      [platform]: [...(prev[platform] ?? []), ...items],
    }));
  };

  const removeFile = (platform: string, index: number) => {
    setFilesByPlatform(prev => ({
      ...prev,
      [platform]: (prev[platform] ?? []).filter((_, i) => i !== index),
    }));
  };

  const changeFileType = (platform: string, index: number, type: string) => {
    setFilesByPlatform(prev => {
      const items = [...(prev[platform] ?? [])];
      items[index] = { ...items[index], type };
      return { ...prev, [platform]: items };
    });
  };

  const totalFiles = Object.values(filesByPlatform).reduce((sum, arr) => sum + arr.length, 0);

  const handleSubmit = async () => {
    if (isCarouselTask && !allFramesHaveFiles) {
      toast.error(`Upload all ${carouselFrames.length} frames before submitting`);
      return;
    }
    if (!isCarouselTask && totalFiles === 0 && !notes.trim()) {
      toast.error('Upload at least one file or add design notes');
      return;
    }

    // Validate: every file on a multi-type platform must have a type selected
    for (const [platform, items] of Object.entries(filesByPlatform)) {
      if (items.length === 0) continue;
      const types = PLATFORM_TYPES[platform] ?? [];
      if (types.length > 1) {
        const missing = items.findIndex(item => !item.type);
        if (missing !== -1) {
          toast.error(`Select a type for file "${items[missing].file.name}" on ${platform}`);
          return;
        }
      }
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();

      // Build per-file type metadata and append files in order
      const fileMetadata: Record<string, string[]> = {};
      for (const [platform, items] of Object.entries(filesByPlatform)) {
        if (items.length === 0) continue;
        fileMetadata[platform] = items.map(item => item.type);
        for (const item of items) {
          formData.append(platform ? `file_${platform}` : 'file', item.file);
        }
      }
      formData.append('fileMetadata', JSON.stringify(fileMetadata));

      if (notes.trim()) formData.append('notes', notes);
      formData.append('status', 'INTERNAL_REVIEW');

      const res = await fetch(`/api/tasks/${task.id}/designer-content`, {
        method: 'PATCH',
        body: formData,
      });

      if (!res.ok) throw new Error('Submission failed');
      toast.success('Design submitted for internal review');
      setFilesByPlatform({});
      setNotes('');
      onSuccess?.();
    } catch (err) {
      console.error('Submission failed', err);
      toast.error('Submission failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in duration-500">

      {/* Left Column: Brief & Assets */}
      <div className="bg-white border border-gray-100 rounded-lg p-6 space-y-6 h-fit">
        <div>
          <h3 className="text-xl font-bold text-gray-900 mb-1">Design Brief</h3>
          <p className="text-sm font-medium text-gray-400">{task.title} — {task.client?.companyName}</p>
        </div>

        <div>
          <p className="text-sm text-gray-600 leading-relaxed font-medium">
            {task.description || 'No specific requirements provided.'}
          </p>
        </div>

        {/* Copy reference */}
        {copy && (
          <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-4 space-y-3">
            <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Copy Reference</p>

            <div className="flex flex-wrap gap-1.5">
              {platforms.map(p => (
                <span
                  key={p}
                  className={`text-[10px] font-bold border px-2 py-0.5 rounded-full ${getPlatformStyle(p).pill}`}
                >
                  {p}
                </span>
              ))}
              {copy.mediaType && (
                <span className="text-[10px] font-bold bg-violet-50 text-violet-600 border border-violet-100 px-2 py-0.5 rounded-full">
                  {copy.mediaType}
                </span>
              )}
              {copy.bucket && (
                <span className="text-[10px] font-bold bg-white border border-indigo-100 text-indigo-600 px-2 py-0.5 rounded-full">
                  {copy.bucket.name}
                </span>
              )}
              {copy.publishDate && (
                <span className="text-[10px] font-bold text-gray-500 bg-white border border-gray-100 px-2 py-0.5 rounded-full">
                  Publish {new Date(copy.publishDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  {copy.publishTime && ` at ${copy.publishTime}`}
                </span>
              )}
            </div>

            <p className="text-xs text-indigo-800 leading-relaxed">{copy.content}</p>
            {copy.caption && (
              <p className="text-[11px] text-indigo-600 italic">{copy.caption}</p>
            )}
            {copy.referenceUrl && (
              <a
                href={copy.referenceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-indigo-500 hover:text-indigo-700 hover:underline break-all"
              >
                <Link size={11} className="shrink-0" /> {copy.referenceUrl}
              </a>
            )}
          </div>
        )}

        {/* Previously uploaded assets */}
        <div>
          <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Previously Uploaded</h4>
          {task.attachments && task.attachments.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {task.attachments.map((asset: any, idx: number) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg text-xs font-bold text-gray-600 border border-gray-100"
                >
                  <FileText size={14} className="text-gray-400" />
                  <span className="max-w-[140px] truncate">{asset.fileName}</span>
                  {asset.platform && (
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${getPlatformStyle(asset.platform).pill}`}>
                      {asset.platform}
                    </span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-gray-400 italic">No files uploaded yet.</p>
          )}
        </div>

        <div className="flex items-center gap-4 border-t border-gray-50 pt-4">
          {task.endDate && (
            <div className="flex items-center gap-1.5 text-xs font-bold text-gray-400">
              <Clock size={14} />
              Due {new Date(task.endDate).toLocaleDateString()}
            </div>
          )}
          <span className="bg-blue-50 text-blue-600 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest">
            {task.status.replace(/_/g, ' ')}
          </span>
        </div>
      </div>

      {/* Right Column: Upload per platform */}
      <div className="space-y-5">
        <div className="bg-white border border-gray-100 rounded-lg p-6 flex flex-col gap-6">
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-1">Upload Creatives</h3>
            <p className="text-sm font-medium text-gray-400">
              {platforms.length > 0
                ? `Upload a creative for each platform`
                : 'Upload your design files and submit for review'}
            </p>
          </div>

          {/* ── Carousel: per-frame upload slots ── */}
          {isCarouselTask ? (
            <div className="space-y-3">
              {carouselFrames.map(frame => {
                const hasFile = !!filesByFrame[frame.id];
                const isUploading = uploadingFrameId === frame.id;
                return (
                  <div key={frame.id} className={`rounded-lg border p-4 space-y-2 transition-all ${
                    hasFile ? 'border-emerald-200 bg-emerald-50/40' : 'border-gray-200 bg-gray-50/50'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">Frame {frame.frameNumber}</span>
                        {hasFile && <span className="text-[10px] font-bold text-emerald-500">✓ Uploaded</span>}
                        {frame.creativeStatus === 'UPLOADED' && !hasFile && (
                          <span className="text-[10px] font-bold text-emerald-400">Previously uploaded</span>
                        )}
                      </div>
                      <span className="text-[10px] text-gray-400">{frame.frameNumber} / {carouselFrames.length}</span>
                    </div>
                    {frame.caption && <p className="text-xs text-gray-600 line-clamp-2">{frame.caption}</p>}
                    <div className="relative">
                      <input
                        type="file"
                        accept="image/*,video/*"
                        onChange={e => { const f = e.target.files?.[0]; if (f) uploadFrameFile(frame.id, f); e.target.value = ''; }}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                        disabled={isUploading}
                      />
                      <div className={`flex items-center justify-center gap-2 py-2 rounded-lg border-2 border-dashed text-xs font-bold transition-all ${
                        hasFile
                          ? 'border-emerald-300 text-emerald-600 bg-white'
                          : 'border-gray-200 text-gray-400 bg-white hover:border-indigo-300 hover:text-indigo-500'
                      }`}>
                        {isUploading ? (
                          <><div className="w-3.5 h-3.5 border-2 border-indigo-400/30 border-t-indigo-500 rounded-full animate-spin" /> Uploading...</>
                        ) : hasFile ? (
                          <><ImageIcon size={14} /> {filesByFrame[frame.id]!.name}</>  
                        ) : (
                          <><Upload size={14} /> Click to upload Frame {frame.frameNumber}</>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              {!allFramesHaveFiles && (
                <p className="text-[11px] text-amber-600 font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
                  Upload all {carouselFrames.length} frames to submit
                </p>
              )}
            </div>
          ) : platforms.length > 0 ? (
            <div className="space-y-5">
              {platforms.map(platform => (
                <PlatformUploadZone
                  key={platform}
                  platform={platform}
                  files={filesByPlatform[platform] ?? []}
                  onAdd={(files) => addFiles(platform, files)}
                  onRemove={(idx) => removeFile(platform, idx)}
                  onTypeChange={(idx, type) => changeFileType(platform, idx, type)}
                />
              ))}
            </div>
          ) : (
            /* Fallback generic dropzone when copy has no platforms */
            <div className="space-y-3">
              <div className="relative border-2 border-dashed border-gray-200 rounded-lg p-10 flex flex-col items-center justify-center bg-gray-50/50 hover:bg-blue-50 group hover:border-blue-200 transition-all cursor-pointer">
                <input
                  type="file"
                  multiple
                  onChange={(e) => {
                    if (e.target.files) addFiles('', Array.from(e.target.files));
                    e.target.value = '';
                  }}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <ImageIcon size={24} className="text-gray-300 group-hover:text-blue-500" />
                </div>
                <p className="text-sm font-bold text-gray-900 mb-1">Drag & drop design files here</p>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">PNG, JPG, PSD, AI, PDF</p>
              </div>

              {(filesByPlatform[''] ?? []).length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {(filesByPlatform[''] ?? []).map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg text-xs font-bold border border-blue-100">
                      <File size={14} />
                      <span className="max-w-[160px] truncate">{item.file.name}</span>
                      <button onClick={() => removeFile('', idx)} className="ml-0.5 hover:text-blue-900">
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Total files badge */}
          {totalFiles > 0 && (
            <p className="text-xs font-semibold text-gray-500">
              {totalFiles} file{totalFiles !== 1 ? 's' : ''} ready to submit
            </p>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Design Notes</p>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Design notes (e.g., changes made, rationale)..."
              className="w-full min-h-[100px] p-4 bg-gray-50 border border-gray-100 rounded-lg text-sm font-medium text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all resize-none"
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={isSubmitting || (totalFiles === 0 && !notes.trim())}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-100 active:scale-[0.98]"
          >
            {isSubmitting ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Send size={18} />
            )}
            Submit for Internal Review
          </button>
        </div>
      </div>
    </div>
  );
};
