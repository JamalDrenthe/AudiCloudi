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
      <DialogContent className="sm:max-w-md bg-[#161617]/95 border-white/10 text-white rounded-3xl backdrop-blur-3xl shadow-[0_25px_70px_rgba(0,0,0,0.85)] p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-semibold tracking-tight text-white">
            <ListMusic className="w-5 h-5 text-[#fa233b]" />
            Toevoegen aan afspeellijst
          </DialogTitle>
          <DialogDescription className="text-xs text-[#86868b]">
            Kies een afspeellijst voor dit nummer of maak een nieuwe lijst aan.
          </DialogDescription>
        </DialogHeader>

        {/* Selected Track Preview */}
        <div className="flex items-center gap-3 p-3 rounded-2xl bg-[#1c1c1e]/70 border border-white/[0.08] mb-2 shadow-sm">
          <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 bg-black/40 ring-1 ring-white/10">
            <TrackCover track={selectedTrackForPlaylist} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-sm truncate text-white">{selectedTrackForPlaylist.title}</p>
            <p className="text-xs text-[#86868b] truncate mt-0.5">{trackArtist?.displayName}</p>
          </div>
          <span className="text-xs font-mono text-[#86868b]">
            {selectedTrackForPlaylist.durationFormatted}
          </span>
        </div>

        {!isAuthenticated ? (
          <div className="text-center py-6">
            <p className="text-sm text-[#86868b] mb-4">
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
                      className={`w-full flex items-center justify-between p-2.5 rounded-2xl text-left transition-all border ${
                        isInPlaylist
                          ? 'bg-white/10 border-white/20 text-white'
                          : 'bg-[#1c1c1e]/50 hover:bg-[#1c1c1e] border-white/[0.06] text-white'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0 pr-2">
                        <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 bg-black/40 ring-1 ring-white/10">
                          <TrackCover playlist={pl} />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-sm truncate text-white">{pl.title}</p>
                          <p className="text-xs text-[#86868b] flex items-center gap-1.5 mt-0.5">
                            {pl.isPublic ? <Globe className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                            <span>{pl.tracksCount || 0} nummers</span>
                          </p>
                        </div>
                      </div>

                      <div className="shrink-0">
                        {isInPlaylist ? (
                          <div className="w-6 h-6 rounded-full bg-white text-black flex items-center justify-center shadow-sm">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </div>
                        ) : (
                          <div className="w-6 h-6 rounded-full border border-white/20 flex items-center justify-center text-[#86868b] hover:border-white hover:text-white transition-colors">
                            <Plus className="w-3.5 h-3.5" />
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="text-center py-6 text-sm text-[#86868b]">
                  <Music2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  Je hebt nog geen eigen afspeellijsten.
                </div>
              )}
            </div>

            {/* Create new playlist toggle & form */}
            {!isCreatingNew ? (
              <Button
                variant="secondary"
                className="w-full rounded-full bg-[#1c1c1e] text-white hover:bg-[#2c2c2e] border border-white/[0.08] text-xs h-10"
                onClick={() => setIsCreatingNew(true)}
              >
                <Plus className="w-4 h-4 mr-2" />
                Nieuwe afspeellijst maken
              </Button>
            ) : (
              <form onSubmit={handleCreateAndAdd} className="p-4 rounded-2xl bg-[#1c1c1e]/70 border border-white/[0.08] space-y-3">
                <Label htmlFor="quick-playlist-title" className="text-xs font-medium text-[#86868b]">
                  Titel van nieuwe afspeellijst
                </Label>
                <Input
                  id="quick-playlist-title"
                  placeholder="Bijv. Zomer Vibes 2026"
                  value={newPlaylistTitle}
                  onChange={(e) => setNewPlaylistTitle(e.target.value)}
                  autoFocus
                  maxLength={100}
                  className="rounded-xl bg-[#1c1c1e] border-white/10 text-white placeholder:text-[#86868b] text-xs h-10"
                />
                <div className="flex justify-end gap-2 pt-1">
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="rounded-full text-[#86868b] hover:text-white hover:bg-white/10"
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
                    variant="apple"
                    className="rounded-full px-5 font-semibold"
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
