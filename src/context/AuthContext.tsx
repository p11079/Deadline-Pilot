/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  auth, 
  db, 
  googleProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged,
  FirebaseUser
} from '../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { UserProfile } from '../types';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userProfile: UserProfile | null;
  loading: boolean;
  error: string | null;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUserProfile: (updates: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

const DEFAULT_USER_PROFILE: Omit<UserProfile, 'name' | 'email'> = {
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256',
  timezone: 'America/New_York',
  streakCount: 5,
  pilotPersona: 'supportive',
  weeklyFocusGoal: 40
};

export function AuthProvider({ children }: AuthProviderProps) {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Sync user profile from Firestore or initialize if new
  const syncUserProfile = async (firebaseUser: FirebaseUser, displayName?: string) => {
    try {
      const userDocRef = doc(db, 'users', firebaseUser.uid);
      const docSnap = await getDoc(userDocRef);

      if (docSnap.exists()) {
        const profile = docSnap.data();
        if (profile) {
          setUserProfile({
            name: profile.name || firebaseUser.displayName || 'Pilot Guest',
            email: profile.email || firebaseUser.email || '',
            avatarUrl: profile.avatarUrl || firebaseUser.photoURL || DEFAULT_USER_PROFILE.avatarUrl,
            timezone: profile.timezone || DEFAULT_USER_PROFILE.timezone,
            streakCount: profile.streakCount ?? DEFAULT_USER_PROFILE.streakCount,
            pilotPersona: profile.pilotPersona || DEFAULT_USER_PROFILE.pilotPersona,
            weeklyFocusGoal: profile.weeklyFocusGoal ?? DEFAULT_USER_PROFILE.weeklyFocusGoal
          });
          return;
        }
      }

      // Create new user profile document if not found
      const newProfile: UserProfile = {
        name: displayName || firebaseUser.displayName || 'Pilot Guest',
        email: firebaseUser.email || '',
        avatarUrl: firebaseUser.photoURL || DEFAULT_USER_PROFILE.avatarUrl,
        timezone: DEFAULT_USER_PROFILE.timezone,
        streakCount: DEFAULT_USER_PROFILE.streakCount,
        pilotPersona: DEFAULT_USER_PROFILE.pilotPersona,
        weeklyFocusGoal: DEFAULT_USER_PROFILE.weeklyFocusGoal
      };

      await setDoc(userDocRef, newProfile);
      setUserProfile(newProfile);
    } catch (err: any) {
      console.error('Error syncing user profile directly from Firestore:', err);
      // Fallback local state if client Firestore fails
      setUserProfile({
        name: displayName || firebaseUser.displayName || 'Pilot Guest',
        email: firebaseUser.email || '',
        avatarUrl: firebaseUser.photoURL || DEFAULT_USER_PROFILE.avatarUrl,
        timezone: DEFAULT_USER_PROFILE.timezone,
        streakCount: DEFAULT_USER_PROFILE.streakCount,
        pilotPersona: DEFAULT_USER_PROFILE.pilotPersona,
        weeklyFocusGoal: DEFAULT_USER_PROFILE.weeklyFocusGoal
      });
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setError(null);
      if (user) {
        setCurrentUser(user);
        await syncUserProfile(user);
      } else {
        setCurrentUser(null);
        setUserProfile(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signUp = async (email: string, password: string, name: string) => {
    setLoading(true);
    setError(null);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await syncUserProfile(userCredential.user, name);
    } catch (err: any) {
      setError(err.message || 'Failed to sign up.');
      setLoading(false);
      throw err;
    }
  };

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      setError(err.message || 'Failed to sign in.');
      setLoading(false);
      throw err;
    }
  };

  const signInWithGoogle = async () => {
    setLoading(true);
    setError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      setError(err.message || 'Failed to sign in with Google.');
      setLoading(false);
      throw err;
    }
  };

  const resetPassword = async (email: string) => {
    setError(null);
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (err: any) {
      setError(err.message || 'Failed to send password reset email.');
      throw err;
    }
  };

  const logout = async () => {
    setLoading(true);
    setError(null);
    try {
      await signOut(auth);
    } catch (err: any) {
      setError(err.message || 'Failed to sign out.');
      setLoading(false);
      throw err;
    }
  };

  const updateUserProfile = async (updates: Partial<UserProfile>) => {
    if (!currentUser) return;
    try {
      const userDocRef = doc(db, 'users', currentUser.uid);
      const updatedProfile = { ...userProfile, ...updates } as UserProfile;
      await setDoc(userDocRef, updatedProfile, { merge: true });
      setUserProfile(updatedProfile);
    } catch (err: any) {
      console.error('Failed to update user profile directly in Firestore:', err);
      // Update local state even if DB write fails
      setUserProfile(prev => prev ? { ...prev, ...updates } : null);
    }
  };

  const value = {
    currentUser,
    userProfile,
    loading,
    error,
    signUp,
    signIn,
    signInWithGoogle,
    resetPassword,
    logout,
    updateUserProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
