import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, Globe, Film, FolderOpen, Tag } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, getDay } from 'date-fns';
import { TaskCard } from './TaskCard';
import { TaskStatus } from '@prisma/client';

interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  startDate: Date | null;
  endDate: Date | null;
  clientId: string;
  projectId: string;
  assignedTo?: {
    id: string;
    name: string;
  } | null;
  project: {
    name: string;
  };
  client: {
    companyName: string;
  };
}

interface CalendarCopy {
  id: string;
  content: string;
  caption?: string;
  hashtags?: string;
  publishDate?: string | Date;
  publishTime?: string;
  platform?: string;
  mediaType?: string;
  status: string; // DRAFT | UNDER_REVIEW | APPROVED
  calendarName?: string;
  bucket?: { id: string; name: string } | null;
}

interface Client {
  id: string;
  companyName: string;
}

interface Project {
  id: string;
  name: string;
  clientId: string;
}

interface CalendarProps {
  tasks: Task[];
  clients: Client[];
  projects: Project[];
  copies?: CalendarCopy[];
}

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const COPY_STATUS_STYLES: Record<string, string> = {
  DRAFT: 'bg-slate-100 text-slate-600 border-slate-200',
  UNDER_REVIEW: 'bg-amber-50 text-amber-700 border-amber-200',
  APPROVED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

const COPY_STATUS_DOT: Record<string, string> = {
  DRAFT: 'bg-slate-400',
  UNDER_REVIEW: 'bg-amber-400',
  APPROVED: 'bg-emerald-500',
};

export const Calendar: React.FC<CalendarProps> = ({
  tasks,
  clients,
  projects,
  copies = [],
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const calendarDays = useMemo(() => {
    const startDayOfWeek = getDay(monthStart);
    const paddingDays = Array(startDayOfWeek).fill(null);
    return [...paddingDays, ...monthDays];
  }, [monthStart, monthDays]);

  const filteredProjects = useMemo(() => {
    if (!selectedClientId) return projects;
    return projects.filter(project => project.clientId === selectedClientId);
  }, [projects, selectedClientId]);

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      if (selectedClientId && task.clientId !== selectedClientId) return false;
      if (selectedProjectId && task.projectId !== selectedProjectId) return false;
      return true;
    });
  }, [tasks, selectedClientId, selectedProjectId]);

  const getTasksForDay = (day: Date) => {
    return filteredTasks.filter(task =>
      task.startDate && isSameDay(new Date(task.startDate), day)
    );
  };

  const getCopiesForDay = (day: Date) => {
    return copies.filter(copy => {
      if (!copy.publishDate) return false;
      return isSameDay(new Date(copy.publishDate), day);
    });
  };

  const handlePreviousMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1));
  };

  const handleClientChange = (clientId: string) => {
    setSelectedClientId(clientId);
    setSelectedProjectId('');
  };

  return (
    <div className="w-full bg-white rounded-lg border border-gray-200 shadow-sm p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            {format(currentDate, 'MMMM yyyy')}
          </h2>

          {/* Month Navigation */}
          <div className="flex items-center gap-2">
            <button
              onClick={handlePreviousMonth}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg border border-gray-200"
              aria-label="Previous month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleNextMonth}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg border border-gray-200"
              aria-label="Next month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Legend */}
        {copies.length > 0 && (
          <div className="flex items-center gap-4 text-xs font-medium text-gray-500">
            <span className="font-semibold text-gray-600">Copies:</span>
            {(['DRAFT', 'UNDER_REVIEW', 'APPROVED'] as const).map(s => (
              <span key={s} className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${COPY_STATUS_DOT[s]}`} />
                {s === 'UNDER_REVIEW' ? 'Under Review' : s.charAt(0) + s.slice(1).toLowerCase()}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Calendar Grid */}
      <div className="border border-gray-200 rounded-lg overflow-hidden w-full">
        {/* Days of Week Header */}
        <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-200 w-full">
          {DAYS_OF_WEEK.map(day => (
            <div
              key={day}
              className="p-3 text-center border-r border-gray-200 last:border-r-0"
            >
              <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                {day}
              </span>
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7">
          {calendarDays.map((day, index) => {
            if (!day) {
              return (
                <div
                  key={`empty-${index}`}
                  className="min-h-[100px] p-2 border-r border-b border-gray-100 last:border-r-0 bg-gray-50/50"
                />
              );
            }

            const dayTasks = getTasksForDay(day);
            const dayCopies = getCopiesForDay(day);
            const isCurrentMonth = isSameMonth(day, currentDate);
            const isToday = isSameDay(day, new Date());

            return (
              <div
                key={day.toISOString()}
                className={`min-h-[100px] p-2 border-r border-b border-gray-100 last:border-r-0 ${!isCurrentMonth ? 'bg-gray-50/50' : 'bg-white'
                  } ${isToday ? 'ring-2 ring-blue-500 ring-inset' : ''}`}
              >
                {/* Day Number */}
                <div className="mb-2">
                  <span
                    className={`text-sm font-medium ${isToday
                      ? 'w-6 h-6 flex items-center justify-center bg-blue-600 text-white rounded-full text-xs'
                      : !isCurrentMonth
                        ? 'text-gray-400'
                        : 'text-gray-900'
                      }`}
                  >
                    {format(day, 'd')}
                  </span>
                </div>

                {/* Tasks */}
                <div className="space-y-1">
                  {dayTasks.map(task => (
                    <TaskCard key={task.id} task={task} />
                  ))}
                </div>

                {/* Calendar Copies */}
                {dayCopies.length > 0 && (
                  <div className="mt-1 space-y-1">
                    {dayCopies.map(copy => {
                      const statusStyle = COPY_STATUS_STYLES[copy.status] ?? COPY_STATUS_STYLES.DRAFT;
                      const dot = COPY_STATUS_DOT[copy.status] ?? COPY_STATUS_DOT.DRAFT;
                      const statusLabel = copy.status === 'UNDER_REVIEW' ? 'Under Review' : (copy.status?.charAt(0) + copy.status?.slice(1).toLowerCase());
                      return (
                        <div key={copy.id} className="relative group">
                          <div
                            className={`flex items-start gap-1.5 px-2 py-1.5 rounded border text-[10px] font-medium leading-tight cursor-default ${statusStyle}`}
                          >
                            <span className={`mt-0.5 w-1.5 h-1.5 rounded-full shrink-0 ${dot}`} />
                            <div className="min-w-0">
                              <p className="truncate font-semibold">
                                {copy.platform ?? 'Post'}{copy.mediaType ? ` · ${copy.mediaType}` : ''}
                              </p>
                              <p className="truncate text-[9px] opacity-70 mt-0.5">
                                {copy.content.substring(0, 40)}{copy.content.length > 40 ? '…' : ''}
                              </p>
                              {copy.bucket && (
                                <p className="truncate text-[9px] opacity-60">{copy.bucket.name}</p>
                              )}
                            </div>
                          </div>

                          {/* Hover Tooltip */}
                          <div className="pointer-events-none absolute z-50 bottom-full left-0 mb-2 w-64 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                            <div className="bg-gray-900 text-white rounded-lg shadow-xl p-3 text-xs space-y-2">
                              <p className="font-semibold text-sm leading-snug line-clamp-3">{copy.content}</p>
                              <div className="border-t border-white/10 pt-2 space-y-1.5">
                                <div className="flex items-center gap-2">
                                  <Tag className="w-3 h-3 shrink-0 text-gray-400" />
                                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${statusStyle}`}>{statusLabel}</span>
                                </div>
                                <div className="flex items-center gap-2 text-gray-300">
                                  <CalendarIcon className="w-3 h-3 shrink-0 text-gray-400" />
                                  <span>{copy.publishDate ? format(new Date(copy.publishDate), 'MMM d, yyyy') : 'No date'}</span>
                                </div>
                                {copy.publishTime && (
                                  <div className="flex items-center gap-2 text-gray-300">
                                    <Clock className="w-3 h-3 shrink-0 text-gray-400" />
                                    <span>{copy.publishTime}</span>
                                  </div>
                                )}
                                {copy.platform && (
                                  <div className="flex items-center gap-2 text-gray-300">
                                    <Globe className="w-3 h-3 shrink-0 text-gray-400" />
                                    <span>{copy.platform}</span>
                                  </div>
                                )}
                                {copy.mediaType && (
                                  <div className="flex items-center gap-2 text-gray-300">
                                    <Film className="w-3 h-3 shrink-0 text-gray-400" />
                                    <span>{copy.mediaType}</span>
                                  </div>
                                )}
                                {copy.bucket && (
                                  <div className="flex items-center gap-2 text-gray-300">
                                    <FolderOpen className="w-3 h-3 shrink-0 text-gray-400" />
                                    <span className="truncate">{copy.bucket.name}</span>
                                  </div>
                                )}
                                {copy.calendarName && (
                                  <div className="flex items-start gap-2 text-gray-400 text-[10px]">
                                    <span className="shrink-0">Calendar:</span>
                                    <span className="truncate">{copy.calendarName}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                            {/* Arrow */}
                            <div className="w-2.5 h-2.5 bg-gray-900 rotate-45 ml-3 -mt-1.5" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
