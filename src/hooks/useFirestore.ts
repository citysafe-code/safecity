import { useState, useEffect } from 'react';
import { 
  getEvents, 
  getEventsByLocation, 
  subscribeToEvents,
  getSentimentHeatmap,
  subscribeToSentimentHeatmap
} from '../firebase/firestore';
import { CityEvent } from '../types';

// Hook for fetching events
export const useEvents = (filters?: {
  eventType?: string;
  severity?: string;
  status?: string;
}) => {
  const [events, setEvents] = useState<CityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    // Subscribe to real-time events
    const unsubscribe = subscribeToEvents(
      (newEvents) => {
        setEvents(newEvents);
        setLoading(false);
      },
      filters
    );

    return () => unsubscribe();
  }, [filters?.eventType, filters?.severity, filters?.status]);

  return { events, loading, error };
};

// Hook for fetching events by location
export const useEventsByLocation = (
  latitude?: number,
  longitude?: number,
  radiusKm: number = 10
) => {
  const [events, setEvents] = useState<CityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!latitude || !longitude) {
      setLoading(false);
      return;
    }

    const fetchEvents = async () => {
      try {
        setLoading(true);
        setError(null);
        const locationEvents = await getEventsByLocation(latitude, longitude, radiusKm);
        setEvents(locationEvents);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch events');
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [latitude, longitude, radiusKm]);

  return { events, loading, error };
};

// Hook for sentiment heatmap data
export const useSentimentHeatmap = () => {
  const [heatmapData, setHeatmapData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    // Subscribe to real-time sentiment heatmap updates
    const unsubscribe = subscribeToSentimentHeatmap((data) => {
      setHeatmapData(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const refreshData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getSentimentHeatmap();
      setHeatmapData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch heatmap data');
    } finally {
      setLoading(false);
    }
  };

  return { heatmapData, loading, error, refreshData };
};

// Hook for user location
export const useUserLocation = () => {
  const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        });
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    );
  }, []);

  return { location, loading, error };
};