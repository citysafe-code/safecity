import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  onSnapshot,
  serverTimestamp,
  GeoPoint,
  Timestamp
} from 'firebase/firestore';
import { db } from './config';
import { CityEvent } from '../types';

// Type definitions for Firestore documents
export interface FirestoreEvent {
  id: string;
  title: string;
  description: string;
  eventType: 'traffic' | 'power' | 'celebration' | 'emergency' | 'construction' | 'weather';
  timestamp: Timestamp;
  location: {
    latitude: number;
    longitude: number;
    address?: string;
    neighborhood?: string;
    city: string;
    state: string;
    country: string;
  };
  mediaUrls: string[];
  userId?: string;
  aiSummary?: string;
  source: 'user' | 'social' | 'civic' | 'ai' | 'sensor';
  sentimentScore: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'active' | 'resolved' | 'monitoring' | 'verified';
  tags: string[];
  verificationCount: number;
  reportCount: number;
  upvotes: number;
  downvotes: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  expiresAt?: Timestamp;
  metadata: {
    confidence?: number;
    processingVersion?: string;
    originalSource?: string;
    relatedEventIds?: string[];
  };
}

export interface FirestoreUser {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string;
  trustScore: number;
  locationSubscriptions: LocationSubscription[];
  reportingHistory: ReportingSummary;
  preferences: UserPreferences;
  verificationLevel: 'unverified' | 'email' | 'phone' | 'identity' | 'trusted';
  badges: string[];
  createdAt: Timestamp;
  lastActiveAt: Timestamp;
  isActive: boolean;
  moderationFlags: number;
  contributionStats: ContributionStats;
}

export interface LocationSubscription {
  id: string;
  name: string;
  center: GeoPoint;
  radius: number;
  eventTypes: string[];
  notificationEnabled: boolean;
  createdAt: Timestamp;
}

export interface ReportingSummary {
  totalReports: number;
  verifiedReports: number;
  falseReports: number;
  lastReportDate?: Timestamp;
  averageAccuracy: number;
  reportsByCategory: Record<string, number>;
}

export interface UserPreferences {
  notifications: {
    push: boolean;
    email: boolean;
    sms: boolean;
    frequency: 'immediate' | 'hourly' | 'daily';
  };
  privacy: {
    shareLocation: boolean;
    publicProfile: boolean;
    showInLeaderboard: boolean;
  };
  filters: {
    defaultRadius: number;
    hiddenEventTypes: string[];
    minimumSeverity: string;
  };
}

export interface ContributionStats {
  eventsReported: number;
  eventsVerified: number;
  mediaUploaded: number;
  helpfulVotes: number;
  streakDays: number;
  lastContribution: Timestamp;
}

// Events collection functions
export const eventsCollection = collection(db, 'events');

export const getEvents = async (): Promise<CityEvent[]> => {
  try {
    const q = query(
      eventsCollection,
      orderBy('timestamp', 'desc'),
      limit(50)
    );
    
    const querySnapshot = await getDocs(q);
    const events: CityEvent[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data() as FirestoreEvent;
      events.push(convertFirestoreEventToCityEvent(data));
    });
    
    return events;
  } catch (error) {
    console.error('Error fetching events:', error);
    return [];
  }
};

export const getEventsByLocation = async (
  latitude: number,
  longitude: number,
  radiusKm: number = 10
): Promise<CityEvent[]> => {
  try {
    // Note: For production, you'd want to use a geohash or similar for efficient geo queries
    const q = query(
      eventsCollection,
      where('status', '==', 'active'),
      orderBy('timestamp', 'desc'),
      limit(100)
    );
    
    const querySnapshot = await getDocs(q);
    const events: CityEvent[] = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data() as FirestoreEvent;
      const event = convertFirestoreEventToCityEvent(data);
      
      // Simple distance calculation (for production, use proper geo libraries)
      const distance = calculateDistance(
        latitude,
        longitude,
        event.location.coordinates.lat,
        event.location.coordinates.lng
      );
      
      if (distance <= radiusKm) {
        events.push(event);
      }
    });
    
    return events;
  } catch (error) {
    console.error('Error fetching events by location:', error);
    return [];
  }
};

