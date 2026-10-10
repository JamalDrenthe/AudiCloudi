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
  updateDoc,
  deleteDoc,
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '@/lib/firebase';
import { useAuth } from '@/context/AuthContext';
import { mockPlaylists, mockTracks } from '@/data/mockData';
import type { Playlist, Track } from '@/types';
import { toast } from 'sonner';

interface PlaylistContextType {
  playlists: Playlist[];
  userPlaylists: Playlist[];
  createPlaylist: (
    title: string,
    description?: string,
    isPublic?: boolean,
    initialTrackIds?: string[],
    coverUrl?: string,
    coverVideoUrl?: string,
    coverType?: 'image' | 'video',
    type?: 'playlist' | 'album'
  ) => Promise<Playlist>;
  updatePlaylist: (playlistId: string, updates: Partial<Playlist>) => Promise<void>;
  deletePlaylist: (playlistId: string) => Promise<void>;
  addTrackToPlaylist: (playlistId: string, trackId: string) => Promise<void>;
  removeTrackFromPlaylist: (playlistId: string, trackId: string) => Promise<void>;
  isTrackInPlaylist: (playlistId: string, trackId: string) => boolean;
  getPlaylistById: (playlistId: string) => Playlist | undefined;
  getTracksForPlaylist: (playlist: Playlist) => Track[];
  selectedTrackForPlaylist: Track | null;
  openAddToPlaylistModal: (track: Track) => void;
  closeAddToPlaylistModal: () => void;
}

const PlaylistContext = createContext<PlaylistContextType | undefined>(undefined);

// Initial enriched mock playlists with trackIds
const initialEnrichedPlaylists: Playlist[] = mockPlaylists.map((p, idx) => ({
  ...p,
  trackIds: p.trackIds || mockTracks.slice(idx * 2, idx * 2 + 3).map(t => t.id),
  tracksCount: p.trackIds?.length || 3,
}));

