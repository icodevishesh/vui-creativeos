import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
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
}

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const Calendar: React.FC<CalendarProps> = ({
  tasks,
  clients,
  projects
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Calculate days to display (including padding for start of week)
  const calendarDays = useMemo(() => {
    const startDayOfWeek = getDay(monthStart);
    const paddingDays = Array(startDayOfWeek).fill(null);
    return [...paddingDays, ...monthDays];
  }, [monthStart, monthDays]);

  // Filter projects based on selected client
  const filteredProjects = useMemo(() => {
    if (!selectedClientId) return projects;
    return projects.filter(project => project.clientId === selectedClientId);
  }, [projects, selectedClientId]);

  // Filter tasks based on selected client and project
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      if (selectedClientId && task.clientId !== selectedClientId) return false;
      if (selectedProjectId && task.projectId !== selectedProjectId) return false;
      return true;
    });
  }, [tasks, selectedClientId, selectedProjectId]);

  // Get tasks for a specific day
  const getTasksForDay = (day: Date) => {
    return filteredTasks.filter(task => 
      task.startDate && isSameDay(new Date(task.startDate), day)
    );
  };

  const handlePreviousMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1));
  };

  const handleClientChange = (clientId: string) => {
    setSelectedClientId(clientId);
    setSelectedProjectId(''); // Reset project when client changes
  };

  const handleProjectChange = (projectId: string) => {
    setSelectedProjectId(projectId);
  };

  return (
    <div className="w-full bg-white rounded-lg border border-gray-200 shadow-sm p-6">
      {/* Header with Controls */}
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

        {/* Filter Controls */}
        {/* <div className="flex flex-wrap gap-2">

          {/* Project Dropdown */}
          {/* <div className="relative">
            <select
              value={selectedProjectId}
              onChange={(e) => handleProjectChange(e.target.value)}
              disabled={!selectedClientId}
              className="appearance-none bg-white border border-gray-300 rounded-lg px-3 py-2 pr-8 text-sm text-gray-900 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value="">Select Project</option>
              {filteredProjects.map(project => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div> */}

          {/* Task Count 
          <div className="text-sm text-gray-600">
            {filteredTasks.length} tasks
          </div>
        </div> */}
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
            const isCurrentMonth = isSameMonth(day, currentDate);
            const isToday = isSameDay(day, new Date());

            return (
              <div
                key={day.toISOString()}
                className={`min-h-[100px] p-2 border-r border-b border-gray-100 last:border-r-0 ${
                  !isCurrentMonth ? 'bg-gray-50/50' : 'bg-white'
                } ${isToday ? 'ring-2 ring-blue-500 ring-inset' : ''}`}
              >
                {/* Day Number */}
                <div className="mb-2">
                  <span
                    className={`text-sm font-medium ${
                      isToday
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
                    <TaskCard
                      key={task.id}
                      task={task}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
