import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(functions.config().gemini.api_key);

interface ImageAnalysisResult {
  description: string;
  category: 'accident' | 'waterlogging' | 'celebration' | 'construction' | 'fire' | 'protest' | 'vandalism' | 'infrastructure' | 'weather' | 'other';
  severityScore: number; // 1-5 scale
  extractedText: string[];
  confidence: number;
  detectedObjects: string[];
  safetyLevel: 'safe' | 'caution' | 'danger' | 'emergency';
  suggestedActions: string[];
  locationClues: string[];
  timeOfDayEstimate?: 'morning' | 'afternoon' | 'evening' | 'night';
  weatherConditions?: string;
}

interface ProcessingMetadata {
  imageUrl: string;
  userId: string;
  uploadTimestamp: Date;
  fileSize: number;
  dimensions?: {
    width: number;
    height: number;
  };
  location?: {
    latitude: number;
    longitude: number;
  };
}

class GeminiImageAnalyzer {
  private model = genAI.getGenerativeModel({ model: 'gemini-pro-vision' });

  async analyzeImage(imageBuffer: Buffer, metadata: ProcessingMetadata): Promise<ImageAnalysisResult> {
    try {
      const prompt = this.buildAnalysisPrompt();
      
      const imagePart = {
        inlineData: {
          data: imageBuffer.toString('base64'),
          mimeType: 'image/jpeg' // Adjust based on actual image type
        }
      };

      const result = await this.model.generateContent([prompt, imagePart]);
      const response = await result.response;
      const text = response.text();
      
      return this.parseAnalysisResponse(text, metadata);
    } catch (error) {
      functions.logger.error('Gemini Vision API error:', error);
      throw new Error('Failed to analyze image with Gemini Vision API');
    }
  }

  private buildAnalysisPrompt(): string {
    return `
Analyze this image submitted by a citizen reporting a city event. Provide a comprehensive analysis in JSON format:

{
  "description": "Clear, detailed description of what you see (max 200 chars)",
  "category": "accident|waterlogging|celebration|construction|fire|protest|vandalism|infrastructure|weather|other",
  "severityScore": 1-5,
  "extractedText": ["any visible text", "signs", "license plates", "etc"],
  "confidence": 0.0-1.0,
  "detectedObjects": ["car", "person", "building", "water", "etc"],
  "safetyLevel": "safe|caution|danger|emergency",
  "suggestedActions": ["specific action 1", "specific action 2"],
  "locationClues": ["street names", "landmarks", "business names"],
  "timeOfDayEstimate": "morning|afternoon|evening|night",
  "weatherConditions": "clear|rainy|foggy|snowy|etc"
}

Analysis Guidelines:
1. **Category Classification**:
   - accident: Vehicle collisions, crashes, traffic incidents
   - waterlogging: Flooding, water accumulation, drainage issues
   - celebration: Festivals, parades, public gatherings
   - construction: Road work, building construction, infrastructure
   - fire: Fires, smoke, emergency situations
   - protest: Demonstrations, rallies, civil unrest
   - vandalism: Graffiti, property damage, destruction
   - infrastructure: Broken roads, fallen trees, utility issues
   - weather: Storm damage, extreme weather effects
   - other: Events that don't fit above categories

2. **Severity Scoring (1-5)**:
   - 1: Minor issue, no immediate action needed
   - 2: Low priority, routine maintenance
   - 3: Moderate concern, schedule response
   - 4: High priority, urgent response needed
   - 5: Critical emergency, immediate action required

3. **Safety Assessment**:
   - safe: No immediate danger to public
   - caution: Potential hazard, monitor situation
   - danger: Active threat, restrict access
   - emergency: Immediate evacuation/response needed

4. **Text Extraction**:
   - Focus on street signs, business names, license plates
   - Include any emergency contact numbers
   - Note warning signs or official notices

5. **Suggested Actions**:
   - Be specific and actionable for city officials
   - Consider immediate vs. long-term responses
   - Include relevant departments (police, fire, public works)

6. **Location Clues**:
   - Street names, intersections
   - Landmarks, buildings, businesses
   - Distinctive architectural features
   - Public transportation stops

Provide accurate, actionable intelligence for city management.
`;
  }

