import { StreetRouteMap } from './StreetRouteMap';
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Map, AdvancedMarker, useMap, useMapsLibrary } from '@vis.gl/react-google-maps';
import { MapPin, Navigation, AlertTriangle, Loader2, Route as RouteIcon, Info, Compass, ShieldCheck } from 'lucide-react';
import { GoogleMapsPlace, CalculatedRouteInfo } from '../../types';
import { GMP_ATTRIBUTION_ID, DEFAULT_MAP_ID } from '../../lib/googleMapsConfig';
import { formatDistance, formatDuration, estimateRouteInfo } from '../../lib/polyline';
import { useGoogleMapsStatus } from './GoogleMapsWrapper';

interface InteractiveRouteMapProps {
  pickup: GoogleMapsPlace | null;
  destination: GoogleMapsPlace | null;
  onRouteChange?: (routeInfo: CalculatedRouteInfo | null) => void;
  onRouteError?: (error: string | null) => void;
  selectionMode?: 'pickup' | 'destination' | null;
  onMapClick?: (place: GoogleMapsPlace) => void;
}

/**
 * Safely extracts latitude and longitude values regardless of whether the point is a
 * google.maps.LatLng instance (with .lat() and .lng() methods), a LatLngLiteral ({ lat, lng }),
 * or a REST coordinate object ({ latitude, longitude }).
 */
const getCoord = (p: any): { lat: number; lng: number } => {
  if (!p) return { lat: 0, lng: 0 };
  const lat =
    typeof p.lat === 'function'
      ? p.lat()
      : (p.lat !== undefined ? Number(p.lat) : Number(p.latitude)) || 0;
  const lng =
    typeof p.lng === 'function'
      ? p.lng()
      : (p.lng !== undefined ? Number(p.lng) : Number(p.longitude)) || 0;
  return { lat, lng };
};

