"use client";

import React, { useState, useEffect, useRef } from 'react';
import { CalendarWizard } from './CalendarWizard';
import { Loader2 } from 'lucide-react';

interface CalendarWorkspaceProps {
    initialClientId?: string;
    initialCalendarId?: string;
    taskId?: string;
    taskTitle?: string;
    clientPlatforms?: string[];
    onBack?: () => void;
}

export const CalendarWorkspace: React.FC<CalendarWorkspaceProps> = ({
    initialClientId,
    initialCalendarId,
    taskId,
    taskTitle,
    clientPlatforms = [],
    onBack
}) => {
    const [calendar, setCalendar] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(!!initialCalendarId);
    // Track the active calendar ID so refresh works after creation
    const activeCalendarIdRef = useRef<string | undefined>(initialCalendarId);

    useEffect(() => {
        activeCalendarIdRef.current = initialCalendarId;
        if (!initialCalendarId) {
            // New task — start wizard from scratch
            setCalendar(null);
            setIsLoading(false);
        } else {
            loadCalendar(initialCalendarId);
        }
    }, [initialCalendarId]);

    const loadCalendar = async (calendarId: string) => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/calendars');
            const data = await res.json();
            const found = Array.isArray(data) ? data.find((c: any) => c.id === calendarId) : null;
            setCalendar(found ?? null);
        } catch (error) {
            console.error('Failed to fetch calendar:', error);
            setCalendar(null);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCalendarCreated = (newCalendar: any) => {
        activeCalendarIdRef.current = newCalendar.id;
        setCalendar(newCalendar);
    };

    const handleRefresh = () => {
        const id = activeCalendarIdRef.current;
        if (id) loadCalendar(id);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <CalendarWizard
                calendar={calendar}
                onCalendarCreated={handleCalendarCreated}
                onRefresh={handleRefresh}
                onBack={onBack}
                initialClientId={initialClientId}
                taskId={taskId}
                taskTitle={taskTitle}
                clientPlatforms={clientPlatforms}
            />
        </div>
    );
};
