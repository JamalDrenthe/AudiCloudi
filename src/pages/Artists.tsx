import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Building2,
  Music2,
  Search,
  UserPlus,
  Check,
  Play,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Navbar } from '@/components/Navbar';
import { AudioPlayer } from '@/components/AudioPlayer';
import { Footer } from '@/sections/Footer';
import { useAuth } from '@/context/AuthContext';
import { usePlayer } from '@/context/PlayerContext';
import { useTracks } from '@/context/TrackContext';
import { mockUsers, getArtistsByLabel } from '@/data/mockData';
import { toast } from 'sonner';

export function Artists() {
  const { followUser, unfollowUser, isFollowing, isAuthenticated } = useAuth();
  const { playTrack } = usePlayer();
  const { tracks } = useTracks();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('All');

  // Zheavenzy Label Profile
  const zheavenzyLabel = useMemo(() => {
    return mockUsers.find((u) => u.id === 'zheavenzy' || u.username === 'zheavenzy');
  }, []);

  // All Signed Artists under Zheavenzy
  const zheavenzyArtists = useMemo(() => {
    return getArtistsByLabel('zheavenzy');
  }, []);

  // Filtered artists based on search and genre
  const filteredArtists = useMemo(() => {
    return zheavenzyArtists.filter((artist) => {
      const matchesSearch =
        artist.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        artist.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (artist.genre && artist.genre.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (artist.bio && artist.bio.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesGenre =
        selectedGenre === 'All' ||
        (artist.genre && artist.genre.toLowerCase().includes(selectedGenre.toLowerCase()));

      return matchesSearch && matchesGenre;
    });
  }, [zheavenzyArtists, searchQuery, selectedGenre]);

  // Cypher / Anthem track
  const cypherTrack = useMemo(() => {
    return tracks.find((t) => t.id === 'track_zheavenzy_cypher');
  }, [tracks]);

  const handlePlayCypher = () => {
    if (cypherTrack) {
      playTrack(cypherTrack);
      toast.success('Zheavenzy Roster Cypher 2026 wordt afgespeeld!');
    }
  };

  const handleToggleFollow = (artistId: string, artistName: string) => {
    if (!isAuthenticated) {
      toast.error('Log eerst in om deze artiest te volgen.');
      return;
    }
    if (isFollowing(artistId)) {
      unfollowUser(artistId);
      toast.success(`${artistName} ontvolgd`);
    } else {
      followUser(artistId);
      toast.success(`${artistName} gevolgd!`);
    }
  };

  const genresList = ['All', 'Trap', 'Hip Hop', 'R&B', 'New Wave', 'Drill', 'Pop', 'Electronic'];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-24 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-12">
          {/* HEADER & LABEL SPOTLIGHT BANNER */}
          <section className="relative rounded-3xl overflow-hidden border border-orange-500/30 bg-gradient-to-br from-card via-card/90 to-background shadow-2xl">
            {/* Background glow & studio banner image */}
            <div className="absolute inset-0 opacity-20 pointer-events-none">
              <img
                src={zheavenzyLabel?.bannerUrl || 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=1400&h=450&fit=crop'}
                alt="Zheavenzy Records"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
            </div>

            <div className="relative p-6 sm:p-10 lg:p-12 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8 z-10">
              <div className="space-y-4 max-w-3xl">
                {/* Pill */}
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-orange-500/40 text-orange-300 text-xs font-bold">
                  <Building2 className="w-3.5 h-3.5 text-orange-400" />
                  <span>Officieel Muzieklabel • Zheavenzy Records</span>
                </div>

                <div className="flex items-center gap-4">
                  <Avatar className="w-16 h-16 sm:w-20 sm:h-20 ring-4 ring-orange-500/30 shadow-xl">
                    <AvatarImage src={zheavenzyLabel?.avatarUrl} alt="Zheavenzy" />
                    <AvatarFallback className="text-xl font-black bg-orange-600 text-white">Z</AvatarFallback>
                  </Avatar>
                  <div>
                    <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white flex items-center gap-2">
                      Zheavenzy
                      <ShieldCheck className="w-6 h-6 text-orange-400 fill-orange-400/20" />
                    </h1>
                    <p className="text-sm text-orange-400 font-semibold mt-0.5">
                      The Home of Sonic Innovation & Visionary Artists
                    </p>
                  </div>
                </div>

                <p className="text-sm sm:text-base text-foreground/80 leading-relaxed">
                  Zheavenzy is de toonaangevende muzikale broedplaats voor Jamal Drenthe, Askylon, Rowu, Youandi,
                  Raka VW, AR, Le3, Noddy North, Shawn Basterd, H.E.G. (High Educated Gangster) en Andreea Comandaru.
                  Iedere artiest heeft zijn eigen unieke stijl, sound en eigen profielpagina.
                </p>

                {/* Label Stats */}
                <div className="flex items-center gap-6 sm:gap-8 pt-2 flex-wrap text-sm">
                  <div>
                    <p className="text-xl font-black text-white">{zheavenzyArtists.length}</p>
                    <p className="text-xs text-muted-foreground">Getekende Artiesten</p>
                  </div>
                  <div className="w-px h-8 bg-border" />
                  <div>
                    <p className="text-xl font-black text-orange-400">23</p>
                    <p className="text-xs text-muted-foreground">Officiële Releases</p>
                  </div>
                  <div className="w-px h-8 bg-border" />
                  <div>
                    <p className="text-xl font-black text-white">
                      {(zheavenzyLabel?.followersCount || 48200).toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">Label Volgers</p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row lg:flex-col gap-3 w-full sm:w-auto shrink-0">
                <Button
                  size="lg"
                  className="rounded-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold shadow-lg shadow-orange-500/25 h-12 px-6"
                  asChild
                >
                  <Link to="/label/zheavenzy">
                    <Building2 className="w-4 h-4 mr-2" />
                    Bekijk Zheavenzy Label Pagina
                  </Link>
                </Button>

                {cypherTrack && (
                  <Button
                    size="lg"
                    variant="outline"
                    className="rounded-full border-orange-500/40 text-orange-300 hover:bg-orange-500/10 h-12 px-6 font-semibold"
                    onClick={handlePlayCypher}
                  >
                    <Play className="w-4 h-4 mr-2 fill-current" />
                    Speel Roster All-Stars Cypher
                  </Button>
                )}
              </div>
            </div>
          </section>

          {/* SEARCH & GENRE FILTER TOOLBAR */}
          <section className="space-y-4">
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-2">
                  <Music2 className="w-6 h-6 text-orange-400" />
                  Zheavenzy Artiesten Roster
                </h2>
                <p className="text-sm text-muted-foreground mt-0.5">
                  11 getekende artiesten met allemaal een eigen artiestenpagina, discografie en bio.
                </p>
              </div>

              {/* Search input */}
              <div className="relative w-full md:w-80">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Zoek artiest, stijl of naam..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-secondary/60 rounded-full border-border/80 focus-visible:ring-orange-500"
                />
              </div>
            </div>

            {/* Genre chips */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {genresList.map((g) => (
                <button
                  key={g}
                  onClick={() => setSelectedGenre(g)}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                    selectedGenre === g
                      ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                      : 'bg-secondary/70 text-muted-foreground hover:text-foreground hover:bg-secondary'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </section>

          {/* ARTISTS GRID */}
          <section>
            {filteredArtists.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {filteredArtists.map((artist) => {
                  const following = isFollowing(artist.id);
                  return (
                    <div
                      key={artist.id}
                      className="group bg-card rounded-2xl border border-border/70 hover:border-orange-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-orange-500/5 flex flex-col justify-between overflow-hidden"
                    >
                      {/* Card Header with Banner background */}
                      <div className="relative h-28 bg-muted overflow-hidden">
                        <img
                          src={artist.bannerUrl}
                          alt={artist.displayName}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-card via-card/50 to-transparent" />
                        <span className="absolute top-3 right-3 text-[10px] font-bold px-2 py-0.5 rounded-full bg-black/60 text-orange-400 border border-orange-500/30 backdrop-blur-sm">
                          Zheavenzy
                        </span>
                      </div>

                      {/* Avatar & Info */}
                      <div className="p-5 pt-0 relative flex-1 flex flex-col justify-between">
                        <div className="-mt-12 flex justify-between items-end mb-3">
                          <Link to={`/artist/${artist.username}`}>
                            <Avatar className="w-20 h-20 ring-4 ring-card group-hover:ring-orange-500/40 transition-all">
                              <AvatarImage src={artist.avatarUrl} alt={artist.displayName} />
                              <AvatarFallback className="font-bold text-lg">{artist.displayName[0]}</AvatarFallback>
                            </Avatar>
                          </Link>
                          <Button
                            size="sm"
                            variant={following ? 'secondary' : 'outline'}
                            className={`rounded-full text-xs h-8 px-3 ${
                              following
                                ? 'bg-orange-500/15 text-orange-400 border-orange-500/30'
                                : 'hover:border-orange-500/50'
                            }`}
                            onClick={() => handleToggleFollow(artist.id, artist.displayName)}
                          >
                            {following ? (
                              <>
                                <Check className="w-3 h-3 mr-1" />
                                Volgend
                              </>
                            ) : (
                              <>
                                <UserPlus className="w-3 h-3 mr-1" />
                                Volg
                              </>
                            )}
                          </Button>
                        </div>

                        <div>
                          <Link
                            to={`/artist/${artist.username}`}
                            className="font-black text-lg text-foreground group-hover:text-orange-400 transition-colors block truncate"
                          >
                            {artist.displayName}
                          </Link>
                          <p className="text-xs text-orange-400 font-medium">{artist.genre || 'Zheavenzy Artist'}</p>
                          <p className="text-xs text-muted-foreground mt-2 line-clamp-3 leading-relaxed">
                            {artist.bio}
                          </p>
                        </div>

                        {/* Card Footer */}
                        <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">
                            {artist.followersCount.toLocaleString()} volgers
                          </span>
                          <Button
                            size="sm"
                            variant="secondary"
                            className="rounded-full text-xs h-7 px-3 group-hover:bg-orange-500 group-hover:text-white transition-colors"
                            asChild
                          >
                            <Link to={`/artist/${artist.username}`}>
                              Eigen Pagina
                              <ArrowRight className="w-3 h-3 ml-1" />
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-20 bg-card/30 rounded-3xl border border-border/50">
                <Music2 className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-white">Geen artiesten gevonden</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Probeer een andere zoekterm of selecteer een ander genre.
                </p>
                <Button
                  variant="outline"
                  className="mt-4 rounded-full"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedGenre('All');
                  }}
                >
                  Filters Resetten
                </Button>
              </div>
            )}
          </section>
        </div>
      </main>

      <Footer />
      <AudioPlayer />
    </div>
  );
}
