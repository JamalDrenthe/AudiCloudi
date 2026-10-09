import { useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { UploadCloud, X, Music, Image as ImageIcon, Sparkles, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Navbar } from '@/components/Navbar';
import { AudioPlayer } from '@/components/AudioPlayer';
import { useAuth } from '@/context/AuthContext';
import { useTracks } from '@/context/TrackContext';
import { saveLocalAudioFile } from '@/lib/audioStorage';
import { generateTrackAudio } from '@/lib/audioSynthesizer';
import { toast } from 'sonner';
import type { Track } from '@/types';

const sampleDemoTracks = [
  {
    name: 'Neon Cyber Synth',
    genre: 'electronic',
    duration: 168,
    url: '',
    cover: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=500&h=500&fit=crop',
    tags: 'synthwave, electronic, cyberpunk',
  },
  {
    name: 'Sunset Lo-Fi Chill',
    genre: 'hip hop',
    duration: 145,
    url: '',
    cover: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=500&h=500&fit=crop',
    tags: 'lofi, chill, hiphop',
  },
  {
    name: 'Deep Space Ambient',
    genre: 'ambient',
    duration: 210,
    url: '',
    cover: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&h=500&fit=crop',
    tags: 'ambient, space, relaxing',
  },
  {
    name: 'Summer House Anthem',
    genre: 'pop',
    duration: 195,
    url: '',
    cover: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=500&h=500&fit=crop',
    tags: 'house, summer, dance',
  },
];

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
  const { user, isAuthenticated } = useAuth();
  const { uploadTrack } = useTracks();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [selectedDemoTrack, setSelectedDemoTrack] = useState<typeof sampleDemoTracks[0] | null>(null);
  const [audioDuration, setAudioDuration] = useState<number>(180);
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    genre: '',
    tags: '',
    isPrivate: false,
    isExplicit: false,
    license: 'all-rights-reserved',
  });

  const handleSelectDemoTrack = (sample: typeof sampleDemoTracks[0]) => {
    setSelectedDemoTrack(sample);
    setAudioFile(null);
    setAudioDuration(sample.duration);
    setCoverImage(sample.cover);
    setFormData(prev => ({
      ...prev,
      title: sample.name,
      genre: sample.genre,
      tags: sample.tags,
      description: `Geproduceerd met AudiCloudi. Genre: ${sample.genre}.`,
    }));
    toast.success(`Demotrack "${sample.name}" geselecteerd!`);
  };

  const handleAudioDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && (file.type.startsWith('audio/') || file.name.match(/\.(mp3|wav|flac|m4a)$/i))) {
      setAudioFile(file);
      setSelectedDemoTrack(null);
      try {
        const audioTest = new Audio(URL.createObjectURL(file));
        audioTest.onloadedmetadata = () => {
          if (audioTest.duration && !isNaN(audioTest.duration)) {
            setAudioDuration(Math.round(audioTest.duration));
          }
        };
      } catch {
        // Fallback
      }
      if (!formData.title) {
        setFormData(prev => ({ ...prev, title: file.name.replace(/\.[^/.]+$/, '') }));
      }
    } else {
      toast.error('Upload een geldig audiobestand (MP3, WAV, FLAC of M4A)');
    }
  }, [formData.title]);

  const handleAudioSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAudioFile(file);
      setSelectedDemoTrack(null);
      try {
        const audioTest = new Audio(URL.createObjectURL(file));
        audioTest.onloadedmetadata = () => {
          if (audioTest.duration && !isNaN(audioTest.duration)) {
            setAudioDuration(Math.round(audioTest.duration));
          }
        };
      } catch {
        // Fallback
      }
      if (!formData.title) {
        setFormData(prev => ({ ...prev, title: file.name.replace(/\.[^/.]+$/, '') }));
      }
    }
  };

  const handleCoverSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!audioFile && !selectedDemoTrack) {
      toast.error('Selecteer eerst een audiobestand of kies een demotrack');
      return;
    }

    if (!formData.title.trim()) {
      toast.error('Vul een titel in voor het nummer');
      return;
    }

    if (!formData.genre) {
      toast.error('Selecteer een genre');
      return;
    }

    setIsUploading(true);

    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 90) return 90;
        return prev + 15;
      });
    }, 150);

    try {
      const dur = audioDuration || (selectedDemoTrack ? selectedDemoTrack.duration : 180);
      const mins = Math.floor(dur / 60);
      const secs = Math.floor(dur % 60);
      const durationFormatted = `${mins}:${secs.toString().padStart(2, '0')}`;

      const trackId = `track_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

      if (audioFile) {
        // Save to audio storage immediately so memory cache and IndexedDB are hot
        await saveLocalAudioFile(trackId, audioFile);
      }

      const createdTrack = await uploadTrack({
        id: trackId,
        userId: user?.id || 'admin_jamal',
        title: formData.title.trim(),
        description: formData.description.trim(),
        genre: formData.genre,
        tags: formData.tags ? formData.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        duration: dur,
        durationFormatted,
        waveformData: Array.from({ length: 40 }, () => Math.floor(Math.random() * 80) + 20),
        audioUrl: '',
        coverUrl: coverImage || selectedDemoTrack?.cover || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500&h=500&fit=crop',
        isPrivate: formData.isPrivate,
        isExplicit: formData.isExplicit,
        license: formData.license as Track['license'],
      });

      if (!audioFile) {
        try {
          const generatedUrl = await generateTrackAudio(createdTrack);
          if (generatedUrl) {
            const res = await fetch(generatedUrl);
            const blob = await res.blob();
            await saveLocalAudioFile(createdTrack.id, blob);
          }
        } catch {
          // Fallback to on-demand generation
        }
      }

      clearInterval(progressInterval);
      setUploadProgress(100);

      toast.success(`Nummer "${createdTrack.title}" succesvol opgeslagen in Firestore!`);
      navigate('/library?tab=uploads');
    } catch (err) {
      clearInterval(progressInterval);
      setIsUploading(false);
      toast.error('Fout bij het uploaden van het nummer');
      console.error(err);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-24 px-4">
          <div className="max-w-md mx-auto text-center">
            <h1 className="text-2xl font-bold">Sign in to upload</h1>
            <p className="text-muted-foreground mt-2">
              You need to be signed in to upload tracks.
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
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">Upload Your Track</h1>
          <p className="text-muted-foreground mb-8">
            Share your music with the world. All uploads are free!
          </p>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Audio Upload */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <Label className="text-base font-semibold">Audiobestand of Demotrack *</Label>
                <span className="text-xs text-muted-foreground">Opgeslagen in Firestore</span>
              </div>

              {!audioFile && !selectedDemoTrack ? (
                <div className="space-y-4">
                  <div
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleAudioDrop}
                    className="border-2 border-dashed border-border rounded-xl p-10 text-center hover:border-orange-500/50 hover:bg-orange-500/5 transition-all cursor-pointer"
                  >
                    <input
                      type="file"
                      accept="audio/*,.mp3,.wav,.flac,.m4a"
                      onChange={handleAudioSelect}
                      className="hidden"
                      id="audio-upload"
                    />
                    <label htmlFor="audio-upload" className="cursor-pointer">
                      <UploadCloud className="w-12 h-12 mx-auto text-orange-500 mb-3" />
                      <p className="text-lg font-medium">Sleep je eigen audiobestand hierheen</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        of klik om te bladeren (MP3, WAV, FLAC, M4A)
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">Geen limiet • Direct afspeelbaar</p>
                    </label>
                  </div>

                  {/* Preset Demo Tracks Quick Pick */}
                  <div className="bg-card/50 border border-border/80 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Sparkles className="w-4 h-4 text-orange-500" />
                      <span className="text-sm font-semibold">Of kies direct een demotrack om te testen:</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {sampleDemoTracks.map((sample) => (
                        <button
                          key={sample.name}
                          type="button"
                          onClick={() => handleSelectDemoTrack(sample)}
                          className="flex items-center gap-3 p-2.5 rounded-lg border border-border bg-background hover:border-orange-500/50 hover:bg-orange-500/5 transition-all text-left group"
                        >
                          <img
                            src={sample.cover}
                            alt={sample.name}
                            className="w-10 h-10 rounded-md object-cover flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate group-hover:text-orange-500 transition-colors">
                              {sample.name}
                            </p>
                            <p className="text-xs text-muted-foreground capitalize">
                              {sample.genre} • {Math.floor(sample.duration / 60)}:{(sample.duration % 60).toString().padStart(2, '0')}
                            </p>
                          </div>
                          <span className="text-xs text-orange-500 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                            Kies
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : audioFile ? (
                <div className="mt-2 bg-card border border-border rounded-xl p-4 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-orange-500/20 flex items-center justify-center flex-shrink-0">
                    <Music className="w-6 h-6 text-orange-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded font-medium">
                        Eigen bestand geselecteerd
                      </span>
                    </div>
                    <p className="font-medium text-sm sm:text-base truncate mt-0.5">{audioFile.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(audioFile.size / 1024 / 1024).toFixed(2)} MB • {Math.floor(audioDuration / 60)}:{(audioDuration % 60).toString().padStart(2, '0')} min
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAudioFile(null)}
                    className="p-2 hover:bg-secondary rounded-full transition-colors"
                    title="Ander bestand kiezen"
                  >
                    <X className="w-5 h-5 text-muted-foreground" />
                  </button>
                </div>
              ) : selectedDemoTrack ? (
                <div className="mt-2 bg-card border border-orange-500/40 rounded-xl p-4 flex items-center gap-4">
                  <img
                    src={selectedDemoTrack.cover}
                    alt={selectedDemoTrack.name}
                    className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs bg-orange-500/10 text-orange-500 px-2 py-0.5 rounded font-medium flex items-center gap-1">
                        <Check className="w-3 h-3" /> Demotrack actief
                      </span>
                    </div>
                    <p className="font-medium text-sm sm:text-base truncate mt-0.5">{selectedDemoTrack.name}</p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {selectedDemoTrack.genre} • {Math.floor(selectedDemoTrack.duration / 60)}:{(selectedDemoTrack.duration % 60).toString().padStart(2, '0')} min
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedDemoTrack(null)}
                    className="p-2 hover:bg-secondary rounded-full transition-colors"
                    title="Verwijderen"
                  >
                    <X className="w-5 h-5 text-muted-foreground" />
                  </button>
                </div>
              ) : null}
            </div>

            {/* Cover Art */}
            <div>
              <Label className="text-base">Cover Art</Label>
              <div className="mt-2 flex items-center gap-4">
                <div className="w-32 h-32 rounded-xl bg-secondary flex items-center justify-center overflow-hidden">
                  {coverImage ? (
                    <img src={coverImage} alt="Cover" className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon className="w-8 h-8 text-muted-foreground" />
                  )}
                </div>
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleCoverSelect}
                    className="hidden"
                    id="cover-upload"
                  />
                  <Label htmlFor="cover-upload" className="cursor-pointer">
                    <Button type="button" variant="outline" className="rounded-full">
                      {coverImage ? 'Change Cover' : 'Upload Cover'}
                    </Button>
                  </Label>
                  <p className="text-sm text-muted-foreground mt-2">
                    Recommended: 1400x1400px JPG or PNG
                  </p>
                </div>
              </div>
            </div>

            {/* Track Info */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Enter track title"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Tell us about your track..."
                  className="mt-1 min-h-[100px]"
                />
              </div>

              <div>
                <Label htmlFor="genre">Genre *</Label>
                <Select
                  value={formData.genre}
                  onValueChange={(value) => setFormData({ ...formData, genre: value })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select a genre" />
                  </SelectTrigger>
                  <SelectContent>
                    {genres.map((genre) => (
                      <SelectItem key={genre} value={genre.toLowerCase()}>
                        {genre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="tags">Tags</Label>
                <Input
                  id="tags"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  placeholder="Add tags separated by commas (e.g., electronic, ambient, chill)"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="license">License</Label>
                <Select
                  value={formData.license}
                  onValueChange={(value) => setFormData({ ...formData, license: value })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {licenses.map((license) => (
                      <SelectItem key={license.value} value={license.value}>
                        {license.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Options */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="private" className="text-base">Private Track</Label>
                  <p className="text-sm text-muted-foreground">
                    Only you can see and download this track
                  </p>
                </div>
                <Switch
                  id="private"
                  checked={formData.isPrivate}
                  onCheckedChange={(checked) => setFormData({ ...formData, isPrivate: checked })}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="explicit" className="text-base">Explicit Content</Label>
                  <p className="text-sm text-muted-foreground">
                    This track contains explicit content
                  </p>
                </div>
                <Switch
                  id="explicit"
                  checked={formData.isExplicit}
                  onCheckedChange={(checked) => setFormData({ ...formData, isExplicit: checked })}
                />
              </div>
            </div>

            {/* Submit */}
            <div className="pt-4">
              {isUploading ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Uploading...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-orange-500 transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-4">
                  <Button
                    type="submit"
                    className="rounded-full bg-orange-500 hover:bg-orange-600 px-8"
                  >
                    Upload Track
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => navigate(-1)}
                  >
                    Cancel
                  </Button>
                </div>
              )}
            </div>
          </form>
        </div>
      </main>
      <AudioPlayer />
    </div>
  );
}