  private parseAnalysisResponse(response: string, metadata: ProcessingMetadata): ImageAnalysisResult {
    try {
      // Extract JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in Gemini response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      // Validate and sanitize the response
      return {
        description: this.sanitizeText(parsed.description || 'Image analysis completed'),
        category: this.validateCategory(parsed.category),
        severityScore: this.validateSeverity(parsed.severityScore),
        extractedText: Array.isArray(parsed.extractedText) ? parsed.extractedText.map(this.sanitizeText) : [],
        confidence: Math.max(0, Math.min(1, parsed.confidence || 0.7)),
        detectedObjects: Array.isArray(parsed.detectedObjects) ? parsed.detectedObjects.map(this.sanitizeText) : [],
        safetyLevel: this.validateSafetyLevel(parsed.safetyLevel),
        suggestedActions: Array.isArray(parsed.suggestedActions) ? parsed.suggestedActions.map(this.sanitizeText) : [],
        locationClues: Array.isArray(parsed.locationClues) ? parsed.locationClues.map(this.sanitizeText) : [],
        timeOfDayEstimate: this.validateTimeOfDay(parsed.timeOfDayEstimate),
        weatherConditions: this.sanitizeText(parsed.weatherConditions)
      };
    } catch (error) {
      functions.logger.error('Failed to parse Gemini response:', error);
      
      // Return fallback analysis
      return {
        description: 'Image uploaded by user - manual review required',
        category: 'other',
        severityScore: 2,
        extractedText: [],
        confidence: 0.3,
        detectedObjects: [],
        safetyLevel: 'caution',
        suggestedActions: ['Manual review required', 'Contact user for additional details'],
        locationClues: [],
        timeOfDayEstimate: undefined,
        weatherConditions: undefined
      };
    }
  }

  private sanitizeText(text: string): string {
    if (typeof text !== 'string') return '';
    return text.trim().substring(0, 500); // Limit length
  }

  private validateCategory(category: string): ImageAnalysisResult['category'] {
    const validCategories = ['accident', 'waterlogging', 'celebration', 'construction', 'fire', 'protest', 'vandalism', 'infrastructure', 'weather', 'other'];
    return validCategories.includes(category) ? category as ImageAnalysisResult['category'] : 'other';
  }

  private validateSeverity(severity: any): number {
    const num = parseInt(severity);
    return isNaN(num) ? 2 : Math.max(1, Math.min(5, num));
  }

  private validateSafetyLevel(level: string): ImageAnalysisResult['safetyLevel'] {
    const validLevels = ['safe', 'caution', 'danger', 'emergency'];
    return validLevels.includes(level) ? level as ImageAnalysisResult['safetyLevel'] : 'caution';
  }

  private validateTimeOfDay(time: string): ImageAnalysisResult['timeOfDayEstimate'] {
    const validTimes = ['morning', 'afternoon', 'evening', 'night'];
    return validTimes.includes(time) ? time as ImageAnalysisResult['timeOfDayEstimate'] : undefined;
  }
}

class ContentModerator {
  async checkImageSafety(analysisResult: ImageAnalysisResult): Promise<{
    isAppropriate: boolean;
    flags: string[];
    action: 'approve' | 'review' | 'reject';
  }> {
    const flags: string[] = [];
    
    // Check for inappropriate content indicators
    const inappropriateKeywords = ['violence', 'weapon', 'blood', 'explicit', 'inappropriate'];
    const description = analysisResult.description.toLowerCase();
    
    inappropriateKeywords.forEach(keyword => {
      if (description.includes(keyword)) {
        flags.push(`inappropriate_content_${keyword}`);
      }
    });

    // Check severity and safety level
    if (analysisResult.severityScore >= 4 && analysisResult.safetyLevel === 'emergency') {
      flags.push('high_priority_emergency');
    }

    // Determine action based on flags
    let action: 'approve' | 'review' | 'reject' = 'approve';
    
    if (flags.some(flag => flag.startsWith('inappropriate_content'))) {
      action = 'reject';
    } else if (flags.length > 0 || analysisResult.confidence < 0.5) {
      action = 'review';
    }

    return {
      isAppropriate: action !== 'reject',
      flags,
      action
    };
  }
}

