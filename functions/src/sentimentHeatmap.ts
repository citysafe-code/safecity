import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getDistance, getCenterOfBounds } from 'geolib';

const genAI = new GoogleGenerativeAI(functions.config().gemini.api_key);

interface SocialPost {
  id: string;
  text: string;
  timestamp: Date;
  location?: {
    latitude: number;
    longitude: number;
  };
  platform: string;
  engagement: {
    likes: number;
    shares: number;
    comments: number;
  };
}

interface UserReport {
  id: string;
  title: string;
  description: string;
  location: {
    latitude: number;
    longitude: number;
  };
  timestamp: Date;
  category: string;
}

interface AreaSentiment {
  area: string;
  coordinates: { lat: number; lng: number };
  bounds: { north: number; south: number; east: number; west: number };
  sentiment: {
    score: number;
    classification: 'positive' | 'neutral' | 'negative';
    confidence: number;
    keywords: string[];
    summary: string;
  };
  reportCount: number;
  sources: {
    social: number;
    userReports: number;
    civic: number;
  };
  lastUpdated: Date;
  trendDirection: 'up' | 'down' | 'stable';
}

class SentimentAnalyzer {
  private model = genAI.getGenerativeModel({ model: 'gemini-pro' });

  async analyzeCombinedSentiment(
    socialPosts: SocialPost[],
    userReports: UserReport[],
    area: string
  ): Promise<AreaSentiment['sentiment']> {
    
    const socialText = socialPosts.map(post => post.text).join('\n');
    const reportText = userReports.map(report => 
      `${report.title}: ${report.description}`
    ).join('\n');

    const prompt = `
Analyze the overall sentiment for ${area} based on social media posts and citizen reports:

Social Media Posts:
${socialText}

Citizen Reports:
${reportText}

Provide a JSON response with:
{
  "score": -1 to 1 (negative to positive),
  "classification": "positive|neutral|negative", 
  "confidence": 0 to 1,
  "keywords": ["keyword1", "keyword2", ...],
  "summary": "Brief area mood summary (max 100 chars)"
}

Consider:
- Overall emotional tone and community sentiment
- Severity and impact of reported issues
- Balance between positive events and concerns
- Public safety and quality of life indicators
- Community engagement and civic participation

Focus on actionable insights for city management and public understanding.
`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      return this.parseSentimentResponse(text);
    } catch (error) {
      functions.logger.error('Sentiment analysis error:', error);
      return this.getFallbackSentiment();
    }
  }

  private parseSentimentResponse(response: string): AreaSentiment['sentiment'] {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      return {
        score: Math.max(-1, Math.min(1, parsed.score || 0)),
        classification: ['positive', 'neutral', 'negative'].includes(parsed.classification) 
          ? parsed.classification 
          : 'neutral',
        confidence: Math.max(0, Math.min(1, parsed.confidence || 0.5)),
        keywords: Array.isArray(parsed.keywords) ? parsed.keywords.slice(0, 8) : [],
        summary: typeof parsed.summary === 'string' ? parsed.summary.substring(0, 100) : ''
      };
    } catch (error) {
      functions.logger.error('Failed to parse sentiment response:', error);
      return this.getFallbackSentiment();
    }
  }

  private getFallbackSentiment(): AreaSentiment['sentiment'] {
    return {
      score: 0,
      classification: 'neutral',
      confidence: 0.3,
      keywords: [],
      summary: 'Unable to analyze sentiment - manual review required'
    };
  }
}

