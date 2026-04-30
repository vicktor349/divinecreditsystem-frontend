import Head from 'next/head';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { MdLock, MdVisibility, MdVisibilityOff, MdCheckCircle } from 'react-icons/md';

const API = process.env.NEXT_PUBLIC_AUTH_API_URL || 'http://localhost:3001';

export default function ResetPassword() {
  const router = useRouter();
  const { token } = router.query;

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (router.isReady && !token) {
      setError('Invalid or missing reset token. Please request a new reset link.');
    }
  }, [router.isReady, token]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    if (password !== confirm) { setError('Passwords do not match.'); return; }
    setLoading(true); setError('');
    try {
      const res = await fetch(`${API}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message ?? 'Reset failed. The link may have expired.'); return; }
      setDone(true);
      setTimeout(() => router.push('/'), 3000);
    } catch {
      setError('Unable to connect to server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head><title>Reset Password | Divine Credit System</title></Head>
      <div className="min-h-screen bg-[#f5f7fa] flex items-center justify-center p-4">
        <div className="w-full max-w-md animate-fade-in">

          <div className="flex flex-col items-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Divine Credit System</h1>
            <p className="text-sm text-gray-500 mt-1">Set a new password</p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
            {done ? (
              <div className="text-center space-y-4">
                <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                  <MdCheckCircle size={32} className="text-green-600" />
                </div>
                <h2 className="text-lg font-bold text-slate-800">Password updated!</h2>
                <p className="text-sm text-slate-500">
                  Your password has been reset. Redirecting you to sign in…
                </p>
                <Link href="/" className="inline-block mt-2 text-sm text-green-600 hover:text-green-700 font-semibold transition-colors">
                  Sign in now →
                </Link>
              </div>
            ) : (
              <form onSubmit={submit} className="space-y-5">
                <div>
                  <h2 className="text-lg font-bold text-slate-800 mb-1">Create new password</h2>
                  <p className="text-sm text-slate-500">Choose a strong password for your account.</p>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
                    {error}
                    {error.includes('expired') && (
                      <> <Link href="/forgot-password" className="underline font-semibold">Request a new one</Link>.</>
                    )}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">New Password</label>
                  <div className="relative">
                    <MdLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="Min. 6 characters"
                      disabled={loading}
                      className="w-full border border-gray-200 rounded-xl pl-10 pr-11 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:opacity-50 transition-colors bg-gray-50 focus:bg-white"
                    />
                    <button type="button" onClick={() => setShowPassword(v => !v)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors" tabIndex={-1}>
                      {showPassword ? <MdVisibility size={18} /> : <MdVisibilityOff size={18} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm Password</label>
                  <div className="relative">
                    <MdLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={confirm}
                      onChange={e => setConfirm(e.target.value)}
                      placeholder="Repeat new password"
                      disabled={loading}
                      className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:opacity-50 transition-colors bg-gray-50 focus:bg-white"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || !password || !confirm || !!error}
                  className="w-full bg-green-600 text-white py-3 rounded-xl text-sm font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150 shadow-sm flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Resetting…</>
                  ) : 'Reset Password'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
