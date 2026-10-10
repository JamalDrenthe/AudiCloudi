import { useState, useCallback, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  UploadCloud,
  X,
  Music,
  Image as ImageIcon,
  Video,
  Disc,
  ListPlus,
  Coins,
  ShieldCheck,
  AlertTriangle,
  Sliders,
  Plus,
  Trash2,
  Lock,
  Globe,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Navbar } from '@/components/Navbar';
import { useAuth } from '@/context/AuthContext';
import { useTracks } from '@/context/TrackContext';
import { usePlaylist } from '@/context/PlaylistContext';
import { saveLocalAudioFile, saveLocalVideoFile, saveLocalCoverImage } from '@/lib/audioStorage';
import { toast } from 'sonner';
import type { Track } from '@/types';

interface QueuedTrack {
  id: string;
  file: File;
  title: string;
  genre: string;
  duration: number;
  durationFormatted: string;
  isExplicit: boolean;
}

const genres = [
  'Electronic',
  'Hip Hop',
  'Rock',
  'Pop',
  'Jazz',
  'Classical',
  'Ambient',
  'Podcast',
  'Other',
];

const licenses = [
  { value: 'all-rights-reserved', label: 'All Rights Reserved' },
  { value: 'cc-by', label: 'Creative Commons Attribution' },
  { value: 'cc-by-sa', label: 'Creative Commons Attribution-ShareAlike' },
  { value: 'cc-by-nc', label: 'Creative Commons Attribution-NonCommercial' },
  { value: 'cc-by-nd', label: 'Creative Commons Attribution-NoDerivatives' },
  { value: 'public-domain', label: 'Public Domain' },
];

