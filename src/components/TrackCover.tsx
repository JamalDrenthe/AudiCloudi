import { useState, useEffect } from 'react';
import { Music } from 'lucide-react';
import type { Track, Playlist } from '@/types';
import {
  getLocalVideoUrl,
  getVideoUrlSync,
  getLocalCoverImageUrl,
  getCoverImageUrlSync,
} from '@/lib/audioStorage';

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
  const [localImageUrl, setLocalImageUrl] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);

  const rawVideoUrl = track?.coverVideoUrl || playlist?.coverVideoUrl;
  const initialCoverUrl = track?.coverUrl || playlist?.coverUrl || '';
  const isVideoType =
    track?.coverType === 'video' ||
    playlist?.coverType === 'video' ||
    Boolean(rawVideoUrl) ||
    initialCoverUrl.endsWith('.mp4') ||
    initialCoverUrl.endsWith('.webm');

  const itemId = track?.id || playlist?.id;

  useEffect(() => {
    let isMounted = true;

    if (itemId) {
      // 1. Check sync cover image cache
      const syncImg = getCoverImageUrlSync(itemId);
      if (syncImg) {
        setLocalImageUrl(syncImg);
      } else {
        getLocalCoverImageUrl(itemId).then((url) => {
          if (isMounted && url) {
            setLocalImageUrl(url);
          }
        });
      }

      // 2. Check sync video cache
      const syncVideo = getVideoUrlSync(itemId);
      if (syncVideo) {
        setVideoUrl(syncVideo);
      } else {
        getLocalVideoUrl(itemId).then((url) => {
          if (!isMounted) return;
          if (url) {
            setVideoUrl(url);
          } else if (rawVideoUrl && !rawVideoUrl.startsWith('blob:')) {
            setVideoUrl(rawVideoUrl);
          }
        });
      }
      return () => {
        isMounted = false;
      };
    }

    if (rawVideoUrl) {
      setVideoUrl(rawVideoUrl);
    }
  }, [itemId, rawVideoUrl]);

  const effectiveCoverUrl = localImageUrl || initialCoverUrl;

  if (isVideoType && (videoUrl || initialCoverUrl.endsWith('.mp4'))) {
    const src = videoUrl || initialCoverUrl;
    return (
      <div className="relative w-full h-full overflow-hidden bg-black/60">
        <video
          src={src}
          autoPlay
          loop
          muted
          playsInline
          onError={() => setVideoUrl(null)}
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

  if (effectiveCoverUrl && !imageError) {
    return (
      <img
        src={effectiveCoverUrl}
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
