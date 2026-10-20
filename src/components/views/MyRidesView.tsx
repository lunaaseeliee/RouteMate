import React, { useState, useEffect } from 'react';
import { 
  Car, 
  Users, 
  Clock, 
  MapPin, 
  Navigation, 
  CheckCircle, 
  XCircle, 
  Play, 
  CheckCheck, 
  AlertTriangle, 
  ChevronRight,
  Sparkles,
  Phone,
  MessageSquare,
  ShieldCheck,
  Compass
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  getMyRides, 
  updatePassengerRequestStatus, 
  updateRideStatus 
} from '../../services/rideService';
import { Ride } from '../../types';
import { EmptyState } from '../common/EmptyState';

interface MyRidesViewProps {
  onNavigate: (view: string, data?: any) => void;
}

export const MyRidesView: React.FC<MyRidesViewProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'driver' | 'passenger'>('driver');
  const [driverRides, setDriverRides] = useState<Ride[]>([]);
  const [passengerRides, setPassengerRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchRides = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const data = await getMyRides(user.uid);
      setDriverRides(data.asDriver);
      setPassengerRides(data.asPassenger);
      if (data.asDriver.length === 0 && data.asPassenger.length > 0) {
        setActiveTab('passenger');
      }
    } catch (err) {
      console.error('Error fetching my rides:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRides();
  }, [user]);

  const handleRequestResponse = async (rideId: string, passengerUid: string, status: 'accepted' | 'rejected') => {
    setActionLoading(`${rideId}-${passengerUid}`);
    try {
      await updatePassengerRequestStatus(rideId, passengerUid, status);
      await fetchRides();
    } catch (err) {
      console.error('Error updating request status:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRideStatusChange = async (rideId: string, newStatus: Ride['status']) => {
    setActionLoading(rideId);
    try {
      await updateRideStatus(rideId, newStatus);
      await fetchRides();
    } catch (err) {
      console.error('Error updating ride status:', err);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Top Header & Tab Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-slate-950 dark:text-white">
            My RouteMate Trips
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Manage your driving offers, passenger requests, and active journeys.
          </p>
        </div>

        {/* Tab Toggle */}
        <div className="flex items-center p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 self-start">
          <button
            onClick={() => setActiveTab('driver')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'driver'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white'
            }`}
          >
            <Car className="w-3.5 h-3.5" />
            <span>Offered as Driver ({driverRides.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('passenger')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'passenger'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Joined as Passenger ({passengerRides.length})</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center space-y-3">
          <div className="w-10 h-10 border-4 border-indigo-400 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-semibold text-slate-500">Loading your journeys...</p>
        </div>
      ) : activeTab === 'driver' ? (
        /* Driver Tab Content */
        driverRides.length === 0 ? (
          <EmptyState
            title="No routes offered yet."
            description="You haven't posted any routes as a driver yet. Share your commute and split fuel expenses!"
            actionText="Publish a Route"
            onAction={() => onNavigate('post-ride')}
          />
        ) : (
          <div className="space-y-6">
            {driverRides.map((ride) => {
              const pendingPassengers = ride.passengers.filter(p => p.status === 'pending');
              const acceptedPassengers = ride.passengers.filter(p => p.status === 'accepted');

              return (
                <div
                  key={ride.id}
                  className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200 dark:border-slate-800 space-y-6"
                >
                  {/* Status & Timing Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-xl text-xs font-bold uppercase tracking-wider ${
                        ride.status === 'active'
                          ? 'bg-indigo-400/15 text-indigo-600 dark:text-indigo-400 border border-indigo-400/30'
                          : ride.status === 'in_progress'
                            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 animate-pulse'
                            : ride.status === 'completed'
                              ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                              : 'bg-red-500/15 text-red-600'
                      }`}>
                        {ride.status.replace('_', ' ')}
                      </span>

                      <span className="text-xs font-semibold text-slate-500">
                        {new Date(ride.departureTime).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })} at{' '}
                        {new Date(ride.departureTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {ride.status === 'active' && (
                        <button
                          onClick={() => handleRideStatusChange(ride.id, 'in_progress')}
                          disabled={actionLoading === ride.id}
                          className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold transition-all shadow-md active:scale-95 flex items-center gap-1.5"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>Start Trip</span>
                        </button>
                      )}

                      {ride.status === 'in_progress' && (
                        <button
                          onClick={() => handleRideStatusChange(ride.id, 'completed')}
                          disabled={actionLoading === ride.id}
                          className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-md active:scale-95 flex items-center gap-1.5"
                        >
                          <CheckCheck className="w-4 h-4" />
                          <span>Complete Trip</span>
                        </button>
                      )}

                      {ride.status !== 'completed' && ride.status !== 'cancelled' && (
                        <button
                          onClick={() => handleRideStatusChange(ride.id, 'cancelled')}
                          disabled={actionLoading === ride.id}
                          className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-950/30 text-slate-600 hover:text-red-600 text-xs font-semibold transition-colors"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Route & Passenger Stats */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2 space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="flex flex-col items-center mt-1">
                          <div className="w-3 h-3 rounded-full bg-indigo-600" />
                          <div className="w-0.5 h-7 bg-slate-300 dark:bg-slate-700 my-0.5" />
                          <div className="w-3 h-3 rounded-full bg-slate-950 dark:bg-white" />
                        </div>
                        <div className="flex-1 text-sm space-y-2">
                          <div>
                            <p className="font-bold text-slate-900 dark:text-white">{ride.pickup.address}</p>
                            <p className="text-xs text-slate-400">{ride.pickup.city}</p>
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 dark:text-white">{ride.destination.address}</p>
                            <p className="text-xs text-slate-400">{ride.destination.city}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Seats Capacity:</span>
                        <span className="font-bold text-slate-900 dark:text-white">{ride.availableSeats} of {ride.totalSeats} seats open</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Price Per Seat:</span>
                        <span className="font-bold text-indigo-500">${ride.pricePerSeat}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Total Bookings:</span>
                        <span className="font-bold text-slate-900 dark:text-white">{acceptedPassengers.length} passenger(s)</span>
                      </div>
                    </div>
                  </div>

                  {/* Passenger Requests Moderation Section */}
                  <div className="pt-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
                      Passenger Requests ({ride.passengers.length})
                    </h4>

                    {ride.passengers.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">No passenger requests received yet for this route.</p>
                    ) : (
                      <div className="space-y-3">
                        {ride.passengers.map((p) => (
                          <div
                            key={p.uid}
                            className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                          >
                            <div className="flex items-center gap-3">
                              <img
                                src={p.photoURL || `https://api.dicebear.com/7.x/bottts/svg?seed=${p.uid}`}
                                alt={p.name}
                                className="w-10 h-10 rounded-xl bg-indigo-400/20 object-cover"
                              />
                              <div>
                                <p className="text-sm font-bold text-slate-900 dark:text-white">{p.name}</p>
                                <p className="text-xs text-slate-500">
                                  Requested {p.seatsBooked} seat(s) • Total ${p.fareAmount}
                                </p>
                                {p.pickupNote && (
                                  <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-0.5 italic">
                                    "{p.pickupNote}"
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-2 self-end sm:self-auto">
                              {p.status === 'pending' ? (
                                <>
                                  <button
                                    onClick={() => handleRequestResponse(ride.id, p.uid, 'accepted')}
                                    disabled={actionLoading === `${ride.id}-${p.uid}`}
                                    className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-all shadow-sm active:scale-95 flex items-center gap-1"
                                  >
                                    <CheckCircle className="w-3.5 h-3.5" />
                                    <span>Accept</span>
                                  </button>

                                  <button
                                    onClick={() => handleRequestResponse(ride.id, p.uid, 'rejected')}
                                    disabled={actionLoading === `${ride.id}-${p.uid}`}
                                    className="px-3.5 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-red-100 dark:hover:bg-red-950/40 hover:text-red-600 text-slate-700 dark:text-slate-300 font-semibold text-xs transition-colors"
                                  >
                                    Decline
                                  </button>
                                </>
                              ) : (
                                <span className={`px-3 py-1 rounded-xl text-xs font-bold capitalize ${
                                  p.status === 'accepted'
                                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                                    : 'bg-red-500/15 text-red-600'
                                }`}>
                                  {p.status}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        /* Passenger Tab Content */
        passengerRides.length === 0 ? (
          <EmptyState
            title="No booked rides yet."
            description="You haven't requested to join any RouteMate trips yet. Search available routes heading in your direction!"
            actionText="Find RouteMate"
            onAction={() => onNavigate('find-routemate')}
          />
        ) : (
          <div className="space-y-6">
            {passengerRides.map((ride) => {
              const myBooking = ride.passengers.find(p => p.uid === user?.uid);

              return (
                <div
                  key={ride.id}
                  className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200 dark:border-slate-800 space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                      <img
                        src={ride.creatorPhoto || `https://api.dicebear.com/7.x/bottts/svg?seed=${ride.creatorId}`}
                        alt={ride.creatorName}
                        className="w-12 h-12 rounded-2xl bg-indigo-400/20 object-cover border border-indigo-400/30"
                      />
                      <div>
                        <p className="text-sm font-bold text-slate-950 dark:text-white">Driver: {ride.creatorName}</p>
                        <p className="text-xs text-slate-500">
                          {ride.vehicle ? `${ride.vehicle.color} ${ride.vehicle.make} ${ride.vehicle.model}` : 'Verified Driver'}
                        </p>
                      </div>
                    </div>

                    <div className="text-left sm:text-right">
                      <span className={`inline-block px-3 py-1 rounded-xl text-xs font-bold capitalize ${
                        myBooking?.status === 'accepted'
                          ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                          : myBooking?.status === 'pending'
                            ? 'bg-indigo-400/15 text-indigo-600 dark:text-indigo-400 border border-indigo-400/30'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600'
                      }`}>
                        Request Status: {myBooking?.status || 'Active'}
                      </span>
                    </div>
                  </div>

                  <div className="py-2 flex items-start gap-3">
                    <div className="flex flex-col items-center mt-1">
                      <div className="w-3 h-3 rounded-full bg-indigo-600" />
                      <div className="w-0.5 h-6 bg-slate-300 dark:bg-slate-700 my-0.5" />
                      <div className="w-3 h-3 rounded-full bg-slate-950 dark:bg-white" />
                    </div>
                    <div className="flex-1 text-xs space-y-2">
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white">{ride.pickup.address || ride.pickup.city}</p>
                        <p className="text-[11px] text-slate-400">Pickup</p>
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white">{ride.destination.address || ride.destination.city}</p>
                        <p className="text-[11px] text-slate-400">Destination</p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 flex flex-wrap items-center justify-between gap-3 text-xs border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-4 text-slate-600 dark:text-slate-400">
                      <span>Seats: <strong className="text-slate-900 dark:text-white">{myBooking?.seatsBooked || 1}</strong></span>
                      <span>Total Fare: <strong className="text-indigo-500 font-display">${myBooking?.fareAmount || ride.pricePerSeat}</strong></span>
                      <span>Departure: <strong className="text-slate-900 dark:text-white">{new Date(ride.departureTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong></span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onNavigate('report-user', { reportedUserId: ride.creatorId, reportedUserName: ride.creatorName, rideId: ride.id })}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-colors"
                      >
                        Report Driver
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}
    </div>
  );
};
