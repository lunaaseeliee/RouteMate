import React, { useState } from 'react';
import { 
  Navigation, 
  MapPin, 
  ArrowRight, 
  ArrowLeft, 
  Sparkles,
  Car
} from 'lucide-react';
import { LocationPoint, GoogleMapsPlace, CalculatedRouteInfo } from '../../types';
import { estimateRouteInfo } from '../../lib/polyline';
import { GoogleMapsWrapper } from '../maps/GoogleMapsWrapper';
import { PlaceAutocompleteInput } from '../maps/PlaceAutocompleteInput';
import { InteractiveRouteMap } from '../maps/InteractiveRouteMap';
import { RouteStatsDisplay } from '../maps/RouteStatsDisplay';

interface DestinationLocationViewProps {
  pickup: LocationPoint;
  onBack: () => void;
  onConfirmRoute: (
    pickup: LocationPoint, 
    destination: LocationPoint, 
    routeDetails: { distanceKm: number; durationMinutes: number; estimatedPrice: number }
  ) => void;
}

export const DestinationLocationView: React.FC<DestinationLocationViewProps> = ({
  pickup,
  onBack,
  onConfirmRoute
}) => {
  const pickupPlace: GoogleMapsPlace = {
    placeId: '',
    formattedAddress: pickup.address,
    latitude: pickup.lat,
    longitude: pickup.lng,
    city: pickup.city
  };

  const [destinationPlace, setDestinationPlace] = useState<GoogleMapsPlace | null>(null);
  const [routeInfo, setRouteInfo] = useState<CalculatedRouteInfo | null>(null);
  const [routeError, setRouteError] = useState<string | null>(null);

  const effectiveRouteInfo =
    routeInfo ||
    (destinationPlace
      ? estimateRouteInfo(
          { lat: pickup.lat, lng: pickup.lng },
          { lat: destinationPlace.latitude, lng: destinationPlace.longitude }
        )
      : null);

  const handleProceedToFind = (e: React.FormEvent) => {
    e.preventDefault();
    if (!destinationPlace || !effectiveRouteInfo) return;

    const destPoint: LocationPoint = {
      address: destinationPlace.formattedAddress,
      city: destinationPlace.city || 'Destination Area',
      lat: destinationPlace.latitude,
      lng: destinationPlace.longitude
    };

    // Calculate dynamic fair price based on actual calculated distance
    const baseFare = 5.0;
    const ratePerKm = 0.85;
    const estimatedPrice = Math.max(8.0, Math.round((baseFare + (effectiveRouteInfo.distanceKm * ratePerKm)) * 100) / 100);

    onConfirmRoute(pickup, destPoint, {
      distanceKm: effectiveRouteInfo.distanceKm,
      durationMinutes: effectiveRouteInfo.durationMinutes,
      estimatedPrice
    });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-800">
        
        {/* Step Indicator */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-indigo-600 text-white font-extrabold text-sm flex items-center justify-center font-display">
              2
            </span>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-indigo-500">Step 2 of 2</p>
              <h2 className="text-xl sm:text-2xl font-extrabold font-display text-slate-950 dark:text-white">
                Set Destination & Review Route
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Change Pickup</span>
          </button>
        </div>

        <GoogleMapsWrapper>
          <form onSubmit={handleProceedToFind} className="space-y-6">
            
            <PlaceAutocompleteInput
              id="destination-location-search"
              label="Destination Address or Landmark"
              placeholder="Search destination with Google Places..."
              icon={Navigation}
              iconColorClass="text-indigo-500"
              selectedPlace={destinationPlace}
              onPlaceSelect={(place) => setDestinationPlace(place)}
              required
            />

            {/* Interactive Map */}
            <div className="space-y-3">
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
              />
            </div>

            {/* Route Stats Display */}
            <RouteStatsDisplay
              pickup={pickupPlace}
              destination={destinationPlace}
              routeInfo={effectiveRouteInfo}
            />

            {/* Actions */}
            <div className="flex items-center justify-between gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={onBack}
                className="px-5 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-sm transition-all cursor-pointer"
              >
                Back
              </button>

              <button
                type="submit"
                disabled={!destinationPlace || !effectiveRouteInfo}
                className="flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm transition-all shadow-xl shadow-indigo-400/25 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <span>Find RouteMates Heading This Way</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        </GoogleMapsWrapper>
      </div>
    </div>
  );
};
