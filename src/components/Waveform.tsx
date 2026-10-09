import { useState, useRef, useMemo, useCallback } from 'react';
import type { Track } from '@/types';

interface WaveformProps {
  track: Track;
  currentTime?: number;
  duration?: number;
  isPlaying?: boolean;
  onSeek?: (time: number) => void;
  variant?: 'player' | 'hero' | 'compact';
  barCount?: number;
  className?: string;
  interactive?: boolean;
}

function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Generates or normalizes an array of waveform amplitudes between 0.15 and 1.0
function getNormalizedWaveformData(track: Track, targetCount: number): number[] {
  const existing = track.waveformData;
  
  // If track already has waveform data, interpolate/resample it to targetCount
  if (Array.isArray(existing) && existing.length > 0) {
    // Check if values are in 0..1 or 0..100
    const maxVal = Math.max(...existing, 1);
    const normalizedRaw = existing.map((val) => (maxVal > 1 ? val / maxVal : val));
    
    const result: number[] = [];
    for (let i = 0; i < targetCount; i++) {
      const srcIndex = (i / targetCount) * (normalizedRaw.length - 1);
      const low = Math.floor(srcIndex);
      const high = Math.min(low + 1, normalizedRaw.length - 1);
      const weight = srcIndex - low;
      const interpolated = (1 - weight) * normalizedRaw[low] + weight * normalizedRaw[high];
      // Keep within 0.15 to 0.98 for aesthetic balance
      result.push(Math.max(0.15, Math.min(0.98, interpolated)));
    }
    return result;
  }

  // Otherwise, deterministically generate a realistic musical waveform from track id & duration
  let hash = 0;
  const str = `${track.id}_${track.title}_${track.duration}`;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  const seed = Math.abs(hash);

  const points: number[] = [];
  for (let i = 0; i < targetCount; i++) {
    const progress = i / targetCount;
    // Harmonic frequencies modeling musical structure: intro, build-up, drop, bridge, outro
    const introFade = Math.min(1, progress * 4);
    const outroFade = Math.min(1, (1 - progress) * 4);
    
    const wave1 = Math.sin(progress * Math.PI * 4) * 0.25;
    const wave2 = Math.cos(progress * Math.PI * 8 + seed) * 0.18;
    const wave3 = Math.sin(progress * Math.PI * 18 + (seed % 17)) * 0.15;
    
    // Pseudo-random beat spikes
    const pseudoRand = ((seed * (i + 13) * 9301 + 49297) % 233280) / 233280;
    const beatSpike = (pseudoRand - 0.5) * 0.35;

    // Dynamics: build-up in middle, drops
    const dynamicStructure = 0.5 + Math.sin(progress * Math.PI) * 0.3;

    const rawHeight = (dynamicStructure + wave1 + wave2 + wave3 + beatSpike) * introFade * outroFade;
    // Clamp to 0.15 - 0.98
    const clamped = Math.max(0.15, Math.min(0.98, rawHeight));
    points.push(clamped);
  }

  return points;
}

