import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Shield, Home } from 'lucide-react';
import { ModeratorPanel } from '../components/ModeratorPanel';
import { mockModeratorEvents } from '../data/mockModeratorEvents';

interface ModeratorDashboardProps {
  onBackToDashboard?: () => void;
}

export const ModeratorDashboard: React.FC<ModeratorDashboardProps> = ({ 
  onBackToDashboard 
}) => {
  const [events, setEvents] = useState(mockModeratorEvents);

  const handleApprove = (eventId: string, notes?: string) => {
    setEvents(prev => prev.map(event => 
      event.id === eventId 
        ? { 
            ...event, 
            moderationStatus: 'approved' as const,
            moderatorNotes: notes,
            lastModerated: new Date(),
            moderatedBy: 'current_moderator'
          }
        : event
    ));
    console.log(`Approved event ${eventId}`, notes);
  };

  const handleFlag = (eventId: string, reason: string, notes?: string) => {
    setEvents(prev => prev.map(event => 
      event.id === eventId 
        ? { 
            ...event, 
            moderationStatus: 'flagged' as const,
            moderatorNotes: `${reason}: ${notes || ''}`,
            lastModerated: new Date(),
            moderatedBy: 'current_moderator'
          }
        : event
    ));
    console.log(`Flagged event ${eventId}`, reason, notes);
  };

  const handleEdit = (eventId: string, updates: any) => {
    setEvents(prev => prev.map(event => 
      event.id === eventId 
        ? { 
            ...event, 
            ...updates,
            lastModerated: new Date(),
            moderatedBy: 'current_moderator'
          }
        : event
    ));
    console.log(`Edited event ${eventId}`, updates);
  };

  const handleReject = (eventId: string, reason: string, notes?: string) => {
    setEvents(prev => prev.map(event => 
      event.id === eventId 
        ? { 
            ...event, 
            moderationStatus: 'rejected' as const,
            moderatorNotes: `${reason}: ${notes || ''}`,
            lastModerated: new Date(),
            moderatedBy: 'current_moderator'
          }
        : event
    ));
    console.log(`Rejected event ${eventId}`, reason, notes);
  };

  return (
    <div className="flex-1 flex flex-col">
      {/* Optional standalone header if not using App.tsx header */}
      {onBackToDashboard && (
        <div className="bg-white shadow-sm border-b border-gray-200 px-4 py-3">
          <div className="flex items-center space-x-4">
            <motion.button
              onClick={onBackToDashboard}
              className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="text-sm font-medium">Back to Dashboard</span>
            </motion.button>
            <div className="h-6 w-px bg-gray-300"></div>
            <div className="flex items-center space-x-2">
              <Shield className="h-6 w-6 text-blue-600" />
              <h1 className="text-xl font-bold text-gray-900">Moderator Dashboard</h1>
            </div>
          </div>
        </div>
      )}

      {/* Moderator Panel */}
      <div className="flex-1">
        <ModeratorPanel
          events={events}
          onApprove={handleApprove}
          onFlag={handleFlag}
          onEdit={handleEdit}
          onReject={handleReject}
        />
      </div>
    </div>
  );
};