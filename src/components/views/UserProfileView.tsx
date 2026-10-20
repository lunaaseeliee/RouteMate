import React, { useState } from 'react';
import {
  User,
  Car,
  ShieldCheck,
  Phone,
  Mail,
  Star,
  CheckCircle,
  Save,
  AlertCircle,
  Clock,
  Compass,
  Heart,
  Volume2,
  VolumeX,
  Cigarette,
  PawPrint,
  MessageSquare
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { updateUserProfileDoc } from '../../services/authService';

interface UserProfileViewProps {
  onNavigate: (view: string) => void;
}

export const UserProfileView: React.FC<UserProfileViewProps> = ({ onNavigate }) => {
  const { user, profile, refreshProfile } = useAuth();

  const [displayName, setDisplayName] = useState(profile?.displayName || '');
  const [phone, setPhone] = useState(profile?.phoneNumber || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [isDriver, setIsDriver] = useState(profile?.isDriver || false);

  // Vehicle Details
  const [make, setMake] = useState(profile?.vehicle?.make || 'Toyota');
  const [model, setModel] = useState(profile?.vehicle?.model || 'RAV4');
  const [color, setColor] = useState(profile?.vehicle?.color || 'Midnight Black');
  const [licensePlate, setLicensePlate] = useState(profile?.vehicle?.licensePlate || 'RM-4420');
  const [seats, setSeats] = useState(profile?.vehicle?.seats || 4);

  // Travel Preferences
  const [smokingAllowed, setSmokingAllowed] = useState(profile?.preferences?.smokingAllowed || false);
  const [petsAllowed, setPetsAllowed] = useState(profile?.preferences?.petsAllowed || true);
  const [musicAllowed, setMusicAllowed] = useState(profile?.preferences?.musicAllowed || true);
  const [chatty, setChatty] = useState(profile?.preferences?.chatty || true);

  // Emergency Contact
  const [emergencyName, setEmergencyName] = useState(profile?.emergencyContact?.name || '');
  const [emergencyPhone, setEmergencyPhone] = useState(profile?.emergencyContact?.phone || '');
  const [emergencyRel, setEmergencyRel] = useState(profile?.emergencyContact?.relationship || 'Family');

  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setSavedSuccess(false);

    try {
      await updateUserProfileDoc(user.uid, {
        displayName,
        phoneNumber: phone,
        bio,
        isDriver,
        vehicle: isDriver ? {
          make,
          model,
          color,
          licensePlate,
          seats: Number(seats)
        } : undefined,
        preferences: {
          smokingAllowed,
          petsAllowed,
          musicAllowed,
          chatty,
          maxLuggage: 'medium'
        },
        emergencyContact: emergencyName ? {
          name: emergencyName,
          phone: emergencyPhone,
          relationship: emergencyRel
        } : undefined
      });

      await refreshProfile();
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      console.error('Error saving profile:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:py-10">

      {/* Profile Header Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200 dark:border-slate-800 mb-8">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <div className="relative">
            <img
              src={profile?.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${user?.uid || 'user'}`}
              alt="Avatar"
              className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-indigo-400/20 object-cover border-2 border-indigo-400 shadow-lg"
            />
            <span className="absolute -bottom-2 -right-2 px-2.5 py-0.5 rounded-full bg-indigo-600 text-white font-bold text-xs shadow">
              ★ {profile?.rating?.toFixed(1) || '5.0'}
            </span>
          </div>

          <div className="flex-1 text-center sm:text-left space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-slate-950 dark:text-white">
                  {profile?.displayName || 'RouteMate User'}
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center justify-center sm:justify-start gap-1.5 mt-0.5">
                  <Mail className="w-3.5 h-3.5" />
                  <span>{profile?.email}</span>
                </p>
              </div>

              <div className="flex items-center justify-center gap-2">
                <span className="px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200">
                  {profile?.role === 'admin' ? '🛡️ Admin' : '👤 Member'}
                </span>
                <span className="px-3 py-1 rounded-xl bg-indigo-400/15 border border-indigo-400/30 text-indigo-600 dark:text-indigo-400 text-xs font-bold">
                  {profile?.isDriver ? '🚗 Verified Driver' : '🎒 Active Rider'}
                </span>
              </div>
            </div>

            {/* Lifetime Stats Strip */}
            <div className="grid grid-cols-3 gap-3 pt-3">
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800 text-center">
                <p className="text-xl font-extrabold text-slate-900 dark:text-white font-display">
                  {profile?.totalRidesCreated || 0}
                </p>
                <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">Routes Offered</p>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800 text-center">
                <p className="text-xl font-extrabold text-slate-900 dark:text-white font-display">
                  {profile?.totalRidesJoined || 0}
                </p>
                <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">Rides Joined</p>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800 text-center">
                <p className="text-xl font-extrabold text-indigo-500 font-display">
                  {Math.round(((profile?.totalRidesJoined || 0) + (profile?.totalRidesCreated || 0)) * 2.8)} kg
                </p>
                <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">CO2 Saved</p>
              </div>
            </div>

            <div className="pt-2 text-xs text-slate-400 font-mono">
              Account ID: <span className="text-slate-600 dark:text-slate-300">{profile?.uid || user?.uid}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Profile Form */}
      <form onSubmit={handleSave} className="space-y-6">

        {savedSuccess && (
          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-sm font-bold flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            <span>Your profile has been updated.</span>
          </div>
        )}

        {/* Basic Info */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200 dark:border-slate-800 space-y-4">
          <h3 className="text-lg font-bold text-slate-950 dark:text-white font-display flex items-center gap-2">
            <User className="w-5 h-5 text-indigo-400" />
            Personal Details
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                Display Name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-400 focus:outline-none"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Phone Number
                </label>
                <span className="text-[10px] font-medium text-slate-500">
                  Optional
                </span>

              </div>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (555) 012-3456"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-400 focus:outline-none"
              />

            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
              About / Travel Bio
            </label>
            <textarea
              rows={2}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell fellow RouteMates a little about yourself, work commute, or travel interests..."
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-400 focus:outline-none"
            />
          </div>

          {/* Driver Status Switch */}
          <div className="pt-2 flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700">
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-white">Driver Mode</p>
              <p className="text-xs text-slate-500">Enable this if you own a vehicle and offer seats to RouteMates</p>
            </div>
            <button
              type="button"
              onClick={() => setIsDriver(!isDriver)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${isDriver
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                }`}
            >
              {isDriver ? 'Enabled 🚗' : 'Disabled'}
            </button>
          </div>
        </div>

        {/* Vehicle Information (if driver) */}
        {isDriver && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200 dark:border-slate-800 space-y-4 animate-in fade-in duration-200">
            <h3 className="text-lg font-bold text-slate-950 dark:text-white font-display flex items-center gap-2">
              <Car className="w-5 h-5 text-indigo-400" />
              Vehicle Information
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                  Make
                </label>
                <input
                  type="text"
                  value={make}
                  onChange={(e) => setMake(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                  Model
                </label>
                <input
                  type="text"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                  Color
                </label>
                <input
                  type="text"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                  License Plate
                </label>
                <input
                  type="text"
                  value={licensePlate}
                  onChange={(e) => setLicensePlate(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white uppercase font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                  Available Seats
                </label>
                <select
                  value={seats}
                  onChange={(e) => setSeats(Number(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white"
                >
                  {[1, 2, 3, 4, 5, 6].map(n => (
                    <option key={n} value={n}>{n} {n === 1 ? 'passenger' : 'passengers'}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Travel Preferences */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200 dark:border-slate-800 space-y-4">
          <h3 className="text-lg font-bold text-slate-950 dark:text-white font-display flex items-center gap-2">
            <Heart className="w-5 h-5 text-indigo-400" />
            Ride Preferences
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <button
              type="button"
              onClick={() => setSmokingAllowed(!smokingAllowed)}
              className={`p-3.5 rounded-2xl border text-center transition-all ${smokingAllowed
                ? 'border-indigo-400 bg-indigo-400/15 text-slate-950 dark:text-white font-bold'
                : 'border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
            >
              <Cigarette className="w-5 h-5 mx-auto mb-1 text-indigo-500" />
              <p className="text-xs">Smoking</p>
              <p className="text-[10px] text-slate-400">{smokingAllowed ? 'Allowed' : 'No Smoking'}</p>
            </button>

            <button
              type="button"
              onClick={() => setPetsAllowed(!petsAllowed)}
              className={`p-3.5 rounded-2xl border text-center transition-all ${petsAllowed
                ? 'border-indigo-400 bg-indigo-400/15 text-slate-950 dark:text-white font-bold'
                : 'border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
            >
              <PawPrint className="w-5 h-5 mx-auto mb-1 text-indigo-500" />
              <p className="text-xs">Pets</p>
              <p className="text-[10px] text-slate-400">{petsAllowed ? 'Friendly' : 'No Pets'}</p>
            </button>

            <button
              type="button"
              onClick={() => setMusicAllowed(!musicAllowed)}
              className={`p-3.5 rounded-2xl border text-center transition-all ${musicAllowed
                ? 'border-indigo-400 bg-indigo-400/15 text-slate-950 dark:text-white font-bold'
                : 'border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
            >
              <Volume2 className="w-5 h-5 mx-auto mb-1 text-indigo-500" />
              <p className="text-xs">Music</p>
              <p className="text-[10px] text-slate-400">{musicAllowed ? 'Play Tunes' : 'Quiet Ride'}</p>
            </button>

            <button
              type="button"
              onClick={() => setChatty(!chatty)}
              className={`p-3.5 rounded-2xl border text-center transition-all ${chatty
                ? 'border-indigo-400 bg-indigo-400/15 text-slate-950 dark:text-white font-bold'
                : 'border-slate-200 dark:border-slate-800 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
            >
              <MessageSquare className="w-5 h-5 mx-auto mb-1 text-indigo-500" />
              <p className="text-xs">Chat</p>
              <p className="text-[10px] text-slate-400">{chatty ? 'Conversational' : 'Quiet Space'}</p>
            </button>
          </div>
        </div>

        {/* Emergency Contact */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200 dark:border-slate-800 space-y-4">
          <h3 className="text-lg font-bold text-slate-950 dark:text-white font-display flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-indigo-400" />
            Safety & Emergency Contact
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                Contact Name
              </label>
              <input
                type="text"
                value={emergencyName}
                onChange={(e) => setEmergencyName(e.target.value)}
                placeholder="Parent / Spouse / Friend"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                Contact Phone
              </label>
              <input
                type="tel"
                value={emergencyPhone}
                onChange={(e) => setEmergencyPhone(e.target.value)}
                placeholder="+1 (555) 000-0000"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                Relationship
              </label>
              <input
                type="text"
                value={emergencyRel}
                onChange={(e) => setEmergencyRel(e.target.value)}
                placeholder="Family / Partner"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* Submit Save Button */}
        <div className="flex justify-end gap-3">
          <button
            type="submit"
            disabled={saving}
            className="px-8 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm transition-all shadow-lg shadow-indigo-400/25 active:scale-95 flex items-center gap-2 disabled:opacity-50"
          >
            {saving ? (
              <span className="animate-spin rounded-full h-4 w-4 border-2 border-slate-950 border-t-transparent" />
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Profile Changes</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
