'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function NotFound() {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

    useEffect(() => {
        fetch('/api/auth/me', { credentials: 'include' })
            .then((r) => setIsAuthenticated(r.ok))
            .catch(() => setIsAuthenticated(false));
    }, []);

    const href = isAuthenticated ? '/dashboard' : '/sign-in';
    const label = isAuthenticated ? 'Go to Dashboard' : 'Go to Sign In';

    return (
        <div className="fixed inset-0 z-9999 flex items-center justify-center bg-gray-50 px-4">
            <div className="w-full max-w-sm bg-white border border-gray-200 rounded-xl p-8 shadow-sm text-center">
                <p className="text-6xl font-bold text-red-500 mb-2">404</p>
                <h1 className="text-xl font-semibold text-gray-900 mb-2">Oops! Page not found</h1>
                <p className="text-sm text-gray-500 mb-6">
                    The page you're looking for doesn't exist or has been moved.
                </p>
                {isAuthenticated !== null && (
                    <Link
                        href={href}
                        className="inline-block bg-black text-white px-5 py-2.5 rounded-lg hover:bg-gray-800 transition-colors font-medium text-sm"
                    >
                        {label}
                    </Link>
                )}
            </div>
        </div>
    );
}
