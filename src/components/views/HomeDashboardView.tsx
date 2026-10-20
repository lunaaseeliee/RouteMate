import { JourneyArtwork } from '../common/JourneyArtwork';
import React, { useState, useEffect } from 'react';
import { 
  Compass, 
  PlusCircle, 
  MapPin, 
  Navigation, 
  Car, 
  Clock, 
  ShieldCheck, 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  TrendingUp, 
  AlertCircle,
  Bell,
  Users
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getMyRides } from '../../services/rideService';
import { getUserNotifications } from '../../services/notificationService';
import { Ride, NotificationItem } from '../../types';

interface HomeDashboardViewProps {
  onNavigate: (view: string, data?: any) => void;
}

export const HomeDashboardView: React.FC<HomeDashboardViewProps> = ({ onNavigate }) => {
  const { user, profile } = useAuth();
  const [activeRides, setActiveRides] = useState<Ride[]>([]);
  const [recentNotifs, setRecentNotifs] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.uid) {
      Promise.all([
        getMyRides(user.uid),
        getUserNotifications(user.uid)
      ]).then(([myRidesData, notifsData]) => {
        const combined = [...myRidesData.asDriver, ...myRidesData.asPassenger];
        const ongoing = combined.filter(r => r.status === 'active' || r.status === 'in_progress');
        setActiveRides(ongoing);
        setRecentNotifs(notifsData.slice(0, 3));
        setLoading(false);
      });
    }
  }, [user]);

  const firstName = profile?.displayName?.split(' ')[0] || 'Friend';

  return (
    <div className="rm-dashboard max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Welcome Greeting Banner */}
      <div className="dashboard-welcome relative overflow-hidden rounded-3xl bg-slate-950 text-white p-6 sm:p-10 border border-slate-800 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-400/10 rounded-full blur-3xl pointer-events-none" />
        
        <JourneyArtwork/>
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-400/20 text-indigo-400 font-bold text-xs mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            YOUR JOURNEY STARTS HERE
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold font-display leading-tight">
            Where to next, <span className="text-indigo-400">{firstName}</span>?
          </h1>

          <p className="text-slate-400 text-sm sm:text-base mt-2 mb-6 leading-relaxed">
            Where are you travelling today? Search for a RouteMate heading your way or post a trip to share fuel costs.
          </p>

          {/* Quick Action Grid */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => onNavigate('pickup-location')}
              className="px-6 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm transition-all shadow-lg shadow-indigo-400/25 active:scale-95 flex items-center gap-2"
            >
              <Compass className="w-4 h-4" />
              <span>Find a ride</span>
            </button>

            <button
              onClick={() => onNavigate('post-ride')}
              className="px-6 py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm transition-all border border-slate-700 active:scale-95 flex items-center gap-2"
            >
              <PlusCircle className="w-4 h-4 text-indigo-400" />
              <span>Offer a ride</span>
            </button>
          </div>
        </div>
      </div>

      <div className="dashboard-stats">{[{ label: 'Upcoming rides', value: activeRides.length, icon: Car }, { label: 'Rides offered', value: profile?.totalRidesCreated || 0, icon: Navigation }, { label: 'Rides joined', value: profile?.totalRidesJoined || 0, icon: Users }].map(stat => <div key={stat.label}><span><stat.icon size={21}/></span><div><small>{stat.label}</small><strong>{loading ? '—' : stat.value}</strong></div></div>)}</div>
      {/* Active Trip Banner if user has an active ride */}
      {activeRides.length > 0 && (
        <div className="bg-indigo-50 dark:bg-slate-900/90 rounded-3xl p-6 border-2 border-indigo-400 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-600 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500"></span>
              </span>
              <h2 className="text-base font-extrabold text-slate-950 dark:text-white uppercase tracking-wider">
                Active Upcoming Trip
              </h2>
            </div>
            <button
              onClick={() => onNavigate('my-rides')}
              className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
            >
              <span>View Ride Details</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div className="bg-white dark:bg-slate-800/80 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Route</p>
              <p className="text-sm font-bold text-slate-900 dark:text-white mt-1">
                {activeRides[0].pickup.city} ➔ {activeRides[0].destination.city}
              </p>
              <p className="text-xs text-slate-500 truncate">{activeRides[0].pickup.address}</p>
            </div>

            <div className="bg-white dark:bg-slate-800/80 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Departure</p>
              <p className="text-sm font-bold text-slate-900 dark:text-white mt-1">
                {new Date(activeRides[0].departureTime).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })} at{' '}
                {new Date(activeRides[0].departureTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
              <p className="text-xs text-indigo-500 font-semibold">{activeRides[0].availableSeats} seats remaining</p>
            </div>

            <div className="bg-white dark:bg-slate-800/80 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Role</p>
                <p className="text-sm font-bold text-slate-900 dark:text-white mt-1">
                  {activeRides[0].creatorId === user?.uid ? '🚗 Driver' : '🎒 Passenger'}
                </p>
                <p className="text-xs text-slate-500">${activeRides[0].pricePerSeat} / seat</p>
              </div>

              <button
                onClick={() => onNavigate('my-rides')}
                className="px-4 py-2 rounded-xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-700 transition-colors"
              >
                Manage Trip
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main 2-Column Section: Fast Search Shortcuts + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left: Quick Corridor Navigator */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200 dark:border-slate-800">
            <h3 className="text-lg font-bold font-display text-slate-950 dark:text-white mb-4 flex items-center gap-2">
              <Navigation className="w-5 h-5 text-indigo-400" />
              Explore a route
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { from: 'San Francisco Downtown', to: 'Silicon Valley Tech Park', distance: '54 km', time: '~45 min' },
                { from: 'Central Station', to: 'International Airport (SFO)', distance: '22 km', time: '~25 min' },
                { from: 'University Campus', to: 'Metro Heights District', distance: '14 km', time: '~18 min' },
                { from: 'East Bay Suburbs', to: 'Financial District', distance: '32 km', time: '~35 min' },
              ].map((c, i) => (
                <button
                  key={i}
                  onClick={() => onNavigate('find-routemate', { pickupCity: c.from, destinationCity: c.to })}
                  className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 hover:bg-indigo-400/15 border border-slate-200 dark:border-slate-700/80 text-left transition-all group"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-indigo-500 font-mono">{c.distance}</span>
                    <span className="text-xs text-slate-400">{c.time}</span>
                  </div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-indigo-500 transition-colors">
                    {c.from}
                  </p>
                  <div className="text-[10px] text-slate-400 my-0.5">➔</div>
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {c.to}
                  </p>
                </button>
              ))}
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <span className="text-xs text-slate-500">Looking for custom locations?</span>
              <button
                onClick={() => onNavigate('pickup-location')}
                className="text-xs font-bold text-indigo-500 hover:underline flex items-center gap-1"
              >
                <span>Set custom route</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Safety & Trust Pillar */}
          <div className="bg-slate-50 dark:bg-slate-900/60 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 flex items-start gap-4">
            <div className="w-10 h-10 rounded-2xl bg-indigo-400/20 text-indigo-500 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">Travel with confidence</h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                Review traveller profiles before you ride. You can report a concern from any profile or through your account menu.
              </p>
            </div>
          </div>
        </div>

        {/* Right: Notifications & Quick Profile Snapshot */}
        <div className="space-y-6">
          
          {/* Notifications Card */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold font-display text-slate-950 dark:text-white flex items-center gap-2">
                <Bell className="w-4 h-4 text-indigo-400" />
                Recent Notifications
              </h3>
              <button
                onClick={() => onNavigate('notifications')}
                className="text-xs text-indigo-500 font-semibold hover:underline"
              >
                View all
              </button>
            </div>

            {recentNotifs.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No new notifications.</p>
            ) : (
              <div className="space-y-3">
                {recentNotifs.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => onNavigate('notifications')}
                    className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-100 dark:border-slate-800 cursor-pointer transition-colors"
                  >
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{n.title}</p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5">{n.message}</p>
                    <p className="text-[10px] text-slate-400 mt-1">
                      {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* User Quick Stats */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center gap-3">
              <img
                src={profile?.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${user?.uid || 'user'}`}
                alt="Avatar"
                className="w-12 h-12 rounded-2xl bg-indigo-400/20 object-cover border border-indigo-400/30"
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{profile?.displayName}</p>
                <p className="text-xs text-slate-500 truncate">{profile?.email}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-center">
                <p className="text-base font-extrabold text-slate-900 dark:text-white font-display">
                  {profile?.totalRidesCreated || 0}
                </p>
                <p className="text-[10px] text-slate-500 uppercase font-semibold">Offered</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-center">
                <p className="text-base font-extrabold text-slate-900 dark:text-white font-display">
                  {profile?.totalRidesJoined || 0}
                </p>
                <p className="text-[10px] text-slate-500 uppercase font-semibold">Joined</p>
              </div>
            </div>

            <button
              onClick={() => onNavigate('profile')}
              className="w-full py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs transition-colors"
            >
              Edit Full Profile & Vehicle
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
