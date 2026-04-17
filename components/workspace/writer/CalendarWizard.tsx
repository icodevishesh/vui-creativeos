"use client";

import React, { useState, useEffect } from 'react';
import { Target, Layers, FileText, ChevronRight, Plus, ArrowLeft, Send, Trash2, Edit2, Check, Loader2 } from 'lucide-react';
import { CalendarCopiesList } from './CalendarCopiesList';

interface CalendarWizardProps {
    calendar: any;
    onCalendarCreated: (calendar: any) => void;
    onRefresh: () => void;
    onBack?: () => void;
    initialClientId?: string;
    taskId?: string;
}

export const CalendarWizard: React.FC<CalendarWizardProps> = ({
    calendar,
    onCalendarCreated,
    onRefresh,
    onBack,
    initialClientId,
    taskId
}) => {
    const [step, setStep] = useState(1);
    const [objective, setObjective] = useState('');
    const [buckets, setBuckets] = useState([{ name: '', description: '' }]);
    const [isLoading, setIsLoading] = useState(false);
    const [copies, setCopies] = useState<any[]>([]);

    useEffect(() => {
        if (calendar) {
            setObjective(calendar.objective || '');
            if (calendar.buckets && calendar.buckets.length > 0) {
                setBuckets(calendar.buckets.map((b: any) => ({ name: b.name, description: b.description || '' })));
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
                    name: 'TechFlow',
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
        setIsLoading(true);
        try {
            const res = await fetch(`/api/calendars/${calendar.id}/buckets`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ buckets })
            });
            const data = await res.json();
            onRefresh();
            setStep(3);
        } catch (error) {
            console.error('Error saving buckets:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const addBucket = () => {
        setBuckets([...buckets, { name: '', description: '' }]);
    };

    const updateBucket = (index: number, field: string, value: string) => {
        const newBuckets = [...buckets];
        (newBuckets[index] as any)[field] = value;
        setBuckets(newBuckets);
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
                <div className="h-4 w-[1px] bg-gray-300" />
                <div className="flex items-center gap-2 text-sm">
                    <span className="font-bold text-gray-900">TechFlow</span>
                    {steps.map((s, i) => (
                        <React.Fragment key={s.id}>
                            <span className="text-gray-400">→</span>
                            <span className={`font-medium ${step === s.id ? 'text-blue-600' : 'text-gray-400'}`}>
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
            <div className="max-w-4xl mx-auto">
                {renderStepHeader()}
                <div className="bg-white border border-gray-100 rounded-lg p-8 shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                            <Target size={20} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">Step 1: Monthly Objective</h2>
                            <p className="text-gray-500 text-sm">Define the overarching goal for this month's content</p>
                        </div>
                    </div>

                    <textarea
                        value={objective}
                        onChange={(e) => setObjective(e.target.value)}
                        placeholder="e.g., Increase brand awareness through educational content and drive 20% more engagement on Instagram..."
                        className="w-full min-h-[160px] p-4 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-indigo-100 focus:bg-white transition-all text-gray-700 resize-none"
                    />

                    <div className="flex justify-end mt-8">
                        <button
                            onClick={handleNextStep1}
                            disabled={!objective || isLoading}
                            className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-indigo-100"
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
            <div className="max-w-4xl mx-auto">
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
                            <div key={index} className="p-6 bg-gray-50/50 border border-gray-100 rounded-lg space-y-4">
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Bucket {index + 1}</p>
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
                                    className="w-full min-h-[80px] p-3 bg-white border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-100 transition-all text-sm text-gray-600 resize-none"
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
                            className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-indigo-100"
                        >
                            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Next: Create Copies <ChevronRight size={18} /></>}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (step === 3) {
        return (
            <div className="max-w-5xl mx-auto space-y-6">
                {renderStepHeader()}

                {/* Objective Summary */}
                <div className="bg-white border border-gray-100 rounded-lg p-6 shadow-sm flex items-start justify-between">
                    <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-widest mb-1">Objective</p>
                        <p className="text-sm font-medium text-gray-800">{calendar.objective}</p>

                        <p className="text-xs font-medium text-gray-500 uppercase tracking-widest mb-1 mt-4">Content Buckets</p>
                        <div className="mt-3 flex flex-wrap gap-2">
                            {calendar.buckets.map((b: any, i: number) => (
                                <span key={i} className="px-2 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-bold rounded-lg uppercase">
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
                    buckets={calendar.buckets}
                    copies={copies}
                    onRefresh={onRefresh}
                    taskId={taskId}
                    calendarObjective={calendar.objective}
                />
            </div>
        );
    }

    return null;
};
