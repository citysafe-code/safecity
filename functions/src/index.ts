import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getDistance, getCenterOfBounds } from 'geolib';

admin.initializeApp();

const genAI = new GoogleGenerativeAI(functions.config().gemini.api_key);

interface SocialMediaPost {
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

interface SynthesizedEvent {
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

class DuplicateDetector {
  private readonly LOCATION_THRESHOLD = 500; // meters
  private readonly TIME_THRESHOLD = 3600000; // 1 hour in milliseconds
  private readonly TEXT_SIMILARITY_THRESHOLD = 0.7;

  detectDuplicates(posts: SocialMediaPost[]): string[][] {
    const groups: string[][] = [];
    const processed = new Set<string>();

    for (const post of posts) {
      if (processed.has(post.id)) continue;

      const duplicateGroup = [post.id];
      processed.add(post.id);

      for (const otherPost of posts) {
        if (processed.has(otherPost.id) || post.id === otherPost.id) continue;

        if (this.areDuplicates(post, otherPost)) {
          duplicateGroup.push(otherPost.id);
          processed.add(otherPost.id);
        }
      }

      if (duplicateGroup.length > 1) {
        groups.push(duplicateGroup);
      }
    }

    return groups;
  }

  private areDuplicates(post1: SocialMediaPost, post2: SocialMediaPost): boolean {
    // Time proximity check
    const timeDiff = Math.abs(post1.timestamp.getTime() - post2.timestamp.getTime());
    if (timeDiff > this.TIME_THRESHOLD) return false;

    // Location proximity check (if both have locations)
    if (post1.location && post2.location) {
      const distance = getDistance(
        { latitude: post1.location.latitude, longitude: post1.location.longitude },
        { latitude: post2.location.latitude, longitude: post2.location.longitude }
      );
      if (distance > this.LOCATION_THRESHOLD) return false;
    }

    // Text similarity check
    const similarity = this.calculateTextSimilarity(post1.text, post2.text);
    return similarity >= this.TEXT_SIMILARITY_THRESHOLD;
  }

  private calculateTextSimilarity(text1: string, text2: string): number {
    const words1 = this.normalizeText(text1).split(' ');
    const words2 = this.normalizeText(text2).split(' ');
    
    const set1 = new Set(words1);
    const set2 = new Set(words2);
    
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    
    return intersection.size / union.size;
  }

  private normalizeText(text: string): string {
    return text.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }
}

class LocationInferencer {
  inferCentralLocation(posts: SocialMediaPost[]): {
    latitude: number;
    longitude: number;
    confidence: number;
    radius: number;
  } {
    const locatedPosts = posts.filter(post => post.location);
    
    if (locatedPosts.length === 0) {
      throw new Error('No posts with location data');
    }

    if (locatedPosts.length === 1) {
      return {
        latitude: locatedPosts[0].location!.latitude,
        longitude: locatedPosts[0].location!.longitude,
        confidence: 0.5,
        radius: 1000
      };
    }

    // Calculate center of all locations
    const bounds = locatedPosts.map(post => ({
      latitude: post.location!.latitude,
      longitude: post.location!.longitude
    }));

    const center = getCenterOfBounds(bounds);
    
    // Calculate average distance from center to determine radius
    const distances = bounds.map(point => 
      getDistance(center, point)
    );
    
    const avgDistance = distances.reduce((sum, dist) => sum + dist, 0) / distances.length;
    const maxDistance = Math.max(...distances);
    
    // Higher confidence if posts are clustered closely
    const confidence = Math.max(0.1, 1 - (maxDistance / 5000)); // 5km max for full confidence

    return {
      latitude: center.latitude,
      longitude: center.longitude,
      confidence,
      radius: Math.max(avgDistance * 1.5, 500) // At least 500m radius
    };
  }
}

class GeminiSynthesizer {
  private model = genAI.getGenerativeModel({ model: 'gemini-pro' });

