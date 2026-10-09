'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import Logo from '@/components/Logo';
import { DjangoApi } from '@/services/api';
import {
  Sun,
  Moon,
  Lock,
  Mail,
  ArrowRight,
  Eye,
  EyeOff,
  ShieldCheck,
  GraduationCap,
  Hospital,
  Flame,
  KeyRound,
  CheckCircle2,
  X,
  AlertCircle,
  Send,
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const router = useRouter();
  const { login, organizations } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Forgot Password Modal State
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [isForgotLoading, setIsForgotLoading] = useState(false);
  const [forgotStatus, setForgotStatus] = useState<{ success?: string; error?: string } | null>(null);

  const handleOpenForgotModal = () => {
    setForgotEmail(email.trim());
    setForgotStatus(null);
    setShowForgotModal(true);
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotStatus(null);
    setIsForgotLoading(true);

    const cleanEmail = forgotEmail.trim().toLowerCase();
    const res = await DjangoApi.requestPasswordReset(cleanEmail);

    if (res?.success) {
      setForgotStatus({ success: res.message || `Password reset link dispatched to ${cleanEmail}!` });
    } else {
      setForgotStatus({ error: res?.error || 'This email address was not found in our database.' });
    }
    setIsForgotLoading(false);
  };

  const executeLogin = async (userEmail: string, userPass?: string) => {
    setErrorMsg('');
    setIsLoading(true);

    const cleanEmail = userEmail.trim().toLowerCase();
    const targetPassword = userPass !== undefined ? userPass : password;

    const res = await login(cleanEmail, targetPassword);
    if (res.success) {
      if (res.redirectUrl) {
        router.push(res.redirectUrl);
      } else if (cleanEmail.includes('superadmin')) {
        router.push('/admin/dashboard');
      } else {
        router.push('/user');
      }
    } else {
      setErrorMsg(res.error || 'Access Denied: Invalid email or password.');
    }
    setIsLoading(false);
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeLogin(email, password);
  };

  return (
    <div className="min-h-screen relative flex flex-col justify-between p-4 sm:p-6 md:p-8 bg-white dark:bg-[#070b16] text-slate-900 dark:text-slate-100 overflow-hidden font-sans select-none transition-colors duration-300">
      {/* Subtle Ambient Glows */}
      <div className="absolute -top-32 -left-32 w-72 sm:w-[500px] h-72 sm:h-[500px] bg-emerald-500/15 dark:bg-emerald-500/10 rounded-full blur-[100px] sm:blur-[130px] pointer-events-none animate-pulse-slow" />
      <div className="absolute top-1/2 -right-32 w-72 sm:w-[450px] h-72 sm:h-[450px] bg-indigo-500/15 dark:bg-indigo-600/10 rounded-full blur-[100px] sm:blur-[140px] pointer-events-none" />
      <div className="absolute -bottom-32 left-1/3 w-72 sm:w-[450px] h-72 sm:h-[450px] bg-cyan-500/15 dark:bg-cyan-500/10 rounded-full blur-[100px] sm:blur-[150px] pointer-events-none" />

      {/* Top Header */}
      <header className="relative z-10 max-w-6xl w-full mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Logo size="md" showText={true} />
        </div>

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          aria-label="Toggle Theme"
          className="p-2 sm:p-2.5 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 hover:border-emerald-500 transition-all shadow-sm"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
        </button>
      </header>

      {/* Clean Centered Card without autofill button */}
      <main className="relative z-10 w-full max-w-[420px] mx-auto my-auto py-6 sm:py-8">
        <div className="rounded-3xl bg-white dark:bg-[#0e1628]/95 border border-slate-200/90 dark:border-slate-800/90 shadow-xl dark:shadow-[0_20px_50px_-15px_rgba(0,0,0,0.7)] backdrop-blur-2xl p-6 sm:p-8 space-y-6">
          
          {/* Title Header */}
          <div className="text-center space-y-1.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Sign In
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Enter your assigned institutional email & password
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs text-center font-medium">
                {errorMsg}
              </div>
            )}

            {/* Email Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Email Address:
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@estate.gov.in"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Password:
                </label>
                <button
                  type="button"
                  onClick={handleOpenForgotModal}
                  className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer bg-transparent border-0 p-0 font-medium"
                >
                  Forgot?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white dark:text-slate-950 font-extrabold text-xs shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-70 mt-2 cursor-pointer"
            >
              {isLoading ? (
                <span className="inline-block w-4 h-4 border-2 border-white dark:border-slate-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign In to Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </main>

      {/* Forgot Password Modal Dialog */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
          <div className="w-full max-w-md p-6 sm:p-7 rounded-3xl bg-white dark:bg-[#0c1222] border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800/80">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                    Reset Account Password
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    EcoEstate India Verified Credential Recovery
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Enter your registered organizational email address. We will verify your account in the database and immediately dispatch a secure password reset link to your email.
            </p>

            <form onSubmit={handleForgotSubmit} className="space-y-4">
              {forgotStatus?.error && (
                <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/25 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{forgotStatus.error}</span>
                </div>
              )}

              {forgotStatus?.success && (
                <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs space-y-1.5">
                  <div className="flex items-center gap-2 font-bold text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                    <span>Reset Link Dispatched!</span>
                  </div>
                  <p className="text-[11px] leading-relaxed">
                    {forgotStatus.success}
                  </p>
                </div>
              )}

              {!forgotStatus?.success && (
                <>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Registered Email Address:
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                      <input
                        type="email"
                        required
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        placeholder="admin@estate.gov.in"
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs placeholder:text-slate-400 focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-end gap-2.5">
                    <button
                      type="button"
                      onClick={() => setShowForgotModal(false)}
                      className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      disabled={isForgotLoading || !forgotEmail.trim()}
                      className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-md shadow-emerald-500/25 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                    >
                      {isForgotLoading ? (
                        <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5" />
                          <span>Send Reset Link</span>
                        </>
                      )}
                    </button>
                  </div>
                </>
              )}

              {forgotStatus?.success && (
                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-md transition-all cursor-pointer"
                  >
                    Back to Sign In
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="relative z-10 max-w-6xl w-full mx-auto flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 gap-2 text-center sm:text-left">
        <span>EcoEstate India • Sustainable Facility & Estate Intelligence Platform</span>
        <span>Aligned with CPCB & GRIHA Standards</span>
      </footer>
    </div>
  );
};

export default LoginPage;
