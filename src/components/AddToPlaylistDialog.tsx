import { useState } from 'react';
import { Plus, Check, Music2, ListMusic, Lock, Globe } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { usePlaylist } from '@/context/PlaylistContext';
import { useAuth } from '@/context/AuthContext';
import { getUserById } from '@/data/mockData';
import { TrackCover } from '@/components/TrackCover';

export function AddToPlaylistDialog() {
  const { isAuthenticated } = useAuth();
  const {
    userPlaylists,
    selectedTrackForPlaylist,
    closeAddToPlaylistModal,
    addTrackToPlaylist,
    removeTrackFromPlaylist,
    isTrackInPlaylist,
    createPlaylist,
  } = usePlaylist();

  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newPlaylistTitle, setNewPlaylistTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!selectedTrackForPlaylist) return null;

  const trackArtist = getUserById(selectedTrackForPlaylist.userId);

  const handleCreateAndAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlaylistTitle.trim()) return;

    setIsSubmitting(true);
    try {
      const created = await createPlaylist(newPlaylistTitle.trim());
      await addTrackToPlaylist(created.id, selectedTrackForPlaylist.id);
      setNewPlaylistTitle('');
      setIsCreatingNew(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleTrack = (playlistId: string) => {
    if (isTrackInPlaylist(playlistId, selectedTrackForPlaylist.id)) {
      removeTrackFromPlaylist(playlistId, selectedTrackForPlaylist.id);
    } else {
      addTrackToPlaylist(playlistId, selectedTrackForPlaylist.id);
    }
  };

  return (
    <Dialog open={Boolean(selectedTrackForPlaylist)} onOpenChange={(open) => !open && closeAddToPlaylistModal()}>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ListMusic className="w-5 h-5 text-orange-500" />
            Toevoegen aan afspeellijst
          </DialogTitle>
          <DialogDescription>
            Kies een afspeellijst voor dit nummer of maak een nieuwe lijst aan.
          </DialogDescription>
        </DialogHeader>

        {/* Selected Track Preview */}
        <div className="flex items-center gap-3 p-3 rounded-xl bg-background border border-border/60 mb-2">
          <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 bg-muted">
            <TrackCover track={selectedTrackForPlaylist} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-sm truncate">{selectedTrackForPlaylist.title}</p>
            <p className="text-xs text-muted-foreground truncate">{trackArtist?.displayName}</p>
          </div>
          <span className="text-xs font-mono text-muted-foreground">
            {selectedTrackForPlaylist.durationFormatted}
          </span>
        </div>

        {!isAuthenticated ? (
          <div className="text-center py-6">
            <p className="text-sm text-muted-foreground mb-4">
              Log in om afspeellijsten aan te maken en nummers op te slaan.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Playlists list */}
            <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
              {userPlaylists.length > 0 ? (
                userPlaylists.map((pl) => {
                  const isInPlaylist = isTrackInPlaylist(pl.id, selectedTrackForPlaylist.id);
                  return (
                    <button
                      key={pl.id}
                      type="button"
                      onClick={() => handleToggleTrack(pl.id)}
                      className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all border ${
                        isInPlaylist
                          ? 'bg-orange-500/10 border-orange-500/30 text-orange-400'
                          : 'bg-background hover:bg-muted border-border/50 text-foreground'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0 pr-2">
                        <div className="w-10 h-10 rounded-md overflow-hidden shrink-0 bg-muted">
                          <TrackCover playlist={pl} />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate">{pl.title}</p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                            {pl.isPublic ? <Globe className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                            <span>{pl.tracksCount || 0} nummers</span>
                          </p>
                        </div>
                      </div>

                      <div className="shrink-0">
                        {isInPlaylist ? (
                          <div className="w-6 h-6 rounded-full bg-orange-500 text-white flex items-center justify-center">
                            <Check className="w-3.5 h-3.5" />
                          </div>
                        ) : (
                          <div className="w-6 h-6 rounded-full border border-border flex items-center justify-center text-muted-foreground hover:border-orange-500">
                            <Plus className="w-3.5 h-3.5" />
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="text-center py-6 text-sm text-muted-foreground">
                  <Music2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  Je hebt nog geen eigen afspeellijsten.
                </div>
              )}
            </div>

            {/* Create new playlist toggle & form */}
            {!isCreatingNew ? (
              <Button
                variant="outline"
                className="w-full rounded-full border-dashed border-orange-500/40 text-orange-400 hover:bg-orange-500/10"
                onClick={() => setIsCreatingNew(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Nieuwe afspeellijst maken
              </Button>
            ) : (
              <form onSubmit={handleCreateAndAdd} className="p-3 rounded-xl bg-background border border-border space-y-3">
                <Label htmlFor="quick-playlist-title" className="text-xs font-semibold">
                  Titel van nieuwe afspeellijst
                </Label>
                <Input
                  id="quick-playlist-title"
                  placeholder="Bijv. Zomer Vibes 2026"
                  value={newPlaylistTitle}
                  onChange={(e) => setNewPlaylistTitle(e.target.value)}
                  autoFocus
                  maxLength={100}
                />
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setIsCreatingNew(false);
                      setNewPlaylistTitle('');
                    }}
                  >
                    Annuleren
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    className="bg-orange-500 hover:bg-orange-600 text-white rounded-full"
                    disabled={!newPlaylistTitle.trim() || isSubmitting}
                  >
                    Aanmaken en toevoegen
                  </Button>
                </div>
              </form>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
