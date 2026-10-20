import React, { useState, useEffect, useRef } from 'react';
import { 
  Phone, 
  ShieldCheck, 
  ArrowRight, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Smartphone, 
  Edit2,
  Lock
} from 'lucide-react';
import { RecaptchaVerifier, ConfirmationResult } from 'firebase/auth';
import { auth } from '../../lib/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { 
  sendPhoneVerificationCode, 
  confirmPhoneOtpAndComplete 
} from '../../services/authService';

interface VerifyPhoneViewProps {
  onVerified: () => void;
  onNavigate: (view: string) => void;
}

const COUNTRY_CODES = [
  { code: '+91', country: 'India', flag: '🇮🇳', defaultLength: 10 },
  { code: '+1', country: 'United States', flag: '🇺🇸', defaultLength: 10 },
  { code: '+44', country: 'United Kingdom', flag: '🇬🇧', defaultLength: 10 },
  { code: '+1', country: 'Canada', flag: '🇨🇦', defaultLength: 10 },
  { code: '+61', country: 'Australia', flag: '🇦🇺', defaultLength: 9 },
  { code: '+971', country: 'UAE', flag: '🇦🇪', defaultLength: 9 },
  { code: '+65', country: 'Singapore', flag: '🇸🇬', defaultLength: 8 },
  { code: '+49', country: 'Germany', flag: '🇩🇪', defaultLength: 10 },
  { code: '+33', country: 'France', flag: '🇫🇷', defaultLength: 9 },
  { code: '+81', country: 'Japan', flag: '🇯🇵', defaultLength: 10 },
  { code: '+966', country: 'Saudi Arabia', flag: '🇸🇦', defaultLength: 9 },
];