export function Waveform({
  track,
  currentTime = 0,
  duration = 0,
  isPlaying = false,
  onSeek,
  variant = 'player',
  barCount,
  className = '',
  interactive = true,
}: WaveformProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoverPosition, setHoverPosition] = useState<{ fraction: number; time: number; x: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Target count of bars based on variant
  const numBars = useMemo(() => {
    if (barCount) return barCount;
    if (variant === 'hero') return 90;
    if (variant === 'compact') return 40;
    return 65; // 'player' variant
  }, [barCount, variant]);

  const heights = useMemo(() => {
    return getNormalizedWaveformData(track, numBars);
  }, [track, numBars]);

  const effectiveDuration = duration > 0 ? duration : (track.duration || 180);
  const progressFraction = effectiveDuration > 0 ? Math.min(Math.max(currentTime / effectiveDuration, 0), 1) : 0;
  const currentBarIndex = Math.floor(progressFraction * numBars);

  const calculateFractionFromEvent = useCallback((clientX: number): number => {
    if (!containerRef.current) return 0;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    return rect.width > 0 ? x / rect.width : 0;
  }, []);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!interactive || !onSeek) return;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    setIsDragging(true);
    const fraction = calculateFractionFromEvent(e.clientX);
    const seekTime = fraction * effectiveDuration;
    onSeek(seekTime);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!interactive || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const fraction = rect.width > 0 ? x / rect.width : 0;
    const time = fraction * effectiveDuration;
    setHoverPosition({ fraction, time, x });

    if (isDragging && onSeek) {
      onSeek(time);
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!interactive) return;
    setIsDragging(false);
    try {
      (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
    } catch {
      // Ignore
    }
  };

  const handlePointerLeave = () => {
    if (!isDragging) {
      setHoverPosition(null);
    }
  };

  // Keyboard accessibility
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!interactive || !onSeek) return;
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      onSeek(Math.min(effectiveDuration, currentTime + 5));
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      onSeek(Math.max(0, currentTime - 5));
    }
  };

  // Height and styles according to variant
  const containerHeightClass =
    variant === 'hero'
      ? 'h-16 sm:h-20'
      : variant === 'compact'
      ? 'h-6'
      : 'h-8 sm:h-9';

  return (
    <div
      ref={containerRef}
      role={interactive ? 'slider' : undefined}
      tabIndex={interactive ? 0 : undefined}
      aria-label={`Voortgang van ${track.title}`}
      aria-valuemin={0}
      aria-valuemax={effectiveDuration}
      aria-valuenow={currentTime}
      onKeyDown={handleKeyDown}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerLeave}
      className={`relative select-none flex items-center justify-between w-full ${containerHeightClass} ${
        interactive ? 'cursor-pointer group' : ''
      } ${className}`}
    >
      {/* Waveform bars container */}
      <div className="absolute inset-0 flex items-center justify-between gap-[2px] w-full h-full">
        {heights.map((amplitude, idx) => {
          const barFraction = idx / numBars;
          const isPlayed = idx <= currentBarIndex;
          const isNearHead = idx === currentBarIndex;
          const isHovered = hoverPosition !== null && barFraction <= hoverPosition.fraction;

          // Height in percent
          const heightPercent = Math.round(amplitude * 100);

          return (
            <div
              key={idx}
              className="flex-1 h-full flex items-center justify-center pointer-events-none"
            >
              <div
                style={{ height: `${heightPercent}%` }}
                className={`w-full max-w-[3.5px] min-w-[1.5px] rounded-full transition-all duration-150 ${
                  isPlayed
                    ? 'bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.4)]'
                    : isHovered
                    ? 'bg-orange-300/80 dark:bg-orange-400/70'
                    : 'bg-muted-foreground/25 dark:bg-zinc-700/60'
                } ${
                  isNearHead && isPlaying
                    ? 'scale-y-110 brightness-125'
                    : ''
                }`}
              />
            </div>
          );
        })}
      </div>

      {/* Synchronized Playhead Line */}
      <div
        style={{ left: `${progressFraction * 100}%` }}
        className="absolute top-0 bottom-0 w-[2px] bg-white pointer-events-none z-10 transition-[left] duration-100 shadow-[0_0_10px_rgba(255,255,255,0.8)]"
      >
        {variant !== 'compact' && (
          <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-white rounded-full shadow-md" />
        )}
      </div>

      {/* Hover Scrubber Line & Tooltip */}
      {hoverPosition !== null && (
        <>
          <div
            style={{ left: `${hoverPosition.x}px` }}
            className="absolute top-0 bottom-0 w-[1.5px] bg-orange-400/80 pointer-events-none z-20"
          />
          <div
            style={{
              left: `${Math.max(28, Math.min(hoverPosition.x, (containerRef.current?.clientWidth || 200) - 28))}px`,
            }}
            className="absolute -top-7 -translate-x-1/2 pointer-events-none z-30 px-2 py-0.5 rounded-md bg-zinc-900/95 text-white border border-orange-500/30 text-[11px] font-mono font-medium shadow-lg"
          >
            {formatTime(hoverPosition.time)}
          </div>
        </>
      )}
    </div>
  );
}
