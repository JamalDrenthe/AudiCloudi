import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Play, Heart, MoreHorizontal, Share2, Repeat2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { usePlayer } from '@/context/PlayerContext';
import { usePlaylist } from '@/context/PlaylistContext';
import { useTracks } from '@/context/TrackContext';
import { useAuth } from '@/context/AuthContext';
import { getTrendingTracks, getUserById } from '@/data/mockData';
import { TrackCover } from '@/components/TrackCover';
import { ShareTrackModal } from '@/components/ShareTrackModal';
import { toast } from 'sonner';
import type { Track } from '@/types';

function TrackCard({
  track,
  index,
  onShare,
}: {
  track: Track;
  index: number;
  onShare: (track: Track) => void;
}) {
  const { playTrack, addToQueue, currentTrack, isPlaying } = usePlayer();
  const { openAddToPlaylistModal } = usePlaylist();
  const { toggleLike, isLiked: checkIsLiked, toggleRepost, isReposted: checkIsReposted, isAuthenticated } = useAuth();
  const isLiked = checkIsLiked(track.id);
  const isReposted = checkIsReposted(track.id);
  const [isHovered, setIsHovered] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-slide-up');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const artist = track.user || getUserById(track.userId) || { displayName: track.userName || 'Artist' };
  const isCurrentTrack = currentTrack?.id === track.id;

  const handlePlay = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    playTrack(track);
  };

  const handleAddToQueue = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToQueue(track);
  };

  return (
    <div
      ref={cardRef}
      className="group opacity-0"
      style={{ animationDelay: `${index * 0.04}s` }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="bg-[#161617]/90 rounded-2xl border border-white/[0.08] hover:border-white/20 hover:bg-[#1c1c1e] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_36px_rgba(0,0,0,0.6)] p-3 flex flex-col">
        {/* Cover Image */}
        <div className="relative aspect-square rounded-xl overflow-hidden shadow-md bg-black/40">
          <Link to={`/track/${track.id}`} className="block w-full h-full" aria-label={track.title}>
            <TrackCover
              track={track}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              showBadge
            />
          </Link>

          {/* Overlay */}
          <div
            className={`absolute inset-0 bg-black/35 backdrop-blur-[1px] transition-opacity duration-300 pointer-events-none ${
              isHovered ? 'opacity-100' : 'opacity-0'
            }`}
          />

          {/* Floating Apple Play Button */}
          <div
            className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 pointer-events-none ${
              isHovered || (isCurrentTrack && isPlaying) ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <Button
              size="icon"
              className="pointer-events-auto w-12 h-12 rounded-full bg-white hover:bg-[#e5e5ea] text-black shadow-xl transform transition-transform duration-200 hover:scale-110 active:scale-95"
              onClick={handlePlay}
              aria-label="Play track"
            >
              {isCurrentTrack && isPlaying ? (
                <div className="flex gap-1 items-center">
                  <span className="w-1 h-3.5 bg-black rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                  <span className="w-1 h-3.5 bg-black rounded-full animate-bounce" style={{ animationDelay: '0.15s' }} />
                  <span className="w-1 h-3.5 bg-black rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
                </div>
              ) : (
                <Play className="w-5 h-5 ml-0.5 fill-black" />
              )}
            </Button>
          </div>

          {/* Explicit Badge */}
          {track.isExplicit && (
            <span className="absolute top-2 left-2 px-1.5 py-0.5 text-[9px] font-bold bg-white/20 backdrop-blur-md text-white rounded-md pointer-events-none border border-white/10">
              E
            </span>
          )}

          {/* Duration */}
          <span className="absolute bottom-2 right-2 px-2 py-0.5 text-[11px] font-mono bg-black/60 backdrop-blur-md rounded-full text-white/90 pointer-events-none border border-white/10">
            {track.durationFormatted}
          </span>
        </div>

        {/* Info */}
        <div className="pt-3 px-1 flex-1 flex flex-col justify-between">
          <div>
            <h3 className="font-semibold text-sm tracking-tight truncate">
              <Link
                to={`/track/${track.id}`}
                className="text-[#f5f5f7] hover:text-white hover:underline transition-colors block truncate"
              >
                {track.title}
              </Link>
            </h3>
            <Link
              to={`/user/${track.userId}`}
              className="text-xs text-[#86868b] hover:text-[#f5f5f7] transition-colors block truncate mt-0.5"
            >
              {artist?.displayName}
            </Link>
          </div>

          <div className="flex items-center justify-between mt-3 pt-2 border-t border-white/[0.04]">
            <span className="text-[11px] text-[#86868b] font-mono">
              {(track.playsCount || 0).toLocaleString()} streams
            </span>
            <div className="flex items-center gap-0.5">
              <Button
                variant="ghost"
                size="icon-sm"
                className={`h-7 w-7 rounded-full hover:bg-white/[0.08] active:scale-90 transition-all ${
                  isLiked ? 'text-rose-500 hover:text-rose-400' : 'text-[#86868b] hover:text-white'
                }`}
                onClick={(e: React.MouseEvent) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (!isAuthenticated) {
                    toast.error('Log eerst in om te liken.');
                    return;
                  }
                  toggleLike(track.id);
                }}
                title={isLiked ? "Unlike" : "Like"}
              >
                <Heart
                  className="w-3.5 h-3.5"
                  fill={isLiked ? 'currentColor' : 'none'}
                />
              </Button>

              <Button
                variant="ghost"
                size="icon-sm"
                className={`h-7 w-7 rounded-full hover:bg-white/[0.08] transition-all ${
                  isReposted ? 'text-emerald-400' : 'text-[#86868b] hover:text-white'
                }`}
                onClick={(e: React.MouseEvent) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (!isAuthenticated) {
                    toast.error('Log eerst in om te herplaatsen.');
                    return;
                  }
                  const res = toggleRepost(track.id);
                  if (res) toast.success(`"${track.title}" herplaatst op je profiel!`);
                  else toast.info('Herplaatsing verwijderd');
                }}
                title={isReposted ? "Herplaatst" : "Herplaatsen"}
              >
                <Repeat2 className="w-3.5 h-3.5" />
              </Button>

              <Button
                variant="ghost"
                size="icon-sm"
                className="h-7 w-7 rounded-full text-[#86868b] hover:text-white hover:bg-white/[0.08]"
                onClick={(e: React.MouseEvent) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onShare(track);
                }}
                title="Delen"
              >
                <Share2 className="w-3.5 h-3.5" />
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="h-7 w-7 rounded-full text-[#86868b] hover:text-white hover:bg-white/[0.08]"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreHorizontal className="w-3.5 h-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-[#1c1c1e] border-white/10 text-white rounded-xl">
                  <DropdownMenuItem onClick={handleAddToQueue} className="text-xs cursor-pointer">
                    Aan wachtrij toevoegen
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => openAddToPlaylistModal(track)} className="text-xs cursor-pointer">
                    Toevoegen aan afspeellijst
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onShare(track)} className="text-xs cursor-pointer">
                    <Share2 className="w-3.5 h-3.5 mr-2" />
                    Delen naar socials
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function TrendingTracks() {
  const { tracks: allTracks } = useTracks();
  const [shareTrack, setShareTrack] = useState<Track | null>(null);
  const trendingTracks = allTracks.length > 0 ? allTracks.slice(0, 8) : getTrendingTracks(8);

  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 border-t border-white/[0.08]">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <div className="text-[11px] font-semibold text-[#fa233b] tracking-wider uppercase mb-1">
              Top Selectie
            </div>
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#f5f5f7]">
              Trending Releases
            </h2>
            <p className="text-sm text-[#86868b] mt-1">
              De meest gestreamde tracks op het platform van deze week
            </p>
          </div>
          <Link
            to="/charts"
            className="text-sm text-[#2997ff] hover:underline inline-flex items-center gap-1 font-normal group"
          >
            <span>Bekijk Top 20 Hitlijst</span>
            <span className="transition-transform group-hover:translate-x-0.5">›</span>
          </Link>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {trendingTracks.map((track, index) => (
            <TrackCard
              key={track.id}
              track={track}
              index={index}
              onShare={(t) => setShareTrack(t)}
            />
          ))}
        </div>
      </div>

      <ShareTrackModal
        isOpen={!!shareTrack}
        onClose={() => setShareTrack(null)}
        track={shareTrack}
      />
    </section>
  );
}
