"use client";

import { useState, useCallback, useMemo } from "react";
import { useCalendarApp, ScheduleXCalendar } from "@schedule-x/react";
import {
    createViewDay,
    createViewMonthAgenda,
    createViewMonthGrid,
    createViewWeek,
} from "@schedule-x/calendar";
import { createEventsServicePlugin } from "@schedule-x/events-service";
import { createEventModalPlugin } from "@schedule-x/event-modal";
import "@schedule-x/theme-default/dist/index.css";

import {
    Plus, X, Calendar, Clock, User, Tag, Loader2, Users,
} from "lucide-react";
import { toast } from "react-hot-toast";
import "temporal-polyfill/global";

// ─── Types ────────────────────────────────────────────────────
export interface CalendarEvent {
    id: string;
    title: string;
    start: string | Temporal.ZonedDateTime | Temporal.PlainDate;
    end: string | Temporal.ZonedDateTime | Temporal.PlainDate;
    calendarId: string;
    description?: string;
    assignedTo?: string;
    type?: EventType;
    endDate?: string;
}

export type EventType = "TODO" | "IN_PROGRESS" | "REVIEW" | "DONE";

interface Member {
    id: string;
    name: string;
    initials: string;
    color: string;
}

const EVENT_TYPES: { value: EventType; label: string; color: string }[] = [
    { value: "TODO", label: "To Do", color: "#64748b" },
    { value: "IN_PROGRESS", label: "In Progress", color: "#3b82f6" },
    { value: "REVIEW", label: "Review", color: "#f59e0b" },
    { value: "DONE", label: "Done", color: "#22c55e" },
];

const CALENDARS = {
    TODO: { colorName: "TODO", lightColors: { main: "#64748b", container: "#f1f5f9", onContainer: "#334155" } },
    IN_PROGRESS: { colorName: "IN_PROGRESS", lightColors: { main: "#3b82f6", container: "#dbeafe", onContainer: "#1e3a5f" } },
    REVIEW: { colorName: "REVIEW", lightColors: { main: "#f59e0b", container: "#fef3c7", onContainer: "#78350f" } },
    DONE: { colorName: "DONE", lightColors: { main: "#22c55e", container: "#dcfce3", onContainer: "#14532d" } },
};

const toDateStr = (d: Date) => d.toISOString().slice(0, 10);
const today = new Date();
const todayStr = toDateStr(today);
const addDays = (n: number) => { const d = new Date(today); d.setDate(d.getDate() + n); return toDateStr(d); };

// ─── Date helpers ─────────────────────────────────────────────
const toPlainDate = (dateStr: string): Temporal.PlainDate =>
    Temporal.PlainDate.from(dateStr);

const toZonedDateTime = (dateStr: string, timeStr: string): Temporal.ZonedDateTime =>
    Temporal.ZonedDateTime.from(`${dateStr}T${timeStr}:00[UTC]`);

const eventDateStr = (start: any): string => {
    const str = typeof start === "string" ? start : start.toString();
    return str.slice(0, 10);
};

const ensureTemporal = (val: string | Temporal.ZonedDateTime | Temporal.PlainDate): Temporal.ZonedDateTime | Temporal.PlainDate => {
    if (typeof val !== "string") return val;
    if (val.includes(" ")) {
        const [date, time] = val.split(" ");
        return toZonedDateTime(date, time);
    }
    return toPlainDate(val);
};

// ─── Member colour palette ────────────────────────────────────
const MEMBER_COLORS = [
    "#3b82f6", "#ec4899", "#8b5cf6", "#a855f7",
    "#14b8a6", "#f97316", "#0ea5e9", "#22c55e",
];

/** Resolve a display Member from either the static list or a plain name string */
const deriveMember = (member: { id: string, name: string }, idx: number): Member => {
    return {
        id: member.id,
        name: member.name,
        initials: member.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase(),
        color: MEMBER_COLORS[idx % MEMBER_COLORS.length],
    };
};

