'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search } from 'lucide-react';

const COUNTRIES = [
  { code: 'IN', name: 'India', dial: '+91', flag: '🇮🇳' },
  { code: 'US', name: 'United States', dial: '+1', flag: '🇺🇸' },
  { code: 'GB', name: 'United Kingdom', dial: '+44', flag: '🇬🇧' },
  { code: 'AE', name: 'UAE', dial: '+971', flag: '🇦🇪' },
  { code: 'SG', name: 'Singapore', dial: '+65', flag: '🇸🇬' },
  { code: 'AU', name: 'Australia', dial: '+61', flag: '🇦🇺' },
  { code: 'CA', name: 'Canada', dial: '+1', flag: '🇨🇦' },
  { code: 'DE', name: 'Germany', dial: '+49', flag: '🇩🇪' },
  { code: 'FR', name: 'France', dial: '+33', flag: '🇫🇷' },
  { code: 'JP', name: 'Japan', dial: '+81', flag: '🇯🇵' },
  { code: 'CN', name: 'China', dial: '+86', flag: '🇨🇳' },
  { code: 'BR', name: 'Brazil', dial: '+55', flag: '🇧🇷' },
  { code: 'MX', name: 'Mexico', dial: '+52', flag: '🇲🇽' },
  { code: 'ZA', name: 'South Africa', dial: '+27', flag: '🇿🇦' },
  { code: 'NG', name: 'Nigeria', dial: '+234', flag: '🇳🇬' },
  { code: 'PK', name: 'Pakistan', dial: '+92', flag: '🇵🇰' },
  { code: 'BD', name: 'Bangladesh', dial: '+880', flag: '🇧🇩' },
  { code: 'NL', name: 'Netherlands', dial: '+31', flag: '🇳🇱' },
  { code: 'IT', name: 'Italy', dial: '+39', flag: '🇮🇹' },
  { code: 'ES', name: 'Spain', dial: '+34', flag: '🇪🇸' },
  { code: 'SA', name: 'Saudi Arabia', dial: '+966', flag: '🇸🇦' },
  { code: 'KW', name: 'Kuwait', dial: '+965', flag: '🇰🇼' },
  { code: 'QA', name: 'Qatar', dial: '+974', flag: '🇶🇦' },
  { code: 'MY', name: 'Malaysia', dial: '+60', flag: '🇲🇾' },
  { code: 'PH', name: 'Philippines', dial: '+63', flag: '🇵🇭' },
  { code: 'NZ', name: 'New Zealand', dial: '+64', flag: '🇳🇿' },
  { code: 'RU', name: 'Russia', dial: '+7', flag: '🇷🇺' },
  { code: 'TR', name: 'Turkey', dial: '+90', flag: '🇹🇷' },
  { code: 'KR', name: 'South Korea', dial: '+82', flag: '🇰🇷' },
  { code: 'ID', name: 'Indonesia', dial: '+62', flag: '🇮🇩' },
];

interface PhoneInputProps {
  value: string;                          // full value e.g. "+91 9876543210"
  onChange: (value: string) => void;
  error?: string;
  onBlur?: () => void;
  placeholder?: string;
  className?: string;
}

export default function PhoneInput({
  value,
  onChange,
  error,
  onBlur,
  placeholder,
  className = '',
}: PhoneInputProps) {
  const [selected, setSelected] = useState(COUNTRIES[0]); // India default
  const [number, setNumber] = useState('');
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // Sync internal state → parent
  useEffect(() => {
    onChange(number ? `${selected.dial} ${number}` : '');
  }, [selected, number]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Focus search when dropdown opens
  useEffect(() => {
    if (open) setTimeout(() => searchRef.current?.focus(), 50);
  }, [open]);

  const filtered = COUNTRIES.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.dial.includes(search) ||
      c.code.toLowerCase().includes(search.toLowerCase())
  );

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, ''); // digits only
    setNumber(raw);
  };

  const handleSelect = (country: typeof COUNTRIES[0]) => {
    setSelected(country);
    setOpen(false);
    setSearch('');
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <div
        className={`flex items-center bg-gray-50 border rounded-lg overflow-hidden transition-all focus-within:ring-2 focus-within:border-indigo-500 ${
          error
            ? 'border-red-400 focus-within:ring-red-400/20'
            : 'border-gray-100 focus-within:ring-indigo-500/10'
        }`}
      >
        {/* Country selector trigger */}
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="flex items-center gap-1.5 px-3 py-2.5 border-r border-gray-200 hover:bg-gray-100 transition-colors shrink-0"
        >
          <span className="text-base leading-none">{selected.flag}</span>
          <span className="text-xs font-medium text-gray-600">{selected.dial}</span>
          <ChevronDown
            className={`w-3 h-3 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}
          />
        </button>

        {/* Number input */}
        <input
          type="tel"
          inputMode="numeric"
          value={number}
          onChange={handleNumberChange}
          onBlur={onBlur}
          placeholder={placeholder ?? '98765 43210'}
          className="flex-1 px-3 py-2.5 bg-transparent text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none"
        />
      </div>

      {/* Error */}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 mt-1 w-72 bg-white border border-gray-100 rounded-xl shadow-xl overflow-hidden">
          {/* Search */}
          <div className="p-2 border-b border-gray-100">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                ref={searchRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search country..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
              />
            </div>
          </div>

          {/* List */}
          <ul className="max-h-52 overflow-y-auto">
            {filtered.length === 0 ? (
              <li className="px-4 py-3 text-xs text-gray-400 text-center">No results</li>
            ) : (
              filtered.map((country) => (
                <li key={country.code}>
                  <button
                    type="button"
                    onClick={() => handleSelect(country)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-indigo-50 transition-colors ${
                      selected.code === country.code ? 'bg-indigo-50/80 font-medium' : ''
                    }`}
                  >
                    <span className="text-base leading-none w-6">{country.flag}</span>
                    <span className="flex-1 text-left text-gray-700 text-xs">{country.name}</span>
                    <span className="text-xs text-gray-400 font-mono">{country.dial}</span>
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}