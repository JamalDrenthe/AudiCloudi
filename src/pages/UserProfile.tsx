import { useState, useRef, useMemo, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Play,
  UserPlus,
  UserCheck,
  Share2,
  MoreHorizontal,
  Shuffle,
  Camera,
  Image as ImageIcon,
  MessageSquare,
  Headphones,
  Heart,
  Repeat2,
  Edit3,
  Globe,
  Building2,
  Sparkles,
  CheckCircle2,
  Music2,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Navbar } from '@/components/Navbar';
import { AudioPlayer } from '@/components/AudioPlayer';
import { TrackCover } from '@/components/TrackCover';
import { ShareTrackModal } from '@/components/ShareTrackModal';
import { DirectMessageModal } from '@/components/DirectMessageModal';
import { useAuth } from '@/context/AuthContext';
import { useTracks } from '@/context/TrackContext';
import { usePlayer } from '@/context/PlayerContext';
import { usePlaylist } from '@/context/PlaylistContext';
import { toast } from 'sonner';
import { getUserById, getArtistsByLabel } from '@/data/mockData';
import type { Track, UserSocials, User } from '@/types';

// Helper to compress image before persisting
function compressImage(file: File, maxWidth: number, maxHeight: number, quality = 0.8): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(e.target?.result as string);
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function TrackRow({
  track,
  index,
  onShare,
}: {
  track: Track;
  index: number;
  onShare: (track: Track) => void;
}) {
  const { playTrack, currentTrack, isPlaying } = usePlayer();
  const { toggleLike, isLiked, toggleRepost, isReposted, isAuthenticated } = useAuth();
  const isCurrentTrack = currentTrack?.id === track.id;
  const liked = isLiked(track.id);
  const reposted = isReposted(track.id);

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      toast.error('Log eerst in om te liken.');
      return;
    }
    const res = toggleLike(track.id);
    if (res) toast.success(`"${track.title}" toegevoegd aan je likes!`);
    else toast.info(`Like verwijderd van "${track.title}"`);
  };

  const handleRepost = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isAuthenticated) {
      toast.error('Log eerst in om te herplaatsen.');
      return;
    }
    const res = toggleRepost(track.id);
    if (res) toast.success(`"${track.title}" herplaatst op je profiel!`);
    else toast.info(`Herplaatsing verwijderd`);
  };

  return (
    <div
      className={`flex items-center gap-3 sm:gap-4 p-3 rounded-xl hover:bg-secondary/40 transition-colors group ${
        isCurrentTrack ? 'bg-orange-500/10' : ''
      }`}
    >
      <span className="w-6 text-center text-xs sm:text-sm text-muted-foreground shrink-0">{index + 1}</span>
      <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 bg-muted relative group">
        <TrackCover track={track} />
        <button
          onClick={() => playTrack(track)}
          className={`absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity ${
            isCurrentTrack && isPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
          }`}
        >
          {isCurrentTrack && isPlaying ? (
            <div className="flex gap-0.5">
              <span className="w-0.5 h-3 bg-white animate-bounce" />
              <span className="w-0.5 h-3 bg-white animate-bounce" style={{ animationDelay: '0.1s' }} />
              <span className="w-0.5 h-3 bg-white animate-bounce" style={{ animationDelay: '0.2s' }} />
            </div>
          ) : (
            <Play className="w-4 h-4 text-white ml-0.5 fill-current" />
          )}
        </button>
      </div>

      <div className="flex-1 min-w-0">
        <Link
          to={`/track/${track.id}`}
          className={`font-semibold text-sm truncate block hover:underline ${
            isCurrentTrack ? 'text-orange-500' : 'text-foreground'
          }`}
        >
          {track.title}
        </Link>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{track.genre}</span>
          <span>•</span>
          <span className="flex items-center gap-1 font-medium text-foreground/80">
            <Headphones className="w-3 h-3 text-orange-400" />
            {(track.playsCount || 0).toLocaleString()} plays
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={handleLike}
          className={`p-2 rounded-full hover:bg-secondary transition-colors ${
            liked ? 'text-rose-500' : 'text-muted-foreground hover:text-foreground'
          }`}
          title={liked ? 'Geliked' : 'Like'}
        >
          <Heart className="w-4 h-4" fill={liked ? 'currentColor' : 'none'} />
        </button>

        <button
          onClick={handleRepost}
          className={`p-2 rounded-full hover:bg-secondary transition-colors ${
            reposted ? 'text-emerald-400' : 'text-muted-foreground hover:text-foreground'
          }`}
          title={reposted ? 'Herplaatst' : 'Herplaatsen'}
        >
          <Repeat2 className="w-4 h-4" />
        </button>

        <button
          onClick={() => onShare(track)}
          className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
          title="Deel naar socials"
        >
          <Share2 className="w-4 h-4" />
        </button>

        <span className="text-xs text-muted-foreground w-12 text-right hidden sm:inline">
          {track.durationFormatted}
        </span>
      </div>
    </div>
  );
}

