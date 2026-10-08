import { useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { UploadCloud, X, Music, Image as ImageIcon } from 'lucide-react';
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
import { toast } from 'sonner';
import { doc, setDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '@/lib/firebase';
import type { Track } from '@/types';

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
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [audioFile, setAudioFile] = useState<File | null>(null);
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

  const handleAudioDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && (file.type.startsWith('audio/') || file.name.match(/\.(mp3|wav|flac|m4a)$/i))) {
      setAudioFile(file);
      if (!formData.title) {
        setFormData(prev => ({ ...prev, title: file.name.replace(/\.[^/.]+$/, '') }));
      }
    } else {
      toast.error('Please upload a valid audio file (MP3, WAV, FLAC, or M4A)');
    }
  }, [formData.title]);

  const handleAudioSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAudioFile(file);
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

    if (!audioFile) {
      toast.error('Please select an audio file');
      return;
    }

    if (!formData.title.trim()) {
      toast.error('Please enter a title');
      return;
    }

    if (!formData.genre) {
      toast.error('Please select a genre');
      return;
    }

    setIsUploading(true);

    // Simulate upload progress
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 95) {
          clearInterval(progressInterval);
          return 95;
        }
        return prev + 5;
      });
    }, 200);

    // Simulate upload completion and persist to Firestore
    setTimeout(async () => {
      clearInterval(progressInterval);
      setUploadProgress(100);

      if (user) {
        const trackId = `track_${Date.now()}`;
        const newTrack: Track = {
          id: trackId,
          userId: user.id,
          title: formData.title,
          description: formData.description,
          genre: formData.genre,
          tags: formData.tags ? formData.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
          duration: 180,
          durationFormatted: '3:00',
          waveformData: Array.from({ length: 40 }, () => Math.floor(Math.random() * 80) + 20),
          audioUrl: 'https://cdn.freesound.org/previews/612/612608_11861866-lq.mp3',
          coverUrl: coverImage || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500&h=500&fit=crop',
          isPrivate: formData.isPrivate,
          isExplicit: formData.isExplicit,
          license: formData.license as Track['license'],
          playsCount: 0,
          likesCount: 0,
          repostsCount: 0,
          commentsCount: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        try {
          await setDoc(doc(db, 'tracks', trackId), newTrack);
        } catch (err) {
          handleFirestoreError(err, OperationType.CREATE, `tracks/${trackId}`);
        }
      }

      toast.success('Track uploaded successfully!');
      navigate(`/user/${user?.id}`);
    }, 2000);
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
              <Label className="text-base">Audio File *</Label>
              {!audioFile ? (
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleAudioDrop}
                  className="mt-2 border-2 border-dashed border-border rounded-xl p-12 text-center hover:border-orange-500/50 transition-colors cursor-pointer"
                >
                  <input
                    type="file"
                    accept="audio/*,.mp3,.wav,.flac,.m4a"
                    onChange={handleAudioSelect}
                    className="hidden"
                    id="audio-upload"
                  />
                  <label htmlFor="audio-upload" className="cursor-pointer">
                    <UploadCloud className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-lg font-medium">Drag and drop your audio file</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      or click to browse (MP3, WAV, FLAC, M4A)
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">Max file size: 200MB</p>
                  </label>
                </div>
              ) : (
                <div className="mt-2 bg-card rounded-xl p-4 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-orange-500/20 flex items-center justify-center">
                    <Music className="w-6 h-6 text-orange-500" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{audioFile.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(audioFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAudioFile(null)}
                    className="p-2 hover:bg-secondary rounded-full transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              )}
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
