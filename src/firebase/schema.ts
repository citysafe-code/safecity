// Firebase Firestore Schema for City Data App
// This file defines the TypeScript interfaces for all Firestore collections

export interface CityEvent {
  id: string;
  title: string;
  description: string;
  eventType: 'traffic' | 'power' | 'celebration' | 'emergency' | 'construction' | 'weather';
  timestamp: Date;
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
  userId?: string; // null for AI-generated events
  aiSummary?: string;
  source: 'user' | 'social' | 'civic' | 'ai' | 'sensor';
  sentimentScore: number; // -1 to 1 scale
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'active' | 'resolved' | 'monitoring' | 'verified';
  tags: string[];
  verificationCount: number;
  reportCount: number;
  upvotes: number;
  downvotes: number;
  createdAt: Date;
  updatedAt: Date;
  expiresAt?: Date;
  metadata: {
    confidence?: number; // AI confidence score 0-1
    processingVersion?: string;
    originalSource?: string;
    relatedEventIds?: string[];
  };
}

export interface User {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string;
  trustScore: number; // 0-100 scale
  locationSubscriptions: LocationSubscription[];
  reportingHistory: ReportingSummary;
  preferences: UserPreferences;
  verificationLevel: 'unverified' | 'email' | 'phone' | 'identity' | 'trusted';
  badges: string[];
  createdAt: Date;
  lastActiveAt: Date;
  isActive: boolean;
  moderationFlags: number;
  contributionStats: ContributionStats;
}

export interface LocationSubscription {
  id: string;
  name: string;
  center: {
    latitude: number;
    longitude: number;
  };
  radius: number; // in meters
  eventTypes: string[];
  notificationEnabled: boolean;
  createdAt: Date;
}

export interface ReportingSummary {
  totalReports: number;
  verifiedReports: number;
  falseReports: number;
  lastReportDate?: Date;
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
  lastContribution: Date;
}

export interface EventVerification {
  id: string;
  eventId: string;
  userId: string;
  verificationType: 'confirm' | 'deny' | 'update' | 'media';
  timestamp: Date;
  confidence: number;
  notes?: string;
  mediaUrls?: string[];
}

export interface Notification {
  id: string;
  userId: string;
  eventId: string;
  type: 'new_event' | 'event_update' | 'verification_request' | 'trust_score_change';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
  expiresAt?: Date;
  actionUrl?: string;
}

export interface AIProcessingLog {
  id: string;
  eventId: string;
  processingType: 'sentiment_analysis' | 'content_moderation' | 'duplicate_detection' | 'location_verification';
  inputData: any;
  outputData: any;
  confidence: number;
  processingTime: number;
  modelVersion: string;
  timestamp: Date;
}