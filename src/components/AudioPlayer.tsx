import { useState, useEffect } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Repeat,
  Repeat1,
  Shuffle,
  ListMusic,
  Heart,
  Download,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { usePlayer } from '@/context/PlayerContext';
import { useAuth } from '@/context/AuthContext';
import { Link } from 'react-router-dom';
import { getUserById } from '@/data/mockData';

function formatTime(seconds: number): string {
  if (isNaN(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function AudioPlayer() {
  const { isAuthenticated } = useAuth();
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    queue,
    queueIndex,
    isShuffled,
    repeatMode,
    togglePlay,
    seek,
    setVolume,
    toggleMute,
    nextTrack,
    previousTrack,
    toggleShuffle,
    toggleRepeat,
    removeFromQueue,
  } = usePlayer();

  const [isLiked, setIsLiked] = useState(false);
  const progress = duration > 0 ? currentTime / duration : 0;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && e.target === document.body) {
        e.preventDefault();
        togglePlay();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlay]);

  if (!currentTrack) return null;

  const trackUser = getUserById(currentTrack.userId);

  const handleDownload = () => {
    // In a real app, this would trigger the actual download
    const link = document.createElement('a');
    link.href = currentTrack.audioUrl;
    link.download = `${currentTrack.title}.mp3`;
    link.click();
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-t from-background via-card to-card border-t border-border">
      {/* Progress Bar */}
      <div className="group relative h-1 bg-secondary cursor-pointer">
        <div
          className="absolute h-full bg-orange-500 transition-all"
          style={{ width: `${progress * 100}%` }}
        />
        <input
          type="range"
          min={0}
          max={duration || 100}
          value={currentTime}
          onChange={(e) => seek(Number(e.target.value))}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        {/* Hover preview */}
        <div className="absolute bottom-full left-0 right-0 h-2 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>

      <div className="h-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto h-full flex items-center justify-between gap-4">
          {/* Track Info */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <Avatar className="h-12 w-12 rounded-lg flex-shrink-0">
              <AvatarImage src={currentTrack.coverUrl} alt={currentTrack.title} />
              <AvatarFallback>{currentTrack.title[0]}</AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <Link
                to={`/track/${currentTrack.id}`}
                className="text-sm font-medium truncate hover:text-orange-500 transition-colors block"
              >
                {currentTrack.title}
              </Link>
              <Link
                to={`/user/${currentTrack.userId}`}
                className="text-xs text-muted-foreground truncate hover:text-orange-500 transition-colors block"
              >
                {trackUser?.displayName}
              </Link>
            </div>
            {isAuthenticated && (
              <Button
                variant="ghost"
                size="icon"
                className="flex-shrink-0"
                onClick={() => setIsLiked(!isLiked)}
              >
                <Heart
                  className={`w-4 h-4 ${isLiked ? 'fill-orange-500 text-orange-500' : ''}`}
                />
              </Button>
            )}
          </div>

          {/* Controls */}
          <div className="flex flex-col items-center gap-1 flex-1 max-w-md">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className={`h-8 w-8 ${isShuffled ? 'text-orange-500' : ''}`}
                onClick={toggleShuffle}
              >
                <Shuffle className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={previousTrack}>
                <SkipBack className="w-5 h-5" />
              </Button>
              <Button
                size="icon"
                className="h-10 w-10 rounded-full bg-orange-500 hover:bg-orange-600"
                onClick={togglePlay}
              >
                {isPlaying ? (
                  <Pause className="w-5 h-5" />
                ) : (
                  <Play className="w-5 h-5 ml-0.5" />
                )}
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={nextTrack}>
                <SkipForward className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className={`h-8 w-8 ${repeatMode !== 'none' ? 'text-orange-500' : ''}`}
                onClick={toggleRepeat}
              >
                {repeatMode === 'one' ? (
                  <Repeat1 className="w-4 h-4" />
                ) : (
                  <Repeat className="w-4 h-4" />
                )}
              </Button>
            </div>
            <div className="flex items-center gap-2 w-full">
              <span className="text-xs text-muted-foreground w-10 text-right">
                {formatTime(currentTime)}
              </span>
              <div className="flex-1 h-1 bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full bg-orange-500 transition-all"
                  style={{ width: `${progress * 100}%` }}
                />
              </div>
              <span className="text-xs text-muted-foreground w-10">
                {formatTime(duration)}
              </span>
            </div>
          </div>

          {/* Volume & Queue */}
          <div className="flex items-center gap-2 flex-1 justify-end">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={toggleMute}>
              {isMuted || volume === 0 ? (
                <VolumeX className="w-4 h-4" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </Button>
            <Slider
              value={[isMuted ? 0 : volume * 100]}
              max={100}
              step={1}
              className="w-24 hidden sm:flex"
              onValueChange={(value) => setVolume(value[0] / 100)}
            />
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleDownload}>
              <Download className="w-4 h-4" />
            </Button>

            {/* Queue Sheet */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 relative">
                  <ListMusic className="w-4 h-4" />
                  {queue.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 text-[10px] rounded-full flex items-center justify-center">
                      {queue.length}
                    </span>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent className="w-full sm:max-w-md">
                <SheetHeader>
                  <SheetTitle>Queue</SheetTitle>
                </SheetHeader>
                <div className="mt-4 space-y-2">
                  {queue.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      Your queue is empty
                    </p>
                  ) : (
                    queue.map((track, index) => {
                      const queueTrackUser = getUserById(track.userId);
                      return (
                        <div
                          key={`${track.id}-${index}`}
                          className={`flex items-center gap-3 p-2 rounded-lg ${
                            index === queueIndex ? 'bg-orange-500/10' : 'hover:bg-secondary'
                          }`}
                        >
                          <Avatar className="h-10 w-10 rounded">
                            <AvatarImage src={track.coverUrl} alt={track.title} />
                            <AvatarFallback>{track.title[0]}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium truncate ${
                              index === queueIndex ? 'text-orange-500' : ''
                            }`}>
                              {track.title}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {queueTrackUser?.displayName}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFromQueue(index)}
                          >
                            Remove
                          </Button>
                        </div>
                      );
                    })
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </div>
  );
}
