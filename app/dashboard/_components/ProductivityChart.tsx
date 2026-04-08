'use client';
// eslint-disable-next-line @typescript-eslint/no-unused-vars

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

// ─── Types ──────────────────────────────────────────────────────────────────

interface ProductivityDataPoint {
  name: string;
  tasks: number;
}

interface ApiResponse {
  data: ProductivityDataPoint[];
}

// ─── Skeleton ───────────────────────────────────────────────────────────────

function ProductivityChartSkeleton() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5 animate-pulse">
      {/* Title */}
      <div className="h-4 w-48 bg-gray-200 rounded mb-6" />
      {/* Chart area */}
      <div className="h-[280px] bg-gray-100 rounded-lg flex items-end gap-3 px-4 pb-4">
        {[60, 45, 80, 35, 70, 55, 90, 40].map((h, i) => (
          <div
            key={i}
            className="flex-1 bg-gray-200 rounded-t-sm"
            style={{ height: `${h}%` }}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Fetch ──────────────────────────────────────────────────────────────────

async function fetchProductivity(): Promise<ApiResponse> {
  const res = await fetch('/api/dashboard/productivity');
  if (!res.ok) throw new Error('Failed to fetch productivity data');
  return res.json();
}

// ─── Component ──────────────────────────────────────────────────────────────

export function ProductivityChart() {
  const { data: response, isLoading, isError } = useQuery<ApiResponse>({
    queryKey: ['dashboard', 'productivity'],
    queryFn: fetchProductivity,
  });

  /**
   * Memoize the chart dataset so recharts doesn't receive a new
   * array reference on every render (prevents unnecessary re-draws).
   */
  const chartData = useMemo<ProductivityDataPoint[]>(() => {
    return response?.data ?? [];
  }, [response]);

  if (isLoading) return <ProductivityChartSkeleton />;

  if (isError) {
    return (
      <div className="bg-white rounded-lg border border-red-100 p-5 h-[376px] flex items-center justify-center text-sm text-red-400">
        Failed to load productivity data
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5">
      <h3 className="text-sm font-semibold text-gray-900 mb-4">
        Productivity per Team Member
      </h3>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={chartData} barCategoryGap="30%">
          <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
          <XAxis
            dataKey="name"
            tick={{ fill: '#6b7280', fontSize: 12 }}
            axisLine={{ stroke: '#e5e7eb' }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: '#6b7280', fontSize: 12 }}
            axisLine={{ stroke: '#e5e7eb' }}
            tickLine={false}
            allowDecimals={false}
          />
          <Tooltip
            cursor={{ fill: '#f9fafb' }}
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '12px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
            }}
            formatter={(value) => [
              value !== undefined ? `${value} tasks` : '—',
              'Completed',
            ]}
          />
          <Bar dataKey="tasks" fill="#4f46e5" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
