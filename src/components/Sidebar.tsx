import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, TrendingUp, AlertCircle, Calendar } from 'lucide-react';
import { CityEvent, FilterOptions } from '../types';
import { EventCard } from './EventCard';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  events: CityEvent[];
  searchQuery: string;
  filters: FilterOptions;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  events,
  searchQuery,
  filters,
}) => {
  const filteredEvents = events.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         event.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         event.location.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = !filters.category || event.category === filters.category;
    const matchesSeverity = !filters.severity || event.severity === filters.severity;
    
    let matchesTime = true;
    if (filters.timeRange) {
      const now = new Date();
      const eventTime = event.timestamp;
      const diffHours = (now.getTime() - eventTime.getTime()) / (1000 * 60 * 60);
      
      switch (filters.timeRange) {
        case '1h':
          matchesTime = diffHours <= 1;
          break;
        case '24h':
          matchesTime = diffHours <= 24;
          break;
        case '7d':
          matchesTime = diffHours <= 168;
          break;
      }
    }
    
    return matchesSearch && matchesCategory && matchesSeverity && matchesTime;
  });

  const getEventStats = () => {
    const total = filteredEvents.length;
    const active = filteredEvents.filter(e => e.status === 'active').length;
    const high = filteredEvents.filter(e => e.severity === 'high').length;
    return { total, active, high };
  };

  const stats = getEventStats();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed left-0 top-0 h-full bg-white shadow-xl z-40 flex flex-col"
            initial={{ x: -400 }}
            animate={{ x: 0 }}
            exit={{ x: -400 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            style={{ width: '400px' }}
          >
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">City Events</h2>
                <motion.button
                  onClick={onClose}
                  className="p-1 rounded-lg hover:bg-gray-100 lg:hidden"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  <ChevronLeft className="h-5 w-5 text-gray-600" />
                </motion.button>
              </div>
              
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-blue-50 rounded-lg p-3 text-center">
                  <div className="flex items-center justify-center mb-1">
                    <TrendingUp className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="text-lg font-semibold text-blue-900">{stats.total}</div>
                  <div className="text-xs text-blue-600">Total Events</div>
                </div>
                
                <div className="bg-red-50 rounded-lg p-3 text-center">
                  <div className="flex items-center justify-center mb-1">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                  </div>
                  <div className="text-lg font-semibold text-red-900">{stats.active}</div>
                  <div className="text-xs text-red-600">Active</div>
                </div>
                
                <div className="bg-yellow-50 rounded-lg p-3 text-center">
                  <div className="flex items-center justify-center mb-1">
                    <Calendar className="h-4 w-4 text-yellow-600" />
                  </div>
                  <div className="text-lg font-semibold text-yellow-900">{stats.high}</div>
                  <div className="text-xs text-yellow-600">High Priority</div>
                </div>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              <div className="p-4 space-y-3">
                {filteredEvents.length > 0 ? (
                  filteredEvents.map((event, index) => (
                    <EventCard key={event.id} event={event} index={index} />
                  ))
                ) : (
                  <motion.div
                    className="text-center py-8"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <div className="text-gray-400 mb-2">
                      <AlertCircle className="h-12 w-12 mx-auto" />
                    </div>
                    <p className="text-gray-500">No events match your criteria</p>
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};