export function PlaylistProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [playlists, setPlaylists] = useState<Playlist[]>(() => {
    try {
      const saved = typeof window !== 'undefined' ? localStorage.getItem('audicloudi_playlists') : null;
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // Ignore
    }
    return initialEnrichedPlaylists;
  });

  const [selectedTrackForPlaylist, setSelectedTrackForPlaylist] = useState<Track | null>(null);

  // Sync to localStorage whenever playlists change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('audicloudi_playlists', JSON.stringify(playlists));
    }
  }, [playlists]);

  // Firestore real-time listener for playlists collection
  useEffect(() => {
    const pathForPlaylists = 'playlists';
    const unsubscribe = onSnapshot(
      collection(db, pathForPlaylists),
      (snapshot) => {
        const firestoreList: Playlist[] = [];
        snapshot.forEach((docSnap) => {
          firestoreList.push(docSnap.data() as Playlist);
        });

        if (firestoreList.length > 0) {
          setPlaylists((prev) => {
            const combined = [...firestoreList];
            for (const item of prev) {
              if (!combined.some((p) => p.id === item.id)) {
                combined.push(item);
              }
            }
            return combined;
          });
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, pathForPlaylists);
      }
    );

    return () => unsubscribe();
  }, []);

  const userPlaylists = playlists.filter(
    (p) => user && (p.userId === user.id || (user.role === 'admin' && p.userId.startsWith('admin')))
  );

  const getPlaylistById = (playlistId: string): Playlist | undefined => {
    return playlists.find((p) => p.id === playlistId);
  };

  const getTracksForPlaylist = (playlist: Playlist): Track[] => {
    if (!playlist.trackIds || playlist.trackIds.length === 0) return [];
    let allKnownTracks = mockTracks;
    try {
      const saved = typeof window !== 'undefined' ? localStorage.getItem('audicloudi_tracks') : null;
      if (saved) {
        const parsed = JSON.parse(saved) as Track[];
        const combined = [...parsed];
        for (const mt of mockTracks) {
          if (!combined.some(t => t.id === mt.id)) {
            combined.push(mt);
          }
        }
        allKnownTracks = combined;
      }
    } catch {
      // Fallback
    }

    return playlist.trackIds
      .map((tid) => allKnownTracks.find((t) => t.id === tid))
      .filter((t): t is Track => Boolean(t));
  };

  const isTrackInPlaylist = (playlistId: string, trackId: string): boolean => {
    const pl = getPlaylistById(playlistId);
    return Boolean(pl?.trackIds?.includes(trackId));
  };

  const createPlaylist = async (
    title: string,
    description: string = '',
    isPublic: boolean = true,
    initialTrackIds: string[] = [],
    customCoverUrl?: string,
    coverVideoUrl?: string,
    coverType: 'image' | 'video' = 'image',
    type: 'playlist' | 'album' = 'playlist'
  ): Promise<Playlist> => {
    if (!user) {
      toast.error('Je moet ingelogd zijn om een afspeellijst of album aan te maken');
      throw new Error('Not authenticated');
    }

    const playlistId = `${type === 'album' ? 'alb' : 'pl'}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const randomCovers = [
      'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500&h=500&fit=crop',
      'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500&h=500&fit=crop',
      'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&h=500&fit=crop',
      'https://images.unsplash.com/photo-1493225255756-d9584f8606e9?w=500&h=500&fit=crop',
    ];
    const coverUrl = customCoverUrl || randomCovers[Math.floor(Math.random() * randomCovers.length)];

    const newPlaylist: Playlist = {
      id: playlistId,
      userId: user.id,
      title: title.trim(),
      description: description.trim(),
      isPublic,
      coverUrl,
      coverVideoUrl,
      coverType,
      type,
      tracksCount: initialTrackIds.length,
      trackIds: initialTrackIds,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      user,
    };

    // Optimistic update
    setPlaylists((prev) => [newPlaylist, ...prev]);

    // Firestore persistence
    try {
      await setDoc(doc(db, 'playlists', playlistId), {
        id: playlistId,
        userId: auth.currentUser?.uid || user.id,
        title: newPlaylist.title,
        description: newPlaylist.description,
        isPublic: newPlaylist.isPublic,
        coverUrl: newPlaylist.coverUrl,
        coverVideoUrl: newPlaylist.coverVideoUrl || '',
        coverType: newPlaylist.coverType || 'image',
        type: newPlaylist.type || 'playlist',
        tracksCount: newPlaylist.tracksCount,
        trackIds: newPlaylist.trackIds,
        createdAt: newPlaylist.createdAt,
        updatedAt: newPlaylist.updatedAt,
      });
      toast.success(`${type === 'album' ? 'Album' : 'Afspeellijst'} "${newPlaylist.title}" succesvol aangemaakt!`);
    } catch (err) {
      console.warn('Could not save playlist to Firestore:', err);
      toast.success(`${type === 'album' ? 'Album' : 'Afspeellijst'} "${newPlaylist.title}" aangemaakt!`);
    }

    return newPlaylist;
  };

  const updatePlaylist = async (playlistId: string, updates: Partial<Playlist>) => {
    setPlaylists((prev) =>
      prev.map((p) =>
        p.id === playlistId
          ? { ...p, ...updates, updatedAt: new Date().toISOString() }
          : p
      )
    );

    try {
      await updateDoc(doc(db, 'playlists', playlistId), {
        ...updates,
        updatedAt: new Date().toISOString(),
      });
      toast.success('Afspeellijst bijgewerkt');
    } catch (err) {
      console.warn('Firestore update notice:', err);
      toast.success('Afspeellijst bijgewerkt');
    }
  };

  const deletePlaylist = async (playlistId: string) => {
    const pl = getPlaylistById(playlistId);
    setPlaylists((prev) => prev.filter((p) => p.id !== playlistId));

    try {
      await deleteDoc(doc(db, 'playlists', playlistId));
      toast.success(`Afspeellijst "${pl?.title || ''}" verwijderd`);
    } catch (err) {
      console.warn('Firestore delete notice:', err);
      toast.success('Afspeellijst verwijderd');
    }
  };

  const addTrackToPlaylist = async (playlistId: string, trackId: string) => {
    const pl = getPlaylistById(playlistId);
    if (!pl) return;

    const currentTrackIds = pl.trackIds || [];
    if (currentTrackIds.includes(trackId)) {
      toast.info('Dit nummer staat al in deze afspeellijst');
      return;
    }

    const nextTrackIds = [...currentTrackIds, trackId];
    const track = mockTracks.find(t => t.id === trackId);
    const coverUrl = pl.coverUrl || track?.coverUrl || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500&h=500&fit=crop';

    setPlaylists((prev) =>
      prev.map((p) =>
        p.id === playlistId
          ? {
              ...p,
              trackIds: nextTrackIds,
              tracksCount: nextTrackIds.length,
              coverUrl,
              updatedAt: new Date().toISOString(),
            }
          : p
      )
    );

    try {
      await updateDoc(doc(db, 'playlists', playlistId), {
        trackIds: nextTrackIds,
        tracksCount: nextTrackIds.length,
        coverUrl,
        updatedAt: new Date().toISOString(),
      });
      toast.success(`Toegevoegd aan "${pl.title}"!`);
    } catch (err) {
      console.warn('Firestore update notice:', err);
      toast.success(`Toegevoegd aan "${pl.title}"!`);
    }
  };

  const removeTrackFromPlaylist = async (playlistId: string, trackId: string) => {
    const pl = getPlaylistById(playlistId);
    if (!pl) return;

    const currentTrackIds = pl.trackIds || [];
    const nextTrackIds = currentTrackIds.filter((id) => id !== trackId);

    setPlaylists((prev) =>
      prev.map((p) =>
        p.id === playlistId
          ? {
              ...p,
              trackIds: nextTrackIds,
              tracksCount: nextTrackIds.length,
              updatedAt: new Date().toISOString(),
            }
          : p
      )
    );

    try {
      await updateDoc(doc(db, 'playlists', playlistId), {
        trackIds: nextTrackIds,
        tracksCount: nextTrackIds.length,
        updatedAt: new Date().toISOString(),
      });
      toast.success('Nummer verwijderd uit afspeellijst');
    } catch (err) {
      console.warn('Firestore update notice:', err);
      toast.success('Nummer verwijderd uit afspeellijst');
    }
  };

  const openAddToPlaylistModal = (track: Track) => {
    setSelectedTrackForPlaylist(track);
  };

  const closeAddToPlaylistModal = () => {
    setSelectedTrackForPlaylist(null);
  };

  return (
    <PlaylistContext.Provider
      value={{
        playlists,
        userPlaylists,
        createPlaylist,
        updatePlaylist,
        deletePlaylist,
        addTrackToPlaylist,
        removeTrackFromPlaylist,
        isTrackInPlaylist,
        getPlaylistById,
        getTracksForPlaylist,
        selectedTrackForPlaylist,
        openAddToPlaylistModal,
        closeAddToPlaylistModal,
      }}
    >
      {children}
    </PlaylistContext.Provider>
  );
}

export function usePlaylist() {
  const context = useContext(PlaylistContext);
  if (context === undefined) {
    throw new Error('usePlaylist must be used within a PlaylistProvider');
  }
  return context;
}
