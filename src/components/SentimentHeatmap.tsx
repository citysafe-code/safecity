import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ThumbsUp, 
  ThumbsDown, 
  Minus, 
  TrendingUp, 
  TrendingDown, 
  Activity,
  MapPin,
  Clock,
  Users,
  MessageSquare,
  BarChart3,
  Filter,
  RefreshCw
} from 'lucide-react';

interface SentimentData {
  id: string;
  area: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  sentiment: {
    score: number; // -1 to 1
    classification: 'positive' | 'neutral' | 'negative';
    confidence: number;
  };
  reportCount: number;
  lastUpdated: Date;
  topKeywords: string[];
  moodSummary: string;
  trendDirection: 'up' | 'down' | 'stable';
  sources: {
    social: number;
    userReports: number;
    civic: number;
  };
}

interface HeatmapProps {
  className?: string;
  onAreaSelect?: (area: SentimentData) => void;
}

export const SentimentHeatmap: React.FC<HeatmapProps> = ({ 
  className = '', 
  onAreaSelect 
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [sentimentData, setSentimentData] = useState<SentimentData[]>([]);
  const [selectedArea, setSelectedArea] = useState<SentimentData | null>(null);
  const [hoverArea, setHoverArea] = useState<SentimentData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    sentiment: 'all',
    minReports: 0,
    timeRange: '24h'
  });

  // Mock sentiment data - in production, this would come from Firebase/Gemini API
  useEffect(() => {
    const mockData: SentimentData[] = [
      {
        id: 'area_001',
        area: 'Mission District',
        coordinates: { lat: 37.7599, lng: -122.4148 },
        bounds: { north: 37.7650, south: 37.7548, east: -122.4100, west: -122.4196 },
        sentiment: { score: 0.7, classification: 'positive', confidence: 0.85 },
        reportCount: 45,
        lastUpdated: new Date(Date.now() - 15 * 60000),
        topKeywords: ['festival', 'community', 'art', 'celebration'],
        moodSummary: 'Vibrant community energy with ongoing street festival and positive local events',
        trendDirection: 'up',
        sources: { social: 28, userReports: 12, civic: 5 }
      },
      {
        id: 'area_002',
        area: 'SOMA District',
        coordinates: { lat: 37.7849, lng: -122.4094 },
        bounds: { north: 37.7900, south: 37.7798, east: -122.4046, west: -122.4142 },
        sentiment: { score: -0.6, classification: 'negative', confidence: 0.92 },
        reportCount: 67,
        lastUpdated: new Date(Date.now() - 8 * 60000),
        topKeywords: ['traffic', 'construction', 'delays', 'frustration'],
        moodSummary: 'High frustration due to ongoing construction and traffic congestion',
        trendDirection: 'down',
        sources: { social: 42, userReports: 18, civic: 7 }
      },
      {
        id: 'area_003',
        area: 'Financial District',
        coordinates: { lat: 37.7946, lng: -122.4014 },
        bounds: { north: 37.7980, south: 37.7912, east: -122.3966, west: -122.4062 },
        sentiment: { score: 0.1, classification: 'neutral', confidence: 0.78 },
        reportCount: 23,
        lastUpdated: new Date(Date.now() - 25 * 60000),
        topKeywords: ['business', 'lunch', 'meetings', 'routine'],
        moodSummary: 'Typical business day atmosphere with standard activity levels',
        trendDirection: 'stable',
        sources: { social: 15, userReports: 6, civic: 2 }
      },
      {
        id: 'area_004',
        area: 'Castro District',
        coordinates: { lat: 37.7609, lng: -122.4350 },
        bounds: { north: 37.7660, south: 37.7558, east: -122.4302, west: -122.4398 },
        sentiment: { score: 0.8, classification: 'positive', confidence: 0.89 },
        reportCount: 34,
        lastUpdated: new Date(Date.now() - 12 * 60000),
        topKeywords: ['pride', 'community', 'support', 'celebration'],
        moodSummary: 'Strong community spirit and positive social engagement',
        trendDirection: 'up',
        sources: { social: 22, userReports: 8, civic: 4 }
      },
      {
        id: 'area_005',
        area: 'Chinatown',
        coordinates: { lat: 37.7941, lng: -122.4078 },
        bounds: { north: 37.7975, south: 37.7907, east: -122.4030, west: -122.4126 },
        sentiment: { score: 0.4, classification: 'positive', confidence: 0.81 },
        reportCount: 29,
        lastUpdated: new Date(Date.now() - 20 * 60000),
        topKeywords: ['food', 'culture', 'tourism', 'busy'],
        moodSummary: 'Bustling cultural activity with positive visitor experiences',
        trendDirection: 'stable',
        sources: { social: 19, userReports: 7, civic: 3 }
      },
      {
        id: 'area_006',
        area: 'Tenderloin',
        coordinates: { lat: 37.7837, lng: -122.4130 },
        bounds: { north: 37.7871, south: 37.7803, east: -122.4082, west: -122.4178 },
        sentiment: { score: -0.4, classification: 'negative', confidence: 0.87 },
        reportCount: 52,
        lastUpdated: new Date(Date.now() - 18 * 60000),
        topKeywords: ['safety', 'concerns', 'homeless', 'issues'],
        moodSummary: 'Ongoing safety and social concerns affecting community sentiment',
        trendDirection: 'down',
        sources: { social: 31, userReports: 16, civic: 5 }
      }
    ];

    setTimeout(() => {
      setSentimentData(mockData);
      setIsLoading(false);
    }, 1000);
  }, []);

  const getSentimentColor = (sentiment: SentimentData['sentiment']) => {
    const { score, classification } = sentiment;
    
    switch (classification) {
      case 'positive':
        return score > 0.5 ? '#10B981' : '#34D399'; // Green shades
      case 'negative':
        return score < -0.5 ? '#EF4444' : '#F87171'; // Red shades
      default:
        return '#6B7280'; // Gray for neutral
    }
  };

  const getSentimentOpacity = (reportCount: number, confidence: number) => {
    const baseOpacity = Math.min(reportCount / 50, 1) * 0.7; // Max 70% opacity
    return baseOpacity * confidence;
  };

  const getSentimentIcon = (classification: string, trendDirection: string) => {
    if (classification === 'positive') {
      return trendDirection === 'up' ? <TrendingUp className="h-4 w-4" /> : <ThumbsUp className="h-4 w-4" />;
    } else if (classification === 'negative') {
      return trendDirection === 'down' ? <TrendingDown className="h-4 w-4" /> : <ThumbsDown className="h-4 w-4" />;
    }
    return <Minus className="h-4 w-4" />;
  };

  const formatTime = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  const refreshData = () => {
    setIsLoading(true);
    setLastUpdate(new Date());
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  };

  const filteredData = sentimentData.filter(area => {
    if (filters.sentiment !== 'all' && area.sentiment.classification !== filters.sentiment) {
      return false;
    }
    if (area.reportCount < filters.minReports) {
      return false;
    }
    return true;
  });

  return (
    <div className={`relative ${className}`}>
      {/* Controls */}
      <div className="absolute top-4 left-4 z-10 space-y-2">
        <div className="bg-white rounded-lg shadow-lg p-3">
          <div className="flex items-center space-x-3 mb-2">
            <Activity className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold text-gray-900">Live Sentiment</h3>
            <button
              onClick={refreshData}
              className="p-1 rounded hover:bg-gray-100"
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 text-gray-600 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
          
          <div className="text-xs text-gray-600 mb-3">
            Last updated: {formatTime(lastUpdate)}
          </div>

          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-sm">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span>Positive</span>
              <span className="text-gray-500">
                ({filteredData.filter(a => a.sentiment.classification === 'positive').length})
              </span>
            </div>
            <div className="flex items-center space-x-2 text-sm">
              <div className="w-3 h-3 rounded-full bg-gray-500"></div>
              <span>Neutral</span>
              <span className="text-gray-500">
                ({filteredData.filter(a => a.sentiment.classification === 'neutral').length})
              </span>
            </div>
            <div className="flex items-center space-x-2 text-sm">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span>Negative</span>
              <span className="text-gray-500">
                ({filteredData.filter(a => a.sentiment.classification === 'negative').length})
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={() => setShowFilters(!showFilters)}
          className="bg-white rounded-lg shadow-lg p-3 flex items-center space-x-2 hover:bg-gray-50"
        >
          <Filter className="h-4 w-4 text-gray-600" />
          <span className="text-sm font-medium">Filters</span>
        </button>

        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-white rounded-lg shadow-lg p-3 space-y-3"
            >
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Sentiment
                </label>
                <select
                  value={filters.sentiment}
                  onChange={(e) => setFilters({ ...filters, sentiment: e.target.value })}
                  className="w-full text-sm border border-gray-300 rounded px-2 py-1"
                >
                  <option value="all">All</option>
                  <option value="positive">Positive</option>
                  <option value="neutral">Neutral</option>
                  <option value="negative">Negative</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Min Reports: {filters.minReports}
                </label>
                <input
                  type="range"
                  min="0"
                  max="50"
                  value={filters.minReports}
                  onChange={(e) => setFilters({ ...filters, minReports: parseInt(e.target.value) })}
                  className="w-full"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Map Container */}
      <div
        ref={mapRef}
        className="w-full h-full bg-gradient-to-br from-blue-50 to-green-50 relative overflow-hidden"
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
        {/* Street Grid */}
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

        {/* Sentiment Heatmap Overlays */}
        {filteredData.map((area, index) => (
          <motion.div
            key={area.id}
            className="absolute cursor-pointer"
            style={{
              left: `${15 + (index * 12) % 70}%`,
              top: `${15 + (index * 15) % 70}%`,
              width: '120px',
              height: '80px',
            }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            onMouseEnter={() => setHoverArea(area)}
            onMouseLeave={() => setHoverArea(null)}
            onClick={() => {
              setSelectedArea(area);
              onAreaSelect?.(area);
            }}
          >
            {/* Heatmap Area */}
            <div
              className="w-full h-full rounded-lg border-2 border-white shadow-lg"
              style={{
                backgroundColor: getSentimentColor(area.sentiment),
                opacity: getSentimentOpacity(area.reportCount, area.sentiment.confidence)
              }}
            >
              {/* Area Label */}
              <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-white rounded px-2 py-1 shadow-sm">
                <span className="text-xs font-medium text-gray-800">{area.area}</span>
              </div>

              {/* Sentiment Indicator */}
              <div className="absolute top-2 right-2 bg-white rounded-full p-1 shadow-sm">
                <div className={`text-${area.sentiment.classification === 'positive' ? 'green' : area.sentiment.classification === 'negative' ? 'red' : 'gray'}-600`}>
                  {getSentimentIcon(area.sentiment.classification, area.trendDirection)}
                </div>
              </div>

              {/* Report Count */}
              <div className="absolute bottom-2 left-2 bg-white rounded px-2 py-1 shadow-sm">
                <span className="text-xs font-bold text-gray-800">{area.reportCount}</span>
              </div>
            </div>
          </motion.div>
        ))}

        {/* Hover Tooltip */}
        <AnimatePresence>
          {hoverArea && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="absolute z-20 bg-white rounded-lg shadow-xl p-4 max-w-sm pointer-events-none"
              style={{
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%)'
              }}
            >
              <div className="flex items-center space-x-3 mb-3">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: getSentimentColor(hoverArea.sentiment) }}
                ></div>
                <h4 className="font-semibold text-gray-900">{hoverArea.area}</h4>
                <div className={`text-${hoverArea.sentiment.classification === 'positive' ? 'green' : hoverArea.sentiment.classification === 'negative' ? 'red' : 'gray'}-600`}>
                  {getSentimentIcon(hoverArea.sentiment.classification, hoverArea.trendDirection)}
                </div>
              </div>

              <p className="text-sm text-gray-700 mb-3">{hoverArea.moodSummary}</p>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="font-medium text-gray-600">Sentiment:</span>
                  <div className="capitalize text-gray-800">
                    {hoverArea.sentiment.classification} ({(hoverArea.sentiment.score * 100).toFixed(0)}%)
                  </div>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Confidence:</span>
                  <div className="text-gray-800">
                    {(hoverArea.sentiment.confidence * 100).toFixed(0)}%
                  </div>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Reports:</span>
                  <div className="text-gray-800">{hoverArea.reportCount}</div>
                </div>
                <div>
                  <span className="font-medium text-gray-600">Updated:</span>
                  <div className="text-gray-800">{formatTime(hoverArea.lastUpdated)}</div>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-gray-200">
                <div className="flex items-center space-x-4 text-xs text-gray-600">
                  <span>📱 {hoverArea.sources.social}</span>
                  <span>👤 {hoverArea.sources.userReports}</span>
                  <span>🏛️ {hoverArea.sources.civic}</span>
                </div>
              </div>

              <div className="mt-2">
                <div className="flex flex-wrap gap-1">
                  {hoverArea.topKeywords.slice(0, 4).map((keyword, i) => (
                    <span
                      key={i}
                      className="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-30">
            <div className="text-center">
              <RefreshCw className="h-8 w-8 text-blue-600 animate-spin mx-auto mb-2" />
              <p className="text-gray-600">Analyzing sentiment data...</p>
            </div>
          </div>
        )}
      </div>

      {/* Selected Area Detail Panel */}
      <AnimatePresence>
        {selectedArea && (
          <motion.div
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            className="absolute top-4 right-4 bg-white rounded-lg shadow-xl p-4 w-80 z-20"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">{selectedArea.area}</h3>
              <button
                onClick={() => setSelectedArea(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              {/* Sentiment Overview */}
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center space-x-3 mb-2">
                  <div
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: getSentimentColor(selectedArea.sentiment) }}
                  ></div>
                  <span className="font-medium capitalize">
                    {selectedArea.sentiment.classification} Sentiment
                  </span>
                  <div className={`text-${selectedArea.sentiment.classification === 'positive' ? 'green' : selectedArea.sentiment.classification === 'negative' ? 'red' : 'gray'}-600`}>
                    {getSentimentIcon(selectedArea.sentiment.classification, selectedArea.trendDirection)}
                  </div>
                </div>
                <p className="text-sm text-gray-700">{selectedArea.moodSummary}</p>
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-lg font-bold text-blue-900">
                    {(selectedArea.sentiment.score * 100).toFixed(0)}%
                  </div>
                  <div className="text-xs text-blue-600">Sentiment Score</div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-lg font-bold text-green-900">
                    {(selectedArea.sentiment.confidence * 100).toFixed(0)}%
                  </div>
                  <div className="text-xs text-green-600">Confidence</div>
                </div>
              </div>

              {/* Sources Breakdown */}
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Data Sources</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center space-x-2">
                      <MessageSquare className="h-4 w-4 text-blue-600" />
                      <span>Social Media</span>
                    </span>
                    <span className="font-medium">{selectedArea.sources.social}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center space-x-2">
                      <Users className="h-4 w-4 text-green-600" />
                      <span>User Reports</span>
                    </span>
                    <span className="font-medium">{selectedArea.sources.userReports}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center space-x-2">
                      <BarChart3 className="h-4 w-4 text-purple-600" />
                      <span>Civic Data</span>
                    </span>
                    <span className="font-medium">{selectedArea.sources.civic}</span>
                  </div>
                </div>
              </div>

              {/* Keywords */}
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Trending Keywords</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedArea.topKeywords.map((keyword, i) => (
                    <span
                      key={i}
                      className="inline-block bg-gray-100 text-gray-700 text-sm px-3 py-1 rounded-full"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>

              {/* Last Updated */}
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Clock className="h-4 w-4" />
                <span>Updated {formatTime(selectedArea.lastUpdated)}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};