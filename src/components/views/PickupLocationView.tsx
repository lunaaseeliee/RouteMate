import React, { useState } from 'react';
import { 
  MapPin, 
  ArrowRight, 
  Crosshair,
  Building, 
  Plane, 
  GraduationCap, 
  Briefcase,
  Navigation
} from 'lucide-react';
import { LocationPoint, GoogleMapsPlace } from '../../types';
import { GoogleMapsWrapper } from '../maps/GoogleMapsWrapper';
import { PlaceAutocompleteInput } from '../maps/PlaceAutocompleteInput';

interface PickupLocationViewProps {
  initialPickup?: LocationPoint;
  onSelectPickup: (pickup: LocationPoint) => void;
  onCancel?: () => void;
}

export const PickupLocationView: React.FC<PickupLocationViewProps> = ({
  initialPickup,
  onSelectPickup,
  onCancel
}) => {
  const [selectedPlace, setSelectedPlace] = useState<GoogleMapsPlace | null>(() => {
    if (initialPickup && initialPickup.address) {
      return {
        placeId: '',
        formattedAddress: initialPickup.address,
        latitude: initialPickup.lat,
        longitude: initialPickup.lng,
        city: initialPickup.city
      };
    }
    return null;
  });

  const [locating, setLocating] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  const handleUseCurrentLocation = () => {
    setGeoError(null);
    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by your browser.');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const coordLabel = `My Location (${lat.toFixed(4)}°, ${lng.toFixed(4)}°)`;

        // Set the place immediately with coordinate-based label
        const gpsPlace: GoogleMapsPlace = {
          placeId: 'current-location',
          formattedAddress: coordLabel,
          latitude: lat,
          longitude: lng,
          displayName: 'My Current Location',
          city: 'My Location'
        };
        setSelectedPlace(gpsPlace);
        setLocating(false);

        // Attempt reverse geocoding if Google Maps Geocoder is available
        if (typeof google !== 'undefined' && google.maps?.Geocoder) {
          const geocoder = new google.maps.Geocoder();
          geocoder.geocode({ location: { lat, lng } }, (results, status) => {
            if (status === 'OK' && results && results.length > 0) {
              const best = results[0];
              const locality = best.address_components?.find(c =>
                c.types.includes('locality') || c.types.includes('postal_town')
              );
              const sublocality = best.address_components?.find(c =>
                c.types.includes('sublocality') || c.types.includes('sublocality_level_1')
              );
              const adminArea = best.address_components?.find(c =>
                c.types.includes('administrative_area_level_1')
              );
              const city = locality?.long_name || sublocality?.long_name || adminArea?.long_name || 'My Location';

              setSelectedPlace({
                placeId: best.place_id || 'current-location',
                formattedAddress: best.formatted_address || coordLabel,
                latitude: lat,
                longitude: lng,
                displayName: best.formatted_address?.split(',')[0] || 'My Current Location',
                city
              });
            }
          });
        }
      },
      (err) => {
        setLocating(false);
        setGeoError(err.message || 'Unable to retrieve location.');
        console.warn('Geolocation error:', err);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  const handleContinue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlace) return;

    onSelectPickup({
      address: selectedPlace.formattedAddress,
      city: selectedPlace.city || 'City Center',
      lat: selectedPlace.latitude,
      lng: selectedPlace.longitude
    });
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-slate-800">
        
        {/* Step Indicator */}
        <div className="flex items-center gap-2 mb-6">
          <span className="w-8 h-8 rounded-full bg-indigo-600 text-white font-extrabold text-sm flex items-center justify-center font-display">
            1
          </span>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-indigo-500">Step 1 of 2</p>
            <h2 className="text-xl sm:text-2xl font-extrabold font-display text-slate-950 dark:text-white">
              Set Your Pickup Location
            </h2>
          </div>
        </div>

        {/* Google Maps Search Bar / Input */}
        <GoogleMapsWrapper>
          <form onSubmit={handleContinue} className="space-y-4">
            <PlaceAutocompleteInput
              id="pickup-location-search"
              label="Pickup Address or Landmark"
              placeholder="Search pickup address with Google Places..."
              icon={MapPin}
              iconColorClass="text-emerald-500"
              selectedPlace={selectedPlace}
              onPlaceSelect={(place) => setSelectedPlace(place)}
              required
            />

            {geoError && (
              <p className="text-xs text-red-500 dark:text-red-400 font-medium">
                {geoError}
              </p>
            )}

            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={handleUseCurrentLocation}
                disabled={locating}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition-all active:scale-95 cursor-pointer"
              >
                <Crosshair className={`w-4 h-4 text-indigo-500 ${locating ? 'animate-spin' : ''}`} />
                <span>{locating ? 'Detecting GPS...' : 'Use Current Location'}</span>
              </button>

              <button
                type="submit"
                disabled={!selectedPlace}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm transition-all shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <span>Next: Destination</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        </GoogleMapsWrapper>
      </div>
    </div>
  );
};
