import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { TopNavBar } from './components/TopNavBar';
import { Sidebar } from './components/Sidebar';
import { GoogleMap } from './components/GoogleMap';
import { ModeratorDashboard } from './pages/ModeratorDashboard';
import { mockEvents } from './data/mockEvents';
import { FilterOptions } from './types';

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentView, setCurrentView] = useState<'dashboard' | 'moderator'>('dashboard');
  const [showSentimentHeatmap, setShowSentimentHeatmap] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    category: '',
    severity: '',
    timeRange: '',
  });

  const filteredEvents = useMemo(() => {
    return mockEvents.filter(event => {
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
  }, [searchQuery, filters]);

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
          events={mockEvents}
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
    </div>
  );
}

export default App;