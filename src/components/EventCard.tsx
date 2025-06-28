import React from 'react';
import { motion } from 'framer-motion';
import { Car, Users, AlertTriangle, Clock, MapPin, Circle } from 'lucide-react';
import { CityEvent } from '../types';

interface EventCardProps {
  event: CityEvent;
  index: number;
}

export const EventCard: React.FC<EventCardProps> = ({ event, index }) => {
  const getEventIcon = (category: string) => {
    switch (category) {
      case 'traffic':
        return <Car className="h-5 w-5" />;
      case 'civic':
        return <AlertTriangle className="h-5 w-5" />;
      case 'celebration':
        return <Users className="h-5 w-5" />;
      default:
        return <Circle className="h-5 w-5" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'traffic':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'civic':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'celebration':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'bg-red-500';
      case 'medium':
        return 'bg-yellow-500';
      case 'low':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-red-600';
      case 'monitoring':
        return 'text-yellow-600';
      case 'resolved':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  const formatTime = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 60) {
      return `${minutes}m ago`;
    } else {
      const hours = Math.floor(minutes / 60);
      return `${hours}h ago`;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
      className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
      whileHover={{ scale: 1.02 }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-lg ${getCategoryColor(event.category)}`}>
            {getEventIcon(event.category)}
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 text-sm">{event.title}</h3>
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getCategoryColor(event.category)} mt-1`}>
              {event.category}
            </span>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${getSeverityColor(event.severity)}`}></div>
          <span className={`text-xs font-medium ${getStatusColor(event.status)}`}>
            {event.status}
          </span>
        </div>
      </div>
      
      <p className="text-gray-600 text-sm mb-3 line-clamp-2">{event.description}</p>
      
      <div className="flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center space-x-1">
          <MapPin className="h-3 w-3" />
          <span>{event.location.name}</span>
        </div>
        <div className="flex items-center space-x-1">
          <Clock className="h-3 w-3" />
          <span>{formatTime(event.timestamp)}</span>
        </div>
      </div>
    </motion.div>
  );
};