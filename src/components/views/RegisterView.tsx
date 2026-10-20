import { Brand } from '../common/Brand';
import { AuthStory } from '../common/AuthStory';
import React, { useState, useEffect } from 'react';
import { 
  UserPlus, 
  Mail, 
  Lock, 
  User, 
  Phone, 
  Car, 
  AlertCircle,
  ShieldCheck,
  Check,
  ArrowRight,
  ShieldAlert
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { registerWithEmail, loginWithGoogle } from '../../services/authService';

interface RegisterViewProps {
  onNavigate: (view: string, data?: any) => void;
  initialEmail?: string;
}

const COUNTRY_CODES = [
  { code: '+91', country: 'India', flag: '🇮🇳' },
  { code: '+1', country: 'United States', flag: '🇺🇸' },
  { code: '+44', country: 'United Kingdom', flag: '🇬🇧' },
  { code: '+1', country: 'Canada', flag: '🇨🇦' },
  { code: '+61', country: 'Australia', flag: '🇦🇺' },
  { code: '+971', country: 'UAE', flag: '🇦🇪' },
  { code: '+65', country: 'Singapore', flag: '🇸🇬' },
  { code: '+49', country: 'Germany', flag: '🇩🇪' },
  { code: '+33', country: 'France', flag: '🇫🇷' },
  { code: '+81', country: 'Japan', flag: '🇯🇵' },
  { code: '+966', country: 'Saudi Arabia', flag: '🇸🇦' },
];

export const RegisterView: React.FC<RegisterViewProps> = ({ onNavigate, initialEmail = '' }) => {
  const { refreshProfile } = useAuth();
  
  // Required registration form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  const [phone, setPhone] = useState('');
  
  // Driver / Rider role
  const [isDriver, setIsDriver] = useState(false);
  const [make, setMake] = useState('Toyota');
  const [model, setModel] = useState('Camry');
  const [color, setColor] = useState('Silver');
  const [licensePlate, setLicensePlate] = useState('RM-9921');
  const [seats, setSeats] = useState(4);

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialEmail) {
      setEmail(initialEmail);
    }
  }, [initialEmail]);

  const handleGoogleSignUp = async () => {
    setError(null);
    setGoogleLoading(true);
    try {
      const profile = await loginWithGoogle();
      await refreshProfile();

      if (profile.accountStatus === 'suspended' || profile.isSuspended) {
        setError('Your account has been suspended. Please contact support.');
        setGoogleLoading(false);
        return;
      }

      if (profile.role === 'admin') {
        onNavigate('admin-dashboard');
      } else {
        onNavigate('home');
      }
    } catch (err: any) {
      console.error('Google Sign-Up error:', err);
      setError(err?.message || 'Google registration failed. Please try again.');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim() || !email.trim() || !password || !confirmPassword) {
      setError('Please fill in all required fields.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please re-enter your password.');
      return;
    }

    let fullPhoneNumber = '';
    if (phone.trim()) {
      const cleanPhoneDigits = phone.replace(/\D/g, '');
      if (cleanPhoneDigits.length < 7 || cleanPhoneDigits.length > 15) {
        setError('Please enter a valid phone number (7 to 15 digits).');
        return;
      }
      fullPhoneNumber = `${countryCode}${cleanPhoneDigits}`;
    }

    setError(null);
    setLoading(true);

    try {
      const vehicle = isDriver ? {
        make,
        model,
        color,
        licensePlate,
        seats: Number(seats)
      } : undefined;

      await registerWithEmail(
        email.trim(), 
        password, 
        name.trim(), 
        fullPhoneNumber, 
        isDriver, 
        vehicle
      );
      
      await refreshProfile();
      onNavigate('verify-email');
    } catch (err: any) {
      console.error('Registration error:', err);
      setError(err?.message || 'Registration could not be completed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const isAlreadyRegistered = error?.toLowerCase().includes('already registered') || error?.includes('email-already-in-use');
  const isProviderDisabled = error?.includes('Firebase Console') || error?.includes('operation-not-allowed') || error?.includes('Email/Password provider is not enabled');

  return (
    <div className="rm-auth-layout"><AuthStory/>
      <div className="rm-auth-form w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-800">
        
        {/* Header */}
        <div className="text-center mb-6">
          <Brand compact className="auth-form-brand"/>
          <h2 className="text-2xl sm:text-3xl font-extrabold font-display text-slate-950 dark:text-white">
            Create Your Account
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
            Email verification protects both commuters and drivers
          </p>
        </div>

        {/* 1-Click Google Sign-Up */}
        <button
          type="button"
          onClick={handleGoogleSignUp}
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
          <span>Sign up with Google</span>
        </button>

        {/* Divider */}
        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200 dark:border-slate-800" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white dark:bg-slate-900 px-3 text-slate-400 font-bold">
              or register with email & phone
            </span>
          </div>
        </div>

        {/* Error notification */}
        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-300 dark:border-red-700/80 flex flex-col gap-2 text-xs text-red-900 dark:text-red-200">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
              <span className="font-medium leading-relaxed">{error}</span>
            </div>

            {isAlreadyRegistered && (
              <div className="pl-6.5 pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onNavigate('login', { email })}
                  className="px-3.5 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-700 transition-colors inline-flex items-center gap-1.5 shadow-sm"
                >
                  <span>Sign In with {email || 'this email'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {isProviderDisabled && (
              <div className="pt-2 border-t border-red-200 dark:border-red-800/60 text-[11px] space-y-1.5 text-slate-700 dark:text-slate-300 pl-6.5">
                <div className="font-bold text-red-700 dark:text-red-300 flex items-center gap-1">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Instant Setup Solution:</span>
                </div>
                <p>
                  You can click <strong>"Sign up with Google"</strong> above to register immediately!
                </p>
                <div className="p-2 rounded-lg bg-red-100/70 dark:bg-red-900/40 font-mono text-[10px] text-slate-800 dark:text-slate-200">
                  To enable Email/Password: Firebase Console &gt; Authentication &gt; Sign-in method &gt; Enable "Email/Password".
                </div>
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          
          {/* Full Name */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Full Name *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                required
                placeholder="Alex Rivera"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
          </div>

          {/* Email Address */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Email Address *
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
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
          </div>

          {/* Country Code & Phone Number */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Country & Phone Number (Optional)
            </label>
            <div className="flex gap-2">
              <select
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
                className="px-2.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
              >
                {COUNTRY_CODES.map((item) => (
                  <option key={`${item.country}-${item.code}`} value={item.code}>
                    {item.flag} {item.code}
                  </option>
                ))}
              </select>

              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Phone className="w-4 h-4" />
                </div>
                <input
                  type="tel"
                  placeholder="9876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>
            </div>
          </div>

          {/* Password & Confirm Password */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Password *
              </label>
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
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Confirm Password *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 ${
                    confirmPassword && password !== confirmPassword 
                      ? 'border-red-400 focus:ring-red-400' 
                      : 'border-slate-200 dark:border-slate-700 focus:ring-indigo-400'
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Role selector: Rider or Driver */}
          <div className="pt-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
              How will you use RouteMate?
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setIsDriver(false)}
                className={`p-3 rounded-2xl border text-left transition-all ${
                  !isDriver
                    ? 'border-indigo-400 bg-indigo-400/10 text-slate-950 dark:text-white ring-2 ring-indigo-400/40'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
              >
                <span className="text-xl mb-1 block">🎒</span>
                <p className="text-xs font-bold">Rider</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Looking to join existing routes</p>
              </button>

              <button
                type="button"
                onClick={() => setIsDriver(true)}
                className={`p-3 rounded-2xl border text-left transition-all ${
                  isDriver
                    ? 'border-indigo-400 bg-indigo-400/10 text-slate-950 dark:text-white ring-2 ring-indigo-400/40'
                    : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
              >
                <span className="text-xl mb-1 block">🚗</span>
                <p className="text-xs font-bold">Driver / Car Owner</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Offer seats & split trip costs</p>
              </button>
            </div>
          </div>

          {/* Driver Vehicle Details section */}
          {isDriver && (
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 space-y-3 animate-in fade-in duration-200">
              <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                <Car className="w-4 h-4" />
                Vehicle Specifications
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">Make</label>
                  <input
                    type="text"
                    value={make}
                    onChange={(e) => setMake(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">Model</label>
                  <input
                    type="text"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">License Plate</label>
                  <input
                    type="text"
                    value={licensePlate}
                    onChange={(e) => setLicensePlate(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white uppercase font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">Available Seats</label>
                  <select
                    value={seats}
                    onChange={(e) => setSeats(Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs text-slate-900 dark:text-white"
                  >
                    {[1, 2, 3, 4, 5, 6].map(n => (
                      <option key={n} value={n}>{n} {n === 1 ? 'seat' : 'seats'}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          <div className="p-3 rounded-2xl bg-indigo-400/10 border border-indigo-400/30 flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300">
            <ShieldCheck className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
            <span>
              After registering, you will need to verify your <strong>email address</strong>.
            </span>
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
                <UserPlus className="w-4 h-4" />
                <span>Create Account & Verify</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400">
          Already registered?{' '}
          <button
            onClick={() => onNavigate('login', { email })}
            className="font-bold text-indigo-500 hover:text-indigo-600 hover:underline ml-1"
          >
            Log in here
          </button>
        </div>
      </div>
    </div>
  );
};

