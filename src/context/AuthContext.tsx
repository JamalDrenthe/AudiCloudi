import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import {
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  type User as FirebaseUser,
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db, googleProvider, handleFirestoreError, OperationType } from '@/lib/firebase';
import type { User, AuthState, LoginFormData, RegisterFormData } from '@/types';
import { mockUsers, getUserById } from '@/data/mockData';

interface AuthContextType extends AuthState {
  login: (data: LoginFormData) => Promise<boolean>;
  loginWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  loginAsAdmin: () => void;
  register: (data: RegisterFormData) => Promise<boolean>;
  logout: () => Promise<void>;
  updateUser: (user: User) => Promise<void>;
  followUser: (userId: string) => void;
  unfollowUser: (userId: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(() => {
    try {
      const savedUser = typeof window !== 'undefined' ? localStorage.getItem('audicloudi_user') : null;
      if (savedUser) {
        const user = JSON.parse(savedUser);
        return {
          user,
          isAuthenticated: true,
          isLoading: false,
        };
      }
    } catch {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('audicloudi_user');
      }
    }
    return {
      user: null,
      isAuthenticated: false,
      isLoading: true,
    };
  });

  // Listen to Firebase auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser: FirebaseUser | null) => {
      if (fbUser) {
        const safeUsername = (fbUser.email?.split('@')[0] || `user_${fbUser.uid.slice(0, 5)}`).replace(/[^a-zA-Z0-9_]/g, '_');
        const fallbackUser: User = {
          id: fbUser.uid,
          email: fbUser.email || '',
          username: safeUsername.slice(0, 40),
          displayName: fbUser.displayName || safeUsername,
          bio: '',
          avatarUrl: fbUser.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${fbUser.uid}`,
          bannerUrl: 'https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=1200&h=400&fit=crop',
          role: (fbUser.email === 'js.drenthe@gmail.com') ? 'admin' : 'user',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          followersCount: 0,
          followingCount: 0,
          tracksCount: 0,
        };

        const userDocRef = doc(db, 'users', fbUser.uid);
        try {
          const docSnap = await getDoc(userDocRef);
          if (docSnap.exists()) {
            const userData = docSnap.data() as User;
            localStorage.setItem('audicloudi_user', JSON.stringify(userData));
            setState({
              user: userData,
              isAuthenticated: true,
              isLoading: false,
            });
            return;
          } else {
            try {
              await setDoc(userDocRef, fallbackUser);
            } catch (writeErr) {
              console.warn('Could not persist user to Firestore:', writeErr);
            }
          }
        } catch (readErr) {
          console.warn('Could not fetch user from Firestore:', readErr);
        }

        // Set user state from Firebase auth even if Firestore read was skipped/failed
        localStorage.setItem('audicloudi_user', JSON.stringify(fallbackUser));
        setState({
          user: fallbackUser,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        // Fallback to local storage if not logged in with Firebase
        const savedUser = localStorage.getItem('audicloudi_user');
        if (savedUser) {
          try {
            const user = JSON.parse(savedUser);
            setState({
              user,
              isAuthenticated: true,
              isLoading: false,
            });
            return;
          } catch {
            localStorage.removeItem('audicloudi_user');
          }
        }
        setState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }
    });

    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      await signInWithPopup(auth, googleProvider);
      return { success: true };
    } catch (error: unknown) {
      console.error('Google Sign In error:', error);
      const fbErr = error as { code?: string; message?: string };
      const code = fbErr.code || '';
      const hostname = typeof window !== 'undefined' ? window.location.hostname : 'run.app';
      
      let friendlyMessage = fbErr.message || 'Google inloggen mislukt';
      if (code === 'auth/unauthorized-domain') {
        friendlyMessage = `auth/unauthorized-domain: Het domein "${hostname}" staat nog niet in de lijst met Authorized domains in de Firebase Console. Voeg dit domein toe in Firebase Console onder Authentication > Settings > Authorized domains.`;
      } else if (code === 'auth/operation-not-allowed') {
        friendlyMessage = 'auth/operation-not-allowed: Google Sign In is nog niet ingeschakeld in de Firebase Console onder Authentication > Sign in method.';
      } else if (code === 'auth/popup-blocked') {
        friendlyMessage = 'auth/popup-blocked: Het inlogvenster is geblokkeerd door de browser. Schakel de popupblokkering uit voor deze website.';
      } else if (code === 'auth/popup-closed-by-user') {
        friendlyMessage = 'Inlogvenster is gesloten voor voltooiing.';
      } else if (code === 'auth/cancelled-popup-request') {
        friendlyMessage = 'Er is al een inlogverzoek actief.';
      }
      
      return { success: false, error: friendlyMessage };
    }
  };

  const loginAsAdmin = () => {
    const adminUser: User = {
      id: 'admin_jamal',
      email: 'js.drenthe@gmail.com',
      username: 'js_drenthe',
      displayName: 'Jamal Drenthe',
      bio: 'Administrator & Muziekliefhebber van AudiCloudi',
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop',
      bannerUrl: 'https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=1200&h=400&fit=crop',
      role: 'admin',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      followersCount: 1250,
      followingCount: 42,
      tracksCount: 8,
    };
    localStorage.setItem('audicloudi_user', JSON.stringify(adminUser));
    setState({
      user: adminUser,
      isAuthenticated: true,
      isLoading: false,
    });
  };

  const login = async (data: LoginFormData): Promise<boolean> => {
    // If logging in as admin email
    if (data.email === 'js.drenthe@gmail.com') {
      loginAsAdmin();
      return true;
    }

    const user = mockUsers.find(
      u => u.email === data.email && data.password === 'password'
    );

    if (user) {
      localStorage.setItem('audicloudi_user', JSON.stringify(user));
      setState({
        user,
        isAuthenticated: true,
        isLoading: false,
      });
      return true;
    }
    return false;
  };

  const register = async (data: RegisterFormData): Promise<boolean> => {
    const newUser: User = {
      id: String(mockUsers.length + 1),
      email: data.email,
      username: data.username,
      displayName: data.username,
      bio: '',
      avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.username}`,
      bannerUrl: 'https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=1200&h=400&fit=crop',
      role: data.email === 'js.drenthe@gmail.com' ? 'admin' : 'user',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      followersCount: 0,
      followingCount: 0,
      tracksCount: 0,
    };

    mockUsers.push(newUser);
    localStorage.setItem('audicloudi_user', JSON.stringify(newUser));
    setState({
      user: newUser,
      isAuthenticated: true,
      isLoading: false,
    });
    return true;
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch {
      // Ignore
    }
    localStorage.removeItem('audicloudi_user');
    setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });
  };

  const updateUser = async (updatedUser: User) => {
    if (auth.currentUser && auth.currentUser.uid === updatedUser.id) {
      const userDocRef = doc(db, 'users', updatedUser.id);
      try {
        await updateDoc(userDocRef, {
          displayName: updatedUser.displayName,
          bio: updatedUser.bio,
          avatarUrl: updatedUser.avatarUrl,
          bannerUrl: updatedUser.bannerUrl,
          updatedAt: new Date().toISOString(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `users/${updatedUser.id}`);
      }
    }
    const index = mockUsers.findIndex(u => u.id === updatedUser.id);
    if (index !== -1) {
      mockUsers[index] = updatedUser;
    }
    localStorage.setItem('audicloudi_user', JSON.stringify(updatedUser));
    setState(prev => ({ ...prev, user: updatedUser }));
  };

  const followUser = (userId: string) => {
    if (state.user) {
      const targetUser = getUserById(userId);
      if (targetUser) {
        targetUser.followersCount++;
        const updatedUser = { ...state.user, followingCount: state.user.followingCount + 1 };
        updateUser(updatedUser);
      }
    }
  };

  const unfollowUser = (userId: string) => {
    if (state.user) {
      const targetUser = getUserById(userId);
      if (targetUser) {
        targetUser.followersCount--;
        const updatedUser = { ...state.user, followingCount: state.user.followingCount - 1 };
        updateUser(updatedUser);
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        loginWithGoogle,
        loginAsAdmin,
        register,
        logout,
        updateUser,
        followUser,
        unfollowUser,
      }}
    >
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
