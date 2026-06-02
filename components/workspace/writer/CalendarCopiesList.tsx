"use client";

import React, { useState } from 'react';
import { FilePlus, Calendar, Clock, Image, Hash, Globe, Trash2, Send, Plus, Loader2, AlertTriangle, X, Film, Link, Edit2, Check, Layers, User, ChevronDown, ChevronUp } from 'lucide-react';

const SiInstagram = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
    </svg>
);

const SiYoutube = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
    </svg>
);

const SiTwitter = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
);

const SiLinkedin = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
    </svg>
);

const SiFacebook = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
);

const SiPinterest = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 01.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z"/>
    </svg>
);
import { toast } from 'react-hot-toast';
import dayjs from 'dayjs';

interface CalendarCopiesListProps {
    calendarId: string;
    buckets: any[];
    copies: any[];
    onRefresh: () => void;
    taskId?: string;
    calendarObjective?: string;
    clientPlatforms?: string[];
}

const ALL_PLATFORMS = ['Facebook', 'Instagram', 'LinkedIn', 'YouTube', 'Twitter', 'Pinterest'] as const;
type Platform = typeof ALL_PLATFORMS[number];

const PLATFORM_ID_MAP: Record<string, Platform> = {
    facebook: 'Facebook',
    instagram: 'Instagram',
    linkedin: 'LinkedIn',
    linkedin_post: 'LinkedIn',
    youtube: 'YouTube',
    twitter: 'Twitter',
    pinterest: 'Pinterest',
};

const PLATFORM_STYLES: Record<Platform, { bg: string; text: string; border: string; active: string }> = {
    Facebook:  { bg: 'bg-blue-50',   text: 'text-blue-600',  border: 'border-blue-200',  active: 'bg-blue-600 text-white border-blue-600' },
    Instagram: { bg: 'bg-pink-50',   text: 'text-pink-600',  border: 'border-pink-200',  active: 'bg-pink-500 text-white border-pink-500' },
    LinkedIn:  { bg: 'bg-sky-50',    text: 'text-sky-700',   border: 'border-sky-200',   active: 'bg-sky-700 text-white border-sky-700' },
    YouTube:   { bg: 'bg-red-50',    text: 'text-red-600',   border: 'border-red-200',   active: 'bg-red-600 text-white border-red-600' },
    Twitter:   { bg: 'bg-gray-50',   text: 'text-gray-800',  border: 'border-gray-300',  active: 'bg-gray-900 text-white border-gray-900' },
    Pinterest: { bg: 'bg-rose-50',   text: 'text-rose-600',  border: 'border-rose-200',  active: 'bg-rose-600 text-white border-rose-600' },
};

const PLATFORM_ICONS: Record<Platform, React.ElementType> = {
    Facebook:  SiFacebook,
    Instagram: SiInstagram,
    LinkedIn:  SiLinkedin,
    YouTube:   SiYoutube,
    Twitter:   SiTwitter,
    Pinterest: SiPinterest,
};

// ─── Platform Multi-Select ────────────────────────────────────────────────────

function PlatformMultiSelect({
    selected,
    onChange,
    availablePlatforms,
}: {
    selected: string[];
    onChange: (platforms: string[]) => void;
    availablePlatforms: Platform[];
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
            {availablePlatforms.map((platform) => {
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
                        {React.createElement(PLATFORM_ICONS[platform], { className: 'w-3.5 h-3.5' })}
                        {platform}
                        {isActive && <X className="w-3 h-3 ml-0.5 opacity-70" />}
                    </button>
                );
            })}
        </div>
    );
}

// ─── Carousel Frame Builder ───────────────────────────────────────────────────

