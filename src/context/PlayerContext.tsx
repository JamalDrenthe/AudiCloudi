import { createContext, useContext, useState, useRef, useEffect, useCallback, type ReactNode } from 'react';
import type { Track, PlayerState } from '@/types';
import { getLocalAudioUrl, getAudioUrlSync } from '@/lib/audioStorage';
import { generateTrackAudio } from '@/lib/audioSynthesizer';

interface PlayerContextType extends PlayerState {
  playTrack: (track: Track) => void;
  pause: () => void;
  resume: () => void;
  togglePlay: () => void;
  seek: (time: number) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  nextTrack: () => void;
  previousTrack: () => void;
  addToQueue: (track: Track) => void;
  removeFromQueue: (index: number) => void;
  clearQueue: () => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  playQueue: (tracks: Track[], startIndex?: number) => void;
  shufflePlayQueue: (tracks: Track[]) => void;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export function PlayerProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const handleNextTrackRef = useRef<() => void>(() => {});

  const [state, setState] = useState<PlayerState>({
    currentTrack: null,
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 0.8,
    isMuted: false,
    queue: [],
    queueIndex: 0,
    isShuffled: false,
    repeatMode: 'none',
  });

  const currentLoadedTrackId = useRef<string | null>(null);
  const loadingTokenRef = useRef<number>(0);

