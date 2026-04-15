import React from 'react';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { OnboardingFlow } from './_components/OnboardingFlow';

export default function OnboardingPage() {
  return (
    <div className="">
      {/* Header */}
      <header className="">
        <div className="h-12 flex items-center justify-between">
          <Link
            href="/clients"
            className="flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-indigo-600 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
            Back to Clients
          </Link>
          <div className="w-24 px-1" /> {/* Spacer */}
        </div>
      </header>

      <main className="">
        <div className="max-w-2xl mx-auto text-start mb-6 mt-2">
          <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Client Onboarding</h1>
          <p className="text-gray-500 mt-2">Complete the steps below to setup your client profile.</p>
        </div>

        <OnboardingFlow />
      </main>
    </div>
  );
}
