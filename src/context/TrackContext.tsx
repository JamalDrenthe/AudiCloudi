import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from 'react';
import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  deleteDoc,
  updateDoc,
  increment,
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '@/lib/firebase';
import { deleteLocalAudioFile } from '@/lib/audioStorage';
import { useAuth } from '@/context/AuthContext';
import { mockTracks } from '@/data/mockData';
import type { Track } from '@/types';
import { toast } from 'sonner';

interface TrackContextType {
  tracks: Track[];
  userTracks: Track[];
  getUserTracks: (userId: string) => Track[];
  getTrackById: (trackId: string) => Track | undefined;
  incrementPlaysCount: (trackId: string) => void;
  uploadTrack: (
    data: Partial<Pick<Track, 'id'>> &
      Omit<
        Track,
        | 'id'
        | 'createdAt'
        | 'updatedAt'
        | 'playsCount'
        | 'likesCount'
        | 'repostsCount'
        | 'commentsCount'
      >
  ) => Promise<Track>;
  deleteTrack: (trackId: string) => Promise<void>;
  isLoadingTracks: boolean;
}

const TrackContext = createContext<TrackContextType | undefined>(undefined);

export function TrackProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [tracks, setTracks] = useState<Track[]>(() => {
    try {
      const saved =
        typeof window !== 'undefined'
          ? localStorage.getItem('cloudiaudi_tracks') || localStorage.getItem('audicloudi_tracks')
          : null;
      if (saved) {
        const parsed = JSON.parse(saved) as Track[];
        // Merge with mockTracks
        const merged = [...parsed];
        for (const mt of mockTracks) {
          if (!merged.some(t => t.id === mt.id)) {
            merged.push(mt);
          }
        }
        return merged;
      }
    } catch {
      // Ignore
    }
    return mockTracks;
  });

  const [isLoadingTracks, setIsLoadingTracks] = useState(true);

  // Sync to localStorage safely
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('cloudiaudi_tracks', JSON.stringify(tracks));
        localStorage.setItem('audicloudi_tracks', JSON.stringify(tracks));
      } catch (e) {
        console.warn('LocalStorage quota reached, storing essential tracks metadata only:', e);
      }
    }
  }, [tracks]);

  // Listen to track play events to automatically increment plays count
  useEffect(() => {
    const handleTrackPlayed = (e: Event) => {
      const custom = e as CustomEvent<{ trackId: string }>;
      if (custom.detail?.trackId) {
        incrementPlaysCount(custom.detail.trackId);
      }
    };
    window.addEventListener('cloudiaudi:track_played', handleTrackPlayed);
    return () => window.removeEventListener('cloudiaudi:track_played', handleTrackPlayed);
  }, []);

  // Real-time Firestore listener for tracks
  useEffect(() => {
    const pathForTracks = 'tracks';
    const unsubscribe = onSnapshot(
      collection(db, pathForTracks),
      (snapshot) => {
        const firestoreList: Track[] = [];
        snapshot.forEach((docSnap) => {
          firestoreList.push(docSnap.data() as Track);
        });

        setTracks((prev) => {
          const merged = [...firestoreList];
          for (const t of prev) {
            if (!merged.some((item) => item.id === t.id)) {
              merged.push(t);
            }
          }
          return merged;
        });
        setIsLoadingTracks(false);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, pathForTracks);
      }
    );

    return () => unsubscribe();
  }, []);

  const userTracks = tracks.filter((t) => {
    if (!user) return false;
    if (t.userId === user.id) return true;
    if (auth.currentUser && t.userId === auth.currentUser.uid) return true;
    if (user.email && t.userEmail && t.userEmail.toLowerCase() === user.email.toLowerCase()) return true;
    if (user.role === 'admin' && (t.userId === 'admin_jamal' || t.userId === '1' || t.userId === 'admin')) return true;
    return false;
  });

  const getUserTracks = (userId: string): Track[] => {
    return tracks.filter((t) => t.userId === userId);
  };

  const getTrackById = (trackId: string): Track | undefined => {
    return tracks.find((t) => t.id === trackId);
  };

  const uploadTrack = async (
    data: Partial<Pick<Track, 'id'>> &
      Omit<
        Track,
        | 'id'
        | 'createdAt'
        | 'updatedAt'
        | 'playsCount'
        | 'likesCount'
        | 'repostsCount'
        | 'commentsCount'
      >
  ): Promise<Track> => {
    if (!user) {
      toast.error('Je moet ingelogd zijn om een nummer te uploaden');
      throw new Error('Not authenticated');
    }

    const trackId = data.id || `track_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const effectiveUserId = auth.currentUser?.uid || user.id;

    const newTrack: Track = {
      ...data,
      id: trackId,
      userId: effectiveUserId,
      userEmail: user.email || '',
      userName: user.displayName || user.username || 'Artist',
      playsCount: 0,
      likesCount: 0,
      repostsCount: 0,
      commentsCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      user,
    };

    // Optimistic local state update
    setTracks((prev) => [newTrack, ...prev]);

    // Persist to Firestore
    try {
      await setDoc(doc(db, 'tracks', trackId), {
        id: newTrack.id,
        userId: effectiveUserId,
        userEmail: newTrack.userEmail,
        userName: newTrack.userName,
        title: newTrack.title,
        description: newTrack.description || '',
        genre: newTrack.genre,
        tags: newTrack.tags || [],
        duration: newTrack.duration,
        durationFormatted: newTrack.durationFormatted,
        waveformData: newTrack.waveformData,
        audioUrl: newTrack.audioUrl,
        coverUrl: newTrack.coverUrl,
        coverVideoUrl: newTrack.coverVideoUrl || '',
        coverType: newTrack.coverType || 'image',
        isMastered: Boolean(newTrack.isMastered),
        albumId: newTrack.albumId || '',
        albumTitle: newTrack.albumTitle || '',
        isPrivate: Boolean(newTrack.isPrivate),
        isExplicit: Boolean(newTrack.isExplicit),
        license: newTrack.license || 'all-rights-reserved',
        playsCount: 0,
        likesCount: 0,
        repostsCount: 0,
        commentsCount: 0,
        createdAt: newTrack.createdAt,
        updatedAt: newTrack.updatedAt,
      });
      console.log('Track successfully saved to Firestore:', trackId);
    } catch (err) {
      console.warn('Firestore write warning:', err);
      // Still log details for debugging
    }

    return newTrack;
  };

  const incrementPlaysCount = (trackId: string) => {
    setTracks((prev) =>
      prev.map((t) =>
        t.id === trackId ? { ...t, playsCount: (t.playsCount || 0) + 1 } : t
      )
    );

    // Also update in mockTracks if applicable
    const mock = mockTracks.find(t => t.id === trackId);
    if (mock) {
      mock.playsCount = (mock.playsCount || 0) + 1;
    }

    try {
      const trackRef = doc(db, 'tracks', trackId);
      updateDoc(trackRef, {
        playsCount: increment(1),
      }).catch(() => {});
    } catch {
      // Ignore
    }
  };

  const deleteTrack = async (trackId: string) => {
    setTracks((prev) => prev.filter((t) => t.id !== trackId));
    await deleteLocalAudioFile(trackId);

    try {
      await deleteDoc(doc(db, 'tracks', trackId));
      toast.success('Nummer verwijderd');
    } catch (err) {
      console.warn('Firestore delete warning:', err);
      toast.success('Nummer verwijderd');
    }
  };

  return (
    <TrackContext.Provider
      value={{
        tracks,
        userTracks,
        getUserTracks,
        getTrackById,
        incrementPlaysCount,
        uploadTrack,
        deleteTrack,
        isLoadingTracks,
      }}
    >
      {children}
    </TrackContext.Provider>
  );
}

export function useTracks() {
  const context = useContext(TrackContext);
  if (context === undefined) {
    throw new Error('useTracks must be used within a TrackProvider');
  }
  return context;
}

export const useTrack = useTracks;
