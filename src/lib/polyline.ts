/**
 * Decodes an encoded polyline string into an array of { lat, lng } coordinates.
 * Standard algorithm used by Google Maps Platform Routes and Directions API.
 */
export function decodePolyline(encoded: string): { lat: number; lng: number }[] {
  if (!encoded || typeof encoded !== 'string') return [];
  
  const points: { lat: number; lng: number }[] = [];
  let index = 0;
  const len = encoded.length;
  let lat = 0;
  let lng = 0;

  try {
    while (index < len) {
      let b: number;
      let shift = 0;
      let result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20 && index < len);
      
      const dlat = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
      lat += dlat;

      shift = 0;
      result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20 && index < len);
      
      const dlng = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
      lng += dlng;

      points.push({ lat: lat / 1e5, lng: lng / 1e5 });
    }
  } catch (err) {
    console.error('Error decoding polyline string:', err);
  }

  return points;
}

export function formatDistance(meters: number): { text: string; km: number; miles: number } {
  const km = Math.round((meters / 1000) * 10) / 10;
  const miles = Math.round((meters / 1609.34) * 10) / 10;
  
  if (meters < 1000) {
    return { text: `${meters} m`, km, miles };
  }
  return {
    text: `${km.toLocaleString()} km (${miles.toLocaleString()} mi)`,
    km,
    miles
  };
}

export function formatDuration(seconds: number): { text: string; minutes: number; hours: number } {
  const minutes = Math.round(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const remainingMins = minutes % 60;

  if (hours > 0) {
    return {
      text: `${hours} hr${hours > 1 ? 's' : ''} ${remainingMins} min${remainingMins !== 1 ? 's' : ''}`,
      minutes,
      hours
    };
  }

  return {
    text: `${minutes} min${minutes !== 1 ? 's' : ''}`,
    minutes,
    hours: 0
  };
}

/**
 * Calculates great-circle distance between two coordinates in meters (Haversine formula).
 */
export function calculateHaversineDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth radius in metres
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

/**
 * Generates an estimated route with simulated path and driving metrics when offline or without live Maps API.
 */
export function estimateRouteInfo(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number }
): {
  distanceMeters: number;
  distanceKm: number;
  distanceText: string;
  durationSeconds: number;
  durationMinutes: number;
  durationText: string;
  encodedPolyline: string;
  polylinePath: { lat: number; lng: number }[];
} {
  const haversine = calculateHaversineDistanceMeters(origin.lat, origin.lng, destination.lat, destination.lng);
  // Realistic road curvature factor ~1.28
  const distanceMeters = Math.max(800, Math.round(haversine * 1.28));
  // Average city/highway blended driving speed ~55 km/h (~15.3 m/s)
  const durationSeconds = Math.max(180, Math.round(distanceMeters / 15.3));

  const distInfo = formatDistance(distanceMeters);
  const durInfo = formatDuration(durationSeconds);

  // Interpolate 12 waypoint coordinates between origin and destination with slight realistic curve
  const steps = 12;
  const polylinePath: { lat: number; lng: number }[] = [];
  for (let i = 0; i <= steps; i++) {
    const fraction = i / steps;
    const baseLat = origin.lat + (destination.lat - origin.lat) * fraction;
    const baseLng = origin.lng + (destination.lng - origin.lng) * fraction;
    // Add subtle natural road curve deviation in middle
    const arc = Math.sin(fraction * Math.PI) * 0.008;
    polylinePath.push({
      lat: baseLat + arc,
      lng: baseLng - arc
    });
  }

  return {
    distanceMeters,
    distanceKm: distInfo.km,
    distanceText: distInfo.text,
    durationSeconds,
    durationMinutes: durInfo.minutes,
    durationText: durInfo.text,
    encodedPolyline: '',
    polylinePath
  };
}

