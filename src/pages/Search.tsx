import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  Search as SearchIcon,
  Filter,
  X,
  Play,
  Clock,
  Trash2,
  Sparkles,
  Compass,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Navbar } from '@/components/Navbar';
import { AudioPlayer } from '@/components/AudioPlayer';
import { TrackCover } from '@/components/TrackCover';
import { usePlayer } from '@/context/PlayerContext';
import { useAuth } from '@/context/AuthContext';
import { useTracks } from '@/context/TrackContext';
import { mockUsers, mockPlaylists, getUserById } from '@/data/mockData';
import {
  loadRecentSearchesWithFirestore,
  addRecentSearch,
  removeRecentSearch,
  clearRecentSearches,
} from '@/lib/searchHistory';
import { toast } from 'sonner';

const genres = ['All', 'Electronic', 'Hip Hop', 'Rock', 'Pop', 'Jazz', 'Classical', 'Ambient'];
const popularTags = [
  'Electronic',
  'Synthwave',
  'Lo-Fi Chill',
  'Jamal Drenthe',
  'Ambient',
  'Hip Hop',
  'Summer House',
  'Cyberpunk',
];
const sortOptions = [
  { value: 'relevance', label: 'Relevance' },
  { value: 'newest', label: 'Newest' },
  { value: 'popular', label: 'Most Popular' },
];

