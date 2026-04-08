'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

// ─── Types ──────────────────────────────────────────────────────────────────

interface ApprovalDataPoint {
  name: string;
  value: number;
  color: string;
}

interface ApiResponse {
  data: ApprovalDataPoint[];
  total: number;
}

// ─── Skeleton ───────────────────────────────────────────────────────────────

function ApprovalChartSkeleton() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5 animate-pulse">
      {/* Title */}
      <div className="h-4 w-28 bg-gray-200 rounded mb-6" />
      {/* Circle placeholder */}
      <div className="flex items-center justify-center h-[220px]">
        <div className="w-[160px] h-[160px] rounded-full bg-gray-200" />
      </div>
      {/* Legend */}
      <div className="flex justify-center gap-4 mt-4">
        {[80, 64, 72].map((w, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-gray-200" />
            <div className={`h-3 bg-gray-200 rounded`} style={{ width: w }} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Fetch ──────────────────────────────────────────────────────────────────

async function fetchApprovals(): Promise<ApiResponse> {
  const res = await fetch('/api/dashboard/approvals');
  if (!res.ok) throw new Error('Failed to fetch approval data');
  return res.json();
}

// ─── Component ──────────────────────────────────────────────────────────────

export function ApprovalRateChart() {
  const { data: response, isLoading, isError } = useQuery<ApiResponse>({
    queryKey: ['dashboard', 'approvals'],
    queryFn: fetchApprovals,
  });

  const chartData = useMemo<ApprovalDataPoint[]>(() => {
    return response?.data ?? [];
  }, [response]);

  if (isLoading) return <ApprovalChartSkeleton />;

  if (isError) {
    return (
      <div className="bg-white rounded-lg border border-red-100 p-5 h-[376px] flex items-center justify-center text-sm text-red-400">
        Failed to load approval data
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5">
      <h3 className="text-sm font-semibold text-gray-900 mb-4">
        Approval Rate
      </h3>
      <ResponsiveContainer width="100%" height={240}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={2}
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '12px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
            }}
            formatter={(value, name) => [
              value !== undefined ? `${value}%` : '—',
              String(name),
            ]}
          />
        </PieChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="flex items-center justify-center gap-5 mt-2 flex-wrap">
        {chartData.map((item) => (
          <div key={item.name} className="flex items-center gap-1.5">
            <div
              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-xs text-gray-600">
              {item.name} ({item.value}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
