"use client";

import React, { useState } from 'react';
import { FilePlus, Calendar, Clock, Image, Hash, Globe, Trash2, Send, Plus, Loader2, AlertTriangle, X, Eye, Film } from 'lucide-react';
import { toast } from 'react-hot-toast';
import dayjs from 'dayjs';

interface CalendarCopiesListProps {
    calendarId: string;
    buckets: any[];
    copies: any[];
    onRefresh: () => void;
    taskId?: string;
    calendarObjective?: string;
}

const ALL_PLATFORMS = ['Instagram', 'LinkedIn', 'Twitter', 'Facebook'] as const;
type Platform = typeof ALL_PLATFORMS[number];

const PLATFORM_STYLES: Record<Platform, { bg: string; text: string; border: string; active: string }> = {
    Instagram: { bg: 'bg-pink-50', text: 'text-pink-600', border: 'border-pink-200', active: 'bg-pink-500 text-white border-pink-500' },
    LinkedIn: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', active: 'bg-blue-600 text-white border-blue-600' },
    Twitter: { bg: 'bg-sky-50', text: 'text-sky-600', border: 'border-sky-200', active: 'bg-sky-500 text-white border-sky-500' },
    Facebook: { bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-200', active: 'bg-indigo-600 text-white border-indigo-600' },
};

// ─── Platform Multi-Select ────────────────────────────────────────────────────

function PlatformMultiSelect({
    selected,
    onChange,
}: {
    selected: string[];
    onChange: (platforms: string[]) => void;
}) {
    const toggle = (platform: Platform) => {
        if (selected.includes(platform)) {
            onChange(selected.filter(p => p !== platform));
        } else {
            onChange([...selected, platform]);
        }
    };

    return (
        <div className="flex flex-wrap gap-2">
            {ALL_PLATFORMS.map((platform) => {
                const isActive = selected.includes(platform);
                const style = PLATFORM_STYLES[platform];
                return (
                    <button
                        key={platform}
                        type="button"
                        onClick={() => toggle(platform)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-bold transition-all select-none ${isActive
                            ? style.active
                            : `${style.bg} ${style.text} ${style.border} hover:opacity-80`
                            }`}
                    >
                        <Globe className="w-3 h-3" />
                        {platform}
                        {isActive && <X className="w-3 h-3 ml-0.5 opacity-70" />}
                    </button>
                );
            })}
        </div>
    );
}

// ─── Submit Preview Modal ─────────────────────────────────────────────────────

function SubmitPreviewModal({
    isOpen,
    onClose,
    onConfirm,
    copies,
    buckets,
    calendarObjective,
    isSubmitting,
}: {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    copies: any[];
    buckets: any[];
    calendarObjective?: string;
    isSubmitting: boolean;
}) {
    if (!isOpen) return null;

    const getBucketName = (bucketId: string) =>
        buckets.find((b) => b.id === bucketId)?.name ?? null;

    const getPlatforms = (copy: any): string[] => {
        if (Array.isArray(copy.platforms) && copy.platforms.length > 0) return copy.platforms;
        if (copy.platform) return [copy.platform];
        return [];
    };

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-gray-950/60 backdrop-blur-sm" onClick={onClose} />

            <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
                    <div>
                        <h2 className="text-base font-bold text-gray-900">Submit for Internal Review</h2>
                        <p className="text-xs text-gray-400 mt-0.5">
                            Review all {copies.length} {copies.length === 1 ? 'copy' : 'copies'} before submitting
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {calendarObjective && (
                        <div className="bg-indigo-50 border border-indigo-100 rounded-lg px-4 py-3">
                            <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-1">Calendar Objective</p>
                            <p className="text-xs text-indigo-800 leading-relaxed">{calendarObjective}</p>
                        </div>
                    )}

                    <div className="space-y-3">
                        {copies.map((copy, idx) => {
                            const bucketName = getBucketName(copy.bucketId);
                            const platforms = getPlatforms(copy);

                            return (
                                <div key={copy.id} className="bg-gray-50 border border-gray-100 rounded-lg p-4 space-y-3">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest w-5">#{idx + 1}</span>

                                        {platforms.map(p => (
                                            <span key={p} className={`inline-flex items-center gap-1 text-[10px] font-bold border px-2 py-0.5 rounded-full ${PLATFORM_STYLES[p as Platform]
                                                ? `${PLATFORM_STYLES[p as Platform].bg} ${PLATFORM_STYLES[p as Platform].text} ${PLATFORM_STYLES[p as Platform].border}`
                                                : 'bg-gray-50 text-gray-600 border-gray-100'
                                                }`}>
                                                <Globe className="w-2.5 h-2.5" /> {p}
                                            </span>
                                        ))}

                                        {copy.mediaType && (
                                            <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-violet-50 text-violet-600 border border-violet-100 px-2 py-0.5 rounded-full">
                                                <Film className="w-2.5 h-2.5" /> {copy.mediaType}
                                            </span>
                                        )}
                                        {bucketName && (
                                            <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-100 px-2 py-0.5 rounded-full">
                                                <Hash className="w-2.5 h-2.5" /> {bucketName}
                                            </span>
                                        )}
                                        {copy.publishDate && (
                                            <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-white text-gray-500 border border-gray-200 px-2 py-0.5 rounded-full ml-auto">
                                                <Calendar className="w-2.5 h-2.5" />
                                                {new Date(copy.publishDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                {copy.publishTime && ` · ${copy.publishTime}`}
                                            </span>
                                        )}
                                    </div>

                                    <div className="space-y-1.5">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Creative Copy</p>
                                        <p className="text-xs text-gray-800 leading-relaxed whitespace-pre-wrap">{copy.content}</p>
                                    </div>

                                    {copy.caption && (
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Caption</p>
                                            <p className="text-xs text-gray-600 leading-relaxed italic">{copy.caption}</p>
                                        </div>
                                    )}
                                    {copy.hashtags && (
                                        <p className="text-[11px] font-semibold text-blue-500">{copy.hashtags}</p>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between shrink-0">
                    <p className="text-xs text-gray-400">
                        {copies.length} {copies.length === 1 ? 'copy' : 'copies'} will move to <span className="font-semibold text-gray-600">Internal Review</span>
                    </p>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={onConfirm}
                            disabled={isSubmitting}
                            className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white text-sm font-bold rounded-lg transition-all shadow-sm shadow-emerald-100"
                        >
                            {isSubmitting
                                ? <Loader2 className="w-4 h-4 animate-spin" />
                                : <><Send className="w-4 h-4" /> Confirm & Submit</>
                            }
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export const CalendarCopiesList: React.FC<CalendarCopiesListProps> = ({
    calendarId, buckets, copies, onRefresh, taskId, calendarObjective
}) => {
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [removingId, setRemovingId] = useState<string | null>(null);
    const [showPreviewModal, setShowPreviewModal] = useState(false);

    const draftCopies = copies.filter(c => !c.status || c.status === 'DRAFT');
    const submittedCopies = copies.filter(c => c.status && c.status !== 'DRAFT');

    const [form, setForm] = useState({
        content: '',
        caption: '',
        hashtags: '',
        publishDate: '',
        publishTime: '',
        bucketId: '',
        platforms: [] as string[],
        mediaType: '',
    });

    const resetForm = () => setForm({
        content: '',
        caption: '',
        hashtags: '',
        publishDate: '',
        publishTime: '',
        bucketId: '',
        platforms: [],
        mediaType: '',
    });

    const hasDuplicateDate = !!form.publishDate && copies.some(copy => {
        if (!copy.publishDate) return false;
        return dayjs(copy.publishDate).format('YYYY-MM-DD') === form.publishDate;
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.content || !form.bucketId) {
            toast.error('Please fill in required fields');
            return;
        }
        setIsLoading(true);
        try {
            const res = await fetch(`/api/calendars/${calendarId}/copies`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });
            if (res.ok) {
                toast.success('Copy added to calendar');
                resetForm();
                onRefresh();
            } else {
                toast.error('Failed to add copy');
            }
        } catch {
            toast.error('Failed to add copy');
        } finally {
            setIsLoading(false);
        }
    };

    const handleRemove = async (copyId: string) => {
        setRemovingId(copyId);
        try {
            const res = await fetch(`/api/calendars/${calendarId}/copies/${copyId}`, { method: 'DELETE' });
            if (res.ok) {
                toast.success('Copy removed');
                onRefresh();
            } else {
                toast.error('Failed to remove copy');
            }
        } catch {
            toast.error('Failed to remove copy');
        } finally {
            setRemovingId(null);
        }
    };

    const handleSubmitForReview = async () => {
        if (!taskId) { toast.error('No task linked to this calendar'); return; }
        if (draftCopies.length === 0) { toast.error('No new copies to submit'); return; }
        setIsSubmitting(true);
        try {
            // Only update DRAFT copies to INTERNAL_REVIEW
            await Promise.all(
                draftCopies.map((copy) =>
                    fetch(`/api/calendars/${calendarId}/copies/${copy.id}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ status: 'INTERNAL_REVIEW' }),
                    })
                )
            );

            // Update the task status
            const res = await fetch(`/api/tasks/${taskId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'INTERNAL_REVIEW' }),
            });
            if (res.ok) {
                toast.success('Copies submitted for internal review');
                setShowPreviewModal(false);
                onRefresh();
            } else {
                toast.error('Failed to submit for review');
            }
        } catch {
            toast.error('Failed to submit for review');
        } finally {
            setIsSubmitting(false);
        }
    };

    const getCopyPlatforms = (copy: any): string[] => {
        if (Array.isArray(copy.platforms) && copy.platforms.length > 0) return copy.platforms;
        if (copy.platform) return [copy.platform];
        return [];
    };

    return (
        <div className="space-y-6">
            {/* Add New Copy Form */}
            <div className="bg-white border border-gray-100 rounded-lg p-4 shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600">
                        <FilePlus size={20} />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900">Add New Copy</h2>
                        <p className="text-gray-500 text-sm">Fill in copy details for a single creative post</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="text-xs tracking-widest font-medium text-gray-500 uppercase block mb-2">Creative Copy *</label>
                        <textarea
                            value={form.content}
                            onChange={(e) => setForm({ ...form, content: e.target.value })}
                            placeholder="The main creative copy / content for this post..."
                            className="w-full min-h-[120px] p-4 bg-gray-50 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-100 focus:bg-white transition-all text-sm text-gray-700 resize-none"
                        />
                    </div>

                    <div>
                        <label className="text-xs tracking-widest font-medium text-gray-500 uppercase block mb-2">Caption *</label>
                        <textarea
                            value={form.caption}
                            onChange={(e) => setForm({ ...form, caption: e.target.value })}
                            placeholder="Caption that accompanies the creative..."
                            className="w-full min-h-[100px] p-4 bg-gray-50 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-100 focus:bg-white transition-all text-sm text-gray-700 resize-none"
                        />
                    </div>

                    <div>
                        <label className="text-xs tracking-widest font-medium text-gray-500 uppercase block mb-2">Hashtags</label>
                        <input
                            type="text"
                            value={form.hashtags}
                            onChange={(e) => setForm({ ...form, hashtags: e.target.value })}
                            placeholder="#marketing #socialmedia #growth"
                            className="w-full p-2 bg-gray-50 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-100 focus:bg-white transition-all text-sm text-gray-700"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="text-xs tracking-widest font-medium text-gray-500 uppercase block mb-2">Publish Date *</label>
                            <div className="relative">
                                <Calendar size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                <input
                                    type="date"
                                    value={form.publishDate}
                                    onChange={(e) => setForm({ ...form, publishDate: e.target.value })}
                                    className={`w-full p-2 pl-12 bg-gray-50 border rounded-lg outline-none focus:ring-2 focus:bg-white transition-all text-sm text-gray-700 ${hasDuplicateDate ? 'border-amber-400 focus:ring-amber-100' : 'border-gray-300 focus:ring-blue-100'}`}
                                />
                            </div>
                            {hasDuplicateDate && (
                                <div className="mt-2 flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg">
                                    <AlertTriangle size={14} className="text-amber-500 shrink-0" />
                                    <p className="text-xs font-medium text-amber-700">
                                        You have already created a copy with this date.
                                    </p>
                                </div>
                            )}
                        </div>
                        <div>
                            <label className="text-xs tracking-widest font-medium text-gray-500 uppercase block mb-2">Publish Time</label>
                            <div className="relative">
                                <Clock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                <input
                                    type="time"
                                    value={form.publishTime}
                                    onChange={(e) => setForm({ ...form, publishTime: e.target.value })}
                                    className="w-full p-2 pl-12 bg-gray-50 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-100 focus:bg-white transition-all text-sm text-gray-700"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="text-xs tracking-widest font-medium text-gray-500 uppercase block mb-2">Content Bucket *</label>
                            <select
                                value={form.bucketId}
                                onChange={(e) => setForm({ ...form, bucketId: e.target.value })}
                                className="w-full p-2 bg-gray-50 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-100 focus:bg-white transition-all text-sm text-gray-700 appearance-none"
                            >
                                <option value="">Select bucket</option>
                                {buckets.map((b) => (
                                    <option key={b.id} value={b.id}>{b.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs tracking-widest font-medium text-gray-500 uppercase block mb-2">Media Type *</label>
                            <select
                                value={form.mediaType}
                                onChange={(e) => setForm({ ...form, mediaType: e.target.value })}
                                className="w-full p-2 bg-gray-50 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-100 focus:bg-white transition-all text-sm text-gray-700 appearance-none"
                            >
                                <option value="">Select type</option>
                                <option value="Image">Image</option>
                                <option value="Video">Video</option>
                                <option value="Carousel">Carousel</option>
                                <option value="Text">Text</option>
                            </select>
                        </div>
                    </div>

                    {/* Platform multi-select */}
                    <div>
                        <label className="text-xs tracking-widest font-medium text-gray-500 uppercase block mb-2">
                            Platforms
                            {form.platforms.length > 0 && (
                                <span className="ml-2 normal-case text-indigo-500 font-semibold">
                                    {form.platforms.length} selected
                                </span>
                            )}
                        </label>
                        <PlatformMultiSelect
                            selected={form.platforms}
                            onChange={(platforms) => setForm({ ...form, platforms })}
                        />
                    </div>

                    <div className="flex justify-end">
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="flex items-center gap-1 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white px-4 py-2 rounded-lg font-bold transition-all"
                        >
                            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Plus size={20} /> Add Copy to Calendar</>}
                        </button>
                    </div>
                </form>
            </div>

            {/* Draft Copies + Submit for Review */}
            {draftCopies.length > 0 && (
                <div className="bg-white border border-gray-100 rounded-lg p-4 shadow-sm space-y-3">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-md font-semibold text-gray-900">New Copies ({draftCopies.length})</h2>
                            <p className="text-gray-500 text-sm">{draftCopies.length} draft{draftCopies.length !== 1 ? 's' : ''} ready for review</p>
                        </div>
                    </div>

                    <div className="space-y-2">
                        {draftCopies.map((copy) => {
                            const platforms = getCopyPlatforms(copy);
                            return (
                                <div key={copy.id} className="p-4 border border-gray-100 rounded-lg bg-gray-50/30 hover:bg-white hover:shadow-xl hover:shadow-gray-100 transition-all group">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h3 className="font-bold text-gray-900 mb-1">{copy.content.substring(0, 100)}{copy.content.length > 100 && '...'}</h3>
                                            <p className="text-sm text-gray-500">{copy.caption?.substring(0, 150)}{copy.caption?.length > 150 && '...'}</p>
                                        </div>
                                        <span className="px-3 py-1 bg-blue-50 text-blue-600 text-[10px] font-bold rounded-full uppercase shrink-0">Draft</span>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-gray-400 font-medium">
                                        <div className="flex items-center gap-1.5">
                                            <Calendar size={14} />
                                            {copy.publishDate ? new Date(copy.publishDate).toLocaleDateString() : '—'}
                                            {copy.publishTime && ` at ${copy.publishTime}`}
                                        </div>
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                            <Globe size={14} />
                                            {platforms.length > 0
                                                ? platforms.map(p => (
                                                    <span
                                                        key={p}
                                                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${PLATFORM_STYLES[p as Platform]
                                                            ? `${PLATFORM_STYLES[p as Platform].bg} ${PLATFORM_STYLES[p as Platform].text} ${PLATFORM_STYLES[p as Platform].border}`
                                                            : 'bg-gray-50 text-gray-500 border-gray-200'
                                                            }`}
                                                    >{p}</span>
                                                ))
                                                : '—'
                                            }
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <Image size={14} /> {copy.mediaType || '—'}
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <Hash size={14} /> {buckets.find(b => b.id === copy.bucketId)?.name || 'Bucket'}
                                        </div>
                                    </div>

                                    {copy.hashtags && (
                                        <div className="mt-3 text-blue-500 text-[11px] font-bold">{copy.hashtags}</div>
                                    )}

                                    <div className="mt-3 pt-3 border-t border-gray-100 flex justify-end">
                                        <button
                                            onClick={() => handleRemove(copy.id)}
                                            disabled={removingId === copy.id}
                                            className="flex items-center gap-2 text-red-400 hover:text-red-600 px-3 py-1.5 text-xs font-bold transition-all disabled:opacity-50"
                                        >
                                            {removingId === copy.id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={13} />}
                                            Remove
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {taskId && (
                        <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                            <p className="text-xs text-gray-400">{draftCopies.length} {draftCopies.length === 1 ? 'copy' : 'copies'} will be sent for internal review.</p>
                            <button
                                onClick={() => setShowPreviewModal(true)}
                                className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2.5 rounded-lg text-sm font-bold transition-all shadow-sm shadow-emerald-100"
                            >
                                <Eye size={15} /> Submit for Review
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Submitted Copies History */}
            {submittedCopies.length > 0 && (
                <div className="bg-white border border-gray-100 rounded-lg p-4 shadow-sm space-y-3">
                    <h2 className="text-md font-semibold text-gray-900">Submitted Copies — History ({submittedCopies.length})</h2>

                    <div className="space-y-2">
                        {submittedCopies.map(copy => {
                            const platforms = getCopyPlatforms(copy);
                            const statusColors: Record<string, string> = {
                                INTERNAL_REVIEW: 'bg-orange-500',
                                CLIENT_REVIEW: 'bg-yellow-500',
                                APPROVED: 'bg-emerald-500',
                                PUBLISHED: 'bg-blue-500',
                            };
                            const statusBg = statusColors[copy.status] ?? 'bg-gray-500';
                            return (
                                <div key={copy.id} className="border border-gray-100 rounded-lg p-4 bg-gray-50/40">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex-1 min-w-0 pr-3">
                                            <p className="text-sm font-bold text-gray-800 truncate">{copy.content.substring(0, 80)}{copy.content.length > 80 && '...'}</p>
                                            {copy.caption && <p className="text-xs text-gray-500 mt-0.5 truncate">{copy.caption.substring(0, 100)}{copy.caption.length > 100 && '...'}</p>}
                                        </div>
                                        <span className={`px-2 py-1 text-[10px] font-bold text-white rounded-full shrink-0 ${statusBg}`}>
                                            {copy.status.replace(/_/g, ' ')}
                                        </span>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-gray-400 font-medium">
                                        <div className="flex items-center gap-1.5">
                                            <Calendar size={13} />
                                            {copy.publishDate ? new Date(copy.publishDate).toLocaleDateString() : '—'}
                                            {copy.publishTime && ` at ${copy.publishTime}`}
                                        </div>
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                            <Globe size={13} />
                                            {platforms.length > 0
                                                ? platforms.map(p => (
                                                    <span key={p} className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${PLATFORM_STYLES[p as Platform] ? `${PLATFORM_STYLES[p as Platform].bg} ${PLATFORM_STYLES[p as Platform].text} ${PLATFORM_STYLES[p as Platform].border}` : 'bg-gray-50 text-gray-500 border-gray-200'}`}>{p}</span>
                                                ))
                                                : '—'
                                            }
                                        </div>
                                        {copy.mediaType && <div className="flex items-center gap-1.5"><Image size={13} /> {copy.mediaType}</div>}
                                        <div className="flex items-center gap-1.5"><Hash size={13} /> {buckets.find(b => b.id === copy.bucketId)?.name || 'Bucket'}</div>
                                    </div>
                                    {copy.hashtags && <p className="mt-2 text-blue-500 text-[11px] font-bold">{copy.hashtags}</p>}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            <SubmitPreviewModal
                isOpen={showPreviewModal}
                onClose={() => setShowPreviewModal(false)}
                onConfirm={handleSubmitForReview}
                copies={draftCopies}
                buckets={buckets}
                calendarObjective={calendarObjective}
                isSubmitting={isSubmitting}
            />
        </div>
    );
};