export function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const { playTrack } = usePlayer();
  const { user } = useAuth();
  const { tracks: allTracks } = useTracks();

  const [searchQuery, setSearchQuery] = useState(query);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState('tracks');
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [sortBy, setSortBy] = useState('relevance');
  const [showFilters, setShowFilters] = useState(false);

  // Load recent searches from localStorage / Firestore
  useEffect(() => {
    loadRecentSearchesWithFirestore(user?.id).then(setRecentSearches);
  }, [user?.id]);

  // Sync searchQuery with query param and record to history
  useEffect(() => {
    if (query) {
      setSearchQuery(query);
      addRecentSearch(query, user?.id).then(setRecentSearches);
    }
  }, [query, user?.id]);

  // Search through all tracks (Firestore + mock)
  const tracks = query
    ? allTracks.filter((t) => {
        const q = query.toLowerCase();
        return (
          t.title.toLowerCase().includes(q) ||
          t.genre.toLowerCase().includes(q) ||
          (t.tags && t.tags.some((tag) => tag.toLowerCase().includes(q))) ||
          (t.description && t.description.toLowerCase().includes(q))
        );
      })
    : [];

  const filteredTracks =
    selectedGenre === 'All'
      ? tracks
      : tracks.filter((t) => t.genre.toLowerCase() === selectedGenre.toLowerCase());

  // Sort tracks
  const sortedTracks = [...filteredTracks].sort((a, b) => {
    if (sortBy === 'newest') {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    if (sortBy === 'popular') {
      return (b.playsCount || 0) - (a.playsCount || 0);
    }
    return 0;
  });

  const users = query
    ? mockUsers.filter(
        (u) =>
          u.displayName.toLowerCase().includes(query.toLowerCase()) ||
          u.username.toLowerCase().includes(query.toLowerCase())
      )
    : [];

  const playlists = query
    ? mockPlaylists.filter(
        (p) =>
          p.title.toLowerCase().includes(query.toLowerCase()) ||
          p.description.toLowerCase().includes(query.toLowerCase())
      )
    : [];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = searchQuery.trim();
    if (trimmed) {
      addRecentSearch(trimmed, user?.id).then(setRecentSearches);
      setSearchParams({ q: trimmed });
    }
  };

  const handleSelectRecent = (q: string) => {
    setSearchQuery(q);
    addRecentSearch(q, user?.id).then(setRecentSearches);
    setSearchParams({ q });
  };

  const handleRemoveRecent = (e: React.MouseEvent, q: string) => {
    e.stopPropagation();
    removeRecentSearch(q, user?.id).then(setRecentSearches);
    toast.success(`Zoekopdracht "${q}" verwijderd`);
  };

  const handleClearAllRecent = () => {
    clearRecentSearches(user?.id);
    setRecentSearches([]);
    toast.success('Zoekgeschiedenis gewist');
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchParams({});
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <Navbar />
      <main className="pt-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Search Header */}
          <div className="mb-6">
            <form onSubmit={handleSearch} className="relative max-w-2xl">
              <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search for tracks, artists, playlists..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 pr-12 py-6 text-lg bg-card border border-border/80 focus-visible:border-orange-500 shadow-sm"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-secondary rounded-full"
                  title="Wissen"
                >
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              )}
            </form>

            {/* Quick Recent Chips beneath the search bar */}
            {recentSearches.length > 0 && query && (
              <div className="flex items-center gap-2 mt-3 flex-wrap text-xs">
                <span className="text-muted-foreground flex items-center gap-1 font-medium">
                  <Clock className="w-3.5 h-3.5 text-orange-500" /> Recent:
                </span>
                {recentSearches.slice(0, 5).map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => handleSelectRecent(item)}
                    className="px-2.5 py-1 rounded-full bg-card hover:bg-orange-500/15 hover:text-orange-400 border border-border/80 transition-colors"
                  >
                    {item}
                  </button>
                ))}
              </div>
            )}
          </div>

          {!query ? (
            // Empty state: Show Recent Searches & Discovery
            <div className="max-w-4xl space-y-8 py-2">
              {/* Recent Searches List */}
              {recentSearches.length > 0 ? (
                <div className="bg-card border border-border/80 rounded-2xl p-5 sm:p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-orange-500/15 flex items-center justify-center text-orange-500">
                        <Clock className="w-4 h-4" />
                      </div>
                      <div>
                        <h2 className="font-semibold text-base">Recente zoekopdrachten</h2>
                        <p className="text-xs text-muted-foreground">
                          Opgeslagen in jouw profiel en browser ({recentSearches.length})
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs text-muted-foreground hover:text-red-500 hover:bg-red-500/10 h-8"
                      onClick={handleClearAllRecent}
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-1" />
                      Alles wissen
                    </Button>
                  </div>

                  <div className="flex flex-wrap gap-2.5">
                    {recentSearches.map((item) => (
                      <div
                        key={item}
                        onClick={() => handleSelectRecent(item)}
                        className="group flex items-center gap-2 pl-3.5 pr-2 py-2 rounded-xl bg-secondary/60 hover:bg-orange-500/15 hover:border-orange-500/40 border border-border/60 text-sm font-medium transition-all cursor-pointer shadow-2xs"
                      >
                        <SearchIcon className="w-3.5 h-3.5 text-muted-foreground group-hover:text-orange-500 transition-colors" />
                        <span className="group-hover:text-orange-400 transition-colors">{item}</span>
                        <button
                          type="button"
                          onClick={(e) => handleRemoveRecent(e, item)}
                          className="p-1 rounded-full hover:bg-secondary text-muted-foreground hover:text-red-400 transition-colors ml-1"
                          title={`Verwijder "${item}"`}
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-10 bg-card/40 rounded-2xl border border-dashed border-border p-6">
                  <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center mx-auto mb-3 text-orange-500">
                    <Clock className="w-6 h-6" />
                  </div>
                  <h3 className="font-semibold text-base">Nog geen recente zoekopdrachten</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Zoek naar artiesten, nummers of afspeellijsten om jouw zoekgeschiedenis op te bouwen.
                  </p>
                </div>
              )}

              {/* Popular Tags */}
              <div className="bg-card/50 border border-border/70 rounded-2xl p-5 sm:p-6">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-4 h-4 text-orange-500" />
                  <h3 className="font-semibold text-sm">Populaire zoektermen</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {popularTags.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => handleSelectRecent(tag)}
                      className="px-3.5 py-1.5 rounded-full text-xs font-medium bg-secondary hover:bg-orange-500 hover:text-white transition-all shadow-xs"
                    >
                      #{tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Browse by Genre */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Compass className="w-4 h-4 text-orange-500" />
                  <h3 className="font-semibold text-base">Ontdek per genre</h3>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {genres.filter((g) => g !== 'All').map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => handleSelectRecent(g)}
                      className="p-4 rounded-xl border border-border/60 bg-card hover:border-orange-500/50 hover:bg-orange-500/5 transition-all text-left group"
                    >
                      <p className="font-semibold text-sm group-hover:text-orange-500 transition-colors">
                        {g}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Bekijk nummers & artiesten
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            // Results
            <>
              {/* Filters */}
              <div className="flex flex-wrap items-center gap-4 mb-6">
                <Button
                  variant="outline"
                  size="sm"
                  className={showFilters ? 'bg-orange-500/10 text-orange-500' : ''}
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Filters
                </Button>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[160px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {sortOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {showFilters && (
                <div className="flex flex-wrap gap-2 mb-6 p-4 bg-card rounded-lg">
                  {genres.map((genre) => (
                    <button
                      key={genre}
                      onClick={() => setSelectedGenre(genre)}
                      className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
                        selectedGenre === genre
                          ? 'bg-orange-500 text-white'
                          : 'bg-secondary hover:bg-secondary/80'
                      }`}
                    >
                      {genre}
                    </button>
                  ))}
                </div>
              )}

              {/* Tabs */}
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="mb-6">
                  <TabsTrigger value="tracks">
                    Tracks ({sortedTracks.length})
                  </TabsTrigger>
                  <TabsTrigger value="artists">
                    Artists ({users.length})
                  </TabsTrigger>
                  <TabsTrigger value="playlists">
                    Playlists ({playlists.length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="tracks">
                  {sortedTracks.length > 0 ? (
                    <div className="space-y-2">
                      {sortedTracks.map((track, index) => {
                        const artist = getUserById(track.userId);
                        return (
                          <div
                            key={track.id}
                            className="flex items-center gap-4 p-3 rounded-lg hover:bg-card transition-colors group"
                          >
                            <span className="w-6 text-center text-sm text-muted-foreground">
                              {index + 1}
                            </span>
                            <div className="w-12 h-12 rounded overflow-hidden shrink-0 bg-muted">
                              <TrackCover track={track} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <Link
                                to={`/track/${track.id}`}
                                className="font-medium truncate block hover:text-orange-500 transition-colors"
                              >
                                {track.title}
                              </Link>
                              <Link
                                to={`/user/${track.userId}`}
                                className="text-sm text-muted-foreground hover:text-orange-500 transition-colors"
                              >
                                {artist?.displayName || track.userName || 'Artist'}
                              </Link>
                            </div>
                            <span className="text-sm text-muted-foreground hidden sm:block">
                              {track.genre}
                            </span>
                            <button
                              onClick={() => playTrack(track)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center">
                                <Play className="w-4 h-4 text-white ml-0.5" />
                              </div>
                            </button>
                            <span className="text-sm text-muted-foreground">
                              {track.durationFormatted}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-muted-foreground">No tracks found</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="artists">
                  {users.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6">
                      {users.map((user) => (
                        <Link
                          key={user.id}
                          to={`/user/${user.id}`}
                          className="text-center group"
                        >
                          <Avatar className="w-24 h-24 mx-auto mb-3 ring-4 ring-transparent group-hover:ring-orange-500/30 transition-all">
                            <AvatarImage src={user.avatarUrl} alt={user.displayName} />
                            <AvatarFallback>{user.displayName[0]}</AvatarFallback>
                          </Avatar>
                          <h3 className="font-medium group-hover:text-orange-500 transition-colors">
                            {user.displayName}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {user.followersCount.toLocaleString()} followers
                          </p>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-muted-foreground">No artists found</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="playlists">
                  {playlists.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
                      {playlists.map((playlist) => (
                        <Link
                          key={playlist.id}
                          to={`/playlist/${playlist.id}`}
                          className="group"
                        >
                          <div className="aspect-square rounded-xl overflow-hidden mb-3 bg-muted">
                            <TrackCover
                              playlist={playlist}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                              showBadge
                            />
                          </div>
                          <h3 className="font-medium group-hover:text-orange-500 transition-colors">
                            {playlist.title}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {playlist.tracksCount} tracks
                          </p>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <p className="text-muted-foreground">No playlists found</p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </>
          )}
        </div>
      </main>
      <AudioPlayer />
    </div>
  );
}
