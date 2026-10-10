import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Play, Heart, UserPlus, Check, Sparkles, Volume2, Share2, Repeat2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { usePlayer } from '@/context/PlayerContext';
import { useAuth } from '@/context/AuthContext';
import { getTracksByFollowingIds, getUserById, mockUsers } from '@/data/mockData';
import { TrackCover } from '@/components/TrackCover';
import { ShareTrackModal } from '@/components/ShareTrackModal';
import type { Track } from '@/types';
import { toast } from 'sonner';

function FeedTrackCard({ track, onShare }: { track: Track; onShare: (t: Track) => void }) {
  const { playTrack, currentTrack, isPlaying } = usePlayer();
  const { toggleLike, isLiked: checkIsLiked, toggleRepost, isReposted: checkIsReposted, isAuthenticated } = useAuth();
  const isLiked = checkIsLiked(track.id);
  const isReposted = checkIsReposted(track.id);
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
      className="bg-[#161617]/90 border border-white/[0.08] hover:border-white/20 rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_16px_36px_rgba(0,0,0,0.6)] group flex flex-col p-3"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Cover Artwork & Overlay */}
      <div className="relative aspect-square overflow-hidden rounded-xl bg-black/40 shadow-sm">
        <Link to={`/track/${track.id}`} className="block w-full h-full" aria-label={track.title}>
          <TrackCover
            track={track}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            showBadge
          />
        </Link>

        {/* Backdrop overlay on hover */}
        <div
          className={`absolute inset-0 bg-black/35 backdrop-blur-[1px] transition-opacity duration-300 pointer-events-none ${
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
            className="pointer-events-auto w-12 h-12 rounded-full bg-white hover:bg-[#e5e5ea] text-black shadow-xl transform transition-transform duration-200 hover:scale-110 active:scale-95"
            onClick={handlePlay}
            aria-label={isCurrentTrack && isPlaying ? "Pauzeren" : "Afspelen"}
          >
            {isCurrentTrack && isPlaying ? (
              <div className="flex gap-1 items-center justify-center">
                <span className="w-1 h-3.5 bg-black rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
                <span className="w-1 h-3.5 bg-black rounded-full animate-bounce" style={{ animationDelay: '0.15s' }} />
                <span className="w-1 h-3.5 bg-black rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
              </div>
            ) : (
              <Play className="w-5 h-5 ml-0.5 fill-black" />
            )}
          </Button>
        </div>

        {/* Duration badge */}
        <span className="absolute bottom-2 right-2 px-2 py-0.5 text-[11px] font-mono bg-black/60 backdrop-blur-md text-white/90 rounded-full border border-white/10 pointer-events-none">
          {track.durationFormatted}
        </span>

        {/* Genre tag */}
        {track.genre && (
          <span className="absolute top-2 left-2 px-2 py-0.5 text-[10px] font-medium bg-white/15 text-white rounded-md backdrop-blur-md border border-white/10 pointer-events-none">
            {track.genre}
          </span>
        )}
      </div>

      {/* Info & Creator */}
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

          {/* Artist link with avatar */}
          <Link
            to={`/user/${track.userId}`}
            className="flex items-center gap-2 mt-1.5 text-xs text-[#86868b] hover:text-white transition-colors group/artist"
          >
            <Avatar className="w-4 h-4 ring-1 ring-white/10">
              <AvatarImage src={artist?.avatarUrl} alt={artist?.displayName} />
              <AvatarFallback className="text-[9px]">{artist?.displayName?.[0]}</AvatarFallback>
            </Avatar>
            <span className="truncate">
              {artist?.displayName}
            </span>
          </Link>
        </div>

        {/* Bottom row: Plays & Actions */}
        <div className="flex items-center justify-between mt-3 pt-2 border-t border-white/[0.04] text-[11px] text-[#86868b]">
          <span className="font-mono">{(track.playsCount || 0).toLocaleString()} streams</span>

          <div className="flex items-center gap-0.5">
            <Button
              variant="ghost"
              size="icon-sm"
              className={`h-7 w-7 rounded-full hover:bg-white/[0.08] active:scale-90 transition-all ${
                isLiked ? 'text-rose-500' : 'text-[#86868b] hover:text-white'
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
          </div>
        </div>
      </div>
    </div>
  );
}

export function FollowingFeed() {
  const { followingIds, followUser, isFollowing } = useAuth();
  const { playQueue } = usePlayer();
  const [shareTrack, setShareTrack] = useState<Track | null>(null);

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
    <section className="py-16 px-4 sm:px-6 lg:px-8 border-t border-white/[0.08] bg-black">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <div className="text-[11px] font-semibold text-[#fa233b] tracking-wider uppercase mb-1">
              Voor jou samengesteld
            </div>
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#f5f5f7]">
              Gevolgde Artiesten
            </h2>
            <p className="text-sm text-[#86868b] mt-1">
              De meest recente tracks en uploads van artiesten die jij volgt
            </p>
          </div>

          {feedTracks.length > 0 && (
            <Button
              variant="apple"
              size="sm"
              className="text-xs font-semibold px-4 self-start sm:self-auto"
              onClick={handlePlayAll}
            >
              <Volume2 className="w-3.5 h-3.5 mr-1.5" />
              Alles afspelen ({feedTracks.length})
            </Button>
          )}
        </div>

        {/* Content */}
        {feedTracks.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {feedTracks.map((track) => (
              <FeedTrackCard
                key={track.id}
                track={track}
                onShare={(t) => setShareTrack(t)}
              />
            ))}
          </div>
        ) : (
          <div className="bg-[#161617]/70 border border-white/[0.08] rounded-3xl p-8 sm:p-12 text-center max-w-2xl mx-auto backdrop-blur-xl shadow-xl">
            <div className="w-12 h-12 rounded-2xl bg-white/[0.08] text-[#fa233b] flex items-center justify-center mx-auto mb-4 border border-white/[0.08]">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-semibold tracking-tight text-white mb-2">
              Je persoonlijke feed is leeg
            </h3>
            <p className="text-[#86868b] text-sm mb-6 max-w-md mx-auto">
              Volg toonaangevende artiesten en makers om hier direct hun nieuwste releases te ontvangen.
            </p>

            {/* Quick follow recommendations */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
              {recommendedArtists.map((artist) => {
                const following = isFollowing(artist.id);
                return (
                  <div
                    key={artist.id}
                    className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.03] border border-white/[0.08] hover:border-white/20 transition-all"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 pr-2">
                      <Avatar className="w-9 h-9 ring-1 ring-white/10">
                        <AvatarImage src={artist.avatarUrl} alt={artist.displayName} />
                        <AvatarFallback>{artist.displayName[0]}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="font-semibold text-xs text-white truncate">{artist.displayName}</p>
                        <p className="text-[11px] text-[#86868b] truncate font-mono">
                          {artist.followersCount.toLocaleString()} volgers
                        </p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant={following ? "secondary" : "apple"}
                      className="h-7 px-3 rounded-full text-xs shrink-0 font-medium"
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

      <ShareTrackModal
        isOpen={!!shareTrack}
        onClose={() => setShareTrack(null)}
        track={shareTrack}
      />
    </section>
  );
}
