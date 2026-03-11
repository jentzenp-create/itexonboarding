'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Dev/Demo shortcut page — skips the magic link email flow.
 * In development: auto-creates a session and redirects.
 * In production: requires admin password first.
 */
export default function DevShortcutPage() {
  const router = useRouter();
  const [status, setStatus] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [needsPassword, setNeedsPassword] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Try without password first (works in dev mode)
    tryCreateSession();
  }, []);

  const tryCreateSession = async (pwd?: string) => {
    setLoading(true);
    setError(null);
    setStatus('Creating test session...');

    try {
      const res = await fetch('/api/dev/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pwd ? { password: pwd } : {}),
      });

      const data = await res.json();

      if (res.status === 403) {
        // Needs password (production mode)
        setNeedsPassword(true);
        setStatus('');
        setLoading(false);
        return;
      }

      if (!res.ok) {
        setError(data.error || 'Failed to create session');
        setLoading(false);
        return;
      }

      setToken(data.token);
      setStatus('Session created! Redirecting to onboarding...');
      setTimeout(() => router.push(`/onboarding/${data.token}`), 800);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setLoading(false);
    }
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;
    setNeedsPassword(false);
    tryCreateSession(password);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
        <div className="w-12 h-12 rounded-xl bg-yellow-100 flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">🛠️</span>
        </div>
        <h1 className="text-xl font-bold text-gray-800 mb-2">Demo Shortcut</h1>
        <p className="text-sm text-gray-500 mb-6">Quick access to the onboarding flow for testing.</p>

        {needsPassword ? (
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div className="text-left">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Admin Password
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter admin password"
                autoFocus
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-green-500 text-sm"
              />
            </div>
            <button
              type="submit"
              className="w-full py-3 px-4 bg-gradient-to-r from-green-400 to-cyan-400 text-white font-semibold rounded-xl hover:shadow-md transition-all"
            >
              Start Demo
            </button>
          </form>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-left">
            <p className="text-sm font-semibold text-red-700 mb-1">Error</p>
            <p className="text-sm text-red-600">{error}</p>
            <button
              onClick={() => tryCreateSession(password || undefined)}
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
              ) : loading ? (
                <>
                  <svg className="animate-spin w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  <span>{status}</span>
                </>
              ) : null}
            </div>
            {token && (
              <p className="text-xs text-gray-400 font-mono break-all">Token: {token}</p>
            )}
          </div>
        )}

        <p className="text-xs text-gray-400 mt-6 border-t pt-4">
          This creates a test session to preview the onboarding experience.
        </p>
      </div>
    </div>
  );
}
