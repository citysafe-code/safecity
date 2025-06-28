import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TopNavBar } from './components/TopNavBar';
import { Sidebar } from './components/Sidebar';
import { GoogleMap } from './components/GoogleMap';
import { ModeratorDashboard } from './pages/ModeratorDashboard';
import { EventReportForm } from './components/EventReportForm';
import { AuthModal } from './components/AuthModal';
import { mockEvents } from './data/mockEvents';
import { FilterOptions } from './types';
import { useEvents, useUserLocation } from './hooks/useFirestore';
import { onAuthStateChange, getCurrentUser } from './firebase/auth';
import { Plus, User, LogOut } from 'lucide-react';

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentView, setCurrentView] = useState<'dashboard' | 'moderator'>('dashboard');
  const [showSentimentHeatmap, setShowSentimentHeatmap] = useState(false);
  const [showReportForm, setShowReportForm] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [user, setUser] = useState(getCurrentUser());
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

  const handleReportSubmit = (eventId: string) => {
    setShowReportForm(false);
    // Optionally show success message or navigate to the new event
    console.log('Event reported successfully:', eventId);
  };

  const handleAuthSuccess = () => {
    setShowAuthModal(false);
  };

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

      {/* Floating Action Buttons */}
      <div className="fixed bottom-6 right-6 space-y-3 z-40">
        {/* Report Event Button */}
        <motion.button
          onClick={() => user ? setShowReportForm(true) : setShowAuthModal(true)}
          className="w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 flex items-center justify-center"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          title="Report Event"
        >
          <Plus className="h-6 w-6" />
        </motion.button>

        {/* User Menu Button */}
        <motion.button
          onClick={() => user ? console.log('Show user menu') : setShowAuthModal(true)}
          className="w-12 h-12 bg-white text-gray-600 rounded-full shadow-lg hover:bg-gray-50 flex items-center justify-center border border-gray-200"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          title={user ? 'User Menu' : 'Sign In'}
        >
          {user ? (
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-blue-600">
                {user.displayName?.charAt(0) || user.email?.charAt(0) || 'U'}
              </span>
            </div>
          ) : (
            <User className="h-5 w-5" />
          )}
        </motion.button>
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

      {/* User info indicator */}
      {user && (
        <div className="absolute top-20 left-4 bg-white rounded-lg shadow-lg p-3 z-50">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-xs font-medium text-blue-600">
                {user.displayName?.charAt(0) || user.email?.charAt(0) || 'U'}
              </span>
            </div>
            <span className="text-sm text-gray-700">
              {user.displayName || user.email}
            </span>
          </div>
        </div>
      )}

      {/* Modals */}
      <AnimatePresence>
        {showReportForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          >
            <EventReportForm
              onSubmit={handleReportSubmit}
              onCancel={() => setShowReportForm(false)}
            />
          </motion.div>
        )}

        {showAuthModal && (
          <AuthModal
            isOpen={showAuthModal}
            onClose={() => setShowAuthModal(false)}
            onSuccess={handleAuthSuccess}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;