class AreaManager {
  // Define city areas with their boundaries
  private readonly CITY_AREAS = [
    {
      name: 'Mission District',
      bounds: { north: 37.7650, south: 37.7548, east: -122.4100, west: -122.4196 },
      center: { lat: 37.7599, lng: -122.4148 }
    },
    {
      name: 'SOMA District', 
      bounds: { north: 37.7900, south: 37.7798, east: -122.4046, west: -122.4142 },
      center: { lat: 37.7849, lng: -122.4094 }
    },
    {
      name: 'Financial District',
      bounds: { north: 37.7980, south: 37.7912, east: -122.3966, west: -122.4062 },
      center: { lat: 37.7946, lng: -122.4014 }
    },
    {
      name: 'Castro District',
      bounds: { north: 37.7660, south: 37.7558, east: -122.4302, west: -122.4398 },
      center: { lat: 37.7609, lng: -122.4350 }
    },
    {
      name: 'Chinatown',
      bounds: { north: 37.7975, south: 37.7907, east: -122.4030, west: -122.4126 },
      center: { lat: 37.7941, lng: -122.4078 }
    },
    {
      name: 'Tenderloin',
      bounds: { north: 37.7871, south: 37.7803, east: -122.4082, west: -122.4178 },
      center: { lat: 37.7837, lng: -122.4130 }
    }
  ];

  getAreaForLocation(latitude: number, longitude: number): string | null {
    for (const area of this.CITY_AREAS) {
      if (
        latitude >= area.bounds.south &&
        latitude <= area.bounds.north &&
        longitude >= area.bounds.west &&
        longitude <= area.bounds.east
      ) {
        return area.name;
      }
    }
    return null;
  }

  getAllAreas() {
    return this.CITY_AREAS;
  }

  getAreaBounds(areaName: string) {
    const area = this.CITY_AREAS.find(a => a.name === areaName);
    return area ? { bounds: area.bounds, center: area.center } : null;
  }
}

// Main Cloud Function to update sentiment heatmap
export const updateSentimentHeatmap = functions.pubsub
  .schedule('every 15 minutes')
  .onRun(async (context) => {
    const analyzer = new SentimentAnalyzer();
    const areaManager = new AreaManager();
    
    try {
      functions.logger.info('Starting sentiment heatmap update');
      
      const areas = areaManager.getAllAreas();
      const sentimentResults: AreaSentiment[] = [];
      
      for (const area of areas) {
        // Fetch social posts for this area
        const socialPosts = await fetchSocialPostsForArea(area.name, area.bounds);
        
        // Fetch user reports for this area  
        const userReports = await fetchUserReportsForArea(area.name, area.bounds);
        
        // Skip areas with no data
        if (socialPosts.length === 0 && userReports.length === 0) {
          continue;
        }
        
        // Analyze sentiment
        const sentiment = await analyzer.analyzeCombinedSentiment(
          socialPosts,
          userReports,
          area.name
        );
        
        // Determine trend direction (compare with previous data)
        const previousSentiment = await getPreviousSentiment(area.name);
        const trendDirection = determineTrend(sentiment.score, previousSentiment);
        
        const areaSentiment: AreaSentiment = {
          area: area.name,
          coordinates: area.center,
          bounds: area.bounds,
          sentiment,
          reportCount: socialPosts.length + userReports.length,
          sources: {
            social: socialPosts.length,
            userReports: userReports.length,
            civic: 0 // Would be populated from civic data
          },
          lastUpdated: new Date(),
          trendDirection
        };
        
        sentimentResults.push(areaSentiment);
      }
      
      // Save results to Firestore
      const batch = admin.firestore().batch();
      
      for (const result of sentimentResults) {
        const docRef = admin.firestore()
          .collection('sentimentHeatmap')
          .doc(result.area.replace(/\s+/g, '_').toLowerCase());
        
        batch.set(docRef, {
          ...result,
          lastUpdated: admin.firestore.FieldValue.serverTimestamp()
        });
      }
      
      await batch.commit();
      
      functions.logger.info(`Updated sentiment data for ${sentimentResults.length} areas`);
      
      // Trigger notifications for significant sentiment changes
      await checkForSentimentAlerts(sentimentResults);
      
    } catch (error) {
      functions.logger.error('Error updating sentiment heatmap:', error);
    }
  });

