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
  Headphones,
  UserPlus,
  UserCheck,
  Share2,
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
import { ShareTrackModal } from '@/components/ShareTrackModal';
import { usePlayer } from '@/context/PlayerContext';
import { useAuth } from '@/context/AuthContext';
import { useTracks } from '@/context/TrackContext';
import { mockUsers, mockPlaylists, getUserById } from '@/data/mockData';
import type { Track } from '@/types';
import {
  loadRecentSearchesWithFirestore,
  addRecentSearch,
  removeRecentSearch,
  clearRecentSearches,
} from '@/lib/searchHistory';
import { toast } from 'sonner';

const genres = ['All', 'Electronic', 'Hip Hop', 'Rock', 'Pop', 'Jazz', 'Classical', 'Ambient'];
const popularTags = [
  'Zheavenzy',
  'Jamal Drenthe',
  'Askylon',
  'Rowu',
  'Youandi',
  'Raka VW',
  'H.E.G.',
  'Andreea Comandaru',
  'Trap',
  'Hip Hop',
  'R&B',
  'New Wave',
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
  const { user, followUser, unfollowUser, isFollowing: checkIsFollowing, isAuthenticated } = useAuth();
  const { tracks: allTracks } = useTracks();

  const [searchQuery, setSearchQuery] = useState(query);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState('tracks');
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [sortBy, setSortBy] = useState('relevance');
  const [showFilters, setShowFilters] = useState(false);
  const [shareTrack, setShareTrack] = useState<Track | null>(null);

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
          u.username.toLowerCase().includes(query.toLowerCase()) ||
          (u.bio && u.bio.toLowerCase().includes(query.toLowerCase())) ||
          (u.genre && u.genre.toLowerCase().includes(query.toLowerCase())) ||
          (u.labelName && u.labelName.toLowerCase().includes(query.toLowerCase()))
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
              <SearchIcon className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-[#86868b]" />
              <Input
                type="search"
                placeholder="Zoek artiesten, nummers, albums en genres..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-14 pr-12 h-14 text-base bg-[#161617] border-white/[0.08] focus-visible:ring-[#fa233b] rounded-full text-white placeholder:text-[#86868b] shadow-2xl"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="absolute right-5 top-1/2 -translate-y-1/2 p-1.5 hover:bg-white/[0.08] rounded-full transition-colors"
                  title="Wissen"
                >
                  <X className="w-4 h-4 text-[#86868b]" />
                </button>
              )}
            </form>

            {/* Quick Recent Chips beneath the search bar */}
            {recentSearches.length > 0 && query && (
              <div className="flex items-center gap-2 mt-4 flex-wrap text-xs">
                <span className="text-[#86868b] flex items-center gap-1 font-semibold uppercase tracking-wider text-[11px]">
                  <Clock className="w-3 h-3 text-[#fa233b]" /> Recent:
                </span>
                {recentSearches.slice(0, 5).map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => handleSelectRecent(item)}
                    className="px-3 py-1 rounded-full bg-[#161617] hover:bg-white/[0.08] hover:text-white border border-white/[0.08] text-[#86868b] transition-colors"
                  >
                    {item}
                  </button>
                ))}
              </div>
            )}
          </div>

          {!query ? (
            // Empty state: Show Recent Searches & Discovery
            <div className="max-w-4xl space-y-10 py-2">
              {/* Recent Searches List */}
              {recentSearches.length > 0 ? (
                <div className="bg-[#161617]/90 border border-white/[0.08] rounded-3xl p-6 shadow-xl">
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-[#fa233b]/10 flex items-center justify-center text-[#fa233b]">
                        <Clock className="w-4 h-4" />
                      </div>
                      <div>
                        <h2 className="font-bold text-white text-base tracking-tight">Recente zoekopdrachten</h2>
                        <p className="text-xs text-[#86868b]">
                          Opgeslagen in jouw persoonlijke profiel ({recentSearches.length})
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs text-[#86868b] hover:text-red-400 hover:bg-white/[0.04] h-8 rounded-full"
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
                        className="group flex items-center gap-2 pl-4 pr-2.5 py-2 rounded-full bg-[#1c1c1e] hover:bg-[#242426] border border-white/[0.08] hover:border-white/[0.2] text-xs font-semibold text-[#f5f5f7] transition-all cursor-pointer"
                      >
                        <SearchIcon className="w-3 h-3 text-[#86868b] group-hover:text-[#fa233b] transition-colors" />
                        <span>{item}</span>
                        <button
                          type="button"
                          onClick={(e) => handleRemoveRecent(e, item)}
                          className="p-1 rounded-full hover:bg-white/[0.1] text-[#86868b] hover:text-red-400 transition-colors ml-1"
                          title={`Verwijder "${item}"`}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 bg-[#161617]/50 rounded-3xl border border-white/[0.08] p-6">
                  <div className="w-12 h-12 rounded-full bg-[#fa233b]/10 flex items-center justify-center mx-auto mb-3 text-[#fa233b]">
                    <Clock className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-white text-base tracking-tight">Nog geen recente zoekopdrachten</h3>
                  <p className="text-xs text-[#86868b] mt-1">
                    Zoek naar artiesten, nummers of afspeellijsten om jouw zoekgeschiedenis op te bouwen.
                  </p>
                </div>
              )}

              {/* Popular Tags */}
              <div className="bg-[#161617]/70 border border-white/[0.08] rounded-3xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="w-4 h-4 text-[#fa233b]" />
                  <h3 className="font-bold text-white text-sm tracking-tight">Populaire zoektermen</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {popularTags.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => handleSelectRecent(tag)}
                      className="px-4 py-2 rounded-full text-xs font-semibold bg-[#1c1c1e] hover:bg-white hover:text-black border border-white/[0.08] text-[#86868b] transition-all"
                    >
                      #{tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Browse by Genre */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Compass className="w-4 h-4 text-[#fa233b]" />
                  <h3 className="font-bold text-white text-base tracking-tight">Ontdek per genre</h3>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {genres.filter((g) => g !== 'All').map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => handleSelectRecent(g)}
                      className="p-5 rounded-3xl border border-white/[0.08] bg-[#161617]/90 hover:bg-[#1c1c1e]/90 hover:border-white/[0.2] transition-all text-left group shadow-lg"
                    >
                      <p className="font-bold text-base text-white group-hover:text-[#fa233b] transition-colors tracking-tight">
                        {g}
                      </p>
                      <p className="text-xs text-[#86868b] mt-1">
                        Nummers & artiesten
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
              <div className="flex flex-wrap items-center gap-3 mb-6">
                <Button
                  variant="secondary"
                  size="sm"
                  className={`rounded-full h-9 px-4 text-xs font-semibold border-white/[0.08] ${showFilters ? 'bg-white text-black' : ''}`}
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <Filter className="w-3.5 h-3.5 mr-2" />
                  Filters
                </Button>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-[160px] h-9 bg-[#161617] border-white/[0.08] rounded-full text-xs font-semibold text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1c1c1e] border-white/[0.08] text-white">
                    {sortOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {showFilters && (
                <div className="flex flex-wrap gap-2 mb-6 p-4 bg-[#161617]/90 border border-white/[0.08] rounded-3xl">
                  {genres.map((genre) => (
                    <button
                      key={genre}
                      onClick={() => setSelectedGenre(genre)}
                      className={`px-4 py-1.5 text-xs font-semibold rounded-full transition-all ${
                        selectedGenre === genre
                          ? 'bg-white text-black shadow-sm'
                          : 'bg-[#1c1c1e] text-[#86868b] hover:text-white hover:bg-[#242426] border border-white/[0.06]'
                      }`}
                    >
                      {genre}
                    </button>
                  ))}
                </div>
              )}

              {/* Tabs */}
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="mb-8 bg-[#161617] border border-white/[0.08] p-1.5 rounded-full inline-flex gap-1 h-auto">
                  <TabsTrigger value="tracks" className="rounded-full px-5 py-2 text-xs font-semibold data-[state=active]:bg-white data-[state=active]:text-black text-[#86868b]">
                    Nummers ({sortedTracks.length})
                  </TabsTrigger>
                  <TabsTrigger value="artists" className="rounded-full px-5 py-2 text-xs font-semibold data-[state=active]:bg-white data-[state=active]:text-black text-[#86868b]">
                    Artiesten ({users.length})
                  </TabsTrigger>
                  <TabsTrigger value="playlists" className="rounded-full px-5 py-2 text-xs font-semibold data-[state=active]:bg-white data-[state=active]:text-black text-[#86868b]">
                    Playlists ({playlists.length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="tracks">
                  {sortedTracks.length > 0 ? (
                    <div className="space-y-1.5 bg-[#161617]/70 border border-white/[0.08] rounded-3xl p-3 sm:p-4">
                      {sortedTracks.map((track, index) => {
                        const artist = getUserById(track.userId);
                        return (
                          <div
                            key={track.id}
                            className="flex items-center gap-3 sm:gap-4 p-3 rounded-2xl hover:bg-white/[0.04] transition-colors group"
                          >
                            <span className="w-6 text-center text-xs font-semibold text-[#86868b] shrink-0">
                              {index + 1}
                            </span>
                            <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 bg-[#1c1c1e] ring-1 ring-white/[0.08]">
                              <TrackCover track={track} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <Link
                                to={`/track/${track.id}`}
                                className="font-semibold text-sm text-[#f5f5f7] truncate block hover:text-[#fa233b] transition-colors"
                              >
                                {track.title}
                              </Link>
                              <div className="flex items-center gap-2 text-xs text-[#86868b] truncate">
                                <Link
                                  to={`/user/${track.userId}`}
                                  className="hover:text-[#fa233b] transition-colors truncate"
                                >
                                  {artist?.displayName || track.userName || 'Artist'}
                                </Link>
                                <span>•</span>
                                <span>{track.genre}</span>
                              </div>
                            </div>

                            {/* Plays Count Badge */}
                            <div className="hidden sm:flex items-center gap-1.5 text-xs text-[#86868b] shrink-0">
                              <Headphones className="w-3.5 h-3.5 text-[#fa233b]" />
                              <span className="font-medium text-[#f5f5f7]">
                                {(track.playsCount || 0).toLocaleString()}
                              </span>
                              <span>plays</span>
                            </div>

                            <button
                              onClick={() => playTrack(track)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                            >
                              <div className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center shadow-md">
                                <Play className="w-3.5 h-3.5 ml-0.5 fill-current" />
                              </div>
                            </button>

                            <button
                              onClick={() => setShareTrack(track)}
                              className="p-2 rounded-full text-[#86868b] hover:text-white hover:bg-white/[0.06] transition-colors shrink-0"
                              title="Deel naar socials"
                            >
                              <Share2 className="w-4 h-4" />
                            </button>

                            <span className="text-xs text-[#86868b] w-12 text-right hidden sm:inline shrink-0 font-mono">
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
                      {users.map((artistUser) => {
                        const isFollowed = checkIsFollowing(artistUser.id);
                        return (
                          <div
                            key={artistUser.id}
                            className="bg-[#161617]/90 border border-white/[0.08] hover:border-white/[0.2] rounded-3xl p-5 text-center group flex flex-col justify-between transition-all hover:-translate-y-1 shadow-lg"
                          >
                            <Link to={`/user/${artistUser.id}`} className="block">
                              <Avatar className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-3 ring-4 ring-white/[0.08] group-hover:ring-[#fa233b]/40 transition-all shadow-xl">
                                <AvatarImage src={artistUser.avatarUrl} alt={artistUser.displayName} />
                                <AvatarFallback className="bg-[#242426] text-white font-bold">{artistUser.displayName[0]}</AvatarFallback>
                              </Avatar>
                              <h3 className="font-semibold text-sm text-[#f5f5f7] group-hover:text-[#fa233b] transition-colors truncate">
                                {artistUser.displayName}
                              </h3>
                              <p className="text-xs text-[#86868b] mt-0.5">
                                {(artistUser.followersCount || 0).toLocaleString()} volgers
                              </p>
                            </Link>

                            <div className="mt-4">
                              <Button
                                size="sm"
                                variant={isFollowed ? "secondary" : "apple"}
                                className={`w-full h-8 rounded-full text-xs font-semibold ${
                                  isFollowed
                                    ? "bg-white/[0.1] text-white border-white/[0.15]"
                                    : "shadow-sm"
                                }`}
                                onClick={() => {
                                  if (!isAuthenticated) {
                                    toast.error('Log eerst in om te volgen.');
                                    return;
                                  }
                                  if (isFollowed) {
                                    unfollowUser(artistUser.id);
                                    toast.success(`${artistUser.displayName} ontvolgd`);
                                  } else {
                                    followUser(artistUser.id);
                                    toast.success(`${artistUser.displayName} gevolgd!`);
                                  }
                                }}
                              >
                                {isFollowed ? (
                                  <>
                                    <UserCheck className="w-3.5 h-3.5 mr-1 text-[#fa233b]" />
                                    Volgend
                                  </>
                                ) : (
                                  <>
                                    <UserPlus className="w-3.5 h-3.5 mr-1" />
                                    Volgen
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-16 bg-[#161617]/50 rounded-3xl border border-white/[0.08]">
                      <p className="text-sm text-[#86868b]">Geen artiesten gevonden</p>
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
                          className="group bg-[#161617]/90 border border-white/[0.08] hover:border-white/[0.2] rounded-3xl p-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl block"
                        >
                          <div className="aspect-square rounded-2xl overflow-hidden mb-3.5 bg-[#1c1c1e]">
                            <TrackCover
                              playlist={playlist}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              showBadge
                            />
                          </div>
                          <h3 className="font-semibold text-base text-white group-hover:text-[#fa233b] transition-colors truncate">
                            {playlist.title}
                          </h3>
                          <p className="text-xs text-[#86868b] mt-0.5">
                            {playlist.tracksCount} tracks
                          </p>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-16 bg-[#161617]/50 rounded-3xl border border-white/[0.08]">
                      <p className="text-sm text-[#86868b]">Geen afspeellijsten gevonden</p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </>
          )}
        </div>
      </main>
      <ShareTrackModal
        isOpen={!!shareTrack}
        onClose={() => setShareTrack(null)}
        track={shareTrack}
      />
      <AudioPlayer />
    </div>
  );
}
