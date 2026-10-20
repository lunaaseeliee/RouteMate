import React, { useState, useEffect } from 'react';
import { 
  Mail, 
  MailCheck, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle2, 
  LogOut, 
  ArrowRight,
  ShieldCheck,
  Clock
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { checkEmailVerification, resendVerificationEmail } from '../../services/authService';

interface VerifyEmailViewProps {
  onVerified: () => void;
  onNavigate: (view: string) => void;
}

export const VerifyEmailView: React.FC<VerifyEmailViewProps> = ({ onVerified, onNavigate }) => {
  const { user, signOut, refreshProfile } = useAuth();
  const [checking, setChecking] = useState<boolean>(false);
  const [resending, setResending] = useState<boolean>(false);
  const [resendCooldown, setResendCooldown] = useState<number>(0);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Cooldown countdown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Check verification on initial mount if already verified
  useEffect(() => {
    if (user?.emailVerified) {
      onVerified();
    }
  }, [user, onVerified]);

  const handleCheckVerification = async () => {
    if (!user) {
      onNavigate('login');
      return;
    }

    setChecking(true);
    setStatusMessage(null);

    try {
      const isVerified = await checkEmailVerification(user);
      await refreshProfile();

      if (isVerified) {
        setStatusMessage({
          type: 'success',
          text: 'Email verified successfully! Welcome to RouteMate.'
        });
        setTimeout(() => {
          onVerified();
        }, 1000);
      } else {
        setStatusMessage({
          type: 'error',
          text: 'Your email is not verified yet. Please check your inbox (and spam/junk folder), click the link, and try again.'
        });
      }
    } catch (err: any) {
      console.error('Email check error:', err);
      setStatusMessage({
        type: 'error',
        text: err?.message || 'Could not verify email status. Please try again.'
      });
    } finally {
      setChecking(false);
    }
  };

  const handleResendEmail = async () => {
    if (!user) return;
    if (resendCooldown > 0) return;

    setResending(true);
    setStatusMessage(null);

    try {
      await resendVerificationEmail(user);
      setResendCooldown(60);
      setStatusMessage({
        type: 'info',
        text: `A new verification email has been sent to ${user.email}. Please check your inbox.`
      });
    } catch (err: any) {
      console.error('Resend email error:', err);
      setStatusMessage({
        type: 'error',
        text: err?.message || 'Failed to resend verification email. Please wait a moment and try again.'
      });
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950 py-10">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 text-center">
        
        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-400/20 text-indigo-600 dark:text-indigo-400 text-xs font-bold">
            <span>Step 1 of 1</span>
            <span>•</span>
            <span>Email Verification</span>
          </div>
        </div>

        {/* Icon */}
        <div className="w-16 h-16 rounded-3xl bg-indigo-400/20 text-indigo-500 flex items-center justify-center mx-auto mb-5 ring-8 ring-indigo-400/10">
          <MailCheck className="w-8 h-8" />
        </div>

        <h2 className="text-2xl sm:text-3xl font-extrabold font-display text-slate-950 dark:text-white">
          Verify Your Email
        </h2>
        
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 mb-2">
          We sent an official verification link to:
        </p>
        
        <div className="inline-block px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 font-mono text-xs font-bold mb-5 break-all border border-slate-200 dark:border-slate-700">
          {user?.email || 'your email address'}
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-6">
          Please open the email from Firebase / RouteMate and click the verification link. Once verified, click the button below to proceed to the app.
        </p>

        {/* Status Message Notification */}
        {statusMessage && (
          <div className={`mb-6 p-4 rounded-2xl text-xs text-left flex items-start gap-2.5 ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700/80 text-emerald-900 dark:text-emerald-200'
              : statusMessage.type === 'error'
                ? 'bg-red-50 dark:bg-red-950/40 border border-red-300 dark:border-red-700/80 text-red-900 dark:text-red-200'
                : 'bg-blue-50 dark:bg-blue-950/40 border border-blue-300 dark:border-blue-700/80 text-blue-900 dark:text-blue-200'
          }`}>
            {statusMessage.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />}
            {statusMessage.type === 'error' && <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />}
            {statusMessage.type === 'info' && <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />}
            <span className="font-medium leading-relaxed">{statusMessage.text}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            type="button"
            onClick={handleCheckVerification}
            disabled={checking}
            className="w-full py-3.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm transition-all shadow-md shadow-indigo-400/20 active:scale-98 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {checking ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Checking Verification Status...</span>
              </>
            ) : (
              <>
                <span>I Have Verified My Email</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleResendEmail}
            disabled={resending || resendCooldown > 0}
            className="w-full py-3 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {resending ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : resendCooldown > 0 ? (
              <Clock className="w-3.5 h-3.5 text-slate-400" />
            ) : (
              <Mail className="w-3.5 h-3.5" />
            )}
            <span>
              {resendCooldown > 0 ? `Resend email in ${resendCooldown}s` : 'Resend Verification Email'}
            </span>
          </button>
        </div>

        {/* Log Out and Skip options */}
        <div className="mt-8 pt-5 border-t border-slate-100 dark:border-slate-800 space-y-3 text-xs text-slate-500 dark:text-slate-400">
          <div>
            <button
              type="button"
              onClick={() => onNavigate('home')}
              className="font-bold text-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 underline underline-offset-2"
            >
              Skip email confirmation &amp; Go to Dashboard →
            </button>
          </div>
          <div className="flex items-center justify-between pt-2">
            <span>Wrong email address?</span>
            <button
              type="button"
              onClick={() => {
                signOut();
                onNavigate('login');
              }}
              className="font-bold text-red-500 hover:text-red-600 flex items-center gap-1 hover:underline"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out &amp; Try Again</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