const RouteCalculator: React.FC<{
  pickup: GoogleMapsPlace | null;
  destination: GoogleMapsPlace | null;
  onRouteChange?: (routeInfo: CalculatedRouteInfo | null) => void;
  onRouteError?: (error: string | null) => void;
  setCalculating: (loading: boolean) => void;
}> = ({ pickup, destination, onRouteChange, onRouteError, setCalculating }) => {
  const map = useMap();
  const hookRoutesLib = useMapsLibrary('routes');
  const [routesLib, setRoutesLib] = useState<any>(hookRoutesLib);

  // Single unified ref for all active route polylines so they never duplicate or stack
  const activePolylinesRef = useRef<google.maps.Polyline[]>([]);

  // Cleanup helper to remove existing polylines from the map
  const clearPolylines = useCallback(() => {
    if (activePolylinesRef.current.length > 0) {
      activePolylinesRef.current.forEach((line) => {
        try {
          line.setMap(null);
        } catch {
          // ignore
        }
      });
      activePolylinesRef.current = [];
    }
  }, []);

  // Ensure routes library is loaded dynamically if not already available from hook
  useEffect(() => {
    if (hookRoutesLib) {
      setRoutesLib(hookRoutesLib);
      return;
    }

    let isMounted = true;
    const loadRoutes = async () => {
      try {
        if (typeof google !== 'undefined' && google.maps?.importLibrary) {
          const lib = await google.maps.importLibrary('routes');
          if (isMounted) {
            setRoutesLib(lib);
          }
        }
      } catch (err) {
        console.error('Failed to import Google Maps routes library:', err);
      }
    };

    loadRoutes();
    return () => {
      isMounted = false;
    };
  }, [hookRoutesLib]);

  useEffect(() => {
    if (!map) return;

    // Clear previous polylines immediately
    clearPolylines();

    if (!pickup && !destination) {
      onRouteChange?.(null);
      onRouteError?.(null);
      return;
    }

    // Only pickup is selected: center map on pickup
    if (pickup && !destination) {
      map.panTo({ lat: pickup.latitude, lng: pickup.longitude });
      map.setZoom(14);
      onRouteChange?.(null);
      onRouteError?.(null);
      return;
    }

    // Only destination is selected: center map on destination
    if (!pickup && destination) {
      map.panTo({ lat: destination.latitude, lng: destination.longitude });
      map.setZoom(14);
      onRouteChange?.(null);
      onRouteError?.(null);
      return;
    }

    // Both pickup and destination are selected: compute driving route with traffic awareness
    if (pickup && destination) {
      setCalculating(true);
      onRouteError?.(null);

      const originCoord = { lat: pickup.latitude, lng: pickup.longitude };
      const destCoord = { lat: destination.latitude, lng: destination.longitude };

      let isCancelled = false;

      const calculateRoute = async () => {
        try {
          // Resolve Route class from routes library or global namespace
          let RouteClass =
            routesLib?.Route ||
            (typeof google !== 'undefined' ? (google.maps as any).routes?.Route : null);

          if (!RouteClass && typeof google !== 'undefined' && google.maps?.importLibrary) {
            try {
              const lib = await google.maps.importLibrary('routes');
              setRoutesLib(lib);
              RouteClass = lib?.Route || (google.maps as any).routes?.Route;
            } catch (libErr) {
              console.error('Could not dynamically load routes library for RouteClass:', libErr);
            }
          }

          if (RouteClass && typeof RouteClass.computeRoutes === 'function') {
            const request: any = {
              origin: { location: { latLng: originCoord } },
              destination: { location: { latLng: destCoord } },
              travelMode: 'DRIVING',
              routingPreference: 'TRAFFIC_AWARE',
              extraComputations: ['TRAFFIC_ON_POLYLINE'],
              fields: [
                'distanceMeters',
                'durationMillis',
                'path',
                'legs',
                'speedPaths',
                'routeLabels',
                'viewport'
              ]
            };

            const response = await RouteClass.computeRoutes(request);

            if (isCancelled) return;

            if (response && response.routes && response.routes.length > 0) {
              const route = response.routes[0];

              // Extract path coordinates safely (handles both LatLng instances and coordinate objects)
              const rawPath: any[] = route.path || [];
              const pathPoints: { lat: number; lng: number }[] = rawPath.map(getCoord);

              // Extract real distance from Google response
              const distanceMeters = Number(route.distanceMeters) || 0;

              // Extract real duration from Google response (durationMillis or duration string)
              let durationSeconds = 0;
              if (route.durationMillis !== undefined && route.durationMillis !== null) {
                durationSeconds = Math.round(Number(route.durationMillis) / 1000);
              } else if (route.duration) {
                const durStr = route.duration.toString();
                durationSeconds = parseInt(durStr.replace('s', ''), 10) || 0;
              }

              const distInfo = formatDistance(distanceMeters);
              const durInfo = formatDuration(durationSeconds);

              // Remove previous polylines before adding new ones
              clearPolylines();

              const createdPolylines: google.maps.Polyline[] = [];

              // 1. Prefer official route.createPolylines(...) functionality if supported
              if (typeof route.createPolylines === 'function') {
                try {
                  const polylines = route.createPolylines({
                    polylineOptions: (details: any) => {
                      let strokeColor = '#4285F4'; // NORMAL traffic = BLUE
                      let zIndex = 1;
                      if (details?.speed === 'SLOW') {
                        strokeColor = '#FABB05'; // SLOW / moderate traffic = YELLOW
                        zIndex = 2;
                      } else if (details?.speed === 'TRAFFIC_JAM') {
                        strokeColor = '#EA4335'; // TRAFFIC_JAM / heavy traffic = RED
                        zIndex = 3;
                      }
                      return {
                        strokeColor,
                        strokeOpacity: 0.95,
                        strokeWeight: 6,
                        geodesic: true,
                        zIndex
                      };
                    }
                  });

                  if (Array.isArray(polylines) && polylines.length > 0) {
                    polylines.forEach((line) => {
                      line.setMap(map);
                      createdPolylines.push(line);
                    });
                  }
                } catch (createErr) {
                  console.warn('route.createPolylines call notice:', createErr);
                }
              }

              // 2. If createPolylines did not generate polylines, render traffic segments using route.speedPaths
              if (
                createdPolylines.length === 0 &&
                Array.isArray(route.speedPaths) &&
                route.speedPaths.length > 0
              ) {
                route.speedPaths.forEach((segment: any) => {
                  let color = '#4285F4'; // NORMAL traffic = BLUE
                  let zIndex = 1;
                  if (segment.speed === 'SLOW') {
                    color = '#FABB05'; // SLOW / moderate traffic = YELLOW
                    zIndex = 2;
                  } else if (segment.speed === 'TRAFFIC_JAM') {
                    color = '#EA4335'; // TRAFFIC_JAM / heavy traffic = RED
                    zIndex = 3;
                  }

                  const segCoords = (segment.path || []).map(getCoord);
                  if (segCoords.length > 0) {
                    const line = new google.maps.Polyline({
                      path: segCoords,
                      geodesic: true,
                      strokeColor: color,
                      strokeOpacity: 0.95,
                      strokeWeight: 6,
                      zIndex,
                      map
                    });
                    createdPolylines.push(line);
                  }
                });
              }

              // 3. Fallback: If traffic segment data is unavailable, render single BLUE road route line
              if (createdPolylines.length === 0 && pathPoints.length > 0) {
                const singleLine = new google.maps.Polyline({
                  path: pathPoints,
                  geodesic: true,
                  strokeColor: '#4285F4',
                  strokeOpacity: 0.95,
                  strokeWeight: 6,
                  zIndex: 1,
                  map
                });
                createdPolylines.push(singleLine);
              }

              activePolylinesRef.current = createdPolylines;

              // Fit map bounds to encompass the complete route
              if (route.viewport) {
                const sw = getCoord(route.viewport.southwest);
                const ne = getCoord(route.viewport.northeast);
                const bounds = new google.maps.LatLngBounds(sw, ne);
                map.fitBounds(bounds, { top: 40, bottom: 40, left: 40, right: 40 });
              } else if (pathPoints.length > 0) {
                const bounds = new google.maps.LatLngBounds();
                pathPoints.forEach((p) => bounds.extend(p));
                map.fitBounds(bounds, { top: 40, bottom: 40, left: 40, right: 40 });
              }

              const routeInfo: CalculatedRouteInfo = {
                distanceMeters,
                distanceKm: distInfo.km,
                distanceText: distInfo.text,
                durationSeconds,
                durationMinutes: durInfo.minutes,
                durationText: durInfo.text,
                encodedPolyline: '',
                polylinePath: pathPoints,
                bounds: route.viewport
                  ? {
                      southwest: getCoord(route.viewport.southwest),
                      northeast: getCoord(route.viewport.northeast)
                    }
                  : undefined
              };

              onRouteChange?.(routeInfo);
              onRouteError?.(null);
              setCalculating(false);
              return;
            }
          }

          // Fallback to DirectionsService if Route class is unavailable
          if (typeof google !== 'undefined' && google.maps?.DirectionsService) {
            const directionsService = new google.maps.DirectionsService();
            const dirResult = await new Promise<google.maps.DirectionsResult | null>((resolve) => {
              directionsService.route(
                {
                  origin: originCoord,
                  destination: destCoord,
                  travelMode: google.maps.TravelMode.DRIVING
                },
                (result, status) => {
                  if (status === google.maps.DirectionsStatus.OK && result) {
                    resolve(result);
                  } else {
                    resolve(null);
                  }
                }
              );
            });

            if (isCancelled) return;

            if (dirResult && dirResult.routes && dirResult.routes[0]) {
              const dRoute = dirResult.routes[0];
              const leg = dRoute.legs[0];
              const pathPoints = (dRoute.overview_path || []).map(getCoord);
              const distanceMeters = leg?.distance?.value || 0;
              const durationSeconds = leg?.duration?.value || 0;

              clearPolylines();
              const line = new google.maps.Polyline({
                path: pathPoints,
                geodesic: true,
                strokeColor: '#4285F4',
                strokeOpacity: 0.95,
                strokeWeight: 6,
                zIndex: 1,
                map
              });
              activePolylinesRef.current = [line];

              if (dRoute.bounds) {
                map.fitBounds(dRoute.bounds, { top: 40, bottom: 40, left: 40, right: 40 });
              }

              const distInfo = formatDistance(distanceMeters);
              const durInfo = formatDuration(durationSeconds);
              onRouteChange?.({
                distanceMeters,
                distanceKm: distInfo.km,
                distanceText: distInfo.text,
                durationSeconds,
                durationMinutes: durInfo.minutes,
                durationText: durInfo.text,
                encodedPolyline: '',
                polylinePath: pathPoints
              });
              onRouteError?.(null);
              setCalculating(false);
              return;
            }
          }

          // Only fall back to mathematical estimate if Google routing APIs genuinely failed
          console.warn('Google route calculation fell back to estimated route.');
          const estimated = estimateRouteInfo(originCoord, destCoord);
          onRouteChange?.(estimated);
          onRouteError?.(null);
          setCalculating(false);
        } catch (err: any) {
          if (!isCancelled) {
            console.error('Google Routes API computeRoutes error:', err);
            const estimated = estimateRouteInfo(originCoord, destCoord);
            onRouteChange?.(estimated);
            onRouteError?.(null);
            setCalculating(false);
          }
        }
      };

      calculateRoute();

      return () => {
        isCancelled = true;
      };
    }

    return () => {
      clearPolylines();
    };
  }, [map, routesLib, pickup, destination, clearPolylines, onRouteChange, onRouteError, setCalculating]);

  return null;
};

