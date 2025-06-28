import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, Menu, Activity, Shield, Users, TrendingUp, Eye, EyeOff } from 'lucide-react';
import { FilterOptions } from '../types';

interface TopNavBarProps {
  onToggleSidebar: () => void;
  isSidebarOpen: boolean;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  filters: FilterOptions;
  setFilters: (filters: FilterOptions) => void;
  onViewChange?: (view: 'dashboard' | 'moderator') => void;
  currentView?: 'dashboard' | 'moderator';
  showSentimentHeatmap?: boolean;
  onToggleSentimentHeatmap?: () => void;
}

export const TopNavBar: React.FC<TopNavBarProps> = ({
  onToggleSidebar,
  isSidebarOpen,
  searchQuery,
  setSearchQuery,
  filters,
  setFilters,
  onViewChange,
  currentView = 'dashboard',
  showSentimentHeatmap = true,
  onToggleSentimentHeatmap
}) => {
  const [showFilters, setShowFilters] = useState(false);

  return (
    <motion.nav
      className="bg-white shadow-lg border-b border-gray-200 px-4 py-3 flex items-center justify-between relative z-20"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex items-center space-x-4">
        <motion.button
          onClick={onToggleSidebar}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Menu className="h-5 w-5 text-gray-600" />
        </motion.button>
        
        <div className="flex items-center space-x-2">
          <Activity className="h-8 w-8 text-blue-600" />
          <h1 className="text-xl font-bold text-gray-800">City Pulse</h1>
        </div>

        {/* View Toggle */}
        {onViewChange && (
          <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => onViewChange('dashboard')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                currentView === 'dashboard'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <Users className="h-4 w-4" />
              <span>Dashboard</span>
            </button>
            <button
              onClick={() => onViewChange('moderator')}
              className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                currentView === 'moderator'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <Shield className="h-4 w-4" />
              <span>Moderator</span>
            </button>
          </div>
        )}
      </div>

      {currentView === 'dashboard' && (
        <>
          <div className="flex-1 max-w-lg mx-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search events, locations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Sentiment Heatmap Toggle */}
            {onToggleSentimentHeatmap && (
              <motion.button
                onClick={onToggleSentimentHeatmap}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                  showSentimentHeatmap 
                    ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <TrendingUp className="h-4 w-4" />
                <span className="text-sm font-medium">Sentiment</span>
                {showSentimentHeatmap ? (
                  <Eye className="h-4 w-4" />
                ) : (
                  <EyeOff className="h-4 w-4" />
                )}
              </motion.button>
            )}

            <motion.button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2 px-3 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Filter className="h-4 w-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Filters</span>
            </motion.button>
          </div>

          {showFilters && (
            <motion.div
              className="absolute top-full right-4 mt-2 bg-white rounded-lg shadow-xl border border-gray-200 p-4 w-80 z-30"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                  <select
                    value={filters.category}
                    onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Categories</option>
                    <option value="traffic">Traffic</option>
                    <option value="civic">Civic</option>
                    <option value="celebration">Celebrations</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Severity</label>
                  <select
                    value={filters.severity}
                    onChange={(e) => setFilters({ ...filters, severity: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Severities</option>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Time Range</label>
                  <select
                    value={filters.timeRange}
                    onChange={(e) => setFilters({ ...filters, timeRange: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Time</option>
                    <option value="1h">Last Hour</option>
                    <option value="24h">Last 24 Hours</option>
                    <option value="7d">Last 7 Days</option>
                  </select>
                </div>
              </div>
            </motion.div>
          )}
        </>
      )}
    </motion.nav>
  );
};