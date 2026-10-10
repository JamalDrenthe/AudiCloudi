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
      style={{ animationDelay: `${index * 0.05}s` }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="bg-card rounded-xl overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover">
        {/* Cover Image */}
        <div className="relative aspect-square overflow-hidden">
          <Link to={`/track/${track.id}`} className="block w-full h-full" aria-label={track.title}>
            <TrackCover
              track={track}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              showBadge
            />
          </Link>
          {/* Overlay */}
          <div
            className={`absolute inset-0 bg-black/40 transition-opacity duration-300 pointer-events-none ${
              isHovered ? 'opacity-100' : 'opacity-0'
            }`}
          />
          {/* Play Button */}
          <div
            className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 pointer-events-none ${
              isHovered ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <Button
              size="icon"
              className="pointer-events-auto w-14 h-14 rounded-full bg-orange-500 hover:bg-orange-600 shadow-lg transform transition-all duration-300 hover:scale-110"
              onClick={handlePlay}
            >
              {isCurrentTrack && isPlaying ? (
                <div className="flex gap-0.5">
                  <span className="w-1 h-4 bg-white animate-bounce" style={{ animationDelay: '0s' }} />
                  <span className="w-1 h-4 bg-white animate-bounce" style={{ animationDelay: '0.1s' }} />
                  <span className="w-1 h-4 bg-white animate-bounce" style={{ animationDelay: '0.2s' }} />
                </div>
              ) : (
                <Play className="w-6 h-6 ml-1" />
              )}
            </Button>
          </div>
          {/* Explicit Badge */}
          {track.isExplicit && (
            <span className="absolute top-2 left-2 px-1.5 py-0.5 text-[10px] font-bold bg-zinc-800/80 rounded pointer-events-none">
              E
            </span>
          )}
          {/* Duration */}
          <span className="absolute bottom-2 right-2 px-2 py-1 text-xs bg-black/60 rounded pointer-events-none">
            {track.durationFormatted}
          </span>
        </div>

        {/* Info */}
        <div className="p-4">
          <h3 className="font-semibold truncate">
            <Link
              to={`/track/${track.id}`}
              className="hover:text-orange-500 transition-colors block truncate"
            >
              {track.title}
            </Link>
          </h3>
          <Link
            to={`/user/${track.userId}`}
            className="text-sm text-muted-foreground hover:text-orange-500 transition-colors block truncate"
          >
            {artist?.displayName}
          </Link>
          <div className="flex items-center justify-between mt-3">
            <span className="text-xs text-muted-foreground font-medium">
              {(track.playsCount || 0).toLocaleString()} plays
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className={`h-8 w-8 hover:bg-orange-500/10 active:scale-90 transition-all duration-200 ${
                  isLiked ? 'text-rose-500' : 'text-muted-foreground'
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
                  className="w-4 h-4"
                  fill={isLiked ? 'currentColor' : 'none'}
                />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className={`h-8 w-8 hover:bg-emerald-500/10 transition-all duration-200 ${
                  isReposted ? 'text-emerald-400' : 'text-muted-foreground'
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
                <Repeat2 className="w-4 h-4" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                onClick={(e: React.MouseEvent) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onShare(track);
                }}
                title="Deel naar socials"
              >
                <Share2 className="w-4 h-4" />
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleAddToQueue}>
                    Add to Queue
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => openAddToPlaylistModal(track)}>
                    Toevoegen aan afspeellijst
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onShare(track)}>
                    <Share2 className="w-4 h-4 mr-2" />
                    Delen naar Socials
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
    <section className="py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold">Trending Now</h2>
            <p className="text-muted-foreground mt-1">Meest beluisterde nummers deze week</p>
          </div>
          <Button variant="ghost" asChild className="text-orange-400 hover:text-orange-300">
            <Link to="/charts">Bekijk Top 20 Hitlijst →</Link>
          </Button>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
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
