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

export const mockModeratorEvents: ModeratorEvent[] = [
  {
    id: '1',
    title: 'Major Traffic Accident on Highway 101',
    description: 'Multi-vehicle collision blocking two lanes during rush hour. Emergency services on scene.',
    category: 'traffic',
    severity: 'high',
    location: {
      name: 'Highway 101 & Market St',
      coordinates: { lat: 37.7749, lng: -122.4194 }
    },
    timestamp: new Date(Date.now() - 30 * 60000),
    status: 'active',
    trustScore: 85,
    userDisplayName: 'Sarah Chen',
    aiSummary: 'High-confidence traffic incident report with multiple corroborating sources. Immediate response recommended.',
    sentimentScore: -0.8,
    mediaUrls: [
      'https://images.pexels.com/photos/2449452/pexels-photo-2449452.jpeg',
      'https://images.pexels.com/photos/1545743/pexels-photo-1545743.jpeg'
    ],
    verificationCount: 12,
    reportCount: 8,
    moderationStatus: 'pending'
  },
  {
    id: '2',
    title: 'Street Festival Setup in Mission District',
    description: 'Community organizing annual cultural festival with street closures expected this weekend.',
    category: 'celebration',
    severity: 'low',
    location: {
      name: 'Mission District - 24th Street',
      coordinates: { lat: 37.7599, lng: -122.4148 }
    },
    timestamp: new Date(Date.now() - 2 * 60 * 60000),
    status: 'active',
    trustScore: 92,
    userDisplayName: 'Maria Rodriguez',
    aiSummary: 'Positive community event with high engagement. Recommend coordination with traffic management.',
    sentimentScore: 0.7,
    mediaUrls: [
      'https://images.pexels.com/photos/1190298/pexels-photo-1190298.jpeg',
      'https://images.pexels.com/photos/2747449/pexels-photo-2747449.jpeg',
      'https://images.pexels.com/photos/1105666/pexels-photo-1105666.jpeg'
    ],
    verificationCount: 6,
    reportCount: 3,
    moderationStatus: 'approved',
    moderatorNotes: 'Verified with city events calendar. Approved for public visibility.',
    lastModerated: new Date(Date.now() - 60 * 60000),
    moderatedBy: 'admin_jane'
  },
  {
    id: '3',
    title: 'Suspicious Activity Near City Hall',
    description: 'Unattended package reported near main entrance. Security has been notified.',
    category: 'civic',
    severity: 'high',
    location: {
      name: 'City Hall Main Entrance',
      coordinates: { lat: 37.7793, lng: -122.4193 }
    },
    timestamp: new Date(Date.now() - 45 * 60000),
    status: 'monitoring',
    trustScore: 45,
    userDisplayName: 'Anonymous User',
    aiSummary: 'Security concern requiring immediate verification. Low trust score user - manual review recommended.',
    sentimentScore: -0.6,
    mediaUrls: [
      'https://images.pexels.com/photos/2599244/pexels-photo-2599244.jpeg'
    ],
    verificationCount: 2,
    reportCount: 1,
    moderationStatus: 'flagged',
    moderatorNotes: 'Flagged for security review due to low trust score and sensitive location.',
    lastModerated: new Date(Date.now() - 30 * 60000),
    moderatedBy: 'admin_mike'
  },
  {
    id: '4',
    title: 'Water Main Break on 3rd Street',
    description: 'Large water leak causing street flooding and potential service disruption to nearby buildings.',
    category: 'civic',
    severity: 'high',
    location: {
      name: '3rd Street & Mission St',
      coordinates: { lat: 37.7853, lng: -122.4005 }
    },
    timestamp: new Date(Date.now() - 90 * 60000),
    status: 'monitoring',
    trustScore: 78,
    userDisplayName: 'David Kim',
    aiSummary: 'Infrastructure emergency confirmed by multiple sources. Public works department notified.',
    sentimentScore: -0.5,
    mediaUrls: [
      'https://images.pexels.com/photos/2448749/pexels-photo-2448749.jpeg',
      'https://images.pexels.com/photos/1108572/pexels-photo-1108572.jpeg'
    ],
    verificationCount: 15,
    reportCount: 12,
    moderationStatus: 'approved'
  },
  {
    id: '5',
    title: 'Food Truck Rally at Golden Gate Park',
    description: 'Weekly food truck gathering with live music and family activities.',
    category: 'celebration',
    severity: 'low',
    location: {
      name: 'Golden Gate Park - Music Concourse',
      coordinates: { lat: 37.7694, lng: -122.4862 }
    },
    timestamp: new Date(Date.now() - 4 * 60 * 60000),
    status: 'active',
    trustScore: 88,
    userDisplayName: 'Jennifer Park',
    aiSummary: 'Regular community event with positive sentiment. No issues detected.',
    sentimentScore: 0.8,
    mediaUrls: [
      'https://images.pexels.com/photos/1267320/pexels-photo-1267320.jpeg',
      'https://images.pexels.com/photos/2696064/pexels-photo-2696064.jpeg'
    ],
    verificationCount: 8,
    reportCount: 4,
    moderationStatus: 'approved'
  },
  {
    id: '6',
    title: 'Inappropriate Content Test',
    description: 'This is a test report with potentially inappropriate content that should be flagged.',
    category: 'civic',
    severity: 'medium',
    location: {
      name: 'Test Location',
      coordinates: { lat: 37.7749, lng: -122.4194 }
    },
    timestamp: new Date(Date.now() - 15 * 60000),
    status: 'active',
    trustScore: 25,
    userDisplayName: 'Test User',
    aiSummary: 'Content flagged by AI moderation system for manual review.',
    sentimentScore: -0.9,
    mediaUrls: [],
    verificationCount: 0,
    reportCount: 1,
    moderationStatus: 'rejected',
    moderatorNotes: 'Rejected due to inappropriate content and low trust score.',
    lastModerated: new Date(Date.now() - 10 * 60000),
    moderatedBy: 'admin_sarah'
  },
  {
    id: '7',
    title: 'Construction Work on Van Ness Avenue',
    description: 'Scheduled road maintenance causing lane restrictions and minor delays.',
    category: 'civic',
    severity: 'medium',
    location: {
      name: 'Van Ness Avenue & Bush St',
      coordinates: { lat: 37.7849, lng: -122.4194 }
    },
    timestamp: new Date(Date.now() - 6 * 60 * 60000),
    status: 'monitoring',
    trustScore: 72,
    userDisplayName: 'Robert Johnson',
    aiSummary: 'Planned infrastructure work. Duration and impact within expected parameters.',
    sentimentScore: -0.3,
    mediaUrls: [
      'https://images.pexels.com/photos/1216589/pexels-photo-1216589.jpeg'
    ],
    verificationCount: 5,
    reportCount: 7,
    moderationStatus: 'pending'
  },
  {
    id: '8',
    title: 'Community Garden Opening Celebration',
    description: 'New community garden opening with ribbon cutting ceremony and neighborhood gathering.',
    category: 'celebration',
    severity: 'low',
    location: {
      name: 'Dolores Park Community Garden',
      coordinates: { lat: 37.7596, lng: -122.4269 }
    },
    timestamp: new Date(Date.now() - 8 * 60 * 60000),
    status: 'active',
    trustScore: 95,
    userDisplayName: 'Lisa Thompson',
    aiSummary: 'Positive community development event. High engagement and positive sentiment.',
    sentimentScore: 0.9,
    mediaUrls: [
      'https://images.pexels.com/photos/1105666/pexels-photo-1105666.jpeg',
      'https://images.pexels.com/photos/2747449/pexels-photo-2747449.jpeg'
    ],
    verificationCount: 10,
    reportCount: 2,
    moderationStatus: 'approved'
  }
];