// ─── Add Event Modal ──────────────────────────────────────────
const AddEventModal = ({ onClose, onAdd, preAssignee, teamMembers }: {
    onClose: () => void;
    onAdd: (e: CalendarEvent) => void;
    preAssignee?: string;
    teamMembers?: { id: string, name: string }[];
}) => {
    // Resolve which member list to show — prop-driven or fall back to static list
    const displayMembers: Member[] = (teamMembers && teamMembers.length > 0)
        ? teamMembers.map(deriveMember)
        : [];
    const [title, setTitle] = useState("");
    const [type, setType] = useState<EventType>("TODO");
    const [date, setDate] = useState(todayStr);
    const [startDate, setStartDate] = useState(todayStr);
    const [endDate, setEndDate] = useState(todayStr);
    const [startTime, setStartTime] = useState("00:00");
    const [endTime, setEndTime] = useState("23:59");
    const [allDay, setAllDay] = useState(false);
    const [assignedTo, setAssignedTo] = useState(preAssignee ?? "");
    const [description, setDescription] = useState("");
    const [saving, setSaving] = useState(false);

    // const handleAdd = async () => {
    //     if (!title.trim()) { toast.error("Title is required."); return; }
    //     setSaving(true);
    //     await new Promise((r) => setTimeout(r, 300));
    //     onAdd({
    //         id: `e-${Date.now()}`,
    //         title: title.trim(),
    //         start: allDay ? toPlainDate(date) : toZonedDateTime(date, startTime),
    //         end: allDay ? toPlainDate(date) : toZonedDateTime(date, endTime),
    //         calendarId: type,
    //         type,
    //         assignedTo,
    //         description,
    //     });
    //     setSaving(false);
    //     toast.success("Event added!");
    //     onClose();
    // };

    const handleAdd = async () => {
        if (!title.trim()) { toast.error("Title is required."); return; }

        if (new Date(endDate) < new Date(startDate)) {
            toast.error("End date cannot be before start date");
            return;
        }
        setSaving(true);
        
        const isDefaultTime = startTime === "00:00" && endTime === "23:59";
        const treatAsAllDay = allDay || isDefaultTime;

        const eventPayload: CalendarEvent = {
            id: `e-${Date.now()}`,
            title: title.trim(),
            start: treatAsAllDay
                ? toPlainDate(startDate)
                : toZonedDateTime(startDate, startTime),
            end: treatAsAllDay
                ? toPlainDate(endDate)
                : toZonedDateTime(endDate, endTime),
            calendarId: type,
            type,
            assignedTo,
            description,
            endDate,
        };

        onAdd(eventPayload);
        setSaving(false);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-999 flex items-center justify-center bg-black/30 backdrop-blur-xs px-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
                    <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                            <Calendar size={15} />
                        </div>
                        <h2 className="text-sm font-semibold text-gray-800">Add Event</h2>
                    </div>
                    <button onClick={onClose} className="text-gray-300 hover:text-gray-600 transition-colors">
                        <X size={17} />
                    </button>
                </div>

                <div className="px-6 py-5 space-y-4">
                    {/* Title */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-gray-700 flex items-center gap-1.5">Title</label>
                        <input className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 flex items-center h-10 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900" placeholder="e.g. Design Review, Blog Deadline…"
                            value={title} onChange={(e) => setTitle(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleAdd()} autoFocus />
                    </div>

                    {/* Type */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-gray-700 flex items-center gap-1.5">
                            <Tag size={11} className="text-blue-400" /> Type
                        </label>
                        <div className="flex gap-2">
                            {EVENT_TYPES.map((t) => (
                                <button key={t.value} type="button" onClick={() => setType(t.value)}
                                    className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-all ${type === t.value ? "text-white shadow-sm" : "bg-gray-50 text-gray-400 border-gray-200"
                                        }`}
                                    style={type === t.value ? { backgroundColor: t.color, borderColor: t.color } : {}}>
                                    {t.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Date Range Selection */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-gray-700 flex items-center gap-1.5">
                                <Calendar size={11} /> Start Date
                            </label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="bg-white border-gray-200 text-gray-900"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-gray-700 flex items-center gap-1.5">
                                <Calendar size={11} /> End Date
                            </label>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="bg-white border-gray-200 text-gray-900"
                            />
                        </div>
                    </div>

                    {/* Time */}
                    {!allDay && (
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-gray-700 flex items-center gap-1.5"><Clock size={11} /> Start</label>
                                <input className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 flex items-center h-10 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-medium text-gray-700 flex items-center gap-1.5"><Clock size={11} /> End</label>
                                <input className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 flex items-center h-10 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
                            </div>
                        </div>
                    )}

                    {/* Assign */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-gray-700 flex items-center gap-1.5">
                            <User size={11} className="text-blue-400" /> Assign To
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {displayMembers.map((m) => (
                                <button key={m.id} type="button"
                                    onClick={() => setAssignedTo(assignedTo === m.id ? "" : m.id)}
                                    className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border font-medium transition-all ${assignedTo === m.id ? "text-white shadow-sm" : "bg-gray-50 text-gray-500 border-gray-200"
                                        }`}
                                    style={assignedTo === m.id ? { backgroundColor: m.color, borderColor: m.color } : {}}>
                                    <span className="w-5 h-5 rounded-full text-white text-[9px] font-bold flex items-center justify-center shrink-0"
                                        style={{ backgroundColor: m.color }}>
                                        {m.initials}
                                    </span>
                                    {m.name.split(" ")[0]}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Description */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-gray-700 flex items-center gap-1.5">Description (optional)</label>
                        <textarea value={description} onChange={(e) => setDescription(e.target.value)}
                            rows={2} placeholder="Add notes or context..."
                            className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-gray-700 bg-white" />
                    </div>
                </div>

                <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-2">
                    <button type="button" className="px-4 py-2 border border-gray-200 text-gray-700 bg-white rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors" onClick={onClose}>Cancel</button>
                    <button type="button" className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50" onClick={handleAdd} disabled={saving}>
                        {saving
                            ? <span className="flex items-center gap-2"><Loader2 size={13} className="animate-spin" /> Adding...</span>
                            : "Add Event"}
                    </button>
                </div>
            </div>
        </div>
    );
};

// ─── Member Sidebar ───────────────────────────────────────────
const MemberSidebar = ({ members, events, onAddForMember }: {
    members: { id: string, name: string }[];
    events: any[];
    onAddForMember: (id: string) => void;
}) => {
    const getCount = (id: string) => events.filter((e) => e.assignedTo === id).length;
    const getUpcoming = (id: string) => events.filter((e) => e.assignedTo === id && eventDateStr(e.start) >= todayStr).length;

    return (
        <div className="w-56 shrink-0 bg-white border-r border-gray-100 flex flex-col overflow-y-auto">
            <div className="px-4 py-4 border-b border-gray-100">
                <p className="text-xs font-semibold text-gray-500 flex items-center gap-1.5">
                    <Users size={12} className="text-blue-500" /> Team Members
                </p>
            </div>
            <div className="py-2 flex-1">
                {members.map((member, idx) => {
                    const m = deriveMember(member, idx);
                    return (
                        <div key={m.id} onClick={() => onAddForMember(m.id)}
                            className="flex items-center gap-2.5 px-4 py-2.5 hover:bg-gray-50 transition-colors group cursor-pointer">
                            <div className="w-8 h-8 rounded-full text-white text-xs font-bold flex items-center justify-center shrink-0"
                                style={{ backgroundColor: m.color }}>
                                {m.initials}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold text-gray-700 truncate">{m.name}</p>
                                <p className="text-[10px] text-gray-400">{getCount(m.id)} events · {getUpcoming(m.id)} upcoming</p>
                            </div>
                            <Plus size={13} className="text-gray-300 group-hover:text-blue-500 transition-colors shrink-0" />
                        </div>
                    );
                })}
            </div>
            <div className="px-4 py-4 border-t border-gray-100 space-y-2">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Legend</p>
                {EVENT_TYPES.map((t) => (
                    <div key={t.value} className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: t.color }} />
                        <span className="text-xs text-gray-500 capitalize">{t.label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

interface CalendarAppProps {
    teamId: string;
    teamName: string;
    teamColor: string;
    teamMembers: { id: string, name: string }[];
    initialEvents: CalendarEvent[];
    onEventAdded: (event: CalendarEvent) => void;
}

export default function CalendarApp({
    teamId,
    teamName,
    teamColor,
    teamMembers,
    initialEvents,
    onEventAdded,
}: CalendarAppProps) {
    const processedEvents = useMemo(() => initialEvents.map(e => ({
        ...e,
        start: ensureTemporal(e.start),
        end: ensureTemporal(e.end),
    })), [initialEvents]);

    const [events, setEvents] = useState<any[]>(processedEvents);
    const [modalOpen, setModalOpen] = useState(false);
    const [defaultAssignee, setDefaultAssignee] = useState("");

    const eventsService = useMemo(() => createEventsServicePlugin(), []);

    const calendar = useCalendarApp({
        views: [
            createViewDay(),
            createViewWeek(),
            createViewMonthGrid(),
            createViewMonthAgenda(),
        ],
        defaultView: createViewMonthGrid().name,
        selectedDate: toPlainDate(todayStr),
        calendars: CALENDARS,
        events: processedEvents,
        plugins: [
            eventsService,
            createEventModalPlugin(),
        ],
    });

    const handleAdd = useCallback((event: CalendarEvent) => {
        const temporalEvent = {
            ...event,
            start: ensureTemporal(event.start),
            end: ensureTemporal(event.end),
        };
        eventsService.add(temporalEvent as any);
        setEvents((prev) => [...prev, temporalEvent]);
        onEventAdded(event);
    }, [eventsService, onEventAdded]);

    const todayEvents = events.filter((e) => eventDateStr(e.start) === todayStr);
    const deadlines = events.filter((e) => e.type === "deadline");

    const CustomEvent = ({ calendarEvent }: { calendarEvent: any }) => {
        // Handle both Temporal objects and strings safely
        const startStr = calendarEvent.start?.toString() || "";
        const endStr = calendarEvent.end?.toString() || "";
        const isAllDay = startStr.length <= 10; // PlainDate is 10 chars, ZonedDateTime/String is longer
        
        const assignee = teamMembers.find(m => m.id === calendarEvent.assignedTo);
        const statusType = EVENT_TYPES.find(t => t.value === calendarEvent.calendarId) || EVENT_TYPES[0];
        
        return (
            <div className="w-full h-full flex flex-col p-1 overflow-hidden" 
                 style={{ 
                     backgroundColor: statusType.color, 
                     color: 'white', 
                     borderRadius: '4px',
                     fontSize: '0.7rem' 
                 }}>
                <div className="font-semibold truncate">{calendarEvent.title}</div>
                
                {/* For all day events (default time), hide time. Otherwise cleanly extract it. */}
                {!isAllDay && startStr.length > 11 && (
                    <div className="mt-0.5 text-[0.65rem] opacity-90 mb-0.5">
                        {startStr.substring(11, 16).replace("T", " ")} - {endStr.substring(11, 16).replace("T", " ")}
                    </div>
                )}

                <div className="flex flex-col gap-0.5 mt-0.5 text-[0.65rem] opacity-90">
                    {assignee && (
                        <div className="truncate flex items-center gap-1">
                            <User size={9} /> {assignee.name}
                        </div>
                    )}
                    <div className="truncate flex items-center gap-1">
                        <Tag size={9} /> {statusType.label}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="flex flex-col h-full bg-gray-50">
            {/* Top Bar inside component */}
            <div className="bg-white p-1 flex items-center justify-between shrink-0">
                <div>
                    <h1 className="text-sm font-semibold text-gray-800">{teamName} Calendar</h1>

                </div>
                <div className="flex items-center gap-3">
                    <div className="hidden sm:flex items-center gap-3 text-xs text-gray-500 mr-2">
                        <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-blue-400" />{todayEvents.length} today</span>
                    </div>
                    <button type="button" className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50" onClick={() => { setDefaultAssignee(""); setModalOpen(true); }}>
                        <Plus size={13} /> Add Event
                    </button>
                </div>
            </div>

            {/* Body */}
            <div className="flex flex-1 overflow-hidden">
                <div className="hidden lg:flex">
                    <MemberSidebar
                        members={teamMembers}
                        events={events}
                        onAddForMember={(id) => { setDefaultAssignee(id); setModalOpen(true); }} />
                </div>
                <div className="flex-1 overflow-hidden">
                    <div className="h-full rounded-xl overflow-hidden border border-gray-200 bg-white" style={{ minHeight: "500px" }}>
                        <style>{`
                            .sx-react-calendar-wrapper { width: 100%; height: 100%; min-height: 500px; }
                            .sx__calendar-wrapper { border: none !important; border-radius: 0 !important; font-family: inherit !important; }
                        `}</style>
                        <ScheduleXCalendar 
                            calendarApp={calendar} 
                            customComponents={{
                                timeGridEvent: CustomEvent,
                                dateGridEvent: CustomEvent,
                                monthGridEvent: CustomEvent,
                                monthAgendaEvent: CustomEvent,
                            }}
                        />
                    </div>
                </div>
            </div>

            {modalOpen && (
                <AddEventModal
                    onClose={() => setModalOpen(false)}
                    preAssignee={defaultAssignee}
                    teamMembers={teamMembers}
                    onAdd={(event) => {
                        handleAdd(defaultAssignee ? { ...event, assignedTo: event.assignedTo || defaultAssignee } : event);
                        setModalOpen(false);
                    }}
                />
            )}
        </div>
    );
}