const LiveInteractiveRouteMap: React.FC<InteractiveRouteMapProps> = ({
  pickup,
  destination,
  onRouteChange,
  onRouteError,
  selectionMode,
  onMapClick
}) => {
  const [calculating, setCalculating] = useState(false);
  const [routeError, setRouteError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  // Attempt to get user's real location for default map center
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        () => { /* silently ignore — we will use pickup/destination or neutral center */ },
        { enableHighAccuracy: false, timeout: 5000, maximumAge: 300000 }
      );
    }
  }, []);

  const handleRouteError = (err: string | null) => {
    setRouteError(err);
    onRouteError?.(err);
  };

  const defaultCenter = pickup
    ? { lat: pickup.latitude, lng: pickup.longitude }
    : destination
      ? { lat: destination.latitude, lng: destination.longitude }
      : userLocation || { lat: 20.5937, lng: 78.9629 };

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-xl bg-slate-100 dark:bg-slate-900">
      <div className="w-full h-80 sm:h-96 relative">
        <Map
          defaultCenter={defaultCenter}
          defaultZoom={12}
          mapId={DEFAULT_MAP_ID}
          disableDefaultUI={false}
          gestureHandling="greedy"
          internalUsageAttributionIds={[GMP_ATTRIBUTION_ID]}
          className="w-full h-full"
          clickableIcons={!selectionMode}
          onClick={async (e) => {
            if (!selectionMode || !onMapClick || !e.detail.latLng) return;
            const lat = e.detail.latLng.lat;
            const lng = e.detail.latLng.lng;
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
                    let city = 'Selected Location';
                    if (first.address_components) {
                      const locality = first.address_components.find((c: any) => 
                        c.types.includes('locality') || 
                        c.types.includes('sublocality') ||
                        c.types.includes('administrative_area_level_2') ||
                        c.types.includes('postal_town')
                      );
                      if (locality) city = locality.long_name;
                    }
                    onMapClick({
                      placeId: first.place_id,
                      formattedAddress: first.formatted_address,
                      latitude: lat,
                      longitude: lng,
                      displayName: first.formatted_address.split(',')[0],
                      city
                    });
                    return;
                  }
                }
              }
            } catch (err) {
              console.error('Reverse geocoding failed:', err);
            }
            // Fallback if geocoding fails or is unavailable
            onMapClick({
              placeId: 'loc-' + Date.now(),
              formattedAddress: `Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`,
              latitude: lat,
              longitude: lng,
              displayName: 'Map Selection',
              city: 'Unknown'
            });
          }}
        >
          {pickup && (
            <AdvancedMarker
              position={{ lat: pickup.latitude, lng: pickup.longitude }}
              title={`Pickup: ${pickup.formattedAddress}`}
            >
              <div className="flex flex-col items-center group cursor-pointer">
                <div className="px-2 py-0.5 rounded-md bg-slate-950 text-white text-[10px] font-bold shadow-lg border border-slate-800 mb-1 opacity-90 group-hover:opacity-100 transition-opacity">
                  Pickup (A)
                </div>
                <div className="w-8 h-8 rounded-full bg-emerald-500 text-slate-950 border-2 border-white shadow-xl flex items-center justify-center font-bold text-xs">
                  <MapPin className="w-4 h-4 text-slate-950 fill-slate-950" />
                </div>
              </div>
            </AdvancedMarker>
          )}

          {destination && (
            <AdvancedMarker
              position={{ lat: destination.latitude, lng: destination.longitude }}
              title={`Destination: ${destination.formattedAddress}`}
            >
              <div className="flex flex-col items-center group cursor-pointer">
                <div className="px-2 py-0.5 rounded-md bg-slate-950 text-white text-[10px] font-bold shadow-lg border border-slate-800 mb-1 opacity-90 group-hover:opacity-100 transition-opacity">
                  Drop-off (B)
                </div>
                <div className="w-8 h-8 rounded-full bg-indigo-600 text-white border-2 border-white shadow-xl flex items-center justify-center font-bold text-xs">
                  <Navigation className="w-4 h-4 text-slate-950 fill-slate-950" />
                </div>
              </div>
            </AdvancedMarker>
          )}

          <RouteCalculator
            pickup={pickup}
            destination={destination}
            onRouteChange={onRouteChange}
            onRouteError={handleRouteError}
            setCalculating={setCalculating}
          />
        </Map>

        {calculating && (
          <div className="absolute top-3 left-3 z-10 px-3 py-1.5 rounded-xl bg-slate-900/90 backdrop-blur-md text-white border border-slate-700 shadow-xl flex items-center gap-2 text-xs font-semibold">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
            <span>Calculating optimal driving route...</span>
          </div>
        )}

        {selectionMode && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 px-4 py-2 rounded-xl bg-indigo-600 text-white shadow-xl flex items-center gap-2 text-sm font-bold border border-indigo-500 animate-pulse">
            <MapPin className="w-4 h-4" />
            <span>Click on the map to set {selectionMode === 'pickup' ? 'Pickup' : 'Destination'}</span>
          </div>
        )}

        {routeError && (
          <div className="absolute bottom-3 left-3 right-3 z-10 p-3 rounded-xl bg-red-950/90 backdrop-blur-md text-red-200 border border-red-800/80 shadow-2xl flex items-start gap-2.5 text-xs">
            <AlertTriangle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
            <div className="flex-1">
              <span className="font-bold block text-white">Route Calculation Error</span>
              <span>{routeError}</span>
            </div>
          </div>
        )}

        <div className="absolute top-3 right-3 z-10 hidden sm:flex items-center gap-2 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 text-[11px] font-medium text-slate-700 dark:text-slate-300 shadow-md">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Pickup (A)
          </span>
          <span className="text-slate-300 dark:text-slate-700">|</span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" /> Destination (B)
          </span>
        </div>
      </div>
    </div>
  );
};

export const InteractiveRouteMap: React.FC<InteractiveRouteMapProps> = (props) => {
  const { isLiveMapsAvailable } = useGoogleMapsStatus();

  if (isLiveMapsAvailable) {
    return <LiveInteractiveRouteMap {...props} />;
  }

  return <StreetRouteMap {...props} />;
};
