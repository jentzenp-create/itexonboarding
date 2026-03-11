'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * DEV-ONLY shortcut page — skips the magic link email flow.
 * Visit http://localhost:3000/dev to instantly jump to the onboarding flow.
 * This page is blocked in production (NODE_ENV !== 'development').
 */
export default function DevShortcutPage() {
  const router = useRouter();
  const [status, setStatus] = useState('Creating test session...');
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    createTestSession();
  }, []);

  const createTestSession = async () => {
    try {
      // Call the session create API directly — bypasses email sending in dev
      const res = await fetch('/api/dev/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to create session');
        return;
      }

      setToken(data.token);
      setStatus('Session created! Redirecting to onboarding...');
      setTimeout(() => router.push(`/onboarding/${data.token}`), 800);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
        <div className="w-12 h-12 rounded-xl bg-yellow-100 flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">🛠️</span>
        </div>
        <h1 className="text-xl font-bold text-gray-800 mb-2">Dev Shortcut</h1>
        <p className="text-sm text-gray-500 mb-6">Skipping magic link — jumping straight to onboarding.</p>

        {error ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-left">
            <p className="text-sm font-semibold text-red-700 mb-1">Error</p>
            <p className="text-sm text-red-600">{error}</p>
            <button
              onClick={createTestSession}
              className="mt-3 text-sm font-medium text-red-700 underline"
            >
              Try again
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
              {token ? (
                <span className="text-green-600 font-medium">✓ {status}</span>
              ) : (
                <>
                  <svg className="animate-spin w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  <span>{status}</span>
                </>
              )}
            </div>
            {token && (
              <p className="text-xs text-gray-400 font-mono break-all">Token: {token}</p>
            )}
          </div>
        )}

        <p className="text-xs text-gray-400 mt-6 border-t pt-4">
          This page only works in development mode.
        </p>
      </div>
    </div>
  );
}
