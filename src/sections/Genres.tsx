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
      style={{ animationDelay: `${index * 0.04}s` }}
    >
      <Link to={`/genre/${genre.slug}`} className="block group">
        <div className="relative aspect-[16/10] rounded-2xl overflow-hidden border border-white/[0.08] group-hover:border-white/20 transition-all duration-500 shadow-md group-hover:shadow-[0_16px_36px_rgba(0,0,0,0.6)]">
          {/* Background Image */}
          <img
            src={genre.coverUrl}
            alt={genre.name}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          />
          {/* Apple Gradient Vignette */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/20 group-hover:from-black/95 transition-all duration-300" />
          
          {/* Content */}
          <div className="absolute inset-0 flex flex-col justify-between p-5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono text-white/70 tracking-wider">
                {genre.tracksCount.toLocaleString()} tracks
              </span>
              <Music className="w-4 h-4 text-white/40 group-hover:text-white transition-colors" />
            </div>

            <div>
              <h3 className="text-xl sm:text-2xl font-semibold tracking-tight text-white group-hover:text-[#f5f5f7] transition-colors">
                {genre.name}
              </h3>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}

export function Genres() {
  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 border-t border-white/[0.08] bg-black">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <div className="text-[11px] font-semibold text-[#fa233b] tracking-wider uppercase mb-1">
              Categorieën
            </div>
            <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#f5f5f7]">
              Genres & Stemmingen
            </h2>
            <p className="text-sm text-[#86868b] mt-1">
              Verken geluiden per muzikaal genre en soundscapes
            </p>
          </div>
          <Link
            to="/search"
            className="text-sm text-[#2997ff] hover:underline inline-flex items-center gap-1 font-normal group"
          >
            <span>Verken alle categorieën</span>
            <span className="transition-transform group-hover:translate-x-0.5">›</span>
          </Link>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {mockGenres.map((genre, index) => (
            <GenreCard key={genre.id} genre={genre} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}
