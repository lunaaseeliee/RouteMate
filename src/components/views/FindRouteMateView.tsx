import React, { useState, useEffect } from 'react';
import {
  Compass,
  MapPin,
  Navigation,
  Search,
  Calendar,
  Users,
  DollarSign,
  Car,
  Star,
  Clock,
  Filter,
  PlusCircle,
  ShieldCheck,
  Cigarette,
  PawPrint,
  Volume2,
  CheckCircle2,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { searchRides } from '../../services/rideService';
import { dijkstra, WeightedGraph } from '../../lib/dijkstra';
import { Ride, RideSearchFilters } from '../../types';
import { EmptyState } from '../common/EmptyState';
const calculateRideCost = (ride: Ride): number => {
  const distanceCost = ride.distanceKm || 0;
  const timeCost = (ride.estimatedDurationMinutes || 0) / 10;
  const priceCost = (ride.pricePerSeat || 0) / 20;

  const ratingPenalty = ride.creatorRating
    ? Math.max(0, 5 - ride.creatorRating)
    : 1;

  return distanceCost + timeCost + priceCost + ratingPenalty;
};
const rankRidesWithDijkstra = (rides: Ride[]): Ride[] => {
  const remaining = [...rides];
  const ranked: Ride[] = [];

  while (remaining.length > 0) {
    const graph: WeightedGraph = {
      START: {},
      END: {}
    };

    remaining.forEach((ride) => {
      const rideNode = `RIDE_${ride.id}`;

      graph.START[rideNode] = calculateRideCost(ride);
      graph[rideNode] = {
        END: 0
      };
    });

    const result = dijkstra(graph, 'START', 'END');

    const bestRideNode = result.path.find((node) =>
      node.startsWith('RIDE_')
    );

    if (!bestRideNode) break;

    const bestRideId = bestRideNode.replace('RIDE_', '');

    const bestRideIndex = remaining.findIndex(
      (ride) => ride.id === bestRideId
    );

    if (bestRideIndex === -1) break;

    ranked.push(remaining[bestRideIndex]);
    remaining.splice(bestRideIndex, 1);
  }

  return ranked;
};
interface FindRouteMateViewProps {
  initialPickupCity?: string;
  initialDestinationCity?: string;
  onNavigate: (view: string, data?: any) => void;
  onSelectRide: (ride: Ride) => void;
}

export const FindRouteMateView: React.FC<FindRouteMateViewProps> = ({
  initialPickupCity = '',
  initialDestinationCity = '',
  onNavigate,
  onSelectRide,
}) => {
  const { user } = useAuth();

  const [pickupQuery, setPickupQuery] = useState(initialPickupCity);
  const [destinationQuery, setDestinationQuery] = useState(initialDestinationCity);
  const [dateFilter, setDateFilter] = useState('');
  const [seatsNeeded, setSeatsNeeded] = useState(1);
  const [maxPrice, setMaxPrice] = useState<number | undefined>(undefined);

  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasSearched, setHasSearched] = useState(false);

  const fetchAvailableRides = async () => {
    setLoading(true);
    try {
      const filters: RideSearchFilters = {
        pickupCity: pickupQuery,
        destinationCity: destinationQuery,
        date: dateFilter || undefined,
        seatsNeeded,
        maxPrice: maxPrice ? Number(maxPrice) : undefined
      };
      const results = await searchRides(filters);

      const rankedResults = rankRidesWithDijkstra(results);

      setRides(rankedResults);
      setHasSearched(true);
    } catch (err) {
      console.error('Error querying rides from Firestore:', err);
      setRides([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAvailableRides();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchAvailableRides();
  };

  const handleResetFilters = () => {
    setPickupQuery('');
    setDestinationQuery('');
    setDateFilter('');
    setSeatsNeeded(1);
    setMaxPrice(undefined);
    searchRides({}).then(setRides);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-400/15 border border-indigo-400/30 text-indigo-600 dark:text-indigo-400 font-bold text-xs mb-2">
            <Compass className="w-3.5 h-3.5" />
            FIND YOUR NEXT CONNECTION
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-slate-950 dark:text-white">
            Find a RouteMate
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            A shared ride for wherever life takes you next.
          </p>
        </div>

        <button
          onClick={() => onNavigate('post-ride')}
          className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm transition-all shadow-md shadow-indigo-400/20 active:scale-95 shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Post Your Route</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 shadow-xl border border-slate-200 dark:border-slate-800">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">

          {/* Pickup Query */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Pickup Area
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-indigo-500 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="From: City / Place"
                value={pickupQuery}
                onChange={(e) => setPickupQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
          </div>

          {/* Destination Query */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Destination
            </label>
            <div className="relative">
              <Navigation className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="To: City / Place"
                value={destinationQuery}
                onChange={(e) => setDestinationQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
          </div>

          {/* Date Filter */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Travel Date
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
          </div>

          {/* Seats Needed */}
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
              Seats Needed
            </label>
            <div className="relative">
              <Users className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <select
                value={seatsNeeded}
                onChange={(e) => setSeatsNeeded(Number(e.target.value))}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
              >
                {[1, 2, 3, 4, 5, 6].map(n => (
                  <option key={n} value={n}>{n} {n === 1 ? 'seat' : 'seats'}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Submit Search Button */}
          <div className="flex items-end gap-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-all shadow-sm active:scale-95 flex items-center justify-center gap-1.5"
            >
              {loading ? (
                <span className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-slate-950 border-t-transparent" />
              ) : (
                <>
                  <Search className="w-3.5 h-3.5" />
                  <span>Search</span>
                </>
              )}
            </button>

            {(pickupQuery || destinationQuery || dateFilter || maxPrice) && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold hover:bg-slate-200 dark:hover:bg-slate-700"
              >
                Reset
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Results Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
            {loading ? 'Finding your next ride…' : `${rides.length} rides available`}
          </p>
        </div>

        {loading ? (
          <div className="py-20 text-center space-y-3">
            <div className="w-10 h-10 border-4 border-indigo-400 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm font-semibold text-slate-500">Looking for rides along your route…</p>
          </div>
        ) : rides.length === 0 ? (
          /* Exact Requirement: No RouteMates available yet empty state */
          <EmptyState
            title="No RouteMates available yet."
            description="No rides match your plans yet. Try another date or share your own route for others to join."
            actionText="Post This Route"
            onAction={() => onNavigate('post-ride', { pickup: pickupQuery, destination: destinationQuery })}
            secondaryActionText="Clear Search Filters"
            onSecondaryAction={handleResetFilters}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {rides.map((ride) => {
              const departureDate = new Date(ride.departureTime);
              const formattedDate = departureDate.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
              const formattedTime = departureDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              const isOwner = user?.uid === ride.creatorId;

              return (
                <div
                  key={ride.id}
                  className="bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between hover:border-indigo-400 transition-all group"
                >
                  <div>
                    {/* Top Driver Info & Price */}
                    <div className="flex items-start justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-3">
                        <img
                          src={ride.creatorPhoto || `https://api.dicebear.com/7.x/bottts/svg?seed=${ride.creatorId}`}
                          alt={ride.creatorName}
                          className="w-12 h-12 rounded-2xl bg-indigo-400/20 object-cover border border-indigo-400/30"
                        />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h3 className="text-sm font-bold text-slate-950 dark:text-white">
                              {ride.creatorName}
                            </h3>
                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-indigo-600 text-white">
                              ★ {ride.creatorRating?.toFixed(1) || '5.0'}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 truncate">
                            {ride.vehicle ? `${ride.vehicle.make} ${ride.vehicle.model}` : 'Verified Driver'}
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="text-2xl font-extrabold font-display text-indigo-500">
                          ${ride.pricePerSeat}
                        </p>
                        <p className="text-[10px] text-slate-400 font-semibold uppercase">per seat</p>
                      </div>
                    </div>

                    {/* Route Schedule & Corridor */}
                    <div className="py-4 space-y-3">
                      <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                        <Clock className="w-4 h-4 text-indigo-500 shrink-0" />
                        <span>{formattedDate} • {formattedTime}</span>
                        <span className="text-slate-400">({ride.estimatedDurationMinutes || 30} mins)</span>
                      </div>

                      {/* Route Path Visual */}
                      <div className="flex items-start gap-2.5 pl-0.5">
                        <div className="flex flex-col items-center mt-1">
                          <div className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
                          <div className="w-0.5 h-6 bg-slate-300 dark:bg-slate-700 my-0.5" />
                          <div className="w-2.5 h-2.5 rounded-full bg-slate-950 dark:bg-white" />
                        </div>
                        <div className="flex-1 text-xs space-y-2">
                          <div>
                            <p className="font-bold text-slate-900 dark:text-white truncate">
                              {ride.pickup.city}
                            </p>
                            <p className="text-[11px] text-slate-400 truncate">{ride.pickup.address}</p>
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 dark:text-white truncate">
                              {ride.destination.city}
                            </p>
                            <p className="text-[11px] text-slate-400 truncate">{ride.destination.address}</p>
                          </div>
                        </div>
                      </div>

                      {/* Vehicle & Preference Pills */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-2">
                        <span className="px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-700 dark:text-slate-300">
                          {ride.availableSeats} of {ride.totalSeats} seats left
                        </span>
                        {ride.preferences?.petsAllowed && (
                          <span className="px-2 py-0.5 rounded-lg bg-indigo-400/10 text-indigo-600 dark:text-indigo-400 text-[10px] font-semibold flex items-center gap-1">
                            <PawPrint className="w-3 h-3" /> Pet friendly
                          </span>
                        )}
                        {ride.preferences?.musicAllowed && (
                          <span className="px-2 py-0.5 rounded-lg bg-indigo-400/10 text-indigo-600 dark:text-indigo-400 text-[10px] font-semibold flex items-center gap-1">
                            <Volume2 className="w-3 h-3" /> Music on
                          </span>
                        )}
                      </div>

                      {ride.notes && (
                        <p className="text-xs text-slate-500 italic bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-xl line-clamp-2">
                          "{ride.notes}"
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                    {isOwner ? (
                      <button
                        onClick={() => onNavigate('my-rides')}
                        className="w-full py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs transition-colors"
                      >
                        Manage Your Route
                      </button>
                    ) : (
                      <button
                        onClick={() => onSelectRide(ride)}
                        disabled={ride.availableSeats <= 0}
                        className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-all shadow-md shadow-indigo-400/20 active:scale-98 flex items-center justify-center gap-1.5 disabled:opacity-50"
                      >
                        <span>Request to Join Route</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
