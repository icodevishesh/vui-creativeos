"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { RefreshCw, Building, Target, Loader2, Check } from "lucide-react";
import { Calendar } from "@/components/Calendar";

export default function CalendarPage() {
    const [selectedClientId, setSelectedClientId] = useState<string>("");
    const [localObjective, setLocalObjective] = useState<string>("");
    const queryClient = useQueryClient();

    // Fetch available clients for the dropdown filtering context
    const { data: clients, isLoading: clientsLoading } = useQuery({
        queryKey: ["all-clients"],
        queryFn: () => fetch("/api/clients").then(res => res.json())
    });

    // Fetch tasks for the selected client
    const { data: tasks, isLoading: tasksLoading } = useQuery({
        queryKey: ["tasks", selectedClientId],
        queryFn: () => fetch(`/api/tasks?clientId=${selectedClientId}`).then(res => res.json()),
        enabled: !!selectedClientId,
    });

    // Fetch projects for the selected client
    const { data: projects, isLoading: projectsLoading } = useQuery({
        queryKey: ["projects", selectedClientId],
        queryFn: () => fetch(`/api/projects?clientId=${selectedClientId}`).then(res => res.json()),
        enabled: !!selectedClientId,
    });

    const activeClient = clients?.find((c: any) => c.id === selectedClientId);


    // 2. Fetch objective for selected client
    const { data: objectiveData, isLoading: objectiveLoading } = useQuery({
        queryKey: ["client-objective", selectedClientId],
        queryFn: () =>
            fetch(`/api/clients/${selectedClientId}/objective`).then((res) => res.json()),
        enabled: !!selectedClientId,
    });

    // Sync fetched objective to local state for editing
    useEffect(() => {
        if (objectiveData) {
            setLocalObjective(objectiveData.objective || "");
        }
    }, [objectiveData]);

    // 3. Mutation to save objective
    const updateObjective = useMutation({
        mutationFn: async (newObjective: string) => {
            const res = await fetch(`/api/clients/${selectedClientId}/objective`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ objective: newObjective }),
            });
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["client-objective", selectedClientId] });
        },
    });

    const handleObjectiveBlur = () => {
        // Only save if the text actually changed
        if (localObjective !== objectiveData?.objective) {
            updateObjective.mutate(localObjective);
        }
    };

    if (clientsLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-50">
                <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
        );
    }

    const isLoadingClientData = !!selectedClientId && (tasksLoading || projectsLoading || objectiveLoading);

    return (
        <main className="flex flex-col bg-gray-50">
            {/* Header / Client Configuration Row */}
            <div className="flex items-center justify-between px-2">
                <div className="flex items-center gap-3">
                    <div>
                        <h1 className="text-lg md:text-2xl font-bold text-gray-900 tracking-tight">Content Calendar</h1>
                        <p className="text-xs md:text-sm font-medium text-gray-400">Select a client below to review all relevant project deliveries.</p>
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
            <div className="flex-1 overflow-y-auto pt-4 relative">
                {!selectedClientId ? (
                    <div className="flex items-center justify-center">
                        <div className="mt-36 flex flex-col items-center justify-center">
                            <Building size={48} className="text-gray-300 mb-4" />
                            <h3 className="text-lg font-semibold text-gray-600">No Client Selected</h3>
                            <p className="text-sm text-gray-400">Choose a client from the dropdown to load their task scheduling pipeline.</p>
                        </div>
                    </div>
                ) : isLoadingClientData ? (
                    <div className="w-full pb-8 animate-pulse">
                        <div className="px-2 mb-6">
                            <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="h-5 bg-gray-200 rounded w-48"></div>
                                    <div className="h-4 bg-gray-200 rounded w-16"></div>
                                </div>
                                <div className="h-24 bg-gray-100 rounded-lg w-full mb-2"></div>
                                <div className="flex justify-end mt-4">
                                    <div className="h-10 bg-gray-200 rounded-lg w-32"></div>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 w-full">
                            <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm h-[600px]">
                                <div className="flex justify-between items-center mb-6">
                                    <div className="flex items-center gap-4">
                                        <div className="h-8 bg-gray-200 rounded-md w-32"></div>
                                        <div className="h-8 bg-gray-200 rounded-md w-24"></div>
                                    </div>
                                    <div className="flex gap-2">
                                        <div className="h-8 bg-gray-200 rounded-md w-20"></div>
                                        <div className="h-8 bg-gray-200 rounded-md w-20"></div>
                                        <div className="h-8 bg-gray-200 rounded-md w-20"></div>
                                    </div>
                                </div>
                                <div className="grid grid-cols-7 gap-[1px] bg-gray-100 border border-gray-100 rounded-lg overflow-hidden h-[500px]">
                                    {Array.from({ length: 7 }).map((_, i) => (
                                        <div key={`header-${i}`} className="bg-gray-50 h-10"></div>
                                    ))}
                                    {Array.from({ length: 35 }).map((_, i) => (
                                        <div key={`cell-${i}`} className="bg-white w-full h-full min-h-[80px]"></div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="w-full pb-8">

                        {/* --- Define calendar objective --- */}
                        <div className="mb-6 px-2">
                            <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2 text-gray-700">
                                        <Target size={18} className="text-blue-500" />
                                        <h3 className="font-semibold text-sm">Monthly Calendar Objective</h3>
                                    </div>
                                    {/* Saving Indicator */}
                                    <div className="text-xs font-medium text-gray-400 flex items-center gap-1">
                                        {updateObjective.isPending ? (
                                            <><Loader2 size={14} className="animate-spin" /> Saving...</>
                                        ) : updateObjective.isSuccess ? (
                                            <><Check size={14} className="text-green-500" /> Saved</>
                                        ) : null}
                                    </div>
                                </div>
                                <textarea
                                    value={localObjective}
                                    onChange={(e) => setLocalObjective(e.target.value)}
                                    placeholder="Define the calendar's primary objective"
                                    className="w-full text-sm text-gray-800 bg-gray-50 border border-gray-100 rounded-lg p-3 outline-none focus:ring-2 focus:ring-blue-100 focus:bg-white transition-all resize-none min-h-[80px]"
                                />
                            </div>
                            <div className="flex item-center justify-end">
                                <button
                                    onClick={handleObjectiveBlur}
                                    className="px-4 py-2 mt-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    Add objective
                                </button>
                            </div>
                        </div>


                        <div className="p-4 w-full">
                            <Calendar
                                tasks={tasks || []}
                                clients={clients || []}
                                projects={projects || []}
                            />
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}