export const addEvent = async (event: Omit<FirestoreEvent, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  try {
    const docRef = await addDoc(eventsCollection, {
      ...event,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    
    return docRef.id;
  } catch (error) {
    console.error('Error adding event:', error);
    throw error;
  }
};

export const updateEvent = async (eventId: string, updates: Partial<FirestoreEvent>): Promise<void> => {
  try {
    const eventRef = doc(db, 'events', eventId);
    await updateDoc(eventRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating event:', error);
    throw error;
  }
};

export const deleteEvent = async (eventId: string): Promise<void> => {
  try {
    const eventRef = doc(db, 'events', eventId);
    await deleteDoc(eventRef);
  } catch (error) {
    console.error('Error deleting event:', error);
    throw error;
  }
};

// Real-time event subscription
export const subscribeToEvents = (
  callback: (events: CityEvent[]) => void,
  filters?: {
    eventType?: string;
    severity?: string;
    status?: string;
  }
) => {
  let q = query(
    eventsCollection,
    orderBy('timestamp', 'desc'),
    limit(50)
  );
  
  // Apply filters if provided
  if (filters?.eventType) {
    q = query(q, where('eventType', '==', filters.eventType));
  }
  if (filters?.severity) {
    q = query(q, where('severity', '==', filters.severity));
  }
  if (filters?.status) {
    q = query(q, where('status', '==', filters.status));
  }
  
  return onSnapshot(q, (querySnapshot) => {
    const events: CityEvent[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data() as FirestoreEvent;
      events.push(convertFirestoreEventToCityEvent(data));
    });
    callback(events);
  }, (error) => {
    console.error('Error in events subscription:', error);
  });
};

// Users collection functions
export const usersCollection = collection(db, 'users');

export const getUser = async (userId: string): Promise<FirestoreUser | null> => {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      return { id: userSnap.id, ...userSnap.data() } as FirestoreUser;
    }
    return null;
  } catch (error) {
    console.error('Error fetching user:', error);
    return null;
  }
};

export const createUser = async (userId: string, userData: Omit<FirestoreUser, 'id' | 'createdAt' | 'lastActiveAt'>): Promise<void> => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      ...userData,
      createdAt: serverTimestamp(),
      lastActiveAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
};

export const updateUser = async (userId: string, updates: Partial<FirestoreUser>): Promise<void> => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      ...updates,
      lastActiveAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
};

// Sentiment heatmap functions
export const sentimentHeatmapCollection = collection(db, 'sentimentHeatmap');

export const getSentimentHeatmap = async () => {
  try {
    const querySnapshot = await getDocs(sentimentHeatmapCollection);
    const heatmapData: any[] = [];
    
    querySnapshot.forEach((doc) => {
      heatmapData.push({ id: doc.id, ...doc.data() });
    });
    
    return heatmapData;
  } catch (error) {
    console.error('Error fetching sentiment heatmap:', error);
    return [];
  }
};

export const subscribeToSentimentHeatmap = (callback: (data: any[]) => void) => {
  return onSnapshot(sentimentHeatmapCollection, (querySnapshot) => {
    const heatmapData: any[] = [];
    querySnapshot.forEach((doc) => {
      heatmapData.push({ id: doc.id, ...doc.data() });
    });
    callback(heatmapData);
  }, (error) => {
    console.error('Error in sentiment heatmap subscription:', error);
  });
};

// Utility functions
const convertFirestoreEventToCityEvent = (firestoreEvent: FirestoreEvent): CityEvent => {
  return {
    id: firestoreEvent.id,
    title: firestoreEvent.title,
    description: firestoreEvent.description,
    category: mapEventTypeToCategory(firestoreEvent.eventType),
    severity: firestoreEvent.severity,
    location: {
      name: firestoreEvent.location.address || `${firestoreEvent.location.city}, ${firestoreEvent.location.state}`,
      coordinates: {
        lat: firestoreEvent.location.latitude,
        lng: firestoreEvent.location.longitude
      }
    },
    timestamp: firestoreEvent.timestamp.toDate(),
    status: firestoreEvent.status
  };
};

const mapEventTypeToCategory = (eventType: string): 'traffic' | 'civic' | 'celebration' => {
  switch (eventType) {
    case 'traffic':
      return 'traffic';
    case 'celebration':
      return 'celebration';
    default:
      return 'civic';
  }
};

const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};