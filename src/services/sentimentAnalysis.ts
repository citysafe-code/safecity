import { GoogleGenerativeAI } from '@google/generative-ai';

// This would be configured in your environment
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export interface SocialPost {
  id: string;
  text: string;
  timestamp: Date;
  location?: {
    latitude: number;
    longitude: number;
    area?: string;
  };
  platform: 'twitter' | 'facebook' | 'instagram' | 'reddit' | 'nextdoor';
  engagement: {
    likes: number;
    shares: number;
    comments: number;
  };
}

export interface UserReport {
  id: string;
  title: string;
  description: string;
  category: string;
  location: {
    latitude: number;
    longitude: number;
    area?: string;
  };
  timestamp: Date;
  mediaUrls?: string[];
}

export interface SentimentAnalysis {
  score: number; // -1 to 1
  classification: 'positive' | 'neutral' | 'negative';
  confidence: number; // 0 to 1
  emotions: string[];
  keywords: string[];
  summary: string;
}

export interface AreaSentiment {
  area: string;
  coordinates: { lat: number; lng: number };
  bounds: { north: number; south: number; east: number; west: number };
  sentiment: SentimentAnalysis;
  reportCount: number;
  sources: {
    social: number;
    userReports: number;
    civic: number;
  };
  lastUpdated: Date;
  trendDirection: 'up' | 'down' | 'stable';
  moodSummary: string;
}

class SentimentAnalyzer {
  private model = genAI.getGenerativeModel({ model: 'gemini-pro' });

  async analyzeSocialPosts(posts: SocialPost[]): Promise<SentimentAnalysis> {
    const combinedText = posts.map(post => post.text).join('\n');
    
    const prompt = `
Analyze the sentiment of these social media posts and provide a comprehensive analysis:

Posts:
${combinedText}

Please provide a JSON response with the following structure:
{
  "score": -1 to 1 (negative to positive),
  "classification": "positive|neutral|negative",
  "confidence": 0 to 1,
  "emotions": ["emotion1", "emotion2", ...],
  "keywords": ["keyword1", "keyword2", ...],
  "summary": "Brief summary of the overall mood and sentiment"
}

Consider:
- Overall emotional tone and sentiment
- Frequency of positive vs negative language
- Context and implications of the content
- Confidence based on clarity and consistency
- Key emotions and themes present
- Important keywords that drive sentiment

Focus on providing actionable insights for city management.
`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      return this.parseSentimentResponse(text);
    } catch (error) {
      console.error('Gemini sentiment analysis error:', error);
      return this.getFallbackSentiment();
    }
  }

  async analyzeUserReports(reports: UserReport[]): Promise<SentimentAnalysis> {
    const combinedText = reports.map(report => 
      `${report.title}: ${report.description}`
    ).join('\n');
    
    const prompt = `
Analyze the sentiment of these citizen reports about city issues:

Reports:
${combinedText}

Please provide a JSON response with the following structure:
{
  "score": -1 to 1 (negative to positive),
  "classification": "positive|neutral|negative",
  "confidence": 0 to 1,
  "emotions": ["emotion1", "emotion2", ...],
  "keywords": ["keyword1", "keyword2", ...],
  "summary": "Brief summary of citizen concerns and mood"
}

Consider:
- Severity and urgency of reported issues
- Citizen frustration or satisfaction levels
- Community impact and public safety concerns
- Constructive vs. complaint-focused language
- Overall civic engagement tone

Provide insights that help city officials understand public sentiment.
`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      return this.parseSentimentResponse(text);
    } catch (error) {
      console.error('Gemini sentiment analysis error:', error);
      return this.getFallbackSentiment();
    }
  }

  async generateAreaMoodSummary(
    socialSentiment: SentimentAnalysis,
    reportSentiment: SentimentAnalysis,
    area: string
  ): Promise<string> {
    const prompt = `
Generate a concise mood summary for ${area} based on this sentiment analysis:

Social Media Sentiment:
- Score: ${socialSentiment.score}
- Classification: ${socialSentiment.classification}
- Summary: ${socialSentiment.summary}
- Keywords: ${socialSentiment.keywords.join(', ')}

Citizen Reports Sentiment:
- Score: ${reportSentiment.score}
- Classification: ${reportSentiment.classification}
- Summary: ${reportSentiment.summary}
- Keywords: ${reportSentiment.keywords.join(', ')}

Provide a single sentence (max 100 characters) that captures the overall mood and key themes for this area.
Focus on what's driving the sentiment and its implications for the community.
`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text().trim();
    } catch (error) {
      console.error('Mood summary generation error:', error);
      return `Mixed sentiment in ${area} with ongoing community activity`;
    }
  }

  private parseSentimentResponse(response: string): SentimentAnalysis {
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
        emotions: Array.isArray(parsed.emotions) ? parsed.emotions.slice(0, 5) : [],
        keywords: Array.isArray(parsed.keywords) ? parsed.keywords.slice(0, 10) : [],
        summary: typeof parsed.summary === 'string' ? parsed.summary.substring(0, 200) : ''
      };
    } catch (error) {
      console.error('Failed to parse sentiment response:', error);
      return this.getFallbackSentiment();
    }
  }

  private getFallbackSentiment(): SentimentAnalysis {
    return {
      score: 0,
      classification: 'neutral',
      confidence: 0.3,
      emotions: [],
      keywords: [],
      summary: 'Unable to analyze sentiment - manual review required'
    };
  }
}

