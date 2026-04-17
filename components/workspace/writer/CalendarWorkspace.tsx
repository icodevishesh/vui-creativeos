"use client";

import React, { useState, useEffect } from 'react';
import { CalendarWizard } from './CalendarWizard';
import { CalendarCopiesList } from './CalendarCopiesList';
import { Loader2 } from 'lucide-react';

interface CalendarWorkspaceProps {
    initialClientId?: string;
    initialCalendarId?: string;
    taskId?: string;
    onBack?: () => void;
}

export const CalendarWorkspace: React.FC<CalendarWorkspaceProps> = ({
    initialClientId,
    initialCalendarId,
    taskId,
    onBack
}) => {
    const [calendar, setCalendar] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchCalendars();
    }, [initialCalendarId]);

    const fetchCalendars = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/calendars');
            const data = await res.json();
            if (data && data.length > 0) {
                // If initialCalendarId is provided, find that one. Otherwise pick most recent.
                const targetCalendar = initialCalendarId
                    ? data.find((c: any) => c.id === initialCalendarId)
                    : data[0];

                setCalendar(targetCalendar || data[0]);
            }
        } catch (error) {
            console.error('Failed to fetch calendars:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCalendarCreated = (newCalendar: any) => {
        setCalendar(newCalendar);
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
                onRefresh={fetchCalendars}
                onBack={onBack}
                initialClientId={initialClientId}
                taskId={taskId}
            />
        </div>
    );
};
