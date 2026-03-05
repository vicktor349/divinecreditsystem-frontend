import React from 'react';
import Link from 'next/link';
import { MdHome, MdArrowBack } from 'react-icons/md';

export default function Custom404Page() {
  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-6">
      <div className="max-w-md w-full text-center animate-fade-in">

        {/* Error badge */}
        <div className="inline-flex items-center gap-2 bg-red-50 text-red-600 px-3.5 py-1.5 rounded-full text-[12px] font-semibold ring-1 ring-red-200 mb-8">
          <span className="w-1.5 h-1.5 bg-red-500 rounded-full" />
          404 — Page Not Found
        </div>

        {/* Illustration placeholder */}
        <div className="w-28 h-28 rounded-3xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center mx-auto mb-8 shadow-sm">
          <span className="text-5xl font-black text-slate-300 select-none">?</span>
        </div>

        <h1 className="text-[28px] font-bold text-slate-900 mb-3 leading-tight">
          This page doesn't exist
        </h1>
        <p className="text-slate-500 text-[15px] leading-relaxed mb-10 max-w-sm mx-auto">
          The page you're looking for may have been moved, deleted, or you may have followed an incorrect link.
        </p>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white font-semibold rounded-xl text-sm hover:bg-green-700 active:scale-95 transition-all shadow-sm shadow-green-600/25"
          >
            <MdHome size={18} />
            Back to Dashboard
          </Link>
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-slate-200 text-slate-600 font-medium rounded-xl text-sm hover:bg-slate-50 active:scale-95 transition-all"
          >
            <MdArrowBack size={16} />
            Go Back
          </button>
        </div>
      </div>

      {/* Footer */}
      <p className="mt-16 text-[12px] text-slate-400">
        © {new Date().getFullYear()} Divine Credit System. All rights reserved.
      </p>
    </div>
  );
}
