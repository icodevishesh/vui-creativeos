"use client";

import React, { useState } from 'react';
import { FilePlus, Calendar, Clock, Image, Hash, Globe, Type, Trash2, Send, Plus, Loader2, Monitor } from 'lucide-react';
import { toast } from 'react-hot-toast';
import dayjs from 'dayjs';

interface CalendarCopiesListProps {
    calendarId: string;
    buckets: any[];
    copies: any[];
    onRefresh: () => void;
}

export const CalendarCopiesList: React.FC<CalendarCopiesListProps> = ({ calendarId, buckets, copies, onRefresh }) => {
    const [isAddFormOpen, setIsAddFormOpen] = useState(true);
    const [isLoading, setIsLoading] = useState(false);

    // Form state
    const [form, setForm] = useState({
        content: '',
        caption: '',
        hashtags: '',
        publishDate: '',
        publishTime: '',
        bucketId: '',
        platform: '',
        mediaType: ''
    });

    const resetForm = () => {
        setForm({
            content: '',
            caption: '',
            hashtags: '',
            publishDate: '',
            publishTime: '',
            bucketId: '',
            platform: '',
            mediaType: ''
        });
    };

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
                body: JSON.stringify(form)
            });
            if (res.ok) {
                toast.success('Copy added to calendar');
                resetForm();
                onRefresh();
            }
        } catch (error) {
            toast.error('Failed to add copy');
        } finally {
            setIsLoading(false);
        }
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
                                    className="w-full p-2 pl-12 bg-gray-50 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-100 focus:bg-white transition-all text-sm text-gray-700"
                                />
                            </div>
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

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                            <label className="text-xs tracking-widest font-medium text-gray-500 uppercase block mb-2">Platform *</label>
                            <select
                                value={form.platform}
                                onChange={(e) => setForm({ ...form, platform: e.target.value })}
                                className="w-full p-2 bg-gray-50 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-100 focus:bg-white transition-all text-sm text-gray-700 appearance-none"
                            >
                                <option value="">Select platform</option>
                                <option value="Instagram">Instagram</option>
                                <option value="LinkedIn">LinkedIn</option>
                                <option value="Twitter">Twitter</option>
                                <option value="Facebook">Facebook</option>
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

            {/* List View */}
            {copies.length > 0 && (
                <div className="bg-white border border-gray-100 rounded-lg p-4 shadow-sm space-y-2">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-md font-semibold text-gray-900">Calendar Copies ({copies.length})</h2>
                            <p className="text-gray-500 text-sm">{copies.length} draft(s) ready for review</p>
                        </div>
                    </div>

                    <div className="space-y-2">
                        {copies.map((copy) => (
                            <div key={copy.id} className="p-4 border border-gray-100 rounded-lg bg-gray-50/30 hover:bg-white hover:shadow-xl hover:shadow-gray-100 transition-all group">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="font-bold text-gray-900 mb-1">{copy.content.substring(0, 100)}{copy.content.length > 100 && '...'}</h3>
                                        <p className="text-sm text-gray-500">{copy.caption.substring(0, 150)}{copy.caption.length > 150 && '...'}</p>
                                    </div>
                                    <span className="px-3 py-1 bg-blue-50 text-blue-600 text-[10px] font-bold rounded-full uppercase">Draft</span>
                                </div>

                                <div className="flex flex-wrap items-center gap-4 text-[11px] text-gray-400 font-medium">
                                    <div className="flex items-center gap-1.5">
                                        <Calendar size={14} /> {new Date(copy.publishDate).toLocaleDateString()} at {copy.publishTime}
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <Globe size={14} /> {copy.platform}
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <Image size={14} /> {copy.mediaType}
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <Hash size={14} /> {buckets.find(b => b.id === copy.bucketId)?.name || 'Bucket'}
                                    </div>
                                </div>

                                <div className="mt-4 text-blue-500 text-[11px] font-bold">
                                    {copy.hashtags}
                                </div>

                                <div className="mt-2 pt-2 border-t border-gray-100 flex items-center justify-between">
                                    <button className="flex items-center gap-2 bg-white border border-gray-200 text-gray-700 px-3 py-2 rounded-lg text-xs font-bold hover:bg-gray-50 transition-all shadow-sm">
                                        <Send size={14} /> Submit for Review
                                    </button>
                                    <button className="flex items-center gap-2 text-red-500 hover:text-red-600 px-3 py-2 text-xs font-bold transition-all">
                                        <Trash2 size={14} /> Remove
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
