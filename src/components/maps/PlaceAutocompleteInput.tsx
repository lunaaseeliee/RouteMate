import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useMapsLibrary } from '@vis.gl/react-google-maps';
import { MapPin, X, Check, Loader2, Navigation2, Compass } from 'lucide-react';
import { GoogleMapsPlace } from '../../types';
import { useGoogleMapsStatus } from './GoogleMapsWrapper';

interface PlaceAutocompleteInputProps {
  id: string;
  label: string;
  placeholder: string;
  icon?: React.ComponentType<{ className?: string }>;
  iconColorClass?: string;
  selectedPlace: GoogleMapsPlace | null;
  onPlaceSelect: (place: GoogleMapsPlace | null) => void;
  required?: boolean;
}

// Curated list of popular metro hubs, airports, and landmarks (Offline/No-Key Fallback only)
const POPULAR_LOCATIONS: GoogleMapsPlace[] = [
  { placeId: 'sf-downtown', formattedAddress: 'Market St, San Francisco, CA', city: 'San Francisco', latitude: 37.7749, longitude: -122.4194, displayName: 'Downtown San Francisco' },
  { placeId: 'sf-sfo', formattedAddress: 'San Francisco International Airport (SFO), CA', city: 'San Francisco', latitude: 37.6213, longitude: -122.3790, displayName: 'SFO Airport' },
  { placeId: 'sj-downtown', formattedAddress: 'Downtown San Jose, San Jose, CA', city: 'San Jose', latitude: 37.3382, longitude: -121.8863, displayName: 'San Jose City Center' },
  { placeId: 'sj-sjc', formattedAddress: 'San Jose Mineta International Airport (SJC), CA', city: 'San Jose', latitude: 37.3639, longitude: -121.9289, displayName: 'San Jose Airport (SJC)' },
  { placeId: 'oak-downtown', formattedAddress: 'Broadway, Oakland, CA', city: 'Oakland', latitude: 37.8044, longitude: -122.2712, displayName: 'Downtown Oakland' },
  { placeId: 'pa-stanford', formattedAddress: 'Stanford University, Palo Alto, CA', city: 'Palo Alto', latitude: 37.4275, longitude: -122.1697, displayName: 'Stanford Campus / Palo Alto' },
  { placeId: 'berk-campus', formattedAddress: 'UC Berkeley, Berkeley, CA', city: 'Berkeley', latitude: 37.8719, longitude: -122.2585, displayName: 'UC Berkeley / Telegraph' },
  { placeId: 'mv-castro', formattedAddress: 'Castro St, Mountain View, CA', city: 'Mountain View', latitude: 37.3861, longitude: -122.0839, displayName: 'Mountain View Downtown' },
  { placeId: 'sv-sunnyvale', formattedAddress: 'Historic Murphy Ave, Sunnyvale, CA', city: 'Sunnyvale', latitude: 37.3688, longitude: -122.0363, displayName: 'Sunnyvale Town Center' },
  { placeId: 'sc-santacruz', formattedAddress: 'Pacific Ave, Santa Cruz, CA', city: 'Santa Cruz', latitude: 36.9741, longitude: -122.0308, displayName: 'Santa Cruz Boardwalk' },
  { placeId: 'la-dtla', formattedAddress: 'Downtown Los Angeles, Los Angeles, CA', city: 'Los Angeles', latitude: 34.0522, longitude: -118.2437, displayName: 'Downtown LA' },
  { placeId: 'la-lax', formattedAddress: 'Los Angeles International Airport (LAX), CA', city: 'Los Angeles', latitude: 33.9416, longitude: -118.4085, displayName: 'LAX Airport' },
  { placeId: 'sd-gaslamp', formattedAddress: 'Gaslamp Quarter, San Diego, CA', city: 'San Diego', latitude: 32.7157, longitude: -117.1611, displayName: 'San Diego Downtown' },
  { placeId: 'sea-pikes', formattedAddress: 'Pike Place, Seattle, WA', city: 'Seattle', latitude: 47.6062, longitude: -122.3321, displayName: 'Downtown Seattle' },
  { placeId: 'nyc-midtown', formattedAddress: 'Times Square / Midtown, New York, NY', city: 'New York', latitude: 40.7580, longitude: -73.9855, displayName: 'Manhattan Midtown' },
  { placeId: 'austin-congress', formattedAddress: 'Congress Ave, Austin, TX', city: 'Austin', latitude: 30.2672, longitude: -97.7431, displayName: 'Downtown Austin' },
  { placeId: 'chi-loop', formattedAddress: 'The Loop, Chicago, IL', city: 'Chicago', latitude: 41.8781, longitude: -87.6298, displayName: 'Chicago Loop' },
];