  async synthesizePosts(posts: SocialMediaPost[], duplicateGroups: string[][]): Promise<SynthesizedEvent> {
    const prompt = this.buildPrompt(posts, duplicateGroups);
    
    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      return this.parseGeminiResponse(text, posts, duplicateGroups);
    } catch (error) {
      functions.logger.error('Gemini API error:', error);
      throw new Error('Failed to synthesize posts with Gemini API');
    }
  }

  private buildPrompt(posts: SocialMediaPost[], duplicateGroups: string[][]): string {
    const postSummaries = posts.map((post, index) => 
      `Post ${index + 1} (${post.platform}, ${post.timestamp.toISOString()}): "${post.text}"`
    ).join('\n');

    const duplicateInfo = duplicateGroups.length > 0 
      ? `\nDuplicate groups detected: ${duplicateGroups.map(group => `[${group.join(', ')}]`).join(', ')}`
      : '\nNo duplicates detected.';

    return `
Analyze these ${posts.length} social media posts about a potential city event and provide a structured synthesis:

${postSummaries}
${duplicateInfo}

Please provide a JSON response with the following structure:
{
  "title": "Clear, actionable title (max 80 chars)",
  "summary": "Comprehensive summary of the situation (max 300 chars)",
  "suggestedAction": "Specific recommended action for city officials",
  "eventType": "traffic|power|celebration|emergency|construction|weather",
  "severity": "low|medium|high|critical",
  "confidence": 0.0-1.0,
  "estimatedDuration": "Duration estimate if applicable",
  "keyInsights": ["Key insight 1", "Key insight 2", "Key insight 3"]
}

Consider:
- Frequency and consistency of reports
- Credibility indicators (engagement, detail level)
- Urgency and public safety implications
- Duplicate detection results
- Geographic clustering of reports

Focus on actionable intelligence for city management.
`;
  }

