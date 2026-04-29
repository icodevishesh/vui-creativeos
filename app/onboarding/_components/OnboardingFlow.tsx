'use client';

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
  Users,
  Layers,
  Sparkles,
  Copy,
  KeyRound,
  X,
  CheckCircle2,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import PhoneInput from './PhoneInput';

const STEPS = [
  { id: 1, name: 'Basic Info', icon: Building2 },
  { id: 2, name: 'Engagement', icon: Users },
  { id: 3, name: 'Services', icon: Layers },
];

const SERVICE_OPTIONS = [
  { id: 'SOCIAL_MEDIA', name: 'Social Media', desc: 'Platform management & content' },
  { id: 'PAID_MEDIA', name: 'Paid Media', desc: 'Meta, Google, LinkedIn Ads' },
  { id: 'INFLUENCER_MARKETING', name: 'Influencer Marketing', desc: 'Creator partnerships' },
  { id: 'EMAIL_MARKETING', name: 'Email Marketing', desc: 'Newsletters & automations' },
  { id: 'WHATSAPP_MARKETING', name: 'WhatsApp Marketing', desc: 'Campaigns via WhatsApp Business API' },
  { id: 'SEO', name: 'SEO', desc: 'Search engine optimization & ranking' },
];

// Component

function CredentialsModal({
  isOpen,
  email,
  password,
  companyName,
  onClose,
}: {
  isOpen: boolean;
  email: string;
  password: string;
  companyName: string;
  onClose: () => void;
}) {
  const [copiedField, setCopiedField] = useState<'email' | 'password' | null>(null);

  const copy = (text: string, field: 'email' | 'password') => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="bg-linear-to-r from-indigo-600 to-indigo-500 px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-white/20 rounded-lg flex items-center justify-center">
                <KeyRound className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white">Client Portal Credentials</h2>
                <p className="text-xs text-indigo-200">{companyName}</p>
              </div>
            </div>
            <button onClick={onClose} className="text-white/70 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-amber-50 border border-amber-100 rounded-lg px-4 py-3">
            <p className="text-xs text-amber-700 font-medium">
              Save these credentials — the password cannot be recovered later. Share them securely with your client.
            </p>
          </div>

          {[
            { label: 'Email', value: email, field: 'email' as const },
            { label: 'Password', value: password, field: 'password' as const },
          ].map(({ label, value, field }) => (
            <div key={field} className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-widest">{label}</label>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2.5 font-mono text-sm text-gray-900 truncate">
                  {value}
                </div>
                <button
                  onClick={() => copy(value, field)}
                  className="shrink-0 w-9 h-9 flex items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-100 transition-all text-gray-500 hover:text-gray-900"
                >
                  {copiedField === field ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
          ))}

          <div className="pt-2 space-y-1.5">
            <p className="text-xs text-gray-400 font-medium">Client portal login URL</p>
            <p className="font-mono text-xs text-indigo-600 bg-indigo-50 px-3 py-2 rounded-lg break-all">
              {typeof window !== 'undefined' ? window.location.origin : ''}/sign-in
            </p>
          </div>
        </div>

        <div className="px-6 pb-6">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-all"
          >
            Done — Go to Clients
          </button>
        </div>
      </div>
    </div>
  );
}

export function OnboardingFlow() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState(1);
  const [credentials, setCredentials] = useState<{ email: string; password: string; companyName: string } | null>(null);
  const [formData, setFormData] = useState({
    companyName: '',
    contactPerson: '',
    email: '',
    phone: '',
    industry: '',
    engagementType: 'RETAINER',
    services: [] as string[],
  });
  // Email field — add emailError state + validation (same pattern as sign-in)
  const [emailError, setEmailError] = useState('');
  const [phoneError, setPhoneError] = useState('');

  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const PHONE_REGEX = /^\+91[6-9]\d{9}$/;  // +91 + valid 10-digit Indian mobile

  const validateEmail = (v: string) =>
    EMAIL_REGEX.test(v) ? '' : 'Please enter a valid email address';

const validatePhone = (v: string) => {
  const digits = v.replace(/\D/g, '');
  return digits.length >= 7 && digits.length <= 15
    ? ''
    : 'Enter a valid phone number';
};

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
    onSuccess: (data) => {
      toast.success('Client onboarded successfully!');
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      if (data.generatedPassword) {
        setCredentials({ email: data.email, password: data.generatedPassword, companyName: data.companyName });
      } else {
        router.push('/clients');
      }
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
          {/* Adding client details */}
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
                {/* Email */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="email"
                      placeholder="john@acme.com"
                      className={`w-full pl-10 pr-4 py-2.5 bg-gray-50 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:border-indigo-500 ${
                        emailError
                          ? 'border-red-400 focus:ring-red-400/20'
                          : 'border-gray-100 focus:ring-indigo-500/10'
                      }`}
                      value={formData.email}
                      onChange={(e) => {
                        const v = e.target.value.toLowerCase().trim();
                        updateField('email', v);
                        if (emailError) setEmailError(validateEmail(v));
                      }}
                      onBlur={() => setEmailError(validateEmail(formData.email))}
                    />
                  </div>
                  {emailError && <p className="text-xs text-red-500">{emailError}</p>}
                </div>

                {/* Phone */}
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-gray-700">Phone Number</label>
                  <PhoneInput
                    value={formData.phone}
                    onChange={(v) => {
                      updateField('phone', v);
                      if (phoneError) setPhoneError(validatePhone(v));
                    }}
                    onBlur={() => setPhoneError(validatePhone(formData.phone))}
                    error={phoneError}
                  />
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

      {credentials && (
        <CredentialsModal
          isOpen={!!credentials}
          email={credentials.email}
          password={credentials.password}
          companyName={credentials.companyName}
          onClose={() => { setCredentials(null); router.push('/clients'); }}
        />
      )}
    </div>
  );
}