export const VerifyPhoneView: React.FC<VerifyPhoneViewProps> = ({ onVerified, onNavigate }) => {
  const { user, profile, refreshProfile } = useAuth();
  
  // Country & phone input state
  const [selectedCountryCode, setSelectedCountryCode] = useState<string>('+91');
  const [rawPhone, setRawPhone] = useState<string>(() => {
    if (profile?.phoneNumber) {
      // Strip country code if present
      const match = COUNTRY_CODES.find(c => profile.phoneNumber?.startsWith(c.code));
      if (match) {
        return profile.phoneNumber.replace(match.code, '').trim();
      }
      return profile.phoneNumber.replace(/^\+/, '').trim();
    }
    return '';
  });

  // Verification flow state
  const [step, setStep] = useState<'input_phone' | 'enter_otp'>('input_phone');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [loading, setLoading] = useState<boolean>(false);
  const [cooldown, setCooldown] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Recaptcha ref
  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);
  const otpInputsRef = useRef<(HTMLInputElement | null)[]>([]);

  // Timer countdown
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  // Clean up recaptcha verifier on unmount
  useEffect(() => {
    return () => {
      if (recaptchaVerifierRef.current) {
        try {
          recaptchaVerifierRef.current.clear();
        } catch (e) {
          // ignore cleanup error
        }
      }
    };
  }, []);

  const getFullPhoneNumber = (): string => {
    const cleanedDigits = rawPhone.replace(/\D/g, '');
    return `${selectedCountryCode}${cleanedDigits}`;
  };

  const initRecaptcha = (): RecaptchaVerifier => {
    if (recaptchaVerifierRef.current) {
      try {
        recaptchaVerifierRef.current.clear();
      } catch (e) {
        // clear old instance
      }
    }
    
    const verifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
      size: 'invisible',
      callback: () => {
        // reCAPTCHA solved
      },
      'expired-callback': () => {
        setError('reCAPTCHA expired. Please try sending the SMS code again.');
      }
    });

    recaptchaVerifierRef.current = verifier;
    return verifier;
  };

  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!user) {
      onNavigate('login');
      return;
    }

    const cleaned = rawPhone.replace(/\D/g, '');
    if (cleaned.length < 7 || cleaned.length > 15) {
      setError('Please enter a valid phone number with 7 to 15 digits.');
      return;
    }

    const fullPhone = getFullPhoneNumber();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      const verifier = initRecaptcha();
      const confirmation = await sendPhoneVerificationCode(user, fullPhone, verifier);
      setConfirmationResult(confirmation);
      setStep('enter_otp');
      setCooldown(60);
      setSuccessMsg(`SMS verification code sent to ${fullPhone}.`);
      setOtpDigits(['', '', '', '', '', '']);
      
      // Auto-focus first digit input after render
      setTimeout(() => {
        otpInputsRef.current[0]?.focus();
      }, 300);
    } catch (err: any) {
      console.error('Send OTP failed:', err);
      setError(err?.message || 'Failed to send SMS code. Please check your phone number and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index: number, val: string) => {
    const cleanVal = val.replace(/\D/g, '');
    
    // Handle paste event of entire 6-digit code
    if (cleanVal.length > 1) {
      const pastedDigits = cleanVal.slice(0, 6).split('');
      const newDigits = [...otpDigits];
      pastedDigits.forEach((d, i) => {
        if (i < 6) newDigits[i] = d;
      });
      setOtpDigits(newDigits);
      const nextIndex = Math.min(pastedDigits.length, 5);
      otpInputsRef.current[nextIndex]?.focus();
      return;
    }

    const newDigits = [...otpDigits];
    newDigits[index] = cleanVal;
    setOtpDigits(newDigits);

    // Auto-advance cursor
    if (cleanVal && index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const fullOtp = otpDigits.join('');

    if (fullOtp.length !== 6) {
      setError('Please enter the full 6-digit SMS verification code.');
      return;
    }

    if (!confirmationResult) {
      setError('No pending SMS verification. Please request a new verification code.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const fullPhone = getFullPhoneNumber();
      await confirmPhoneOtpAndComplete(confirmationResult, fullOtp, fullPhone);
      await refreshProfile();

      setSuccessMsg('Phone verified & linked successfully! Welcome to RouteMate.');
      setTimeout(() => {
        onVerified();
      }, 1000);
    } catch (err: any) {
      console.error('OTP confirmation failed:', err);
      setError(err?.message || 'Invalid or expired SMS code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-950 py-10">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-800 text-center">
        
        {/* Invisible Recaptcha Container */}
        <div id="recaptcha-container" />

        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-400/20 text-indigo-600 dark:text-indigo-400 text-xs font-bold">
            <span>Phone Verification</span>
            <span>•</span>
            <span>Optional</span>
          </div>
        </div>

        {/* Icon */}
        <div className="w-16 h-16 rounded-3xl bg-indigo-400/20 text-indigo-500 flex items-center justify-center mx-auto mb-5 ring-8 ring-indigo-400/10">
          <Smartphone className="w-8 h-8" />
        </div>

        <h2 className="text-2xl sm:text-3xl font-extrabold font-display text-slate-950 dark:text-white">
          {step === 'input_phone' ? 'Verify Your Phone' : 'Enter SMS Code'}
        </h2>
        
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-2 mb-6">
          {step === 'input_phone' 
            ? 'We will send a real 6-digit SMS verification code to link your phone to your account.'
            : `Enter the 6-digit verification code sent to ${getFullPhoneNumber()}`
          }
        </p>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-300 dark:border-red-700/80 text-left text-xs text-red-900 dark:text-red-200 space-y-2">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
              <span className="font-medium leading-relaxed">{error}</span>
            </div>
            {error.includes('Firebase Console') && (
              <div className="text-[11px] text-red-800 dark:text-red-300 font-semibold pl-6.5">
                Go to Firebase Console &gt; Authentication &gt; Sign-in method &gt; Enable "Phone" provider.
              </div>
            )}
          </div>
        )}

        {/* Success Alert */}
        {successMsg && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700/80 text-left text-xs text-emerald-900 dark:text-emerald-200 flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <span className="font-medium leading-relaxed">{successMsg}</span>
          </div>
        )}

        {/* STAGE 1: Phone Number Input */}
        {step === 'input_phone' && (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div className="text-left">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Country & Phone Number
              </label>
              
              <div className="flex gap-2">
                {/* Country Code Select */}
                <select
                  value={selectedCountryCode}
                  onChange={(e) => setSelectedCountryCode(e.target.value)}
                  className="px-3 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
                >
                  {COUNTRY_CODES.map((item) => (
                    <option key={`${item.country}-${item.code}`} value={item.code}>
                      {item.flag} {item.code} ({item.country})
                    </option>
                  ))}
                </select>

                {/* Raw Phone Input */}
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Phone className="w-4 h-4" />
                  </div>
                  <input
                    type="tel"
                    required
                    placeholder="9876543210"
                    value={rawPhone}
                    onChange={(e) => setRawPhone(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !rawPhone.trim()}
              className="w-full py-3.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm transition-all shadow-md shadow-indigo-400/20 active:scale-98 flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Sending SMS Verification Code...</span>
                </>
              ) : (
                <>
                  <span>Send SMS Code</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* STAGE 2: 6-Digit OTP Input */}
        {step === 'enter_otp' && (
          <form onSubmit={handleVerifyOtp} className="space-y-6">
            
            {/* Phone Display with Edit Button */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs">
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-indigo-500" />
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  {getFullPhoneNumber()}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setStep('input_phone');
                  setError(null);
                  setSuccessMsg(null);
                }}
                className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline flex items-center gap-1 text-[11px]"
              >
                <Edit2 className="w-3 h-3" />
                <span>Change Number</span>
              </button>
            </div>

            {/* 6 Individual Digit Inputs */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-3 text-center">
                6-Digit Verification Code
              </label>
              
              <div className="flex justify-center items-center gap-2 sm:gap-3">
                {otpDigits.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => (otpInputsRef.current[idx] = el)}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                    className="w-11 h-13 sm:w-12 sm:h-14 text-center font-mono text-xl sm:text-2xl font-extrabold rounded-2xl bg-slate-50 dark:bg-slate-800/80 border-2 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 transition-all"
                  />
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || otpDigits.some(d => !d)}
              className="w-full py-3.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm transition-all shadow-md shadow-indigo-400/20 active:scale-98 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Verifying Code & Linking Phone...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Verify & Access RouteMate</span>
                </>
              )}
            </button>

            {/* Resend SMS Button with Cooldown */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => handleSendOtp()}
                disabled={loading || cooldown > 0}
                className="text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors inline-flex items-center gap-1.5 disabled:opacity-50"
              >
                {cooldown > 0 ? (
                  <>
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Resend SMS code in {cooldown}s</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Didn't receive SMS? Resend Code</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* Non-blocking skip / continue link */}
        <div className="mt-6 pt-5 border-t border-slate-100 dark:border-slate-800 text-center">
          <p className="text-xs text-slate-500 mb-2">Phone verification is optional during development.</p>
          <button
            type="button"
            onClick={() => onNavigate('home')}
            className="text-xs font-bold text-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 underline underline-offset-2"
          >
            Skip for now &amp; Go to Dashboard →
          </button>
        </div>

      </div>
    </div>
  );
};
