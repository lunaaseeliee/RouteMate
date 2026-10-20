import React, { useState, useEffect } from 'react';
import { 
  History, 
  Car, 
  Users, 
  Clock, 
  MapPin, 
  Navigation, 
  DollarSign, 
  AlertTriangle, 
  Star,
  Receipt,
  CheckCircle,
  XCircle,
  Calendar
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getMyRides } from '../../services/rideService';
import { Ride } from '../../types';
import { EmptyState } from '../common/EmptyState';

interface RideHistoryViewProps {
  onNavigate: (view: string, data?: any) => void;
}

export const RideHistoryView: React.FC<RideHistoryViewProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [historyRides, setHistoryRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'completed' | 'cancelled'>('all');

  useEffect(() => {
    if (user?.uid) {
      getMyRides(user.uid).then(data => {
        const combined = [...data.asDriver, ...data.asPassenger];
        const finished = combined.filter(r => r.status === 'completed' || r.status === 'cancelled');
        // Sort descending by date
        finished.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setHistoryRides(finished);
        setLoading(false);
      });
    }
  }, [user]);

  const filtered = historyRides.filter(r => {
    if (filter === 'completed') return r.status === 'completed';
    if (filter === 'cancelled') return r.status === 'cancelled';
    return true;
  });

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-slate-950 dark:text-white">
            Past Ride History
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Archive of all your completed and cancelled RouteMate journeys.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center p-1 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 self-start">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filter === 'all'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            All Trips ({historyRides.length})
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filter === 'completed'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Completed
          </button>
          <button
            onClick={() => setFilter('cancelled')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filter === 'cancelled'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Cancelled
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center space-y-3">
          <div className="w-10 h-10 border-4 border-indigo-400 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-semibold text-slate-500">Loading history records...</p>
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No ride history found."
          description="You don't have any past journeys recorded in this category yet."
          actionText="Search Available Routes"
          onAction={() => onNavigate('find-routemate')}
        />
      ) : (
        <div className="space-y-4">
          {filtered.map((ride) => {
            const isDriver = ride.creatorId === user?.uid;
            const isSuccess = ride.status === 'completed';

            return (
              <div
                key={ride.id}
                className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 shadow-lg border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-indigo-400 transition-colors"
              >
                <div className="space-y-3 flex-1">
                  <div className="flex items-center gap-3">
                    <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
                      isSuccess
                        ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                        : 'bg-red-500/15 text-red-600'
                    }`}>
                      {ride.status}
                    </span>

                    <span className="text-xs font-semibold text-slate-500 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(ride.departureTime).toLocaleDateString()}
                    </span>

                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      {isDriver ? '🚗 Offered as Driver' : '🎒 Joined as Passenger'}
                    </span>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <div className="flex flex-col items-center mt-0.5">
                      <div className="w-2 h-2 rounded-full bg-indigo-600" />
                      <div className="w-0.5 h-4 bg-slate-300 dark:bg-slate-700 my-0.5" />
                      <div className="w-2 h-2 rounded-full bg-slate-950 dark:bg-white" />
                    </div>
                    <div className="text-xs space-y-1">
                      <p className="font-bold text-slate-900 dark:text-white">
                        {ride.pickup.city} ➔ {ride.destination.city}
                      </p>
                      <p className="text-[11px] text-slate-500 truncate">{ride.pickup.address} to {ride.destination.address}</p>
                    </div>
                  </div>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 shrink-0 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100 dark:border-slate-800">
                  <div className="text-left sm:text-right">
                    <p className="text-lg font-extrabold font-display text-indigo-500">
                      ${ride.pricePerSeat}
                    </p>
                    <p className="text-[10px] text-slate-400 font-semibold uppercase">per seat</p>
                  </div>

                  {!isDriver && (
                    <button
                      onClick={() => onNavigate('report-user', { reportedUserId: ride.creatorId, reportedUserName: ride.creatorName, rideId: ride.id })}
                      className="px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-600 text-slate-600 text-xs font-semibold transition-colors"
                    >
                      Report Trip
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
