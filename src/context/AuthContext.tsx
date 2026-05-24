import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, isFirebaseConfigured } from '@/lib/firebase';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  updateProfile, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut 
} from 'firebase/auth';

export interface User {
  id: string;
  email: string;
  user_metadata?: {
    full_name?: string;
    avatar_url?: string;
  };
}

export type Session = any;

export interface Profile {
  id: string;
  email: string;
  isGuest: boolean;
  name: string;
  avatar_url: string;
  syncStatus: 'synced' | 'local' | 'syncing';
}

interface AuthContextType {
  user: User | null;
  guestUser: Profile | null;
  session: Session | null;
  loading: boolean;
  isGuest: boolean;
  login: (email: string, password: string) => Promise<{ error: any }>;
  signup: (email: string, password: string, fullName: string) => Promise<{ error: any }>;
  loginWithGoogle: (customEmail?: string, customName?: string) => Promise<{ error: any }>;
  continueAsGuest: (name?: string) => void;
  logout: () => Promise<void>;
  updateGuestProfile: (name: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [guestUser, setGuestUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(false);

  // Initialize Auth State
  useEffect(() => {
    // Check if Firebase has a valid operational configuration
    const isMock = !isFirebaseConfigured;

    if (isMock) {
      // Offline / Local Mock Auth engine
      const savedGuest = localStorage.getItem('studyvibe_guest');
      const savedAuth = localStorage.getItem('studyvibe_mock_auth');
      
      if (savedAuth) {
        const parsed = JSON.parse(savedAuth);
        setUser(parsed.user);
        setSession(parsed.session);
        setIsGuest(false);
      } else if (savedGuest) {
        const parsedGuest = JSON.parse(savedGuest);
        setGuestUser(parsedGuest);
        setIsGuest(true);
      } else {
        // Create default Guest identity automatically for a frictionless preview
        const guestId = 'guest_' + Math.random().toString(36).substring(2, 11);
        const defaultGuest: Profile = {
          id: guestId,
          email: 'guest@studyvibe.local',
          isGuest: true,
          name: 'Scholar ' + guestId.substring(6, 10).toUpperCase(),
          avatar_url: `https://api.dicebear.com/7.x/notionists/svg?seed=${guestId}`,
          syncStatus: 'local',
        };
        localStorage.setItem('studyvibe_guest', JSON.stringify(defaultGuest));
        setGuestUser(defaultGuest);
        setIsGuest(true);
      }
      setLoading(false);
    } else {
      // Live Firebase SDK connection
      const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
        if (firebaseUser) {
          const mappedUser: User = {
            id: firebaseUser.uid,
            email: firebaseUser.email || '',
            user_metadata: {
              full_name: firebaseUser.displayName || 'Learner',
              avatar_url: firebaseUser.photoURL || `https://api.dicebear.com/7.x/notionists/svg?seed=${firebaseUser.email || 'Study'}`
            }
          };
          setUser(mappedUser);
          setSession({ token: 'active-session' });
          setIsGuest(false);
          setGuestUser(null);
        } else {
          setUser(null);
          setSession(null);

          const savedGuest = localStorage.getItem('studyvibe_guest');
          if (savedGuest) {
            setGuestUser(JSON.parse(savedGuest));
            setIsGuest(true);
          } else {
            // Auto guest creation to guarantee smooth app experience
            const guestId = 'guest_' + Math.random().toString(36).substring(2, 11);
            const defaultGuest: Profile = {
              id: guestId,
              email: 'guest@studyvibe.local',
              isGuest: true,
              name: 'Scholar ' + guestId.substring(6, 10).toUpperCase(),
              avatar_url: `https://api.dicebear.com/7.x/notionists/svg?seed=${guestId}`,
              syncStatus: 'local',
            };
            localStorage.setItem('studyvibe_guest', JSON.stringify(defaultGuest));
            setGuestUser(defaultGuest);
            setIsGuest(true);
          }
        }
        setLoading(false);
      }, (error) => {
        console.warn('Firebase connection warning:', error);
        // Fallback robustly on errors/offline state and preserve local storage guest profile
        const savedGuest = localStorage.getItem('studyvibe_guest');
        if (savedGuest) {
          setGuestUser(JSON.parse(savedGuest));
          setIsGuest(true);
        }
        setLoading(false);
      });

      return () => unsubscribe();
    }
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    const isMock = !isFirebaseConfigured;

    if (isMock) {
      const mockUserDetails: User = {
        id: 'usr_' + Math.random().toString(36).substring(2, 11),
        email,
        user_metadata: { full_name: 'Noble Scholar' },
      };

      const mockSession = { token: 'mock-token' };

      localStorage.setItem('studyvibe_mock_auth', JSON.stringify({ user: mockUserDetails, session: mockSession }));
      localStorage.removeItem('studyvibe_guest');
      
      setUser(mockUserDetails);
      setSession(mockSession);
      setIsGuest(false);
      setGuestUser(null);
      setLoading(false);
      return { error: null };
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const mappedUser: User = {
        id: userCredential.user.uid,
        email: userCredential.user.email || '',
        user_metadata: {
          full_name: userCredential.user.displayName || 'Learner',
          avatar_url: userCredential.user.photoURL || `https://api.dicebear.com/7.x/notionists/svg?seed=${userCredential.user.email || 'Study'}`
        }
      };
      
      setUser(mappedUser);
      setSession({ token: 'firebase-token' });
      setIsGuest(false);
      setGuestUser(null);
      localStorage.removeItem('studyvibe_guest');
      return { error: null };
    } catch (err: any) {
      setLoading(false);
      return { error: err };
    }
  };

  const signup = async (email: string, password: string, fullName: string) => {
    setLoading(true);
    const isMock = !isFirebaseConfigured;

    if (isMock) {
      const mockUserDetails: User = {
        id: 'usr_' + Math.random().toString(36).substring(2, 11),
        email,
        user_metadata: { full_name: fullName },
      };

      const mockSession = { token: 'mock-token' };

      localStorage.setItem('studyvibe_mock_auth', JSON.stringify({ user: mockUserDetails, session: mockSession }));
      localStorage.removeItem('studyvibe_guest');
      
      setUser(mockUserDetails);
      setSession(mockSession);
      setIsGuest(false);
      setGuestUser(null);
      setLoading(false);
      return { error: null };
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, { displayName: fullName });
      
      const mappedUser: User = {
        id: userCredential.user.uid,
        email: userCredential.user.email || '',
        user_metadata: {
          full_name: fullName,
          avatar_url: `https://api.dicebear.com/7.x/notionists/svg?seed=${userCredential.user.email || 'Study'}`
        }
      };

      setUser(mappedUser);
      setSession({ token: 'firebase-token' });
      setIsGuest(false);
      setGuestUser(null);
      localStorage.removeItem('studyvibe_guest');
      return { error: null };
    } catch (err: any) {
      setLoading(false);
      return { error: err };
    }
  };

