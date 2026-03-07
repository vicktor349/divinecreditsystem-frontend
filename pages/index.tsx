import Head from 'next/head';
import Image from 'next/image';
import { useCallback, useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useUser } from '@/context/UserContext';
import { MdEmail, MdLock, MdVisibility, MdVisibilityOff } from 'react-icons/md';

export default function LoginPage() {
  const router = useRouter();
  const { setUser, isAuthenticated, isLoading: authLoading } = useUser();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Redirect if already authenticated
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.replace('/dashboard');
    }
  }, [isAuthenticated, authLoading, router]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const res = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || data.message || 'Sign in failed');
        return;
      }

      if (data.token) {
        localStorage.setItem('token', data.token);
      }

      setUser(data.user);
      router.replace('/dashboard');
    } catch {
      setError('Unable to connect to the server. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }, [email, password, setUser, router]);

  if (authLoading) return null;

  return (
    <>
      <Head><title>Divine Credit System | Sign In</title></Head>

      <div className="min-h-screen bg-[#f5f7fa] flex items-center justify-center p-4">

        {/* Card */}
        <div className="w-full max-w-md animate-fade-in">

          {/* Logo + brand */}
          <div className="flex flex-col items-center mb-8">
            <Image
              src="/images/logo.png"
              alt="Divine Credit System Logo"
              width={80}
              height={80}
              className="object-contain mb-3"
              priority
            />
            <h1 className="text-2xl font-bold text-gray-900">Divine Credit System</h1>
            <p className="text-sm text-gray-500 mt-1">Sign in to your account</p>
          </div>

          {/* Form card */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
            <form onSubmit={handleSubmit} className="space-y-5">

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Email address
                </label>
                <div className="relative">
                  <MdEmail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="Please Enter Your Email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    disabled={submitting}
                    className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:opacity-50 transition-colors bg-gray-50 focus:bg-white"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <MdLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="current-password"
                    placeholder="Please Enter your password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    disabled={submitting}
                    className="w-full border border-gray-200 rounded-xl pl-10 pr-11 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:opacity-50 transition-colors bg-gray-50 focus:bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <MdVisibility size={18} /> : <MdVisibilityOff size={18} />}
                  </button>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm animate-fade-in">
                  {error}
                </div>
              )}

              {/* Forgot password */}
              <div className="text-right -mt-1">
                <a href="/forgot-password" className="text-xs text-green-600 hover:text-green-700 font-medium transition-colors">
                  Forgot password?
                </a>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={submitting || !email || !password}
                className="w-full bg-green-600 text-white py-3 rounded-xl text-sm font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] transition-all duration-150 shadow-sm shadow-green-600/20 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" />
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>
          </div>

          {/* Footer */}
          <p className="text-center text-xs text-gray-400 mt-6">
            Divine Credit System &copy; {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </>
  );
}
