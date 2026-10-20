import { Brand } from '../common/Brand';
import React, { useState, useEffect } from 'react';
import {
  Compass,
  MapPin,
  PlusCircle,
  User,
  Bell,
  Moon,
  Sun,
  ShieldCheck,
  LogOut,
  Menu,
  X,
  Car,
  History,
  Settings,
  AlertTriangle,
  Layers,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getUserNotifications } from '../../services/notificationService';

interface NavbarProps {
  currentView: string;
  onNavigate: (view: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentView, onNavigate }) => {
  const { user, profile, theme, toggleTheme, isAdmin, signOut } = useAuth();
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState<boolean>(false);

  const isEmailVerified = Boolean(user?.emailVerified);

  const isSuspended = Boolean(
    profile?.accountStatus === 'suspended'
  );

  // Full navigation access requires email verification
  const hasFullAccess = Boolean(
    user && !isSuspended && isEmailVerified
  );

  useEffect(() => {
    if (user?.uid && hasFullAccess) {
      getUserNotifications(user.uid).then(notifs => {
        setUnreadCount(notifs.filter(n => !n.read).length);
      });
    }
  }, [user, currentView, hasFullAccess]);

  const handleNav = (view: string) => {
    onNavigate(view);
    setMobileMenuOpen(false);
    setUserDropdownOpen(false);
  };

  return (
    <header className="rm-navbar sticky top-0 z-40 w-full bg-white/90 dark:bg-slate-950/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">

        {/* Brand Logo */}
        <button
          onClick={() => handleNav(user ? 'home' : 'landing')}
          className="flex items-center gap-2.5 group text-left focus:outline-none"
        >
          <Brand />
        </button>

        {/* Desktop Primary Nav Links */}
        <nav className="hidden md:flex items-center gap-1">
          {hasFullAccess ? (
            <>
              <button
                onClick={() => handleNav('home')}
                className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition-all ${currentView === 'home'
                    ? 'bg-indigo-400/15 text-indigo-600 dark:text-indigo-400 font-bold'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900'
                  }`}
              >
                Dashboard
              </button>

              <button
                onClick={() => handleNav('find-routemate')}
                className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition-all ${currentView === 'find-routemate' || currentView === 'pickup-location' || currentView === 'destination-location'
                    ? 'bg-indigo-400/15 text-indigo-600 dark:text-indigo-400 font-bold'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900'
                  }`}
              >
                Find a ride
              </button>

              <button
                onClick={() => handleNav('post-ride')}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-semibold transition-all ${currentView === 'post-ride'
                    ? 'bg-indigo-600 text-white font-bold shadow-sm'
                    : 'text-indigo-600 dark:text-indigo-400 bg-indigo-400/10 hover:bg-indigo-400/20'
                  }`}
              >
                <PlusCircle className="w-4 h-4" />
                <span>Offer a ride</span>
              </button>

              <button
                onClick={() => handleNav('my-rides')}
                className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition-all ${currentView === 'my-rides'
                    ? 'bg-indigo-400/15 text-indigo-600 dark:text-indigo-400 font-bold'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900'
                  }`}
              >
                My Rides
              </button>
            </>
          ) : user ? (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-indigo-400/10 text-indigo-600 dark:text-indigo-400 text-xs font-semibold">
              <ShieldCheck className="w-4 h-4" />
              <span>RouteMate Account Connected</span>
            </div>
          ) : (
            <>
              <button
                onClick={() => { handleNav('landing'); setTimeout(() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' }), 50); }}
                className="px-3.5 py-2 rounded-lg text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900"
              >
                How It Works
              </button>
              <button
                onClick={() => handleNav('find-routemate')}
                className="px-3.5 py-2 rounded-lg text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900"
              >
                Search Routes
              </button>
            </>
          )}
        </nav>

        {/* Right Controls: Theme, Notifications, Admin Badge, Profile / Auth */}
        <div className="flex items-center gap-2">
          {/* Dark / Light Toggle */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="p-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
          >
            {theme === 'dark' ? <Sun className="w-5 h-5 text-indigo-400" /> : <Moon className="w-5 h-5 text-slate-700" />}
          </button>

          {/* Admin Switcher - ONLY visible to authenticated Users with role = 'admin' */}
          {user && isAdmin && hasFullAccess && (
            <button
              onClick={() => handleNav(currentView.startsWith('admin') ? 'home' : 'admin-dashboard')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${currentView.startsWith('admin')
                  ? 'bg-indigo-600 text-white ring-2 ring-indigo-400/40 shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
            >
              <ShieldCheck className="w-4 h-4 text-indigo-500" />
              <span className="hidden sm:inline">{currentView.startsWith('admin') ? 'User App' : 'Admin Panel'}</span>
            </button>
          )}

          {user ? (
            <>
              {/* Notifications Bell */}
              {hasFullAccess && (
                <button
                  aria-label="Notifications" onClick={() => handleNav('notifications')}
                  className="relative p-2 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-indigo-600 text-white text-[10px] font-extrabold flex items-center justify-center animate-pulse">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>
              )}

              {/* User Dropdown / Profile */}
              <div className="relative">
                <button
                  aria-label="Account menu" aria-expanded={userDropdownOpen}
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors focus:outline-none"
                >
                  <img
                    src={profile?.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.uid}`}
                    alt="Profile"
                    className="w-8 h-8 rounded-lg bg-indigo-400/20 object-cover border border-indigo-400/40"
                  />
                  <span className="hidden lg:block text-xs font-semibold text-slate-900 dark:text-slate-100 max-w-[100px] truncate">
                    {profile?.displayName || 'User'}
                  </span>
                </button>

                {/* Dropdown Menu */}
                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 py-2 z-50 text-sm animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800">
                      <p className="font-bold text-slate-900 dark:text-white truncate">{profile?.displayName}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{profile?.email}</p>
                      <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-400/20 text-indigo-600 dark:text-indigo-400">
                        {profile?.isDriver ? '🚗 Verified Driver' : '🎒 Active Rider'}
                      </span>
                    </div>

                    {hasFullAccess && (
                      <>
                        <button
                          onClick={() => handleNav('profile')}
                          className="w-full text-left px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2.5"
                        >
                          <User className="w-4 h-4 text-indigo-500" />
                          <span>User Profile</span>
                        </button>

                        <button
                          onClick={() => handleNav('ride-history')}
                          className="w-full text-left px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2.5"
                        >
                          <History className="w-4 h-4 text-indigo-500" />
                          <span>Ride History</span>
                        </button>

                        <button
                          onClick={() => handleNav('report-user')}
                          className="w-full text-left px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2.5"
                        >
                          <AlertTriangle className="w-4 h-4 text-indigo-500" />
                          <span>Report User</span>
                        </button>

                        {isAdmin && (
                          <button
                            onClick={() => handleNav('admin-dashboard')}
                            className="w-full text-left px-4 py-2 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-400/10 flex items-center gap-2.5 font-bold"
                          >
                            <ShieldCheck className="w-4 h-4 text-indigo-500" />
                            <span>Admin Control Center</span>
                          </button>
                        )}

                        <button
                          onClick={() => handleNav('settings')}
                          className="w-full text-left px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2.5"
                        >
                          <Settings className="w-4 h-4 text-indigo-500" />
                          <span>Settings</span>
                        </button>

                        <div className="border-t border-slate-100 dark:border-slate-800 my-1" />
                      </>
                    )}

                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        signOut();
                        onNavigate('login');
                      }}
                      className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 flex items-center gap-2.5 font-semibold"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Log Out</span>
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleNav('login')}
                className="px-3.5 py-1.5 rounded-xl text-sm font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
              >
                Log In
              </button>
              <button
                onClick={() => handleNav('register')}
                className="px-4 py-1.5 rounded-xl text-sm font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition-all shadow-sm active:scale-95"
              >
                Sign Up
              </button>
            </div>
          )}

          {/* Mobile Menu Button */}
          <button
            aria-label="Navigation menu" aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 pt-3 pb-6 space-y-2">
          {hasFullAccess ? (
            <>
              <button
                onClick={() => handleNav('home')}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900 font-semibold text-slate-900 dark:text-white"
              >
                <span>Dashboard Overview</span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>
              <button
                onClick={() => handleNav('find-routemate')}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900 font-semibold text-slate-900 dark:text-white"
              >
                <span>Find a ride</span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>
              <button
                onClick={() => handleNav('post-ride')}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-indigo-600 text-white font-bold"
              >
                <span>Offer a ride</span>
                <PlusCircle className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleNav('my-rides')}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900 font-semibold text-slate-900 dark:text-white"
              >
                <span>My Active & Requested Rides</span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>
              <button
                onClick={() => handleNav('profile')}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-900 font-semibold text-slate-900 dark:text-white"
              >
                <span>User Profile</span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>
              {isAdmin && (
                <button
                  onClick={() => handleNav('admin-dashboard')}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-indigo-500/10 border border-indigo-400/30 text-indigo-600 dark:text-indigo-400 font-bold"
                >
                  <span>Protected Admin Panel</span>
                  <ShieldCheck className="w-4 h-4 text-indigo-500" />
                </button>
              )}
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  signOut();
                  onNavigate('login');
                }}
                className="w-full flex items-center justify-between p-3 rounded-xl text-red-600 font-bold"
              >
                <span>Log Out</span>
                <LogOut className="w-4 h-4" />
              </button>
            </>
          ) : user ? (
            <div className="space-y-2 pt-2">
              <div className="p-3 rounded-xl bg-indigo-400/10 text-indigo-600 dark:text-indigo-400 text-xs font-semibold text-center">
                RouteMate Account Connected
              </div>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  signOut();
                  onNavigate('login');
                }}
                className="w-full py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-red-600 font-bold"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <div className="space-y-2 pt-2">
              <button
                onClick={() => handleNav('login')}
                className="w-full py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white font-bold"
              >
                Log In
              </button>
              <button
                onClick={() => handleNav('register')}
                className="w-full py-3 rounded-xl bg-indigo-600 text-white font-bold"
              >
                Create Account
              </button>
            </div>
          )}
        </div>
      )}
    </header>
  );
};
