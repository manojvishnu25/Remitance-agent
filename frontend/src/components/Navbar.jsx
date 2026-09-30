import React, { useState } from 'react';
import { RotateCcw, ShieldCheck, UserCheck, AlertTriangle } from 'lucide-react';
import { resetDemo } from '../services/api';

export default function Navbar({ onResetSuccess }) {
  const [resetting, setResetting] = useState(false);
  const [resetMessage, setResetMessage] = useState('');

  const handleReset = async () => {
    setResetting(true);
    setResetMessage('');
    try {
      const res = await resetDemo();
      setResetMessage(res.message || 'Demo reset successfully!');
      if (onResetSuccess) {
        onResetSuccess();
      }
      setTimeout(() => setResetMessage(''), 3500);
    } catch (err) {
      alert(`Failed to reset demo: ${err.message}`);
    } finally {
      setResetting(false);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs">
      {/* Simulation Notice Banner */}
      <div className="bg-amber-500 text-slate-950 px-4 py-1.5 text-xs font-semibold flex items-center justify-center gap-2 tracking-wide text-center">
        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
        <span>SIMULATION ONLY — No real money movement. Safe sandbox prototype for college expo presentation.</span>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Info */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-xl shadow-xs">
              ₹
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-slate-900 tracking-tight leading-tight">
                  Remittance & Goal Planner
                </h1>
                <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                  <ShieldCheck className="w-3 h-3" /> Safe Simulation
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                Plan simulated transfers and protect your upcoming goals.
              </p>
            </div>
          </div>

          {/* Action & User Info */}
          <div className="flex items-center gap-3">
            {resetMessage && (
              <span className="text-xs text-emerald-600 font-medium hidden md:inline-block animate-fade-in">
                {resetMessage}
              </span>
            )}

            <button
              onClick={handleReset}
              disabled={resetting}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 rounded-lg border border-slate-300 transition-colors disabled:opacity-50 cursor-pointer"
              title="Reset Demo Database to Initial ₹20,000 balance and goals"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${resetting ? 'animate-spin' : ''}`} />
              <span>{resetting ? 'Resetting...' : 'Reset Demo'}</span>
            </button>

            <div className="flex items-center gap-2 pl-3 border-l border-slate-200">
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                DS
              </div>
              <div className="hidden lg:block text-left">
                <div className="text-xs font-semibold text-slate-800 leading-none flex items-center gap-1">
                  Demo Student
                </div>
                <div className="text-[10px] text-slate-500 leading-none mt-0.5">
                  ID: #1 (Student Account)
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
