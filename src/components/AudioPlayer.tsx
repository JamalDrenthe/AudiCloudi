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
  Activity,
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
import { usePlayer } from '@/context/PlayerContext';
import { Link } from 'react-router-dom';
import { getUserById } from '@/data/mockData';
import { Waveform } from '@/components/Waveform';
import { TrackCover } from '@/components/TrackCover';
import { getLocalAudioUrl } from '@/lib/audioStorage';
import { generateTrackAudio } from '@/lib/audioSynthesizer';

function formatTime(seconds: number): string {
  if (isNaN(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function AudioPlayer() {
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
  const [isLikeAnimating, setIsLikeAnimating] = useState(false);
  const [showExpandedWaveform, setShowExpandedWaveform] = useState(false);
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

  const handleDownload = async () => {
    try {
      const localUrl = await getLocalAudioUrl(currentTrack.id);
      let downloadUrl = localUrl || currentTrack.audioUrl;
      if (!downloadUrl) {
        downloadUrl = await generateTrackAudio(currentTrack);
      }
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `${currentTrack.title}.wav`;
      link.click();
    } catch {
      // Fallback
      const link = document.createElement('a');
      link.href = currentTrack.audioUrl;
      link.download = `${currentTrack.title}.mp3`;
      link.click();
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#161617]/92 backdrop-blur-2xl backdrop-saturate-150 border-t border-white/[0.08] shadow-[0_-12px_40px_rgba(0,0,0,0.85)]">
      {/* Apple Thin Hairline Scrubber */}
      <div className="group relative h-1 hover:h-2 bg-white/[0.06] cursor-pointer transition-all duration-150">
        <div
          className="absolute h-full bg-[#fa233b] transition-all"
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
      </div>

      {/* Expanded Studio Waveform Visualizer */}
      {showExpandedWaveform && (
        <div className="px-4 sm:px-6 lg:px-8 py-3 bg-[#1c1c1e]/95 border-b border-white/[0.08] backdrop-blur-2xl">
          <div className="max-w-7xl mx-auto flex items-center gap-4">
            <span className="text-[11px] font-mono text-[#86868b] w-12 text-right">
              {formatTime(currentTime)}
            </span>
            <div className="flex-1">
              <Waveform
                track={currentTrack}
                currentTime={currentTime}
                duration={duration}
                isPlaying={isPlaying}
                onSeek={seek}
                variant="hero"
                className="h-14"
              />
            </div>
            <span className="text-[11px] font-mono text-[#86868b] w-12">
              {formatTime(duration)}
            </span>
          </div>
        </div>
      )}

      <div className="h-16 sm:h-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto h-full flex items-center justify-between gap-4">
          {/* Left: Track Info */}
          <div className="flex items-center gap-3.5 flex-1 min-w-0">
            <div className="h-11 w-11 sm:h-12 sm:w-12 rounded-xl overflow-hidden flex-shrink-0 ring-1 ring-white/10 shadow-md bg-black/50">
              <TrackCover track={currentTrack} />
            </div>
            <div className="min-w-0">
              <Link
                to={`/track/${currentTrack.id}`}
                className="text-xs sm:text-sm font-semibold tracking-tight text-[#f5f5f7] truncate hover:underline block"
              >
                {currentTrack.title}
              </Link>
              <Link
                to={`/user/${currentTrack.userId}`}
                className="text-[11px] sm:text-xs text-[#86868b] truncate hover:text-white transition-colors block mt-0.5"
              >
                {trackUser?.displayName}
              </Link>
            </div>
            <Button
              variant="ghost"
              size="icon-sm"
              className="flex-shrink-0 hover:bg-white/[0.08] active:scale-90 transition-all rounded-full"
              onClick={() => {
                const nextLiked = !isLiked;
                setIsLiked(nextLiked);
                if (nextLiked) {
                  setIsLikeAnimating(true);
                }
              }}
              title={isLiked ? "Unlike" : "Like"}
            >
              <Heart
                onAnimationEnd={() => setIsLikeAnimating(false)}
                className={`w-4 h-4 transition-all duration-300 ease-out ${
                  isLiked
                    ? 'fill-[#fa233b] text-[#fa233b]'
                    : 'text-[#86868b] hover:text-white'
                } ${isLikeAnimating ? 'animate-heart-pop' : ''}`}
              />
            </Button>
          </div>

          {/* Center: Apple Controls */}
          <div className="flex flex-col items-center gap-1 flex-1 max-w-md">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <Button
                variant="ghost"
                size="icon-sm"
                className={`h-7 w-7 rounded-full ${isShuffled ? 'text-[#fa233b]' : 'text-[#86868b] hover:text-white'}`}
                onClick={toggleShuffle}
                title="Shuffle"
              >
                <Shuffle className="w-3.5 h-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                className="h-8 w-8 rounded-full text-[#86868b] hover:text-white"
                onClick={previousTrack}
                title="Vorige track"
              >
                <SkipBack className="w-4 h-4" />
              </Button>
              <Button
                size="icon"
                className="h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-white hover:bg-[#e5e5ea] text-black shadow-md active:scale-95 transition-all"
                onClick={togglePlay}
                title={isPlaying ? "Pauzeren" : "Afspelen"}
              >
                {isPlaying ? (
                  <Pause className="w-4 h-4 sm:w-5 sm:h-5 fill-black" />
                ) : (
                  <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-black ml-0.5" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                className="h-8 w-8 rounded-full text-[#86868b] hover:text-white"
                onClick={nextTrack}
                title="Volgende track"
              >
                <SkipForward className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                className={`h-7 w-7 rounded-full ${repeatMode !== 'none' ? 'text-[#fa233b]' : 'text-[#86868b] hover:text-white'}`}
                onClick={toggleRepeat}
                title="Herhalen"
              >
                {repeatMode === 'one' ? (
                  <Repeat1 className="w-3.5 h-3.5" />
                ) : (
                  <Repeat className="w-3.5 h-3.5" />
                )}
              </Button>
            </div>
            
            {/* Scrubber row with waveform */}
            <div className="flex items-center gap-2.5 w-full">
              <span className="text-[10px] font-mono text-[#86868b] w-8 text-right">
                {formatTime(currentTime)}
              </span>
              <div className="flex-1 px-1">
                <Waveform
                  track={currentTrack}
                  currentTime={currentTime}
                  duration={duration}
                  isPlaying={isPlaying}
                  onSeek={seek}
                  variant="player"
                  className="h-5"
                />
              </div>
              <span className="text-[10px] font-mono text-[#86868b] w-8">
                {formatTime(duration)}
              </span>
            </div>
          </div>

          {/* Right: Volume & Queue */}
          <div className="flex items-center gap-1 sm:gap-2 flex-1 justify-end">
            {/* Lossless indicator / Visualizer toggle */}
            <button
              onClick={() => setShowExpandedWaveform((prev) => !prev)}
              className={`hidden md:inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider transition-all border ${
                showExpandedWaveform
                  ? 'bg-[#fa233b]/15 text-[#fa233b] border-[#fa233b]/30'
                  : 'bg-white/[0.04] text-[#86868b] hover:text-white border-white/[0.08]'
              }`}
              title="Studio visualizer toggle"
            >
              <Activity className="w-3 h-3" />
              <span>Lossless</span>
            </button>

            {/* Volume control */}
            <div className="hidden sm:flex items-center gap-1.5">
              <Button variant="ghost" size="icon-sm" className="h-7 w-7 rounded-full text-[#86868b] hover:text-white" onClick={toggleMute}>
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-3.5 h-3.5" />
                ) : (
                  <Volume2 className="w-3.5 h-3.5" />
                )}
              </Button>
              <Slider
                value={[isMuted ? 0 : volume * 100]}
                max={100}
                step={1}
                className="w-20 hidden lg:flex"
                onValueChange={(value) => setVolume(value[0] / 100)}
              />
            </div>

            <Button variant="ghost" size="icon-sm" className="h-7 w-7 rounded-full text-[#86868b] hover:text-white" onClick={handleDownload} title="Download track">
              <Download className="w-3.5 h-3.5" />
            </Button>

            {/* Queue Sheet */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon-sm" className="h-8 w-8 rounded-full text-[#86868b] hover:text-white relative" title="Afspeelwachtrij">
                  <ListMusic className="w-4 h-4" />
                  {queue.length > 0 && (
                    <span className="absolute 0 top-0.5 right-0.5 w-3.5 h-3.5 bg-[#fa233b] text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                      {queue.length}
                    </span>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent className="w-full sm:max-w-md bg-[#161617]/95 backdrop-blur-2xl border-l border-white/10 text-white">
                <SheetHeader>
                  <SheetTitle className="text-white text-lg font-semibold tracking-tight">Afspeelwachtrij</SheetTitle>
                </SheetHeader>
                <div className="mt-4 space-y-2">
                  {queue.length === 0 ? (
                    <p className="text-center text-[#86868b] py-8 text-sm">
                      De afspeelwachtrij is leeg
                    </p>
                  ) : (
                    queue.map((track, index) => {
                      const queueTrackUser = getUserById(track.userId);
                      return (
                        <div
                          key={`${track.id}-${index}`}
                          className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all ${
                            index === queueIndex
                              ? 'bg-white/[0.08] border-[#fa233b]/40 text-white'
                              : 'bg-white/[0.02] border-transparent hover:bg-white/[0.05]'
                          }`}
                        >
                          <div className="h-10 w-10 rounded-lg overflow-hidden flex-shrink-0 ring-1 ring-white/10 bg-black/40">
                            <TrackCover track={track} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-xs font-semibold truncate ${
                              index === queueIndex ? 'text-[#fa233b]' : 'text-white'
                            }`}>
                              {track.title}
                            </p>
                            <p className="text-[11px] text-[#86868b] truncate">
                              {queueTrackUser?.displayName}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs h-7 text-[#86868b] hover:text-white rounded-full"
                            onClick={() => removeFromQueue(index)}
                          >
                            Verwijder
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
