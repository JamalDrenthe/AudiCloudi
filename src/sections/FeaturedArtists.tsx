import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { UserPlus, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/context/AuthContext';
import { mockUsers } from '@/data/mockData';
import { toast } from 'sonner';

function ArtistCard({ artist, index }: { artist: typeof mockUsers[0]; index: number }) {
  const { followUser, unfollowUser, isFollowing } = useAuth();
  const following = isFollowing(artist.id);
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

  return (
    <div
      ref={cardRef}
      className="flex-shrink-0 w-44 opacity-0 group text-center"
      style={{ animationDelay: `${index * 0.04}s` }}
    >
      <Link to={`/artist/${artist.username}`} className="block">
        <div className="relative mb-3">
          <Avatar className="w-28 h-28 sm:w-32 sm:h-32 mx-auto ring-1 ring-white/15 group-hover:ring-[#fa233b]/60 group-hover:scale-105 transition-all duration-300 shadow-[0_8px_24px_rgba(0,0,0,0.6)]">
            <AvatarImage src={artist.avatarUrl} alt={artist.displayName} className="object-cover" />
            <AvatarFallback className="text-xl font-semibold bg-[#242426] text-white">{artist.displayName[0]}</AvatarFallback>
          </Avatar>
          {artist.labelName && (
            <span className="absolute bottom-0 right-1/2 translate-x-8 px-2 py-0.5 rounded-full text-[9px] font-semibold bg-[#fa233b] text-white shadow-md uppercase tracking-wider">
              {artist.labelName}
            </span>
          )}
        </div>
        <h3 className="font-semibold text-sm tracking-tight text-[#f5f5f7] truncate group-hover:text-white transition-colors">
          {artist.displayName}
        </h3>
        <p className="text-xs text-[#86868b] font-normal truncate mt-0.5">
          {artist.genre || 'Zheavenzy Creator'}
        </p>
        <p className="text-[11px] text-[#6e6e73] font-mono mt-0.5">
          {artist.followersCount.toLocaleString()} volgers
        </p>
      </Link>
      <Button
        variant={following ? "apple" : "secondary"}
        size="sm"
        className="mt-2.5 rounded-full w-full text-xs h-7 font-medium"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (following) {
            unfollowUser(artist.id);
            toast.success(`${artist.displayName} ontvolgd`);
          } else {
            followUser(artist.id);
            toast.success(`${artist.displayName} gevolgd!`);
          }
        }}
      >
        {following ? (
          <>
            <Check className="w-3 h-3 mr-1 text-black" />
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
}

export function FeaturedArtists() {
  const featuredArtists = mockUsers.filter(u => u.id !== '6' && u.id !== 'zheavenzy').slice(0, 15);

  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 bg-black border-t border-white/[0.08]">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-8">
          <div>
            <div className="text-[11px] font-semibold text-[#fa233b] tracking-wider uppercase mb-1">
              Spotlight
            </div>
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#f5f5f7]">
              Uitgelichte Artiesten
            </h2>
            <p className="text-sm text-[#86868b] mt-1">
              Ontdek getekende Zheavenzy makers en trending onafhankelijke producers
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/label/zheavenzy"
              className="text-xs text-[#f5f5f7] bg-white/[0.08] hover:bg-white/[0.14] border border-white/[0.08] px-3.5 py-1.5 rounded-full transition-all"
            >
              Zheavenzy Label
            </Link>
            <Link
              to="/artists"
              className="text-sm text-[#2997ff] hover:underline inline-flex items-center gap-1 font-normal group"
            >
              <span>Alle artiesten</span>
              <span className="transition-transform group-hover:translate-x-0.5">›</span>
            </Link>
          </div>
        </div>

        {/* Horizontal Scroll */}
        <div className="relative">
          <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory">
            {featuredArtists.map((artist, index) => (
              <div key={artist.id} className="snap-start">
                <ArtistCard artist={artist} index={index} />
              </div>
            ))}
          </div>
          {/* Fade edge */}
          <div className="absolute top-0 right-0 w-24 h-full bg-gradient-to-l from-black to-transparent pointer-events-none" />
        </div>
      </div>
    </section>
  );
}
