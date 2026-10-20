import { Brand } from '../common/Brand';
import { AuthStory } from '../common/AuthStory';
import React, { useState, useEffect } from 'react';
import { 
  LogIn, 
  Mail, 
  Lock, 
  AlertCircle, 
  KeyRound,
  ArrowRight,
  ShieldAlert
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { loginWithEmail, loginWithGoogle } from '../../services/authService';
import { ForgotPasswordModal } from './ForgotPasswordModal';

interface LoginViewProps {
  onNavigate: (view: string, data?: any) => void;
  initialEmail?: string;
}

export const LoginView: React.FC<LoginViewProps> = ({ onNavigate, initialEmail = '' }) => {
  const { refreshProfile } = useAuth();
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);

  useEffect(() => {
    if (initialEmail) {
      setEmail(initialEmail);
    }
  }, [initialEmail]);

  const handleGoogleLogin = async () => {
    setError(null);
    setGoogleLoading(true);
    try {
      const profile = await loginWithGoogle();
      await refreshProfile();

      if (profile.accountStatus === 'suspended' || profile.isSuspended) {
        setError('Your account has been suspended by an administrator. Please contact support.');
        setGoogleLoading(false);
        return;
      }

      // Google accounts already have a verified Google email.
      if (profile.role === 'admin') {
        onNavigate('admin-dashboard');
      } else {
        onNavigate('home');
      }
    } catch (err: any) {
      console.error('Google login error:', err);
      setError(err?.message || 'Google sign-in failed. Please try again.');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError('Please enter both your email address and password.');
      return;
    }
    
    setError(null);
    setLoading(true);
    
    try {
      const { user: loggedInUser, profile } = await loginWithEmail(email.trim(), password);
      await refreshProfile();

      // Check account suspension status
      if (profile.accountStatus === 'suspended' || profile.isSuspended) {
        setError('Your account has been suspended by an administrator. Please contact support for assistance.');
        setLoading(false);
        return;
      }

      // Enforce RouteMate's email verification before app access.
      if (!loggedInUser.emailVerified && !profile.emailVerified) {
        onNavigate('verify-email');
      } else if (profile.role === 'admin') {
        onNavigate('admin-dashboard');
      } else {
        onNavigate('home');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err?.message || 'Invalid credentials. Please check your email and password.');
    } finally {
      setLoading(false);
    }
  };

  const isProviderDisabled = error?.includes('Firebase Console') || error?.includes('operation-not-allowed') || error?.includes('Email/Password provider is not enabled');

  return (
    <div className="rm-auth-layout"><AuthStory/>
      <div className="rm-auth-form w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-800">
        
        {/* Brand Header */}
        <div className="text-center mb-8">
          <Brand compact className="auth-form-brand"/>
          <h2 className="text-2xl sm:text-3xl font-extrabold font-display text-slate-950 dark:text-white">
            Welcome Back
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
            Your next journey is waiting. Let’s get you signed in.
          </p>
        </div>

        {/* 1-Click Google Sign-In */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={googleLoading || loading}
          className="w-full py-3 px-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-100 font-bold text-sm transition-all shadow-sm active:scale-98 flex items-center justify-center gap-3 disabled:opacity-50 mb-4"
        >
          {googleLoading ? (
            <span className="animate-spin rounded-full h-4 w-4 border-2 border-indigo-500 border-t-transparent" />
          ) : (
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
          )}
          <span>Continue with Google</span>
        </button>

        {/* Divider */}
        <div className="relative my-5">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200 dark:border-slate-800" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white dark:bg-slate-900 px-3 text-slate-400 font-bold">
              or with email & password
            </span>
          </div>
        </div>

        {/* Error notification */}
        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-300 dark:border-red-700/80 text-xs text-red-900 dark:text-red-200 space-y-2">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
              <span className="font-medium leading-relaxed">{error}</span>
            </div>
            {isProviderDisabled && (
              <div className="pt-2 border-t border-red-200 dark:border-red-800/60 text-[11px] space-y-1.5 text-slate-700 dark:text-slate-300">
                <div className="font-bold text-red-700 dark:text-red-300 flex items-center gap-1">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Alternative Sign-In:</span>
                </div>
                <p>
                  You can click <strong>"Continue with Google"</strong> above to sign in immediately without email configuration!
                </p>
                <div className="p-2 rounded-lg bg-red-100/70 dark:bg-red-900/40 font-mono text-[10px] text-slate-800 dark:text-slate-200">
                  To enable Email/Password: Firebase Console &gt; Authentication &gt; Sign-in method &gt; Enable "Email/Password".
                </div>
              </div>
            )}
          </div>
        )}

        {/* Email & Password Form */}
        <form onSubmit={handleEmailLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                required
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Password
              </label>
              <button
                type="button"
                onClick={() => setIsForgotModalOpen(true)}
                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline inline-flex items-center gap-1"
              >
                <KeyRound className="w-3 h-3" />
                <span>Forgot Password?</span>
              </button>
            </div>
            
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || googleLoading}
            className="w-full py-3.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm transition-all shadow-md shadow-indigo-400/20 active:scale-98 flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
          >
            {loading ? (
              <span className="animate-spin rounded-full h-4 w-4 border-2 border-slate-950 border-t-transparent" />
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                <span>Sign In with Email</span>
              </>
            )}
          </button>
        </form>

        {/* Register Link */}
        <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 text-center text-xs text-slate-500 dark:text-slate-400">
          Don't have an account?{' '}
          <button
            onClick={() => onNavigate('register', { email })}
            className="font-bold text-indigo-500 hover:text-indigo-600 hover:underline ml-1"
          >
            Create an account
          </button>
        </div>
      </div>

      {/* Forgot Password Modal */}
      <ForgotPasswordModal
        isOpen={isForgotModalOpen}
        onClose={() => setIsForgotModalOpen(false)}
        initialEmail={email}
      />
    </div>
  );
};

