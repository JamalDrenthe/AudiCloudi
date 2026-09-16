import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Play, Upload, Music } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';

export function Hero() {
  const { isAuthenticated } = useAuth();
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const hero = heroRef.current;
    if (!hero) return;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = hero.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      
      hero.style.setProperty('--mouse-x', `${x * 100}%`);
      hero.style.setProperty('--mouse-y', `${y * 100}%`);
    };

    hero.addEventListener('mousemove', handleMouseMove);
    return () => hero.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <section
      ref={heroRef}
      className="relative min-h-[70vh] flex items-center justify-center overflow-hidden"
      style={{
        background: 'radial-gradient(ellipse at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(249, 115, 22, 0.15) 0%, transparent 50%)',
      }}
    >
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-card" />
      
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-orange-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center py-20">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/10 border border-orange-500/20 mb-8 animate-fade-in">
          <Music className="w-4 h-4 text-orange-500" />
          <span className="text-sm text-orange-500 font-medium">100% Free Music Platform</span>
        </div>

        {/* Headline */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6 animate-slide-up">
          Discover & Share
          <br />
          <span className="text-gradient">Music Freely</span>
        </h1>

        {/* Subheadline */}
        <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          Upload, stream, and download tracks from independent artists worldwide.
          <br className="hidden sm:block" />
          No subscriptions. No limits. Just music.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <Button
            size="lg"
            className="rounded-full bg-orange-500 hover:bg-orange-600 text-white px-8 h-12 animate-pulse-glow"
            asChild
          >
            <Link to="/discover">
              <Play className="w-5 h-5 mr-2" />
              Start Listening
            </Link>
          </Button>
          {isAuthenticated ? (
            <Button
              size="lg"
              variant="outline"
              className="rounded-full px-8 h-12"
              asChild
            >
              <Link to="/upload">
                <Upload className="w-5 h-5 mr-2" />
                Upload Your Track
              </Link>
            </Button>
          ) : (
            <Button
              size="lg"
              variant="outline"
              className="rounded-full px-8 h-12"
              asChild
            >
              <Link to="/register">Create Account</Link>
            </Button>
          )}
        </div>

        {/* Stats */}
        <div className="flex items-center justify-center gap-8 sm:gap-12 mt-16 animate-slide-up" style={{ animationDelay: '0.3s' }}>
          <div className="text-center">
            <p className="text-2xl sm:text-3xl font-bold text-orange-500">10K+</p>
            <p className="text-sm text-muted-foreground">Tracks</p>
          </div>
          <div className="w-px h-12 bg-border" />
          <div className="text-center">
            <p className="text-2xl sm:text-3xl font-bold text-orange-500">5K+</p>
            <p className="text-sm text-muted-foreground">Artists</p>
          </div>
          <div className="w-px h-12 bg-border" />
          <div className="text-center">
            <p className="text-2xl sm:text-3xl font-bold text-orange-500">100%</p>
            <p className="text-sm text-muted-foreground">Free</p>
          </div>
        </div>
      </div>
    </section>
  );
}
