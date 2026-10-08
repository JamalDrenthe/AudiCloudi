import { Navbar } from '@/components/Navbar';
import { AudioPlayer } from '@/components/AudioPlayer';
import { Hero } from '@/sections/Hero';
import { FollowingFeed } from '@/sections/FollowingFeed';
import { TrendingTracks } from '@/sections/TrendingTracks';
import { FeaturedArtists } from '@/sections/FeaturedArtists';
import { Genres } from '@/sections/Genres';
import { Footer } from '@/sections/Footer';

export function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-16">
        <Hero />
        <FollowingFeed />
        <TrendingTracks />
        <FeaturedArtists />
        <Genres />
        <Footer />
      </main>
      <AudioPlayer />
    </div>
  );
}
