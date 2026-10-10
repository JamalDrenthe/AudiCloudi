import { useState, useMemo } from 'react';
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
  Share2,
  Headphones,
  Shuffle,
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
import { ShareTrackModal } from '@/components/ShareTrackModal';
import { useAuth } from '@/context/AuthContext';
import { usePlayer } from '@/context/PlayerContext';
import { usePlaylist } from '@/context/PlaylistContext';
import { useTracks } from '@/context/TrackContext';
import { getTrendingTracks, mockUsers, getUserById } from '@/data/mockData';
import { toast } from 'sonner';

const recentTracks = getTrendingTracks(10);

export function Library() {
  const [searchParams] = useSearchParams();
  const { isAuthenticated, followingIds, likedTrackIds } = useAuth();
  const { playTrack, playQueue, shufflePlayQueue } = usePlayer();
  const {
    userPlaylists,
    createPlaylist,
    deletePlaylist,
    getTracksForPlaylist,
    openAddToPlaylistModal,
  } = usePlaylist();
  const { tracks: allTracks, userTracks, deleteTrack } = useTracks();

  const [shareTrack, setShareTrack] = useState<any>(null);

  const userLikedTracks = useMemo(() => {
    return allTracks.filter((t) => likedTrackIds.includes(t.id));
  }, [allTracks, likedTrackIds]);

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
          <div className="mb-8">
            <p className="text-xs font-semibold uppercase tracking-widest text-[#fa233b] mb-1">Mijn Collectie</p>
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">Jouw Bibliotheek</h1>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-8 flex-wrap h-auto gap-1 bg-[#161617] border border-white/[0.08] p-1.5 rounded-full">
              <TabsTrigger value="uploads" className="rounded-full px-4 py-2 text-xs font-semibold data-[state=active]:bg-white data-[state=active]:text-black text-[#86868b] transition-all">
                <UploadCloud className="w-3.5 h-3.5 mr-2" />
                Uploads ({userTracks.length})
              </TabsTrigger>
              <TabsTrigger value="playlists" className="rounded-full px-4 py-2 text-xs font-semibold data-[state=active]:bg-white data-[state=active]:text-black text-[#86868b] transition-all">
                <ListMusic className="w-3.5 h-3.5 mr-2" />
                Playlists ({userPlaylists.length})
              </TabsTrigger>
              <TabsTrigger value="likes" className="rounded-full px-4 py-2 text-xs font-semibold data-[state=active]:bg-white data-[state=active]:text-black text-[#86868b] transition-all">
                <Heart className="w-3.5 h-3.5 mr-2" />
                Likes
              </TabsTrigger>
              <TabsTrigger value="history" className="rounded-full px-4 py-2 text-xs font-semibold data-[state=active]:bg-white data-[state=active]:text-black text-[#86868b] transition-all">
                <Clock className="w-3.5 h-3.5 mr-2" />
                Geschiedenis
              </TabsTrigger>
              <TabsTrigger value="following" className="rounded-full px-4 py-2 text-xs font-semibold data-[state=active]:bg-white data-[state=active]:text-black text-[#86868b] transition-all">
                <Users className="w-3.5 h-3.5 mr-2" />
                Volgend
              </TabsTrigger>
            </TabsList>

            <TabsContent value="uploads">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold tracking-tight text-white">Jouw Geüploade Nummers</h2>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#fa233b]/10 text-[#fa233b] border border-[#fa233b]/20">
                      <Database className="w-3 h-3" /> Cloud
                    </span>
                  </div>
                  <p className="text-xs text-[#86868b] mt-0.5">
                    Muziekbestanden opgeslagen in jouw persoonlijke CloudiAudi catalogus ({userTracks.length})
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {userTracks.length > 0 && (
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#86868b]" />
                      <Input
                        type="text"
                        placeholder="Zoek in jouw uploads..."
                        value={uploadSearch}
                        onChange={(e) => setUploadSearch(e.target.value)}
                        className="pl-8 h-9 text-xs w-44 sm:w-56 bg-[#161617] border-white/[0.08] rounded-full focus-visible:ring-[#fa233b] placeholder:text-[#86868b]"
                      />
                    </div>
                  )}
                  <Button asChild variant="apple" size="sm" className="h-9 px-4 text-xs font-semibold shadow-md">
                    <Link to="/upload">
                      <UploadCloud className="w-3.5 h-3.5 mr-1.5" />
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
                      className="bg-[#161617]/90 border border-white/[0.08] hover:border-white/[0.2] rounded-3xl overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl flex flex-col justify-between group p-4"
                    >
                      <div>
                        <div className="relative aspect-square rounded-2xl overflow-hidden mb-3.5 bg-[#1c1c1e]">
                          <TrackCover
                            track={track}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            showBadge
                          />
                          <button
                            onClick={() => playTrack(track)}
                            className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm"
                            aria-label="Play track"
                          >
                            <div className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-transform">
                              <Play className="w-5 h-5 ml-0.5 fill-current" />
                            </div>
                          </button>
                          <span className="absolute bottom-2 right-2 px-2 py-0.5 text-[10px] font-mono font-medium bg-black/70 text-white rounded-full backdrop-blur-md">
                            {track.durationFormatted}
                          </span>
                        </div>

                        <Link to={`/track/${track.id}`} className="block">
                          <h3 className="font-semibold text-base text-white truncate hover:text-[#fa233b] transition-colors">
                            {track.title}
                          </h3>
                        </Link>
                        <p className="text-xs text-[#86868b] mt-0.5">
                          {track.genre} • {track.playsCount || 0} plays
                        </p>
                      </div>

                      <div className="flex items-center justify-between mt-4 pt-3.5 border-t border-white/[0.06] text-xs">
                        <span className="text-[11px] text-[#86868b] truncate max-w-[120px]">
                          {new Date(track.createdAt).toLocaleDateString()}
                        </span>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="secondary"
                            size="sm"
                            className="h-7 text-xs px-2.5 rounded-full"
                            onClick={() => openAddToPlaylistModal(track)}
                          >
                            <ListMusic className="w-3 h-3 mr-1" />
                            Lijst
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-[#86868b] hover:text-red-400 rounded-full"
                            onClick={() => {
                              if (confirm(`Weet je zeker dat je "${track.title}" wilt verwijderen?`)) {
                                deleteTrack(track.id);
                              }
                            }}
                            title="Verwijderen"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : userTracks.length > 0 ? (
                <div className="text-center py-14 bg-[#161617]/50 rounded-3xl border border-white/[0.08] p-6 max-w-md mx-auto">
                  <p className="text-sm text-[#86868b]">Geen nummers gevonden voor "{uploadSearch}"</p>
                  <Button variant="link" size="sm" onClick={() => setUploadSearch('')} className="mt-2 text-[#fa233b]">
                    Zoekopdracht wissen
                  </Button>
                </div>
              ) : (
                <div className="text-center py-16 bg-[#161617]/60 rounded-3xl border border-white/[0.08] p-8 max-w-lg mx-auto">
                  <div className="w-14 h-14 mx-auto rounded-full bg-[#fa233b]/10 flex items-center justify-center mb-4">
                    <UploadCloud className="w-7 h-7 text-[#fa233b]" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2 tracking-tight">Nog geen nummers in jouw bibliotheek</h3>
                  <p className="text-sm text-[#86868b] mb-6 leading-relaxed">
                    Upload jouw eigen muziek of kies een van onze demotracks. Alles wat je uploadt wordt direct veilig opgeslagen in hoge kwaliteit!
                  </p>
                  <Button asChild variant="apple" className="h-10 px-6 font-semibold shadow-lg">
                    <Link to="/upload">
                      <UploadCloud className="w-4 h-4 mr-2" />
                      Eerste nummer uploaden
                    </Link>
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="history">
              <h2 className="text-xl font-bold tracking-tight text-white mb-5">Recent Afgespeeld</h2>
              {recentTracks.length > 0 ? (
                <div className="space-y-1.5 bg-[#161617]/70 border border-white/[0.08] rounded-3xl p-3 sm:p-4">
                  {recentTracks.map((track, index) => {
                    const artist = getUserById(track.userId);
                    return (
                      <div
                        key={track.id}
                        className="flex items-center gap-4 p-3 rounded-2xl hover:bg-white/[0.04] transition-colors group"
                      >
                        <span className="w-6 text-center text-xs font-semibold text-[#86868b]">
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
                          <Link
                            to={`/user/${track.userId}`}
                            className="text-xs text-[#86868b] hover:text-[#fa233b] transition-colors block truncate"
                          >
                            {artist?.displayName}
                          </Link>
                        </div>
                        <button
                          onClick={() => playTrack(track)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <div className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center shadow-md">
                            <Play className="w-3.5 h-3.5 ml-0.5 fill-current" />
                          </div>
                        </button>
                        <span className="text-xs text-[#86868b]">
                          {track.durationFormatted}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-16 bg-[#161617]/50 rounded-3xl border border-white/[0.08]">
                  <p className="text-sm text-[#86868b]">Nog geen luistergeschiedenis</p>
                  <Button asChild variant="apple" size="sm" className="mt-4 rounded-full">
                    <Link to="/charts">Ontdek Top 20</Link>
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="likes">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-white">Gelikete Nummers ({userLikedTracks.length})</h2>
                  <p className="text-xs text-[#86868b] mt-0.5">Jouw favoriete nummers op CloudiAudi</p>
                </div>
                {userLikedTracks.length > 0 && (
                  <Button
                    variant="secondary"
                    size="sm"
                    className="rounded-full text-xs font-semibold h-8"
                    onClick={() => {
                      shufflePlayQueue(userLikedTracks);
                      toast.success('Gelikete nummers geshuffeld!');
                    }}
                  >
                    <Shuffle className="w-3.5 h-3.5 mr-1.5 text-[#fa233b]" />
                    Shuffle Likes
                  </Button>
                )}
              </div>
              {userLikedTracks.length > 0 ? (
                <div className="space-y-1.5 bg-[#161617]/70 border border-white/[0.08] rounded-3xl p-3 sm:p-4">
                  {userLikedTracks.map((track, index) => {
                    const artist = getUserById(track.userId);
                    return (
                      <div
                        key={track.id}
                        className="flex items-center gap-4 p-3 rounded-2xl hover:bg-white/[0.04] transition-colors group"
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
                          <Link
                            to={`/user/${track.userId}`}
                            className="text-xs text-[#86868b] hover:text-[#fa233b] transition-colors block truncate"
                          >
                            {artist?.displayName || track.userName || 'Artist'}
                          </Link>
                        </div>

                        <span className="text-xs text-[#86868b] hidden sm:flex items-center gap-1 font-medium">
                          <Headphones className="w-3.5 h-3.5 text-[#fa233b]" />
                          {(track.playsCount || 0).toLocaleString()} plays
                        </span>

                        <button
                          onClick={() => playTrack(track)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <div className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center shadow-md">
                            <Play className="w-3.5 h-3.5 ml-0.5 fill-current" />
                          </div>
                        </button>

                        <button
                          onClick={() => setShareTrack(track)}
                          className="p-2 rounded-full text-[#86868b] hover:text-white hover:bg-white/[0.06] transition-colors"
                          title="Deel naar socials"
                        >
                          <Share2 className="w-4 h-4" />
                        </button>

                        <span className="text-xs text-[#86868b] w-12 text-right hidden sm:inline font-mono">
                          {track.durationFormatted}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-16 bg-[#161617]/50 rounded-3xl border border-white/[0.08]">
                  <p className="text-sm text-[#86868b]">Nog geen gelikete nummers</p>
                  <Button asChild variant="apple" size="sm" className="mt-4 rounded-full">
                    <Link to="/charts">Ontdek Top 20</Link>
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="playlists">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-bold tracking-tight text-white">Jouw Afspeellijsten</h2>
                  <p className="text-xs text-[#86868b] mt-0.5">
                    Beheer jouw muziekcollecties en afspeellijsten
                  </p>
                </div>

                <Dialog open={isCreatePlaylistOpen} onOpenChange={setIsCreatePlaylistOpen}>
                  <DialogTrigger asChild>
                    <Button variant="apple" size="sm" className="h-9 px-4 font-semibold text-xs shadow-md">
                      <Plus className="w-3.5 h-3.5 mr-1.5" />
                      Nieuwe afspeellijst
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md bg-[#161617] border-white/[0.08] text-white rounded-3xl p-6">
                    <DialogHeader>
                      <DialogTitle className="text-lg font-bold tracking-tight text-white">Nieuwe afspeellijst maken</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleCreatePlaylist} className="space-y-4 mt-3">
                      <div>
                        <Label htmlFor="playlist-title" className="text-xs text-[#86868b]">Titel *</Label>
                        <Input
                          id="playlist-title"
                          placeholder="Bijv. Workout Energy of Midnight Vibe"
                          value={newTitle}
                          onChange={(e) => setNewTitle(e.target.value)}
                          required
                          maxLength={100}
                          className="mt-1 bg-[#1c1c1e] border-white/[0.08] rounded-xl text-sm"
                        />
                      </div>
                      <div>
                        <Label htmlFor="playlist-description" className="text-xs text-[#86868b]">Beschrijving</Label>
                        <Textarea
                          id="playlist-description"
                          placeholder="Waar gaat deze lijst over?..."
                          value={newDescription}
                          onChange={(e) => setNewDescription(e.target.value)}
                          maxLength={500}
                          className="mt-1 bg-[#1c1c1e] border-white/[0.08] rounded-xl text-sm"
                        />
                      </div>
                      <div className="flex items-center justify-between py-2 border-y border-white/[0.06]">
                        <div>
                          <Label htmlFor="playlist-public" className="cursor-pointer text-xs font-semibold text-white">Openbaar</Label>
                          <p className="text-xs text-[#86868b]">Zichtbaar voor andere luisteraars</p>
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
                          className="rounded-full text-xs text-[#86868b]"
                          onClick={() => setIsCreatePlaylistOpen(false)}
                        >
                          Annuleren
                        </Button>
                        <Button
                          type="submit"
                          disabled={!newTitle.trim() || isSubmitting}
                          variant="apple"
                          className="text-xs font-semibold h-9 px-5"
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
                      className="group relative bg-[#161617]/90 border border-white/[0.08] hover:border-white/[0.2] rounded-3xl p-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl flex flex-col justify-between"
                    >
                      <div>
                        <div className="relative aspect-square rounded-2xl overflow-hidden mb-3.5 bg-[#1c1c1e]">
                          <TrackCover
                            playlist={playlist}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            showBadge
                          />
                          <button
                            onClick={(e) => handlePlayPlaylist(e, playlist)}
                            className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm"
                            aria-label="Play playlist"
                          >
                            <div className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-transform">
                              <Play className="w-5 h-5 ml-0.5 fill-current" />
                            </div>
                          </button>
                        </div>

                        <Link to={`/playlist/${playlist.id}`} className="block">
                          <div className="flex items-center gap-1.5">
                            <h3 className="font-semibold text-base text-white truncate hover:text-[#fa233b] transition-colors">
                              {playlist.title}
                            </h3>
                            {playlist.type === 'album' && (
                              <span className="text-[10px] uppercase font-bold text-[#fa233b] bg-[#fa233b]/10 border border-[#fa233b]/20 px-1.5 py-0.5 rounded-full shrink-0">
                                Album
                              </span>
                            )}
                          </div>
                        </Link>

                        {playlist.description && (
                          <p className="text-xs text-[#86868b] line-clamp-1 mt-1">
                            {playlist.description}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center justify-between mt-3.5 pt-3 border-t border-white/[0.06] text-xs text-[#86868b]">
                        <span className="flex items-center gap-1">
                          {playlist.isPublic ? <Globe className="w-3 h-3 text-[#86868b]" /> : <Lock className="w-3 h-3 text-[#86868b]" />}
                          {playlist.tracksCount || 0} nummers
                        </span>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-[#86868b] hover:text-white rounded-full">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-[#1c1c1e] border-white/[0.08] text-white">
                            <DropdownMenuItem asChild>
                              <Link to={`/playlist/${playlist.id}`}>Bekijken</Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-red-400 focus:text-red-400"
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
                <div className="text-center py-16 bg-[#161617]/60 rounded-3xl border border-white/[0.08] p-8 max-w-lg mx-auto">
                  <ListMusic className="w-12 h-12 mx-auto text-[#fa233b]/50 mb-3" />
                  <h3 className="text-lg font-bold text-white mb-2 tracking-tight">Nog geen afspeellijsten</h3>
                  <p className="text-sm text-[#86868b] mb-6 leading-relaxed">
                    Maak jouw eerste afspeellijst aan en verzamel jouw favoriete tracks op één plek.
                  </p>
                  <Button
                    onClick={() => setIsCreatePlaylistOpen(true)}
                    variant="apple"
                    className="h-10 px-6 font-semibold shadow-lg"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Afspeellijst aanmaken
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="following">
              <h2 className="text-xl font-bold tracking-tight text-white mb-6">Artiesten die je volgt</h2>
              {following.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6">
                  {following.map((followedUser) => (
                    <Link key={followedUser.id} to={`/user/${followedUser.id}`} className="text-center group bg-[#161617]/70 border border-white/[0.08] hover:border-white/[0.2] p-5 rounded-3xl transition-all duration-300">
                      <Avatar className="w-24 h-24 mx-auto mb-3 ring-4 ring-white/[0.08] group-hover:ring-[#fa233b]/40 transition-all shadow-xl">
                        <AvatarImage src={followedUser.avatarUrl} alt={followedUser.displayName} />
                        <AvatarFallback className="bg-[#242426] text-white font-bold">{followedUser.displayName[0]}</AvatarFallback>
                      </Avatar>
                      <h3 className="font-semibold text-[#f5f5f7] group-hover:text-[#fa233b] transition-colors truncate">
                        {followedUser.displayName}
                      </h3>
                      <p className="text-xs text-[#86868b] mt-0.5">
                        {followedUser.followersCount.toLocaleString()} volgers
                      </p>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 bg-[#161617]/50 rounded-3xl border border-white/[0.08] p-8 max-w-md mx-auto">
                  <p className="text-sm text-[#86868b] mb-4">Je volgt nog geen artiesten.</p>
                  <Button asChild variant="apple" className="h-10 px-6 font-semibold shadow-md">
                    <Link to="/artists">Bekijk Artiesten Roster</Link>
                  </Button>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <AddToPlaylistDialog />
      <ShareTrackModal
        isOpen={!!shareTrack}
        onClose={() => setShareTrack(null)}
        track={shareTrack}
      />
      <AudioPlayer />
    </div>
  );
}
