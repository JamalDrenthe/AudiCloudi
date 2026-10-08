import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Play, Heart, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { usePlayer } from '@/context/PlayerContext';
import { useAuth } from '@/context/AuthContext';
import { getTrendingTracks, getUserById } from '@/data/mockData';
import type { Track } from '@/types';

function TrackCard({ track, index }: { track: Track; index: number }) {
  const { playTrack, addToQueue, currentTrack, isPlaying } = usePlayer();
  const { isAuthenticated } = useAuth();
  const [isLiked, setIsLiked] = useState(false);
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

  const artist = getUserById(track.userId);
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
            <img
              src={track.coverUrl}
              alt={track.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
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
            <span className="text-xs text-muted-foreground">
              {track.playsCount.toLocaleString()} plays
            </span>
            <div className="flex items-center gap-1">
              {isAuthenticated && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={(e: React.MouseEvent) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsLiked(!isLiked);
                  }}
                >
                  <Heart
                    className={`w-4 h-4 ${isLiked ? 'fill-orange-500 text-orange-500' : ''}`}
                  />
                </Button>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleAddToQueue}>
                    Add to Queue
                  </DropdownMenuItem>
                  <DropdownMenuItem>Add to Playlist</DropdownMenuItem>
                  <DropdownMenuItem>Share</DropdownMenuItem>
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
  const trendingTracks = getTrendingTracks(8);

  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold">Trending Now</h2>
            <p className="text-muted-foreground mt-1">Most played tracks this week</p>
          </div>
          <Button variant="ghost" asChild>
            <Link to="/trending">View All</Link>
          </Button>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {trendingTracks.map((track, index) => (
            <TrackCard key={track.id} track={track} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}
