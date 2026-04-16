'use client';

import { useAuth } from '@/context/AuthContext';
import { KPISection } from './_components/KPISection';
import { ProductivityChart } from './_components/ProductivityChart';
import { ApprovalRateChart } from './_components/ApprovalRateChart';
import { TurnaroundChart } from './_components/TurnaroundChart';

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      {/* Page heading */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 mb-1">
          Dashboard
        </h1>
        <p className="text-sm text-gray-400">
          Welcome back {user?.name + ' ' || ''}! Here&apos;s what&apos;s happening across your agency today.
        </p>
      </div>

      {/* KPI row */}
      <KPISection />

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ProductivityChart />
        </div>
        <div>
          <ApprovalRateChart />
        </div>
      </div>

      {/* Charts row 2 */}
      <TurnaroundChart />
    </div>
  );
}
