import React, { useState } from 'react';
import { 
  Navigation, 
  MapPin, 
  Users, 
  Clock, 
  DollarSign, 
  Car, 
  CheckCircle, 
  AlertCircle, 
  MessageSquare, 
  ArrowLeft,
  ShieldCheck,
  Star,
  Send
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAuth } from '../../contexts/AuthContext';
import { requestRide } from '../../services/rideService';
import { Ride } from '../../types';

interface RideRequestViewProps {
  ride: Ride;
  onBack: () => void;
  onRequestSuccess: () => void;
}

export const RideRequestView: React.FC<RideRequestViewProps> = ({
  ride,
  onBack,
  onRequestSuccess
}) => {
  const { user, profile } = useAuth();
  const [seats, setSeats] = useState(1);
  const [pickupNote, setPickupNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalFare = Math.round(seats * ride.pricePerSeat * 100) / 100;
  const platformFee = Math.round(totalFare * 0.1 * 100) / 100;
  const grandTotal = Math.round((totalFare + platformFee) * 100) / 100;

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile) {
      setError('Please log in to submit a ride request.');
      return;
    }

    if (seats > ride.availableSeats) {
      setError(`Only ${ride.availableSeats} seat(s) available.`);
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      await requestRide(ride.id, profile, seats, pickupNote);
      
      // Joyous celebration effect
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#6256f5', '#EAB308', '#000000', '#FFFFFF']
      });

      onRequestSuccess();
    } catch (err: any) {
      console.error('Ride request error:', err);
      setError(err?.message || 'Failed to submit ride request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to search results</span>
      </button>

      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-800">
        
        {/* Header */}
        <div className="text-center sm:text-left mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-400/15 text-indigo-600 dark:text-indigo-400 font-bold text-xs mb-2">
            <Car className="w-3.5 h-3.5" />
            Route Booking Request
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-slate-950 dark:text-white">
            Request to Join RouteMate
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Submit your seat reservation request directly to the verified driver.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/80 flex items-start gap-3 text-xs text-red-700 dark:text-red-300">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Route Snapshot */}
        <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-700/80">
            <div className="flex items-center gap-3">
              <img
                src={ride.creatorPhoto || `https://api.dicebear.com/7.x/bottts/svg?seed=${ride.creatorId}`}
                alt={ride.creatorName}
                className="w-12 h-12 rounded-2xl bg-indigo-400/20 object-cover border border-indigo-400/30"
              />
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <span>{ride.creatorName}</span>
                  <span className="text-xs text-indigo-500">★ {ride.creatorRating?.toFixed(1) || '5.0'}</span>
                </p>
                <p className="text-xs text-slate-500">
                  {ride.vehicle ? `${ride.vehicle.color} ${ride.vehicle.make} ${ride.vehicle.model} • ${ride.vehicle.licensePlate}` : 'Verified Driver'}
                </p>
              </div>
            </div>

            <div className="text-left sm:text-right">
              <p className="text-xs font-semibold text-slate-400">Departure Time</p>
              <p className="text-sm font-bold text-slate-900 dark:text-white">
                {new Date(ride.departureTime).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })} at{' '}
                {new Date(ride.departureTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>

          <div className="pt-4 flex items-start gap-3">
            <div className="flex flex-col items-center mt-1">
              <div className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
              <div className="w-0.5 h-6 bg-slate-300 dark:bg-slate-700 my-0.5" />
              <div className="w-2.5 h-2.5 rounded-full bg-slate-950 dark:bg-white" />
            </div>
            <div className="flex-1 text-xs space-y-2">
              <div>
                <p className="font-bold text-slate-900 dark:text-white">From: {ride.pickup.address || ride.pickup.city}</p>
                <p className="text-[11px] text-slate-500">{ride.pickup.city}</p>
              </div>
              <div>
                <p className="font-bold text-slate-900 dark:text-white">To: {ride.destination.address || ride.destination.city}</p>
                <p className="text-[11px] text-slate-500">{ride.destination.city}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Form Controls */}
        <form onSubmit={handleSubmitRequest} className="space-y-5">
          
          {/* Seat Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
              Number of Seats to Reserve
            </label>
            <div className="flex items-center gap-3">
              {[...Array(Math.min(ride.availableSeats, 4))].map((_, i) => {
                const s = i + 1;
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSeats(s)}
                    className={`flex-1 py-3 rounded-2xl border text-center transition-all ${
                      seats === s
                        ? 'border-indigo-400 bg-indigo-600 text-white font-extrabold shadow-md'
                        : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span className="text-base">{s}</span>
                    <span className="text-[10px] block font-semibold">{s === 1 ? 'Seat' : 'Seats'}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Pickup Note / Message to Driver */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Pickup Note / Message to Driver (Optional)
            </label>
            <div className="relative">
              <MessageSquare className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <textarea
                rows={2}
                placeholder="e.g., I will wait near the main entrance plaza with a yellow backpack..."
                value={pickupNote}
                onChange={(e) => setPickupNote(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
          </div>

          {/* Fair Breakdown Summary */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 space-y-2 text-xs">
            <div className="flex justify-between text-slate-600 dark:text-slate-400">
              <span>Ride Price ({seats} seat × ${ride.pricePerSeat})</span>
              <span className="font-semibold text-slate-900 dark:text-white">${totalFare.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-600 dark:text-slate-400">
              <span>Platform Safety Fee (10%)</span>
              <span className="font-semibold text-slate-900 dark:text-white">${platformFee.toFixed(2)}</span>
            </div>
            <div className="h-px bg-slate-200 dark:bg-slate-700 my-1" />
            <div className="flex justify-between text-sm font-bold text-slate-900 dark:text-white">
              <span>Total Estimated Fare</span>
              <span className="text-indigo-500 font-display text-base">${grandTotal.toFixed(2)}</span>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting || ride.availableSeats <= 0}
            className="w-full py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-base transition-all shadow-xl shadow-indigo-400/25 active:scale-98 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {submitting ? (
              <span className="animate-spin rounded-full h-5 w-5 border-2 border-slate-950 border-t-transparent" />
            ) : (
              <>
                <Send className="w-5 h-5" />
                <span>Confirm & Send Request to Driver</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