function CarouselFrameBuilder({
    frameCount,
    frames,
    activeFrame,
    onFrameCountChange,
    onFrameUpdate,
    onActiveFrameChange,
}: {
    frameCount: number;
    frames: any[];
    activeFrame: number;
    onFrameCountChange: (n: number) => void;
    onFrameUpdate: (idx: number, field: 'caption' | 'hashtags', value: string) => void;
    onActiveFrameChange: (idx: number) => void;
}) {
    return (
        <div className="border border-gray-200 shadow-xs rounded-xl bg-gray-50/80 p-4 space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-primary" />
                    <span className="text-xs font-medium text-primary uppercase -tracking-tight">Carousel Copies</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 font-medium">Copies:</span>
                    <div className="flex gap-1">
                        {[2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                            <button
                                key={n}
                                type="button"
                                onClick={() => onFrameCountChange(n)}
                                className={`w-7 h-7 rounded-lg text-xs font-bold transition-all ${frameCount === n ? 'bg-primary text-white' : 'bg-white border border-gray-200 text-gray-500 hover:border-primary/40'}`}
                            >{n}</button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="flex gap-1 flex-wrap">
                {frames.map((_, i) => (
                    <button
                        key={i}
                        type="button"
                        onClick={() => onActiveFrameChange(i)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${activeFrame === i ? 'bg-primary text-white' : 'bg-white border border-gray-200 text-gray-500 hover:border-primary/40'}`}
                    >
                        Copy {i + 1}
                        {frames[i]?.caption?.trim() && <span className="ml-1 text-emerald-400">✓</span>}
                    </button>
                ))}
            </div>

            <div className="space-y-3">
                <div>
                    <label className="text-[10px] font-medium text-primary uppercase -tracking-tight block mb-1">
                        Creative Copy
                    </label>
                    <textarea
                        value={frames[activeFrame]?.caption ?? ''}
                        onChange={e => onFrameUpdate(activeFrame, 'caption', e.target.value)}
                        rows={3}
                        placeholder={`Copy text for copy ${activeFrame + 1}...`}
                        className="w-full p-3 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 resize-none outline-none focus:ring focus:ring-black/30"
                    />
                </div>
                <div className="flex justify-between">
                    <button
                        type="button"
                        disabled={activeFrame === 0}
                        onClick={() => onActiveFrameChange(activeFrame - 1)}
                        className="px-3 py-1.5 text-xs font-bold text-gray-500 rounded-lg border border-gray-200 hover:border-primary/40 disabled:opacity-30 transition-all"
                    >← Prev</button>
                    <span className="text-xs text-gray-400 font-medium self-center">{activeFrame + 1} / {frameCount}</span>
                    <button
                        type="button"
                        disabled={activeFrame === frameCount - 1}
                        onClick={() => onActiveFrameChange(activeFrame + 1)}
                        className="px-3 py-1.5 text-xs font-bold text-gray-500 rounded-lg border border-gray-200 hover:border-primary/40 disabled:opacity-30 transition-all"
                    >Next →</button>
                </div>
            </div>
        </div>
    );
}

// ─── Add Copy Dialog ──────────────────────────────────────────────────────────

function AddCopyDialog({
    isOpen,
    onClose,
    calendarId,
    buckets,
    copies,
    availablePlatforms,
    onSuccess,
}: {
    isOpen: boolean;
    onClose: () => void;
    calendarId: string;
    buckets: any[];
    copies: any[];
    availablePlatforms: Platform[];
    onSuccess: () => void;
}) {
    const [isLoading, setIsLoading] = useState(false);
    const [form, setForm] = useState({
        content: '',
        caption: '',
        hashtags: '',
        publishDate: '',
        publishTime: '',
        bucketId: '',
        platforms: [] as string[],
        mediaType: '',
        referenceUrl: '',
    });
    const [frameCount, setFrameCount] = useState(3);
    const [frames, setFrames] = useState<any[]>(Array.from({ length: 3 }, () => ({ caption: '', hashtags: '' })));
    const [activeFrame, setActiveFrame] = useState(0);

    const isCarouselMode = form.mediaType === 'CAROUSEL';

    const handleFrameCountChange = (count: number) => {
        setFrameCount(count);
        setFrames(prev => Array.from({ length: count }, (_, i) => prev[i] ?? { caption: '', hashtags: '' }));
        setActiveFrame(0);
    };

    const updateFrame = (idx: number, field: 'caption' | 'hashtags', value: string) => {
        setFrames(prev => prev.map((f, i) => i === idx ? { ...f, [field]: value } : f));
    };

    const resetForm = () => {
        setForm({ content: '', caption: '', hashtags: '', publishDate: '', publishTime: '', bucketId: '', platforms: [], mediaType: '', referenceUrl: '' });
        setFrameCount(3);
        setFrames(Array.from({ length: 3 }, () => ({ caption: '', hashtags: '' })));
        setActiveFrame(0);
    };

    const hasDuplicateDate = !!form.publishDate && copies.some(copy => {
        if (!copy.publishDate) return false;
        return dayjs(copy.publishDate).format('YYYY-MM-DD') === form.publishDate;
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if ((!isCarouselMode && !form.content) || !form.bucketId) {
            toast.error('Please fill in required fields');
            return;
        }
        if (isCarouselMode) {
            const emptyFrame = frames.findIndex(f => !f.caption.trim());
            if (emptyFrame !== -1) {
                toast.error(`Frame ${emptyFrame + 1} caption is required`);
                setActiveFrame(emptyFrame);
                return;
            }
        }
        setIsLoading(true);
        try {
            const payload = isCarouselMode
                ? { ...form, isCarousel: true, frameCount, frames }
                : { ...form, isCarousel: false };
            const res = await fetch(`/api/calendars/${calendarId}/copies`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            if (res.ok) {
                toast.success(isCarouselMode ? `Carousel (${frameCount} frames) added` : 'Copy added to calendar');
                resetForm();
                onSuccess();
                onClose();
            } else {
                toast.error('Failed to add copy');
            }
        } catch {
            toast.error('Failed to add copy');
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-70 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-gray-950/60 backdrop-blur-sm" onClick={onClose} />

            <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
                    <div>
                        <h2 className="text-base font-bold text-gray-900">Add New Copy</h2>
                        <p className="text-xs text-gray-400 mt-0.5">Fill in copy details for a single creative post</p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-all"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Scrollable body */}
                <div className="flex-1 overflow-y-auto p-6">
                    <form id="add-copy-form" onSubmit={handleSubmit} className="space-y-5">

                        {/* Media Type */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs -tracking-tight font-medium text-gray-500 uppercase block mb-2">Media Type *</label>
                                <select
                                    value={form.mediaType}
                                    onChange={(e) => setForm({ ...form, mediaType: e.target.value })}
                                    className="w-full p-2 bg-gray-50 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-100 focus:bg-white transition-all text-sm text-gray-700 appearance-none"
                                >
                                    <option value="">Select type</option>
                                    <option value="IMAGE">Image</option>
                                    <option value="VIDEO">Video</option>
                                    <option value="REEL">Reel</option>
                                    <option value="CAROUSEL">Carousel</option>
                                    <option value="Text">Text</option>
                                </select>
                            </div>
                        </div>

                        {/* Carousel builder */}
                        {isCarouselMode && (
                            <CarouselFrameBuilder
                                frameCount={frameCount}
                                frames={frames}
                                activeFrame={activeFrame}
                                onFrameCountChange={handleFrameCountChange}
                                onFrameUpdate={updateFrame}
                                onActiveFrameChange={setActiveFrame}
                            />
                        )}

                        {/* Creative Copy */}
                        {!isCarouselMode && (
                            <div>
                                <label className="text-xs -tracking-tight font-medium text-gray-500 uppercase block mb-2">Creative Copy *</label>
                                <textarea
                                    value={form.content}
                                    onChange={(e) => setForm({ ...form, content: e.target.value })}
                                    placeholder="The main creative copy / content for this post..."
                                    rows={4}
                                    className="w-full p-4 bg-gray-50 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-100 focus:bg-white transition-all text-sm text-gray-700 resize-none"
                                />
                            </div>
                        )}

                        {/* Caption */}
                        <div>
                            <label className="text-xs -tracking-tight font-medium text-gray-500 uppercase block mb-2">Caption *</label>
                            <textarea
                                value={form.caption}
                                onChange={(e) => setForm({ ...form, caption: e.target.value })}
                                placeholder="Caption that accompanies the creative..."
                                rows={3}
                                className="w-full p-4 bg-gray-50 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-100 focus:bg-white transition-all text-sm text-gray-700 resize-none"
                            />
                        </div>

                        {/* Hashtags */}
                        <div>
                            <label className="text-xs -tracking-tight font-medium text-gray-500 uppercase block mb-2">Hashtags</label>
                            <input
                                type="text"
                                value={form.hashtags}
                                onChange={(e) => setForm({ ...form, hashtags: e.target.value })}
                                placeholder="#marketing #socialmedia #growth"
                                className="w-full p-2 bg-gray-50 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-100 focus:bg-white transition-all text-sm text-gray-700"
                            />
                        </div>

                        {/* Reference URL */}
                        <div>
                            <label className="text-xs -tracking-tight font-medium text-gray-500 uppercase block mb-2">Reference URL</label>
                            <div className="relative">
                                <Link size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                <input
                                    type="url"
                                    value={form.referenceUrl}
                                    onChange={(e) => setForm({ ...form, referenceUrl: e.target.value })}
                                    placeholder="https://example.com/reference"
                                    className="w-full p-2 pl-12 bg-gray-50 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-100 focus:bg-white transition-all text-sm text-gray-700"
                                />
                            </div>
                        </div>

                        {/* Date / Time */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs -tracking-tight font-medium text-gray-500 uppercase block mb-2">Publish Date *</label>
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
                                        <p className="text-xs font-medium text-amber-700">A copy with this date already exists.</p>
                                    </div>
                                )}
                            </div>
                            <div>
                                <label className="text-xs -tracking-tight font-medium text-gray-500 uppercase block mb-2">Publish Time</label>
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

                        {/* Bucket + Platforms */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs -tracking-tight font-medium text-gray-500 uppercase block mb-2">Content Bucket *</label>
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
                                <label className="text-xs -tracking-tight font-medium text-gray-500 uppercase block mb-2">
                                    Platforms
                                    {form.platforms.length > 0 && (
                                        <span className="ml-2 normal-case text-primary font-semibold">{form.platforms.length} selected</span>
                                    )}
                                </label>
                                <PlatformMultiSelect
                                    selected={form.platforms}
                                    onChange={(platforms) => setForm({ ...form, platforms })}
                                    availablePlatforms={availablePlatforms}
                                />
                            </div>
                        </div>
                    </form>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex items-center justify-end gap-3 shrink-0">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        form="add-copy-form"
                        disabled={isLoading}
                        className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary/90 disabled:opacity-50 text-white text-sm font-bold rounded-lg transition-all"
                    >
                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Plus size={16} /> Add Copy</>}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Per-Copy Status Transition Config ───────────────────────────────────────

const STATUS_TRANSITIONS: Record<string, {
    title: string;
    subtitle: string;
    targetStatus: string;
    buttonLabel: string;
    buttonClass: string;
    accentBg: string;
    accentText: string;
    accentBorder: string;
}> = {
    DRAFT: {
        title: 'Submit for Internal Review',
        subtitle: 'Your team will review this copy before it goes to the client.',
        targetStatus: 'INTERNAL_REVIEW',
        buttonLabel: 'Submit for Internal Review',
        buttonClass: 'bg-orange-500 hover:bg-orange-600 shadow-sm shadow-orange-200',
        accentBg: 'bg-orange-50',
        accentText: 'text-orange-700',
        accentBorder: 'border-orange-200',
    },
    INTERNAL_REVIEW: {
        title: 'Send to Client Review',
        subtitle: 'The client will be able to review and approve this copy.',
        targetStatus: 'CLIENT_REVIEW',
        buttonLabel: 'Send to Client',
        buttonClass: 'bg-amber-500 hover:bg-amber-600 shadow-sm shadow-amber-200',
        accentBg: 'bg-amber-50',
        accentText: 'text-amber-700',
        accentBorder: 'border-amber-200',
    },
    CLIENT_REVIEW: {
        title: 'Approve Copy',
        subtitle: 'Mark this copy as approved and ready for publishing.',
        targetStatus: 'APPROVED',
        buttonLabel: 'Approve Copy',
        buttonClass: 'bg-emerald-500 hover:bg-emerald-600 shadow-sm shadow-emerald-200',
        accentBg: 'bg-emerald-50',
        accentText: 'text-emerald-700',
        accentBorder: 'border-emerald-200',
    },
    APPROVED: {
        title: 'Mark as Published',
        subtitle: 'Mark this copy as live and published.',
        targetStatus: 'PUBLISHED',
        buttonLabel: 'Mark as Published',
        buttonClass: 'bg-blue-500 hover:bg-blue-600 shadow-sm shadow-blue-200',
        accentBg: 'bg-blue-50',
        accentText: 'text-blue-700',
        accentBorder: 'border-blue-200',
    },
};

// ─── Copy Status Modal ────────────────────────────────────────────────────────

function CopyStatusModal({
    isOpen,
    onClose,
    copy,
    calendarId,
    taskId,
    buckets,
    calendarObjective,
    onSuccess,
}: {
    isOpen: boolean;
    onClose: () => void;
    copy: any;
    calendarId: string;
    taskId?: string;
    buckets: any[];
    calendarObjective?: string;
    onSuccess: () => void;
}) {
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen || !copy) return null;

    const currentStatus = copy.status ?? 'DRAFT';
    const transition = STATUS_TRANSITIONS[currentStatus];
    if (!transition) return null;

    const platforms: string[] = Array.isArray(copy.platforms) && copy.platforms.length > 0
        ? copy.platforms
        : copy.platform ? [copy.platform] : [];
    const bucketName = buckets.find(b => b.id === copy.bucketId)?.name ?? null;

    const handleConfirm = async () => {
        setIsSubmitting(true);
        try {
            const res = await fetch(`/api/calendars/${calendarId}/copies/${copy.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: transition.targetStatus }),
            });
            if (!res.ok) throw new Error();

            // Keep task in sync when first copy enters internal review
            if (transition.targetStatus === 'INTERNAL_REVIEW' && taskId) {
                await fetch(`/api/tasks/${taskId}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: 'INTERNAL_REVIEW' }),
                });
            }

            toast.success(`Copy moved to ${transition.targetStatus.replace(/_/g, ' ').toLowerCase()}`);
            onSuccess();
            onClose();
        } catch {
            toast.error('Failed to update copy status');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-70 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-gray-950/60 backdrop-blur-sm" onClick={onClose} />

            <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-xl max-h-[92vh] flex flex-col overflow-hidden">

                {/* Header */}
                <div className={`px-6 py-4 border-b ${transition.accentBorder} ${transition.accentBg} shrink-0`}>
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <h2 className={`text-base font-bold ${transition.accentText}`}>{transition.title}</h2>
                            <p className="text-xs text-gray-500 mt-0.5">{transition.subtitle}</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-7 h-7 shrink-0 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-white/60 transition-all"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Copy preview */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">

                    {calendarObjective && (
                        <div className="bg-primary/10 border border-primary/20 rounded-lg px-4 py-3">
                            <p className="text-[10px] font-bold text-primary/60 uppercase -tracking-tight mb-1">Calendar Objective</p>
                            <p className="text-xs text-primary leading-relaxed">{calendarObjective}</p>
                        </div>
                    )}

                    {/* Meta badges row */}
                    <div className="flex flex-wrap items-center gap-2">
                        {platforms.map(p => {
                            const style = PLATFORM_STYLES[p as Platform];
                            const Icon = PLATFORM_ICONS[p as Platform];
                            return (
                                <span key={p} className={`inline-flex items-center gap-1 text-[10px] font-bold border px-2 py-0.5 rounded-full ${style ? `${style.bg} ${style.text} ${style.border}` : 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                                    {Icon ? <Icon className="w-3 h-3" /> : <Globe className="w-3 h-3" />} {p}
                                </span>
                            );
                        })}
                        {copy.mediaType && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-violet-50 text-violet-600 border border-violet-100 px-2 py-0.5 rounded-full">
                                {copy.isCarousel ? <Layers className="w-3 h-3" /> : <Film className="w-3 h-3" />}
                                {copy.isCarousel ? `${copy.frameCount ?? ''} frame carousel` : copy.mediaType}
                            </span>
                        )}
                        {bucketName && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-100 px-2 py-0.5 rounded-full">
                                <Hash className="w-3 h-3" /> {bucketName}
                            </span>
                        )}
                        {copy.publishDate && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-gray-50 text-gray-600 border border-gray-200 px-2 py-0.5 rounded-full ml-auto">
                                <Calendar className="w-3 h-3" />
                                {new Date(copy.publishDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                {copy.publishTime && ` · ${copy.publishTime}`}
                            </span>
                        )}
                    </div>

                    {/* Creative copy / carousel */}
                    {copy.isCarousel && Array.isArray(copy.frames) && copy.frames.length > 0 ? (
                        <div className="bg-gray-50 rounded-xl border border-gray-100 p-4 space-y-2">
                            <p className="text-[10px] font-bold text-gray-400 uppercase -tracking-tight">Carousel Frames</p>
                            <div className="space-y-2">
                                {copy.frames.map((f: any) => (
                                    <div key={f.id} className="flex items-start gap-3 px-3 py-2.5 bg-white border border-gray-100 rounded-lg">
                                        <span className="text-[10px] font-bold text-gray-400 w-12 shrink-0 pt-0.5">Copy {f.frameNumber}</span>
                                        <p className="text-xs text-gray-700 leading-relaxed">{f.caption || <span className="italic text-gray-400">No caption</span>}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : copy.content ? (
                        <div className="bg-gray-50 rounded-xl border border-gray-100 p-4">
                            <p className="text-[10px] font-bold text-gray-400 uppercase -tracking-tight mb-2">Creative Copy</p>
                            <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">{copy.content}</p>
                        </div>
                    ) : null}

                    {/* Caption */}
                    {copy.caption && (
                        <div className="bg-gray-50 rounded-xl border border-gray-100 p-4">
                            <p className="text-[10px] font-bold text-gray-400 uppercase -tracking-tight mb-2">Caption</p>
                            <p className="text-sm text-gray-600 leading-relaxed italic">{copy.caption}</p>
                        </div>
                    )}

                    {/* Hashtags */}
                    {copy.hashtags && (
                        <p className="text-xs font-semibold text-blue-500 px-1">{copy.hashtags}</p>
                    )}

                    {/* Reference URL */}
                    {copy.referenceUrl && (
                        <a href={copy.referenceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline truncate max-w-full px-1">
                            <Link size={12} /> {copy.referenceUrl}
                        </a>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between shrink-0">
                    <div className="text-xs text-gray-400">
                        Status will change to{' '}
                        <span className="font-semibold text-gray-600">{transition.targetStatus.replace(/_/g, ' ')}</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleConfirm}
                            disabled={isSubmitting}
                            className={`inline-flex items-center gap-2 px-5 py-2.5 disabled:opacity-50 text-white text-sm font-bold rounded-lg transition-all ${transition.buttonClass}`}
                        >
                            {isSubmitting
                                ? <Loader2 className="w-4 h-4 animate-spin" />
                                : <><Send className="w-4 h-4" /> {transition.buttonLabel}</>
                            }
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── Copy Accordion Item ──────────────────────────────────────────────────────

function CopyAccordionItem({
    copy,
    buckets,
    availablePlatforms,
    calendarId,
    taskId,
    calendarObjective,
    onRemove,
    onRefresh,
    removingId,
}: {
    copy: any;
    buckets: any[];
    availablePlatforms: Platform[];
    calendarId: string;
    taskId?: string;
    calendarObjective?: string;
    onRemove: (id: string) => void;
    onRefresh: () => void;
    removingId: string | null;
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [savingCopyId, setSavingCopyId] = useState(false);
    const [showStatusModal, setShowStatusModal] = useState(false);

    const [frameCount, setFrameCount] = useState(copy.frameCount || copy.frames?.length || 3);
    const [frames, setFrames] = useState<any[]>(copy.frames || Array.from({ length: 3 }, () => ({ caption: '', hashtags: '' })));
    const [activeFrame, setActiveFrame] = useState(0);

    const [editForm, setEditForm] = useState({
        content: copy.content || '',
        caption: copy.caption || '',
        hashtags: copy.hashtags || '',
        publishDate: copy.publishDate ? dayjs(copy.publishDate).format('YYYY-MM-DD') : '',
        publishTime: copy.publishTime || '',
        bucketId: copy.bucketId || '',
        platforms: copy.platforms || [],
        mediaType: copy.mediaType || '',
        referenceUrl: copy.referenceUrl || '',
    });

    const handleFrameCountChange = (count: number) => {
        setFrameCount(count);
        setFrames(prev => Array.from({ length: count }, (_, i) => prev[i] ?? { caption: '', hashtags: '' }));
        setActiveFrame(0);
    };

    const updateFrame = (idx: number, field: 'caption' | 'hashtags', value: string) => {
        setFrames(prev => prev.map((f, i) => i === idx ? { ...f, [field]: value } : f));
    };

    const saveEdit = async () => {
        setSavingCopyId(true);
        try {
            const payload: any = { ...editForm };
            if (payload.publishDate) payload.publishDate = new Date(payload.publishDate).toISOString();
            if (payload.mediaType === 'CAROUSEL') {
                payload.isCarousel = true;
                payload.frameCount = frameCount;
                payload.frames = frames;
            } else {
                payload.isCarousel = false;
            }
            const res = await fetch(`/api/calendars/${calendarId}/copies/${copy.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            if (res.ok) {
                toast.success('Copy updated');
                setIsEditing(false);
                onRefresh();
            } else {
                toast.error('Failed to update copy');
            }
        } catch {
            toast.error('Failed to update copy');
        } finally {
            setSavingCopyId(false);
        }
    };

    const platforms = Array.isArray(copy.platforms) && copy.platforms.length > 0
        ? copy.platforms
        : copy.platform ? [copy.platform] : [];

    const isDraft = !copy.status || copy.status === 'DRAFT';

    const statusColors: Record<string, string> = {
        DRAFT: 'bg-blue-50 text-blue-600 border-blue-100',
        INTERNAL_REVIEW: 'bg-orange-50 text-orange-600 border-orange-200',
        CLIENT_REVIEW: 'bg-yellow-50 text-yellow-700 border-yellow-200',
        APPROVED: 'bg-emerald-50 text-emerald-600 border-emerald-200',
        PUBLISHED: 'bg-blue-50 text-blue-700 border-blue-200',
    };
    const statusClass = statusColors[copy.status ?? 'DRAFT'] ?? 'bg-gray-50 text-gray-600 border-gray-200';
    const statusLabel = (copy.status ?? 'DRAFT').replace(/_/g, ' ');

    return (
        <div className="border border-gray-100 rounded-xl bg-white overflow-hidden transition-all hover:shadow-sm">
            {/* Collapsed row — always visible */}
            <button
                type="button"
                onClick={() => setIsOpen(v => !v)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50/60 transition-colors"
            >
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        {/* Status badge */}
                        <span className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusClass}`}>
                            {statusLabel}
                        </span>

                        {/* Platform chips */}
                        {platforms.map((p: string) => {
                            const style = PLATFORM_STYLES[p as Platform];
                            const Icon = PLATFORM_ICONS[p as Platform];
                            return (
                                <span key={p} className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${style ? `${style.bg} ${style.text} ${style.border}` : 'bg-gray-50 text-gray-500 border-gray-200'}`}>
                                    {Icon ? <Icon className="w-3 h-3" /> : <Globe className="w-3 h-3" />}
                                    {p}
                                </span>
                            );
                        })}

                        {/* Media type */}
                        {copy.mediaType && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-violet-50 text-violet-600 border border-violet-100 px-2 py-0.5 rounded-full">
                                {copy.isCarousel ? <Layers className="w-2.5 h-2.5" /> : <Film className="w-2.5 h-2.5" />}
                                {copy.isCarousel ? `${copy.frameCount ?? ''} frame carousel` : copy.mediaType}
                            </span>
                        )}
                    </div>

                    {/* Snippet */}
                    <p className="mt-1 text-xs text-gray-700 font-medium truncate">
                        {copy.isCarousel
                            ? (copy.frames?.[0]?.caption || 'Carousel copy')
                            : (copy.content || copy.caption || '—')
                        }
                    </p>
                </div>

                {/* Date on the right */}
                <div className="flex items-center gap-3 shrink-0">
                    {copy.publishDate && (
                        <span className="hidden sm:flex items-center gap-1 text-[11px] text-gray-400 font-medium">
                            <Calendar size={12} />
                            {new Date(copy.publishDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                    )}
                    {isOpen
                        ? <ChevronUp className="w-4 h-4 text-gray-400" />
                        : <ChevronDown className="w-4 h-4 text-gray-400" />
                    }
                </div>
            </button>

            {/* Expanded body */}
            {isOpen && (
                <div className="border-t border-gray-100 px-4 pb-4 pt-4 bg-gray-50/30">
                    {isEditing ? (
                        /* ── Edit form ── */
                        <div className="space-y-4">
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-bold text-primary uppercase -tracking-tight">Editing Copy</span>
                                <button type="button" onClick={() => setIsEditing(false)} className="text-gray-400 hover:text-gray-600"><X size={14} /></button>
                            </div>

                            {/* Media Type */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[10px] font-bold text-gray-400 uppercase -tracking-tight block mb-1">Media Type</label>
                                    <select value={editForm.mediaType} onChange={e => setEditForm({ ...editForm, mediaType: e.target.value })} className="w-full p-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 outline-none focus:ring-2 focus:ring-primary/20 appearance-none">
                                        <option value="">Select type</option>
                                        <option value="IMAGE">Image</option>
                                        <option value="VIDEO">Video</option>
                                        <option value="REEL">Reel</option>
                                        <option value="CAROUSEL">Carousel</option>
                                        <option value="Text">Text</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-gray-400 uppercase -tracking-tight block mb-1">Bucket</label>
                                    <select value={editForm.bucketId} onChange={e => setEditForm({ ...editForm, bucketId: e.target.value })} className="w-full p-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 outline-none focus:ring-2 focus:ring-primary/20 appearance-none">
                                        <option value="">Select bucket</option>
                                        {buckets.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                                    </select>
                                </div>
                            </div>

                            {/* Carousel in edit */}
                            {editForm.mediaType === 'CAROUSEL' && (
                                <CarouselFrameBuilder
                                    frameCount={frameCount}
                                    frames={frames}
                                    activeFrame={activeFrame}
                                    onFrameCountChange={handleFrameCountChange}
                                    onFrameUpdate={updateFrame}
                                    onActiveFrameChange={setActiveFrame}
                                />
                            )}

                            {editForm.mediaType !== 'CAROUSEL' && (
                                <textarea
                                    value={editForm.content}
                                    onChange={e => setEditForm({ ...editForm, content: e.target.value })}
                                    rows={3}
                                    placeholder="Creative copy..."
                                    className="w-full p-3 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 resize-none outline-none focus:ring-2 focus:ring-primary/20"
                                />
                            )}

                            <textarea
                                value={editForm.caption}
                                onChange={e => setEditForm({ ...editForm, caption: e.target.value })}
                                rows={2}
                                placeholder="Caption..."
                                className="w-full p-3 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 resize-none outline-none focus:ring-2 focus:ring-primary/20"
                            />

                            <input
                                type="text"
                                value={editForm.hashtags}
                                onChange={e => setEditForm({ ...editForm, hashtags: e.target.value })}
                                placeholder="#hashtags"
                                className="w-full p-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 outline-none focus:ring-2 focus:ring-primary/20"
                            />

                            <div className="relative">
                                <Link size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                <input
                                    type="url"
                                    value={editForm.referenceUrl}
                                    onChange={e => setEditForm({ ...editForm, referenceUrl: e.target.value })}
                                    placeholder="https://reference-url.com"
                                    className="w-full p-2 pl-9 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 outline-none focus:ring-2 focus:ring-primary/20"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[10px] font-bold text-gray-400 uppercase -tracking-tight block mb-1">Publish Date</label>
                                    <input type="date" value={editForm.publishDate} onChange={e => setEditForm({ ...editForm, publishDate: e.target.value })} className="w-full p-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 outline-none focus:ring-2 focus:ring-primary/20" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-gray-400 uppercase -tracking-tight block mb-1">Publish Time</label>
                                    <input type="time" value={editForm.publishTime} onChange={e => setEditForm({ ...editForm, publishTime: e.target.value })} className="w-full p-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 outline-none focus:ring-2 focus:ring-primary/20" />
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] font-bold text-gray-400 uppercase -tracking-tight block mb-2">Platforms</label>
                                <PlatformMultiSelect
                                    selected={editForm.platforms}
                                    onChange={p => setEditForm({ ...editForm, platforms: p })}
                                    availablePlatforms={availablePlatforms}
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-1">
                                <button type="button" onClick={() => setIsEditing(false)} className="px-3 py-1.5 text-xs font-bold text-gray-500 hover:text-gray-800 rounded-lg hover:bg-gray-100 transition-all">Cancel</button>
                                <button
                                    type="button"
                                    onClick={saveEdit}
                                    disabled={savingCopyId}
                                    className="flex items-center gap-1.5 px-4 py-1.5 bg-primary hover:bg-primary/90 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition-all"
                                >
                                    {savingCopyId ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                                    Save
                                </button>
                            </div>
                        </div>
                    ) : (
                        /* ── View mode ── */
                        <div className="space-y-3">
                            {/* Content */}
                            {!copy.isCarousel && copy.content && (
                                <div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase -tracking-tight mb-1">Creative Copy</p>
                                    <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">{copy.content}</p>
                                </div>
                            )}

                            {/* Carousel frames */}
                            {copy.isCarousel && Array.isArray(copy.frames) && copy.frames.length > 0 && (
                                <div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase -tracking-tight mb-2">Carousel Frames</p>
                                    <div className="space-y-1">
                                        {copy.frames.map((f: any) => (
                                            <div key={f.id} className="flex items-start gap-2 px-3 py-2 bg-white border border-gray-100 rounded-lg">
                                                <span className="text-[10px] font-bold text-gray-400 w-12 shrink-0 pt-0.5">Copy {f.frameNumber}</span>
                                                <p className="text-xs text-gray-700 leading-relaxed">{f.caption || <span className="italic text-gray-400">No caption</span>}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Caption */}
                            {copy.caption && (
                                <div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase -tracking-tight mb-1">Caption</p>
                                    <p className="text-xs text-gray-600 leading-relaxed italic">{copy.caption}</p>
                                </div>
                            )}

                            {/* Meta row */}
                            <div className="flex flex-wrap items-center gap-3 text-[11px] text-gray-400 font-medium">
                                {copy.publishDate && (
                                    <span className="flex items-center gap-1">
                                        <Calendar size={12} />
                                        {new Date(copy.publishDate).toLocaleDateString()}
                                        {copy.publishTime && ` at ${copy.publishTime}`}
                                    </span>
                                )}
                                {buckets.find(b => b.id === copy.bucketId) && (
                                    <span className="flex items-center gap-1">
                                        <Hash size={12} /> {buckets.find(b => b.id === copy.bucketId)?.name}
                                    </span>
                                )}
                                {copy.mediaType && (
                                    <span className="flex items-center gap-1">
                                        <Image size={12} /> {copy.mediaType}
                                    </span>
                                )}
                            </div>

                            {/* Hashtags */}
                            {copy.hashtags && (
                                <p className="text-[11px] font-semibold text-blue-500">{copy.hashtags}</p>
                            )}

                            {/* Reference URL */}
                            {copy.referenceUrl && (
                                <a href={copy.referenceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline truncate max-w-full">
                                    <Link size={11} /> {copy.referenceUrl}
                                </a>
                            )}

                            {/* Approved by */}
                            {copy.approvedBy && (
                                <div className="flex items-center gap-2 text-[10px] text-emerald-600 bg-emerald-50 border border-emerald-100 rounded px-2 py-1">
                                    <User size={12} />
                                    <span className="font-medium">{copy.approvedBy}</span>
                                    {copy.approverRole && <span className="bg-emerald-100 px-1.5 py-0.5 rounded-full font-semibold">{copy.approverRole}</span>}
                                    {copy.approvedDate && <span className="text-emerald-500">{new Date(copy.approvedDate).toLocaleDateString()}</span>}
                                </div>
                            )}

                            {/* Per-status action footer */}
                            {(() => {
                                const transition = STATUS_TRANSITIONS[copy.status ?? 'DRAFT'];
                                return (
                                    <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-1">
                                            {isDraft && (
                                                <>
                                                    <button
                                                        type="button"
                                                        onClick={() => setIsEditing(true)}
                                                        className="flex items-center gap-1.5 text-primary/60 hover:text-primary px-3 py-1.5 text-xs font-bold transition-all"
                                                    >
                                                        <Edit2 size={13} /> Edit
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => onRemove(copy.id)}
                                                        disabled={removingId === copy.id}
                                                        className="flex items-center gap-1.5 text-red-400 hover:text-red-600 px-3 py-1.5 text-xs font-bold transition-all disabled:opacity-50"
                                                    >
                                                        {removingId === copy.id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={13} />}
                                                        Remove
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                        {transition && (
                                            <button
                                                type="button"
                                                onClick={() => setShowStatusModal(true)}
                                                className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white rounded-lg transition-all ${transition.buttonClass}`}
                                            >
                                                <Send size={12} /> {transition.buttonLabel}
                                            </button>
                                        )}
                                    </div>
                                );
                            })()}
                        </div>
                    )}
                </div>
            )}

            <CopyStatusModal
                isOpen={showStatusModal}
                onClose={() => setShowStatusModal(false)}
                copy={copy}
                calendarId={calendarId}
                taskId={taskId}
                buckets={buckets}
                calendarObjective={calendarObjective}
                onSuccess={() => { setShowStatusModal(false); onRefresh(); }}
            />
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export const CalendarCopiesList: React.FC<CalendarCopiesListProps> = ({
    calendarId, buckets, copies, onRefresh, taskId, calendarObjective, clientPlatforms = []
}) => {
    const availablePlatforms: Platform[] = [...ALL_PLATFORMS];

    const [showAddDialog, setShowAddDialog] = useState(false);
    const [removingId, setRemovingId] = useState<string | null>(null);

    const STATUS_ORDER = ['DRAFT', 'INTERNAL_REVIEW', 'CLIENT_REVIEW', 'APPROVED', 'PUBLISHED'];
    const sortedCopies = [...copies].sort((a, b) => {
        const ai = STATUS_ORDER.indexOf(a.status ?? 'DRAFT');
        const bi = STATUS_ORDER.indexOf(b.status ?? 'DRAFT');
        return ai - bi;
    });

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

    return (
        <div className="space-y-6">

            {/* ── Header bar with Add button ── */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold text-gray-900">Calendar Copies</h2>
                    <p className="text-sm text-gray-400">{copies.length} {copies.length === 1 ? 'copy' : 'copies'} total</p>
                </div>
                <button
                    type="button"
                    onClick={() => setShowAddDialog(true)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary/90 text-white text-sm font-bold rounded-lg transition-all shadow-sm"
                >
                    <Plus size={16} /> Add New Copy
                </button>
            </div>

            {/* ── Copies list ── */}
            {copies.length > 0 && (
                <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm space-y-2">
                    {sortedCopies.map(copy => (
                        <CopyAccordionItem
                            key={copy.id}
                            copy={copy}
                            buckets={buckets}
                            availablePlatforms={availablePlatforms}
                            calendarId={calendarId}
                            taskId={taskId}
                            calendarObjective={calendarObjective}
                            onRemove={handleRemove}
                            onRefresh={onRefresh}
                            removingId={removingId}
                        />
                    ))}
                </div>
            )}

            {/* ── Empty state ── */}
            {copies.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 text-center bg-white border border-dashed border-gray-200 rounded-xl">
                    <FilePlus className="w-10 h-10 text-gray-300 mb-3" />
                    <p className="text-sm font-semibold text-gray-500">No copies yet</p>
                    <p className="text-xs text-gray-400 mt-1 mb-4">Click "Add New Copy" to get started</p>
                    <button
                        type="button"
                        onClick={() => setShowAddDialog(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-white text-sm font-bold rounded-lg transition-all"
                    >
                        <Plus size={15} /> Add New Copy
                    </button>
                </div>
            )}

            {/* ── Add copy dialog ── */}
            <AddCopyDialog
                isOpen={showAddDialog}
                onClose={() => setShowAddDialog(false)}
                calendarId={calendarId}
                buckets={buckets}
                copies={copies}
                availablePlatforms={availablePlatforms}
                onSuccess={onRefresh}
            />
        </div>
    );
};
