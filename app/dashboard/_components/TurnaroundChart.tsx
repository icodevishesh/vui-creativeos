'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';

// ─── Types ──────────────────────────────────────────────────────────────────

interface TurnaroundDataPoint {
  week: string;
  days: number;
}

interface ApiResponse {
  data: TurnaroundDataPoint[];
}

// ─── Skeleton ───────────────────────────────────────────────────────────────

function TurnaroundChartSkeleton() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5 animate-pulse">
      {/* Title */}
      <div className="h-4 w-56 bg-gray-200 rounded mb-6" />
      {/* Chart area */}
      <div className="h-[200px] bg-gray-100 rounded-lg relative overflow-hidden">
        {/* Faux line using a diagonal gradient stripe */}
        <div className="absolute inset-0 flex items-end">
          <svg width="100%" height="100%" className="opacity-30">
            <polyline
              points="0,140 80,100 160,130 240,80 320,60 400,45"
              fill="none"
              stroke="#d1d5db"
              strokeWidth="3"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}

// ─── Fetch ──────────────────────────────────────────────────────────────────

async function fetchTurnaround(): Promise<ApiResponse> {
  const res = await fetch('/api/dashboard/turnaround');
  if (!res.ok) throw new Error('Failed to fetch turnaround data');
  return res.json();
}

// ─── Component ──────────────────────────────────────────────────────────────

export function TurnaroundChart() {
  const { data: response, isLoading, isError } = useQuery<ApiResponse>({
    queryKey: ['dashboard', 'turnaround'],
    queryFn: fetchTurnaround,
  });

  const chartData = useMemo<TurnaroundDataPoint[]>(() => {
    return response?.data ?? [];
  }, [response]);

  /** Compute a simple average to show as a reference line */
  const avgDays = useMemo(() => {
    if (!chartData.length) return 0;
    const nonZero = chartData.filter((d) => d.days > 0);
    if (!nonZero.length) return 0;
    return parseFloat(
      (nonZero.reduce((s, d) => s + d.days, 0) / nonZero.length).toFixed(1)
    );
  }, [chartData]);

  if (isLoading) return <TurnaroundChartSkeleton />;

  if (isError) {
    return (
      <div className="bg-white rounded-lg border border-red-100 p-5 h-[290px] flex items-center justify-center text-sm text-red-400">
        Failed to load turnaround data
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-900">
          Average Turnaround Time (days)
        </h3>
        {avgDays > 0 && (
          <span className="text-xs text-gray-400">
            6-week avg:{' '}
            <span className="font-semibold text-gray-600">{avgDays}d</span>
          </span>
        )}
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
          <XAxis
            dataKey="week"
            tick={{ fill: '#6b7280', fontSize: 12 }}
            axisLine={{ stroke: '#e5e7eb' }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: '#6b7280', fontSize: 12 }}
            axisLine={{ stroke: '#e5e7eb' }}
            tickLine={false}
            domain={[0, 'auto']}
            tickFormatter={(v) => `${v}d`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '12px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
            }}
            formatter={(value: number) => [`${value} days`, 'Avg turnaround']}
          />
          {avgDays > 0 && (
            <ReferenceLine
              y={avgDays}
              stroke="#e5e7eb"
              strokeDasharray="4 4"
              label={{ value: `avg ${avgDays}d`, fill: '#9ca3af', fontSize: 10, position: 'right' }}
            />
          )}
          <Line
            type="monotone"
            dataKey="days"
            stroke="#10b981"
            strokeWidth={2}
            dot={{ fill: '#10b981', r: 4, strokeWidth: 0 }}
            activeDot={{ r: 6, fill: '#10b981', stroke: '#fff', strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