export function UserProfile({ defaultUserId }: { defaultUserId?: string } = {}) {
  const { id: paramId } = useParams<{ id: string }>();
  const id = paramId || defaultUserId;
  const {
    user: currentUser,
    isAuthenticated,
    followUser,
    unfollowUser,
    isFollowing: checkIsFollowing,
    updateProfile,
    likedTrackIds,
    repostedTrackIds,
  } = useAuth();
  const { tracks } = useTracks();
  const { playQueue, shufflePlayQueue } = usePlayer();
  const { playlists } = usePlaylist();

  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [selectedShareTrack, setSelectedShareTrack] = useState<Track | null>(null);
  const [isDMOpen, setIsDMOpen] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);

  // Edit form state
  const [editDisplayName, setEditDisplayName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editSocials, setEditSocials] = useState<UserSocials>({});

  const bannerInputRef = useRef<HTMLInputElement | null>(null);
  const avatarInputRef = useRef<HTMLInputElement | null>(null);

  const matchedUser = id ? getUserById(id) : undefined;
  const isOwnProfile =
    !id ||
    currentUser?.id === id ||
    currentUser?.username === id ||
    (currentUser?.id === 'admin_jamal' && (id === 'jamal-drenthe' || id === 'admin_jamal' || id === 'js_drenthe'));
  const rawUser = isOwnProfile && currentUser ? { ...(matchedUser || {}), ...currentUser } : (matchedUser || (!id ? currentUser : undefined));

  // Fallback defaults for missing user fields
  const user = rawUser
    ? {
        ...rawUser,
        bannerUrl:
          rawUser.bannerUrl ||
          'https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=1400&h=450&fit=crop',
        avatarUrl:
          rawUser.avatarUrl ||
          `https://api.dicebear.com/7.x/avataaars/svg?seed=${rawUser.id}`,
        socials: rawUser.socials || {
          tiktok: '',
          youtube: '',
          instagram: '',
          x: '',
        },
      }
    : undefined;

  const isLabel = user?.plan === 'label' || user?.id === 'zheavenzy';

  const [activeTab, setActiveTab] = useState(isLabel ? 'roster' : 'tracks');

  // Sync activeTab when user changes
  useEffect(() => {
    if (isLabel) {
      setActiveTab('roster');
    } else {
      setActiveTab('tracks');
    }
  }, [id, isLabel]);

  // Signed artists list for labels
  const signedArtists = useMemo<User[]>(() => {
    if (!user || !isLabel) return [];
    if (user.signedArtistIds && user.signedArtistIds.length > 0) {
      return user.signedArtistIds.map((aid) => getUserById(aid)).filter((u): u is User => Boolean(u));
    }
    return getArtistsByLabel(user.id);
  }, [user, isLabel]);

  const isFollowing = user ? checkIsFollowing(user.id) : false;

  // Real-time follower count calculation
  const followersCount = useMemo(() => {
    if (!user) return 0;
    const base = user.followersCount || 0;
    if (isOwnProfile) return base;
    return isFollowing ? base + 1 : base;
  }, [user, isOwnProfile, isFollowing]);

  // Tracks for this user (or all label releases if viewing a record label)
  const userTracks = useMemo<Track[]>(() => {
    if (!user) return [];
    if (isLabel) {
      const signedIds = new Set([user.id, ...(user.signedArtistIds || []), ...signedArtists.map((a) => a.id)]);
      return tracks.filter((t: Track) => signedIds.has(t.userId));
    }
    return tracks.filter((t: Track) => t.userId === user.id);
  }, [tracks, user, isLabel, signedArtists]);

  const userPlaylists = useMemo(() => {
    if (!user) return [];
    return playlists.filter((p) => p.userId === user.id);
  }, [playlists, user]);

  // Public Likes tracks
  const likedTracks = useMemo<Track[]>(() => {
    if (!user) return [];
    const targetLikeIds = isOwnProfile ? likedTrackIds : (user.likes || ['track_zheavenzy_cypher', 'track_jamal_1', '1', '2']);
    return tracks.filter((t: Track) => targetLikeIds.includes(t.id));
  }, [isOwnProfile, likedTrackIds, user, tracks]);

  // Public Reposts tracks
  const repostedTracks = useMemo<Track[]>(() => {
    if (!user) return [];
    const targetRepostIds = isOwnProfile ? repostedTrackIds : (user.reposts || ['track_zheavenzy_cypher', '3']);
    return tracks.filter((t: Track) => targetRepostIds.includes(t.id));
  }, [isOwnProfile, repostedTrackIds, user, tracks]);

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-24 px-4">
          <div className="max-w-7xl mx-auto text-center">
            <h1 className="text-2xl font-bold">Gebruiker niet gevonden</h1>
            <p className="text-muted-foreground mt-2">
              Het profiel dat je zoekt bestaat niet of is niet beschikbaar.
            </p>
            <Button asChild className="mt-4 rounded-full">
              <Link to="/">Naar Home</Link>
            </Button>
          </div>
        </main>
      </div>
    );
  }

  const handleFollow = () => {
    if (!isAuthenticated) {
      toast.error('Log eerst in om deze artiest te volgen.');
      return;
    }
    if (isFollowing) {
      unfollowUser(user.id);
      toast.success(`${user.displayName} ontvolgd`);
    } else {
      followUser(user.id);
      toast.success(`${user.displayName} gevolgd!`);
    }
  };

  const handlePlayAll = () => {
    if (userTracks.length > 0) {
      playQueue(userTracks);
      toast.success(`Alle tracks van ${user.displayName} worden afgespeeld`);
    }
  };

  const handleShuffleTracks = () => {
    if (userTracks.length > 0) {
      shufflePlayQueue(userTracks);
      toast.success(`Tracks van ${user.displayName} geshuffeld en gestart!`);
    }
  };

  // Banner image upload
  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      toast.loading('Banner uploaden en optimaliseren...');
      const compressedDataUrl = await compressImage(file, 1400, 500, 0.85);
      await updateProfile({ bannerUrl: compressedDataUrl });
      toast.dismiss();
      toast.success('Horizontale banner succesvol bijgewerkt!');
    } catch {
      toast.dismiss();
      toast.error('Fout bij het uploaden van de banner');
    }
  };

  // Avatar image upload
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      toast.loading('Profielfoto uploaden...');
      const compressedDataUrl = await compressImage(file, 400, 400, 0.85);
      await updateProfile({ avatarUrl: compressedDataUrl });
      toast.dismiss();
      toast.success('Profielfoto succesvol aangepast!');
    } catch {
      toast.dismiss();
      toast.error('Fout bij het uploaden van profielfoto');
    }
  };

  // Open Edit Profile modal
  const handleOpenEditModal = () => {
    setEditDisplayName(user.displayName || '');
    setEditBio(user.bio || '');
    setEditSocials(user.socials || {});
    setIsEditProfileOpen(true);
  };

  // Save profile edits
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateProfile({
        displayName: editDisplayName.trim() || user.displayName,
        bio: editBio.trim(),
        socials: editSocials,
      });
      setIsEditProfileOpen(false);
      toast.success('Profiel succesvol opgeslagen!');
    } catch {
      toast.error('Fout bij opslaan van profiel');
    }
  };

  return (
    <div className="min-h-screen bg-background pb-32">
      <Navbar />

      <main className="pt-16">
        {/* HORIZONTAL BANNER (Uploadable) */}
        <div className="relative h-48 sm:h-64 md:h-80 w-full overflow-hidden group bg-secondary">
          <img
            src={user.bannerUrl}
            alt="Profile Banner"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-black/30 to-black/20" />

          {/* Change Banner Button (Own Profile) */}
          {isOwnProfile && (
            <>
              <input
                type="file"
                ref={bannerInputRef}
                onChange={handleBannerUpload}
                accept="image/*"
                className="hidden"
              />
              <button
                onClick={() => bannerInputRef.current?.click()}
                className="absolute top-4 right-4 bg-black/60 hover:bg-black/80 backdrop-blur-md text-white text-xs font-semibold px-3 py-1.5 rounded-full border border-white/20 flex items-center gap-1.5 transition-all shadow-lg hover:scale-105"
              >
                <ImageIcon className="w-3.5 h-3.5 text-orange-400" />
                <span>Horizontale Banner Aanpassen</span>
              </button>
            </>
          )}
        </div>

        {/* PROFILE HEADER & INFO */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative -mt-20 sm:-mt-24 mb-8">
            <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-end gap-5">
                {/* AVATAR (Uploadable) */}
                <div className="relative group shrink-0">
                  <Avatar className="w-32 h-32 sm:w-40 sm:h-40 ring-4 ring-background shadow-2xl bg-secondary">
                    <AvatarImage src={user.avatarUrl} alt={user.displayName} />
                    <AvatarFallback className="text-4xl">{user.displayName[0]}</AvatarFallback>
                  </Avatar>

                  {/* Change Avatar Overlay */}
                  {isOwnProfile && (
                    <>
                      <input
                        type="file"
                        ref={avatarInputRef}
                        onChange={handleAvatarUpload}
                        accept="image/*"
                        className="hidden"
                      />
                      <button
                        onClick={() => avatarInputRef.current?.click()}
                        className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-xs font-semibold"
                        title="Wijzig profielfoto"
                      >
                        <Camera className="w-6 h-6 mb-1 text-orange-400" />
                        <span>Foto Wijzigen</span>
                      </button>
                    </>
                  )}
                </div>

                {/* NAME & BIO */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-2xl sm:text-3xl font-black text-white">{user.displayName}</h1>
                    {user.role === 'admin' && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/40">
                        Admin
                      </span>
                    )}
                    {isLabel ? (
                      <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-500/25 to-orange-500/25 text-amber-300 border border-amber-500/40 flex items-center gap-1 shadow-sm">
                        <Building2 className="w-3 h-3 text-amber-400" />
                        Officiëel Record Label
                      </span>
                    ) : user.plan === 'artiest' ? (
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-orange-500/15 text-orange-400 border border-orange-500/30 flex items-center gap-1">
                        <Music2 className="w-3 h-3" />
                        Geverifieerde Artiest
                      </span>
                    ) : user.plan ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-secondary text-muted-foreground capitalize">
                        {user.plan}
                      </span>
                    ) : null}
                    {user.verified && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Geverifieerd
                      </span>
                    )}
                  </div>

                  {/* Subline: username + label affiliation + genre + location */}
                  <div className="flex items-center gap-2 flex-wrap text-sm text-muted-foreground">
                    <span>@{user.username}</span>
                    {user.labelName && !isLabel && (
                      <>
                        <span>•</span>
                        <Link
                          to={`/label/${user.labelId || 'zheavenzy'}`}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-orange-400 hover:text-orange-300 hover:underline bg-orange-500/10 px-2.5 py-0.5 rounded-full border border-orange-500/25 transition-all hover:scale-105"
                          title="Bekijk het officiële Zheavenzy label profiel"
                        >
                          <Building2 className="w-3 h-3 text-orange-400" />
                          <span>Getekend bij {user.labelName} Label</span>
                        </Link>
                      </>
                    )}
                    {user.genre && (
                      <>
                        <span>•</span>
                        <span className="text-xs text-foreground/80 font-medium">{user.genre}</span>
                      </>
                    )}
                    {user.location && (
                      <>
                        <span>•</span>
                        <span className="text-xs text-muted-foreground">📍 {user.location}</span>
                      </>
                    )}
                  </div>

                  {user.bio ? (
                    <p className="mt-2 text-xs sm:text-sm text-foreground/90 max-w-xl leading-relaxed whitespace-pre-wrap">
                      {user.bio}
                    </p>
                  ) : (
                    isOwnProfile && (
                      <p className="text-xs text-muted-foreground italic">
                        Voeg een bio toe in profiel bewerken om fans over jezelf te vertellen.
                      </p>
                    )
                  )}

                  {/* SOCIAL MEDIA BUTTONS (TikTok, YouTube, Instagram, X) */}
                  <div className="flex items-center gap-2 pt-2 flex-wrap">
                    {/* TikTok */}
                    {user.socials?.tiktok ? (
                      <a
                        href={
                          user.socials.tiktok.startsWith('http')
                            ? user.socials.tiktok
                            : `https://www.tiktok.com/@${user.socials.tiktok.replace('@', '')}`
                        }
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary hover:bg-black text-xs font-medium border border-border/80 transition-all hover:border-pink-500 hover:text-pink-400"
                      >
                        <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                          <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.24 1.07-.14 1.61.24 1.64 1.82 2.89 3.48 2.8 1.5-.03 2.77-1.14 2.95-2.62.06-.51.06-1.03.06-1.54.01-5.69 0-11.39 0-17.08z"/>
                        </svg>
                        <span>TikTok</span>
                      </a>
                    ) : null}

                    {/* YouTube */}
                    {user.socials?.youtube ? (
                      <a
                        href={
                          user.socials.youtube.startsWith('http')
                            ? user.socials.youtube
                            : `https://www.youtube.com/@${user.socials.youtube.replace('@', '')}`
                        }
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary hover:bg-red-600/20 text-xs font-medium border border-border/80 transition-all hover:border-red-500 hover:text-red-400"
                      >
                        <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                        </svg>
                        <span>YouTube</span>
                      </a>
                    ) : null}

                    {/* Instagram */}
                    {user.socials?.instagram ? (
                      <a
                        href={
                          user.socials.instagram.startsWith('http')
                            ? user.socials.instagram
                            : `https://www.instagram.com/${user.socials.instagram.replace('@', '')}`
                        }
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary hover:bg-pink-600/20 text-xs font-medium border border-border/80 transition-all hover:border-pink-500 hover:text-pink-400"
                      >
                        <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                        </svg>
                        <span>Instagram</span>
                      </a>
                    ) : null}

                    {/* X (Twitter) */}
                    {user.socials?.x ? (
                      <a
                        href={
                          user.socials.x.startsWith('http')
                            ? user.socials.x
                            : `https://x.com/${user.socials.x.replace('@', '')}`
                        }
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary hover:bg-sky-500/20 text-xs font-medium border border-border/80 transition-all hover:border-sky-500 hover:text-sky-400"
                      >
                        <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                        </svg>
                        <span>X</span>
                      </a>
                    ) : null}

                    {/* Edit socials shortcut */}
                    {isOwnProfile && (
                      <button
                        onClick={handleOpenEditModal}
                        className="text-xs text-orange-400 hover:text-orange-300 flex items-center gap-1 px-2.5 py-1 rounded-full bg-orange-500/10 border border-orange-500/20"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>Socials Koppelen</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* ACTION BUTTONS (Follow, Direct Message, Share, Edit) */}
              <div className="flex items-center gap-2.5 flex-wrap">
                {/* Follow Button */}
                {!isOwnProfile && (
                  <Button
                    className={`rounded-full px-5 ${
                      isFollowing
                        ? 'bg-secondary hover:bg-secondary/80 text-foreground'
                        : 'bg-orange-500 hover:bg-orange-600 text-white font-semibold'
                    }`}
                    onClick={handleFollow}
                  >
                    {isFollowing ? (
                      <>
                        <UserCheck className="w-4 h-4 mr-2" />
                        Volgend
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4 mr-2" />
                        Volgen
                      </>
                    )}
                  </Button>
                )}

                {/* Direct Message Button (Stuur Bericht) */}
                {!isOwnProfile && (
                  <Button
                    variant="outline"
                    className="rounded-full border-orange-500/40 text-orange-400 hover:bg-orange-500/10"
                    onClick={() => setIsDMOpen(true)}
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Stuur Bericht
                  </Button>
                )}

                {/* Demo Inzenden for Labels */}
                {isLabel && (
                  <Button
                    className="rounded-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold shadow-md shadow-orange-500/20"
                    onClick={() => {
                      if (!isAuthenticated) {
                        toast.error('Log eerst in om een demo in te zenden naar Zheavenzy.');
                        return;
                      }
                      setIsDMOpen(true);
                    }}
                  >
                    <Sparkles className="w-4 h-4 mr-1.5" />
                    Demo Inzenden
                  </Button>
                )}

                {/* Edit Profile Button (Own Profile) */}
                {isOwnProfile && (
                  <Button
                    variant="outline"
                    className="rounded-full border-border hover:bg-secondary"
                    onClick={handleOpenEditModal}
                  >
                    <Edit3 className="w-4 h-4 mr-2" />
                    Profiel Bewerken
                  </Button>
                )}

                {/* Share Profile Button */}
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-full"
                  onClick={() => {
                    setSelectedShareTrack(null);
                    setIsShareModalOpen(true);
                  }}
                  title="Deel profiel naar socials"
                >
                  <Share2 className="w-4 h-4" />
                </Button>

                {/* More Options */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon" className="rounded-full">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {isOwnProfile ? (
                      <>
                        <DropdownMenuItem onClick={handleOpenEditModal}>
                          Profiel Bewerken
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => bannerInputRef.current?.click()}>
                          Omslagfoto Wijzigen
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => avatarInputRef.current?.click()}>
                          Profielfoto Wijzigen
                        </DropdownMenuItem>
                      </>
                    ) : (
                      <>
                        <DropdownMenuItem onClick={() => setIsDMOpen(true)}>
                          Privé bericht sturen
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => toast.info('Melding ontvangen')}>
                          Rapporteer artiest
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* LIVE PROFILE STATS */}
            <div className="flex items-center gap-6 sm:gap-8 mt-6 pt-4 border-t border-border/50 flex-wrap">
              <div className="text-center sm:text-left">
                <p className="text-lg font-black text-white">{userTracks.length}</p>
                <p className="text-xs text-muted-foreground">{isLabel ? 'Label Releases' : 'Tracks'}</p>
              </div>
              {isLabel && (
                <div className="text-center sm:text-left">
                  <p className="text-lg font-black text-orange-400">{signedArtists.length}</p>
                  <p className="text-xs text-muted-foreground">Getekende Artiesten</p>
                </div>
              )}
              <div className="text-center sm:text-left">
                <p className="text-lg font-black text-white">{followersCount.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Volgers</p>
              </div>
              <div className="text-center sm:text-left">
                <p className="text-lg font-black text-white">{user.followingCount || 0}</p>
                <p className="text-xs text-muted-foreground">Volgend</p>
              </div>
              <div className="text-center sm:text-left">
                <p className="text-lg font-black text-orange-400">
                  {userTracks.reduce((acc: number, t: Track) => acc + (t.playsCount || 0), 0).toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">Totale Plays</p>
              </div>
            </div>
          </div>

          {/* PROFILE TABS */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6 bg-secondary/60 flex-wrap h-auto p-1 gap-1">
              {isLabel && (
                <TabsTrigger
                  value="roster"
                  className="flex items-center gap-1.5 font-bold data-[state=active]:bg-orange-500 data-[state=active]:text-white"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Getekende Artiesten ({signedArtists.length})</span>
                </TabsTrigger>
              )}
              <TabsTrigger value="tracks">
                {isLabel ? `Alle Label Releases (${userTracks.length})` : `Tracks (${userTracks.length})`}
              </TabsTrigger>
              <TabsTrigger value="about">Over {user.displayName}</TabsTrigger>
              <TabsTrigger value="likes">Likes ({likedTracks.length})</TabsTrigger>
              <TabsTrigger value="reposts">Herplaatst ({repostedTracks.length})</TabsTrigger>
              <TabsTrigger value="playlists">Afspeellijsten ({userPlaylists.length})</TabsTrigger>
            </TabsList>

            {/* TAB: ROSTER (ONLY FOR RECORD LABELS) */}
            {isLabel && (
              <TabsContent value="roster" className="space-y-6">
                <div className="p-6 rounded-2xl bg-gradient-to-r from-orange-500/10 via-purple-500/10 to-transparent border border-orange-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-black text-white flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-orange-400" />
                      Officiële Zheavenzy Records Artiesten Roster
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
                      Ontdek alle 11 getekende artiesten op Zheavenzy. Van rauwe straatrap en drill tot zwoele R&B, futuristic melodic trap en krachtige pop anthems. Klik op een artiest om naar hun eigen profielpagina te gaan.
                    </p>
                  </div>
                  <Button
                    className="rounded-full bg-orange-500 hover:bg-orange-600 text-white shrink-0 font-semibold"
                    onClick={handlePlayAll}
                  >
                    <Play className="w-4 h-4 mr-2 fill-current" />
                    Speel Roster Releases
                  </Button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {signedArtists.map((artist) => (
                    <div
                      key={artist.id}
                      className="p-5 rounded-2xl bg-card border border-border/70 hover:border-orange-500/40 transition-all hover:shadow-xl hover:shadow-orange-500/5 flex flex-col justify-between group"
                    >
                      <div>
                        <div className="relative mb-3 flex justify-center">
                          <Avatar className="w-24 h-24 ring-2 ring-orange-500/20 group-hover:ring-orange-500/60 transition-all">
                            <AvatarImage src={artist.avatarUrl} alt={artist.displayName} />
                            <AvatarFallback>{artist.displayName[0]}</AvatarFallback>
                          </Avatar>
                          <span className="absolute bottom-0 right-1/2 translate-x-8 px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-500 text-white shadow">
                            Artist
                          </span>
                        </div>
                        <div className="text-center">
                          <h3 className="font-bold text-base text-foreground group-hover:text-orange-400 transition-colors">
                            {artist.displayName}
                          </h3>
                          <p className="text-xs text-orange-400 font-medium mt-0.5">
                            {artist.genre || 'Zheavenzy Artist'}
                          </p>
                          <p className="text-xs text-muted-foreground mt-2 line-clamp-2 leading-relaxed">
                            {artist.bio}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          {artist.followersCount.toLocaleString()} volgers
                        </span>
                        <Button
                          size="sm"
                          variant="secondary"
                          className="rounded-full text-xs h-8 px-3 group-hover:bg-orange-500 group-hover:text-white transition-colors"
                          asChild
                        >
                          <Link to={`/artist/${artist.username}`}>Eigen Pagina →</Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>
            )}

            {/* TAB 1: TRACKS */}
            <TabsContent value="tracks" className="space-y-4">
              {userTracks.length > 0 ? (
                <>
                  <div className="flex items-center gap-3 mb-4">
                    <Button
                      className="rounded-full bg-orange-500 hover:bg-orange-600 text-white font-semibold"
                      onClick={handlePlayAll}
                    >
                      <Play className="w-4 h-4 mr-2 fill-current" />
                      Speel Alles Af
                    </Button>
                    <Button
                      variant="outline"
                      className="rounded-full border-orange-500/30 text-orange-400 hover:bg-orange-500/10"
                      onClick={handleShuffleTracks}
                    >
                      <Shuffle className="w-4 h-4 mr-2" />
                      Shuffle Nummers
                    </Button>
                  </div>
                  <div className="bg-card/50 rounded-2xl border border-border/60 divide-y divide-border/30 overflow-hidden">
                    {userTracks.map((track: Track, index: number) => (
                      <TrackRow
                        key={track.id}
                        track={track}
                        index={index}
                        onShare={(t) => {
                          setSelectedShareTrack(t);
                          setIsShareModalOpen(true);
                        }}
                      />
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-16 bg-card/30 rounded-2xl border border-border/40">
                  <p className="text-muted-foreground text-sm">Nog geen tracks geüpload.</p>
                  {isOwnProfile && (
                    <Button asChild className="mt-4 rounded-full bg-orange-500 hover:bg-orange-600 text-white">
                      <Link to="/upload">Upload je eerste track</Link>
                    </Button>
                  )}
                </div>
              )}
            </TabsContent>

            {/* TAB: ABOUT (OVER DE ARTIEST OF HET LABEL) */}
            <TabsContent value="about" className="space-y-6">
              <div className="p-6 rounded-2xl bg-card border border-border/70 space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-white mb-2">Biografie</h3>
                  <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">
                    {user.bio || 'Geen biografie beschikbaar.'}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-4 border-t border-border/50">
                  {user.genre && (
                    <div className="p-3.5 rounded-xl bg-secondary/40 border border-border/40">
                      <p className="text-xs text-muted-foreground">Muziekstijl / Focus</p>
                      <p className="text-sm font-semibold text-foreground mt-0.5">{user.genre}</p>
                    </div>
                  )}
                  {user.location && (
                    <div className="p-3.5 rounded-xl bg-secondary/40 border border-border/40">
                      <p className="text-xs text-muted-foreground">Locatie</p>
                      <p className="text-sm font-semibold text-foreground mt-0.5">{user.location}</p>
                    </div>
                  )}
                  {user.labelName && !isLabel && (
                    <div className="p-3.5 rounded-xl bg-secondary/40 border border-border/40">
                      <p className="text-xs text-muted-foreground">Platenlabel</p>
                      <Link
                        to={`/label/${user.labelId || 'zheavenzy'}`}
                        className="text-sm font-semibold text-orange-400 hover:underline flex items-center gap-1 mt-0.5"
                      >
                        <Building2 className="w-3.5 h-3.5" />
                        {user.labelName} Records
                      </Link>
                    </div>
                  )}
                  {isLabel && (
                    <div className="p-3.5 rounded-xl bg-secondary/40 border border-border/40">
                      <p className="text-xs text-muted-foreground">Getekende Artiesten</p>
                      <p className="text-sm font-semibold text-orange-400 mt-0.5">
                        {signedArtists.length} Artiesten op het Roster
                      </p>
                    </div>
                  )}
                </div>

                {/* If artist signed to Zheavenzy, show fellow label family info */}
                {user.labelName === 'Zheavenzy' && !isLabel && (
                  <div className="p-4 rounded-xl bg-gradient-to-r from-orange-500/10 to-transparent border border-orange-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-400 font-bold shrink-0">
                        Z
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white">Deel van de Zheavenzy Familie</h4>
                        <p className="text-xs text-muted-foreground">
                          {user.displayName} brengt officiële releases uit onder Zheavenzy Records.
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-full border-orange-500/40 text-orange-400 hover:bg-orange-500/10 text-xs shrink-0"
                      asChild
                    >
                      <Link to="/label/zheavenzy">Bekijk Zheavenzy Label</Link>
                    </Button>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* TAB 2: LIKES */}
            <TabsContent value="likes" className="space-y-4">
              {likedTracks.length > 0 ? (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm text-muted-foreground">
                      Nummers geliked door <span className="text-foreground font-semibold">{user.displayName}</span>
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-full"
                      onClick={() => shufflePlayQueue(likedTracks)}
                    >
                      <Shuffle className="w-3.5 h-3.5 mr-1.5" />
                      Shuffle Likes
                    </Button>
                  </div>
                  <div className="bg-card/50 rounded-2xl border border-border/60 divide-y divide-border/30 overflow-hidden">
                    {likedTracks.map((track: Track, index: number) => (
                      <TrackRow
                        key={track.id}
                        track={track}
                        index={index}
                        onShare={(t) => {
                          setSelectedShareTrack(t);
                          setIsShareModalOpen(true);
                        }}
                      />
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-16 bg-card/30 rounded-2xl border border-border/40">
                  <Heart className="w-10 h-10 mx-auto mb-2 text-muted-foreground/40" />
                  <p className="text-muted-foreground text-sm">Nog geen gelikete nummers zichtbaar.</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Klik op het hartje bij tracks om ze op je profiel te tonen.
                  </p>
                </div>
              )}
            </TabsContent>

            {/* TAB 3: REPOSTS (HERPLAATST) */}
            <TabsContent value="reposts" className="space-y-4">
              {repostedTracks.length > 0 ? (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm text-muted-foreground">
                      Nummers herplaatst door <span className="text-foreground font-semibold">{user.displayName}</span>
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-full"
                      onClick={() => shufflePlayQueue(repostedTracks)}
                    >
                      <Shuffle className="w-3.5 h-3.5 mr-1.5" />
                      Shuffle Herplaatst
                    </Button>
                  </div>
                  <div className="bg-card/50 rounded-2xl border border-border/60 divide-y divide-border/30 overflow-hidden">
                    {repostedTracks.map((track: Track, index: number) => (
                      <TrackRow
                        key={track.id}
                        track={track}
                        index={index}
                        onShare={(t) => {
                          setSelectedShareTrack(t);
                          setIsShareModalOpen(true);
                        }}
                      />
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-16 bg-card/30 rounded-2xl border border-border/40">
                  <Repeat2 className="w-10 h-10 mx-auto mb-2 text-muted-foreground/40" />
                  <p className="text-muted-foreground text-sm">Nog geen herplaatste nummers.</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Herplaats nummers van andere artiesten om ze op je profiel te delen!
                  </p>
                </div>
              )}
            </TabsContent>

            {/* TAB 4: PLAYLISTS */}
            <TabsContent value="playlists">
              {userPlaylists.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {userPlaylists.map((playlist) => (
                    <Link
                      key={playlist.id}
                      to={`/playlist/${playlist.id}`}
                      className="bg-card rounded-2xl overflow-hidden hover:-translate-y-1 transition-transform border border-border/50 group"
                    >
                      <div className="w-full aspect-square overflow-hidden bg-muted">
                        <TrackCover playlist={playlist} showBadge />
                      </div>
                      <div className="p-4">
                        <h3 className="font-semibold text-sm group-hover:text-orange-400 transition-colors">
                          {playlist.title}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-1">
                          {playlist.tracksCount} tracks
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 bg-card/30 rounded-2xl border border-border/40">
                  <p className="text-muted-foreground text-sm">Geen afspeellijsten gevonden.</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* SHARE MODAL */}
      <ShareTrackModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        track={selectedShareTrack}
        user={selectedShareTrack ? null : user}
      />

      {/* DIRECT MESSAGE MODAL (Pre-selected with this user) */}
      <DirectMessageModal
        isOpen={isDMOpen}
        onClose={() => setIsDMOpen(false)}
        initialRecipient={user}
      />

      {/* EDIT PROFILE DIALOG */}
      {isOwnProfile && (
        <Dialog open={isEditProfileOpen} onOpenChange={setIsEditProfileOpen}>
          <DialogContent className="sm:max-w-lg bg-card border-border max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-orange-500" />
                Profiel Bewerken
              </DialogTitle>
              <DialogDescription>
                Pas je artiestennaam, biografie en sociale media koppelingen aan.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSaveProfile} className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Artiest / Display Naam</label>
                <Input
                  value={editDisplayName}
                  onChange={(e) => setEditDisplayName(e.target.value)}
                  placeholder="Bijv. DJ Beats"
                  className="bg-secondary/50"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Biografie</label>
                <Textarea
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  placeholder="Vertel iets over jezelf, je muziekstijl en samenwerkingen..."
                  rows={3}
                  className="bg-secondary/50 resize-none"
                />
              </div>

              {/* Socials Section */}
              <div className="space-y-3 pt-2 border-t border-border/60">
                <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-orange-400" />
                  Social Media Links
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] text-muted-foreground">TikTok Gebruikersnaam / URL</label>
                    <Input
                      value={editSocials.tiktok || ''}
                      onChange={(e) => setEditSocials({ ...editSocials, tiktok: e.target.value })}
                      placeholder="@jouw_tiktok"
                      className="bg-secondary/50 text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] text-muted-foreground">Instagram Gebruikersnaam / URL</label>
                    <Input
                      value={editSocials.instagram || ''}
                      onChange={(e) => setEditSocials({ ...editSocials, instagram: e.target.value })}
                      placeholder="@jouw_instagram"
                      className="bg-secondary/50 text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] text-muted-foreground">YouTube Kanaal / Handle</label>
                    <Input
                      value={editSocials.youtube || ''}
                      onChange={(e) => setEditSocials({ ...editSocials, youtube: e.target.value })}
                      placeholder="@jouw_youtube"
                      className="bg-secondary/50 text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] text-muted-foreground">X (Twitter) Handle</label>
                    <Input
                      value={editSocials.x || ''}
                      onChange={(e) => setEditSocials({ ...editSocials, x: e.target.value })}
                      placeholder="@jouw_x"
                      className="bg-secondary/50 text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Quick Image Buttons */}
              <div className="flex gap-2 pt-2 border-t border-border/60">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="flex-1 text-xs"
                  onClick={() => avatarInputRef.current?.click()}
                >
                  <Camera className="w-3.5 h-3.5 mr-1.5 text-orange-400" />
                  Foto Wijzigen
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="flex-1 text-xs"
                  onClick={() => bannerInputRef.current?.click()}
                >
                  <ImageIcon className="w-3.5 h-3.5 mr-1.5 text-orange-400" />
                  Banner Wijzigen
                </Button>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <Button type="button" variant="ghost" onClick={() => setIsEditProfileOpen(false)}>
                  Annuleren
                </Button>
                <Button type="submit" className="bg-orange-500 hover:bg-orange-600 text-white rounded-full px-5">
                  Opslaan
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}

      <AudioPlayer />
    </div>
  );
}
