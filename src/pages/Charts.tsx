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
    <div className="min-h-screen bg-black text-[#f5f5f7] pb-32">
      <Navbar />

      <main className="pt-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Apple Music Header Hero Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-[#161617]/90 border border-white/[0.08] p-6 sm:p-10 shadow-[0_20px_60px_rgba(0,0,0,0.8)] backdrop-blur-2xl">
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-96 h-96 bg-[#fa233b]/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.06] border border-white/[0.08] text-[#f5f5f7] text-xs font-semibold tracking-wider uppercase">
                <Flame className="w-3.5 h-3.5 text-[#fa233b]" />
                CloudiAudi Officiële Hitlijst
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-[-0.03em] text-white flex items-center gap-3">
                Top 20 Hitlijst
                <Trophy className="w-8 h-8 sm:w-10 sm:h-10 text-amber-400 shrink-0" />
              </h1>
              <p className="text-[#86868b] text-sm sm:text-base leading-relaxed tracking-[-0.01em]">
                De meest gestreamde tracks op CloudiAudi. Behaal een plek in de Top 20 en win automatisch platformcredits voor gratis mixen, masteren of uploaden.
              </p>

              {/* Prize Pool Highlights */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-2">
                <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex items-center gap-3">
                  <Crown className="w-5 h-5 text-amber-400 shrink-0" />
                  <div>
                    <p className="text-[11px] text-[#86868b]">#1 Hoofdprijs</p>
                    <p className="text-xs font-semibold text-amber-400">100.000 Credits</p>
                  </div>
                </div>
                <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex items-center gap-3">
                  <Medal className="w-5 h-5 text-slate-300 shrink-0" />
                  <div>
                    <p className="text-[11px] text-[#86868b]">#2 Plaats</p>
                    <p className="text-xs font-semibold text-slate-200">50.000 Credits</p>
                  </div>
                </div>
                <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/[0.08] col-span-2 sm:col-span-1 flex items-center gap-3">
                  <Award className="w-5 h-5 text-amber-600 shrink-0" />
                  <div>
                    <p className="text-[11px] text-[#86868b]">Top 4 - 20</p>
                    <p className="text-xs font-semibold text-white">Tot 25.000 Credits</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Apple Style CTAs */}
            <div className="flex flex-wrap sm:flex-col gap-3 w-full sm:w-auto">
              <Button
                onClick={handlePlayAll}
                size="lg"
                variant="apple"
                className="px-6 flex-1 sm:flex-initial text-sm font-semibold h-11"
              >
                <Play className="w-4 h-4 mr-2 fill-black" />
                Speel Top 20 Af
              </Button>
              <Button
                onClick={handleShuffleTop20}
                variant="secondary"
                size="lg"
                className="px-6 flex-1 sm:flex-initial text-sm font-normal h-11"
              >
                <Shuffle className="w-4 h-4 mr-2" />
                Shuffle Top 20
              </Button>
            </div>
          </div>
        </div>

        {/* TOP 3 PODIUM SECTION */}
        {top3Tracks.length >= 3 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[11px] font-semibold text-[#fa233b] tracking-wider uppercase">Hitlijst Leiders</span>
                <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-400" />
                  Het Podium
                </h2>
              </div>
              <span className="text-xs text-[#86868b]">Live bijgewerkt op basis van plays</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2">
              {/* #2 Silver */}
              <div className="order-2 md:order-1 p-5 rounded-3xl bg-[#161617]/90 border border-white/[0.08] relative flex flex-col justify-between shadow-lg">
                <div className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.08] border border-white/10 text-slate-200 text-xs font-semibold">
                  <Medal className="w-3.5 h-3.5" /> #2 Zilver
                </div>

                <div>
                  <div className="w-24 h-24 rounded-2xl overflow-hidden shadow-xl mb-4 bg-black/40 relative group ring-1 ring-white/10">
                    <TrackCover track={top3Tracks[1]} />
                    <button
                      onClick={() => playTrack(top3Tracks[1])}
                      className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                      aria-label="Play"
                    >
                      <div className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center shadow-md">
                        <Play className="w-5 h-5 fill-black ml-0.5" />
                      </div>
                    </button>
                  </div>
                  <Link
                    to={`/track/${top3Tracks[1].id}`}
                    className="font-semibold text-base text-white hover:underline transition-colors block truncate"
                  >
                    {top3Tracks[1].title}
                  </Link>
                  <p className="text-xs text-[#86868b] truncate mt-0.5">{top3Tracks[1].userName || 'Artiest'}</p>
                  <div className="flex items-center gap-2 mt-2 text-xs text-[#86868b]">
                    <Headphones className="w-3.5 h-3.5 text-white/60" />
                    <span className="font-semibold text-white">
                      {(top3Tracks[1].playsCount || 0).toLocaleString()}
                    </span>
                    <span>streams</span>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-white/[0.06] flex items-center justify-between">
                  <div className="text-xs">
                    <p className="text-[#86868b] text-[10px]">Beloning:</p>
                    <p className="font-semibold text-slate-200 flex items-center gap-1">
                      <Coins className="w-3 h-3 text-amber-400" /> +50.000 Credits
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setShareModalTrack(top3Tracks[1])}
                    className="text-[#86868b] hover:text-white rounded-full h-8 w-8 p-0"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>

              {/* #1 Gold Champion */}
              <div className="order-1 md:order-2 p-6 rounded-3xl bg-[#1c1c1e] border-2 border-amber-400/50 relative flex flex-col justify-between shadow-[0_20px_60px_rgba(0,0,0,0.8)] md:-translate-y-2">
                <div className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-xs font-semibold shadow-md">
                  <Crown className="w-4 h-4 text-amber-300 fill-current" /> #1 GOUD
                </div>

                <div>
                  <div className="w-28 h-28 rounded-2xl overflow-hidden shadow-2xl mb-4 bg-black/40 relative group ring-2 ring-amber-400/50">
                    <TrackCover track={top3Tracks[0]} />
                    <button
                      onClick={() => playTrack(top3Tracks[0])}
                      className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                      aria-label="Play"
                    >
                      <div className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center shadow-lg">
                        <Play className="w-6 h-6 fill-black ml-0.5" />
                      </div>
                    </button>
                  </div>
                  <Link
                    to={`/track/${top3Tracks[0].id}`}
                    className="font-bold text-lg text-white hover:underline transition-colors block truncate"
                  >
                    {top3Tracks[0].title}
                  </Link>
                  <p className="text-xs text-[#86868b] truncate mt-0.5">{top3Tracks[0].userName || 'Artiest'}</p>
                  <div className="flex items-center gap-2 mt-2 text-sm text-[#86868b]">
                    <Headphones className="w-4 h-4 text-amber-400" />
                    <span className="font-semibold text-white">
                      {(top3Tracks[0].playsCount || 0).toLocaleString()}
                    </span>
                    <span>streams</span>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-white/[0.08] flex items-center justify-between">
                  <div className="text-xs">
                    <p className="text-[#86868b] text-[10px]">Kampioensbeloning:</p>
                    <p className="font-semibold text-amber-400 flex items-center gap-1 text-sm">
                      <Coins className="w-3.5 h-3.5" /> +100.000 Credits
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      onClick={() => handleLike(top3Tracks[0].id, top3Tracks[0].title)}
                      className={`rounded-full ${isLiked(top3Tracks[0].id) ? 'text-rose-500' : 'text-[#86868b] hover:text-white'}`}
                    >
                      <Heart className="w-4 h-4" fill={isLiked(top3Tracks[0].id) ? 'currentColor' : 'none'} />
                    </Button>
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      onClick={() => setShareModalTrack(top3Tracks[0])}
                      className="text-[#86868b] hover:text-white rounded-full"
                    >
                      <Share2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* #3 Bronze */}
              <div className="order-3 p-5 rounded-3xl bg-[#161617]/90 border border-white/[0.08] relative flex flex-col justify-between shadow-lg">
                <div className="absolute top-4 right-4 flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-900/20 border border-amber-700/40 text-amber-400 text-xs font-semibold">
                  <Award className="w-3.5 h-3.5" /> #3 Brons
                </div>

                <div>
                  <div className="w-24 h-24 rounded-2xl overflow-hidden shadow-xl mb-4 bg-black/40 relative group ring-1 ring-white/10">
                    <TrackCover track={top3Tracks[2]} />
                    <button
                      onClick={() => playTrack(top3Tracks[2])}
                      className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                      aria-label="Play"
                    >
                      <div className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center shadow-md">
                        <Play className="w-5 h-5 fill-black ml-0.5" />
                      </div>
                    </button>
                  </div>
                  <Link
                    to={`/track/${top3Tracks[2].id}`}
                    className="font-semibold text-base text-white hover:underline transition-colors block truncate"
                  >
                    {top3Tracks[2].title}
                  </Link>
                  <p className="text-xs text-[#86868b] truncate mt-0.5">{top3Tracks[2].userName || 'Artiest'}</p>
                  <div className="flex items-center gap-2 mt-2 text-xs text-[#86868b]">
                    <Headphones className="w-3.5 h-3.5 text-white/60" />
                    <span className="font-semibold text-white">
                      {(top3Tracks[2].playsCount || 0).toLocaleString()}
                    </span>
                    <span>streams</span>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-white/[0.06] flex items-center justify-between">
                  <div className="text-xs">
                    <p className="text-[#86868b] text-[10px]">Beloning:</p>
                    <p className="font-semibold text-amber-500 flex items-center gap-1">
                      <Coins className="w-3 h-3 text-amber-400" /> +25.000 Credits
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setShareModalTrack(top3Tracks[2])}
                    className="text-[#86868b] hover:text-white rounded-full h-8 w-8 p-0"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* FULL TOP 20 LIST (Apple Music Chart Table) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-[#fa233b] tracking-wider uppercase">Compleet Overzicht</span>
              <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-[#fa233b]" />
                Volledige Top 20 Lijst
              </h2>
            </div>
            <span className="text-xs text-[#86868b] font-mono">{top20Tracks.length} tracks gerangschikt</span>
          </div>

          <div className="bg-[#161617]/70 backdrop-blur-2xl border border-white/[0.08] rounded-3xl divide-y divide-white/[0.05] overflow-hidden shadow-2xl">
            {top20Tracks.map((track, idx) => {
              const rank = idx + 1;
              const isCurrent = currentTrack?.id === track.id;
              const reward = getRankReward(rank);
              const reposted = isReposted(track.id);
              const liked = isLiked(track.id);

              return (
                <div
                  key={track.id}
                  className={`flex items-center gap-3 sm:gap-4 p-3 sm:p-4 hover:bg-white/[0.04] transition-colors group ${
                    isCurrent ? 'bg-white/[0.06]' : ''
                  }`}
                >
                  {/* Rank number */}
                  <div className="w-7 sm:w-9 text-center font-mono text-sm sm:text-base shrink-0">
                    {rank === 1 ? (
                      <span className="text-amber-400 font-bold">01</span>
                    ) : rank === 2 ? (
                      <span className="text-slate-300 font-bold">02</span>
                    ) : rank === 3 ? (
                      <span className="text-amber-600 font-bold">03</span>
                    ) : (
                      <span className="text-[#86868b] font-normal">{rank.toString().padStart(2, '0')}</span>
                    )}
                  </div>

                  {/* Play Button & Cover Art */}
                  <div className="relative w-12 h-12 sm:w-14 sm:h-14 rounded-xl overflow-hidden shrink-0 bg-black/40 ring-1 ring-white/10 group">
                    <TrackCover track={track} />
                    <button
                      onClick={() => playTrack(track)}
                      className={`absolute inset-0 bg-black/45 flex items-center justify-center transition-opacity ${
                        isCurrent && isPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                      }`}
                      aria-label="Play"
                    >
                      {isCurrent && isPlaying ? (
                        <div className="flex gap-0.5 items-center">
                          <span className="w-1 h-3.5 bg-white rounded-full animate-bounce" />
                          <span className="w-1 h-3.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                          <span className="w-1 h-3.5 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center shadow-md">
                          <Play className="w-4 h-4 fill-black ml-0.5" />
                        </div>
                      )}
                    </button>
                  </div>

                  {/* Track Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Link
                        to={`/track/${track.id}`}
                        className={`font-semibold text-sm sm:text-base truncate block hover:underline ${
                          isCurrent ? 'text-[#fa233b]' : 'text-white'
                        }`}
                      >
                        {track.title}
                      </Link>
                      {rank <= 3 && (
                        <span className="text-[9px] uppercase font-semibold tracking-wider px-2 py-0.5 rounded-full bg-white/[0.08] text-white border border-white/10 hidden sm:inline">
                          Top {rank}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-[#86868b] truncate mt-0.5">
                      {track.userId ? (
                        <Link to={`/user/${track.userId}`} className="hover:text-white transition-colors">
                          {track.userName || 'CloudiAudi Artiest'}
                        </Link>
                      ) : (
                        <span>{track.userName || 'CloudiAudi Artiest'}</span>
                      )}
                      <span>•</span>
                      <span className="capitalize">{track.genre}</span>
                    </div>
                  </div>

                  {/* Play Count Badge */}
                  <div className="hidden sm:flex flex-col items-end shrink-0 px-2">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-white">
                      <Headphones className="w-3.5 h-3.5 text-[#86868b]" />
                      <span>{(track.playsCount || 0).toLocaleString()}</span>
                    </div>
                    <span className="text-[10px] text-[#86868b]">streams</span>
                  </div>

                  {/* Credit Prize Badge */}
                  <div className="hidden md:flex flex-col items-end shrink-0">
                    <span className="px-2.5 py-0.5 rounded-full bg-white/[0.06] border border-white/[0.08] text-amber-400 text-xs font-semibold flex items-center gap-1">
                      <Coins className="w-3 h-3 text-amber-400" />
                      +{reward.credits.toLocaleString()}
                    </span>
                    <span className="text-[10px] text-[#86868b] mt-0.5">{reward.perk}</span>
                  </div>

                  {/* Quick Action Buttons */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleLike(track.id, track.title)}
                      className={`p-2 rounded-full transition-colors hover:bg-white/[0.08] ${
                        liked ? 'text-rose-500' : 'text-[#86868b] hover:text-white'
                      }`}
                      title={liked ? 'Geliked' : 'Like'}
                    >
                      <Heart className="w-4 h-4" fill={liked ? 'currentColor' : 'none'} />
                    </button>

                    <button
                      onClick={() => handleRepost(track.id, track.title)}
                      className={`p-2 rounded-full transition-colors hover:bg-white/[0.08] ${
                        reposted ? 'text-emerald-400' : 'text-[#86868b] hover:text-white'
                      }`}
                      title={reposted ? 'Herplaatst op je profiel' : 'Herplaatsen op profiel'}
                    >
                      <Repeat2 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => setShareModalTrack(track)}
                      className="p-2 rounded-full text-[#86868b] hover:text-white hover:bg-white/[0.08] transition-colors"
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
