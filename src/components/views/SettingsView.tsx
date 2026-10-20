import React, { useState } from 'react';
import {
  Settings as SettingsIcon,
  Moon,
  Sun,
  Bell,
  ShieldCheck,
  Lock,
  UserX,
  HelpCircle,
  Check,
  Smartphone,
  Globe,
  Trash2
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface SettingsViewProps {
  onNavigate: (view: string) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onNavigate }) => {
  const { theme, toggleTheme, user, profile, signOut } = useAuth();

  const [emailNotifs, setEmailNotifs] = useState(true);
  const [pushNotifs, setPushNotifs] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [currency, setCurrency] = useState('USD');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSavePreferences = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-slate-950 dark:text-white">
          Application Settings
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Personalize your display mode, notifications, security, and account preferences.
        </p>
      </div>

      {savedSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
          <Check className="w-4 h-4" />
          <span>Your preferences have been saved.</span>
        </div>
      )}

      <div className="space-y-6">

        {/* Appearance Section */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-xl border border-slate-200 dark:border-slate-800 space-y-4">
          <h2 className="text-base font-bold font-display text-slate-950 dark:text-white flex items-center gap-2">
            {theme === 'dark' ? <Moon className="w-4 h-4 text-indigo-400" /> : <Sun className="w-4 h-4 text-indigo-500" />}
            Theme & Appearance
          </h2>

          <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60">
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-white">Dark / Light Mode</p>
              <p className="text-xs text-slate-500">Currently set to {theme} theme.</p>
            </div>

            <button
              onClick={toggleTheme}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-all shadow-sm flex items-center gap-1.5"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              <span>Switch to {theme === 'dark' ? 'Light' : 'Dark'}</span>
            </button>
          </div>
        </div>

        {/* Notifications Section */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-xl border border-slate-200 dark:border-slate-800 space-y-4">
          <h2 className="text-base font-bold font-display text-slate-950 dark:text-white flex items-center gap-2">
            <Bell className="w-4 h-4 text-indigo-400" />
            Communication & Alerts
          </h2>

          <div className="space-y-3">
            <label className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 cursor-pointer">
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">Email Route Updates</p>
                <p className="text-xs text-slate-500">Receive departure reminders and booking receipts.</p>
              </div>
              <input
                type="checkbox"
                checked={emailNotifs}
                onChange={(e) => setEmailNotifs(e.target.checked)}
                className="w-5 h-5 accent-indigo-400 rounded cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 cursor-pointer">
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">In-App Ride Match Notifications</p>
                <p className="text-xs text-slate-500">Instant alerts when a driver accepts your request.</p>
              </div>
              <input
                type="checkbox"
                checked={pushNotifs}
                onChange={(e) => setPushNotifs(e.target.checked)}
                className="w-5 h-5 accent-indigo-400 rounded cursor-pointer"
              />
            </label>
          </div>
        </div>

        {/* Security & Account */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-xl border border-slate-200 dark:border-slate-800 space-y-4">
          <h2 className="text-base font-bold font-display text-slate-950 dark:text-white flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-indigo-400" />
            Security & Account Identifier
          </h2>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 space-y-2.5 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Account ID:</span>
              <code className="font-mono font-bold text-slate-900 dark:text-indigo-400 bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded">
                {user?.uid}
              </code>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Account Email:</span>
              <span className="font-semibold text-slate-900 dark:text-white">{user?.email}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Phone Verification:</span>
              <span className="font-semibold text-slate-900 dark:text-white">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Email Verification</span>

                  <span
                    className={
                      user?.emailVerified
                        ? "font-semibold text-emerald-600"
                        : "font-semibold text-slate-500"
                    }
                  >
                    {user?.emailVerified ? "Verified" : "Not Verified"}
                  </span>
                </div>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">✓ Verified ({profile?.phoneNumber})</span>
                : (
                <span className="text-slate-500 dark:text-slate-400">Optional • Phone verification will be available soon.</span>
                )
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Admin Privileges:</span>
              <span className="font-semibold text-slate-900 dark:text-white">
                {profile?.role === 'admin' ? '🛡️ Administrator Access Enabled' : 'Standard Verified User'}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <button
              onClick={() => onNavigate('report-user')}
              className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-colors"
            >
              Report an Issue / User
            </button>

            <button
              onClick={() => signOut()}
              className="px-4 py-2.5 rounded-xl bg-red-50 dark:bg-red-950/40 hover:bg-red-100 text-red-600 dark:text-red-400 text-xs font-bold transition-colors"
            >
              Sign Out of RouteMate
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
