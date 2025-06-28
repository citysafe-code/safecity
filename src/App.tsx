import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TopNavBar } from './components/TopNavBar';
import { Sidebar } from './components/Sidebar';
import { GoogleMap } from './components/GoogleMap';
import { ModeratorDashboard } from './pages/ModeratorDashboard';
import { mockEvents } from './data/mockEvents';
import { FilterOptions } from './types';
import { useEvents, useUserLocation } from './hooks/useFirestore';
import { onAuthStateChange } from './firebase/auth';

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentView, setCurrentView] = useState<'dashboard' | 'moderator'>('dashboard');
  const [showSentimentHeatmap, setShowSentimentHeatmap] = useState(false);
  const [user, setUser] = useState(null);
  const [filters, setFilters] = useState<FilterOptions>({
    category: '',
    severity: '',
    timeRange: '',
  });

  // Firebase hooks
  const { events: firebaseEvents, loading: eventsLoading } = useEvents();
  const { location: userLocation } = useUserLocation();

  // Use Firebase events if available, otherwise fall back to mock data
  const events = firebaseEvents.length > 0 ? firebaseEvents : mockEvents;

  // Listen for authentication state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChange((user) => {
      setUser(user);
    });

    return () => unsubscribe();
  }, []);

  const filteredEvents = useMemo(() => {
    return events.filter(event => {
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
  }, [events, searchQuery, filters]);

  if (currentView === 'moderator') {
    return <ModeratorDashboard />;
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
      <TopNavBar
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        isSidebarOpen={isSidebarOpen}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        filters={filters}
        setFilters={setFilters}
        onViewChange={setCurrentView}
        currentView={currentView}
        showSentimentHeatmap={showSentimentHeatmap}
        onToggleSentimentHeatmap={() => setShowSentimentHeatmap(!showSentimentHeatmap)}
      />
      
      <div className="flex-1 flex relative">
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          events={filteredEvents}
          searchQuery={searchQuery}
          filters={filters}
        />
        
        <motion.main
          className="flex-1 relative"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <GoogleMap 
            events={filteredEvents}
            className="w-full h-full"
            showSentimentHeatmap={showSentimentHeatmap}
          />
        </motion.main>
      </div>

      {/* Loading indicator for Firebase data */}
      {eventsLoading && (
        <div className="absolute top-20 right-4 bg-white rounded-lg shadow-lg p-3 z-50">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span className="text-sm text-gray-600">Loading events...</span>
          </div>
        </div>
      )}

      {/* User location indicator */}
      {userLocation && (
        <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-2 z-50">
          <div className="text-xs text-gray-600">
            📍 Location: {userLocation.latitude.toFixed(4)}, {userLocation.longitude.toFixed(4)}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;