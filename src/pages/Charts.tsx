import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Trophy,
  Play,
  Shuffle,
  Flame,
  Coins,
  Repeat2,
  Heart,
  Share2,
  Sparkles,
  TrendingUp,
  Headphones,
  Crown,
  Medal,
  Award,
} from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { AudioPlayer } from '@/components/AudioPlayer';
import { TrackCover } from '@/components/TrackCover';
import { ShareTrackModal } from '@/components/ShareTrackModal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTrack } from '@/context/TrackContext';
import { usePlayer } from '@/context/PlayerContext';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import type { Track } from '@/types';

// Credit prize allocation for Top 20 ranking
export function getRankReward(rank: number): { credits: number; label: string; perk: string } {
  if (rank === 1) return { credits: 100000, label: '100.000 Credits', perk: '2x Gratis Mix & Master' };
  if (rank === 2) return { credits: 50000, label: '50.000 Credits', perk: '1x Gratis Mix & Master' };
  if (rank === 3) return { credits: 25000, label: '25.000 Credits', perk: '5x Gratis Uploads' };
  if (rank <= 10) return { credits: 15000, label: '15.000 Credits', perk: '3x Gratis Uploads' };
  return { credits: 5000, label: '5.000 Credits', perk: '1x Gratis Upload' };
}

