import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { UserProfile, UserRole } from '../types';
import { 
  getUserProfile, 
  createOrUpdateUserProfile, 
  signOutUser, 
  loginWithEmail,
  registerWithEmail 
} from '../services/authService';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  isAdmin: boolean;
  refreshProfile: () => Promise<UserProfile | null>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('routemate_theme');
    if (saved === 'dark' || saved === 'light') return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('routemate_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const refreshProfile = async (): Promise<UserProfile | null> => {
    if (auth.currentUser) {
      try {
        await auth.currentUser.reload();
      } catch (e) {
        // user reload error
      }
      const currentUser = auth.currentUser;
      setUser(currentUser);
      if (currentUser) {
        let p = await getUserProfile(currentUser.uid);
        if (p) {
          // If email verification changed in Auth, update profile object
          if (currentUser.emailVerified && !p.emailVerified) {
            p = await createOrUpdateUserProfile(currentUser, { emailVerified: true });
          }
          setProfile(p);
          return p;
        } else {
          const created = await createOrUpdateUserProfile(currentUser);
          setProfile(created);
          return created;
        }
      }
    }
    setProfile(null);
    return null;
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        try {
          let p = await getUserProfile(firebaseUser.uid);
          if (!p) {
            p = await createOrUpdateUserProfile(firebaseUser);
          } else if (firebaseUser.emailVerified && !p.emailVerified) {
            p = await createOrUpdateUserProfile(firebaseUser, { emailVerified: true });
          }
          setProfile(p);
        } catch (error) {
          console.error('Error syncing profile with Firestore:', error);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signOut = async () => {
    try {
      await signOutUser();
    } catch (e) {
      console.warn('Sign out warning:', e);
    }
    setUser(null);
    setProfile(null);
  };

  const isAdmin = Boolean(
    profile?.role === 'admin' ||
    user?.email === 'admin@routemate.com' ||
    user?.email === 'rishidubeyji68@gmail.com'
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        theme,
        toggleTheme,
        isAdmin,
        refreshProfile,
        signOut
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