// Main Cloud Function triggered by Firebase Storage uploads
export const analyzeUploadedImage = functions.storage.object().onFinalize(async (object) => {
  const filePath = object.name;
  const bucket = admin.storage().bucket();
  
  // Only process images in the 'user-reports' folder
  if (!filePath || !filePath.startsWith('user-reports/')) {
    return;
  }

  // Only process image files
  if (!object.contentType || !object.contentType.startsWith('image/')) {
    functions.logger.info('Skipping non-image file:', filePath);
    return;
  }

  try {
    functions.logger.info('Processing image:', filePath);
    
    // Download the image
    const file = bucket.file(filePath);
    const [imageBuffer] = await file.download();
    
    // Extract metadata from file path and custom metadata
    const metadata: ProcessingMetadata = {
      imageUrl: `gs://${object.bucket}/${filePath}`,
      userId: object.metadata?.userId || 'anonymous',
      uploadTimestamp: new Date(object.timeCreated),
      fileSize: parseInt(object.size),
      location: object.metadata?.location ? JSON.parse(object.metadata.location) : undefined
    };

    // Analyze image with Gemini
    const analyzer = new GeminiImageAnalyzer();
    const analysisResult = await analyzer.analyzeImage(imageBuffer, metadata);
    
    // Content moderation check
    const moderator = new ContentModerator();
    const moderationResult = await moderator.checkImageSafety(analysisResult);
    
    // Create event document if appropriate
    if (moderationResult.isAppropriate) {
      const eventRef = admin.firestore().collection('events').doc();
      
      await eventRef.set({
        id: eventRef.id,
        title: `User Report: ${analysisResult.description.substring(0, 50)}...`,
        description: analysisResult.description,
        eventType: this.mapCategoryToEventType(analysisResult.category),
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        location: metadata.location ? {
          latitude: metadata.location.latitude,
          longitude: metadata.location.longitude,
          city: 'Unknown', // Would be geocoded in production
          state: 'Unknown',
          country: 'Unknown'
        } : null,
        mediaUrls: [metadata.imageUrl],
        userId: metadata.userId,
        aiSummary: analysisResult.description,
        source: 'user',
        sentimentScore: this.calculateSentimentFromSeverity(analysisResult.severityScore),
        severity: this.mapSeverityScoreToLevel(analysisResult.severityScore),
        status: moderationResult.action === 'review' ? 'monitoring' : 'active',
        tags: [
          'user-report',
          'image-analysis',
          analysisResult.category,
          ...analysisResult.detectedObjects.slice(0, 5)
        ],
        verificationCount: 0,
        reportCount: 1,
        upvotes: 0,
        downvotes: 0,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        metadata: {
          confidence: analysisResult.confidence,
          processingVersion: 'v2.1.0',
          originalSource: 'user_image_upload',
          imageAnalysis: {
            ...analysisResult,
            moderationResult,
            processingTime: Date.now() - metadata.uploadTimestamp.getTime()
          }
        }
      });

      functions.logger.info(`Created event from image analysis: ${eventRef.id}`);
    }

    // Log the analysis for monitoring
    await admin.firestore().collection('aiProcessingLogs').add({
      id: '',
      eventId: moderationResult.isAppropriate ? 'created' : 'rejected',
      processingType: 'image_analysis',
      inputData: {
        imageUrl: metadata.imageUrl,
        userId: metadata.userId,
        fileSize: metadata.fileSize,
        hasLocation: !!metadata.location
      },
      outputData: {
        analysisResult,
        moderationResult
      },
      confidence: analysisResult.confidence,
      processingTime: Date.now() - metadata.uploadTimestamp.getTime(),
      modelVersion: 'gemini-pro-vision',
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });

    // Send notification to user if high severity
    if (analysisResult.severityScore >= 4 && moderationResult.isAppropriate) {
      await admin.firestore().collection('notifications').add({
        userId: metadata.userId,
        eventId: 'pending',
        type: 'high_priority_report',
        title: 'High Priority Report Received',
        message: `Your report has been classified as ${analysisResult.category} with high severity. City officials have been notified.`,
        isRead: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
      });
    }

  } catch (error) {
    functions.logger.error('Error analyzing image:', error);
    
    // Log error for debugging
    await admin.firestore().collection('aiProcessingLogs').add({
      id: '',
      eventId: 'error',
      processingType: 'image_analysis_error',
      inputData: { filePath, error: error.message },
      outputData: {},
      confidence: 0,
      processingTime: 0,
      modelVersion: 'gemini-pro-vision',
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    });
  }
});

// Helper function to manually analyze a specific image
export const analyzeImageManually = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
  }

  const { imageUrl } = data;
  if (!imageUrl) {
    throw new functions.https.HttpsError('invalid-argument', 'Image URL is required');
  }

  try {
    const bucket = admin.storage().bucket();
    const file = bucket.file(imageUrl.replace('gs://' + bucket.name + '/', ''));
    const [imageBuffer] = await file.download();
    
    const metadata: ProcessingMetadata = {
      imageUrl,
      userId: context.auth.uid,
      uploadTimestamp: new Date(),
      fileSize: imageBuffer.length
    };

    const analyzer = new GeminiImageAnalyzer();
    const result = await analyzer.analyzeImage(imageBuffer, metadata);
    
    const moderator = new ContentModerator();
    const moderation = await moderator.checkImageSafety(result);
    
    return { 
      success: true, 
      analysis: result, 
      moderation 
    };
  } catch (error) {
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// Helper functions
function mapCategoryToEventType(category: string): string {
  const mapping: Record<string, string> = {
    'accident': 'traffic',
    'waterlogging': 'weather',
    'celebration': 'celebration',
    'construction': 'construction',
    'fire': 'emergency',
    'protest': 'emergency',
    'vandalism': 'emergency',
    'infrastructure': 'construction',
    'weather': 'weather',
    'other': 'emergency'
  };
  return mapping[category] || 'emergency';
}

function calculateSentimentFromSeverity(severity: number): number {
  // Convert severity (1-5) to sentiment (-1 to 1)
  // Higher severity = more negative sentiment
  return (3 - severity) / 2;
}

function mapSeverityScoreToLevel(score: number): string {
  if (score >= 5) return 'critical';
  if (score >= 4) return 'high';
  if (score >= 3) return 'medium';
  return 'low';
}