import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle, 
  XCircle, 
  Edit3, 
  Flag, 
  Eye, 
  Filter, 
  Search, 
  Calendar,
  MapPin,
  User,
  AlertTriangle,
  Clock,
  Image,
  MessageSquare,
  TrendingUp,
  Shield,
  Star,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react';
import { CityEvent } from '../types';

interface ModeratorEvent extends CityEvent {
  trustScore: number;
  userDisplayName: string;
  aiSummary: string;
  sentimentScore: number;
  mediaUrls: string[];
  verificationCount: number;
  reportCount: number;
  moderationStatus: 'pending' | 'approved' | 'flagged' | 'rejected';
  moderatorNotes?: string;
  lastModerated?: Date;
  moderatedBy?: string;
}

interface ModeratorFilters {
  status: string;
  category: string;
  severity: string;
  trustScore: string;
  timeRange: string;
  sentiment: string;
}

interface ModeratorPanelProps {
  events: ModeratorEvent[];
  onApprove: (eventId: string, notes?: string) => void;
  onFlag: (eventId: string, reason: string, notes?: string) => void;
  onEdit: (eventId: string, updates: Partial<ModeratorEvent>) => void;
  onReject: (eventId: string, reason: string, notes?: string) => void;
}

export const ModeratorPanel: React.FC<ModeratorPanelProps> = ({
  events,
  onApprove,
  onFlag,
  onEdit,
  onReject
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<ModeratorFilters>({
    status: '',
    category: '',
    severity: '',
    trustScore: '',
    timeRange: '',
    sentiment: ''
  });
  const [selectedEvent, setSelectedEvent] = useState<ModeratorEvent | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const filteredEvents = useMemo(() => {
    return events.filter(event => {
      const matchesSearch = 
        event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.userDisplayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        event.location.name.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = !filters.status || event.moderationStatus === filters.status;
      const matchesCategory = !filters.category || event.category === filters.category;
      const matchesSeverity = !filters.severity || event.severity === filters.severity;
      
      const matchesTrustScore = !filters.trustScore || (() => {
        switch (filters.trustScore) {
          case 'high': return event.trustScore >= 80;
          case 'medium': return event.trustScore >= 50 && event.trustScore < 80;
          case 'low': return event.trustScore < 50;
          default: return true;
        }
      })();

      const matchesSentiment = !filters.sentiment || (() => {
        switch (filters.sentiment) {
          case 'positive': return event.sentimentScore > 0.2;
          case 'neutral': return event.sentimentScore >= -0.2 && event.sentimentScore <= 0.2;
          case 'negative': return event.sentimentScore < -0.2;
          default: return true;
        }
      })();

      let matchesTime = true;
      if (filters.timeRange) {
        const now = new Date();
        const eventTime = event.timestamp;
        const diffHours = (now.getTime() - eventTime.getTime()) / (1000 * 60 * 60);
        
        switch (filters.timeRange) {
          case '1h': matchesTime = diffHours <= 1; break;
          case '24h': matchesTime = diffHours <= 24; break;
          case '7d': matchesTime = diffHours <= 168; break;
          case '30d': matchesTime = diffHours <= 720; break;
        }
      }

      return matchesSearch && matchesStatus && matchesCategory && 
             matchesSeverity && matchesTrustScore && matchesSentiment && matchesTime;
    });
  }, [events, searchQuery, filters]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'approved': return 'bg-green-100 text-green-800 border-green-200';
      case 'flagged': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getTrustScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getSentimentIcon = (score: number) => {
    if (score > 0.2) return <ThumbsUp className="h-4 w-4 text-green-600" />;
    if (score < -0.2) return <ThumbsDown className="h-4 w-4 text-red-600" />;
    return <MessageSquare className="h-4 w-4 text-gray-600" />;
  };

  const formatTime = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const getEventStats = () => {
    const total = filteredEvents.length;
    const pending = filteredEvents.filter(e => e.moderationStatus === 'pending').length;
    const flagged = filteredEvents.filter(e => e.moderationStatus === 'flagged').length;
    const highSeverity = filteredEvents.filter(e => e.severity === 'high').length;
    return { total, pending, flagged, highSeverity };
  };

  const stats = getEventStats();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Shield className="h-8 w-8 text-blue-600" />
              <h1 className="text-2xl font-bold text-gray-900">Moderator Panel</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  <div className="grid grid-cols-2 gap-1 w-4 h-4">
                    <div className="bg-current rounded-sm"></div>
                    <div className="bg-current rounded-sm"></div>
                    <div className="bg-current rounded-sm"></div>
                    <div className="bg-current rounded-sm"></div>
                  </div>
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg ${viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  <div className="space-y-1 w-4 h-4">
                    <div className="bg-current h-1 rounded"></div>
                    <div className="bg-current h-1 rounded"></div>
                    <div className="bg-current h-1 rounded"></div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="grid grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
              <div className="text-sm text-gray-600">Total Events</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
              <div className="text-sm text-gray-600">Pending Review</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{stats.flagged}</div>
              <div className="text-sm text-gray-600">Flagged</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{stats.highSeverity}</div>
              <div className="text-sm text-gray-600">High Severity</div>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex items-center space-x-4 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search events, users, locations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <Filter className="h-4 w-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Filters</span>
            </button>
          </div>

          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 pt-4 border-t border-gray-200"
              >
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={filters.status}
                    onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="flagged">Flagged</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Category</label>
                  <select
                    value={filters.category}
                    onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Categories</option>
                    <option value="traffic">Traffic</option>
                    <option value="civic">Civic</option>
                    <option value="celebration">Celebration</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Severity</label>
                  <select
                    value={filters.severity}
                    onChange={(e) => setFilters({ ...filters, severity: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Severities</option>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Trust Score</label>
                  <select
                    value={filters.trustScore}
                    onChange={(e) => setFilters({ ...filters, trustScore: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Scores</option>
                    <option value="high">High (80+)</option>
                    <option value="medium">Medium (50-79)</option>
                    <option value="low">Low (&lt;50)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Sentiment</label>
                  <select
                    value={filters.sentiment}
                    onChange={(e) => setFilters({ ...filters, sentiment: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Sentiment</option>
                    <option value="positive">Positive</option>
                    <option value="neutral">Neutral</option>
                    <option value="negative">Negative</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Time Range</label>
                  <select
                    value={filters.timeRange}
                    onChange={(e) => setFilters({ ...filters, timeRange: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All Time</option>
                    <option value="1h">Last Hour</option>
                    <option value="24h">Last 24 Hours</option>
                    <option value="7d">Last 7 Days</option>
                    <option value="30d">Last 30 Days</option>
                  </select>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Events Grid/List */}
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-4'}>
          {filteredEvents.map((event, index) => (
            <EventModerationCard
              key={event.id}
              event={event}
              index={index}
              viewMode={viewMode}
              onApprove={onApprove}
              onFlag={onFlag}
              onEdit={onEdit}
              onReject={onReject}
              onViewDetails={() => setSelectedEvent(event)}
              formatTime={formatTime}
              getStatusColor={getStatusColor}
              getSeverityColor={getSeverityColor}
              getTrustScoreColor={getTrustScoreColor}
              getSentimentIcon={getSentimentIcon}
            />
          ))}
        </div>

        {filteredEvents.length === 0 && (
          <div className="text-center py-12">
            <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No events found</h3>
            <p className="text-gray-600">Try adjusting your search criteria or filters.</p>
          </div>
        )}
      </div>

      {/* Event Detail Modal */}
      <AnimatePresence>
        {selectedEvent && (
          <EventDetailModal
            event={selectedEvent}
            onClose={() => setSelectedEvent(null)}
            onApprove={onApprove}
            onFlag={onFlag}
            onEdit={onEdit}
            onReject={onReject}
            formatTime={formatTime}
            getStatusColor={getStatusColor}
            getSeverityColor={getSeverityColor}
            getTrustScoreColor={getTrustScoreColor}
            getSentimentIcon={getSentimentIcon}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

interface EventModerationCardProps {
  event: ModeratorEvent;
  index: number;
  viewMode: 'grid' | 'list';
  onApprove: (eventId: string, notes?: string) => void;
  onFlag: (eventId: string, reason: string, notes?: string) => void;
  onEdit: (eventId: string, updates: Partial<ModeratorEvent>) => void;
  onReject: (eventId: string, reason: string, notes?: string) => void;
  onViewDetails: () => void;
  formatTime: (timestamp: Date) => string;
  getStatusColor: (status: string) => string;
  getSeverityColor: (severity: string) => string;
  getTrustScoreColor: (score: number) => string;
  getSentimentIcon: (score: number) => React.ReactNode;
}

const EventModerationCard: React.FC<EventModerationCardProps> = ({
  event,
  index,
  viewMode,
  onApprove,
  onFlag,
  onEdit,
  onReject,
  onViewDetails,
  formatTime,
  getStatusColor,
  getSeverityColor,
  getTrustScoreColor,
  getSentimentIcon
}) => {
  const [showActions, setShowActions] = useState(false);

  if (viewMode === 'list') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: index * 0.05 }}
        className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 flex-1">
            <div className="flex-shrink-0">
              <div className={`w-3 h-3 rounded-full ${getSeverityColor(event.severity)}`}></div>
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <h3 className="text-sm font-semibold text-gray-900 truncate">{event.title}</h3>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(event.moderationStatus)}`}>
                  {event.moderationStatus}
                </span>
              </div>
              <p className="text-sm text-gray-600 truncate">{event.description}</p>
            </div>

            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <div className="flex items-center space-x-1">
                <User className="h-4 w-4" />
                <span className={getTrustScoreColor(event.trustScore)}>{event.trustScore}</span>
              </div>
              <div className="flex items-center space-x-1">
                {getSentimentIcon(event.sentimentScore)}
              </div>
              <div className="flex items-center space-x-1">
                <Clock className="h-4 w-4" />
                <span>{formatTime(event.timestamp)}</span>
              </div>
              {event.mediaUrls.length > 0 && (
                <div className="flex items-center space-x-1">
                  <Image className="h-4 w-4" />
                  <span>{event.mediaUrls.length}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={onViewDetails}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
            >
              <Eye className="h-4 w-4" />
            </button>
            <button
              onClick={() => onApprove(event.id)}
              className="p-2 text-green-600 hover:text-green-700 rounded-lg hover:bg-green-50"
            >
              <CheckCircle className="h-4 w-4" />
            </button>
            <button
              onClick={() => onFlag(event.id, 'needs_review')}
              className="p-2 text-orange-600 hover:text-orange-700 rounded-lg hover:bg-orange-50"
            >
              <Flag className="h-4 w-4" />
            </button>
            <button
              onClick={() => onReject(event.id, 'inappropriate')}
              className="p-2 text-red-600 hover:text-red-700 rounded-lg hover:bg-red-50"
            >
              <XCircle className="h-4 w-4" />
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
      className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Event Image */}
      {event.mediaUrls.length > 0 && (
        <div className="relative h-48 bg-gray-200">
          <img
            src={event.mediaUrls[0]}
            alt={event.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute top-2 right-2">
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(event.moderationStatus)}`}>
              {event.moderationStatus}
            </span>
          </div>
          {event.mediaUrls.length > 1 && (
            <div className="absolute bottom-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
              +{event.mediaUrls.length - 1} more
            </div>
          )}
        </div>
      )}

      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-1">
              <div className={`w-2 h-2 rounded-full ${getSeverityColor(event.severity)}`}></div>
              <h3 className="font-semibold text-gray-900 text-sm line-clamp-1">{event.title}</h3>
            </div>
            <p className="text-gray-600 text-sm line-clamp-2 mb-2">{event.description}</p>
          </div>
        </div>

        {/* AI Summary */}
        {event.aiSummary && (
          <div className="bg-blue-50 rounded-lg p-3 mb-3">
            <div className="flex items-center space-x-2 mb-1">
              <TrendingUp className="h-4 w-4 text-blue-600" />
              <span className="text-xs font-medium text-blue-800">AI Summary</span>
            </div>
            <p className="text-sm text-blue-700 line-clamp-2">{event.aiSummary}</p>
          </div>
        )}

        {/* Metadata */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center space-x-1">
              <User className="h-3 w-3" />
              <span>{event.userDisplayName}</span>
              <span className={`font-medium ${getTrustScoreColor(event.trustScore)}`}>
                ({event.trustScore})
              </span>
            </div>
            <div className="flex items-center space-x-1">
              {getSentimentIcon(event.sentimentScore)}
              <span>{(event.sentimentScore * 100).toFixed(0)}%</span>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center space-x-1">
              <MapPin className="h-3 w-3" />
              <span className="truncate">{event.location.name}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Clock className="h-3 w-3" />
              <span>{formatTime(event.timestamp)}</span>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center space-x-3">
              <span>👍 {event.verificationCount}</span>
              <span>📊 {event.reportCount}</span>
            </div>
            <span className="capitalize">{event.category}</span>
          </div>
        </div>

        {/* Actions */}
        <AnimatePresence>
          {showActions && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="flex items-center justify-between pt-3 border-t border-gray-200"
            >
              <button
                onClick={onViewDetails}
                className="flex items-center space-x-1 px-3 py-1 text-sm text-gray-600 hover:text-gray-800 rounded-lg hover:bg-gray-100"
              >
                <Eye className="h-4 w-4" />
                <span>View</span>
              </button>

              <div className="flex items-center space-x-1">
                <button
                  onClick={() => onApprove(event.id)}
                  className="p-2 text-green-600 hover:text-green-700 rounded-lg hover:bg-green-50"
                  title="Approve"
                >
                  <CheckCircle className="h-4 w-4" />
                </button>
                <button
                  onClick={() => onFlag(event.id, 'needs_review')}
                  className="p-2 text-orange-600 hover:text-orange-700 rounded-lg hover:bg-orange-50"
                  title="Flag for Review"
                >
                  <Flag className="h-4 w-4" />
                </button>
                <button
                  onClick={() => onEdit(event.id, {})}
                  className="p-2 text-blue-600 hover:text-blue-700 rounded-lg hover:bg-blue-50"
                  title="Edit"
                >
                  <Edit3 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => onReject(event.id, 'inappropriate')}
                  className="p-2 text-red-600 hover:text-red-700 rounded-lg hover:bg-red-50"
                  title="Reject"
                >
                  <XCircle className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

interface EventDetailModalProps {
  event: ModeratorEvent;
  onClose: () => void;
  onApprove: (eventId: string, notes?: string) => void;
  onFlag: (eventId: string, reason: string, notes?: string) => void;
  onEdit: (eventId: string, updates: Partial<ModeratorEvent>) => void;
  onReject: (eventId: string, reason: string, notes?: string) => void;
  formatTime: (timestamp: Date) => string;
  getStatusColor: (status: string) => string;
  getSeverityColor: (severity: string) => string;
  getTrustScoreColor: (score: number) => string;
  getSentimentIcon: (score: number) => React.ReactNode;
}

const EventDetailModal: React.FC<EventDetailModalProps> = ({
  event,
  onClose,
  onApprove,
  onFlag,
  onEdit,
  onReject,
  formatTime,
  getStatusColor,
  getSeverityColor,
  getTrustScoreColor,
  getSentimentIcon
}) => {
  const [notes, setNotes] = useState('');
  const [selectedAction, setSelectedAction] = useState<'approve' | 'flag' | 'reject' | null>(null);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{event.title}</h2>
              <div className="flex items-center space-x-4">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(event.moderationStatus)}`}>
                  {event.moderationStatus}
                </span>
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${getSeverityColor(event.severity)}`}></div>
                  <span className="text-sm text-gray-600 capitalize">{event.severity} severity</span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
            >
              <XCircle className="h-6 w-6" />
            </button>
          </div>

          {/* Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Event Details */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Event Details</h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <p className="text-gray-700">{event.description}</p>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-600">Category:</span>
                      <span className="ml-2 capitalize">{event.category}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Status:</span>
                      <span className="ml-2 capitalize">{event.status}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Location:</span>
                      <span className="ml-2">{event.location.name}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Reported:</span>
                      <span className="ml-2">{formatTime(event.timestamp)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* AI Analysis */}
              {event.aiSummary && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">AI Analysis</h3>
                  <div className="bg-blue-50 rounded-lg p-4">
                    <p className="text-blue-800">{event.aiSummary}</p>
                  </div>
                </div>
              )}

              {/* User Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Reporter Information</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                      <User className="h-5 w-5 text-gray-600" />
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{event.userDisplayName}</div>
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Star className="h-4 w-4" />
                        <span className={getTrustScoreColor(event.trustScore)}>
                          Trust Score: {event.trustScore}/100
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-600">Reports:</span>
                      <span className="ml-2">{event.reportCount}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Verifications:</span>
                      <span className="ml-2">{event.verificationCount}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Media */}
              {event.mediaUrls.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Media</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {event.mediaUrls.map((url, index) => (
                      <img
                        key={index}
                        src={url}
                        alt={`Event media ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Sentiment Analysis */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Sentiment Analysis</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center space-x-3 mb-2">
                    {getSentimentIcon(event.sentimentScore)}
                    <span className="font-medium">
                      {event.sentimentScore > 0.2 ? 'Positive' : 
                       event.sentimentScore < -0.2 ? 'Negative' : 'Neutral'}
                    </span>
                    <span className="text-sm text-gray-600">
                      ({(event.sentimentScore * 100).toFixed(0)}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        event.sentimentScore > 0 ? 'bg-green-500' : 
                        event.sentimentScore < 0 ? 'bg-red-500' : 'bg-gray-400'
                      }`}
                      style={{ width: `${Math.abs(event.sentimentScore) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Moderation Notes */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Moderation Notes</h3>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add notes about your moderation decision..."
                  className="w-full h-24 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              {/* Actions */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Moderation Actions</h3>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => {
                      onApprove(event.id, notes);
                      onClose();
                    }}
                    className="flex items-center justify-center space-x-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <CheckCircle className="h-5 w-5" />
                    <span>Approve</span>
                  </button>
                  
                  <button
                    onClick={() => {
                      onFlag(event.id, 'needs_review', notes);
                      onClose();
                    }}
                    className="flex items-center justify-center space-x-2 px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                  >
                    <Flag className="h-5 w-5" />
                    <span>Flag</span>
                  </button>
                  
                  <button
                    onClick={() => {
                      onEdit(event.id, {});
                      onClose();
                    }}
                    className="flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Edit3 className="h-5 w-5" />
                    <span>Edit</span>
                  </button>
                  
                  <button
                    onClick={() => {
                      onReject(event.id, 'inappropriate', notes);
                      onClose();
                    }}
                    className="flex items-center justify-center space-x-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    <XCircle className="h-5 w-5" />
                    <span>Reject</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};