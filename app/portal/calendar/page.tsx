"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Calendar as CalendarIcon, RefreshCw } from "lucide-react";
import { Calendar } from "@/components/Calendar";

type PortalProfile = {
  id: string;
  companyName: string;
  email: string;
};

type CalendarCopy = {
  id: string;
  content: string;
  caption?: string | null;
  hashtags?: string | null;
  publishDate?: string | Date | null;
  publishTime?: string | null;
  status: string;
  bucketId: string;
  bucket?: { id: string; name: string } | null;
};

const fetchProfile = async (): Promise<PortalProfile> => {
  const res = await fetch("/api/portal/profile");
  if (!res.ok) throw new Error("Failed to fetch profile");
  return res.json();
};

const fetchClientCalendars = async (clientId: string) => {
  const res = await fetch(`/api/calendars?clientId=${clientId}`);
  if (!res.ok) throw new Error("Failed to fetch calendars");
  return res.json();
};

const fetchTasks = async (clientId: string) => {
  const res = await fetch(`/api/tasks?clientId=${clientId}`);
  if (!res.ok) throw new Error("Failed to fetch tasks");
  return res.json();
};

const fetchProjects = async (clientId: string) => {
  const res = await fetch(`/api/clients/${clientId}/projects`);
  if (!res.ok) throw new Error("Failed to fetch projects");
  return res.json();
};

export default function PortalCalendarPage() {
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["portal-profile"],
    queryFn: fetchProfile,
  });

  const clientId = profile?.id ?? "";

  const { data: calendars = [], isLoading: calendarsLoading } = useQuery({
    queryKey: ["portal-client-calendars", clientId],
    queryFn: () => fetchClientCalendars(clientId),
    enabled: !!clientId,
  });

  const { data: tasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ["portal-client-tasks", clientId],
    queryFn: () => fetchTasks(clientId),
    enabled: !!clientId,
  });

  const { data: projects = [], isLoading: projectsLoading } = useQuery({
    queryKey: ["portal-client-projects", clientId],
    queryFn: () => fetchProjects(clientId),
    enabled: !!clientId,
  });

  const copies = useMemo<CalendarCopy[]>(() => {
    return (calendars as Array<{ copies?: CalendarCopy[] }>).flatMap((calendar) =>
      (calendar.copies ?? []).map((copy) => ({
        ...copy,
        bucket: copy.bucket ?? null,
      }))
    );
  }, [calendars]);

  const isLoading = profileLoading || calendarsLoading || tasksLoading || projectsLoading;

  if (profileLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <RefreshCw className="w-5 h-5 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <CalendarIcon className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Content Calendar</h1>
          <p className="text-sm text-gray-400">{profile?.companyName ?? "Client"} calendar view</p>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-4">
        {isLoading ? (
          <div className="h-96 animate-pulse rounded-lg bg-gray-50" />
        ) : calendars.length === 0 ? (
          <div className="flex items-center justify-center py-24 text-center">
            <div className="space-y-2">
              <p className="text-sm font-semibold text-gray-900">No calendar found</p>
              <p className="text-sm text-gray-400">This client does not have any content calendar yet.</p>
            </div>
          </div>
        ) : (
          <Calendar
            tasks={tasks}
            clients={profile ? [{ id: profile.id, companyName: profile.companyName }] : []}
            projects={projects}
            copies={copies}
          />
        )}
      </div>
    </div>
  );
}