export function Upload() {
  const navigate = useNavigate();
  const {
    user,
    isAuthenticated,
    plan,
    credits,
    monthlyUploadsCount,
    monthlyUploadsLimit,
    deductCredits,
    incrementUploadsCount,
  } = useAuth();
  const { uploadTrack } = useTracks();
  const { createPlaylist } = usePlaylist();

  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Queued tracks for single or bulk upload
  const [trackQueue, setTrackQueue] = useState<QueuedTrack[]>([]);
  const [globalGenre, setGlobalGenre] = useState('Electronic');
  const [globalLicense, setGlobalLicense] = useState<Track['license']>('all-rights-reserved');
  const [isPrivate, setIsPrivate] = useState(false);

  // Cover Art & Video Canvas
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [coverVideoFile, setCoverVideoFile] = useState<File | null>(null);
  const [coverVideoUrl, setCoverVideoUrl] = useState<string | null>(null);
  const [coverType, setCoverType] = useState<'image' | 'video'>('image');
  const [videoDuration, setVideoDuration] = useState<number>(0);

  // Playlist & Album creation toggle
  const [createCollection, setCreateCollection] = useState(false);
  const [collectionType, setCollectionType] = useState<'album' | 'playlist'>('album');
  const [collectionTitle, setCollectionTitle] = useState('');
  const [collectionDescription, setCollectionDescription] = useState('');

  // Mixing & Mastering requirement
  const [isAlreadyMastered, setIsAlreadyMastered] = useState(true);
  const [requestMastering, setRequestMastering] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const coverInputRef = useRef<HTMLInputElement | null>(null);

  // Helper to format duration seconds to mm:ss
  const formatSeconds = (sec: number): string => {
    const mins = Math.floor(sec / 60);
    const secs = Math.floor(sec % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Process selected audio files
  const processAudioFiles = (files: FileList | File[]) => {
    const newItems: QueuedTrack[] = [];

    Array.from(files).forEach((file) => {
      if (file.type.startsWith('audio/') || file.name.match(/\.(mp3|wav|flac|m4a|ogg)$/i)) {
        const trackId = `track_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
        const cleanTitle = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');

        const item: QueuedTrack = {
          id: trackId,
          file,
          title: cleanTitle,
          genre: globalGenre,
          duration: 180,
          durationFormatted: '3:00',
          isExplicit: false,
        };

        // Attempt reading duration from file
        try {
          const testAudio = new Audio(URL.createObjectURL(file));
          testAudio.onloadedmetadata = () => {
            if (testAudio.duration && !isNaN(testAudio.duration) && testAudio.duration > 0) {
              const dur = Math.round(testAudio.duration);
              item.duration = dur;
              item.durationFormatted = formatSeconds(dur);
              setTrackQueue((prev) =>
                prev.map((t) => (t.id === item.id ? { ...t, duration: dur, durationFormatted: formatSeconds(dur) } : t))
              );
            }
          };
        } catch {
          // Fallback
        }

        newItems.push(item);
      } else {
        toast.error(`"${file.name}" is geen geldig audiobestand (MP3, WAV, FLAC, M4A).`);
      }
    });

    if (newItems.length > 0) {
      setTrackQueue((prev) => [...prev, ...newItems]);
      if (!collectionTitle) {
        setCollectionTitle(newItems.length > 1 ? `${newItems[0].title} & meer` : newItems[0].title);
      }
      toast.success(`${newItems.length} audiobestand(en) toegevoegd aan de wachtrij!`);
    }
  };

  const handleAudioDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        processAudioFiles(e.dataTransfer.files);
      }
    },
    [globalGenre, collectionTitle]
  );

  const handleAudioSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processAudioFiles(e.target.files);
      e.target.value = '';
    }
  };

  const handleRemoveTrack = (trackId: string) => {
    setTrackQueue((prev) => prev.filter((t) => t.id !== trackId));
  };

  const handleUpdateTrackTitle = (trackId: string, newTitle: string) => {
    setTrackQueue((prev) =>
      prev.map((t) => (t.id === trackId ? { ...t, title: newTitle } : t))
    );
  };

  const handleUpdateTrackGenre = (trackId: string, newGenre: string) => {
    setTrackQueue((prev) =>
      prev.map((t) => (t.id === trackId ? { ...t, genre: newGenre } : t))
    );
  };

  const handleToggleTrackExplicit = (trackId: string) => {
    setTrackQueue((prev) =>
      prev.map((t) => (t.id === trackId ? { ...t, isExplicit: !t.isExplicit } : t))
    );
  };

  // Helper to resize and compress cover image to max 1000x1000 JPEG (~80KB)
  const processCoverImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const MAX_SIZE = 1000;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_SIZE) {
              height = Math.round((height * MAX_SIZE) / width);
              width = MAX_SIZE;
            }
          } else {
            if (height > MAX_SIZE) {
              width = Math.round((width * MAX_SIZE) / height);
              height = MAX_SIZE;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', 0.88));
          } else {
            resolve(e.target?.result as string);
          }
        };
        img.onerror = () => reject(new Error('Image decode error'));
        img.src = e.target?.result as string;
      };
      reader.onerror = () => reject(new Error('FileReader error'));
      reader.readAsDataURL(file);
    });
  };

  // Process selected or dropped cover file (image or short MP4 video canvas)
  const processCoverFile = async (file: File) => {
    // 1. Check if video file
    if (file.type.startsWith('video/') || file.name.match(/\.(mp4|webm|mov|m4v)$/i)) {
      const objUrl = URL.createObjectURL(file);
      const tempVideo = document.createElement('video');
      tempVideo.muted = true;
      tempVideo.playsInline = true;
      tempVideo.preload = 'auto';
      tempVideo.src = objUrl;

      let hasHandled = false;

      const onVideoReady = () => {
        if (hasHandled) return;
        hasHandled = true;

        let dur = Math.round(tempVideo.duration);
        if (isNaN(dur) || !isFinite(dur) || dur <= 0) {
          dur = 15;
        }
        setVideoDuration(dur);

        // Strict validation: video must not exceed 1 minute (60 seconds)
        if (dur > 60) {
          URL.revokeObjectURL(objUrl);
          toast.error(
            `Korte video canvas mag maximaal 1 minuut (60 seconden) duren! Dit bestand duurt ${dur} seconden.`
          );
          if (coverInputRef.current) coverInputRef.current.value = '';
          return;
        }

        setCoverVideoFile(file);
        setCoverVideoUrl(objUrl);
        setCoverType('video');
        setCoverImage(null);
        toast.success(`Video canvas geselecteerd (${dur}s, MP4 loop)!`);
      };

      tempVideo.onloadedmetadata = onVideoReady;
      tempVideo.onloadeddata = onVideoReady;
      tempVideo.oncanplay = onVideoReady;

      tempVideo.onerror = () => {
        if (hasHandled) return;
        hasHandled = true;
        if (file.size < 50 * 1024 * 1024) {
          setVideoDuration(15);
          setCoverVideoFile(file);
          setCoverVideoUrl(objUrl);
          setCoverType('video');
          setCoverImage(null);
          toast.success('Video canvas geselecteerd!');
        } else {
          URL.revokeObjectURL(objUrl);
          toast.error('Kan de video niet inladen. Zorg voor een geldig MP4-bestand.');
        }
      };

      setTimeout(() => {
        if (!hasHandled && file.size < 50 * 1024 * 1024) {
          onVideoReady();
        }
      }, 1200);

      return;
    }

    // 2. Check if image file
    if (file.type.startsWith('image/') || file.name.match(/\.(jpe?g|png|webp|gif|avif|svg)$/i)) {
      try {
        const compressedDataUrl = await processCoverImage(file);
        setCoverImage(compressedDataUrl);
        setCoverType('image');
        setCoverVideoFile(null);
        if (coverVideoUrl) {
          URL.revokeObjectURL(coverVideoUrl);
          setCoverVideoUrl(null);
        }
        toast.success('Cover artwork geselecteerd!');
      } catch (err) {
        console.error('Error processing cover image:', err);
        const reader = new FileReader();
        reader.onloadend = () => {
          setCoverImage(reader.result as string);
          setCoverType('image');
          setCoverVideoFile(null);
          setCoverVideoUrl(null);
          toast.success('Cover artwork geselecteerd!');
        };
        reader.readAsDataURL(file);
      }
      return;
    }

    toast.error('Selecteer een geldige afbeelding (JPG, PNG) of MP4 video (max 1 minuut).');
  };

  const handleCoverSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processCoverFile(file);
    }
    e.target.value = '';
  };

  const handleCoverDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processCoverFile(e.dataTransfer.files[0]);
    }
  };

  const handleClearCover = () => {
    setCoverImage(null);
    if (coverVideoUrl) {
      URL.revokeObjectURL(coverVideoUrl);
    }
    setCoverVideoFile(null);
    setCoverVideoUrl(null);
    setCoverType('image');
    if (coverInputRef.current) coverInputRef.current.value = '';
  };

  // Credit calculation
  const totalTracksCount = trackQueue.length;
  const uploadCostPerTrack = 5000; // 5.000 credits = €5,-
  const masteringCostPerTrack = 50000; // 50.000 credits = €50,-

  const baseUploadCredits = totalTracksCount * uploadCostPerTrack;
  const masteringCredits = (!isAlreadyMastered && requestMastering)
    ? totalTracksCount * masteringCostPerTrack
    : 0;
  const totalCreditsRequired = baseUploadCredits + masteringCredits;

  const userCurrentCredits = credits ?? 50000;
  const hasSufficientCredits = userCurrentCredits >= totalCreditsRequired;

  const isGebruiker = plan === 'gebruiker';
  const isMonthlyLimitExceeded =
    monthlyUploadsLimit > 0 &&
    (monthlyUploadsCount || 0) + totalTracksCount > monthlyUploadsLimit;

  // Submit all queued tracks
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (trackQueue.length === 0) {
      toast.error('Voeg minimaal één audiobestand toe om te uploaden.');
      return;
    }

    if (isGebruiker) {
      toast.error('Als Gebruiker kun je geen tracks uploaden. Upgrade naar Artiest of Label!');
      navigate('/pricing');
      return;
    }

    if (isMonthlyLimitExceeded) {
      toast.error(
        `Je maandelijkse uploadlimiet van ${monthlyUploadsLimit} tracks is bereikt. Upgrade je abonnement voor meer uploads!`
      );
      navigate('/pricing');
      return;
    }

    if (!hasSufficientCredits) {
      toast.error(
        `Onvoldoende credits! Je hebt ${userCurrentCredits.toLocaleString()} credits, maar ${totalCreditsRequired.toLocaleString()} credits zijn nodig.`
      );
      navigate('/pricing');
      return;
    }

    if (!isAlreadyMastered && !requestMastering) {
      toast.error(
        'Voor gratis distributie op streaming platforms moet de track gemixt en gemastered zijn. Vink de bevestiging aan of kies optioneel voor platform Mix & Mastering.'
      );
      return;
    }

    setIsUploading(true);
    setUploadProgress(10);

    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => (prev >= 85 ? 85 : prev + 15));
    }, 200);

    try {
      const createdTrackIds: string[] = [];
      let finalCoverUrl =
        coverImage ||
        'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500&h=500&fit=crop';
      let finalCoverVideoUrl: string | undefined = undefined;

      // Save video file if present
      if (coverVideoFile) {
        const videoId = `video_cov_${Date.now()}`;
        finalCoverVideoUrl = await saveLocalVideoFile(videoId, coverVideoFile);
      }

      // Upload each track in queue
      for (const item of trackQueue) {
        // Save audio to IndexedDB and memory cache so playback plays THIS specific file!
        const savedAudioUrl = await saveLocalAudioFile(item.id, item.file);

        // Also associate video or image cover with track in IndexedDB
        if (coverVideoFile) {
          await saveLocalVideoFile(item.id, coverVideoFile);
        }
        if (coverImage) {
          await saveLocalCoverImage(item.id, coverImage);
        }

        const createdTrack = await uploadTrack({
          id: item.id,
          userId: user?.id || 'admin_jamal',
          title: item.title.trim(),
          description: `Geproduceerd met AudiCloudi. Genre: ${item.genre}.`,
          genre: item.genre,
          tags: [item.genre.toLowerCase(), 'audicloudi', item.isExplicit ? 'explicit' : 'clean'],
          duration: item.duration,
          durationFormatted: item.durationFormatted,
          waveformData: Array.from({ length: 40 }, () => Math.floor(Math.random() * 80) + 20),
          audioUrl: savedAudioUrl, // Directly assign active object URL
          coverUrl: finalCoverUrl,
          coverVideoUrl: finalCoverVideoUrl,
          coverType,
          isMastered: isAlreadyMastered || requestMastering,
          isPrivate,
          isExplicit: item.isExplicit,
          license: globalLicense,
        });

        createdTrackIds.push(createdTrack.id);
      }

      // Deduct credits from user
      deductCredits(totalCreditsRequired);
      incrementUploadsCount(trackQueue.length);

      clearInterval(progressInterval);
      setUploadProgress(100);

      // Create playlist or album if toggled
      if (createCollection && createdTrackIds.length > 0) {
        const titleToUse =
          collectionTitle.trim() ||
          (collectionType === 'album' ? 'Mijn Nieuwe Album' : 'Mijn Nieuwe Afspeellijst');

        const newCollection = await createPlaylist(
          titleToUse,
          collectionDescription.trim() || `${collectionType === 'album' ? 'Album' : 'Afspeellijst'} uitgebracht op AudiCloudi.`,
          !isPrivate,
          createdTrackIds,
          finalCoverUrl,
          finalCoverVideoUrl,
          coverType,
          collectionType
        );

        if (coverImage) {
          await saveLocalCoverImage(newCollection.id, coverImage);
        }
        if (coverVideoFile) {
          await saveLocalVideoFile(newCollection.id, coverVideoFile);
        }

        toast.success(
          `${collectionType === 'album' ? 'Album' : 'Afspeellijst'} "${titleToUse}" met ${createdTrackIds.length} tracks succesvol aangemaakt!`
        );
        navigate(`/playlist/${newCollection.id}`);
        return;
      }

      toast.success(
        `${createdTrackIds.length} track(s) succesvol geüpload! ${totalCreditsRequired.toLocaleString()} credits verwerkt.`
      );
      navigate('/library?tab=uploads');
    } catch (err) {
      clearInterval(progressInterval);
      setIsUploading(false);
      toast.error('Fout bij het uploaden van de tracks.');
      console.error(err);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-28 px-4">
          <div className="max-w-md mx-auto text-center bg-card border border-border p-8 rounded-2xl">
            <h1 className="text-2xl font-bold">Inloggen vereist</h1>
            <p className="text-muted-foreground mt-2 text-sm">
              Je moet ingelogd zijn om muziek te kunnen uploaden naar AudiCloudi.
            </p>
            <Button asChild className="mt-6 rounded-full bg-orange-500 hover:bg-orange-600 text-white">
              <Link to="/login">Inloggen</Link>
            </Button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-28">
      <Navbar />

      <main className="pt-24 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight">Upload & Release</h1>
              <p className="text-muted-foreground text-sm mt-1">
                Upload één of meerdere tracks tegelijk, voeg video canvas artwork toe en maak direct een album of afspeellijst.
              </p>
            </div>
            {/* Credit Pill */}
            <Link
              to="/pricing"
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-secondary border border-border hover:border-orange-500/50 transition-colors text-xs"
            >
              <Coins className="w-4 h-4 text-orange-400" />
              <span>
                Saldo: <strong className="text-orange-400">{userCurrentCredits.toLocaleString()}</strong> credits
              </span>
            </Link>
          </div>

          {/* User Tier Restriction Banner */}
          {isGebruiker && (
            <div className="mt-4 p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold text-red-200">Uploaden niet toegestaan voor 'Gebruiker'</p>
                <p className="text-red-300/80 mt-0.5">
                  Met een 'Gebruiker' abonnement (€10,- p/m) kun je alleen streamen. Upgrade naar <strong>Artiest</strong> (€50,- p/m, 10 tracks) of <strong>Label</strong> (€200,- p/m, 50 tracks) om muziek uit te brengen.
                </p>
                <Button asChild size="sm" className="mt-3 bg-red-600 hover:bg-red-700 text-white rounded-lg">
                  <Link to="/pricing">Bekijk Prijzen & Upgrade</Link>
                </Button>
              </div>
            </div>
          )}

          {!isGebruiker && (
            <div className="mt-4 px-4 py-2.5 rounded-xl bg-secondary/50 border border-border text-xs flex items-center justify-between">
              <span className="text-muted-foreground">
                Abonnement: <strong className="text-foreground capitalize">{plan || 'Artiest'}</strong> ({monthlyUploadsLimit} uploads/mnd)
              </span>
              <span className="text-muted-foreground font-mono">
                Releases deze maand: <strong className="text-foreground">{monthlyUploadsCount || 0}</strong> / {monthlyUploadsLimit}
              </span>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Audio Upload Box (Supports Multiple) */}
          <div className="bg-card border border-border rounded-2xl p-6 sm:p-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <Label className="text-lg font-bold">Audiobestanden *</Label>
                <p className="text-xs text-muted-foreground">
                  Selecteer één of meerdere tracks tegelijk (MP3, WAV, FLAC, M4A)
                </p>
              </div>
              {trackQueue.length > 0 && (
                <Badge variant="outline" className="text-orange-400 border-orange-500/40">
                  {trackQueue.length} track(s) geselecteerd
                </Badge>
              )}
            </div>

            {/* Drop Zone */}
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleAudioDrop}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-border hover:border-orange-500/50 hover:bg-orange-500/5 transition-all rounded-xl p-8 text-center cursor-pointer group"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*,.mp3,.wav,.flac,.m4a,.ogg"
                multiple
                onChange={handleAudioSelect}
                className="hidden"
              />
              <div className="w-14 h-14 rounded-full bg-secondary group-hover:bg-orange-500/10 flex items-center justify-center mx-auto mb-3 transition-colors">
                <UploadCloud className="w-7 h-7 text-muted-foreground group-hover:text-orange-500 transition-colors" />
              </div>
              <p className="text-sm font-semibold">
                Sleep audiobestanden hierheen of klik om te bladeren
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Ondersteunt meerdere bestanden tegelijkertijd
              </p>
            </div>

            {/* Queued Tracks List */}
            {trackQueue.length > 0 && (
              <div className="mt-6 space-y-3">
                <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground px-1">
                  <span>Geselecteerde nummers ({trackQueue.length})</span>
                  <span>5.000 credits per track</span>
                </div>

                <div className="divide-y divide-border/50 border border-border rounded-xl overflow-hidden bg-background/50">
                  {trackQueue.map((t, idx) => (
                    <div key={t.id} className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <span className="w-6 text-center text-xs font-mono text-muted-foreground">
                          {idx + 1}.
                        </span>
                        <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-400 flex-shrink-0">
                          <Music className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <Input
                            value={t.title}
                            onChange={(e) => handleUpdateTrackTitle(t.id, e.target.value)}
                            className="h-8 text-sm font-medium bg-transparent border-border/40 focus-visible:bg-secondary"
                            placeholder="Titel van het nummer"
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pl-9 sm:pl-0">
                        <Select
                          value={t.genre}
                          onValueChange={(val) => handleUpdateTrackGenre(t.id, val)}
                        >
                          <SelectTrigger className="h-8 w-28 text-xs bg-secondary/80">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {genres.map((g) => (
                              <SelectItem key={g} value={g} className="text-xs">
                                {g}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleTrackExplicit(t.id)}
                          className={`h-8 px-2 text-[11px] font-bold ${
                            t.isExplicit ? 'bg-zinc-800 text-orange-400' : 'text-muted-foreground'
                          }`}
                          title="Explicit content"
                        >
                          E
                        </Button>

                        <span className="text-xs font-mono text-muted-foreground w-12 text-right">
                          {t.durationFormatted}
                        </span>

                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveTrack(t.id)}
                          className="h-8 w-8 text-muted-foreground hover:text-red-400"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end pt-1">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-xs rounded-lg"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    Voeg nog een nummer toe
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Cover Art & Video Canvas Section */}
          <div className="bg-card border border-border rounded-2xl p-6 sm:p-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <Label className="text-lg font-bold">Cover Artwork & Video Canvas</Label>
                <p className="text-xs text-muted-foreground">
                  Upload een afbeelding (JPG, PNG) óf een korte video loop (MP4, max 1 minuut)
                </p>
              </div>
              <Badge variant="outline" className="text-xs flex items-center gap-1">
                <Video className="w-3 h-3 text-orange-400" />
                MP4 Canvas toegestaan (max 60s)
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
              {/* Preview Area */}
              <div
                onClick={() => coverInputRef.current?.click()}
                onDrop={handleCoverDrop}
                onDragOver={(e) => e.preventDefault()}
                className="relative aspect-square w-full rounded-xl overflow-hidden border border-border bg-secondary/50 flex items-center justify-center group shadow-md cursor-pointer hover:border-orange-500/50 transition-colors"
              >
                {coverType === 'video' && coverVideoUrl ? (
                  <video
                    src={coverVideoUrl}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                  />
                ) : coverImage ? (
                  <img
                    src={coverImage}
                    alt="Cover preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-center p-4">
                    <ImageIcon className="w-10 h-10 text-muted-foreground mx-auto mb-2 opacity-50 group-hover:text-orange-400 group-hover:opacity-100 transition-all" />
                    <span className="text-xs text-muted-foreground block group-hover:text-foreground">
                      Klik of sleep artwork hierheen
                    </span>
                  </div>
                )}

                {/* Overlay Badge */}
                {coverType === 'video' && coverVideoUrl && (
                  <span className="absolute bottom-2 left-2 px-2 py-0.5 text-[11px] font-bold bg-black/80 text-orange-400 rounded border border-orange-500/30">
                    MP4 CANVAS ({videoDuration}s)
                  </span>
                )}

                {/* Remove button if artwork selected */}
                {(coverImage || coverVideoUrl) && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleClearCover();
                    }}
                    className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/70 text-white flex items-center justify-center hover:bg-red-600 transition-colors z-10"
                    title="Verwijder cover"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Upload Controls */}
              <div className="md:col-span-2 space-y-4">
                <div
                  onClick={() => coverInputRef.current?.click()}
                  onDrop={handleCoverDrop}
                  onDragOver={(e) => e.preventDefault()}
                  className="border-2 border-dashed border-border hover:border-orange-500/50 rounded-xl p-6 text-center cursor-pointer hover:bg-orange-500/5 transition-all group"
                >
                  <input
                    ref={coverInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif,video/mp4,video/webm,video/quicktime,video/x-m4v"
                    onChange={handleCoverSelect}
                    className="hidden"
                  />
                  <div className="flex items-center justify-center gap-3 text-sm font-semibold mb-1">
                    <ImageIcon className="w-4 h-4 text-orange-400 group-hover:scale-110 transition-transform" />
                    <span>Afbeelding</span>
                    <span className="text-muted-foreground">of</span>
                    <Video className="w-4 h-4 text-orange-400 group-hover:scale-110 transition-transform" />
                    <span>Korte MP4 Video</span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">
                    Klik of sleep een cover artwork of canvas video (max. 1 minuut) hierheen.
                  </p>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    className="text-xs rounded-lg pointer-events-none group-hover:bg-orange-500 group-hover:text-white transition-colors"
                  >
                    Bestand selecteren...
                  </Button>
                </div>

                <div className="text-xs text-muted-foreground space-y-1 bg-secondary/40 p-3 rounded-lg border border-border/50">
                  <p className="font-semibold text-foreground">Aanbevolen formaten:</p>
                  <p>• <strong>Afbeelding:</strong> 1000x1000px JPG/PNG (1:1 verhouding)</p>
                  <p>• <strong>Video Canvas:</strong> MP4 (H.264), maximaal 60 seconden, wordt geloopt in de audiospeler</p>
                </div>
              </div>
            </div>
          </div>

          {/* Album & Playlist Creation During Upload */}
          <div className="bg-card border border-border rounded-2xl p-6 sm:p-8">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-lg font-bold">Album of Afspeellijst Aanmaken</Label>
                <p className="text-xs text-muted-foreground">
                  Groepeer deze upload direct in een officieel Album of Afspeellijst
                </p>
              </div>
              <Switch
                checked={createCollection}
                onCheckedChange={setCreateCollection}
              />
            </div>

            {createCollection && (
              <div className="mt-6 pt-6 border-t border-border space-y-5">
                {/* Collection Type Selector */}
                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    variant={collectionType === 'album' ? 'default' : 'outline'}
                    onClick={() => setCollectionType('album')}
                    className={`rounded-xl text-xs font-semibold ${
                      collectionType === 'album' ? 'bg-orange-500 hover:bg-orange-600 text-white' : ''
                    }`}
                  >
                    <Disc className="w-4 h-4 mr-1.5" />
                    Album
                  </Button>
                  <Button
                    type="button"
                    variant={collectionType === 'playlist' ? 'default' : 'outline'}
                    onClick={() => setCollectionType('playlist')}
                    className={`rounded-xl text-xs font-semibold ${
                      collectionType === 'playlist' ? 'bg-orange-500 hover:bg-orange-600 text-white' : ''
                    }`}
                  >
                    <ListPlus className="w-4 h-4 mr-1.5" />
                    Afspeellijst
                  </Button>
                </div>

                <div>
                  <Label className="text-sm font-semibold">Titel van {collectionType === 'album' ? 'het Album' : 'de Afspeellijst'} *</Label>
                  <Input
                    value={collectionTitle}
                    onChange={(e) => setCollectionTitle(e.target.value)}
                    placeholder={collectionType === 'album' ? 'Bijv. Night Odyssey LP' : 'Bijv. Zomer 2026 Vibes'}
                    className="mt-1.5"
                    required={createCollection}
                  />
                </div>

                <div>
                  <Label className="text-sm font-semibold">Beschrijving (optioneel)</Label>
                  <Textarea
                    value={collectionDescription}
                    onChange={(e) => setCollectionDescription(e.target.value)}
                    placeholder="Vertel iets over dit album of deze afspeellijst..."
                    className="mt-1.5 resize-none h-20"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Mixing, Mastering & Distribution Requirement */}
          <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-lg font-bold flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  Mix & Mastering & Streaming Distributie
                </Label>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Voor gratis distributie op alle grote streaming platforms moet een track professioneel gemixt en gemastered zijn.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-secondary/50 border border-border space-y-3">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isAlreadyMastered}
                  onChange={(e) => {
                    setIsAlreadyMastered(e.target.checked);
                    if (e.target.checked) setRequestMastering(false);
                  }}
                  className="mt-1 w-4 h-4 text-orange-500 rounded border-border"
                />
                <div className="text-xs">
                  <p className="font-semibold text-foreground">
                    ✅ Dit audiobestand is al gemixt en gemastered
                  </p>
                  <p className="text-muted-foreground mt-0.5">
                    Je track voldoet aan de streaming standaarden (-14 LUFS). Wereldwijde distributie is <strong>gratis inbegrepen</strong>.
                  </p>
                </div>
              </label>

              {!isAlreadyMastered && (
                <label className="flex items-start gap-3 cursor-pointer pt-3 border-t border-border/50">
                  <input
                    type="checkbox"
                    checked={requestMastering}
                    onChange={(e) => setRequestMastering(e.target.checked)}
                    className="mt-1 w-4 h-4 text-orange-500 rounded border-border"
                  />
                  <div className="text-xs">
                    <p className="font-semibold text-orange-400 flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5" />
                      Studio Mix & Mastering aanvragen (+50.000 credits per track)
                    </p>
                    <p className="text-muted-foreground mt-0.5">
                      Ons studioteam mixt en mastert je track voor optimale club- en streamingkwaliteit.
                    </p>
                  </div>
                </label>
              )}
            </div>
          </div>

          {/* Metadata & Permissions */}
          <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 space-y-5">
            <Label className="text-lg font-bold">Metadata & Licentie</Label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-semibold">Standaard Genre</Label>
                <Select value={globalGenre} onValueChange={setGlobalGenre}>
                  <SelectTrigger className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {genres.map((g) => (
                      <SelectItem key={g} value={g}>
                        {g}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs font-semibold">Licentie</Label>
                <Select
                  value={globalLicense}
                  onValueChange={(val) => setGlobalLicense(val as Track['license'])}
                >
                  <SelectTrigger className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {licenses.map((lic) => (
                      <SelectItem key={lic.value} value={lic.value}>
                        {lic.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-2">
                {isPrivate ? <Lock className="w-4 h-4 text-muted-foreground" /> : <Globe className="w-4 h-4 text-muted-foreground" />}
                <span className="text-sm font-medium">Privé Release (alleen voor jou zichtbaar)</span>
              </div>
              <Switch checked={isPrivate} onCheckedChange={setIsPrivate} />
            </div>
          </div>

          {/* Credits & Summary Box */}
          <div className="bg-gradient-to-br from-orange-500/10 via-card to-card border border-orange-500/30 rounded-2xl p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold text-orange-400 uppercase tracking-wider">Overzicht Upload</p>
                <h3 className="text-lg font-bold mt-0.5">
                  {totalTracksCount} track(s) geselecteerd
                  {createCollection && ` • ${collectionType === 'album' ? 'Album' : 'Afspeellijst'}`}
                </h3>
                <div className="text-xs text-muted-foreground mt-1 space-y-0.5">
                  <p>• Basis upload ({totalTracksCount}x): {baseUploadCredits.toLocaleString()} credits (€{totalTracksCount * 5},-)</p>
                  {masteringCredits > 0 && (
                    <p>• Studio Mix & Mastering: +{masteringCredits.toLocaleString()} credits</p>
                  )}
                  <p>• Totaal benodigd: <strong className="text-foreground">{totalCreditsRequired.toLocaleString()} credits</strong></p>
                </div>
              </div>

              <div className="text-right sm:border-l sm:border-border sm:pl-6">
                <p className="text-xs text-muted-foreground">Jouw Saldo</p>
                <p className="text-2xl font-extrabold text-orange-400 flex items-center justify-end gap-1.5">
                  <Coins className="w-5 h-5" />
                  {userCurrentCredits.toLocaleString()}
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Resterend na upload: {(userCurrentCredits - totalCreditsRequired).toLocaleString()}
                </p>
              </div>
            </div>

            {/* Error or submit button */}
            <div className="mt-6 pt-4 border-t border-border/50 flex flex-col sm:flex-row items-center justify-between gap-4">
              {!hasSufficientCredits ? (
                <div className="w-full flex items-center justify-between gap-4">
                  <span className="text-xs text-red-400 font-semibold">
                    Te weinig credits! Je hebt {(totalCreditsRequired - userCurrentCredits).toLocaleString()} credits extra nodig.
                  </span>
                  <Button asChild className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl">
                    <Link to="/pricing">Credits Opwaarderen</Link>
                  </Button>
                </div>
              ) : isGebruiker ? (
                <div className="w-full flex items-center justify-between gap-4">
                  <span className="text-xs text-red-400 font-semibold">
                    Gebruikers mogen niet uploaden.
                  </span>
                  <Button asChild className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl">
                    <Link to="/pricing">Upgrade naar Artiest (€50,-)</Link>
                  </Button>
                </div>
              ) : (
                <Button
                  type="submit"
                  disabled={isUploading || trackQueue.length === 0}
                  className="w-full sm:w-auto ml-auto px-8 h-12 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-base shadow-lg shadow-orange-500/25"
                >
                  {isUploading ? (
                    `Uploaden (${uploadProgress}%)...`
                  ) : (
                    `Publiceer ${totalTracksCount} Track${totalTracksCount === 1 ? '' : 's'} (${totalCreditsRequired.toLocaleString()} credits)`
                  )}
                </Button>
              )}
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}
