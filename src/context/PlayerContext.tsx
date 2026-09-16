import { createContext, useContext, useState, useRef, useEffect, type ReactNode } from 'react';
import type { Track, PlayerState } from '@/types';

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
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export function PlayerProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

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

  // Initialize audio element
  useEffect(() => {
    audioRef.current = new Audio();
    audioRef.current.volume = state.volume;

    const audio = audioRef.current;

    const handleTimeUpdate = () => {
      setState(prev => ({ ...prev, currentTime: audio.currentTime }));
    };

    const handleLoadedMetadata = () => {
      setState(prev => ({ ...prev, duration: audio.duration }));
    };

    const handleEnded = () => {
      handleNextTrack();
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
      audio.pause();
    };
  }, []);

  // Update audio source when track changes
  useEffect(() => {
    if (audioRef.current && state.currentTrack) {
      audioRef.current.src = state.currentTrack.audioUrl;
      if (state.isPlaying) {
        audioRef.current.play().catch(() => {
          setState(prev => ({ ...prev, isPlaying: false }));
        });
      }
    }
  }, [state.currentTrack?.id]);

  // Handle play/pause
  useEffect(() => {
    if (audioRef.current) {
      if (state.isPlaying) {
        audioRef.current.play().catch(() => {
          setState(prev => ({ ...prev, isPlaying: false }));
        });
      } else {
        audioRef.current.pause();
      }
    }
  }, [state.isPlaying]);

  // Handle volume changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = state.isMuted ? 0 : state.volume;
    }
  }, [state.volume, state.isMuted]);

  const playTrack = (track: Track) => {
    setState(prev => ({
      ...prev,
      currentTrack: track,
      isPlaying: true,
      currentTime: 0,
    }));
  };

  const pause = () => {
    setState(prev => ({ ...prev, isPlaying: false }));
  };

  const resume = () => {
    setState(prev => ({ ...prev, isPlaying: true }));
  };

  const togglePlay = () => {
    setState(prev => ({ ...prev, isPlaying: !prev.isPlaying }));
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
    setState(prev => ({
      ...prev,
      queue: tracks,
      queueIndex: startIndex,
      currentTrack: tracks[startIndex],
      isPlaying: true,
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
