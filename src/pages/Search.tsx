import { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Search as SearchIcon, Filter, X, Play } from 'lucide-react';
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
import { usePlayer } from '@/context/PlayerContext';
import { searchTracks, mockUsers, mockPlaylists, getUserById } from '@/data/mockData';

const genres = ['All', 'Electronic', 'Hip Hop', 'Rock', 'Pop', 'Jazz', 'Classical', 'Ambient'];
const sortOptions = [
  { value: 'relevance', label: 'Relevance' },
  { value: 'newest', label: 'Newest' },
  { value: 'popular', label: 'Most Popular' },
];

export function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const { playTrack } = usePlayer();
  const [searchQuery, setSearchQuery] = useState(query);
  const [activeTab, setActiveTab] = useState('tracks');
  const [selectedGenre, setSelectedGenre] = useState('All');
  const [sortBy, setSortBy] = useState('relevance');
  const [showFilters, setShowFilters] = useState(false);

  const tracks = query ? searchTracks(query) : [];
  const filteredTracks = selectedGenre === 'All'
    ? tracks
    : tracks.filter(t => t.genre.toLowerCase() === selectedGenre.toLowerCase());

  const users = query
    ? mockUsers.filter(
        u =>
          u.displayName.toLowerCase().includes(query.toLowerCase()) ||
          u.username.toLowerCase().includes(query.toLowerCase())
      )
    : [];

  const playlists = query
    ? mockPlaylists.filter(
        p =>
          p.title.toLowerCase().includes(query.toLowerCase()) ||
          p.description.toLowerCase().includes(query.toLowerCase())
      )
    : [];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setSearchParams({ q: searchQuery.trim() });
    }
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
          <div className="mb-8">
            <form onSubmit={handleSearch} className="relative max-w-2xl">
              <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search for tracks, artists, playlists..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 pr-12 py-6 text-lg bg-card border-0"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="absolute right-4 top-1/2 -translate-y-1/2"
                >
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              )}
            </form>
          </div>

          {!query ? (
            // Empty state
            <div className="text-center py-20">
              <SearchIcon className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold">Search for music</h2>
              <p className="text-muted-foreground mt-2">
                Find tracks, artists, and playlists
              </p>
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
                    Tracks ({filteredTracks.length})
                  </TabsTrigger>
                  <TabsTrigger value="artists">
                    Artists ({users.length})
                  </TabsTrigger>
                  <TabsTrigger value="playlists">
                    Playlists ({playlists.length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="tracks">
                  {filteredTracks.length > 0 ? (
                    <div className="space-y-2">
                      {filteredTracks.map((track, index) => {
                        const artist = getUserById(track.userId);
                        return (
                          <div
                            key={track.id}
                            className="flex items-center gap-4 p-3 rounded-lg hover:bg-card transition-colors group"
                          >
                            <span className="w-6 text-center text-sm text-muted-foreground">
                              {index + 1}
                            </span>
                            <img
                              src={track.coverUrl}
                              alt={track.title}
                              className="w-12 h-12 rounded object-cover"
                            />
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
                                {artist?.displayName}
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
                          <div className="aspect-square rounded-xl overflow-hidden mb-3">
                            <img
                              src={playlist.coverUrl}
                              alt={playlist.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
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
