import { Sidebar } from './components/layout/Sidebar';
import React, { useState, useEffect, useCallback } from 'react';
import { ShieldAlert, X, AlertTriangle } from 'lucide-react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Navbar } from './components/layout/Navbar';
import { BottomNav } from './components/layout/BottomNav';

import { LandingPage } from './components/views/LandingPage';
import { LoginView } from './components/views/LoginView';
import { RegisterView } from './components/views/RegisterView';
import { VerifyEmailView } from './components/views/VerifyEmailView';
import { UserProfileView } from './components/views/UserProfileView';
import { HomeDashboardView } from './components/views/HomeDashboardView';
import { PickupLocationView } from './components/views/PickupLocationView';
import { DestinationLocationView } from './components/views/DestinationLocationView';
import { FindRouteMateView } from './components/views/FindRouteMateView';
import { RideRequestView } from './components/views/RideRequestView';
import { PostRideView } from './components/views/PostRideView';
import { MyRidesView } from './components/views/MyRidesView';
import { RideHistoryView } from './components/views/RideHistoryView';
import { NotificationsView } from './components/views/NotificationsView';
import { SettingsView } from './components/views/SettingsView';
import { ReportUserView } from './components/views/ReportUserView';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { LocationPoint, Ride } from './types';

function AppContent() {
  const { user, profile, loading, isAdmin, signOut } = useAuth();

  // Default view
  const [currentView, setCurrentView] = useState<string>('landing');
  const [navigationData, setNavigationData] = useState<any>(null);
  const [accessDeniedMessage, setAccessDeniedMessage] = useState<string | null>(null);

  // Selected route state for booking flow
  const [selectedPickup, setSelectedPickup] = useState<LocationPoint | null>(null);
  const [selectedDestination, setSelectedDestination] = useState<LocationPoint | null>(null);
  const [selectedRideForRequest, setSelectedRideForRequest] = useState<Ride | null>(null);

  // Helper to trigger access denied warning
  const triggerAccessDenied = useCallback((message = 'Access denied. Please complete verification.') => {
    setAccessDeniedMessage(message);
    if (window.location.pathname.startsWith('/admin') || window.location.hash.includes('admin')) {
      window.history.replaceState({}, '', '/');
    }
  }, []);

  // Verification status helpers
  const isEmailVerified = Boolean(user?.emailVerified);
  const isSuspended = Boolean(profile?.accountStatus === 'suspended' || profile?.isSuspended);

  // Full RouteMate access requires email verification.
  const hasFullAccess = Boolean(user && !isSuspended && isEmailVerified);

  // Access & route guarding: authenticated users are allowed into RouteMate
  useEffect(() => {
    if (loading) return;

    // Unauthenticated user
    if (!user) {
      if (!['landing', 'login', 'register'].includes(currentView)) {
        setCurrentView('login');
      }
      return;
    }

    // Account suspended
    if (isSuspended) {
      triggerAccessDenied('Your account has been suspended. Please contact support.');
      return;
    }

    // Enforce onboarding in order: verified email, then verified phone.
    if (!isEmailVerified) {
      if (currentView !== 'verify-email') setCurrentView('verify-email');
      return;
    }

    // Fully verified users can enter RouteMate.
    if (['landing', 'login', 'register', 'verify-email'].includes(currentView)) {
      setCurrentView('home');
    }
  }, [user, profile, isSuspended, loading, currentView, triggerAccessDenied]);

  // Handle URL path / hash detection for admin route security
  useEffect(() => {
    if (loading) return;

    const path = window.location.pathname.toLowerCase();
    const hash = window.location.hash.toLowerCase();
    const isAdminRoute = path === '/admin' || path.startsWith('/admin/') || hash === '#/admin' || hash === '#admin';

    if (isAdminRoute) {
      if (!user) {
        triggerAccessDenied('Access denied. Admin credentials required.');
        setCurrentView('login');
      } else if (!isEmailVerified) {
        setCurrentView('verify-email');
      } else if (!isAdmin) {
        triggerAccessDenied('Access denied. Admin privileges required.');
        setCurrentView('home');
      } else {
        setCurrentView('admin-dashboard');
      }
    }
  }, [user, isAdmin, isEmailVerified, loading, triggerAccessDenied]);

  // Auto-dismiss access denied toast after 6 seconds
  useEffect(() => {
    if (accessDeniedMessage) {
      const timer = setTimeout(() => {
        setAccessDeniedMessage(null);
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [accessDeniedMessage]);

  const handleNavigate = (view: string, data?: any) => {
    setNavigationData(data || null);

    // If user is not authenticated, protect all routes and redirect to login
    if (!user && !['landing', 'login', 'register'].includes(view)) {
      setCurrentView('login');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // Enforce role-based authorization for admin dashboard view
    if (view === 'admin-dashboard' || view === 'admin') {
      if (!user) {
        triggerAccessDenied('Access denied. Admin credentials required.');
        setCurrentView('login');
        return;
      }
      if (!isEmailVerified) {
        setCurrentView('verify-email');
        return;
      }
      if (!isAdmin) {
        triggerAccessDenied('Access denied. Admin privileges required.');
        setCurrentView('home');
        return;
      }
      setCurrentView('admin-dashboard');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // Clear access denied message when navigating normally
    if (accessDeniedMessage) {
      setAccessDeniedMessage(null);
    }

    setCurrentView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectPickup = (pickup: LocationPoint) => {
    setSelectedPickup(pickup);
    setCurrentView('destination-location');
  };

  const handleConfirmRoute = (
    pickup: LocationPoint,
    dest: LocationPoint,
    routeDetails: { distanceKm: number; durationMinutes: number; estimatedPrice: number }
  ) => {
    setSelectedPickup(pickup);
    setSelectedDestination(dest);
    setNavigationData({ pickupCity: pickup.city, destinationCity: dest.city, routeDetails });
    setCurrentView('find-routemate');
  };

  const handleSelectRideForRequest = (ride: Ride) => {
    setSelectedRideForRequest(ride);
    setCurrentView('ride-request');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center space-y-4 text-white">
        <div className="w-12 h-12 border-4 border-indigo-400 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-bold tracking-wider font-display text-indigo-400">
          CONNECTING TO ROUTEMATE...
        </p>
      </div>
    );
  }

  // Account Suspended View
  if (user && isSuspended) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 text-white">
        <div className="max-w-md w-full bg-slate-900 border border-red-500/40 rounded-3xl p-8 text-center space-y-4 shadow-2xl">
          <div className="w-16 h-16 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold font-display text-white">Account Suspended</h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            Your RouteMate account has been suspended by a platform administrator due to policy violations.
          </p>
          <button
            onClick={() => signOut()}
            className="w-full py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm transition-colors mt-4"
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans flex flex-col transition-colors duration-200 ${hasFullAccess ? 'rm-authenticated' : ''}`}>

      {/* Top Navbar */}
      <Navbar
        currentView={currentView}
        onNavigate={handleNavigate}
      />

      {/* Access Denied Alert Toast */}
      {accessDeniedMessage && (
        <div className="sticky top-16 z-50 max-w-xl mx-auto px-4 w-full mt-3 animate-in fade-in slide-in-from-top-3 duration-200">
          <div className="flex items-center justify-between gap-3 p-4 rounded-2xl bg-red-600 text-white shadow-2xl border border-red-500 font-medium text-sm">
            <div className="flex items-center gap-2.5">
              <ShieldAlert className="w-5 h-5 text-indigo-300 shrink-0" />
              <span className="font-semibold">{accessDeniedMessage}</span>
            </div>
            <button
              onClick={() => setAccessDeniedMessage(null)}
              className="p-1 rounded-lg hover:bg-white/20 transition-colors text-white"
              aria-label="Dismiss alert"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {hasFullAccess && <Sidebar currentView={currentView} onNavigate={handleNavigate}/> }
      {/* Main Content Area */}
      <main data-view={currentView} className={`flex-1 ${hasFullAccess ? 'pb-24 md:pb-12' : 'pb-12'}`}>
        {/* Unauthenticated Landing */}
        {currentView === 'landing' && (
          <LandingPage onNavigate={handleNavigate} />
        )}

        {/* Auth Forms */}
        {currentView === 'login' && (
          <LoginView
            onNavigate={handleNavigate}
            initialEmail={navigationData?.email || ''}
          />
        )}

        {currentView === 'register' && (
          <RegisterView
            onNavigate={handleNavigate}
            initialEmail={navigationData?.email || ''}
          />
        )}

        {/* 2-Step Verification Views */}
        {currentView === 'verify-email' && (
          <VerifyEmailView
            onVerified={() => handleNavigate('home')}
            onNavigate={handleNavigate}
          />
        )}

        {/* User Application Sections - Available When Authenticated */}
        {hasFullAccess && (
          <>
            {currentView === 'home' && (
              <HomeDashboardView onNavigate={handleNavigate} />
            )}

            {currentView === 'profile' && (
              <UserProfileView onNavigate={handleNavigate} />
            )}

            {currentView === 'pickup-location' && (
              <PickupLocationView
                initialPickup={selectedPickup || undefined}
                onSelectPickup={handleSelectPickup}
                onCancel={() => handleNavigate('home')}
              />
            )}

            {currentView === 'destination-location' && (
              <DestinationLocationView
                pickup={selectedPickup || { address: 'City Hub Station', city: 'Downtown', lat: 37.7749, lng: -122.4194 }}
                onBack={() => handleNavigate('pickup-location')}
                onConfirmRoute={handleConfirmRoute}
              />
            )}

            {currentView === 'find-routemate' && (
              <FindRouteMateView
                initialPickupCity={navigationData?.pickupCity || selectedPickup?.city || ''}
                initialDestinationCity={navigationData?.destinationCity || selectedDestination?.city || ''}
                onNavigate={handleNavigate}
                onSelectRide={handleSelectRideForRequest}
              />
            )}

            {currentView === 'ride-request' && selectedRideForRequest && (
              <RideRequestView
                ride={selectedRideForRequest}
                onBack={() => handleNavigate('find-routemate')}
                onRequestSuccess={() => handleNavigate('my-rides')}
              />
            )}

            {currentView === 'post-ride' && (
              <PostRideView
                initialPickup={navigationData?.pickup || selectedPickup?.address || ''}
                initialDestination={navigationData?.destination || selectedDestination?.address || ''}
                onPostSuccess={() => handleNavigate('my-rides')}
              />
            )}

            {currentView === 'my-rides' && (
              <MyRidesView onNavigate={handleNavigate} />
            )}

            {currentView === 'ride-history' && (
              <RideHistoryView onNavigate={handleNavigate} />
            )}

            {currentView === 'notifications' && (
              <NotificationsView onNavigate={handleNavigate} />
            )}

            {currentView === 'settings' && (
              <SettingsView onNavigate={handleNavigate} />
            )}

            {currentView === 'report-user' && (
              <ReportUserView
                initialReportedUserId={navigationData?.reportedUserId || ''}
                initialReportedUserName={navigationData?.reportedUserName || ''}
                initialRideId={navigationData?.rideId || ''}
                onBack={() => handleNavigate('home')}
                onSubmitSuccess={() => handleNavigate('home')}
              />
            )}

            {/* Protected Admin Application - STRICTLY GUARDED */}
            {currentView === 'admin-dashboard' && isAdmin && (
              <AdminDashboard onExitAdmin={() => handleNavigate('home')} />
            )}
          </>
        )}
      </main>

      {/* Mobile Bottom Navigation Bar (Shown only when fully verified) */}
      {hasFullAccess && (
        <BottomNav
          currentView={currentView}
          onNavigate={handleNavigate}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