export function Charts() {
  const { tracks } = useTrack();
  const { playTrack, currentTrack, isPlaying, playQueue, shufflePlayQueue } = usePlayer();
  const { toggleRepost, isReposted, toggleLike, isLiked, isAuthenticated } = useAuth();

  const [shareModalTrack, setShareModalTrack] = useState<Track | null>(null);

  // Sort all tracks descending by playsCount to form Top 20
  const top20Tracks = useMemo(() => {
    const sorted = [...tracks].sort((a, b) => (b.playsCount || 0) - (a.playsCount || 0));
    return sorted.slice(0, 20);
  }, [tracks]);

  const top3Tracks = useMemo(() => {
    return top20Tracks.slice(0, 3);
  }, [top20Tracks]);

  const handlePlayAll = () => {
    if (top20Tracks.length > 0) {
      playQueue(top20Tracks, 0);
      toast.success('Top 20 hitlijst gestart!');
    }
  };

  const handleShuffleTop20 = () => {
    if (top20Tracks.length > 0) {
      shufflePlayQueue(top20Tracks);
      toast.success('Top 20 nummers geshuffeld en afgespeeld!');
    }
  };

  const handleRepost = (trackId: string, trackTitle: string) => {
    if (!isAuthenticated) {
      toast.error('Log eerst in om nummers te herplaatsen.');
      return;
    }
    const reposted = toggleRepost(trackId);
    if (reposted) {
      toast.success(`"${trackTitle}" herplaatst op je profiel!`);
    } else {
      toast.info(`Herplaatsing van "${trackTitle}" verwijderd`);
    }
  };

  const handleLike = (trackId: string, trackTitle: string) => {
    if (!isAuthenticated) {
      toast.error('Log eerst in om nummers te liken.');
      return;
    }
    const liked = toggleLike(trackId);
    if (liked) {
      toast.success(`"${trackTitle}" toegevoegd aan je likes!`);
    } else {
      toast.info(`Like van "${trackTitle}" verwijderd`);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-32">
      <Navbar />

      <main className="pt-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Header Hero Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-orange-600/20 via-card to-card border border-orange-500/30 p-6 sm:p-10 shadow-2xl">
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/15 border border-orange-500/30 text-orange-400 text-xs font-semibold tracking-wide uppercase">
                <Flame className="w-3.5 h-3.5" />
                CloudiAudi Officiële Hitlijst
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white flex items-center gap-3">
                Top 20 Meest Geluisterd
                <Trophy className="w-8 h-8 sm:w-10 sm:h-10 text-amber-400 shrink-0" />
              </h1>
              <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
                De meest gestreamde tunes op CloudiAudi. Behaal een plek in de Top 20 en win
                automatisch credits voor gratis AI mixing, mastering of uploads!
              </p>

              {/* Prize Pool Highlights */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-2">
                <div className="p-2.5 rounded-xl bg-secondary/50 border border-amber-500/30 flex items-center gap-2.5">
                  <Crown className="w-5 h-5 text-amber-400 shrink-0" />
                  <div>
                    <p className="text-[11px] text-muted-foreground">#1 Hoofdprijs</p>
                    <p className="text-xs font-bold text-amber-400">100.000 Credits</p>
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-secondary/50 border border-slate-400/30 flex items-center gap-2.5">
                  <Medal className="w-5 h-5 text-slate-300 shrink-0" />
                  <div>
                    <p className="text-[11px] text-muted-foreground">#2 Plaats</p>
                    <p className="text-xs font-bold text-slate-200">50.000 Credits</p>
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-secondary/50 border border-amber-700/30 col-span-2 sm:col-span-1 flex items-center gap-2.5">
                  <Award className="w-5 h-5 text-amber-600 shrink-0" />
                  <div>
                    <p className="text-[11px] text-muted-foreground">Top 4 - 20</p>
                    <p className="text-xs font-bold text-orange-400">Tot 25.000 Credits</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Global Actions */}
            <div className="flex flex-wrap sm:flex-col gap-3 w-full sm:w-auto">
              <Button
                onClick={handlePlayAll}
                size="lg"
                className="bg-orange-500 hover:bg-orange-600 text-white rounded-full font-semibold shadow-lg shadow-orange-500/20 px-6 flex-1 sm:flex-initial"
              >
                <Play className="w-5 h-5 mr-2 fill-current" />
                Speel Top 20 Af
              </Button>
              <Button
                onClick={handleShuffleTop20}
                variant="outline"
                size="lg"
                className="rounded-full border-orange-500/40 hover:bg-orange-500/10 text-orange-300 font-semibold px-6 flex-1 sm:flex-initial"
              >
                <Shuffle className="w-5 h-5 mr-2" />
                Shuffle Top 20
              </Button>
            </div>
          </div>
        </div>

        {/* TOP 3 PODIUM SECTION */}
        {top3Tracks.length >= 3 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-400" />
                Het Podium
              </h2>
              <span className="text-xs text-muted-foreground">Live bijgewerkt op basis van plays</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              {/* #2 Silver */}
              <div className="order-2 md:order-1 p-5 rounded-2xl bg-gradient-to-b from-slate-500/10 to-card border border-slate-500/30 relative flex flex-col justify-between">
                <div className="absolute top-4 right-4 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-500/20 border border-slate-400/40 text-slate-300 text-xs font-bold">
                  <Medal className="w-3.5 h-3.5" /> #2 Zilver
                </div>

                <div>
                  <div className="w-24 h-24 rounded-2xl overflow-hidden shadow-xl mb-4 bg-muted relative group">
                    <TrackCover track={top3Tracks[1]} />
                    <button
                      onClick={() => playTrack(top3Tracks[1])}
                      className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                    >
                      <Play className="w-8 h-8 text-white fill-current" />
                    </button>
                  </div>
                  <Link
                    to={`/track/${top3Tracks[1].id}`}
                    className="font-bold text-base hover:text-orange-400 transition-colors block truncate"
                  >
                    {top3Tracks[1].title}
                  </Link>
                  <p className="text-sm text-muted-foreground truncate">{top3Tracks[1].userName || 'Artiest'}</p>
                  <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                    <Headphones className="w-3.5 h-3.5 text-orange-400" />
                    <span className="font-semibold text-foreground">
                      {(top3Tracks[1].playsCount || 0).toLocaleString()}
                    </span>
                    <span>plays</span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between">
                  <div className="text-xs">
                    <p className="text-muted-foreground text-[10px]">Beloning:</p>
                    <p className="font-bold text-slate-200 flex items-center gap-1">
                      <Coins className="w-3 h-3 text-orange-400" /> +50.000 Credits
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setShareModalTrack(top3Tracks[1])}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <Share2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* #1 Gold Champion */}
              <div className="order-1 md:order-2 p-6 rounded-2xl bg-gradient-to-b from-amber-500/20 via-orange-500/10 to-card border-2 border-amber-400/50 relative flex flex-col justify-between shadow-2xl md:-translate-y-2">
                <div className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/30 border border-amber-400 text-amber-300 text-xs font-black shadow-lg">
                  <Crown className="w-4 h-4 text-amber-300 fill-current" /> #1 GOUD KAMPIOEN
                </div>

                <div>
                  <div className="w-28 h-28 rounded-2xl overflow-hidden shadow-2xl mb-4 bg-muted relative group ring-4 ring-amber-400/30">
                    <TrackCover track={top3Tracks[0]} />
                    <button
                      onClick={() => playTrack(top3Tracks[0])}
                      className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                    >
                      <Play className="w-10 h-10 text-white fill-current" />
                    </button>
                  </div>
                  <Link
                    to={`/track/${top3Tracks[0].id}`}
                    className="font-black text-lg hover:text-amber-400 transition-colors block truncate"
                  >
                    {top3Tracks[0].title}
                  </Link>
                  <p className="text-sm text-muted-foreground truncate">{top3Tracks[0].userName || 'Artiest'}</p>
                  <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                    <Headphones className="w-4 h-4 text-amber-400" />
                    <span className="font-bold text-foreground text-base">
                      {(top3Tracks[0].playsCount || 0).toLocaleString()}
                    </span>
                    <span>plays</span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-amber-500/30 flex items-center justify-between">
                  <div className="text-xs">
                    <p className="text-muted-foreground text-[10px]">Kampioensbeloning:</p>
                    <p className="font-black text-amber-400 flex items-center gap-1 text-sm">
                      <Coins className="w-3.5 h-3.5" /> +100.000 Credits
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleLike(top3Tracks[0].id, top3Tracks[0].title)}
                      className={isLiked(top3Tracks[0].id) ? 'text-rose-500' : 'text-muted-foreground'}
                    >
                      <Heart className="w-4 h-4" fill={isLiked(top3Tracks[0].id) ? 'currentColor' : 'none'} />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => setShareModalTrack(top3Tracks[0])}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <Share2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* #3 Bronze */}
              <div className="order-3 p-5 rounded-2xl bg-gradient-to-b from-amber-700/10 to-card border border-amber-700/30 relative flex flex-col justify-between">
                <div className="absolute top-4 right-4 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-700/20 border border-amber-700/40 text-amber-400 text-xs font-bold">
                  <Award className="w-3.5 h-3.5" /> #3 Brons
                </div>

                <div>
                  <div className="w-24 h-24 rounded-2xl overflow-hidden shadow-xl mb-4 bg-muted relative group">
                    <TrackCover track={top3Tracks[2]} />
                    <button
                      onClick={() => playTrack(top3Tracks[2])}
                      className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                    >
                      <Play className="w-8 h-8 text-white fill-current" />
                    </button>
                  </div>
                  <Link
                    to={`/track/${top3Tracks[2].id}`}
                    className="font-bold text-base hover:text-orange-400 transition-colors block truncate"
                  >
                    {top3Tracks[2].title}
                  </Link>
                  <p className="text-sm text-muted-foreground truncate">{top3Tracks[2].userName || 'Artiest'}</p>
                  <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                    <Headphones className="w-3.5 h-3.5 text-orange-400" />
                    <span className="font-semibold text-foreground">
                      {(top3Tracks[2].playsCount || 0).toLocaleString()}
                    </span>
                    <span>plays</span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between">
                  <div className="text-xs">
                    <p className="text-muted-foreground text-[10px]">Beloning:</p>
                    <p className="font-bold text-amber-500 flex items-center gap-1">
                      <Coins className="w-3 h-3 text-orange-400" /> +25.000 Credits
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setShareModalTrack(top3Tracks[2])}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <Share2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* FULL TOP 20 LIST */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-orange-500" />
              Volledige Top 20 Lijst
            </h2>
            <span className="text-xs text-muted-foreground font-mono">{top20Tracks.length} tracks gerangschikt</span>
          </div>

          <div className="bg-card/60 backdrop-blur border border-border/80 rounded-2xl divide-y divide-border/40 overflow-hidden shadow-lg">
            {top20Tracks.map((track, idx) => {
              const rank = idx + 1;
              const isCurrent = currentTrack?.id === track.id;
              const reward = getRankReward(rank);
              const reposted = isReposted(track.id);
              const liked = isLiked(track.id);

              return (
                <div
                  key={track.id}
                  className={`flex items-center gap-3 sm:gap-4 p-3 sm:p-4 hover:bg-secondary/40 transition-colors group ${
                    isCurrent ? 'bg-orange-500/10' : ''
                  }`}
                >
                  {/* Rank number badge */}
                  <div className="w-7 sm:w-9 text-center font-black text-sm sm:text-base shrink-0">
                    {rank === 1 ? (
                      <span className="text-amber-400 font-extrabold flex items-center justify-center">1</span>
                    ) : rank === 2 ? (
                      <span className="text-slate-300 font-extrabold flex items-center justify-center">2</span>
                    ) : rank === 3 ? (
                      <span className="text-amber-600 font-extrabold flex items-center justify-center">3</span>
                    ) : (
                      <span className="text-muted-foreground font-semibold">{rank}</span>
                    )}
                  </div>

                  {/* Play Button & Cover Art */}
                  <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-xl overflow-hidden shrink-0 bg-muted group">
                    <TrackCover track={track} />
                    <button
                      onClick={() => playTrack(track)}
                      className={`absolute inset-0 bg-black/50 flex items-center justify-center transition-opacity ${
                        isCurrent && isPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                      }`}
                      aria-label="Play"
                    >
                      {isCurrent && isPlaying ? (
                        <div className="flex gap-0.5">
                          <span className="w-1 h-3.5 bg-orange-400 animate-bounce" />
                          <span className="w-1 h-3.5 bg-orange-400 animate-bounce" style={{ animationDelay: '0.1s' }} />
                          <span className="w-1 h-3.5 bg-orange-400 animate-bounce" style={{ animationDelay: '0.2s' }} />
                        </div>
                      ) : (
                        <Play className="w-5 h-5 text-white fill-current ml-0.5" />
                      )}
                    </button>
                  </div>

                  {/* Track Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Link
                        to={`/track/${track.id}`}
                        className={`font-semibold text-sm sm:text-base truncate block hover:underline ${
                          isCurrent ? 'text-orange-400' : 'text-foreground'
                        }`}
                      >
                        {track.title}
                      </Link>
                      {rank <= 3 && (
                        <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 hidden sm:inline">
                          Top {rank}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground truncate">
                      {track.userId ? (
                        <Link to={`/user/${track.userId}`} className="hover:text-foreground">
                          {track.userName || 'CloudiAudi Artiest'}
                        </Link>
                      ) : (
                        <span>{track.userName || 'CloudiAudi Artiest'}</span>
                      )}
                      <span>•</span>
                      <span className="capitalize">{track.genre}</span>
                    </div>
                  </div>

                  {/* Play Count Badge (Prominently visible) */}
                  <div className="hidden sm:flex flex-col items-end shrink-0 px-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                      <Headphones className="w-3.5 h-3.5 text-orange-400" />
                      <span>{(track.playsCount || 0).toLocaleString()}</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground">plays</span>
                  </div>

                  {/* Credit Prize Badge */}
                  <div className="hidden md:flex flex-col items-end shrink-0">
                    <Badge variant="outline" className="border-orange-500/30 text-orange-300 text-xs font-semibold gap-1">
                      <Coins className="w-3 h-3 text-orange-400" />
                      +{reward.credits.toLocaleString()}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground">{reward.perk}</span>
                  </div>

                  {/* Quick Action Buttons: Like, Repost, Share */}
                  <div className="flex items-center gap-1 shrink-0">
                    {/* Like */}
                    <button
                      onClick={() => handleLike(track.id, track.title)}
                      className={`p-2 rounded-full transition-colors hover:bg-secondary ${
                        liked ? 'text-rose-500' : 'text-muted-foreground hover:text-foreground'
                      }`}
                      title={liked ? 'Geliked' : 'Like'}
                    >
                      <Heart className="w-4 h-4" fill={liked ? 'currentColor' : 'none'} />
                    </button>

                    {/* Repost */}
                    <button
                      onClick={() => handleRepost(track.id, track.title)}
                      className={`p-2 rounded-full transition-colors hover:bg-secondary ${
                        reposted ? 'text-emerald-400' : 'text-muted-foreground hover:text-foreground'
                      }`}
                      title={reposted ? 'Herplaatst op je profiel' : 'Herplaatsen op profiel'}
                    >
                      <Repeat2 className="w-4 h-4" />
                    </button>

                    {/* Share */}
                    <button
                      onClick={() => setShareModalTrack(track)}
                      className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                      title="Deel naar socials"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {/* Share Modal */}
      <ShareTrackModal
        isOpen={!!shareModalTrack}
        onClose={() => setShareModalTrack(null)}
        track={shareModalTrack}
      />

      <AudioPlayer />
    </div>
  );
}
