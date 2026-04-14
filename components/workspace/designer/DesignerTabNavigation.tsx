"use client";

import React from 'react';

interface DesignerTabNavigationProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const TABS = [
  { id: 'tasks', label: 'My Tasks' },
  { id: 'upload', label: 'Upload & Submit' },
  { id: 'version', label: 'Version History' },
];

export const DesignerTabNavigation: React.FC<DesignerTabNavigationProps> = ({ activeTab, setActiveTab }) => {
  return (
    <div className="flex items-center gap-1 bg-gray-100/50 p-1 rounded-lg w-fit mb-8 text-sm font-semibold">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={`px-3 py-1 rounded-lg transition-all ${
            activeTab === tab.id
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-500 hover:text-gray-700 hover:bg-white/50'
          }`}
          aria-current={activeTab === tab.id ? 'page' : undefined}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
};