export class SentimentHeatmapService {
  private analyzer = new SentimentAnalyzer();

  async generateAreaSentiment(
    area: string,
    coordinates: { lat: number; lng: number },
    bounds: { north: number; south: number; east: number; west: number },
    socialPosts: SocialPost[],
    userReports: UserReport[]
  ): Promise<AreaSentiment> {
    
    // Analyze social media sentiment
    const socialSentiment = socialPosts.length > 0 
      ? await this.analyzer.analyzeSocialPosts(socialPosts)
      : { score: 0, classification: 'neutral' as const, confidence: 0, emotions: [], keywords: [], summary: '' };

    // Analyze user reports sentiment
    const reportSentiment = userReports.length > 0
      ? await this.analyzer.analyzeUserReports(userReports)
      : { score: 0, classification: 'neutral' as const, confidence: 0, emotions: [], keywords: [], summary: '' };

    // Combine sentiments with weighted average
    const socialWeight = socialPosts.length / (socialPosts.length + userReports.length + 1);
    const reportWeight = userReports.length / (socialPosts.length + userReports.length + 1);
    
    const combinedScore = (socialSentiment.score * socialWeight) + (reportSentiment.score * reportWeight);
    const combinedConfidence = Math.max(socialSentiment.confidence, reportSentiment.confidence);
    
    const classification = combinedScore > 0.2 ? 'positive' : 
                          combinedScore < -0.2 ? 'negative' : 'neutral';

    // Generate mood summary
    const moodSummary = await this.analyzer.generateAreaMoodSummary(
      socialSentiment, 
      reportSentiment, 
      area
    );

    // Determine trend direction (simplified - in production, compare with historical data)
    const trendDirection = combinedScore > 0.3 ? 'up' : 
                          combinedScore < -0.3 ? 'down' : 'stable';

    return {
      area,
      coordinates,
      bounds,
      sentiment: {
        score: combinedScore,
        classification,
        confidence: combinedConfidence,
        emotions: [...socialSentiment.emotions, ...reportSentiment.emotions].slice(0, 5),
        keywords: [...socialSentiment.keywords, ...reportSentiment.keywords].slice(0, 8),
        summary: moodSummary
      },
      reportCount: socialPosts.length + userReports.length,
      sources: {
        social: socialPosts.length,
        userReports: userReports.length,
        civic: 0 // Would be populated from civic data sources
      },
      lastUpdated: new Date(),
      trendDirection,
      moodSummary
    };
  }

  async updateHeatmapData(areas: string[]): Promise<AreaSentiment[]> {
    const results: AreaSentiment[] = [];
    
    for (const area of areas) {
      // In production, fetch real data from Firebase/APIs
      const socialPosts = await this.fetchSocialPostsForArea(area);
      const userReports = await this.fetchUserReportsForArea(area);
      const coordinates = await this.getAreaCoordinates(area);
      const bounds = await this.getAreaBounds(area);
      
      const areaSentiment = await this.generateAreaSentiment(
        area,
        coordinates,
        bounds,
        socialPosts,
        userReports
      );
      
      results.push(areaSentiment);
    }
    
    return results;
  }

  private async fetchSocialPostsForArea(area: string): Promise<SocialPost[]> {
    // Mock implementation - replace with actual API calls
    return [];
  }

  private async fetchUserReportsForArea(area: string): Promise<UserReport[]> {
    // Mock implementation - replace with actual Firebase queries
    return [];
  }

  private async getAreaCoordinates(area: string): Promise<{ lat: number; lng: number }> {
    // Mock implementation - replace with geocoding service
    return { lat: 37.7749, lng: -122.4194 };
  }

  private async getAreaBounds(area: string): Promise<{ north: number; south: number; east: number; west: number }> {
    // Mock implementation - replace with area boundary service
    return { north: 37.8, south: 37.7, east: -122.3, west: -122.5 };
  }
}

export const sentimentService = new SentimentHeatmapService();