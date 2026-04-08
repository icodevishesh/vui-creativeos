"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { RefreshCw, Calendar, Building } from "lucide-react";
import CalendarApp, { CalendarEvent } from "@/components/Calendar";

export default function CalendarPage() {
    const [selectedClientId, setSelectedClientId] = useState<string>("");

    // Fetch available clients for the dropdown filtering context
    const { data: clients, isLoading: clientsLoading } = useQuery({
        queryKey: ["all-clients"],
        queryFn: () => fetch("/api/clients").then(res => res.json())
    });

    // Fetch calendar events mapped physically to the current selected client
    const { data: events, isLoading: eventsLoading } = useQuery({
        queryKey: ["calendar-events", selectedClientId],
        queryFn: () => fetch(`/api/calendar/${selectedClientId}`).then(res => res.json()),
        enabled: !!selectedClientId,
    });

    // Fetch available Team structure directly for the active client mapping
    const { data: teamMembers } = useQuery({
        queryKey: ["client-team", selectedClientId],
        queryFn: () => fetch(`/api/clients/${selectedClientId}/team`).then(res => res.json()),
        enabled: !!selectedClientId,
    });

    const activeClient = clients?.find((c: any) => c.id === selectedClientId);

    const handleEventAdded = async (event: CalendarEvent) => {
        try {
            await fetch(`/api/calendar/${selectedClientId}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(event)
            });
        } catch (error) {
            console.error("Failed to commit event to database", error);
        }
    };

    if (clientsLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-50">
                <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
        );
    }

    return (
        <main className="flex flex-col h-screen bg-gray-50">
            {/* Header / Client Configuration Row */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Content Calendar</h1>
                        <p className="text-sm font-medium text-gray-400">Select a client below to review all relevant project deliveries.</p>
                    </div>
                </div>

                <div className="w-64">
                    <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Operating Client Context</label>
                    <select
                        className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm font-semibold rounded-xl focus:ring-blue-500 focus:border-blue-500 block px-3 py-2.5 transition-all"
                        value={selectedClientId}
                        onChange={(e) => setSelectedClientId(e.target.value)}
                    >
                        <option value="">Select a Client...</option>
                        {clients?.map((client: any) => (
                            <option key={client.id} value={client.id}>
                                {client.companyName}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Application Bridge Wrapper */}
            <div className="flex-1 overflow-hidden pt-4 relative">
                {!selectedClientId ? (
                    <div className="h-full border-dashed flex flex-col items-center justify-center">
                        <Building size={48} className="text-gray-300 mb-4" />
                        <h3 className="text-lg font-bold text-gray-600">No Client Selected</h3>
                        <p className="text-sm text-gray-400">Choose a client from the dropdown map to load their task scheduling pipeline.</p>
                    </div>
                ) : eventsLoading ? (
                    <div className="h-full flex items-center justify-center">
                        <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
                    </div>
                ) : (
                    <div className="h-full overflow-hidden">
                        <CalendarApp
                            teamId={activeClient?.id}
                            teamName={activeClient?.companyName}
                            teamColor="#3b82f6"
                            // Map the returned client team members structure securely into our explicitly typed list
                            teamMembers={teamMembers?.map((m: any) => ({
                                id: m.userId,
                                name: m.userName
                            })) || []}
                            initialEvents={events || []}
                            onEventAdded={handleEventAdded}
                        />
                    </div>
                )}
            </div>
        </main>
    );
}
