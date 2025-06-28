# Firebase Firestore Schema for City Data App

This document outlines the comprehensive Firestore database schema for a real-time city monitoring application that handles user reports and AI-synthesized events.

## Collections Overview

### 1. Events Collection (`/events/{eventId}`)
Stores all city events from various sources including user reports, AI analysis, and civic data feeds.

**Key Features:**
- Real-time event tracking with geolocation
- Multi-source data integration (user, social, civic, AI)
- Sentiment analysis and confidence scoring
- Event verification and community validation
- Automatic expiration for time-sensitive events

### 2. Users Collection (`/users/{userId}`)
Manages user profiles with trust scoring and location-based subscriptions.

**Key Features:**
- Trust score algorithm based on reporting accuracy
- Location-based event subscriptions with custom radius
- Comprehensive reporting history and statistics
- Gamification elements (badges, streaks, leaderboards)
- Privacy controls and notification preferences

### 3. Event Verifications Collection (`/eventVerifications/{verificationId}`)
Tracks community verification of events to improve data quality.

**Key Features:**
- Multiple verification types (confirm, deny, update, media)
- Confidence scoring for verification quality
- Media attachments for verification proof
- User notes and additional context

### 4. Notifications Collection (`/notifications/{notificationId}`)
Manages user notifications for location-based events and system updates.

**Key Features:**
- Location-based event alerts
- Customizable notification preferences
- Expiration handling for time-sensitive alerts
- Deep linking to relevant events

### 5. AI Processing Logs Collection (`/aiProcessingLogs/{logId}`)
Tracks AI processing for debugging and model improvement.

**Key Features:**
- Sentiment analysis logging
- Content moderation tracking
- Duplicate detection records
- Model performance metrics

## Security Rules

The included Firestore security rules provide:
- Public read access to events for transparency
- User-owned data protection
- Moderator privileges for content management
- Validation of data structure and constraints

## Database Indexes

Optimized indexes for common query patterns:
- Location-based event queries
- Time-range filtering
- Category and severity filtering
- User activity tracking
- Verification lookups

## Sample Data Structure

The schema includes comprehensive sample data demonstrating:
- Real-world event scenarios (traffic, celebrations, power outages)
- User profiles with varying trust scores
- Event verification workflows
- Notification delivery patterns
- AI processing examples

## Implementation Notes

1. **Geolocation**: Use GeoPoint fields for efficient location queries
2. **Real-time Updates**: Leverage Firestore's real-time listeners for live updates
3. **Offline Support**: Structure supports offline-first mobile applications
4. **Scalability**: Designed for horizontal scaling with proper indexing
5. **Data Retention**: Implement TTL for expired events and old logs

## Trust Score Algorithm

The trust score (0-100) is calculated based on:
- Report accuracy rate (40%)
- Verification participation (25%)
- Community feedback (20%)
- Account age and activity (15%)

## Event Lifecycle

1. **Creation**: User reports or AI detects event
2. **Verification**: Community validates event details
3. **Active Monitoring**: Real-time updates and notifications
4. **Resolution**: Event status updated when resolved
5. **Expiration**: Automatic cleanup of outdated events

This schema provides a robust foundation for a city monitoring application with strong data integrity, user engagement features, and scalable architecture.