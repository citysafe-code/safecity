import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
  updateProfile,
  sendPasswordResetEmail,
  sendEmailVerification
} from 'firebase/auth';
import { auth } from './config';
import { createUser, getUser } from './firestore';

// Authentication functions
export const signIn = async (email: string, password: string): Promise<User> => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  } catch (error) {
    console.error('Error signing in:', error);
    throw error;
  }
};

export const signUp = async (
  email: string, 
  password: string, 
  displayName: string
): Promise<User> => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Update the user's display name
    await updateProfile(user, { displayName });
    
    // Create user document in Firestore
    await createUser(user.uid, {
      email: user.email!,
      displayName,
      trustScore: 50, // Starting trust score
      locationSubscriptions: [],
      reportingHistory: {
        totalReports: 0,
        verifiedReports: 0,
        falseReports: 0,
        averageAccuracy: 0,
        reportsByCategory: {}
      },
      preferences: {
        notifications: {
          push: true,
          email: true,
          sms: false,
          frequency: 'immediate'
        },
        privacy: {
          shareLocation: true,
          publicProfile: true,
          showInLeaderboard: true
        },
        filters: {
          defaultRadius: 5000,
          hiddenEventTypes: [],
          minimumSeverity: 'low'
        }
      },
      verificationLevel: 'email',
      badges: ['new_user'],
      isActive: true,
      moderationFlags: 0,
      contributionStats: {
        eventsReported: 0,
        eventsVerified: 0,
        mediaUploaded: 0,
        helpfulVotes: 0,
        streakDays: 0,
        lastContribution: new Date() as any
      }
    });
    
    // Send email verification
    await sendEmailVerification(user);
    
    return user;
  } catch (error) {
    console.error('Error signing up:', error);
    throw error;
  }
};

export const logout = async (): Promise<void> => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Error signing out:', error);
    throw error;
  }
};

export const resetPassword = async (email: string): Promise<void> => {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw error;
  }
};

// Auth state observer
export const onAuthStateChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

// Get current user
export const getCurrentUser = (): User | null => {
  return auth.currentUser;
};

// Check if user is authenticated
export const isAuthenticated = (): boolean => {
  return !!auth.currentUser;
};

// Update user profile
export const updateUserProfile = async (updates: {
  displayName?: string;
  photoURL?: string;
}): Promise<void> => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('No authenticated user');
    
    await updateProfile(user, updates);
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};