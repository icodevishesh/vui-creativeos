'use client';

import * as React from 'react';
import { KPISection } from './_components/KPISection';
import { ProductivityChart } from './_components/ProductivityChart';
import { ApprovalRateChart } from './_components/ApprovalRateChart';
import { TurnaroundChart } from './_components/TurnaroundChart';

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Page heading */}
      <div>
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-1">
          Dashboard
        </h1>
        <p className="text-sm font-medium text-gray-500">
          Welcome back — here&apos;s what&rsquo;s happening across your agency today.
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
