export interface SocialMediaPost {
  id: string;
  text: string;
  timestamp: Date;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  platform: 'twitter' | 'facebook' | 'instagram' | 'nextdoor' | 'reddit';
  userId: string;
  engagement: {
    likes: number;
    shares: number;
    comments: number;
  };
  mediaUrls?: string[];
  hashtags: string[];
  mentions: string[];
}

export interface SynthesizedEvent {
  title: string;
  summary: string;
  suggestedAction: string;
  eventType: 'traffic' | 'power' | 'celebration' | 'emergency' | 'construction' | 'weather';
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  location: {
    latitude: number;
    longitude: number;
    address?: string;
    neighborhood?: string;
    city: string;
    state: string;
    country: string;
  };
  affectedRadius: number;
  estimatedDuration?: string;
  sourcePostIds: string[];
  duplicateGroups: string[][];
}

export interface PostCluster {
  id: string;
  posts: SocialMediaPost[];
  createdAt: Date;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  keywords: string[];
  locationBounds?: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
}