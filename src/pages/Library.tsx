import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Play,
  Clock,
  Heart,
  ListMusic,
  Users,
  Plus,
  Trash2,
  Globe,
  Lock,
  MoreHorizontal,
  UploadCloud,
  Search,
  Database,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Navbar } from '@/components/Navbar';
import { AudioPlayer } from '@/components/AudioPlayer';
import { AddToPlaylistDialog } from '@/components/AddToPlaylistDialog';
import { TrackCover } from '@/components/TrackCover';
import { useAuth } from '@/context/AuthContext';
import { usePlayer } from '@/context/PlayerContext';
import { usePlaylist } from '@/context/PlaylistContext';
import { useTracks } from '@/context/TrackContext';
import { getTrendingTracks, mockUsers, getUserById } from '@/data/mockData';
import { toast } from 'sonner';

const recentTracks = getTrendingTracks(10);
const likedTracks = getTrendingTracks(8).reverse();

export function Library() {
  const [searchParams] = useSearchParams();
  const { isAuthenticated, followingIds } = useAuth();
  const { playTrack, playQueue } = usePlayer();
  const {
    userPlaylists,
    createPlaylist,
    deletePlaylist,
    getTracksForPlaylist,
    openAddToPlaylistModal,
  } = usePlaylist();
  const { userTracks, deleteTrack } = useTracks();

  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'uploads');
  const [uploadSearch, setUploadSearch] = useState('');
  const [isCreatePlaylistOpen, setIsCreatePlaylistOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newIsPublic, setNewIsPublic] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredUserTracks = userTracks.filter(t =>
    t.title.toLowerCase().includes(uploadSearch.toLowerCase()) ||
    t.genre.toLowerCase().includes(uploadSearch.toLowerCase())
  );

  const following = mockUsers.filter(u => followingIds.includes(u.id));

  const handleCreatePlaylist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    setIsSubmitting(true);
    try {
      await createPlaylist(newTitle.trim(), newDescription.trim(), newIsPublic);
      setNewTitle('');
      setNewDescription('');
      setNewIsPublic(true);
      setIsCreatePlaylistOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePlayPlaylist = (e: React.MouseEvent, pl: typeof userPlaylists[0]) => {
    e.preventDefault();
    e.stopPropagation();
    const tracks = getTracksForPlaylist(pl);
    if (tracks.length > 0) {
      playQueue(tracks);
      toast.success(`Afspeellijst "${pl.title}" wordt afgespeeld`);
    } else {
      toast.info('Deze afspeellijst bevat nog geen nummers');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-24 px-4">
          <div className="max-w-md mx-auto text-center">
            <h1 className="text-2xl font-bold">Sign in to view your library</h1>
            <p className="text-muted-foreground mt-2">
              Your listening history, liked tracks, and playlists will appear here.
            </p>
            <Button asChild className="mt-4 rounded-full">
              <Link to="/login">Sign In</Link>
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <Navbar />
      <main className="pt-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Your Library</h1>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6 flex-wrap h-auto gap-1">
              <TabsTrigger value="uploads">
                <UploadCloud className="w-4 h-4 mr-2" />
                Uploads ({userTracks.length})
              </TabsTrigger>
              <TabsTrigger value="playlists">
                <ListMusic className="w-4 h-4 mr-2" />
                Playlists ({userPlaylists.length})
              </TabsTrigger>
              <TabsTrigger value="likes">
                <Heart className="w-4 h-4 mr-2" />
                Likes
              </TabsTrigger>
              <TabsTrigger value="history">
                <Clock className="w-4 h-4 mr-2" />
                History
              </TabsTrigger>
              <TabsTrigger value="following">
                <Users className="w-4 h-4 mr-2" />
                Following
              </TabsTrigger>
            </TabsList>

            <TabsContent value="uploads">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-semibold">Jouw Geüploade Nummers</h2>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-orange-500/10 text-orange-500 border border-orange-500/20">
                      <Database className="w-3 h-3" /> Firestore
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Muziekbestanden opgeslagen in jouw persoonlijke Firestore collectie ({userTracks.length})
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {userTracks.length > 0 && (
                    <div className="relative">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        type="text"
                        placeholder="Zoek in jouw uploads..."
                        value={uploadSearch}
                        onChange={(e) => setUploadSearch(e.target.value)}
                        className="pl-8 h-9 text-xs w-44 sm:w-56"
                      />
                    </div>
                  )}
                  <Button asChild className="rounded-full bg-orange-500 hover:bg-orange-600 text-white shadow-md">
                    <Link to="/upload">
                      <UploadCloud className="w-4 h-4 mr-2" />
                      Nummer uploaden
                    </Link>
                  </Button>
                </div>
              </div>

              {filteredUserTracks.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {filteredUserTracks.map((track) => (
                    <div
                      key={track.id}
                      className="bg-card border border-border/60 hover:border-orange-500/40 rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl flex flex-col justify-between group p-3.5"
                    >
                      <div>
                        <div className="relative aspect-square rounded-xl overflow-hidden mb-3 bg-muted">
                          <TrackCover
                            track={track}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            showBadge
                          />
                          <button
                            onClick={() => playTrack(track)}
                            className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            aria-label="Play track"
                          >
                            <div className="w-12 h-12 rounded-full bg-orange-500 text-white flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
                              <Play className="w-5 h-5 ml-0.5 fill-current" />
                            </div>
                          </button>
                          <span className="absolute bottom-2 right-2 px-1.5 py-0.5 text-[11px] font-mono bg-black/70 text-white rounded">
                            {track.durationFormatted}
                          </span>
                          <span className="absolute top-2 left-2 px-1.5 py-0.5 text-[10px] font-medium bg-orange-500/90 text-white rounded shadow-sm">
                            Firestore
                          </span>
                        </div>

                        <Link to={`/track/${track.id}`} className="block">
                          <h3 className="font-semibold text-base truncate hover:text-orange-500 transition-colors">
                            {track.title}
                          </h3>
                        </Link>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {track.genre} • {track.playsCount || 0} plays
                        </p>
                      </div>

                      <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/40 text-xs">
                        <span className="text-[11px] text-muted-foreground truncate max-w-[120px]">
                          {new Date(track.createdAt).toLocaleDateString()}
                        </span>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs px-2 text-muted-foreground hover:text-foreground"
                            onClick={() => openAddToPlaylistModal(track)}
                          >
                            <ListMusic className="w-3.5 h-3.5 mr-1" />
                            Lijst
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-red-500"
                            onClick={() => {
                              if (confirm(`Weet je zeker dat je "${track.title}" wilt verwijderen uit Firestore?`)) {
                                deleteTrack(track.id);
                              }
                            }}
                            title="Verwijderen uit Firestore"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : userTracks.length > 0 ? (
                <div className="text-center py-12 bg-card/30 rounded-2xl border border-dashed border-border p-6 max-w-md mx-auto">
                  <p className="text-sm text-muted-foreground">Geen nummers gevonden voor "{uploadSearch}"</p>
                  <Button variant="link" size="sm" onClick={() => setUploadSearch('')} className="mt-2 text-orange-500">
                    Zoekopdracht wissen
                  </Button>
                </div>
              ) : (
                <div className="text-center py-16 bg-card/40 rounded-2xl border border-dashed border-border p-8 max-w-lg mx-auto">
                  <div className="w-14 h-14 mx-auto rounded-2xl bg-orange-500/10 flex items-center justify-center mb-4">
                    <UploadCloud className="w-7 h-7 text-orange-500" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Nog geen nummers in jouw bibliotheek</h3>
                  <p className="text-sm text-muted-foreground mb-6">
                    Upload jouw eigen muziek of kies een van onze demotracks. Alles wat je uploadt wordt direct veilig opgeslagen in jouw Firestore database!
                  </p>
                  <Button asChild className="rounded-full bg-orange-500 hover:bg-orange-600 text-white">
                    <Link to="/upload">
                      <UploadCloud className="w-4 h-4 mr-2" />
                      Eerste nummer uploaden
                    </Link>
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="history">
              <h2 className="text-xl font-semibold mb-4">Recently Played</h2>
              {recentTracks.length > 0 ? (
                <div className="space-y-2">
                  {recentTracks.map((track, index) => {
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
                            {artist?.displayName}
                          </Link>
                        </div>
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
                  <p className="text-muted-foreground">No listening history yet</p>
                  <Button asChild className="mt-4 rounded-full">
                    <Link to="/discover">Discover Music</Link>
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="likes">
              <h2 className="text-xl font-semibold mb-4">Liked Tracks</h2>
              {likedTracks.length > 0 ? (
                <div className="space-y-2">
                  {likedTracks.map((track, index) => {
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
                            {artist?.displayName}
                          </Link>
                        </div>
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
                  <p className="text-muted-foreground">No liked tracks yet</p>
                  <Button asChild className="mt-4 rounded-full">
                    <Link to="/discover">Discover Music</Link>
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="playlists">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold">Jouw Afspeellijsten</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Beheer jouw muziekcollecties en afspeellijsten
                  </p>
                </div>

                <Dialog open={isCreatePlaylistOpen} onOpenChange={setIsCreatePlaylistOpen}>
                  <DialogTrigger asChild>
                    <Button className="rounded-full bg-orange-500 hover:bg-orange-600 text-white">
                      <Plus className="w-4 h-4 mr-2" />
                      Nieuwe afspeellijst
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md bg-card border-border">
                    <DialogHeader>
                      <DialogTitle>Nieuwe afspeellijst maken</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleCreatePlaylist} className="space-y-4 mt-2">
                      <div>
                        <Label htmlFor="playlist-title">Titel *</Label>
                        <Input
                          id="playlist-title"
                          placeholder="Bijv. Workout Energy of Relaxing Jazz"
                          value={newTitle}
                          onChange={(e) => setNewTitle(e.target.value)}
                          required
                          maxLength={100}
                        />
                      </div>
                      <div>
                        <Label htmlFor="playlist-description">Beschrijving</Label>
                        <Textarea
                          id="playlist-description"
                          placeholder="Waar gaat deze lijst over?..."
                          value={newDescription}
                          onChange={(e) => setNewDescription(e.target.value)}
                          maxLength={500}
                        />
                      </div>
                      <div className="flex items-center justify-between py-2 border-y border-border/50">
                        <div>
                          <Label htmlFor="playlist-public" className="cursor-pointer">Openbaar</Label>
                          <p className="text-xs text-muted-foreground">Zichtbaar voor andere luisteraars</p>
                        </div>
                        <Switch
                          id="playlist-public"
                          checked={newIsPublic}
                          onCheckedChange={setNewIsPublic}
                        />
                      </div>
                      <div className="flex justify-end gap-2 pt-2">
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => setIsCreatePlaylistOpen(false)}
                        >
                          Annuleren
                        </Button>
                        <Button
                          type="submit"
                          disabled={!newTitle.trim() || isSubmitting}
                          className="rounded-full bg-orange-500 hover:bg-orange-600 text-white"
                        >
                          Aanmaken
                        </Button>
                      </div>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>

              {userPlaylists.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
                  {userPlaylists.map((playlist) => (
                    <div
                      key={playlist.id}
                      className="group relative bg-card border border-border/60 hover:border-orange-500/40 rounded-2xl p-3.5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl flex flex-col justify-between"
                    >
                      <div>
                        <div className="relative aspect-square rounded-xl overflow-hidden mb-3 bg-muted">
                          <TrackCover
                            playlist={playlist}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            showBadge
                          />
                          <button
                            onClick={(e) => handlePlayPlaylist(e, playlist)}
                            className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            aria-label="Play playlist"
                          >
                            <div className="w-12 h-12 rounded-full bg-orange-500 text-white flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
                              <Play className="w-5 h-5 ml-0.5 fill-current" />
                            </div>
                          </button>
                        </div>

                        <Link to={`/playlist/${playlist.id}`} className="block">
                          <div className="flex items-center gap-1.5">
                            <h3 className="font-semibold text-base truncate hover:text-orange-500 transition-colors">
                              {playlist.title}
                            </h3>
                            {playlist.type === 'album' && (
                              <span className="text-[10px] uppercase font-bold text-orange-400 bg-orange-500/10 px-1.5 py-0.5 rounded shrink-0">
                                Album
                              </span>
                            )}
                          </div>
                        </Link>

                        {playlist.description && (
                          <p className="text-xs text-muted-foreground line-clamp-1 mt-1">
                            {playlist.description}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-border/40 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          {playlist.isPublic ? <Globe className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                          {playlist.tracksCount || 0} nummers
                        </span>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link to={`/playlist/${playlist.id}`}>Bekijken</Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-red-500 focus:text-red-500"
                              onClick={() => {
                                if (confirm(`Weet je zeker dat je "${playlist.title}" wilt verwijderen?`)) {
                                  deletePlaylist(playlist.id);
                                }
                              }}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Verwijderen
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 bg-card/40 rounded-2xl border border-dashed border-border p-8 max-w-lg mx-auto">
                  <ListMusic className="w-12 h-12 mx-auto text-orange-500/50 mb-3" />
                  <h3 className="text-lg font-semibold mb-2">Nog geen afspeellijsten</h3>
                  <p className="text-sm text-muted-foreground mb-6">
                    Maak jouw eerste afspeellijst aan en verzamel jouw favoriete tracks op één plek.
                  </p>
                  <Button
                    onClick={() => setIsCreatePlaylistOpen(true)}
                    className="rounded-full bg-orange-500 hover:bg-orange-600 text-white"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Afspeellijst aanmaken
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="following">
              <h2 className="text-xl font-semibold mb-4">Artists You Follow</h2>
              {following.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6">
                  {following.map((followedUser) => (
                    <Link key={followedUser.id} to={`/user/${followedUser.id}`} className="text-center group">
                      <Avatar className="w-24 h-24 mx-auto mb-3 ring-4 ring-transparent group-hover:ring-orange-500/30 transition-all">
                        <AvatarImage src={followedUser.avatarUrl} alt={followedUser.displayName} />
                        <AvatarFallback>{followedUser.displayName[0]}</AvatarFallback>
                      </Avatar>
                      <h3 className="font-medium group-hover:text-orange-500 transition-colors">
                        {followedUser.displayName}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {followedUser.followersCount.toLocaleString()} followers
                      </p>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-card rounded-xl border border-dashed border-border p-8">
                  <p className="text-muted-foreground mb-4">You are not following any artists yet.</p>
                  <Button asChild className="rounded-full bg-orange-500 hover:bg-orange-600">
                    <Link to="/">Discover Artists on Home</Link>
                  </Button>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <AddToPlaylistDialog />
      <AudioPlayer />
    </div>
  );
}
