import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Music } from 'lucide-react';
import { mockGenres } from '@/data/mockData';

function GenreCard({ genre, index }: { genre: typeof mockGenres[0]; index: number }) {
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
      className="opacity-0"
      style={{ animationDelay: `${index * 0.05}s` }}
    >
      <Link to={`/genre/${genre.slug}`}>
        <div className="relative aspect-[4/3] rounded-xl overflow-hidden group">
          {/* Background Image */}
          <img
            src={genre.coverUrl}
            alt={genre.name}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
          {/* Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent transition-opacity duration-300 group-hover:opacity-90" />
          {/* Content */}
          <div className="absolute inset-0 flex flex-col justify-end p-6">
            <div className="flex items-center gap-2 mb-2">
              <Music className="w-5 h-5 text-orange-500" />
              <span className="text-sm text-white/80">{genre.tracksCount.toLocaleString()} tracks</span>
            </div>
            <h3 className="text-xl font-bold text-white group-hover:text-orange-500 transition-colors">
              {genre.name}
            </h3>
          </div>
        </div>
      </Link>
    </div>
  );
}

export function Genres() {
  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold">Explore Genres</h2>
            <p className="text-muted-foreground mt-1">Find your perfect sound</p>
          </div>
          <Link
            to="/genres"
            className="text-sm text-orange-500 hover:text-orange-400 transition-colors"
          >
            View All Genres
          </Link>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {mockGenres.map((genre, index) => (
            <GenreCard key={genre.id} genre={genre} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}
