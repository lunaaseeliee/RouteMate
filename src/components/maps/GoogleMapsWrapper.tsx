import React, { useState, useEffect, createContext, useContext } from 'react';
import { APIProvider } from '@vis.gl/react-google-maps';
import { getGoogleMapsApiKey } from '../../lib/googleMapsConfig';

export interface GoogleMapsContextType {
  hasValidKey: boolean;
  apiKey: string;
  isLiveMapsAvailable: boolean;
}

export const GoogleMapsContext = createContext<GoogleMapsContextType>({
  hasValidKey: false,
  apiKey: '',
  isLiveMapsAvailable: false,
});

export const useGoogleMapsStatus = () => useContext(GoogleMapsContext);

interface GoogleMapsWrapperProps {
  children: React.ReactNode;
}

export const GoogleMapsWrapper: React.FC<GoogleMapsWrapperProps> = ({ children }) => {
  const [apiKey] = useState<string>(() => getGoogleMapsApiKey());
  const [authFailed, setAuthFailed] = useState(false);

  // Catch Google Maps JavaScript API authentication failures at runtime
  useEffect(() => {
    const previousAuthFailure = (window as any).gm_authFailure;
    (window as any).gm_authFailure = () => {
      console.warn('Google Maps authentication failed with current key. Falling back to local route engine.');
      setAuthFailed(true);
      if (typeof previousAuthFailure === 'function') {
        try {
          previousAuthFailure();
        } catch {
          // ignore
        }
      }
    };

    return () => {
      (window as any).gm_authFailure = previousAuthFailure;
    };
  }, []);

  const isLiveMapsAvailable = Boolean(apiKey && !authFailed);

  const contextValue: GoogleMapsContextType = {
    hasValidKey: Boolean(apiKey),
    apiKey: isLiveMapsAvailable ? apiKey : '',
    isLiveMapsAvailable,
  };

  if (!isLiveMapsAvailable) {
    // When no valid Google Maps API key is configured or auth fails,
    // render children directly so that forms, location pickers, and previews remain 100% operational
    return (
      <GoogleMapsContext.Provider value={contextValue}>
        {children}
      </GoogleMapsContext.Provider>
    );
  }

  return (
    <GoogleMapsContext.Provider value={contextValue}>
      <APIProvider apiKey={apiKey} libraries={['places', 'routes', 'marker', 'geometry']}>
        {children}
      </APIProvider>
    </GoogleMapsContext.Provider>
  );
};