/**
 * Fallback Autocomplete UI (Used only when Google Maps SDK is not live or during critical API errors)
 */
const FallbackPlaceAutocompleteInput: React.FC<PlaceAutocompleteInputProps> = ({
  id,
  label,
  placeholder,
  icon: Icon = MapPin,
  iconColorClass = 'text-indigo-500',
  selectedPlace,
  onPlaceSelect,
  required = false
}) => {
  const [inputValue, setInputValue] = useState(selectedPlace?.formattedAddress || '');
  const [isFocused, setIsFocused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedPlace) {
      setInputValue(selectedPlace.formattedAddress);
    }
  }, [selectedPlace]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredLocations = React.useMemo(() => {
    const query = inputValue.trim().toLowerCase();
    if (!query) return POPULAR_LOCATIONS.slice(0, 6);
    return POPULAR_LOCATIONS.filter(
      loc =>
        loc.formattedAddress.toLowerCase().includes(query) ||
        loc.city?.toLowerCase().includes(query) ||
        loc.displayName?.toLowerCase().includes(query)
    ).slice(0, 8);
  }, [inputValue]);

  const handleSelectLocation = (place: GoogleMapsPlace) => {
    setInputValue(place.formattedAddress);
    setIsFocused(false);
    onPlaceSelect(place);
  };

  const handleCustomConfirm = () => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;

    const match = POPULAR_LOCATIONS.find(
      l => l.formattedAddress.toLowerCase() === trimmed.toLowerCase()
    );
    if (match) {
      handleSelectLocation(match);
      return;
    }

    const parts = trimmed.split(',');
    const city = parts.length > 1 ? parts[1].trim() : parts[0].trim();

    let hash = 0;
    for (let i = 0; i < trimmed.length; i++) {
      hash = (hash << 5) - hash + trimmed.charCodeAt(i);
      hash |= 0;
    }
    const latOffset = ((Math.abs(hash) % 1000) / 1000 - 0.5) * 0.4;
    const lngOffset = ((Math.abs(hash * 3) % 1000) / 1000 - 0.5) * 0.4;

    const customPlace: GoogleMapsPlace = {
      placeId: 'loc-' + Math.abs(hash).toString(36),
      formattedAddress: trimmed,
      displayName: trimmed,
      city: city || 'City Center',
      latitude: 37.7749 + latOffset,
      longitude: -122.4194 + lngOffset
    };

    handleSelectLocation(customPlace);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredLocations.length > 0 && isFocused) {
        handleSelectLocation(filteredLocations[0]);
      } else {
        handleCustomConfirm();
      }
    }
  };

  const handleClear = () => {
    setInputValue('');
    onPlaceSelect(null);
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <label
        htmlFor={id}
        className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5"
      >
        {label} {required && <span className="text-red-500">*</span>}
      </label>

      <div className="relative">
        <div className="absolute left-3.5 top-3.5 pointer-events-none">
          <Icon className={`w-4 h-4 ${iconColorClass}`} />
        </div>

        <input
          id={id}
          type="text"
          value={inputValue}
          required={required}
          onChange={(e) => {
            setInputValue(e.target.value);
            if (selectedPlace) {
              onPlaceSelect(null);
            }
          }}
          onFocus={() => setIsFocused(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoComplete="off"
          className="w-full pl-10 pr-10 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-400 focus:outline-none transition-all shadow-inner"
        />

        {inputValue && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-3 p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            title="Clear location"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {selectedPlace && !isFocused && (
        <div className="mt-1.5 flex items-center justify-between text-[11px] px-2.5 py-1 rounded-lg bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-800/60 text-green-700 dark:text-green-300">
          <span className="flex items-center gap-1 font-medium truncate">
            <Check className="w-3 h-3 shrink-0 text-green-600" />
            <span className="truncate">{selectedPlace.formattedAddress}</span>
          </span>
          <span className="font-mono text-[10px] text-green-600 dark:text-green-400 shrink-0 ml-2">
            Selected
          </span>
        </div>
      )}

      {isFocused && (
        <div className="absolute z-50 left-0 right-0 mt-1.5 max-h-64 overflow-y-auto rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xl divide-y divide-slate-100 dark:divide-slate-800">
          {inputValue.trim().length > 1 && (
            <button
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                handleCustomConfirm();
              }}
              className="w-full px-4 py-2.5 text-left bg-indigo-50/70 dark:bg-indigo-950/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 flex items-center justify-between transition-colors cursor-pointer text-xs font-bold text-indigo-900 dark:text-indigo-300"
            >
              <div className="flex items-center gap-2 truncate">
                <Compass className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                <span className="truncate">Use &quot;{inputValue.trim()}&quot;</span>
              </div>
              <span className="text-[10px] uppercase tracking-wider text-indigo-700 dark:text-indigo-400 font-semibold shrink-0 ml-2">
                Press Enter
              </span>
            </button>
          )}

          {filteredLocations.map((loc) => (
            <button
              key={loc.placeId}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                handleSelectLocation(loc);
              }}
              className="w-full px-4 py-3 text-left hover:bg-indigo-50 dark:hover:bg-slate-800/80 flex items-start gap-3 transition-colors cursor-pointer group"
            >
              <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 group-hover:bg-indigo-600 group-hover:text-white transition-colors mt-0.5 shrink-0">
                <Navigation2 className="w-3.5 h-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                  {loc.displayName || loc.formattedAddress}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  {loc.formattedAddress}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

/**
 * Live Autocomplete UI with Google Places API (New)
 */
const LivePlaceAutocompleteInput: React.FC<PlaceAutocompleteInputProps> = ({
  id,
  label,
  placeholder,
  icon: Icon = MapPin,
  iconColorClass = 'text-indigo-500',
  selectedPlace,
  onPlaceSelect,
  required = false
}) => {
  const hookPlacesLib = useMapsLibrary('places');
  const [placesLib, setPlacesLib] = useState<any>(hookPlacesLib);
  const sessionTokenRef = useRef<google.maps.places.AutocompleteSessionToken | null>(null);

  const [inputValue, setInputValue] = useState(selectedPlace?.formattedAddress || '');
  const [suggestions, setSuggestions] = useState<google.maps.places.AutocompleteSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [fetchingDetails, setFetchingDetails] = useState(false);
  const [useFallbackSuggestions, setUseFallbackSuggestions] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  // Sync places library when hook returns it or load dynamically with google.maps.importLibrary
  useEffect(() => {
    if (hookPlacesLib) {
      setPlacesLib(hookPlacesLib);
      return;
    }

    let isMounted = true;
    const loadPlaces = async () => {
      try {
        if (typeof google !== 'undefined' && google.maps?.importLibrary) {
          const lib = await google.maps.importLibrary('places');
          if (isMounted) {
            setPlacesLib(lib);
          }
        }
      } catch (err) {
        console.error('Failed to import Google Maps places library:', err);
      }
    };

    loadPlaces();
    return () => {
      isMounted = false;
    };
  }, [hookPlacesLib]);

  useEffect(() => {
    if (selectedPlace) {
      setInputValue(selectedPlace.formattedAddress);
    }
  }, [selectedPlace]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Helper to safely obtain Places API (New) classes
  const getPlacesClasses = useCallback(async () => {
    let lib = placesLib;
    if (!lib && typeof google !== 'undefined' && google.maps?.importLibrary) {
      try {
        lib = await google.maps.importLibrary('places');
        setPlacesLib(lib);
      } catch (err) {
        console.error('Failed to import Google Maps places library dynamically:', err);
      }
    }

    const AutocompleteSuggestion =
      lib?.AutocompleteSuggestion ||
      (typeof google !== 'undefined' ? (google.maps as any).places?.AutocompleteSuggestion : null);

    const AutocompleteSessionToken =
      lib?.AutocompleteSessionToken ||
      (typeof google !== 'undefined' ? (google.maps as any).places?.AutocompleteSessionToken : null);

    return { lib, AutocompleteSuggestion, AutocompleteSessionToken };
  }, [placesLib]);

  // Fetch suggestions debounced using Places API (New) AutocompleteSuggestion
  useEffect(() => {
    if (useFallbackSuggestions) return;

    if (!inputValue || inputValue.trim().length < 1) {
      setSuggestions([]);
      setIsLoading(false);
      return;
    }

    if (selectedPlace && inputValue.trim() === selectedPlace.formattedAddress.trim()) {
      setSuggestions([]);
      return;
    }

    let isCancelled = false;

    const debounceTimer = setTimeout(async () => {
      setIsLoading(true);

      const { AutocompleteSuggestion, AutocompleteSessionToken } = await getPlacesClasses();

      if (isCancelled) return;

      if (!AutocompleteSuggestion || typeof AutocompleteSuggestion.fetchAutocompleteSuggestions !== 'function') {
        // Do NOT permanently switch to fallback because of a temporary loading state.
        // Only set fallback if Google Maps API is genuinely not available on window.
        if (typeof google === 'undefined' || !google.maps) {
          console.error('Google Maps API is not loaded yet.');
        }
        setIsLoading(false);
        return;
      }

      if (!sessionTokenRef.current && AutocompleteSessionToken) {
        try {
          sessionTokenRef.current = new AutocompleteSessionToken();
        } catch (tokenErr) {
          console.error('Error creating AutocompleteSessionToken:', tokenErr);
        }
      }

      const request: google.maps.places.AutocompleteRequest = {
        input: inputValue.trim(),
        sessionToken: sessionTokenRef.current || undefined
      };

      try {
        const res = await AutocompleteSuggestion.fetchAutocompleteSuggestions(request);
        if (!isCancelled) {
          setSuggestions(res.suggestions || []);
          setIsLoading(false);
        }
      } catch (err: any) {
        if (!isCancelled) {
          console.error('Google Places Autocomplete request failed:', err?.message || err);
          // Only switch to fallback suggestions if the API key failed authentication or API is not activated
          const errMsg = err?.message || '';
          if (
            errMsg.includes('ApiNotActivatedMapError') ||
            errMsg.includes('UnauthorizedUrlForClientIdMapError') ||
            errMsg.includes('InvalidKeyMapError')
          ) {
            setUseFallbackSuggestions(true);
          }
          setIsLoading(false);
        }
      }
    }, 280);

    return () => {
      isCancelled = true;
      clearTimeout(debounceTimer);
    };
  }, [inputValue, getPlacesClasses, selectedPlace, useFallbackSuggestions]);

  const handleSelectSuggestion = useCallback(
    async (suggestion: google.maps.places.AutocompleteSuggestion) => {
      if (!suggestion.placePrediction) return;

      setFetchingDetails(true);

      try {
        const place = suggestion.placePrediction.toPlace();
        await place.fetchFields({
          fields: ['id', 'displayName', 'formattedAddress', 'location', 'addressComponents']
        });

        // Real coordinates extraction
        const lat =
          typeof place.location?.lat === 'function'
            ? place.location.lat()
            : Number(place.location?.lat) || 0;
        const lng =
          typeof place.location?.lng === 'function'
            ? place.location.lng()
            : Number(place.location?.lng) || 0;

        const displayNameText =
          typeof place.displayName === 'string'
            ? place.displayName
            : (place.displayName as any)?.text || suggestion.placePrediction.mainText?.text || '';

        const formattedAddress =
          place.formattedAddress ||
          displayNameText ||
          suggestion.placePrediction.text?.text ||
          '';

        const placeId = place.id || suggestion.placePrediction.placeId || '';

        let city = '';
        if (place.addressComponents && Array.isArray(place.addressComponents)) {
          const locality = place.addressComponents.find((c) =>
            c.types?.includes('locality') || c.types?.includes('postal_town')
          );
          const adminArea = place.addressComponents.find((c) =>
            c.types?.includes('administrative_area_level_2') || c.types?.includes('administrative_area_level_1')
          );
          city = locality?.longText || adminArea?.longText || locality?.shortText || '';
        }
        if (!city && formattedAddress) {
          const parts = formattedAddress.split(',');
          city = parts.length > 1 ? parts[1].trim() : parts[0].trim();
        }

        const gmpPlace: GoogleMapsPlace = {
          placeId,
          formattedAddress,
          latitude: lat,
          longitude: lng,
          displayName: displayNameText || undefined,
          city: city || 'City Center'
        };

        setInputValue(formattedAddress);
        setSuggestions([]);
        setIsFocused(false);
        onPlaceSelect(gmpPlace);

        // Reset session token for next search session as per Google Places billing best practices
        const { AutocompleteSessionToken } = await getPlacesClasses();
        if (AutocompleteSessionToken) {
          try {
            sessionTokenRef.current = new AutocompleteSessionToken();
          } catch {
            sessionTokenRef.current = null;
          }
        }
      } catch (err) {
        console.error('Failed to retrieve Place details via fetchFields:', err);

        // Secondary fallback to Geocoder to ensure real coordinates for this Place ID or address
        try {
          if (typeof google !== 'undefined' && google.maps?.Geocoder) {
            const geocoder = new google.maps.Geocoder();
            const placeId = suggestion.placePrediction.placeId;
            const query = placeId ? { placeId } : { address: suggestion.placePrediction.text?.text };
            const geoRes = await geocoder.geocode(query);
            if (geoRes.results && geoRes.results.length > 0) {
              const first = geoRes.results[0];
              const lat = first.geometry.location.lat();
              const lng = first.geometry.location.lng();
              const addr = first.formatted_address || suggestion.placePrediction.text?.text || '';
              const gmpPlace: GoogleMapsPlace = {
                placeId: first.place_id || placeId || 'loc-' + Date.now(),
                formattedAddress: addr,
                latitude: lat,
                longitude: lng,
                displayName: suggestion.placePrediction.mainText?.text || addr,
                city: 'City Center'
              };
              setInputValue(addr);
              setSuggestions([]);
              setIsFocused(false);
              onPlaceSelect(gmpPlace);
              return;
            }
          }
        } catch (geoErr) {
          console.error('Secondary Geocoder fallback also failed:', geoErr);
        }

        const mainText = suggestion.placePrediction.text?.text || '';
        onPlaceSelect({
          placeId: suggestion.placePrediction.placeId || 'loc-' + Date.now(),
          formattedAddress: mainText,
          latitude: 0,
          longitude: 0,
          city: 'City Center'
        });
        setInputValue(mainText);
        setIsFocused(false);
      } finally {
        setFetchingDetails(false);
      }
    },
    [getPlacesClasses, onPlaceSelect]
  );

  const handleClear = () => {
    setInputValue('');
    setSuggestions([]);
    onPlaceSelect(null);
  };

  if (useFallbackSuggestions) {
    return (
      <FallbackPlaceAutocompleteInput
        id={id}
        label={label}
        placeholder={placeholder}
        icon={Icon}
        iconColorClass={iconColorClass}
        selectedPlace={selectedPlace}
        onPlaceSelect={onPlaceSelect}
        required={required}
      />
    );
  }

  return (
    <div ref={containerRef} className="relative w-full">
      <label
        htmlFor={id}
        className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5"
      >
        {label} {required && <span className="text-red-500">*</span>}
      </label>

      <div className="relative">
        <div className="absolute left-3.5 top-3.5 pointer-events-none">
          {fetchingDetails || isLoading ? (
            <Loader2 className={`w-4 h-4 animate-spin ${iconColorClass}`} />
          ) : (
            <Icon className={`w-4 h-4 ${iconColorClass}`} />
          )}
        </div>

        <input
          id={id}
          type="text"
          value={inputValue}
          required={required}
          onChange={(e) => {
            setInputValue(e.target.value);
            if (selectedPlace) {
              onPlaceSelect(null);
            }
          }}
          onFocus={() => setIsFocused(true)}
          placeholder={placeholder}
          autoComplete="off"
          className="w-full pl-10 pr-10 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-400 focus:outline-none transition-all shadow-inner"
        />

        {inputValue && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-3 p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            title="Clear location"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {selectedPlace && !isFocused && (
        <div className="mt-1.5 flex items-center justify-between text-[11px] px-2.5 py-1 rounded-lg bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-800/60 text-green-700 dark:text-green-300">
          <span className="flex items-center gap-1 font-medium truncate">
            <Check className="w-3 h-3 shrink-0 text-green-600" />
            <span className="truncate">Lat: {selectedPlace.latitude.toFixed(4)}, Lng: {selectedPlace.longitude.toFixed(4)}</span>
          </span>
          <span className="font-mono text-[10px] text-green-600 dark:text-green-400 shrink-0 ml-2">
            Verified Location
          </span>
        </div>
      )}

      {isFocused && suggestions.length > 0 && (
        <div className="absolute z-50 left-0 right-0 mt-1.5 max-h-64 overflow-y-auto rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 shadow-2xl divide-y divide-slate-100 dark:divide-slate-800">
          {suggestions.map((suggestion, idx) => {
            const mainText = suggestion.placePrediction?.mainText?.text || suggestion.placePrediction?.text?.text || '';
            const secondaryText = suggestion.placePrediction?.secondaryText?.text;

            return (
              <button
                key={suggestion.placePrediction?.placeId || idx}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSelectSuggestion(suggestion);
                }}
                className="w-full px-4 py-3 text-left hover:bg-indigo-50 dark:hover:bg-slate-800/80 flex items-start gap-3 transition-colors cursor-pointer group"
              >
                <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 group-hover:bg-indigo-600 group-hover:text-white transition-colors mt-0.5 shrink-0">
                  <Navigation2 className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {mainText}
                  </p>
                  {secondaryText && (
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      {secondaryText}
                    </p>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export const PlaceAutocompleteInput: React.FC<PlaceAutocompleteInputProps> = (props) => {
  const { isLiveMapsAvailable } = useGoogleMapsStatus();

  if (isLiveMapsAvailable) {
    return <LivePlaceAutocompleteInput {...props} />;
  }

  return <FallbackPlaceAutocompleteInput {...props} />;
};
