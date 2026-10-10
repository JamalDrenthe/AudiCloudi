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
      style={{ animationDelay: `${index * 0.05}s` }}
    >
      <Link to={`/artist/${artist.username}`} className="block">
        <div className="relative mb-3">
          <Avatar className="w-32 h-32 mx-auto ring-4 ring-transparent group-hover:ring-orange-500/40 transition-all duration-300">
            <AvatarImage src={artist.avatarUrl} alt={artist.displayName} />
            <AvatarFallback className="text-2xl font-bold">{artist.displayName[0]}</AvatarFallback>
          </Avatar>
          {artist.labelName && (
            <span className="absolute bottom-0 right-1/2 translate-x-8 px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-500 text-white shadow">
              {artist.labelName}
            </span>
          )}
        </div>
        <h3 className="font-bold text-sm truncate group-hover:text-orange-500 transition-colors">
          {artist.displayName}
        </h3>
        <p className="text-xs text-orange-400 font-medium truncate mt-0.5">
          {artist.genre || 'Zheavenzy Artist'}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {artist.followersCount.toLocaleString()} volgers
        </p>
      </Link>
      <Button
        variant={following ? "secondary" : "outline"}
        size="sm"
        className={`mt-2.5 rounded-full w-full transition-all text-xs h-7 ${
          following
            ? "bg-orange-500/15 text-orange-400 border border-orange-500/30 hover:bg-orange-500/25"
            : "hover:border-orange-500/50"
        }`}
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
}

export function FeaturedArtists() {
  // Prioritize Zheavenzy artists and prominent creators
  const featuredArtists = mockUsers.filter(u => u.id !== '6' && u.id !== 'zheavenzy').slice(0, 15);

  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 bg-card border-y border-border/40">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-semibold mb-2">
              <span>Zheavenzy Records & Creators</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold">Featured Artists</h2>
            <p className="text-muted-foreground text-sm mt-1">Ontdek getekende Zheavenzy artiesten en hun eigen pagina's</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="rounded-full border-orange-500/30 text-orange-400 hover:bg-orange-500/10 text-xs" asChild>
              <Link to="/label/zheavenzy">Bekijk Zheavenzy Label</Link>
            </Button>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/artists">Bekijk Alle Artiesten →</Link>
            </Button>
          </div>
        </div>

        {/* Horizontal Scroll */}
        <div className="relative">
          <div className="flex gap-5 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory">
            {featuredArtists.map((artist, index) => (
              <div key={artist.id} className="snap-start">
                <ArtistCard artist={artist} index={index} />
              </div>
            ))}
          </div>
          {/* Fade edges */}
          <div className="absolute top-0 right-0 w-20 h-full bg-gradient-to-l from-card to-transparent pointer-events-none" />
        </div>
      </div>
    </section>
  );
}
