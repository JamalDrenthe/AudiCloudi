import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Play,
  Pause,
  Pencil,
  Trash2,
  Clock,
  Music,
  Share2,
  Lock,
  Globe,
  ArrowLeft,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Navbar } from '@/components/Navbar';
import { AudioPlayer } from '@/components/AudioPlayer';
import { AddToPlaylistDialog } from '@/components/AddToPlaylistDialog';
import { TrackCover } from '@/components/TrackCover';
import { usePlaylist } from '@/context/PlaylistContext';
import { usePlayer } from '@/context/PlayerContext';
import { useAuth } from '@/context/AuthContext';
import { getUserById } from '@/data/mockData';
import { toast } from 'sonner';

export function PlaylistDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { playTrack, playQueue, currentTrack, isPlaying } = usePlayer();
  const {
    getPlaylistById,
    getTracksForPlaylist,
    updatePlaylist,
    deletePlaylist,
    removeTrackFromPlaylist,
  } = usePlaylist();

  const playlist = id ? getPlaylistById(id) : undefined;
  const tracks = playlist ? getTracksForPlaylist(playlist) : [];
  const creator = playlist ? getUserById(playlist.userId) : undefined;

  const isOwner = Boolean(
    user && playlist && (user.id === playlist.userId || user.role === 'admin')
  );

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editTitle, setEditTitle] = useState(playlist?.title || '');
  const [editDescription, setEditDescription] = useState(playlist?.description || '');
  const [editIsPublic, setEditIsPublic] = useState(playlist?.isPublic ?? true);

  if (!playlist) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-24 px-4 text-center max-w-md mx-auto">
          <Music className="w-16 h-16 mx-auto text-muted-foreground mb-4 opacity-50" />
          <h1 className="text-2xl font-bold mb-2">Afspeellijst niet gevonden</h1>
          <p className="text-muted-foreground mb-6">
            Deze afspeellijst bestaat niet of is verwijderd.
          </p>
          <Button asChild className="rounded-full bg-orange-500 hover:bg-orange-600">
            <Link to="/library">Naar Bibliotheek</Link>
          </Button>
        </main>
      </div>
    );
  }

  const totalDurationSeconds = tracks.reduce((acc, t) => acc + (t.duration || 0), 0);
  const totalMinutes = Math.floor(totalDurationSeconds / 60);

  const handlePlayAll = () => {
    if (tracks.length > 0) {
      playQueue(tracks);
      toast.success(`Afspeellijst "${playlist.title}" wordt afgespeeld`);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTitle.trim()) return;

    await updatePlaylist(playlist.id, {
      title: editTitle.trim(),
      description: editDescription.trim(),
      isPublic: editIsPublic,
    });
    setIsEditDialogOpen(false);
  };

  const handleDelete = async () => {
    if (confirm(`Weet je zeker dat je "${playlist.title}" wilt verwijderen?`)) {
      await deletePlaylist(playlist.id);
      navigate('/library');
    }
  };

  return (
    <div className="min-h-screen bg-background pb-28">
      <Navbar />

      <main className="pt-16">
        {/* Header Hero */}
        <div className="bg-gradient-to-b from-orange-500/15 via-background/80 to-background border-b border-border/40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
            <Button
              variant="ghost"
              size="sm"
              className="mb-6 -ml-2 text-muted-foreground hover:text-foreground"
              onClick={() => navigate('/library')}
            >
              <ArrowLeft className="w-4 h-4 mr-1.5" />
              Terug naar Bibliotheek
            </Button>

            <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 sm:gap-8">
              {/* Cover Artwork */}
              <div className="w-48 h-48 sm:w-56 sm:h-56 rounded-2xl overflow-hidden shadow-2xl shrink-0 border border-border/50 bg-muted">
                <TrackCover
                  playlist={playlist}
                  className="w-full h-full object-cover"
                  showBadge
                />
              </div>

              {/* Details */}
              <div className="flex-1 text-center sm:text-left">
                <div className="flex items-center justify-center sm:justify-start gap-2 mb-2">
                  <span className="text-xs font-semibold tracking-wider uppercase text-orange-500 bg-orange-500/10 px-2 py-0.5 rounded-md">
                    {playlist.type === 'album' ? 'Album' : 'Afspeellijst'}
                  </span>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    {playlist.isPublic ? <Globe className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                    {playlist.isPublic ? 'Openbaar' : 'Privé'}
                  </span>
                </div>

                <h1 className="text-2xl sm:text-4xl font-bold tracking-tight mb-2">
                  {playlist.title}
                </h1>

                {playlist.description && (
                  <p className="text-sm text-muted-foreground max-w-xl mb-4 line-clamp-2">
                    {playlist.description}
                  </p>
                )}

                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 text-xs text-muted-foreground mb-6">
                  <span className="font-medium text-foreground">
                    {creator?.displayName || user?.displayName || 'Gebruiker'}
                  </span>
                  <span>•</span>
                  <span>{tracks.length} nummers</span>
                  <span>•</span>
                  <span>ongeveer {totalMinutes} minuten</span>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
                  <Button
                    size="lg"
                    className="rounded-full bg-orange-500 hover:bg-orange-600 text-white px-8 shadow-lg shadow-orange-500/25"
                    onClick={handlePlayAll}
                    disabled={tracks.length === 0}
                  >
                    <Play className="w-5 h-5 mr-2 fill-current" />
                    Alles afspelen
                  </Button>

                  {isOwner && (
                    <>
                      <Button
                        variant="outline"
                        size="icon"
                        className="rounded-full"
                        onClick={() => {
                          setEditTitle(playlist.title);
                          setEditDescription(playlist.description || '');
                          setEditIsPublic(playlist.isPublic);
                          setIsEditDialogOpen(true);
                        }}
                        title="Afspeellijst bewerken"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>

                      <Button
                        variant="outline"
                        size="icon"
                        className="rounded-full text-muted-foreground hover:text-red-500 hover:border-red-500/40"
                        onClick={handleDelete}
                        title="Afspeellijst verwijderen"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </>
                  )}

                  <Button
                    variant="outline"
                    size="icon"
                    className="rounded-full"
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.href);
                      toast.success('Link naar afspeellijst gekopieerd!');
                    }}
                    title="Delen"
                  >
                    <Share2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tracks List */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {tracks.length > 0 ? (
            <div className="space-y-1">
              <div className="grid grid-cols-12 px-4 py-2 text-xs font-semibold uppercase text-muted-foreground border-b border-border/50">
                <span className="col-span-1">#</span>
                <span className="col-span-6 sm:col-span-7">Titel</span>
                <span className="hidden sm:block sm:col-span-3">Genre</span>
                <span className="col-span-5 sm:col-span-1 text-right flex items-center justify-end">
                  <Clock className="w-3.5 h-3.5" />
                </span>
              </div>

              {tracks.map((track, idx) => {
                const artist = getUserById(track.userId);
                const isCurrent = currentTrack?.id === track.id;

                return (
                  <div
                    key={`${track.id}-${idx}`}
                    className={`grid grid-cols-12 items-center px-4 py-3 rounded-xl hover:bg-card/80 transition-colors group ${
                      isCurrent ? 'bg-orange-500/10' : ''
                    }`}
                  >
                    {/* Index or Play icon */}
                    <div className="col-span-1 flex items-center">
                      <button
                        onClick={() => playTrack(track)}
                        className="w-6 h-6 flex items-center justify-center text-muted-foreground group-hover:text-orange-500 transition-colors"
                      >
                        {isCurrent && isPlaying ? (
                          <Pause className="w-4 h-4 text-orange-500 fill-current" />
                        ) : (
                          <span className="group-hover:hidden text-xs">{idx + 1}</span>
                        )}
                        {(!isCurrent || !isPlaying) && (
                          <Play className="w-4 h-4 hidden group-hover:block fill-current" />
                        )}
                      </button>
                    </div>

                    {/* Track Artwork & Title */}
                    <div className="col-span-6 sm:col-span-7 flex items-center gap-3 min-w-0 pr-2">
                      <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-muted">
                        <TrackCover track={track} />
                      </div>
                      <div className="min-w-0">
                        <Link
                          to={`/track/${track.id}`}
                          className={`font-medium text-sm truncate block hover:text-orange-500 transition-colors ${
                            isCurrent ? 'text-orange-500' : ''
                          }`}
                        >
                          {track.title}
                        </Link>
                        <Link
                          to={`/user/${track.userId}`}
                          className="text-xs text-muted-foreground truncate block hover:text-foreground"
                        >
                          {artist?.displayName || 'Artiest'}
                        </Link>
                      </div>
                    </div>

                    {/* Genre */}
                    <div className="hidden sm:block sm:col-span-3">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
                        {track.genre}
                      </span>
                    </div>

                    {/* Duration & Remove button */}
                    <div className="col-span-5 sm:col-span-1 flex items-center justify-end gap-2 text-right">
                      <span className="text-xs font-mono text-muted-foreground">
                        {track.durationFormatted}
                      </span>

                      {isOwner && (
                        <button
                          onClick={() => removeTrackFromPlaylist(playlist.id, track.id)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-red-500 p-1"
                          title="Verwijder uit afspeellijst"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-16 bg-card/40 rounded-2xl border border-dashed border-border max-w-lg mx-auto p-8">
              <Music className="w-12 h-12 mx-auto text-orange-500/50 mb-3" />
              <h3 className="text-lg font-semibold mb-2">Deze afspeellijst is nog leeg</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Zoek nummers op de homepagina of zoekpagina en voeg ze eenvoudig toe via het optiemenu.
              </p>
              <Button asChild className="rounded-full bg-orange-500 hover:bg-orange-600 text-white">
                <Link to="/">Ontdek muziek</Link>
              </Button>
            </div>
          )}
        </div>
      </main>

      {/* Edit Playlist Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle>Afspeellijst bewerken</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveEdit} className="space-y-4 mt-2">
            <div>
              <Label htmlFor="edit-pl-title">Naam</Label>
              <Input
                id="edit-pl-title"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                required
                maxLength={100}
              />
            </div>
            <div>
              <Label htmlFor="edit-pl-desc">Beschrijving</Label>
              <Textarea
                id="edit-pl-desc"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                maxLength={500}
              />
            </div>
            <div className="flex items-center justify-between py-2">
              <div>
                <Label htmlFor="edit-pl-public" className="cursor-pointer">Openbaar zichtbaar</Label>
                <p className="text-xs text-muted-foreground">Anderen kunnen deze lijst bekijken</p>
              </div>
              <Switch
                id="edit-pl-public"
                checked={editIsPublic}
                onCheckedChange={setEditIsPublic}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={() => setIsEditDialogOpen(false)}>
                Annuleren
              </Button>
              <Button type="submit" className="bg-orange-500 hover:bg-orange-600 text-white rounded-full">
                Opslaan
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <AddToPlaylistDialog />
      <AudioPlayer />
    </div>
  );
}
