'use client';

/**
 * app/notifications/preferences/page.tsx
 *
 * Notification Preference Matrix — production-quality toggle grid
 *
 * Features:
 *   - Rows = each NotificationType (grouped by domain)
 *   - Columns = IN_APP, EMAIL toggles
 *   - "Enable all / Disable all" per channel
 *   - Per-row toggle updates instantly (optimistic) then saves via PUT
 *   - "Save all" bulk upsert button
 *   - Unsaved-changes warning banner
 *   - Back navigation to Notification Inbox
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Bell,
  BellOff,
  ChevronRight,
  ClipboardList,
  FileText,
  Folders,
  GitBranch,
  ImageIcon,
  Mail,
  MessageSquare,
  Monitor,
  RefreshCw,
  Save,
  UserCheck,
} from 'lucide-react';
import toast from 'react-hot-toast';

// ─── Types ────────────────────────────────────────────────────────────────────

interface PreferenceRow {
  category: string;
  inApp:    boolean;
  email:    boolean;
}

// ─── Category metadata ────────────────────────────────────────────────────────

type CategoryGroup = {
  groupLabel: string;
  items: {
    category: string;
    label: string;
    description: string;
    icon: React.ElementType;
    color: string;
    bg: string;
  }[];
};

const PREFERENCE_GROUPS: CategoryGroup[] = [
  {
    groupLabel: 'Task Activity',
    items: [
      { category: 'TASK_ASSIGNED',        label: 'Task Assigned',       description: 'When a new task is assigned to you.',           icon: ClipboardList, color: 'text-violet-600', bg: 'bg-violet-50' },
      { category: 'TASK_COMPLETED',        label: 'Task Completed',      description: 'When a task you manage is marked complete.',     icon: ClipboardList, color: 'text-emerald-600', bg: 'bg-emerald-50' },
      { category: 'TASK_INTERNAL_REVIEW',  label: 'Internal Review',     description: 'When a task enters internal review stage.',      icon: ClipboardList, color: 'text-amber-600',   bg: 'bg-amber-50'  },
      { category: 'TASK_CLIENT_REVIEW',    label: 'Client Review',       description: 'When a task is submitted for client review.',    icon: UserCheck,     color: 'text-sky-600',     bg: 'bg-sky-50'    },
      { category: 'TASK_APPROVED',         label: 'Task Approved',       description: 'When a task is approved by the client.',         icon: ClipboardList, color: 'text-green-600',   bg: 'bg-green-50'  },
      { category: 'TASK_FEEDBACK',         label: 'Feedback Received',   description: 'When feedback is added to your task.',           icon: MessageSquare, color: 'text-orange-600',  bg: 'bg-orange-50' },
      { category: 'TASK_REJECT',           label: 'Task Rejected',       description: 'When a task is rejected and needs revision.',    icon: ClipboardList, color: 'text-red-600',     bg: 'bg-red-50'    },
    ],
  },
  {
    groupLabel: 'Client & Projects',
    items: [
      { category: 'CLIENT_ONBOARDED',         label: 'Client Onboarded',    description: 'When a new client is added to your workspace.',  icon: UserCheck, color: 'text-indigo-600',  bg: 'bg-indigo-50'  },
      { category: 'CLIENT_PROJECT',            label: 'New Project',         description: 'When a new project is created for a client.',    icon: Folders,   color: 'text-blue-600',    bg: 'bg-blue-50'    },
      { category: 'CLIENT_SCOPE_OF_WORK',      label: 'Scope of Work',       description: 'When the scope of work is updated.',             icon: FileText,  color: 'text-purple-600',  bg: 'bg-purple-50'  },
      { category: 'CLIENT_DOCUMENT_UPLOADED',  label: 'Document Uploaded',   description: 'When a document is uploaded for a client.',      icon: FileText,  color: 'text-teal-600',    bg: 'bg-teal-50'    },
      { category: 'CLIENT_MEETING_LOGS',       label: 'Meeting Logged',      description: 'When a meeting note is added.',                  icon: MessageSquare, color: 'text-cyan-600', bg: 'bg-cyan-50'  },
    ],
  },
  {
    groupLabel: 'Gantt Chart',
    items: [
      { category: 'CLIENT_GANTCHART_CREATION', label: 'Gantt Chart Created', description: 'When a Gantt chart is created for a project.', icon: GitBranch, color: 'text-rose-600',    bg: 'bg-rose-50'    },
      { category: 'CLIENT_GANTCHART_UPDATE',   label: 'Gantt Chart Updated', description: 'When a Gantt chart is updated.',               icon: GitBranch, color: 'text-pink-600',    bg: 'bg-pink-50'    },
    ],
  },
];

// ─── Toggle Switch ────────────────────────────────────────────────────────────

function Toggle({
  checked,
  onChange,
  id,
  disabled,
}: {
  checked:  boolean;
  onChange: (v: boolean) => void;
  id:       string;
  disabled?: boolean;
}) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      id={id}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`
        relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent
        transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2
        disabled:opacity-50 disabled:cursor-not-allowed
        ${checked ? 'bg-indigo-600' : 'bg-gray-200'}
      `}
    >
      <span
        className={`
          inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0
          transition-transform duration-200
          ${checked ? 'translate-x-5' : 'translate-x-0'}
        `}
      />
    </button>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function NotificationPreferencesPage() {
  const [prefs, setPrefs]       = useState<Record<string, PreferenceRow>>({});
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [dirty, setDirty]       = useState(false);
  const originalRef             = useRef<Record<string, PreferenceRow>>({});

  // ── Fetch preferences ─────────────────────────────────────────────────────
  const fetchPrefs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/notifications/preferences');
      if (!res.ok) throw new Error();
      const data = await res.json();
      const map: Record<string, PreferenceRow> = {};
      for (const row of data.preferences as PreferenceRow[]) {
        map[row.category] = { ...row };
      }
      setPrefs(map);
      originalRef.current = JSON.parse(JSON.stringify(map));
      setDirty(false);
    } catch {
      toast.error('Failed to load preferences');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPrefs(); }, [fetchPrefs]);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const updatePref = (category: string, field: 'inApp' | 'email', value: boolean) => {
    setPrefs((prev) => ({
      ...prev,
      [category]: { ...prev[category], category, inApp: prev[category]?.inApp ?? true, email: prev[category]?.email ?? true, [field]: value },
    }));
    setDirty(true);
  };

  const setAllChannel = (field: 'inApp' | 'email', value: boolean) => {
    setPrefs((prev) => {
      const next: Record<string, PreferenceRow> = {};
      for (const [cat, row] of Object.entries(prev)) {
        next[cat] = { ...row, [field]: value };
      }
      // Fill any missing rows
      for (const group of PREFERENCE_GROUPS) {
        for (const item of group.items) {
          if (!next[item.category]) {
            next[item.category] = { category: item.category, inApp: true, email: true, [field]: value };
          }
        }
      }
      return next;
    });
    setDirty(true);
  };

  // ── Save all ──────────────────────────────────────────────────────────────
  const saveAll = async () => {
    setSaving(true);
    try {
      const preferences = Object.values(prefs);
      const res = await fetch('/api/notifications/preferences/bulk', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preferences }),
      });
      if (!res.ok) throw new Error();
      originalRef.current = JSON.parse(JSON.stringify(prefs));
      setDirty(false);
      toast.success('Preferences saved!');
    } catch {
      toast.error('Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  const discard = () => {
    setPrefs(JSON.parse(JSON.stringify(originalRef.current)));
    setDirty(false);
  };

  const getPref = (category: string): PreferenceRow =>
    prefs[category] ?? { category, inApp: true, email: true };

  // ── Computed stats ────────────────────────────────────────────────────────
  const allCategories = PREFERENCE_GROUPS.flatMap((g) => g.items.map((i) => i.category));
  const inAppOnCount  = allCategories.filter((c) => getPref(c).inApp).length;
  const emailOnCount  = allCategories.filter((c) => getPref(c).email).length;
  const total         = allCategories.length;

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 space-y-6">

      {/* ── Page header ───────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <Link
          href="/notifications"
          className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-all"
          aria-label="Back to notifications"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Notification Preferences</h1>
          </div>
          <p className="text-sm text-gray-400 mt-0.5">
            Choose exactly which events notify you and through which channel.
          </p>
        </div>

        <button
          onClick={fetchPrefs}
          disabled={loading}
          className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-all disabled:opacity-50"
          title="Reload preferences"
          aria-label="Reload preferences"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* ── Breadcrumb ────────────────────────────────────────────────── */}
      <div className="flex items-center gap-1.5 text-[12px] text-gray-400">
        <Link href="/notifications" className="hover:text-indigo-600 transition-colors">Notifications</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-gray-700 font-semibold">Preferences</span>
      </div>

      {/* ── Unsaved changes banner ────────────────────────────────────── */}
      {dirty && (
        <div className="flex items-center justify-between gap-4 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3">
          <p className="text-sm font-semibold text-amber-800">You have unsaved changes.</p>
          <div className="flex gap-2">
            <button
              onClick={discard}
              className="px-3 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-100 rounded-lg transition-all"
            >
              Discard
            </button>
            <button
              onClick={saveAll}
              disabled={saving}
              className="px-4 py-1.5 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition-all disabled:opacity-70"
            >
              {saving ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </div>
      )}

      {/* ── Stats summary ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'In-App On',  count: inAppOnCount,  total, icon: Monitor, color: 'text-indigo-600', bg: 'bg-indigo-50' },
          { label: 'Email On',   count: emailOnCount,  total, icon: Mail,    color: 'text-blue-600',   bg: 'bg-blue-50'   },
        ].map((stat) => (
          <div key={stat.label} className="flex items-center gap-3 bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
            <div className={`w-10 h-10 ${stat.bg} rounded-xl flex items-center justify-center`}>
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </div>
            <div>
              <p className="text-lg font-bold text-gray-900">{stat.count}<span className="text-sm text-gray-400 font-normal"> / {stat.total}</span></p>
              <p className="text-[11px] font-semibold text-gray-500">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Column headers + bulk toggles ─────────────────────────────── */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
        {/* Sticky column header row */}
        <div className="flex items-center gap-3 px-5 py-3 bg-gray-50 border-b border-gray-100">
          <div className="flex-1 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
            Notification Type
          </div>
          {[
            { field: 'inApp' as const, label: 'In-App', icon: Monitor, count: inAppOnCount },
            { field: 'email' as const, label: 'Email',  icon: Mail,    count: emailOnCount },
          ].map(({ field, label, icon: Icon, count }) => (
            <div key={field} className="w-24 flex flex-col items-center gap-1">
              <div className="flex items-center gap-1.5">
                <Icon className="w-3.5 h-3.5 text-gray-500" />
                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">{label}</span>
              </div>
              {/* Enable all / Disable all mini-buttons */}
              <div className="flex gap-1">
                <button
                  onClick={() => setAllChannel(field, true)}
                  title={`Enable all ${label}`}
                  className="p-0.5 text-gray-400 hover:text-indigo-600 transition-colors"
                  aria-label={`Enable all ${label}`}
                >
                  <Bell className="w-3 h-3" />
                </button>
                <button
                  onClick={() => setAllChannel(field, false)}
                  title={`Disable all ${label}`}
                  className="p-0.5 text-gray-400 hover:text-red-500 transition-colors"
                  aria-label={`Disable all ${label}`}
                >
                  <BellOff className="w-3 h-3" />
                </button>
              </div>
              <span className="text-[10px] text-gray-400">{count}/{total} on</span>
            </div>
          ))}
        </div>

        {/* ── Grouped rows ─────────────────────────────────────────────── */}
        {loading ? (
          <div className="p-5 space-y-3">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div>
            {PREFERENCE_GROUPS.map((group, gi) => (
              <div key={group.groupLabel}>
                {/* Group label */}
                <div className="px-5 py-2 bg-gray-50/60 border-b border-gray-100">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    {group.groupLabel}
                  </p>
                </div>

                {group.items.map((item, ii) => {
                  const pref = getPref(item.category);
                  const Icon = item.icon;
                  const isLast =
                    ii === group.items.length - 1 && gi === PREFERENCE_GROUPS.length - 1;

                  return (
                    <div
                      key={item.category}
                      className={`flex items-center gap-3 px-5 py-4 hover:bg-gray-50/80 transition-colors ${
                        !isLast ? 'border-b border-gray-50' : ''
                      }`}
                    >
                      {/* Icon + labels */}
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className={`w-8 h-8 ${item.bg} rounded-lg flex items-center justify-center flex-shrink-0`}>
                          <Icon className={`w-4 h-4 ${item.color}`} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-800 truncate">{item.label}</p>
                          <p className="text-[11px] text-gray-400 truncate">{item.description}</p>
                        </div>
                      </div>

                      {/* In-App toggle */}
                      <div className="w-24 flex items-center justify-center">
                        <Toggle
                          id={`${item.category}-inApp`}
                          checked={pref.inApp}
                          onChange={(v) => updatePref(item.category, 'inApp', v)}
                        />
                      </div>

                      {/* Email toggle */}
                      <div className="w-24 flex items-center justify-center">
                        <Toggle
                          id={`${item.category}-email`}
                          checked={pref.email}
                          onChange={(v) => updatePref(item.category, 'email', v)}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Save button ───────────────────────────────────────────────── */}
      <div className="flex justify-end gap-3 pb-8">
        {dirty && (
          <button
            onClick={discard}
            className="px-5 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-xl border border-gray-200 transition-all"
          >
            Discard changes
          </button>
        )}
        <button
          onClick={saveAll}
          disabled={saving || loading || !dirty}
          className="flex items-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving…' : 'Save preferences'}
        </button>
      </div>
    </div>
  );
}
