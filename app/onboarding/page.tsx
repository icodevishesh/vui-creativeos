import React from 'react';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { OnboardingFlow } from './_components/OnboardingFlow';

export default function OnboardingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-100 bg-white sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link
            href="/clients"
            className="flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-indigo-600 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
            Back to Clients
          </Link>
          <div className="text-sm font-bold text-gray-900">
            Client Onboarding
          </div>
          <div className="w-24 px-1" /> {/* Spacer */}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Onboard New Client</h1>
          <p className="text-gray-500 mt-2">Complete the steps below to setup your client profile.</p>
        </div>

        <OnboardingFlow />
      </main>
    </div>
  );
}
