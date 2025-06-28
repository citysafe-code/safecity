import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { CityEvent } from '../types';
import { SentimentHeatmap } from './SentimentHeatmap';

interface GoogleMapProps {
  events: CityEvent[];
  className?: string;
  showSentimentHeatmap?: boolean;
}

declare global {
  interface Window {
    google: any;
    googleMapsLoaded: boolean;
  }
}

export const GoogleMap: React.FC<GoogleMapProps> = ({ 
  events, 
  className = '',
  showSentimentHeatmap = false 
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [selectedArea, setSelectedArea] = useState<any>(null);

  // Initialize Google Map
  const initializeMap = useCallback(() => {
    if (!mapRef.current || !window.google || mapInstanceRef.current) return;

    const mapOptions = {
      center: { lat: 37.7749, lng: -122.4194 }, // San Francisco
      zoom: 13,
      styles: [
        {
          featureType: 'all',
          elementType: 'geometry.fill',
          stylers: [{ color: '#f5f5f5' }]
        },
        {
          featureType: 'water',
          elementType: 'geometry',
          stylers: [{ color: '#e9e9e9' }, { lightness: 17 }]
        },
        {
          featureType: 'administrative',
          elementType: 'geometry.stroke',
          stylers: [{ color: '#c9b2a6' }, { lightness: 17 }, { weight: 1.2 }]
        },
        {
          featureType: 'road.highway',
          elementType: 'geometry.fill',
          stylers: [{ color: '#ffffff' }, { lightness: 17 }]
        },
        {
          featureType: 'road.highway',
          elementType: 'geometry.stroke',
          stylers: [{ color: '#ffffff' }, { lightness: 29 }, { weight: 0.2 }]
        },
        {
          featureType: 'road.arterial',
          elementType: 'geometry',
          stylers: [{ color: '#ffffff' }, { lightness: 18 }]
        },
        {
          featureType: 'road.local',
          elementType: 'geometry',
          stylers: [{ color: '#ffffff' }, { lightness: 16 }]
        },
        {
          featureType: 'poi',
          elementType: 'geometry',
          stylers: [{ color: '#f5f5f5' }, { lightness: 21 }]
        },
        {
          featureType: 'poi.park',
          elementType: 'geometry',
          stylers: [{ color: '#dedede' }, { lightness: 21 }]
        },
        {
          featureType: 'transit',
          elementType: 'geometry',
          stylers: [{ color: '#f2f2f2' }, { lightness: 19 }]
        }
      ],
      disableDefaultUI: false,
      zoomControl: true,
      mapTypeControl: false,
      scaleControl: true,
      streetViewControl: false,
      rotateControl: false,
      fullscreenControl: true
    };

    mapInstanceRef.current = new window.google.maps.Map(mapRef.current, mapOptions);
    setIsMapLoaded(true);
  }, []);

  // Load Google Maps
  useEffect(() => {
    if (window.googleMapsLoaded) {
      initializeMap();
    } else {
      const handleMapsLoaded = () => {
        initializeMap();
      };
      window.addEventListener('google-maps-loaded', handleMapsLoaded);
      return () => window.removeEventListener('google-maps-loaded', handleMapsLoaded);
    }
  }, [initializeMap]);

  // Update markers when events change
  useEffect(() => {
    if (!isMapLoaded || !mapInstanceRef.current) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    // Add new markers
    events.forEach((event, index) => {
      const position = {
        lat: event.location.coordinates.lat,
        lng: event.location.coordinates.lng
      };

      const markerColor = getMarkerColor(event.category);
      const markerIcon = {
        path: window.google.maps.SymbolPath.CIRCLE,
        fillColor: markerColor,
        fillOpacity: 0.8,
        strokeColor: '#ffffff',
        strokeWeight: 2,
        scale: getSeverityScale(event.severity)
      };

      const marker = new window.google.maps.Marker({
        position,
        map: mapInstanceRef.current,
        icon: markerIcon,
        title: event.title,
        animation: window.google.maps.Animation.DROP
      });

      // Create info window
      const infoWindow = new window.google.maps.InfoWindow({
        content: createInfoWindowContent(event)
      });

      marker.addListener('click', () => {
        // Close other info windows
        markersRef.current.forEach(m => {
          if (m.infoWindow) m.infoWindow.close();
        });
        
        infoWindow.open(mapInstanceRef.current, marker);
      });

      marker.infoWindow = infoWindow;
      markersRef.current.push(marker);
    });
  }, [events, isMapLoaded]);

  const getMarkerColor = (category: string) => {
    switch (category) {
      case 'traffic':
        return '#ef4444'; // red
      case 'civic':
        return '#3b82f6'; // blue
      case 'celebration':
        return '#10b981'; // green
      default:
        return '#6b7280'; // gray
    }
  };

  const getSeverityScale = (severity: string) => {
    switch (severity) {
      case 'high':
        return 12;
      case 'medium':
        return 8;
      case 'low':
        return 6;
      default:
        return 8;
    }
  };

  const createInfoWindowContent = (event: CityEvent) => {
    const timeAgo = getTimeAgo(event.timestamp);
    const severityColor = getSeverityColor(event.severity);
    
    return `
      <div style="max-width: 300px; padding: 12px;">
        <div style="display: flex; align-items: center; margin-bottom: 8px;">
          <h3 style="margin: 0; font-size: 16px; font-weight: 600; color: #1f2937;">${event.title}</h3>
          <span style="margin-left: auto; background-color: ${severityColor}; color: white; padding: 2px 8px; border-radius: 12px; font-size: 12px; font-weight: 500;">${event.severity}</span>
        </div>
        <p style="margin: 8px 0; color: #4b5563; font-size: 14px; line-height: 1.4;">${event.description}</p>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 12px; padding-top: 8px; border-top: 1px solid #e5e7eb;">
          <span style="color: #6b7280; font-size: 12px;">📍 ${event.location.name}</span>
          <span style="color: #6b7280; font-size: 12px;">🕒 ${timeAgo}</span>
        </div>
        <div style="margin-top: 8px;">
          <span style="background-color: ${getCategoryColor(event.category)}; color: white; padding: 4px 8px; border-radius: 6px; font-size: 12px; text-transform: capitalize;">${event.category}</span>
          <span style="margin-left: 8px; color: ${getStatusColor(event.status)}; font-size: 12px; font-weight: 500; text-transform: capitalize;">${event.status}</span>
        </div>
      </div>
    `;
  };

  const getTimeAgo = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
      default: return '#6b7280';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'traffic': return '#ef4444';
      case 'civic': return '#3b82f6';
      case 'celebration': return '#10b981';
      default: return '#6b7280';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#ef4444';
      case 'monitoring': return '#f59e0b';
      case 'resolved': return '#10b981';
      default: return '#6b7280';
    }
  };

  const handleAreaSelect = (area: any) => {
    setSelectedArea(area);
    
    // Pan map to selected area if Google Maps is loaded
    if (mapInstanceRef.current && area.coordinates) {
      mapInstanceRef.current.panTo({
        lat: area.coordinates.lat,
        lng: area.coordinates.lng
      });
      mapInstanceRef.current.setZoom(15);
    }
  };

  return (
    <motion.div
      className={`relative overflow-hidden ${className}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Google Map Container */}
      <div
        ref={mapRef}
        className="w-full h-full"
        style={{ minHeight: '400px' }}
      />

      {/* Sentiment Heatmap Overlay */}
      {showSentimentHeatmap && (
        <div className="absolute inset-0 pointer-events-none">
          <SentimentHeatmap 
            className="w-full h-full pointer-events-auto"
            onAreaSelect={handleAreaSelect}
          />
        </div>
      )}

      {/* Loading indicator */}
      {!isMapLoaded && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-gray-600">Loading map...</p>
          </div>
        </div>
      )}

      {/* Map overlay with city name */}
      <div className="absolute top-4 left-4 bg-white bg-opacity-90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg z-10">
        <h3 className="font-semibold text-gray-800">San Francisco</h3>
        <p className="text-sm text-gray-600">
          {showSentimentHeatmap ? 'Live Sentiment & Events' : 'City Event Monitoring'}
        </p>
        {selectedArea && (
          <p className="text-xs text-blue-600 mt-1">
            Viewing: {selectedArea.area}
          </p>
        )}
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-white bg-opacity-90 backdrop-blur-sm rounded-lg p-3 shadow-lg z-10">
        <h4 className="font-semibold text-gray-800 text-sm mb-2">
          {showSentimentHeatmap ? 'Sentiment Heatmap' : 'Event Types'}
        </h4>
        {showSentimentHeatmap ? (
          <div className="space-y-1 text-xs">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded bg-green-500"></div>
              <span>Positive</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded bg-gray-500"></div>
              <span>Neutral</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded bg-red-500"></div>
              <span>Negative</span>
            </div>
          </div>
        ) : (
          <div className="space-y-1 text-xs">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded bg-red-500"></div>
              <span>Traffic</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded bg-blue-500"></div>
              <span>Civic</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded bg-green-500"></div>
              <span>Celebration</span>
            </div>
          </div>
        )}
      </div>

      {/* Event count indicator */}
      <div className="absolute top-4 right-4 bg-white bg-opacity-90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg z-10">
        <div className="text-center">
          <div className="text-lg font-bold text-gray-900">{events.length}</div>
          <div className="text-xs text-gray-600">Active Events</div>
        </div>
      </div>
    </motion.div>
  );
};