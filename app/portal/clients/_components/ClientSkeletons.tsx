import React from 'react';

export function ClientCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gray-100 rounded-lg" />
          <div className="space-y-2">
            <div className="h-5 w-32 bg-gray-100 rounded" />
            <div className="h-4 w-48 bg-gray-50 rounded" />
          </div>
        </div>
        <div className="flex gap-2">
          <div className="h-6 w-16 bg-gray-50 rounded-full" />
          <div className="h-6 w-16 bg-gray-50 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export function ClientListSkeleton() {
  return (
    <div className="space-y-4">
      <ClientCardSkeleton />
      <ClientCardSkeleton />
      <ClientCardSkeleton />
      <ClientCardSkeleton />
    </div>
  );
}
