"use client";

import React, { useMemo, useState } from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  isSameDay
} from 'date-fns';
import { Calendar as CalendarIcon, Plus } from 'lucide-react';

interface ContentCalendarProps {
  isLoading: boolean;
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const ContentCalendar: React.FC<ContentCalendarProps> = ({ isLoading }) => {
  const [entryTitle, setEntryTitle] = useState('');
  const today = new Date();

  const calendarData = useMemo(() => {
    const start = startOfMonth(today);
    const end = endOfMonth(today);
    const days = eachDayOfInterval({ start, end });

    // Adjust for Monday start (0=Sun, 1=Mon, ..., 6=Sat)
    // getDay returns 0-6. We want 0-6 for Mon-Sun.
    // Mon: 1 -> 0, Tue: 2 -> 1, ..., Sat: 6 -> 5, Sun: 0 -> 6
    const firstDayIndex = (getDay(start) + 6) % 7;
    const padding = Array(firstDayIndex).fill(null);

    return [...padding, ...days];
  }, [today]);

  if (isLoading) {
    return (
      <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm animate-pulse">
        <div className="h-8 bg-gray-100 w-48 rounded mb-2"></div>
        <div className="h-4 bg-gray-100 w-32 rounded mb-6"></div>
        <div className="flex gap-2 mb-8">
          <div className="flex-1 h-10 bg-gray-100 rounded-xl"></div>
          <div className="w-32 h-10 bg-gray-100 rounded-xl"></div>
        </div>
        <div className="grid grid-cols-7 border border-gray-100 rounded-xl overflow-hidden aspect-[4/3]">
          {Array.from({ length: 35 }).map((_, i) => (
            <div key={i} className="border-r border-b border-gray-50 bg-white"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-gray-900 leading-tight">
          {format(today, 'MMMM yyyy')}
        </h3>
        <p className="text-sm text-gray-500">Your scheduled content for this month</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-2 mb-8">
        <input
          type="text"
          value={entryTitle}
          onChange={(e) => setEntryTitle(e.target.value)}
          placeholder="New content entry title..."
          className="flex-1 px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-2 focus:ring-blue-100 focus:bg-white transition-all text-sm"
        />
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors shadow-sm shadow-blue-100">
          <CalendarIcon size={16} />
          Add to Calendar
        </button>
      </div>

      <div className="border border-gray-100 rounded-xl overflow-hidden shadow-sm">
        <div className="grid grid-cols-7 bg-gray-50/80 border-b border-gray-100">
          {DAYS.map((day) => (
            <div key={day} className="py-2 text-center text-[10px] font-bold text-gray-500 uppercase tracking-widest">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 aspect-[4/3] sm:aspect-[16/9]">
          {calendarData.map((day, i) => {
            const isToday = day && isSameDay(day, new Date());
            return (
              <div
                key={i}
                className={`border-r border-b border-gray-50 p-2 min-h-0 relative ${!day ? 'bg-gray-50/50' : 'bg-white hover:bg-blue-50/30'
                  } transition-colors`}
              >
                {day && (
                  <span className={`text-xs font-semibold ${isToday ? 'bg-blue-600 text-white w-5 h-5 flex items-center justify-center rounded-full' : 'text-gray-400'}`}>
                    {format(day, 'd')}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
