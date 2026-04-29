import Head from 'next/head';
import Link from 'next/link';
import { useState } from 'react';
import { MdEmail, MdArrowBack, MdCheckCircle } from 'react-icons/md';

const API = process.env.NEXT_PUBLIC_AUTH_API_URL || 'http://localhost:3001';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [devLink, setDevLink] = useState('');
  const [sent, setSent] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) { setError('Please enter your email address.'); return; }
    setLoading(true); setError('');
    try {
      const res = await fetch(`${API}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message ?? 'Something went wrong.'); return; }
      setSent(true);
      if (data.devResetLink) setDevLink(data.devResetLink);
    } catch {
      setError('Unable to connect to server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Head><title>Forgot Password | Divine Credit System</title></Head>
      <div className="min-h-screen bg-[#f5f7fa] flex items-center justify-center p-4">
        <div className="w-full max-w-md animate-fade-in">

          <div className="flex flex-col items-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Divine Credit System</h1>
            <p className="text-sm text-gray-500 mt-1">Reset your password</p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
            {sent ? (
              <div className="text-center space-y-4">
                <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                  <MdCheckCircle size={32} className="text-green-600" />
                </div>
                <h2 className="text-lg font-bold text-slate-800">Check your email</h2>
                <p className="text-sm text-slate-500">
                  If <strong>{email}</strong> exists in our system, a password reset link has been sent.
                </p>

                {/* Dev mode only — shows link when SMTP isn't configured */}
                {devLink && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-left mt-4">
                    <p className="text-xs font-bold text-amber-700 mb-2">⚠️ Dev mode — no SMTP configured</p>
                    <p className="text-xs text-amber-600 mb-2">Use this link to reset the password:</p>
                    <a
                      href={devLink}
                      className="text-xs text-blue-600 underline break-all"
                    >
                      {devLink}
                    </a>
                  </div>
                )}

                <Link href="/" className="inline-flex items-center gap-1 text-sm text-green-600 hover:text-green-700 font-semibold mt-2 transition-colors">
                  <MdArrowBack size={16} /> Back to sign in
                </Link>
              </div>
            ) : (
              <form onSubmit={submit} className="space-y-5">
                <div>
                  <h2 className="text-lg font-bold text-slate-800 mb-1">Forgot your password?</h2>
                  <p className="text-sm text-slate-500">Enter your email and we&apos;ll send you a reset link.</p>
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
                    {error}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Email address</label>
                  <div className="relative">
                    <MdEmail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      disabled={loading}
                      className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:opacity-50 transition-colors bg-gray-50 focus:bg-white"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || !email}
                  className="w-full bg-green-600 text-white py-3 rounded-xl text-sm font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-150 shadow-sm flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Sending…</>
                  ) : 'Send Reset Link'}
                </button>

                <div className="text-center">
                  <Link href="/" className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 transition-colors">
                    <MdArrowBack size={15} /> Back to sign in
                  </Link>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
