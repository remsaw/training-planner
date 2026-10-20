import React, { useState } from 'react';
import {
  Lock,
  CalendarCheck,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';

interface PasswordGateScreenProps {
  onUnlock: (password: string, remember: boolean) => boolean;
}

export const PasswordGateScreen: React.FC<PasswordGateScreenProps> = ({
  onUnlock,
}) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;

    const success = onUnlock(password.trim(), remember);
    if (!success) {
      setError(true);
    }
  };

  return (
    <div className="min-h-dvh w-full bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 flex items-center justify-center p-4 select-none">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-300">
        {/* Top Header Banner */}
        <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-700 p-6 sm:p-8 text-white text-center relative overflow-hidden">
          {/* Subtle background glow */}
          <div className="absolute -top-12 -right-12 w-36 h-36 bg-blue-400/20 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-indigo-500/20 rounded-full blur-xl pointer-events-none" />

          {/* Logo Badge */}
          <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shadow-lg">
            <CalendarCheck className="w-8 h-8 sm:w-9 sm:h-9 text-blue-200" />
          </div>

          <h1 className="text-lg sm:text-xl font-extrabold tracking-tight text-white leading-tight">
            Training Resource Planner
          </h1>
          <p className="text-xs text-blue-100 font-medium mt-1">
            Professional Training Scheduling &amp; Resource Management
          </p>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-800/60 border border-blue-400/30 text-[11px] font-semibold text-blue-200 mt-3 sm:mt-4">
            <Lock className="w-3 h-3 text-blue-300" />
            <span>Protected Access Portal</span>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-5 sm:p-7">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Access Password
                </label>
              </div>

              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoFocus
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError(false);
                  }}
                  placeholder="Enter planner password..."
                  className={`w-full pl-3.5 pr-10 py-2.5 text-sm rounded-xl border transition-all outline-hidden ${
                    error
                      ? 'border-rose-400 ring-2 ring-rose-500/20 bg-rose-50/30 text-rose-900'
                      : 'border-gray-300 focus:border-blue-600 focus:ring-3 focus:ring-blue-500/15 bg-gray-50/50 focus:bg-white text-gray-900'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 p-0.5 cursor-pointer"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {error && (
                <div className="flex items-center gap-1.5 text-rose-600 text-xs font-semibold mt-1.5 animate-in slide-in-from-top-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>Incorrect password. Please try again.</span>
                </div>
              )}
            </div>

            {/* Remember device checkbox */}
            <div className="flex items-center justify-between pt-1 flex-wrap gap-2">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-600 font-medium">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <span>Remember session on this device</span>
              </label>

              <span className="text-[11px] text-gray-400">Healthcare Division</span>
            </div>

            {/* Unlock Button */}
            <button
              type="submit"
              className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-bold text-sm shadow-md shadow-blue-600/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <span>Unlock &amp; Begin Planning</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Notice Info */}
          <div className="mt-5 sm:mt-6 pt-4 sm:pt-5 border-t border-gray-100 flex items-start gap-2.5 text-xs text-gray-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <p className="leading-snug text-[11px]">
              Equipped with a deterministic scheduling engine enforcing the 1-person-1-training-per-day rule. Authorized personnel only.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
