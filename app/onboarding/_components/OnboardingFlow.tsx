'use client';

import * as React from 'react';
import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2,
  User,
  Mail,
  Phone,
  ChevronRight,
  ChevronLeft,
  Check,
  Briefcase,
  Layers,
  Sparkles
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';

// ─── Step Config ────────────────────────────────────────────────────────────

const STEPS = [
  { id: 1, name: 'Basic Info', icon: Building2 },
  { id: 2, name: 'Engagement', icon: Briefcase },
  { id: 3, name: 'Services', icon: Layers },
];

const SERVICE_OPTIONS = [
  { id: 'SOCIAL_MEDIA', name: 'Social Media', desc: 'Platform management & content' },
  { id: 'PAID_MEDIA', name: 'Paid Media', desc: 'Meta, Google, LinkedIn Ads' },
  { id: 'INFLUENCER_MARKETING', name: 'Influencer Marketing', desc: 'Creator partnerships' },
  { id: 'EMAIL_MARKETING', name: 'Email Marketing', desc: 'Newsletters & automations' },
];

// ─── Component ──────────────────────────────────────────────────────────────

export function OnboardingFlow() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    companyName: '',
    contactPerson: '',
    email: '',
    phone: '',
    industry: '',
    engagementType: 'RETAINER',
    services: [] as string[],
  });

  const mutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.text();
        throw new Error(error || 'Failed to create client');
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success('Client onboarded successfully!');
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      router.push('/clients');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const updateField = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleService = (id: string) => {
    setFormData((prev) => {
      const services = prev.services.includes(id)
        ? prev.services.filter((s) => s !== id)
        : [...prev.services, id];
      return { ...prev, services };
    });
  };

  const nextStep = () => {
    if (currentStep === 1) {
      if (!formData.companyName || !formData.contactPerson || !formData.email || !formData.phone || !formData.industry) {
        toast.error('Please fill all fields in this step');
        return;
      }
    }
    setCurrentStep((prev) => Math.min(prev + 1, STEPS.length));
  };

  const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 1));

  const handleSubmit = useCallback(() => {
    if (formData.services.length === 0) {
      toast.error('Please select at least one service');
      return;
    }
    mutation.mutate(formData);
  }, [formData, mutation]);

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress Stepper */}
      <div className="flex items-center justify-between mb-8 relative">
        {/* Progress Line */}
        <div className="absolute top-1/3 left-0 w-full h-0.5 rounded-full bg-gray-200 -translate-y-1/2 z-0" />
        <div
          className="absolute top-1/3 left-0 h-0.5 rounded-full bg-indigo-600 -translate-y-1/2 z-0 transition-all duration-300"
          style={{ width: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%` }}
        />

        {STEPS.map((step) => (
          <div key={step.id} className="relative z-10 flex flex-col items-center gap-2">
            <div
              className={`w-15 h-15 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${currentStep >= step.id
                ? 'bg-white border-indigo-500 text-indigo-500 shadow-sm'
                : 'bg-white border-gray-200 text-gray-400'
                }`}
            >
              {currentStep > step.id ? <Check className="w-6 h-6" /> : <step.icon className="w-6 h-6" />}
            </div>
            <span className={`text-sm font-semibold ${currentStep >= step.id ? 'text-gray-900' : 'text-gray-400'}`}>
              {step.name}
            </span>
          </div>
        ))}
      </div>

      {/* Form Content */}
      <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm">
        <AnimatePresence mode="wait">
          {currentStep === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Company Name</label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Acme Corp"
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500"
                      value={formData.companyName}
                      onChange={(e) => updateField('companyName', e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Contact Person</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="John Doe"
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500"
                      value={formData.contactPerson}
                      onChange={(e) => updateField('contactPerson', e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="email"
                      placeholder="john@acme.com"
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500"
                      value={formData.email}
                      onChange={(e) => updateField('email', e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="+1 234 567 890"
                      className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500"
                      value={formData.phone}
                      onChange={(e) => updateField('phone', e.target.value)}
                    />
                  </div>
                </div>
                <div className="md:col-span-2 space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Industry</label>
                  <input
                    type="text"
                    placeholder="Technology, SaaS, etc."
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500"
                    value={formData.industry}
                    onChange={(e) => updateField('industry', e.target.value)}
                  />
                </div>
              </div>
            </motion.div>
          )}

          {currentStep === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <h3 className="text-md font-semibold text-gray-900 mb-4">Select Engagement Type</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { id: 'RETAINER', name: 'Retainer', desc: 'Monthly ongoing engagement' },
                  { id: 'PROJECT_BASED', name: 'Project-Based', desc: 'Fixed scope and timeline' },
                ].map((type) => (
                  <button
                    key={type.id}
                    onClick={() => updateField('engagementType', type.id)}
                    className={`p-6 rounded-xl border-2 text-left transition-all ${formData.engagementType === type.id
                      ? 'border-indigo-500 bg-indigo-50/50 ring-4 ring-indigo-500/5'
                      : 'border-gray-100 bg-white hover:border-indigo-200'
                      }`}
                  >
                    <div className="font-semibold text-gray-900 mb-1">{type.name}</div>
                    <div className="text-sm text-gray-500">{type.desc}</div>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {currentStep === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <h3 className="text-md font-semibold text-gray-900 mb-4">Select Services</h3>
              <div className="grid grid-cols-1 gap-3 text-sm">
                {SERVICE_OPTIONS.map((service) => {
                  const isActive = formData.services.includes(service.id);
                  return (
                    <button
                      key={service.id}
                      onClick={() => toggleService(service.id)}
                      className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all ${isActive
                        ? 'border-indigo-500 bg-indigo-50/50'
                        : 'border-gray-100 bg-white hover:border-indigo-200'
                        }`}
                    >
                      <div className="text-left">
                        <div className="font-semibold text-gray-900">{service.name}</div>
                        <div className="text-xs text-gray-500">{service.desc}</div>
                      </div>
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${isActive ? 'bg-indigo-500 border-indigo-500 text-white' : 'border-gray-200'
                        }`}>
                        {isActive && <Check className="w-4 h-4" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action Buttons */}
        <div className="flex items-center justify-between mt-4 pt-4">
          <button
            onClick={prevStep}
            disabled={currentStep === 1}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-xs font-semibold transition-all ${currentStep === 1 ? 'opacity-0' : 'text-gray-500 hover:bg-gray-50'
              }`}
          >
            <ChevronLeft className="w-5 h-5" />
            Back
          </button>

          {currentStep === STEPS.length ? (
            <button
              onClick={handleSubmit}
              disabled={mutation.isPending}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 shadow-md shadow-indigo-200 transition-all disabled:opacity-70"
            >
              {mutation.isPending ? 'Onboarding...' : 'Complete Onboarding'}
              {!mutation.isPending && <Sparkles className="w-4 h-4" />}
            </button>
          ) : (
            <button
              onClick={nextStep}
              className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg text-xs font-semibold hover:bg-gray-800 shadow-md shadow-gray-200 transition-all"
            >
              Next
              <ChevronRight className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
