"use client";

import React from 'react';

interface TabNavigationProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const TABS = [
  { id: 'tasks', label: 'My Tasks' },
  { id: 'write', label: 'Write & Submit' },
  { id: 'calendar', label: 'Content Calendar' },
];

export const TabNavigation: React.FC<TabNavigationProps> = ({ activeTab, setActiveTab }) => {
  return (
    <div className="flex items-center gap-1 bg-gray-100/50 p-1 rounded-xl w-fit mb-8">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
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
