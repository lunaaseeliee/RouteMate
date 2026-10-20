import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Polyline, Tooltip, useMap, useMapEvents } from 'react-leaflet';
import type { LatLngTuple } from 'leaflet';
import { GoogleMapsPlace, CalculatedRouteInfo } from '../../types';
import { decodePolyline, formatDistance, formatDuration } from '../../lib/polyline';

interface Props {
  pickup: GoogleMapsPlace | null;
  destination: GoogleMapsPlace | null;
  selectionMode?: 'pickup' | 'destination' | null;
  onMapClick?: (place: GoogleMapsPlace) => void;
  onRouteChange?: (route: CalculatedRouteInfo | null) => void;
  onRouteError?: (error: string | null) => void;
}

function MapInteraction({ pickup, destination, selectionMode, onMapClick }: Props) {
  const map = useMap();
  useMapEvents({ click: event => {
    if (!selectionMode || !onMapClick) return;
    const { lat, lng } = event.latlng;
    onMapClick({ placeId: `map-${lat.toFixed(6)}-${lng.toFixed(6)}`, latitude: lat, longitude: lng,
      formattedAddress: `Map location (${lat.toFixed(5)}, ${lng.toFixed(5)})`, displayName: 'Selected on map', city: '' });
  } });
  useEffect(() => {
    const container = map.getContainer();
    const observer = new ResizeObserver(() => map.invalidateSize());
    observer.observe(container);
    return () => { observer.disconnect(); };
  }, [map]);
  useEffect(() => {
    const points: LatLngTuple[] = [pickup, destination].filter((p): p is GoogleMapsPlace => Boolean(p))
      .map(p => [p.latitude, p.longitude]);
    if (points.length === 2) map.fitBounds(points, { padding: [50, 50], maxZoom: 15, animate: false });
    else if (points.length === 1) map.setView(points[0], 14, { animate: false });
  }, [map, pickup?.latitude, pickup?.longitude, destination?.latitude, destination?.longitude]);
  useEffect(() => { map.getContainer().style.cursor = selectionMode ? 'crosshair' : ''; }, [map, selectionMode]);
  return null;
}

/** A real street map remains usable when Google Maps is unavailable. */
export function StreetRouteMap(props: Props) {
  const { pickup, destination, selectionMode } = props;
  const [route, setRoute] = useState<CalculatedRouteInfo | null>(null);
  const [status, setStatus] = useState('');
  // Parent forms pass inline handlers. A handler change must not repeat routing requests.
  const callbacks = useRef(props);
  callbacks.current = props;
  useEffect(() => {
    setRoute(null);
    callbacks.current.onRouteChange?.(null);
    callbacks.current.onRouteError?.(null);
    if (!pickup || !destination) { setStatus(''); return; }
    const controller = new AbortController();
    let disposed = false;
    const timeout = setTimeout(() => controller.abort(), 12000);
    setStatus('Finding a driving route…');
    const coordinates = `${pickup.longitude},${pickup.latitude};${destination.longitude},${destination.latitude}`;
    fetch(`https://router.project-osrm.org/route/v1/driving/${coordinates}?overview=full&geometries=polyline`, { signal: controller.signal })
      .then(async response => {
        if (!response.ok) throw new Error('Routing unavailable');
        const data = await response.json();
        const result = data.routes?.[0];
        if (data.code !== 'Ok' || !result || !Number.isFinite(result.distance) || !Number.isFinite(result.duration)) throw new Error('No driving route');
        // Reuse the existing polyline decoder so rides keep the same storage format.
        const distance = formatDistance(result.distance), duration = formatDuration(result.duration);
        const calculated: CalculatedRouteInfo = { distanceMeters: result.distance, distanceKm: distance.km, distanceText: distance.text,
          durationSeconds: result.duration, durationMinutes: duration.minutes, durationText: duration.text,
          encodedPolyline: result.geometry, polylinePath: decodePolyline(result.geometry) };
        if (disposed) return;
        setRoute(calculated);
        setStatus(`${distance.text} · ${duration.text}`);
        callbacks.current.onRouteChange?.(calculated);
      })
      .catch(() => { if (!disposed) setStatus('Driving route unavailable. The form can use an estimated distance.'); })
      .finally(() => clearTimeout(timeout));
    return () => { disposed = true; controller.abort(); clearTimeout(timeout); };
  }, [pickup?.latitude, pickup?.longitude, destination?.latitude, destination?.longitude]);
  const center: LatLngTuple = pickup ? [pickup.latitude, pickup.longitude]
    : destination ? [destination.latitude, destination.longitude] : [19.076, 72.8777];
  return <div className="rm-street-map relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700">
    <MapContainer center={center} zoom={pickup || destination ? 14 : 11} scrollWheelZoom={false} className="h-80 sm:h-96 w-full" aria-label="Interactive street map">
      <TileLayer url="https://tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' maxZoom={19} />
      <MapInteraction {...props}/>
      {pickup && <CircleMarker center={[pickup.latitude, pickup.longitude]} radius={10} pathOptions={{ color: 'white', weight: 3, fillColor: '#10b981', fillOpacity: 1 }}><Tooltip permanent direction="top">Pickup: {pickup.displayName || pickup.formattedAddress}</Tooltip></CircleMarker>}
      {destination && <CircleMarker center={[destination.latitude, destination.longitude]} radius={10} pathOptions={{ color: 'white', weight: 3, fillColor: '#6256ee', fillOpacity: 1 }}><Tooltip permanent direction="top">Drop-off: {destination.displayName || destination.formattedAddress}</Tooltip></CircleMarker>}
      {route && <Polyline positions={route.polylinePath.map(p => [p.lat, p.lng] as LatLngTuple)} pathOptions={{ color: '#6256ee', weight: 5 }}/>} 
    </MapContainer>
    <div className="street-map-instructions" role="status">{selectionMode ? `Click the map to choose your ${selectionMode === 'pickup' ? 'pickup' : 'destination'}.` : status || (pickup ? 'Choose a destination to see your driving route.' : 'Search a location or use Choose on Map.')}</div>
  </div>;
}
