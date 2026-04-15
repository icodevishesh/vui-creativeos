'use client';

import { useQuery } from '@tanstack/react-query';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

interface ApprovalDataPoint {
  name: string;
  value: number;   // percentage for chart slice
  count: number;   // raw task count
  color: string;
}

interface ApiResponse {
  data: ApprovalDataPoint[];
  approvalRate: number;
  approved: number;
  rejected: number;
  feedback: number;
  inReview: number;
  total: number;
}

// ─── Skeleton ────────────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse space-y-4">
      <div className="h-4 w-28 bg-gray-100 rounded" />
      <div className="flex items-center justify-center h-[200px]">
        <div className="w-[160px] h-[160px] rounded-full bg-gray-100" />
      </div>
      <div className="grid grid-cols-3 gap-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-14 bg-gray-100 rounded-xl" />
        ))}
      </div>
    </div>
  );
}

// ─── Empty state ─────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 flex flex-col items-center justify-center h-[340px] gap-3">
      <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center text-2xl">
        📊
      </div>
      <p className="text-sm font-semibold text-gray-400">No client reviews yet</p>
      <p className="text-xs text-gray-300 text-center max-w-[180px]">
        Approval rate appears once tasks reach client review
      </p>
    </div>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

export function ApprovalRateChart() {
  const { data: res, isLoading, isError } = useQuery<ApiResponse>({
    queryKey: ['dashboard', 'approvals'],
    queryFn: async () => {
      const r = await fetch('/api/dashboard/approvals');
      if (!r.ok) throw new Error('Failed');
      return r.json();
    },
  });

  if (isLoading) return <Skeleton />;

  if (isError) {
    return (
      <div className="bg-white rounded-2xl border border-red-100 p-5 h-[340px] flex items-center justify-center text-sm text-red-400 font-medium">
        Failed to load approval data
      </div>
    );
  }

  if (!res || res.total === 0) return <EmptyState />;

  const { data, approvalRate, approved, rejected, feedback, inReview, total } = res;

  // Fallback slice when all tasks are in one bucket (pie needs ≥2 slices)
  const chartData =
    data.length === 1
      ? [...data, { name: '', value: 0.001, count: 0, color: '#f3f4f6' }]
      : data;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-sm font-semibold text-gray-900">Approval Rate</h3>
        {inReview > 0 && (
          <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full uppercase tracking-wider">
            {inReview} in review
          </span>
        )}
      </div>
      <p className="text-[11px] text-gray-400 mb-4">Based on {total} decided client review{total !== 1 ? 's' : ''}</p>

      {/* Donut with rate in centre */}
      <div className="relative">
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={62}
              outerRadius={88}
              paddingAngle={chartData.length > 1 ? 3 : 0}
              dataKey="value"
              startAngle={90}
              endAngle={-270}
              strokeWidth={0}
            >
              {chartData.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '10px',
                fontSize: '12px',
                fontWeight: 600,
              }}
              formatter={(value, name) => {
                const n = String(name);
                const v = Number(value);
                const item = res.data.find((d) => d.name === n);
                return [`${item?.count ?? 0} task${(item?.count ?? 0) !== 1 ? 's' : ''} (${v}%)`, n] as [string, string];
              }}
            />
          </PieChart>
        </ResponsiveContainer>

        {/* Centre label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-3xl font-bold text-gray-900 leading-none">
            {approvalRate}%
          </span>
          <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mt-1">
            approved
          </span>
        </div>
      </div>

      {/* Stat breakdown */}
      <div className="grid grid-cols-3 gap-2 mt-4">
        <div className="bg-emerald-50 rounded-xl p-3 text-center">
          <p className="text-xl font-bold text-emerald-600">{approved}</p>
          <p className="text-[10px] font-semibold text-emerald-500 uppercase tracking-wider mt-0.5">Approved</p>
        </div>
        <div className="bg-red-50 rounded-xl p-3 text-center">
          <p className="text-xl font-bold text-red-500">{rejected + feedback}</p>
          <p className="text-[10px] font-semibold text-red-400 uppercase tracking-wider mt-0.5">Rejected</p>
        </div>
        <div className="bg-amber-50 rounded-xl p-3 text-center">
          <p className="text-xl font-bold text-amber-500">{inReview}</p>
          <p className="text-[10px] font-semibold text-amber-400 uppercase tracking-wider mt-0.5">In Review</p>
        </div>
      </div>

      {/* Feedback sub-note */}
      {feedback > 0 && (
        <p className="text-[10px] text-gray-400 text-center mt-3">
          Includes {feedback} task{feedback !== 1 ? 's' : ''} returned via feedback
        </p>
      )}
    </div>
  );
}
