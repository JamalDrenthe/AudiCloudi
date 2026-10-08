import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Play, Heart, Users, UserPlus, Check, Sparkles, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { usePlayer } from '@/context/PlayerContext';
import { useAuth } from '@/context/AuthContext';
import { getTracksByFollowingIds, getUserById, mockUsers } from '@/data/mockData';
import type { Track } from '@/types';
import { toast } from 'sonner';

function FeedTrackCard({ track }: { track: Track }) {
  const { playTrack, currentTrack, isPlaying } = usePlayer();
  const [isLiked, setIsLiked] = useState(false);
  const [isLikeAnimating, setIsLikeAnimating] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const artist = getUserById(track.userId);
  const isCurrentTrack = currentTrack?.id === track.id;

  const handlePlay = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    playTrack(track);
  };

  return (
    <div
      className="bg-card border border-border/60 hover:border-orange-500/40 rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl group flex flex-col"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Cover Artwork & Overlay */}
      <div className="relative aspect-video sm:aspect-square overflow-hidden bg-muted">
        <Link to={`/track/${track.id}`} className="block w-full h-full" aria-label={track.title}>
          <img
            src={track.coverUrl}
            alt={track.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </Link>

        {/* Backdrop overlay on hover */}
        <div
          className={`absolute inset-0 bg-black/40 transition-opacity duration-300 pointer-events-none ${
            isHovered ? 'opacity-100' : 'opacity-0'
          }`}
        />

        {/* Center Play Button */}
        <div
          className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 pointer-events-none ${
            isHovered || (isCurrentTrack && isPlaying) ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <Button
            size="icon"
            className="pointer-events-auto w-12 h-12 rounded-full bg-orange-500 hover:bg-orange-600 shadow-xl transform transition-all duration-300 hover:scale-110 text-white"
            onClick={handlePlay}
            aria-label={isCurrentTrack && isPlaying ? "Pause" : "Play"}
          >
            {isCurrentTrack && isPlaying ? (
              <div className="flex gap-0.5 items-center justify-center">
                <span className="w-1 h-4 bg-white animate-bounce" style={{ animationDelay: '0s' }} />
                <span className="w-1 h-4 bg-white animate-bounce" style={{ animationDelay: '0.1s' }} />
                <span className="w-1 h-4 bg-white animate-bounce" style={{ animationDelay: '0.2s' }} />
              </div>
            ) : (
              <Play className="w-5 h-5 ml-0.5" />
            )}
          </Button>
        </div>

        {/* Duration badge */}
        <span className="absolute bottom-2.5 right-2.5 px-2 py-0.5 text-xs font-medium bg-black/70 text-white rounded-md backdrop-blur-sm pointer-events-none">
          {track.durationFormatted}
        </span>

        {/* Genre tag */}
        <span className="absolute top-2.5 left-2.5 px-2 py-0.5 text-[11px] font-medium bg-zinc-900/80 text-orange-400 rounded-md backdrop-blur-sm border border-orange-500/20 pointer-events-none">
          {track.genre}
        </span>
      </div>

      {/* Info & Creator */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="font-semibold truncate text-base">
            <Link
              to={`/track/${track.id}`}
              className="hover:text-orange-500 transition-colors block truncate"
            >
              {track.title}
            </Link>
          </h3>

          {/* Artist link with avatar */}
          <Link
            to={`/user/${track.userId}`}
            className="flex items-center gap-2 mt-2 text-sm text-muted-foreground hover:text-foreground transition-colors group/artist"
          >
            <Avatar className="w-5 h-5 ring-1 ring-border">
              <AvatarImage src={artist?.avatarUrl} alt={artist?.displayName} />
              <AvatarFallback className="text-[10px]">{artist?.displayName?.[0]}</AvatarFallback>
            </Avatar>
            <span className="truncate group-hover/artist:text-orange-500 transition-colors">
              {artist?.displayName}
            </span>
          </Link>
        </div>

        {/* Bottom row: Plays & Like Button */}
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/50 text-xs text-muted-foreground">
          <span>{track.playsCount.toLocaleString()} plays</span>

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 hover:bg-orange-500/10 active:scale-90 transition-all duration-200"
            onClick={(e: React.MouseEvent) => {
              e.preventDefault();
              e.stopPropagation();
              const nextState = !isLiked;
              setIsLiked(nextState);
              if (nextState) {
                setIsLikeAnimating(true);
              }
            }}
            title={isLiked ? "Unlike" : "Like"}
          >
            <Heart
              onAnimationEnd={() => setIsLikeAnimating(false)}
              className={`w-4 h-4 transition-all duration-300 ease-out ${
                isLiked
                  ? 'fill-orange-500 text-orange-500'
                  : 'text-muted-foreground hover:text-orange-400'
              } ${isLikeAnimating ? 'animate-heart-pop' : ''}`}
            />
          </Button>
        </div>
      </div>
    </div>
  );
}

export function FollowingFeed() {
  const { followingIds, followUser, isFollowing } = useAuth();
  const { playQueue } = usePlayer();

  const feedTracks = useMemo(() => {
    return getTracksByFollowingIds(followingIds);
  }, [followingIds]);

  const recommendedArtists = useMemo(() => {
    return mockUsers.filter(u => u.role !== 'admin').slice(0, 4);
  }, []);

  const handlePlayAll = () => {
    if (feedTracks.length > 0) {
      playQueue(feedTracks);
      toast.success('Afspeellijst van gevolgde artiesten gestart');
    }
  };

  return (
    <section className="py-14 px-4 sm:px-6 lg:px-8 border-b border-border/40">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-1.5 rounded-lg bg-orange-500/10 text-orange-500">
                <Users className="w-5 h-5" />
              </span>
              <h2 className="text-2xl sm:text-3xl font-bold">Following Feed</h2>
            </div>
            <p className="text-muted-foreground text-sm">
              Nieuwste muziek van makers die jij volgt
            </p>
          </div>

          {feedTracks.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="rounded-full border-orange-500/30 text-orange-500 hover:bg-orange-500 hover:text-white transition-all self-start sm:self-auto"
              onClick={handlePlayAll}
            >
              <Volume2 className="w-4 h-4 mr-1.5" />
              Alles afspelen ({feedTracks.length})
            </Button>
          )}
        </div>

        {/* Content */}
        {feedTracks.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {feedTracks.map((track) => (
              <FeedTrackCard key={track.id} track={track} />
            ))}
          </div>
        ) : (
          <div className="bg-card/60 border border-dashed border-border rounded-2xl p-8 sm:p-12 text-center max-w-2xl mx-auto">
            <div className="w-14 h-14 rounded-2xl bg-orange-500/10 text-orange-500 flex items-center justify-center mx-auto mb-4">
              <Sparkles className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Jouw feed is nog leeg</h3>
            <p className="text-muted-foreground text-sm mb-6 max-w-md mx-auto">
              Volg artiesten en makers om hier direct hun nieuwste releases en tracks te zien verschijnen.
            </p>

            {/* Quick follow recommendations */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
              {recommendedArtists.map((artist) => {
                const following = isFollowing(artist.id);
                return (
                  <div
                    key={artist.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-background border border-border"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 pr-2">
                      <Avatar className="w-9 h-9">
                        <AvatarImage src={artist.avatarUrl} alt={artist.displayName} />
                        <AvatarFallback>{artist.displayName[0]}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="font-medium text-xs truncate">{artist.displayName}</p>
                        <p className="text-[11px] text-muted-foreground truncate">
                          {artist.followersCount.toLocaleString()} volgers
                        </p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant={following ? "secondary" : "default"}
                      className={`h-8 px-3 rounded-full text-xs shrink-0 ${
                        following
                          ? "bg-orange-500/20 text-orange-400 border border-orange-500/30"
                          : "bg-orange-500 hover:bg-orange-600 text-white"
                      }`}
                      onClick={() => {
                        followUser(artist.id);
                        toast.success(`${artist.displayName} gevolgd!`);
                      }}
                      disabled={following}
                    >
                      {following ? (
                        <>
                          <Check className="w-3 h-3 mr-1" />
                          Volgend
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-3 h-3 mr-1" />
                          Volgen
                        </>
                      )}
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