  private parseGeminiResponse(
    response: string, 
    posts: SocialMediaPost[], 
    duplicateGroups: string[][]
  ): SynthesizedEvent {
    try {
      // Extract JSON from response (Gemini sometimes adds extra text)
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in Gemini response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      // Infer location from posts
      const locationInferencer = new LocationInferencer();
      const locationData = locationInferencer.inferCentralLocation(posts);

      return {
        title: parsed.title || 'Synthesized City Event',
        summary: parsed.summary || 'Multiple social media reports detected',
        suggestedAction: parsed.suggestedAction || 'Monitor situation and assess need for response',
        eventType: parsed.eventType || 'emergency',
        severity: parsed.severity || 'medium',
        confidence: Math.min(parsed.confidence || 0.7, locationData.confidence),
        location: {
          latitude: locationData.latitude,
          longitude: locationData.longitude,
          city: 'San Francisco', // This would be geocoded in production
          state: 'CA',
          country: 'USA'
        },
        affectedRadius: locationData.radius,
        estimatedDuration: parsed.estimatedDuration,
        sourcePostIds: posts.map(p => p.id),
        duplicateGroups
      };
    } catch (error) {
      functions.logger.error('Failed to parse Gemini response:', error);
      throw new Error('Invalid response format from Gemini API');
    }
  }
}

// Main Firebase Function for social media synthesis
export const synthesizeSocialPosts = functions.firestore
  .document('socialPostClusters/{clusterId}')
  .onCreate(async (snap, context) => {
    const clusterData = snap.data();
    
    if (!clusterData.posts || clusterData.posts.length < 3) {
      functions.logger.info('Insufficient posts for synthesis');
      return;
    }

    try {
      const posts: SocialMediaPost[] = clusterData.posts;
      
      // Step 1: Detect duplicates
      const duplicateDetector = new DuplicateDetector();
      const duplicateGroups = duplicateDetector.detectDuplicates(posts);
      
      functions.logger.info(`Detected ${duplicateGroups.length} duplicate groups`);

      // Step 2: Synthesize with Gemini
      const synthesizer = new GeminiSynthesizer();
      const synthesizedEvent = await synthesizer.synthesizePosts(posts, duplicateGroups);

      // Step 3: Save to Firestore
      const eventRef = admin.firestore().collection('events').doc();
      
      await eventRef.set({
        id: eventRef.id,
        title: synthesizedEvent.title,
        description: synthesizedEvent.summary,
        eventType: synthesizedEvent.eventType,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        location: synthesizedEvent.location,
        mediaUrls: posts.flatMap(p => p.mediaUrls || []),
        userId: null, // AI-generated
        aiSummary: synthesizedEvent.summary,
        source: 'social',
        sentimentScore: 0, // Would be calculated separately
        severity: synthesizedEvent.severity,
        status: 'active',
        tags: ['social-synthesis', 'ai-generated'],
        verificationCount: 0,
        reportCount: posts.length,
        upvotes: 0,
        downvotes: 0,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        metadata: {
          confidence: synthesizedEvent.confidence,
          processingVersion: 'v2.1.0',
          originalSource: 'social_synthesis',
          relatedEventIds: [],
          synthesisData: {
            sourcePostIds: synthesizedEvent.sourcePostIds,
            duplicateGroups: synthesizedEvent.duplicateGroups,
            suggestedAction: synthesizedEvent.suggestedAction,
            affectedRadius: synthesizedEvent.affectedRadius,
            estimatedDuration: synthesizedEvent.estimatedDuration
          }
        }
      });

      // Step 4: Log processing
      await admin.firestore().collection('aiProcessingLogs').add({
        id: '',
        eventId: eventRef.id,
        processingType: 'social_synthesis',
        inputData: {
          postCount: posts.length,
          duplicateGroups: duplicateGroups.length,
          platforms: [...new Set(posts.map(p => p.platform))]
        },
        outputData: synthesizedEvent,
        confidence: synthesizedEvent.confidence,
        processingTime: Date.now() - clusterData.createdAt.toMillis(),
        modelVersion: 'gemini-pro',
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });

      functions.logger.info(`Successfully synthesized event: ${eventRef.id}`);
      
    } catch (error) {
      functions.logger.error('Error synthesizing social posts:', error);
      
      // Log the error for debugging
      await admin.firestore().collection('aiProcessingLogs').add({
        id: '',
        eventId: 'error',
        processingType: 'social_synthesis_error',
        inputData: { clusterId: context.params.clusterId },
        outputData: { error: error.message },
        confidence: 0,
        processingTime: 0,
        modelVersion: 'gemini-pro',
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });
    }
  });

// Helper function to manually trigger synthesis for testing
export const testSynthesis = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
  }

  const samplePosts: SocialMediaPost[] = [
    {
      id: 'post_1',
      text: 'Major traffic jam on Highway 101 southbound near downtown. Been stuck for 30 minutes!',
      timestamp: new Date(),
      location: { latitude: 37.7749, longitude: -122.4194 },
      platform: 'twitter',
      userId: 'user1',
      engagement: { likes: 5, shares: 2, comments: 3 },
      hashtags: ['traffic', 'highway101'],
      mentions: []
    },
    {
      id: 'post_2',
      text: 'Avoid 101 south! Massive backup due to accident. Taking forever to move.',
      timestamp: new Date(Date.now() - 10 * 60000),
      location: { latitude: 37.7751, longitude: -122.4196 },
      platform: 'facebook',
      userId: 'user2',
      engagement: { likes: 12, shares: 8, comments: 5 },
      hashtags: ['traffic'],
      mentions: []
    },
    {
      id: 'post_3',
      text: 'Highway 101 southbound completely stopped near Market St. Looks like a bad accident.',
      timestamp: new Date(Date.now() - 5 * 60000),
      location: { latitude: 37.7748, longitude: -122.4192 },
      platform: 'nextdoor',
      userId: 'user3',
      engagement: { likes: 8, shares: 4, comments: 7 },
      hashtags: ['accident', 'traffic'],
      mentions: []
    }
  ];

  try {
    const duplicateDetector = new DuplicateDetector();
    const duplicateGroups = duplicateDetector.detectDuplicates(samplePosts);
    
    const synthesizer = new GeminiSynthesizer();
    const result = await synthesizer.synthesizePosts(samplePosts, duplicateGroups);
    
    return { success: true, result, duplicateGroups };
  } catch (error) {
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// Export image analysis functions
export { analyzeUploadedImage, analyzeImageManually } from './imageAnalysis';