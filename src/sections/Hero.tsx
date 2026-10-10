import { Link } from 'react-router-dom';
import { Play, Pause, Upload, Sparkles, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { usePlayer } from '@/context/PlayerContext';
import { useTracks } from '@/context/TrackContext';
import { TrackCover } from '@/components/TrackCover';

export function Hero() {
  const { isAuthenticated } = useAuth();
  const { playTrack, togglePlay, currentTrack, isPlaying } = usePlayer();
  const { tracks } = useTracks();

  const showcaseTrack = tracks[0] || null;
  const isShowcasePlaying = isPlaying && currentTrack?.id === showcaseTrack?.id;

  const handleShowcasePlay = () => {
    if (!showcaseTrack) return;
    if (currentTrack?.id === showcaseTrack.id) {
      togglePlay();
    } else {
      playTrack(showcaseTrack);
    }
  };

  return (
    <section className="relative pt-12 pb-24 md:pt-20 md:pb-32 overflow-hidden bg-black">
      {/* Apple Subtle Ambient Lighting */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[550px] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#fa233b]/15 via-transparent to-transparent pointer-events-none blur-3xl" />
      <div className="absolute top-1/4 right-1/4 w-[450px] h-[450px] bg-blue-600/[0.04] rounded-full blur-3xl pointer-events-none" />

      {/* Hero Container */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Apple Micro-Eyebrow */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.06] border border-white/[0.08] backdrop-blur-md mb-8 animate-fade-in shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-[#fa233b]" />
          <span className="text-xs text-[#f5f5f7] font-medium tracking-wide">
            CloudiAudi — Muziek in zijn puurste vorm
          </span>
        </div>

        {/* Apple Display Headline */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-semibold tracking-[-0.035em] text-[#f5f5f7] leading-[1.06] mb-6 animate-slide-up">
          Puur geluid.
          <br />
          <span className="bg-clip-text text-transparent bg-gradient-to-b from-white via-[#f5f5f7] to-[#86868b]">
            Grenzeloos gedeeld.
          </span>
        </h1>

        {/* Apple Subheadline */}
        <p className="text-base sm:text-xl md:text-2xl text-[#86868b] max-w-2xl mx-auto mb-10 font-normal leading-relaxed tracking-[-0.015em] animate-slide-up" style={{ animationDelay: '0.1s' }}>
          Stream, upload en beleef muziek van onafhankelijke artiesten. Lossless audiokwaliteit, directe interactie en totale creatieve vrijheid.
        </p>

        {/* Apple Action CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-16 animate-slide-up" style={{ animationDelay: '0.15s' }}>
          <Button
            size="lg"
            variant="apple"
            className="rounded-full px-8 h-12 text-base font-medium shadow-[0_4px_24px_rgba(255,255,255,0.2)] hover:shadow-[0_6px_32px_rgba(255,255,255,0.3)] transition-all"
            onClick={handleShowcasePlay}
          >
            <Play className="w-4 h-4 mr-1.5 fill-black" />
            {isShowcasePlaying ? 'Pauzeer Preview' : 'Start met luisteren'}
          </Button>

          {isAuthenticated ? (
            <Button
              size="lg"
              variant="secondary"
              className="rounded-full px-7 h-12 text-base font-normal text-[#f5f5f7] hover:text-white"
              asChild
            >
              <Link to="/upload" className="flex items-center gap-1.5">
                <Upload className="w-4 h-4 text-[#86868b]" />
                <span>Upload je track</span>
                <ChevronRight className="w-4 h-4 text-[#86868b]" />
              </Link>
            </Button>
          ) : (
            <Button
              size="lg"
              variant="secondary"
              className="rounded-full px-7 h-12 text-base font-normal text-[#f5f5f7] hover:text-white"
              asChild
            >
              <Link to="/register" className="flex items-center gap-1">
                <span>Maak een account</span>
                <ChevronRight className="w-4 h-4 text-[#86868b]" />
              </Link>
            </Button>
          )}
        </div>

        {/* Apple Music Interactive Glass Showcase Card */}
        {showcaseTrack && (
          <div className="max-w-3xl mx-auto rounded-3xl border border-white/[0.1] bg-[#161617]/80 backdrop-blur-2xl shadow-[0_30px_100px_rgba(0,0,0,0.85)] p-5 sm:p-7 text-left transition-all hover:border-white/20 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <div className="flex items-center justify-between pb-4 mb-5 border-b border-white/[0.08]">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-white/20" />
                <span className="w-2.5 h-2.5 rounded-full bg-white/20" />
                <span className="w-2.5 h-2.5 rounded-full bg-white/20" />
                <span className="ml-2 text-[11px] font-mono tracking-wider text-[#86868b] uppercase">
                  CloudiAudi Spatial Player
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white/[0.08] text-[#f5f5f7] border border-white/[0.08] tracking-wider uppercase">
                  Lossless Audio
                </span>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#fa233b]/10 text-[#fa233b] border border-[#fa233b]/20 tracking-wider uppercase">
                  Studio Master
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-5">
              <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-2xl overflow-hidden flex-shrink-0 shadow-[0_12px_36px_rgba(0,0,0,0.6)] group ring-1 ring-white/10">
                <TrackCover track={showcaseTrack} className="w-full h-full object-cover" />
                <button
                  onClick={handleShowcasePlay}
                  className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Play track"
                >
                  <div className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center shadow-lg transform transition-transform hover:scale-105">
                    {isShowcasePlaying ? <Pause className="w-5 h-5 fill-black" /> : <Play className="w-5 h-5 fill-black ml-0.5" />}
                  </div>
                </button>
              </div>

              <div className="flex-1 min-w-0 text-center sm:text-left">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1.5">
                  <span className="text-[11px] font-semibold text-[#fa233b] uppercase tracking-wider">
                    Uitgelichte Track
                  </span>
                  <span className="text-[#86868b] text-xs">•</span>
                  <span className="text-xs text-[#86868b]">
                    {showcaseTrack.genre || 'Electronic / Trap'}
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-white truncate mb-1">
                  {showcaseTrack.title}
                </h2>
                <p className="text-sm text-[#86868b] truncate mb-4">
                  {showcaseTrack.userName || 'Artist'}
                </p>

                {/* Micro waveform visualizer simulation */}
                <div className="flex items-center gap-1.5 h-6">
                  {Array.from({ length: 32 }).map((_, i) => (
                    <span
                      key={i}
                        className={`flex-1 rounded-full transition-all duration-300 ${
                          isShowcasePlaying ? 'bg-[#fa233b]' : 'bg-white/20'
                        }`}
                        style={{
                          height: isShowcasePlaying
                            ? `${20 + ((i * 17) % 80)}%`
                            : `${15 + ((i * 7) % 50)}%`,
                        }}
                      />
                  ))}
                </div>
              </div>

              <div className="flex-shrink-0 flex sm:flex-col items-center gap-2">
                <Button
                  size="icon"
                  className="w-12 h-12 rounded-full bg-white hover:bg-[#e5e5ea] text-black shadow-lg"
                  onClick={handleShowcasePlay}
                  aria-label="Play or pause track"
                >
                  {isShowcasePlaying ? (
                    <Pause className="w-5 h-5 fill-black" />
                  ) : (
                    <Play className="w-5 h-5 fill-black ml-0.5" />
                  )}
                </Button>
                <Link
                  to={`/track/${showcaseTrack.id}`}
                  className="text-xs text-[#2997ff] hover:underline flex items-center gap-0.5"
                >
                  Details <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Apple 3-Metric Feature Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 max-w-3xl mx-auto mt-16 pt-12 border-t border-white/[0.08] animate-slide-up" style={{ animationDelay: '0.25s' }}>
          <div>
            <p className="text-3xl sm:text-4xl font-semibold tracking-tight text-[#f5f5f7]">10.000+</p>
            <p className="text-xs text-[#86868b] mt-1 tracking-tight">Tracks geüpload & gestreamd</p>
          </div>
          <div>
            <p className="text-3xl sm:text-4xl font-semibold tracking-tight text-[#f5f5f7]">Lossless</p>
            <p className="text-xs text-[#86868b] mt-1 tracking-tight">Studio Master Audiokwaliteit</p>
          </div>
          <div>
            <p className="text-3xl sm:text-4xl font-semibold tracking-tight text-[#f5f5f7]">100%</p>
            <p className="text-xs text-[#86868b] mt-1 tracking-tight">Directe artiestencommunity</p>
          </div>
        </div>
      </div>
    </section>
  );
}
