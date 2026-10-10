import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import {
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  type User as FirebaseUser,
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { auth, db, googleProvider, handleFirestoreError, OperationType } from '@/lib/firebase';
import type { User, AuthState, LoginFormData, RegisterFormData, DirectMessage } from '@/types';
import { mockUsers, getUserById } from '@/data/mockData';

interface AuthContextType extends AuthState {
  login: (data: LoginFormData) => Promise<boolean>;
  loginWithGoogle: () => Promise<{ success: boolean; error?: string }>;
  loginAsAdmin: () => void;
  register: (data: RegisterFormData) => Promise<boolean>;
  logout: () => Promise<void>;
  updateUser: (user: User) => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<void>;
  followingIds: string[];
  followUser: (userId: string) => Promise<void>;
  unfollowUser: (userId: string) => Promise<void>;
  isFollowing: (userId: string) => boolean;
  repostedTrackIds: string[];
  toggleRepost: (trackId: string) => boolean;
  isReposted: (trackId: string) => boolean;
  likedTrackIds: string[];
  toggleLike: (trackId: string) => boolean;
  isLiked: (trackId: string) => boolean;
  directMessages: DirectMessage[];
  sendDirectMessage: (recipientIds: string[], recipientNames: string[], content: string) => Promise<void>;
  plan: 'gebruiker' | 'artiest' | 'label';
  credits: number;
  monthlyUploadsCount: number;
  monthlyUploadsLimit: number;
  updatePlan: (plan: 'gebruiker' | 'artiest' | 'label') => Promise<void>;
  deductCredits: (amount: number) => boolean;
  addCredits: (amount: number) => Promise<void>;
  incrementUploadsCount: (count?: number) => void;
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

  const [followingIds, setFollowingIds] = useState<string[]>(() => {
    try {
      const saved = typeof window !== 'undefined' ? localStorage.getItem('audicloudi_following') : null;
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // Fallback
    }
    return ['1', '2'];
  });

  const [repostedTrackIds, setRepostedTrackIds] = useState<string[]>(() => {
    try {
      const saved = typeof window !== 'undefined' ? localStorage.getItem('cloudiaudi_reposts') : null;
      if (saved) return JSON.parse(saved);
    } catch {
      // Fallback
    }
    return ['1', '3'];
  });

  const [likedTrackIds, setLikedTrackIds] = useState<string[]>(() => {
    try {
      const saved = typeof window !== 'undefined' ? localStorage.getItem('cloudiaudi_likes') : null;
      if (saved) return JSON.parse(saved);
    } catch {
      // Fallback
    }
    return ['1', '2', '4', '5'];
  });

  const [directMessages, setDirectMessages] = useState<DirectMessage[]>(() => {
    try {
      const saved = typeof window !== 'undefined' ? localStorage.getItem('cloudiaudi_messages') : null;
      if (saved) return JSON.parse(saved);
    } catch {
      // Fallback
    }
    return [
      {
        id: 'msg_1',
        senderId: '1',
        senderName: 'Luna Eclipse',
        senderAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
        recipientIds: ['admin_jamal', 'js_drenthe'],
        recipientNames: ['Jamal Drenthe'],
        content: 'Hey Jamal! Geweldige beat op je nieuwste track. Laten we binnenkort samenwerken aan een remix!',
        createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
      },
      {
        id: 'msg_2',
        senderId: '2',
        senderName: 'Marcus Vance',
        senderAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
        recipientIds: ['admin_jamal', 'js_drenthe'],
        recipientNames: ['Jamal Drenthe'],
        content: 'Welkom op CloudiAudi! Laat me weten als je feedback wilt op je mix & master.',
        createdAt: new Date(Date.now() - 3600000 * 24).toISOString(),
      },
    ];
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
      bio: 'Administrator & Muziekliefhebber van CloudiAudi',
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

  const isFollowing = (userId: string) => followingIds.includes(userId);

  const followUser = async (userId: string) => {
    if (followingIds.includes(userId)) return;
    const nextFollowing = [...followingIds, userId];
    setFollowingIds(nextFollowing);
    localStorage.setItem('audicloudi_following', JSON.stringify(nextFollowing));

    const targetUser = getUserById(userId);
    if (targetUser) {
      targetUser.followersCount++;
    }

    if (state.user) {
      const updatedUser = { ...state.user, followingCount: state.user.followingCount + 1 };
      updateUser(updatedUser);
    }

    if (auth.currentUser) {
      const followId = `follow_${auth.currentUser.uid}_${userId}`;
      try {
        await setDoc(doc(db, 'follows', followId), {
          id: followId,
          followerId: auth.currentUser.uid,
          followingId: userId,
          createdAt: new Date().toISOString(),
        });
      } catch (err) {
        console.warn('Could not persist follow to Firestore:', err);
      }
    }
  };

  const unfollowUser = async (userId: string) => {
    if (!followingIds.includes(userId)) return;
    const nextFollowing = followingIds.filter(id => id !== userId);
    setFollowingIds(nextFollowing);
    localStorage.setItem('audicloudi_following', JSON.stringify(nextFollowing));

    const targetUser = getUserById(userId);
    if (targetUser && targetUser.followersCount > 0) {
      targetUser.followersCount--;
    }

    if (state.user && state.user.followingCount > 0) {
      const updatedUser = { ...state.user, followingCount: state.user.followingCount - 1 };
      updateUser(updatedUser);
    }

    if (auth.currentUser) {
      const followId = `follow_${auth.currentUser.uid}_${userId}`;
      try {
        await deleteDoc(doc(db, 'follows', followId));
      } catch (err) {
        console.warn('Could not remove follow from Firestore:', err);
      }
    }
  };

  const currentPlan: 'gebruiker' | 'artiest' | 'label' = state.user?.plan || 'artiest';
  const currentCredits: number = state.user?.credits ?? (currentPlan === 'label' ? 200000 : currentPlan === 'gebruiker' ? 10000 : 50000);
  const currentMonthlyUploads: number = state.user?.monthlyUploadsCount ?? 0;
  const currentUploadsLimit: number = state.user?.monthlyUploadsLimit ?? (currentPlan === 'label' ? 50 : currentPlan === 'gebruiker' ? 0 : 10);

  const updatePlan = async (newPlan: 'gebruiker' | 'artiest' | 'label') => {
    if (!state.user) return;
    const planCredits = {
      gebruiker: 10000,
      artiest: 50000,
      label: 200000,
    };
    const planLimits = {
      gebruiker: 0,
      artiest: 10,
      label: 50,
    };
    const updatedUser: User = {
      ...state.user,
      plan: newPlan,
      credits: (state.user.credits || 0) + planCredits[newPlan],
      monthlyUploadsLimit: planLimits[newPlan],
      updatedAt: new Date().toISOString(),
    };
    await updateUser(updatedUser);
  };

  const deductCredits = (amount: number): boolean => {
    if (!state.user) return false;
    const current = state.user.credits ?? (state.user.plan === 'label' ? 200000 : state.user.plan === 'gebruiker' ? 10000 : 50000);
    if (current < amount) return false;
    const updatedUser: User = {
      ...state.user,
      credits: current - amount,
      updatedAt: new Date().toISOString(),
    };
    updateUser(updatedUser);
    return true;
  };

  const addCredits = async (amount: number) => {
    if (!state.user) return;
    const current = state.user.credits ?? 50000;
    const updatedUser: User = {
      ...state.user,
      credits: current + amount,
      updatedAt: new Date().toISOString(),
    };
    await updateUser(updatedUser);
  };

  const incrementUploadsCount = (count: number = 1) => {
    if (!state.user) return;
    const current = state.user.monthlyUploadsCount || 0;
    const updatedUser: User = {
      ...state.user,
      monthlyUploadsCount: current + count,
      updatedAt: new Date().toISOString(),
    };
    updateUser(updatedUser);
  };

  const toggleRepost = (trackId: string): boolean => {
    let next: string[];
    let isNowReposted = false;
    if (repostedTrackIds.includes(trackId)) {
      next = repostedTrackIds.filter(id => id !== trackId);
      isNowReposted = false;
    } else {
      next = [trackId, ...repostedTrackIds];
      isNowReposted = true;
    }
    setRepostedTrackIds(next);
    localStorage.setItem('cloudiaudi_reposts', JSON.stringify(next));

    if (state.user) {
      const updatedUser: User = { ...state.user, reposts: next };
      updateUser(updatedUser);
    }
    return isNowReposted;
  };

  const isReposted = (trackId: string) => repostedTrackIds.includes(trackId);

  const toggleLike = (trackId: string): boolean => {
    let next: string[];
    let isNowLiked = false;
    if (likedTrackIds.includes(trackId)) {
      next = likedTrackIds.filter(id => id !== trackId);
      isNowLiked = false;
    } else {
      next = [trackId, ...likedTrackIds];
      isNowLiked = true;
    }
    setLikedTrackIds(next);
    localStorage.setItem('cloudiaudi_likes', JSON.stringify(next));

    if (state.user) {
      const updatedUser: User = { ...state.user, likes: next };
      updateUser(updatedUser);
    }
    return isNowLiked;
  };

  const isLiked = (trackId: string) => likedTrackIds.includes(trackId);

  const updateProfile = async (updates: Partial<User>) => {
    if (!state.user) return;
    const updatedUser: User = {
      ...state.user,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    await updateUser(updatedUser);
  };

  const sendDirectMessage = async (recipientIds: string[], recipientNames: string[], content: string) => {
    const currentSenderId = state.user?.id || 'admin_jamal';
    const currentSenderName = state.user?.displayName || 'Jamal Drenthe';
    const currentSenderAvatar = state.user?.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop';

    const newMsg: DirectMessage = {
      id: `dm_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      senderId: currentSenderId,
      senderName: currentSenderName,
      senderAvatar: currentSenderAvatar,
      recipientIds,
      recipientNames,
      content: content.trim(),
      createdAt: new Date().toISOString(),
    };

    const nextMessages = [newMsg, ...directMessages];
    setDirectMessages(nextMessages);
    localStorage.setItem('cloudiaudi_messages', JSON.stringify(nextMessages));

    if (auth.currentUser) {
      try {
        await setDoc(doc(db, 'direct_messages', newMsg.id), newMsg);
      } catch (err) {
        console.warn('Could not save direct message to Firestore:', err);
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
        updateProfile,
        followingIds,
        followUser,
        unfollowUser,
        isFollowing,
        repostedTrackIds,
        toggleRepost,
        isReposted,
        likedTrackIds,
        toggleLike,
        isLiked,
        directMessages,
        sendDirectMessage,
        plan: currentPlan,
        credits: currentCredits,
        monthlyUploadsCount: currentMonthlyUploads,
        monthlyUploadsLimit: currentUploadsLimit,
        updatePlan,
        deductCredits,
        addCredits,
        incrementUploadsCount,
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
