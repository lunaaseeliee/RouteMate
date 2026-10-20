// Google Maps Platform Configuration and Key Management
// Compliance: gmp_mcp_codeassist_v1_aistudio attribution tracking

const LOCAL_STORAGE_KEY = 'routemate_google_maps_api_key';

export const GMP_ATTRIBUTION_ID = 'gmp_mcp_codeassist_v1_aistudio';

// Map ID validation (must be a valid Cloud Map ID or 'DEMO_MAP_ID')
const envMapId = (import.meta as any).env?.VITE_GOOGLE_MAPS_MAP_ID;
export const DEFAULT_MAP_ID: string =
  typeof envMapId === 'string' && envMapId.length >= 10 && envMapId !== 'YOUR_GOOGLE_MAPS_MAP_ID' && envMapId !== '2'
    ? envMapId.trim()
    : 'DEMO_MAP_ID';

/**
 * Validates whether a key matches the standard Google Maps Platform API key format
 * (Keys always start with 'AIza' and are approximately 39 characters long).
 */
export function isValidGoogleMapsApiKey(key: unknown): boolean {
  if (typeof key !== 'string') return false;
  const trimmed = key.trim();
  if (!trimmed || trimmed.includes('YOUR_GOOGLE_MAPS_API_KEY')) return false;
  // Google Cloud & Maps API keys start with AIza
  return trimmed.startsWith('AIza') && trimmed.length >= 30;
}

export function getGoogleMapsApiKey(): string {
  // Check Vite environment variable first
  const envKey = (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY;
  if (isValidGoogleMapsApiKey(envKey)) {
    return (envKey as string).trim();
  }

  // Check locally saved user key in browser
  try {
    const localKey = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (isValidGoogleMapsApiKey(localKey)) {
      return (localKey as string).trim();
    }
  } catch {
    // ignore local storage error in restricted contexts
  }

  return '';
}

export function setGoogleMapsApiKey(apiKey: string): void {
  try {
    if (isValidGoogleMapsApiKey(apiKey)) {
      localStorage.setItem(LOCAL_STORAGE_KEY, apiKey.trim());
    } else {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    }
  } catch (err) {
    console.error('Failed to store Google Maps API key:', err);
  }
}

