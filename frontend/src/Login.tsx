import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, LogIn, UserPlus, Sparkles, Eye, EyeOff, LineChart } from 'lucide-react';
import { supabase } from './supabaseClient';
import { useNavigate, Link } from 'react-router-dom';

type AuthMode = 'signin' | 'signup';

export default function Login() {
  const [mode, setMode] = useState<AuthMode>('signin');
  const [loginMethod, setLoginMethod] = useState<'password' | 'magiclink'>('magiclink');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);
  const navigate = useNavigate();

  React.useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate('/dashboard');
      }
    });
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setMessage({ type: 'success', text: 'Account created! Please check your email to confirm your account.' });
      } else {
        if (loginMethod === 'magiclink') {
          console.log(`[Supabase Auth] Attempting signInWithOtp for: ${email}`);
          const redirectUrl = `${window.location.origin}/auth/callback`;
          console.log(`[Supabase Auth] Redirect URL configured as: ${redirectUrl}`);

          const { data, error } = await supabase.auth.signInWithOtp({
            email,
            options: {
              emailRedirectTo: redirectUrl,
            },
          });

          if (error) {
            console.error('[Supabase Auth] signInWithOtp returned an error:', {
              message: error.message,
              status: error.status,
              name: error.name,
              errorObject: error
            });
            throw error;
          }

          console.log('[Supabase Auth] signInWithOtp successful:', data);
          setMessage({ type: 'success', text: 'Magic link sent! Please check your email inbox to log in.' });
        } else {
          const { error } = await supabase.auth.signInWithPassword({ email, password });
          if (error) throw error;
          navigate('/dashboard');
        }
      }
    } catch (err: any) {
      console.error('[Supabase Auth] Caught error during authentication:', {
        message: err.message,
        status: err.status,
        name: err.name,
        code: err.code,
        fullError: err
      });

      const errorText = err.status 
        ? `${err.message} (Error Code / Status: ${err.status})`
        : err.message || 'Authentication failed.';

      setMessage({ type: 'error', text: errorText });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-slate-950 flex items-center justify-center px-4 font-sans overflow-hidden">
      {/* Background orbs */}
      <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyan-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md z-10"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-4 group outline-none">
            <LineChart className="w-7 h-7 text-cyan-400 group-hover:text-cyan-300 transition-colors" />
            <span className="font-bold text-2xl tracking-wide text-white group-hover:text-slate-200 transition-colors">
              DayZero <span className="text-cyan-400 group-hover:text-cyan-300 transition-colors">AI</span>
            </span>
          </Link>
          <div className="flex justify-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-sm font-medium">
              <Sparkles className="w-4 h-4" />
              <span>AI-Powered VC Validation</span>
            </div>
          </div>
        </div>

        {/* Glass Card */}
        <div className="glass-card rounded-2xl p-1 relative shadow-[0_8px_60px_rgba(6,182,212,0.15)]">
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />

          <div className="relative bg-slate-900/60 rounded-xl p-8 backdrop-blur-2xl">
            {/* Mode Toggle Tabs */}
            <div className="flex rounded-xl bg-slate-800/60 p-1 mb-6 gap-1">
              {(['signin', 'signup'] as AuthMode[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => { setMode(m); setMessage(null); }}
                  className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all duration-300 flex items-center justify-center gap-2 ${
                    mode === m
                      ? 'bg-gradient-to-r from-cyan-600 to-indigo-600 text-white shadow-[0_0_15px_rgba(6,182,212,0.3)]'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {m === 'signin' ? <LogIn className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                  {m === 'signin' ? 'Sign In' : 'Sign Up'}
                </button>
              ))}
            </div>

            {/* Login Method Toggle (only shown for signin) */}
            {mode === 'signin' && (
              <div className="flex rounded-lg bg-slate-800/40 p-0.5 mb-6 gap-1 border border-white/5">
                <button
                  type="button"
                  onClick={() => { setLoginMethod('magiclink'); setMessage(null); }}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all duration-200 ${
                    loginMethod === 'magiclink'
                      ? 'bg-slate-700/80 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Magic Link (OTP)
                </button>
                <button
                  type="button"
                  onClick={() => { setLoginMethod('password'); setMessage(null); }}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all duration-200 ${
                    loginMethod === 'password'
                      ? 'bg-slate-700/80 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Password
                </button>
              </div>
            )}

            <AnimatePresence mode="wait">
              <motion.div
                key={`${mode}-${loginMethod}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
                className="mb-6"
              >
                <h2 className="text-xl font-bold text-white mb-1">
                  {mode === 'signin' 
                    ? (loginMethod === 'magiclink' ? 'Sign in with Magic Link' : 'Welcome back') 
                    : 'Create your account'}
                </h2>
                <p className="text-slate-400 text-sm">
                  {mode === 'signin'
                    ? (loginMethod === 'magiclink' 
                        ? 'Enter your email to receive a secure passwordless login link.'
                        : 'Sign in to access your validated startup ideas.')
                    : 'Join to start validating your startup ideas with AI.'}
                </p>
              </motion.div>
            </AnimatePresence>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input
                  id="auth-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-800/60 border border-white/10 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/30 transition-all"
                />
              </div>

              {/* Password */}
              {(mode === 'signup' || (mode === 'signin' && loginMethod === 'password')) && (
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input
                    id="auth-password"
                    type={showPassword ? 'text' : 'password'}
                    required={mode === 'signup' || (mode === 'signin' && loginMethod === 'password')}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    minLength={6}
                    className="w-full pl-11 pr-12 py-3 rounded-xl bg-slate-800/60 border border-white/10 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/30 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              )}

              {/* Message */}
              <AnimatePresence>
                {message && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className={`text-sm px-4 py-3 rounded-xl border font-medium ${
                      message.type === 'error'
                        ? 'text-red-300 bg-red-500/10 border-red-500/20 break-words'
                        : 'text-emerald-300 bg-emerald-500/10 border-emerald-500/20'
                    }`}
                  >
                    {message.text}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Submit Button */}
              <motion.button
                type="submit"
                disabled={loading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-3.5 rounded-xl font-bold text-white bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_30px_rgba(6,182,212,0.5)] disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                ) : mode === 'signin' ? (
                  loginMethod === 'magiclink' ? (
                    <><LogIn className="w-4 h-4" /> Send Magic Link</>
                  ) : (
                    <><LogIn className="w-4 h-4" /> Sign In</>
                  )
                ) : (
                  <><UserPlus className="w-4 h-4" /> Create Account</>
                )}
              </motion.button>
            </form>

            <p className="text-center text-slate-500 text-xs mt-6">
              By continuing, you agree to our{' '}
              <a href="#" className="text-cyan-500 hover:underline">Terms of Service</a>.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
