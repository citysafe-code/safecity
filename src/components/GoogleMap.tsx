import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { CityEvent } from '../types';
import { SentimentHeatmap } from './SentimentHeatmap';

interface GoogleMapProps {
  events: CityEvent[];
  className?: string;
  showSentimentHeatmap?: boolean;
}

export const GoogleMap: React.FC<GoogleMapProps> = ({ 
  events, 
  className = '',
  showSentimentHeatmap = false 
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [selectedArea, setSelectedArea] = useState<any>(null);

  // In a real application, you would integrate with the Google Maps JavaScript API
  // For this demo, we'll create a styled map placeholder
  useEffect(() => {
    // Simulated map initialization
    console.log('Map initialized with events:', events);
  }, [events]);

  const getMarkerColor = (category: string) => {
    switch (category) {
      case 'traffic':
        return 'bg-red-500';
      case 'civic':
        return 'bg-blue-500';
      case 'celebration':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  const handleAreaSelect = (area: any) => {
    setSelectedArea(area);
    console.log('Selected area:', area);
  };

  return (
    <motion.div
      className={`relative overflow-hidden ${className}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Base Map */}
      <div
        ref={mapRef}
        className="w-full h-full bg-gradient-to-br from-blue-50 to-green-50 relative"
        style={{
          backgroundImage: `
            linear-gradient(45deg, rgba(59, 130, 246, 0.1) 25%, transparent 25%),
            linear-gradient(-45deg, rgba(59, 130, 246, 0.1) 25%, transparent 25%),
            linear-gradient(45deg, transparent 75%, rgba(59, 130, 246, 0.1) 75%),
            linear-gradient(-45deg, transparent 75%, rgba(59, 130, 246, 0.1) 75%)
          `,
          backgroundSize: '20px 20px',
          backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px'
        }}
      >
        {/* Simulated city streets */}
        <svg className="absolute inset-0 w-full h-full opacity-20" viewBox="0 0 800 600">
          <defs>
            <pattern id="streets" patternUnits="userSpaceOnUse" width="100" height="100">
              <rect width="100" height="100" fill="transparent" />
              <line x1="0" y1="50" x2="100" y2="50" stroke="#374151" strokeWidth="2" />
              <line x1="50" y1="0" x2="50" y2="100" stroke="#374151" strokeWidth="2" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#streets)" />
        </svg>
      </div>

      {/* Sentiment Heatmap Layer */}
      {showSentimentHeatmap && (
        <SentimentHeatmap 
          className="absolute inset-0 z-10"
          onAreaSelect={handleAreaSelect}
        />
      )}

      {/* Event markers layer */}
      <div className="absolute inset-0 z-20 pointer-events-none">
        {events.map((event, index) => (
          <motion.div
            key={event.id}
            className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer pointer-events-auto"
            style={{
              left: `${20 + (index * 15) % 60}%`,
              top: `${20 + (index * 12) % 60}%`,
            }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
            whileHover={{ scale: 1.2 }}
          >
            <div className={`w-4 h-4 rounded-full ${getMarkerColor(event.category)} border-2 border-white shadow-lg`}>
              <div className={`w-2 h-2 rounded-full ${getMarkerColor(event.category)} animate-pulse absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2`} />
            </div>
            
            {/* Tooltip */}
            <motion.div
              className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-gray-900 text-white text-xs rounded-lg px-2 py-1 whitespace-nowrap opacity-0 pointer-events-none"
              whileHover={{ opacity: 1, y: -2 }}
            >
              {event.title}
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45" />
            </motion.div>
          </motion.div>
        ))}
      </div>

      {/* Map overlay with city name */}
      <div className="absolute top-4 left-4 bg-white bg-opacity-90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg z-30">
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

      {/* Map controls */}
      <div className="absolute bottom-4 right-4 space-y-2 z-30">
        <motion.button
          className="block w-10 h-10 bg-white rounded-lg shadow-lg flex items-center justify-center hover:bg-gray-50"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <span className="text-gray-600 text-lg font-bold">+</span>
        </motion.button>
        <motion.button
          className="block w-10 h-10 bg-white rounded-lg shadow-lg flex items-center justify-center hover:bg-gray-50"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <span className="text-gray-600 text-lg font-bold">−</span>
        </motion.button>
      </div>

      {/* Legend - only show when sentiment heatmap is active */}
      {showSentimentHeatmap && (
        <div className="absolute bottom-4 left-4 bg-white bg-opacity-90 backdrop-blur-sm rounded-lg p-3 shadow-lg z-30">
          <h4 className="font-semibold text-gray-800 text-sm mb-2">Sentiment Heatmap</h4>
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
        </div>
      )}

      {/* Standard map legend */}
      {!showSentimentHeatmap && (
        <div className="absolute bottom-4 left-4 bg-white bg-opacity-90 backdrop-blur-sm rounded-lg p-3 shadow-lg z-30">
          <h4 className="font-semibold text-gray-800 text-sm mb-2">Event Types</h4>
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
        </div>
      )}
    </motion.div>
  );
};