  const loginWithGoogle = async (customEmail?: string, customName?: string) => {
    const isMock = !isFirebaseConfigured;
    
    if (isMock) {
      const email = customEmail || 'google.scholar@studyvibe.org';
      const name = customName || 'Google Scholar';
      const mockUserDetails: User = {
        id: 'google_usr_' + Math.random().toString(36).substring(2, 11),
        email: email,
        user_metadata: { 
          full_name: name,
          avatar_url: `https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(name)}`
        },
      };

      const mockSession = { token: 'google-mock-token' };

      localStorage.setItem('studyvibe_mock_auth', JSON.stringify({ user: mockUserDetails, session: mockSession }));
      localStorage.removeItem('studyvibe_guest');
      
      setUser(mockUserDetails);
      setSession(mockSession);
      setIsGuest(false);
      setGuestUser(null);
      return { error: null };
    }

    try {
      const provider = new GoogleAuthProvider();
      const userCredential = await signInWithPopup(auth, provider);
      const mappedUser: User = {
        id: userCredential.user.uid,
        email: userCredential.user.email || '',
        user_metadata: {
          full_name: userCredential.user.displayName || 'Learner',
          avatar_url: userCredential.user.photoURL || `https://api.dicebear.com/7.x/notionists/svg?seed=${userCredential.user.email || 'Study'}`
        }
      };
      
      setUser(mappedUser);
      setSession({ token: 'firebase-token' });
      setIsGuest(false);
      setGuestUser(null);
      localStorage.removeItem('studyvibe_guest');
      return { error: null };
    } catch (err: any) {
      return { error: err };
    }
  };

  const continueAsGuest = (customName?: string) => {
    const guestId = guestUser?.id || 'guest_' + Math.random().toString(36).substring(2, 11);
    const resolvedName = customName || guestUser?.name || 'Scholar ' + guestId.substring(6, 10).toUpperCase();
    
    const configuredGuest: Profile = {
      id: guestId,
      email: 'guest@studyvibe.local',
      isGuest: true,
      name: resolvedName,
      avatar_url: `https://api.dicebear.com/7.x/notionists/svg?seed=${guestId}`,
      syncStatus: 'local',
    };

    localStorage.setItem('studyvibe_guest', JSON.stringify(configuredGuest));
    localStorage.removeItem('studyvibe_mock_auth');
    
    setGuestUser(configuredGuest);
    setUser(null);
    setSession(null);
    setIsGuest(true);
  };

  const logout = async () => {
    setLoading(true);
    localStorage.removeItem('studyvibe_mock_auth');
    
    const isMock = !isFirebaseConfigured;
    if (!isMock) {
      await signOut(auth);
    }

    setUser(null);
    setSession(null);
    
    const savedGuest = localStorage.getItem('studyvibe_guest');
    if (savedGuest) {
      setGuestUser(JSON.parse(savedGuest));
      setIsGuest(true);
    } else {
      continueAsGuest();
    }
    setLoading(false);
  };

  const updateGuestProfile = (name: string) => {
    if (guestUser) {
      const updated = { ...guestUser, name };
      localStorage.setItem('studyvibe_guest', JSON.stringify(updated));
      setGuestUser(updated);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      guestUser,
      session,
      loading,
      isGuest,
      login,
      signup,
      loginWithGoogle,
      continueAsGuest,
      logout,
      updateGuestProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
