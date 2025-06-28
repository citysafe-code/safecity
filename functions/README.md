# City Pulse AI Functions

This Firebase Functions package provides comprehensive AI-powered analysis for the City Pulse application, including social media synthesis and multimodal image analysis using Google's Gemini API.

## Features

### 🔍 Social Media Synthesis
- **Duplicate Detection**: Advanced clustering of similar posts
- **AI Synthesis**: Converts multiple posts into actionable city event reports
- **Location Inference**: Determines central location and affected radius
- **Confidence Scoring**: Rates reliability based on multiple factors

### 📸 Multimodal Image Analysis
- **Visual Content Analysis**: Describes what's happening in user-submitted images
- **Category Classification**: Automatically categorizes events (accident, waterlogging, celebration, etc.)
- **Severity Assessment**: Scores urgency from 1-5 scale
- **Text Extraction**: Reads visible text, signs, and license plates
- **Safety Evaluation**: Determines public safety implications
- **Action Recommendations**: Provides specific guidance for city officials

## Setup

1. **Install dependencies**:
   ```bash
   cd functions
   npm install
   ```

2. **Configure Gemini API**:
   ```bash
   firebase functions:config:set gemini.api_key="YOUR_GEMINI_API_KEY"
   ```

3. **Deploy functions**:
   ```bash
   npm run deploy
   ```

## Image Analysis Features

### 🎯 **Automatic Categorization**
The system classifies images into specific event types:
- **accident**: Vehicle collisions, crashes, traffic incidents
- **waterlogging**: Flooding, water accumulation, drainage issues
- **celebration**: Festivals, parades, public gatherings
- **construction**: Road work, building construction, infrastructure
- **fire**: Fires, smoke, emergency situations
- **protest**: Demonstrations, rallies, civil unrest
- **vandalism**: Graffiti, property damage, destruction
- **infrastructure**: Broken roads, fallen trees, utility issues
- **weather**: Storm damage, extreme weather effects
- **other**: Events that don't fit above categories

### 📊 **Severity Scoring (1-5 Scale)**
- **1**: Minor issue, no immediate action needed
- **2**: Low priority, routine maintenance
- **3**: Moderate concern, schedule response
- **4**: High priority, urgent response needed
- **5**: Critical emergency, immediate action required

### 🛡️ **Safety Assessment**
- **safe**: No immediate danger to public
- **caution**: Potential hazard, monitor situation
- **danger**: Active threat, restrict access
- **emergency**: Immediate evacuation/response needed

### 🔍 **Text Extraction**
Automatically extracts visible text including:
- Street signs and addresses
- Business names and landmarks
- License plates (for traffic incidents)
- Emergency contact numbers
- Warning signs or official notices

### 📍 **Location Intelligence**
- Identifies street names and intersections
- Recognizes landmarks and distinctive features
- Notes public transportation stops
- Extracts business names for location context

## Usage

### Automatic Image Analysis
Images uploaded to the `user-reports/` folder in Firebase Storage are automatically analyzed:

```javascript
// Upload image with metadata
const metadata = {
  customMetadata: {
    userId: 'user123',
    location: JSON.stringify({
      latitude: 37.7749,
      longitude: -122.4194
    })
  }
};

await storageRef.child('user-reports/incident-123.jpg').put(file, metadata);
```

### Manual Image Analysis
Test the analysis on specific images:

```javascript
const result = await firebase.functions().httpsCallable('analyzeImageManually')({
  imageUrl: 'gs://your-bucket/user-reports/image.jpg'
});

console.log(result.data.analysis);
```

## Output Format

### Image Analysis Result
```javascript
{
  "description": "Traffic accident involving two vehicles on a busy street",
  "category": "accident",
  "severityScore": 4,
  "extractedText": ["STOP", "Main St", "ABC-123"],
  "confidence": 0.92,
  "detectedObjects": ["car", "person", "traffic light", "road"],
  "safetyLevel": "danger",
  "suggestedActions": [
    "Dispatch emergency services to Main Street",
    "Set up traffic diversion",
    "Contact towing services"
  ],
  "locationClues": ["Main Street", "City Hall", "Bus Stop 42"],
  "timeOfDayEstimate": "afternoon",
  "weatherConditions": "clear"
}
```

### Content Moderation
```javascript
{
  "isAppropriate": true,
  "flags": ["high_priority_emergency"],
  "action": "approve"
}
```

## Integration with City Pulse

### Automatic Event Creation
When appropriate images are analyzed, the system automatically:
1. Creates a new event in the `events` collection
2. Includes the image analysis in event metadata
3. Sets appropriate severity and category
4. Triggers notifications for high-priority events

### Real-time Processing
- Images are processed within seconds of upload
- Results appear immediately in the City Pulse dashboard
- High-severity events trigger immediate notifications
- All processing is logged for monitoring and debugging

## Content Moderation

The system includes built-in content moderation:
- **Inappropriate Content Detection**: Flags violent or explicit content
- **Quality Assessment**: Reviews low-confidence analyses
- **Safety Prioritization**: Fast-tracks emergency situations
- **User Notifications**: Confirms receipt of high-priority reports

## Monitoring and Debugging

Track function performance through:
- Firebase Functions logs
- `aiProcessingLogs` collection with detailed metrics
- Processing time and confidence tracking
- Error logging with full context
- Gemini API usage monitoring

## Security

- Authentication required for manual analysis
- Input validation and sanitization
- Content moderation for inappropriate images
- Rate limiting on API calls
- Secure handling of user data

## Production Considerations

- **Image Optimization**: Resize large images before processing
- **Cost Management**: Monitor Gemini API usage
- **Scalability**: Functions auto-scale with demand
- **Reliability**: Comprehensive error handling and retries
- **Privacy**: Automatic expiration of sensitive data

This system transforms raw user-submitted images into actionable intelligence for city management, providing immediate insights into developing situations across the city.