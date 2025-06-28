import React, { useState, useEffect } from 'react';
import { ModeratorPanel } from '../components/ModeratorPanel';
import { mockModeratorEvents } from '../data/mockModeratorEvents';

export const ModeratorDashboard: React.FC = () => {
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
    <ModeratorPanel
      events={events}
      onApprove={handleApprove}
      onFlag={handleFlag}
      onEdit={handleEdit}
      onReject={handleReject}
    />
  );
};