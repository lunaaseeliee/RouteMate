import React, { useState } from 'react';
import {
  PlusCircle,
  Calendar,
  Clock,
  Users,
  DollarSign,
  Car,
  AlertCircle,
  Navigation,
  MapPin,
  Sparkles,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAuth } from '../../contexts/AuthContext';
import { createRide } from '../../services/rideService';
import { GoogleMapsPlace, CalculatedRouteInfo, LocationPoint } from '../../types';
import { estimateRouteInfo } from '../../lib/polyline';
import { GoogleMapsWrapper } from '../maps/GoogleMapsWrapper';
import { PlaceAutocompleteInput } from '../maps/PlaceAutocompleteInput';
import { InteractiveRouteMap } from '../maps/InteractiveRouteMap';
import { RouteStatsDisplay } from '../maps/RouteStatsDisplay';

interface PostRideViewProps {
  initialPickup?: string;
  initialDestination?: string;
  onPostSuccess: () => void;
}

export const PostRideView: React.FC<PostRideViewProps> = ({
  initialPickup = '',
  initialDestination = '',
  onPostSuccess
}) => {
  const { user, profile } = useAuth();

  // Selected Google Places
  const [pickupPlace, setPickupPlace] = useState<GoogleMapsPlace | null>(null);
  const [destinationPlace, setDestinationPlace] = useState<GoogleMapsPlace | null>(null);

  const [selectionMode, setSelectionMode] = useState<'pickup' | 'destination' | null>(null);

  // Live Calculated Route info
  const [routeInfo, setRouteInfo] = useState<CalculatedRouteInfo | null>(null);
  const [routeError, setRouteError] = useState<string | null>(null);

  const effectiveRouteInfo =
    routeInfo ||
    (pickupPlace && destinationPlace
      ? estimateRouteInfo(
        { lat: pickupPlace.latitude, lng: pickupPlace.longitude },
        { lat: destinationPlace.latitude, lng: destinationPlace.longitude }
      )
      : null);

  // Ride scheduling and logistics
  const [departureDate, setDepartureDate] = useState(() => {
    const today = new Date();
    today.setHours(today.getHours() + 2);
    return today.toISOString().split('T')[0];
  });

  const [departureTime, setDepartureTime] = useState('09:00');
  const [totalSeats, setTotalSeats] = useState(3);
  const [pricePerSeat, setPricePerSeat] = useState(15.00);
  const [notes, setNotes] = useState('Commuting on this route. Clean car, spacious trunk for luggage.');

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleUseCurrentLocation = () => {
    if (navigator.geolocation) {
      setFormError(null);
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          const accuracy = position.coords.accuracy;
          
          console.log(`GPS Success: lat=${lat}, lng=${lng}, accuracy=${accuracy}m`);
          
          if (accuracy > 5000) {
            setFormError('Your browser location is approximate. Choose on Map for better accuracy.');
          }

          try {
            if (typeof google !== 'undefined') {
              let Geocoder = google.maps?.Geocoder;
              if (!Geocoder && google.maps?.importLibrary) {
                const geocodingLib = await google.maps.importLibrary('geocoding');
                Geocoder = (geocodingLib as any).Geocoder;
              }
              
              if (Geocoder) {
                const geocoder = new Geocoder();
                const res = await geocoder.geocode({ location: { lat, lng } });
                if (res.results && res.results.length > 0) {
                  const first = res.results[0];
                  let city = 'Current Location';
                  if (first.address_components) {
                    const locality = first.address_components.find((c: any) => 
                      c.types.includes('locality') || 
                      c.types.includes('sublocality') ||
                      c.types.includes('administrative_area_level_2') ||
                      c.types.includes('postal_town')
                    );
                    if (locality) city = locality.long_name;
                  }
                  setPickupPlace({
                    placeId: first.place_id,
                    formattedAddress: first.formatted_address,
                    latitude: lat,
                    longitude: lng,
                    displayName: first.formatted_address.split(',')[0],
                    city
                  });
                  return;
                } else {
                  console.warn("Reverse geocoding returned ZERO_RESULTS.");
                  setFormError("Could not find a specific address for this location, but coordinates were saved.");
                }
              }
            }
            // Fallback if Geocoder fails or is missing
            setPickupPlace({
              placeId: 'loc-' + Date.now(),
              formattedAddress: `Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`,
              latitude: lat,
              longitude: lng,
              displayName: 'Current Location',
              city: 'Unknown'
            });
          } catch (err: any) {
            console.error("Reverse geocoding failed:", err);
            setPickupPlace({
              placeId: 'loc-' + Date.now(),
              formattedAddress: `Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`,
              latitude: lat,
              longitude: lng,
              displayName: 'Current Location',
              city: 'Unknown'
            });
          }
        },
        (err) => {
          console.error(err);
          setFormError('Could not access your location. Please check your browser permissions.');
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 0
        }
      );
    } else {
      setFormError('Geolocation is not supported by your browser.');
    }
  };

  const handlePostRide = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Rule 15 & 16: Only authenticated users may post routes, and userId must come from authenticated UID
    if (!user || !user.uid) {
      setFormError('Authentication required: Please sign in to post a route.');
      return;
    }

    if (!pickupPlace) {
      setFormError('Please search and select a valid Pickup Location from Google Places suggestions.');
      return;
    }

    if (!destinationPlace) {
      setFormError('Please search and select a valid Destination from Google Places suggestions.');
      return;
    }

    if (!effectiveRouteInfo) {
      setFormError(routeError || 'A valid driving route must be calculated before posting.');
      return;
    }

    setSubmitting(true);

    try {
      const departureDateTime = new Date(`${departureDate}T${departureTime}:00`).toISOString();

      const pickupPoint: LocationPoint = {
        address: pickupPlace.formattedAddress,
        city: pickupPlace.city || 'Origin City',
        lat: pickupPlace.latitude,
        lng: pickupPlace.longitude
      };

      const destinationPoint: LocationPoint = {
        address: destinationPlace.formattedAddress,
        city: destinationPlace.city || 'Destination City',
        lat: destinationPlace.latitude,
        lng: destinationPlace.longitude
      };

      // Save to Firestore rides/{rideId} with all required fields
      await createRide(
        profile || {
          uid: user.uid,
          name: user.displayName || user.email?.split('@')[0] || 'RouteMate User',
          email: user.email || '',
          phoneNumber: user.phoneNumber || '',
          emailVerified: user.emailVerified || false,
          phoneVerified: true,
          role: 'user',
          rating: 5.0,
          createdAt: new Date().toISOString(),
          accountStatus: 'active',
          onboardingComplete: true
        },
        pickupPoint,
        destinationPoint,
        departureDateTime,
        Number(totalSeats),
        Number(pricePerSeat),
        effectiveRouteInfo.distanceKm,
        effectiveRouteInfo.durationMinutes,
        notes,
        {
          pickupPlaceId: pickupPlace.placeId,
          destinationPlaceId: destinationPlace.placeId,
          distanceMeters: effectiveRouteInfo.distanceMeters,
          durationSeconds: effectiveRouteInfo.durationSeconds,
          routePolyline: effectiveRouteInfo.encodedPolyline
        }
      );

      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#6256f5', '#10B981', '#000000']
      });

      onPostSuccess();
    } catch (err: any) {
      console.error('Error creating ride in Firestore:', err);
      setFormError(err?.message || 'We couldn’t publish your ride. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-800">

        {/* Header */}
        <div className="mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-400/15 text-indigo-600 dark:text-indigo-400 font-bold text-xs mb-2">
            <PlusCircle className="w-3.5 h-3.5" />
            MAKE YOUR NEXT TRIP A SHARED ONE
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold font-display text-slate-950 dark:text-white">
            Offer a ride
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Set your route, choose a departure time, and make your spare seats available.
          </p>
        </div>

        {/* Global form errors */}
        {formError && (
          <div className="mb-6 p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/80 flex items-start gap-3 text-xs text-red-700 dark:text-red-300">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{formError}</span>
          </div>
        )}

        {/* Google Maps Wrapper with Places & Routes API */}
        <GoogleMapsWrapper>
          <form onSubmit={handlePostRide} className="space-y-6">

            {/* Location Autocomplete Inputs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <PlaceAutocompleteInput
                  id="post-ride-pickup"
                  label="Pickup Location"
                  placeholder="Search pickup place, street, or landmark..."
                  icon={MapPin}
                  iconColorClass="text-emerald-500"
                  selectedPlace={pickupPlace}
                  onPlaceSelect={(place) => {
                    setPickupPlace(place);
                    setFormError(null);
                  }}
                  required
                />
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => setSelectionMode(selectionMode === 'pickup' ? null : 'pickup')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${selectionMode === 'pickup' ? 'bg-indigo-600 text-white border-indigo-400' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{selectionMode === 'pickup' ? 'Selecting on Map...' : 'Choose on Map'}</span>
                  </button>
                  {/* 
                  <button
                    type="button"
                    onClick={handleUseCurrentLocation}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-medium transition-colors"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    <span>Use Current Location</span>
                  </button>
                  */}
                </div>
              </div>

              <div>
                <PlaceAutocompleteInput
                  id="post-ride-destination"
                  label="Destination"
                  placeholder="Search destination, city, or airport..."
                  icon={Navigation}
                  iconColorClass="text-indigo-500"
                  selectedPlace={destinationPlace}
                  onPlaceSelect={(place) => {
                    setDestinationPlace(place);
                    setFormError(null);
                  }}
                  required
                />
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <button
                    type="button"
                    onClick={() => setSelectionMode(selectionMode === 'destination' ? null : 'destination')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${selectionMode === 'destination' ? 'bg-indigo-600 text-white border-indigo-400' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{selectionMode === 'destination' ? 'Selecting on Map...' : 'Choose on Map'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Interactive Map Stage */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Live Map & Driving Route Preview
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Select locations or choose directly on the map
                </span>
              </div>

              <InteractiveRouteMap
                pickup={pickupPlace}
                destination={destinationPlace}
                onRouteChange={(info) => {
                  setRouteInfo(info);
                  if (info) setRouteError(null);
                }}
                onRouteError={(err) => {
                  setRouteError(err);
                  if (err) setRouteInfo(null);
                }}
                selectionMode={selectionMode}
                onMapClick={(place) => {
                  if (selectionMode === 'pickup') {
                    setPickupPlace(place);
                    setSelectionMode(null);
                  } else if (selectionMode === 'destination') {
                    setDestinationPlace(place);
                    setSelectionMode(null);
                  }
                }}
              />
            </div>

            {/* Route Summary & Distance / ETA Display */}
            <RouteStatsDisplay
              pickup={pickupPlace}
              destination={destinationPlace}
              routeInfo={effectiveRouteInfo}
            />

            {/* Ride Logistics: Date, Time, Capacity, Pricing */}
            <div className="border-t border-slate-200 dark:border-slate-800 pt-6 space-y-5">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Departure & Ride Details
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    Departure Date *
                  </label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="date"
                      required
                      value={departureDate}
                      onChange={(e) => setDepartureDate(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-400 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    Departure Time *
                  </label>
                  <div className="relative">
                    <Clock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="time"
                      required
                      value={departureTime}
                      onChange={(e) => setDepartureTime(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-400 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    Available Passenger Seats
                  </label>
                  <div className="relative">
                    <Users className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <select
                      value={totalSeats}
                      onChange={(e) => setTotalSeats(Number(e.target.value))}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-400 focus:outline-none"
                    >
                      {[1, 2, 3, 4, 5, 6].map(n => (
                        <option key={n} value={n}>{n} {n === 1 ? 'Passenger Seat' : 'Passenger Seats'}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    Price Per Seat ($ USD)
                  </label>
                  <div className="relative">
                    <DollarSign className="w-4 h-4 text-indigo-500 absolute left-3.5 top-3.5" />
                    <input
                      type="number"
                      step="0.50"
                      min="1"
                      max="200"
                      required
                      value={pricePerSeat}
                      onChange={(e) => setPricePerSeat(Number(e.target.value))}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-400 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Trip Notes / Co-Rider Guidelines
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Taking highway route, trunk space for 2 bags, non-smoking vehicle..."
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-400 focus:outline-none"
                />
              </div>
            </div>

            {/* Confirm & Post Button */}
            <button
              type="submit"
              disabled={submitting || !pickupPlace || !destinationPlace || !effectiveRouteInfo}
              className="w-full py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 text-white font-bold text-base transition-all shadow-xl shadow-indigo-400/20 active:scale-98 flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
            >
              {submitting ? (
                <span className="animate-spin rounded-full h-5 w-5 border-2 border-slate-950 border-t-transparent" />
              ) : (
                <>
                  <Car className="w-5 h-5" />
                  <span>Confirm & Post Route to RouteMate</span>
                </>
              )}
            </button>
          </form>
        </GoogleMapsWrapper>
      </div>
    </div>
  );
};
