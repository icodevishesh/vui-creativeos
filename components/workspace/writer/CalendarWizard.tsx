"use client";

import React, { useState, useEffect } from 'react';
import { Target, Layers, FileText, ChevronRight, Plus, ArrowLeft, Trash2, Edit2, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { CalendarCopiesList } from './CalendarCopiesList';

/* Types */
type BucketForm = {
    id?: string;
    clientKey: string;
    name: string;
    description: string;
};

type CalendarBucket = {
    id: string;
    name: string;
    description?: string | null;
};

type CalendarCopy = Record<string, unknown>;

type CalendarData = {
    id: string;
    name?: string | null;
    objective?: string | null;
    buckets?: CalendarBucket[];
    copies?: CalendarCopy[];
};

interface CalendarWizardProps {
    calendar: CalendarData | null;
    onCalendarCreated: (calendar: CalendarData) => void;
    onRefresh: () => void;
    onBack?: () => void;
    initialClientId?: string;
    taskId?: string;
    taskTitle?: string;
    clientPlatforms?: string[];
}

// Main function
export const CalendarWizard: React.FC<CalendarWizardProps> = ({
    calendar,
    onCalendarCreated,
    onRefresh,
    onBack,
    initialClientId,
    taskId,
    taskTitle,
    clientPlatforms = [],
}) => {
    const [step, setStep] = useState(1);
    const [calendarName, setCalendarName] = useState('');
    const [objective, setObjective] = useState('');
    const [buckets, setBuckets] = useState<BucketForm[]>([{ clientKey: 'bucket-0', name: '', description: '' }]);
    const [isLoading, setIsLoading] = useState(false);
    const [deletingBucketId, setDeletingBucketId] = useState<string | null>(null);
    const [copies, setCopies] = useState<CalendarCopy[]>([]);

    useEffect(() => {
        if (calendar) {
            setCalendarName(calendar.name && calendar.name !== 'TechFlow' ? calendar.name : '');
            setObjective(calendar.objective || '');
            if (calendar.buckets && calendar.buckets.length > 0) {
                setBuckets(calendar.buckets.map((b) => ({
                    id: b.id,
                    clientKey: b.id,
                    name: b.name,
                    description: b.description || '',
                })));
            }
            if (calendar.copies) {
                setCopies(calendar.copies);
            }
            // Determine step based on data
            if (!calendar.objective) setStep(1);
            else if (!calendar.buckets || calendar.buckets.length === 0) setStep(2);
            else setStep(3);
        }
    }, [calendar]);

    const handleNextStep1 = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/calendars', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: calendarName.trim() || taskTitle || 'Untitled Calendar',
                    objective,
                    clientId: initialClientId,
                    taskId: taskId
                })
            });
            const data = await res.json();
            onCalendarCreated(data);
            setStep(2);
        } catch (error) {
            console.error('Error saving objective:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleNextStep2 = async () => {
        if (!calendar?.id) {
            toast.error('Calendar is not ready yet');
            return;
        }

        setIsLoading(true);
        try {
            const payloadBuckets = buckets.map(({ name, description }) => ({ name, description }));
            const res = await fetch(`/api/calendars/${calendar.id}/buckets`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ buckets: payloadBuckets })
            });
            await res.json();
            onRefresh();
            setStep(3);
        } catch (error) {
            console.error('Error saving buckets:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const addBucket = () => {
        setBuckets([...buckets, { clientKey: crypto.randomUUID(), name: '', description: '' }]);
    };

    const updateBucket = (index: number, field: 'name' | 'description', value: string) => {
        const newBuckets = [...buckets];
        newBuckets[index][field] = value;
        setBuckets(newBuckets);
    };

    const handleDeleteBucket = async (bucket: BucketForm) => {
        if (buckets.length === 1) {
            toast.error('Keep at least one bucket');
            return;
        }

        if (!bucket.id) {
            setBuckets(prev => prev.filter((item) => item.clientKey !== bucket.clientKey));
            return;
        }

        if (!calendar?.id) {
            toast.error('Calendar is not ready yet');
            return;
        }

        setDeletingBucketId(bucket.id);
        try {
            const res = await fetch(`/api/calendars/${calendar.id}/buckets`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ bucketId: bucket.id })
            });

            if (!res.ok) {
                const data = await res.json().catch(() => null);
                throw new Error(data?.error || 'Failed to delete bucket');
            }

            setBuckets(prev => prev.filter((item) => item.clientKey !== bucket.clientKey));
            toast.success('Bucket deleted');
            onRefresh();
        } catch (error) {
            console.error('Error deleting bucket:', error);
            toast.error(error instanceof Error ? error.message : 'Failed to delete bucket');
        } finally {
            setDeletingBucketId(null);
        }
    };

    const renderStepHeader = () => {
        const steps = [
            { id: 1, label: 'Objective', icon: Target },
            { id: 2, label: 'Buckets', icon: Layers },
            { id: 3, label: 'Copies', icon: FileText }
        ];

        return (
            <div className="flex items-center gap-4 mb-6">
                <button
                    onClick={() => {
                        if (onBack) onBack();
                        else onRefresh();
                    }}
                    className="flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors"
                >
                    <ArrowLeft size={16} />
                    Back to Tasks
                </button>
                <div className="h-4 w-1px bg-gray-300" />
                <div className="flex items-center gap-2 text-sm">
                    <span className="font-bold text-gray-900">{calendarName.trim() || taskTitle || 'New Calendar'}</span>
                    {steps.map((s) => (
                        <React.Fragment key={s.id}>
                            <span className="text-gray-400">→</span>
                            <span className={`font-medium ${step === s.id ? 'text-primary' : 'text-gray-400'}`}>
                                {s.label}
                            </span>
                        </React.Fragment>
                    ))}
                </div>
            </div>
        );
    };

    if (step === 1) {
        return (
            <div className="max-w-4xl">
                {renderStepHeader()}
                <div className="bg-white border border-gray-100 rounded-lg p-8 shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                            <Target size={20} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">Step 1: Monthly Objective</h2>
                            <p className="text-gray-500 text-sm">Define the overarching goal for this month&apos;s content</p>
                        </div>
                    </div>

                    <div className="mb-4">
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                            Calendar Name <span className="text-gray-400 font-normal normal-case">(optional — defaults to task name)</span>
                        </label>
                        <input
                            type="text"
                            value={calendarName}
                            onChange={(e) => setCalendarName(e.target.value)}
                            placeholder={taskTitle || 'Enter a custom calendar name…'}
                            className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all text-gray-700"
                        />
                    </div>

                    <textarea
                        value={objective}
                        onChange={(e) => setObjective(e.target.value)}
                        placeholder="e.g., Increase brand awareness through educational content and drive 20% more engagement on Instagram..."
                        className="w-full min-h-160px p-4 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 focus:bg-white transition-all text-gray-700 resize-none"
                    />

                    <div className="flex justify-end mt-8">
                        <button
                            onClick={handleNextStep1}
                            disabled={!objective || isLoading}
                            className="flex items-center gap-2 bg-primary hover:bg-primary disabled:opacity-50 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-primary/20"
                        >
                            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Next: Content Buckets <ChevronRight size={18} /></>}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (step === 2) {
        return (
            <div className="max-w-4xl">
                {renderStepHeader()}
                <div className="bg-white border border-gray-100 rounded-lg p-8 shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                            <Layers size={20} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">Step 2: Content Buckets</h2>
                            <p className="text-gray-500 text-sm">Define 3-4 content themes/buckets for the month</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {buckets.map((bucket, index) => (
                            <div key={bucket.clientKey} className="p-6 bg-gray-50/50 border border-gray-100 rounded-lg space-y-4">
                                <div className="flex items-center justify-between gap-3">
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Bucket {index + 1}</p>
                                    <button
                                        type="button"
                                        onClick={() => handleDeleteBucket(bucket)}
                                        disabled={buckets.length === 1 || deletingBucketId === bucket.id}
                                        className="inline-flex items-center gap-2 text-xs font-bold text-red-400 hover:text-red-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                                    >
                                        {deletingBucketId === bucket.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                                        Delete
                                    </button>
                                </div>
                                <input
                                    type="text"
                                    value={bucket.name}
                                    onChange={(e) => updateBucket(index, 'name', e.target.value)}
                                    placeholder="Bucket name (e.g., Educational Tips, Behind the Scenes)"
                                    className="w-full p-3 bg-white border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-100 transition-all text-sm font-medium"
                                />
                                <textarea
                                    value={bucket.description}
                                    onChange={(e) => updateBucket(index, 'description', e.target.value)}
                                    placeholder="Brief description of this content bucket..."
                                    className="w-full min-h-80px p-3 bg-white border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-100 transition-all text-sm text-gray-600 resize-none"
                                />
                            </div>
                        ))}

                        <button
                            onClick={addBucket}
                            className="w-full py-4 border-2 border-dashed border-gray-200 rounded-lg text-gray-400 hover:text-gray-600 hover:border-gray-300 hover:bg-gray-50 transition-all flex items-center justify-center gap-2 font-bold"
                        >
                            <Plus size={18} /> Add Content Bucket
                        </button>
                    </div>

                    <div className="flex justify-between mt-8">
                        <button
                            onClick={() => setStep(1)}
                            className="flex items-center gap-2 text-gray-500 hover:text-gray-900 px-6 py-3 rounded-xl font-bold transition-all bg-gray-100 hover:bg-gray-200"
                        >
                            <ArrowLeft size={18} /> Back
                        </button>
                        <button
                            onClick={handleNextStep2}
                            disabled={buckets.some(b => !b.name) || isLoading}
                            className="flex items-center gap-2 bg-primary hover:bg-primary disabled:opacity-50 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-primary/20"
                        >
                            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Next: Create Copies <ChevronRight size={18} /></>}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (step === 3) {
        if (!calendar) return null;

        return (
            <div className="max-w-5xl space-y-6">
                {renderStepHeader()}

                {/* Objective Summary */}
                <div className="bg-white border border-gray-100 rounded-lg p-6 shadow-sm flex items-start justify-between">
                    <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-widest mb-1">Objective</p>
                        <p className="text-sm font-medium text-gray-800">{calendar.objective}</p>

                        <p className="text-xs font-medium text-gray-500 uppercase tracking-widest mb-1 mt-4">Content Buckets</p>
                        <div className="mt-3 flex flex-wrap gap-2">
                            {calendar.buckets?.map((b, i) => (
                                <span key={i} className="px-2 py-1 bg-primary/10 text-primary text-[10px] font-bold rounded-lg uppercase">
                                    {b.name}
                                </span>
                            ))}
                        </div>
                    </div>
                    <button onClick={() => setStep(1)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all">
                        <Edit2 size={16} />
                    </button>
                </div>

                <CalendarCopiesList
                    calendarId={calendar.id}
                    buckets={calendar.buckets || []}
                    copies={copies}
                    onRefresh={onRefresh}
                    taskId={taskId}
                    calendarObjective={calendar.objective || undefined}
                    clientPlatforms={clientPlatforms}
                />
            </div>
        );
    }
    return null;
};