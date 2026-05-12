'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ForgotPasswordPage() {
    const router = useRouter();

    // step: 'email' → verify email | 'reset' → set new password
    const [step, setStep] = useState<'email' | 'reset'>('email');
    const [email, setEmail] = useState('');
    const [emailError, setEmailError] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const validateEmail = (v: string) =>
        EMAIL_REGEX.test(v) ? '' : 'Please enter a valid email address';

    // ── Step 1: verify email exists ────────────────────────────────────────────
    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        const err = validateEmail(email);
        if (err) { setEmailError(err); return; }

        setIsLoading(true);
        try {
            const res = await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'verify', email }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            setStep('reset');
        } catch (err: any) {
            toast.error(err.message ?? 'Something went wrong');
        } finally {
            setIsLoading(false);
        }
    };

    // ── Step 2: reset password ─────────────────────────────────────────────────
    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password.length < 8) {
            toast.error('Password must be at least 8 characters');
            return;
        }
        if (password !== confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }

        setIsLoading(true);
        try {
            const res = await fetch('/api/auth/forgot-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'reset', email, password }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            toast.success('Password updated! Please sign in.');
            router.push('/sign-in');
        } catch (err: any) {
            toast.error(err.message ?? 'Something went wrong');
        } finally {
            setIsLoading(false);
        }
    };

    const EyeIcon = ({ open }: { open: boolean }) => open ? (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
        </svg>
    ) : (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
    );

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50/80 px-4">
            <div className="w-full max-w-sm bg-white border border-gray-200 rounded-xl p-6 shadow-sm">

                {/* Step indicator */}
                <div className="flex items-center gap-2 mb-6">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step === 'email' ? 'bg-primary text-white' : 'bg-emerald-500 text-white'}`}>
                        {step === 'reset' ? (
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                        ) : '1'}
                    </div>
                    <div className={`flex-1 h-px ${step === 'reset' ? 'bg-emerald-400' : 'bg-gray-200'}`} />
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step === 'reset' ? 'bg-primary text-white' : 'bg-gray-200 text-gray-400'}`}>
                        2
                    </div>
                </div>

                {step === 'email' ? (
                    <>
                        <div className="text-center mb-8">
                            <h1 className="text-2xl font-semibold text-gray-900 mb-1">Forgot password?</h1>
                            <p className="text-sm text-gray-500">Enter your email to verify your account</p>
                        </div>

                        <form onSubmit={handleVerify} className="space-y-5">
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                                    Email address
                                </label>
                                <input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => {
                                        const v = e.target.value.toLowerCase().trim();
                                        setEmail(v);
                                        if (emailError) setEmailError(validateEmail(v));
                                    }}
                                    onBlur={() => setEmailError(validateEmail(email))}
                                    required
                                    autoFocus
                                    placeholder="you@example.com"
                                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-shadow text-sm text-black ${emailError ? 'border-red-400 focus:ring-red-400' : 'border-gray-300 focus:ring-gray-900'}`}
                                />
                                {emailError && (
                                    <p className="mt-1 text-xs text-red-500">{emailError}</p>
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-primary text-white py-2.5 rounded-lg hover:bg-[#27b785] transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm"
                            >
                                {isLoading ? 'Verifying...' : 'Verify Email'}
                            </button>
                        </form>
                    </>
                ) : (
                    <>
                        <div className="text-center mb-8">
                            <h1 className="text-2xl font-semibold text-gray-900 mb-1">Set new password</h1>
                            <p className="text-sm text-gray-500">
                                Account verified for <span className="font-medium text-gray-700">{email}</span>
                            </p>
                        </div>

                        <form onSubmit={handleReset} className="space-y-5">
                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
                                    New password
                                </label>
                                <div className="relative">
                                    <input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        autoFocus
                                        placeholder="Min. 8 characters"
                                        className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition-shadow text-black text-sm"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword((v) => !v)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                    >
                                        <EyeIcon open={showPassword} />
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label htmlFor="confirm" className="block text-sm font-medium text-gray-700 mb-1.5">
                                    Re-enter password
                                </label>
                                <div className="relative">
                                    <input
                                        id="confirm"
                                        type={showConfirm ? 'text' : 'password'}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        required
                                        placeholder="Re-enter your password"
                                        className={`w-full px-3 py-2 pr-10 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent transition-shadow text-black text-sm ${confirmPassword && confirmPassword !== password ? 'border-red-400 focus:ring-red-400' : 'border-gray-300 focus:ring-gray-900'}`}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirm((v) => !v)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                    >
                                        <EyeIcon open={showConfirm} />
                                    </button>
                                </div>
                                {confirmPassword && confirmPassword !== password && (
                                    <p className="mt-1 text-xs text-red-500">Passwords do not match</p>
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-primary text-white py-2.5 rounded-lg hover:bg-[#27b785] transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm"
                            >
                                {isLoading ? 'Updating...' : 'Update Password'}
                            </button>

                            <button
                                type="button"
                                onClick={() => { setStep('email'); setPassword(''); setConfirmPassword(''); }}
                                className="w-full text-sm text-gray-500 hover:text-gray-800 transition-colors py-1"
                            >
                                ← Change email
                            </button>
                        </form>
                    </>
                )}

                <div className="mt-6 text-center">
                    <Link href="/sign-in" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
                        Back to sign in
                    </Link>
                </div>
            </div>
        </div>
    );
}
