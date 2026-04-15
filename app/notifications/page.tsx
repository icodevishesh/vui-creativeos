"use client";

import { Bell, Sparkles } from "lucide-react";

export default function NotificationsPage() {
  return (
    <div className="max-w-2xl mx-auto py-24 flex flex-col items-center text-center gap-6">
      <div className="w-20 h-20 bg-indigo-50 rounded-3xl flex items-center justify-center">
        <Bell className="w-9 h-9 text-indigo-500" />
      </div>

      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Notifications</h1>
        <p className="text-gray-400 text-sm font-medium">
          Stay in the loop — real-time alerts for approvals, task updates, and team activity.
        </p>
      </div>

      <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-100 text-indigo-600 text-xs font-semibold px-4 py-2 rounded-full">
        <Sparkles className="w-3.5 h-3.5" />
        Feature coming soon
      </div>
    </div>
  );
}
