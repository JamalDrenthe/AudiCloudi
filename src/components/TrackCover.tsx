import { useState, useEffect } from 'react';
import { Music } from 'lucide-react';
import type { Track, Playlist } from '@/types';
import { getLocalVideoUrl, getVideoUrlSync } from '@/lib/audioStorage';

interface TrackCoverProps {
  track?: Partial<Track> | null;
  playlist?: Partial<Playlist> | null;
  fallbackTitle?: string;
  className?: string;
  showBadge?: boolean;
}

export function TrackCover({
  track,
  playlist,
  fallbackTitle = 'Cover',
  className = 'w-full h-full object-cover',
  showBadge = false,
}: TrackCoverProps) {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);

  const rawVideoUrl = track?.coverVideoUrl || playlist?.coverVideoUrl;
  const coverUrl = track?.coverUrl || playlist?.coverUrl || '';
  const isVideoType =
    track?.coverType === 'video' ||
    playlist?.coverType === 'video' ||
    Boolean(rawVideoUrl) ||
    coverUrl.endsWith('.mp4') ||
    coverUrl.endsWith('.webm');

  const itemId = track?.id || playlist?.id;

  useEffect(() => {
    if (rawVideoUrl) {
      setVideoUrl(rawVideoUrl);
      return;
    }

    if (itemId) {
      const syncUrl = getVideoUrlSync(itemId);
      if (syncUrl) {
        setVideoUrl(syncUrl);
        return;
      }

      getLocalVideoUrl(itemId).then((url) => {
        if (url) {
          setVideoUrl(url);
        }
      });
    }
  }, [itemId, rawVideoUrl]);

  if (isVideoType && (videoUrl || coverUrl.endsWith('.mp4'))) {
    const src = videoUrl || coverUrl;
    return (
      <div className="relative w-full h-full overflow-hidden bg-black/60">
        <video
          src={src}
          autoPlay
          loop
          muted
          playsInline
          className={className}
        />
        {showBadge && (
          <span className="absolute bottom-2 left-2 px-1.5 py-0.5 text-[10px] font-semibold bg-black/75 text-orange-400 rounded border border-orange-500/30">
            VIDEO CANVAS
          </span>
        )}
      </div>
    );
  }

  if (coverUrl && !imageError) {
    return (
      <img
        src={coverUrl}
        alt={track?.title || playlist?.title || fallbackTitle}
        onError={() => setImageError(true)}
        className={className}
      />
    );
  }

  return (
    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-zinc-800 to-zinc-950 text-muted-foreground">
      <Music className="w-8 h-8 opacity-40" />
    </div>
  );
}
