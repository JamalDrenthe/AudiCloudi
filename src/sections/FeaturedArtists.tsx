import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/context/AuthContext';
import { mockUsers } from '@/data/mockData';

function ArtistCard({ artist, index }: { artist: typeof mockUsers[0]; index: number }) {
  const { isAuthenticated } = useAuth();
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
      className="flex-shrink-0 w-40 opacity-0 group text-center"
      style={{ animationDelay: `${index * 0.05}s` }}
    >
      <Link to={`/user/${artist.id}`} className="block">
        <div className="relative mb-4">
          <Avatar className="w-32 h-32 mx-auto ring-4 ring-transparent group-hover:ring-orange-500/30 transition-all duration-300">
            <AvatarImage src={artist.avatarUrl} alt={artist.displayName} />
            <AvatarFallback className="text-2xl">{artist.displayName[0]}</AvatarFallback>
          </Avatar>
        </div>
        <h3 className="font-semibold truncate group-hover:text-orange-500 transition-colors">
          {artist.displayName}
        </h3>
        <p className="text-sm text-muted-foreground">
          {artist.followersCount.toLocaleString()} followers
        </p>
      </Link>
      {isAuthenticated && (
        <Button
          variant="outline"
          size="sm"
          className="mt-3 rounded-full w-full"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          <UserPlus className="w-4 h-4 mr-1" />
          Follow
        </Button>
      )}
    </div>
  );
}

export function FeaturedArtists() {
  const featuredArtists = mockUsers.filter(u => u.role !== 'admin').slice(0, 10);

  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 bg-card">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold">Featured Artists</h2>
            <p className="text-muted-foreground mt-1">Discover talented creators</p>
          </div>
          <Button variant="ghost" asChild>
            <Link to="/artists">View All</Link>
          </Button>
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
          {/* Fade edges */}
          <div className="absolute top-0 right-0 w-20 h-full bg-gradient-to-l from-card to-transparent pointer-events-none" />
        </div>
      </div>
    </section>
  );
}