  // Initialize audio element
  useEffect(() => {
    const audio = new Audio();
    audio.preload = 'auto';
    audio.volume = state.volume;
    audioRef.current = audio;

    const handleTimeUpdate = () => {
      setState(prev => ({ ...prev, currentTime: audio.currentTime }));
    };

    const handleLoadedMetadata = () => {
      if (audio.duration && !isNaN(audio.duration) && audio.duration > 0) {
        setState(prev => ({ ...prev, duration: audio.duration }));
      }
    };

    const handleEnded = () => {
      handleNextTrackRef.current();
    };

    const handleError = async () => {
      if (!state.currentTrack) return;
      try {
        const fallbackUrl = await generateTrackAudio(state.currentTrack);
        if (audioRef.current && audioRef.current.src !== fallbackUrl) {
          audioRef.current.src = fallbackUrl;
          if (state.isPlaying) {
            audioRef.current.play().catch(() => {});
          }
        }
      } catch {
        // Fallback catch
      }
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.pause();
      audio.src = '';
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Resolve best audio source URL for track
  const resolveAudioUrl = useCallback(async (track: Track): Promise<string> => {
    try {
      // 1. Check synchronous in-memory cache first (instant access for uploaded track)
      const syncUrl = getAudioUrlSync(track.id);
      if (syncUrl) return syncUrl;

      // 2. Check local IndexedDB storage (user uploaded audio file)
      const localUrl = await getLocalAudioUrl(track.id);
      if (localUrl) return localUrl;

      // 3. Check track.audioUrl if present and valid (including blob: and data: urls)
      const rawUrl = track.audioUrl;
      if (rawUrl && rawUrl.trim() !== '') {
        return rawUrl;
      }

      // 4. Generate deterministic studio audio only as last resort
      return await generateTrackAudio(track);
    } catch {
      return await generateTrackAudio(track);
    }
  }, []);

  // Coordinated audio lifecycle handler (prevents race conditions)
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (!state.currentTrack) {
      audio.pause();
      return;
    }

    const currentTrack = state.currentTrack;
    const shouldPlay = state.isPlaying;
    const token = ++loadingTokenRef.current;

    // When track changes, load its audio source
    if (currentLoadedTrackId.current !== currentTrack.id) {
      currentLoadedTrackId.current = currentTrack.id;

      // Stop previous track immediately so it cannot leak
      audio.pause();

      resolveAudioUrl(currentTrack).then((url) => {
        if (token !== loadingTokenRef.current || !audioRef.current) return;

        if (audioRef.current.src !== url) {
          audioRef.current.src = url;
          try {
            audioRef.current.currentTime = 0;
          } catch {
            // Ignore state errors if media isn't ready
          }
        }

        if (shouldPlay) {
          audioRef.current.play().catch(async () => {
            if (token !== loadingTokenRef.current || !audioRef.current) return;
            const fallback = await generateTrackAudio(currentTrack);
            if (audioRef.current.src !== fallback) {
              audioRef.current.src = fallback;
              audioRef.current.play().catch(() => {});
            }
          });
        }
      });
    } else {
      // Same track: coordinate play/pause
      if (shouldPlay) {
        if (!audio.src || audio.src === '' || audio.src === window.location.href) {
          resolveAudioUrl(currentTrack).then((url) => {
            if (token !== loadingTokenRef.current || !audioRef.current) return;
            audioRef.current.src = url;
            audioRef.current.play().catch(() => {});
          });
        } else {
          audio.play().catch(async () => {
            const fallback = await generateTrackAudio(currentTrack);
            if (audioRef.current && audioRef.current.src !== fallback) {
              audioRef.current.src = fallback;
              audioRef.current.play().catch(() => {});
            }
          });
        }
      } else {
        audio.pause();
      }
    }
  }, [state.currentTrack, state.isPlaying, resolveAudioUrl]);

  // Handle volume changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = state.isMuted ? 0 : state.volume;
    }
  }, [state.volume, state.isMuted]);

  const playTrack = (track: Track) => {
    const audio = audioRef.current;
    
    // Immediately stop old audio to prevent playing a different track
    if (audio) {
      audio.pause();
    }

    currentLoadedTrackId.current = track.id;

    // Check synchronous in-memory audio URL first
    const syncUrl = getAudioUrlSync(track.id) || (track.audioUrl && track.audioUrl.trim() !== '' ? track.audioUrl : null);

    if (audio && syncUrl) {
      if (audio.src !== syncUrl) {
        audio.src = syncUrl;
        try {
          audio.currentTime = 0;
        } catch {
          // Ignore
        }
      }
      audio.play().catch(() => {});
    } else if (audio) {
      // Clear src to ensure old audio never plays while resolving
      audio.src = '';
      resolveAudioUrl(track).then((resolvedUrl) => {
        if (!audioRef.current || currentLoadedTrackId.current !== track.id) return;
        audioRef.current.src = resolvedUrl;
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(() => {});
      });
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('cloudiaudi:track_played', { detail: { trackId: track.id } }));
    }

    setState(prev => ({
      ...prev,
      currentTrack: track,
      isPlaying: true,
      currentTime: 0,
      duration: track.duration || 180,
    }));
  };

  const pause = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setState(prev => ({ ...prev, isPlaying: false }));
  };

  const resume = () => {
    if (audioRef.current) {
      audioRef.current.play().catch(() => {});
    }
    setState(prev => ({ ...prev, isPlaying: true }));
  };

  const togglePlay = () => {
    setState(prev => {
      const nextPlaying = !prev.isPlaying;
      if (audioRef.current) {
        if (nextPlaying) {
          audioRef.current.play().catch(() => {});
        } else {
          audioRef.current.pause();
        }
      }
      return { ...prev, isPlaying: nextPlaying };
    });
  };

  const seek = (time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setState(prev => ({ ...prev, currentTime: time }));
    }
  };

  const setVolume = (volume: number) => {
    setState(prev => ({ ...prev, volume: Math.max(0, Math.min(1, volume)) }));
  };

  const toggleMute = () => {
    setState(prev => ({ ...prev, isMuted: !prev.isMuted }));
  };

  const handleNextTrack = () => {
    setState(prev => {
      if (prev.queue.length === 0) {
        if (prev.repeatMode === 'one' && prev.currentTrack) {
          return { ...prev, currentTime: 0, isPlaying: true };
        }
        return { ...prev, isPlaying: false };
      }

      let nextIndex = prev.queueIndex + 1;

      if (nextIndex >= prev.queue.length) {
        if (prev.repeatMode === 'all') {
          nextIndex = 0;
        } else {
          return { ...prev, isPlaying: false };
        }
      }

      return {
        ...prev,
        queueIndex: nextIndex,
        currentTrack: prev.queue[nextIndex],
        currentTime: 0,
        isPlaying: true,
      };
    });
  };

  handleNextTrackRef.current = handleNextTrack;

  const nextTrack = () => {
    handleNextTrack();
  };

  const previousTrack = () => {
    setState(prev => {
      if (prev.queue.length === 0) return prev;

      let prevIndex = prev.queueIndex - 1;

      if (prevIndex < 0) {
        if (prev.repeatMode === 'all') {
          prevIndex = prev.queue.length - 1;
        } else {
          prevIndex = 0;
        }
      }

      return {
        ...prev,
        queueIndex: prevIndex,
        currentTrack: prev.queue[prevIndex],
        currentTime: 0,
        isPlaying: true,
      };
    });
  };

  const addToQueue = (track: Track) => {
    setState(prev => ({
      ...prev,
      queue: [...prev.queue, track],
    }));
  };

  const removeFromQueue = (index: number) => {
    setState(prev => {
      const newQueue = [...prev.queue];
      newQueue.splice(index, 1);
      return {
        ...prev,
        queue: newQueue,
        queueIndex: index <= prev.queueIndex ? prev.queueIndex - 1 : prev.queueIndex,
      };
    });
  };

  const clearQueue = () => {
    setState(prev => ({
      ...prev,
      queue: [],
      queueIndex: 0,
    }));
  };

  const toggleShuffle = () => {
    setState(prev => {
      if (!prev.isShuffled) {
        // Shuffle the queue
        const shuffled = [...prev.queue].sort(() => Math.random() - 0.5);
        return {
          ...prev,
          queue: shuffled,
          isShuffled: true,
        };
      } else {
        // Unshuffle - restore original order (simplified - in real app would track original order)
        return {
          ...prev,
          isShuffled: false,
        };
      }
    });
  };

  const toggleRepeat = () => {
    setState(prev => ({
      ...prev,
      repeatMode: prev.repeatMode === 'none' ? 'all' : prev.repeatMode === 'all' ? 'one' : 'none',
    }));
  };

  const playQueue = (tracks: Track[], startIndex: number = 0) => {
    if (tracks.length === 0) return;
    playTrack(tracks[startIndex]);
    setState(prev => ({
      ...prev,
      queue: tracks,
      queueIndex: startIndex,
      currentTrack: tracks[startIndex],
      isPlaying: true,
      currentTime: 0,
    }));
  };

  const shufflePlayQueue = (tracks: Track[]) => {
    if (tracks.length === 0) return;
    const shuffled = [...tracks].sort(() => Math.random() - 0.5);
    playTrack(shuffled[0]);
    setState(prev => ({
      ...prev,
      queue: shuffled,
      queueIndex: 0,
      currentTrack: shuffled[0],
      isPlaying: true,
      isShuffled: true,
      currentTime: 0,
    }));
  };

  return (
    <PlayerContext.Provider
      value={{
        ...state,
        playTrack,
        pause,
        resume,
        togglePlay,
        seek,
        setVolume,
        toggleMute,
        nextTrack,
        previousTrack,
        addToQueue,
        removeFromQueue,
        clearQueue,
        toggleShuffle,
        toggleRepeat,
        playQueue,
        shufflePlayQueue,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const context = useContext(PlayerContext);
  if (context === undefined) {
    throw new Error('usePlayer must be used within a PlayerProvider');
  }
  return context;
}
