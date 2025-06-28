import { useState, useEffect, useCallback } from 'react';

declare global {
  interface Window {
    google: any;
    googleMapsLoaded: boolean;
  }
}

export const useGoogleMaps = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (window.googleMapsLoaded) {
      setIsLoaded(true);
      return;
    }

    const handleMapsLoaded = () => {
      setIsLoaded(true);
    };

    const handleMapsError = () => {
      setError('Failed to load Google Maps');
    };

    window.addEventListener('google-maps-loaded', handleMapsLoaded);
    window.addEventListener('google-maps-error', handleMapsError);

    // Check if script failed to load after timeout
    const timeout = setTimeout(() => {
      if (!window.googleMapsLoaded) {
        setError('Google Maps loading timeout');
      }
    }, 10000);

    return () => {
      window.removeEventListener('google-maps-loaded', handleMapsLoaded);
      window.removeEventListener('google-maps-error', handleMapsError);
      clearTimeout(timeout);
    };
  }, []);

  const geocodeAddress = useCallback(async (address: string) => {
    if (!isLoaded || !window.google) {
      throw new Error('Google Maps not loaded');
    }

    const geocoder = new window.google.maps.Geocoder();
    
    return new Promise<{ lat: number; lng: number }>((resolve, reject) => {
      geocoder.geocode({ address }, (results: any[], status: string) => {
        if (status === 'OK' && results[0]) {
          const location = results[0].geometry.location;
          resolve({
            lat: location.lat(),
            lng: location.lng()
          });
        } else {
          reject(new Error(`Geocoding failed: ${status}`));
        }
      });
    });
  }, [isLoaded]);

  const reverseGeocode = useCallback(async (lat: number, lng: number) => {
    if (!isLoaded || !window.google) {
      throw new Error('Google Maps not loaded');
    }

    const geocoder = new window.google.maps.Geocoder();
    const latlng = { lat, lng };
    
    return new Promise<string>((resolve, reject) => {
      geocoder.geocode({ location: latlng }, (results: any[], status: string) => {
        if (status === 'OK' && results[0]) {
          resolve(results[0].formatted_address);
        } else {
          reject(new Error(`Reverse geocoding failed: ${status}`));
        }
      });
    });
  }, [isLoaded]);

  return {
    isLoaded,
    error,
    geocodeAddress,
    reverseGeocode
  };
};