// Manual trigger for sentiment analysis
export const analyzeSentimentManually = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
  }

  const { areaName } = data;
  
  try {
    const analyzer = new SentimentAnalyzer();
    const areaManager = new AreaManager();
    
    const areaInfo = areaManager.getAreaBounds(areaName);
    if (!areaInfo) {
      throw new functions.https.HttpsError('invalid-argument', 'Invalid area name');
    }
    
    const socialPosts = await fetchSocialPostsForArea(areaName, areaInfo.bounds);
    const userReports = await fetchUserReportsForArea(areaName, areaInfo.bounds);
    
    const sentiment = await analyzer.analyzeCombinedSentiment(
      socialPosts,
      userReports,
      areaName
    );
    
    return {
      success: true,
      area: areaName,
      sentiment,
      dataPoints: {
        social: socialPosts.length,
        reports: userReports.length
      }
    };
    
  } catch (error) {
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// Helper functions
async function fetchSocialPostsForArea(
  areaName: string, 
  bounds: any
): Promise<SocialPost[]> {
  // In production, this would query social media APIs or cached data
  // For now, return mock data based on area
  const mockPosts: SocialPost[] = [];
  
  // Query Firestore for social posts in this area
  const postsSnapshot = await admin.firestore()
    .collection('socialPosts')
    .where('location.latitude', '>=', bounds.south)
    .where('location.latitude', '<=', bounds.north)
    .where('location.longitude', '>=', bounds.west)
    .where('location.longitude', '<=', bounds.east)
    .where('timestamp', '>=', new Date(Date.now() - 24 * 60 * 60 * 1000)) // Last 24 hours
    .limit(50)
    .get();
  
  postsSnapshot.forEach(doc => {
    const data = doc.data();
    mockPosts.push({
      id: doc.id,
      text: data.text,
      timestamp: data.timestamp.toDate(),
      location: data.location,
      platform: data.platform,
      engagement: data.engagement
    });
  });
  
  return mockPosts;
}

async function fetchUserReportsForArea(
  areaName: string,
  bounds: any
): Promise<UserReport[]> {
  const reports: UserReport[] = [];
  
  // Query Firestore for user reports in this area
  const reportsSnapshot = await admin.firestore()
    .collection('events')
    .where('source', '==', 'user')
    .where('location.latitude', '>=', bounds.south)
    .where('location.latitude', '<=', bounds.north)
    .where('location.longitude', '>=', bounds.west)
    .where('location.longitude', '<=', bounds.east)
    .where('timestamp', '>=', new Date(Date.now() - 24 * 60 * 60 * 1000))
    .limit(30)
    .get();
  
  reportsSnapshot.forEach(doc => {
    const data = doc.data();
    reports.push({
      id: doc.id,
      title: data.title,
      description: data.description,
      location: {
        latitude: data.location.latitude,
        longitude: data.location.longitude
      },
      timestamp: data.timestamp.toDate(),
      category: data.eventType
    });
  });
  
  return reports;
}

async function getPreviousSentiment(areaName: string): Promise<number> {
  try {
    const docRef = admin.firestore()
      .collection('sentimentHeatmap')
      .doc(areaName.replace(/\s+/g, '_').toLowerCase());
    
    const doc = await docRef.get();
    return doc.exists ? doc.data()?.sentiment?.score || 0 : 0;
  } catch (error) {
    return 0;
  }
}

function determineTrend(currentScore: number, previousScore: number): 'up' | 'down' | 'stable' {
  const diff = currentScore - previousScore;
  if (Math.abs(diff) < 0.1) return 'stable';
  return diff > 0 ? 'up' : 'down';
}

async function checkForSentimentAlerts(results: AreaSentiment[]) {
  for (const result of results) {
    // Alert for significant negative sentiment
    if (result.sentiment.score < -0.7 && result.sentiment.confidence > 0.8) {
      await admin.firestore().collection('sentimentAlerts').add({
        area: result.area,
        type: 'negative_sentiment',
        score: result.sentiment.score,
        summary: result.sentiment.summary,
        reportCount: result.reportCount,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        severity: 'high'
      });
    }
    
    // Alert for rapid sentiment decline
    if (result.trendDirection === 'down' && result.sentiment.score < -0.5) {
      await admin.firestore().collection('sentimentAlerts').add({
        area: result.area,
        type: 'sentiment_decline',
        score: result.sentiment.score,
        summary: result.sentiment.summary,
        reportCount: result.reportCount,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        severity: 'medium'
      });
    }
  }
}