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
  ShieldCheck,
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
import { getUserById, getArtistsByLabel, mockUsers } from '@/data/mockData';
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
      className={`flex items-center gap-3 sm:gap-4 p-3.5 rounded-2xl hover:bg-white/[0.06] transition-colors group ${
        isCurrentTrack ? 'bg-white/[0.08]' : ''
      }`}
    >
      <span className="w-6 text-center text-xs sm:text-sm text-[#86868b] shrink-0 font-medium">{index + 1}</span>
      <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 bg-[#1c1c1e] relative group shadow-sm">
        <TrackCover track={track} />
        <button
          onClick={() => playTrack(track)}
          className={`absolute inset-0 bg-black/50 flex items-center justify-center transition-opacity ${
            isCurrentTrack && isPlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
          }`}
          aria-label="Play track"
        >
          {isCurrentTrack && isPlaying ? (
            <div className="flex gap-0.5 items-end h-3">
              <span className="w-0.5 h-3 bg-white animate-bounce" />
              <span className="w-0.5 h-2 bg-white animate-bounce" style={{ animationDelay: '0.1s' }} />
              <span className="w-0.5 h-3.5 bg-white animate-bounce" style={{ animationDelay: '0.2s' }} />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center shadow-md">
              <Play className="w-3.5 h-3.5 fill-black ml-0.5" />
            </div>
          )}
        </button>
      </div>

      <div className="flex-1 min-w-0">
        <Link
          to={`/track/${track.id}`}
          className={`font-medium text-sm truncate block hover:underline tracking-tight ${
            isCurrentTrack ? 'text-[#fa233b]' : 'text-white'
          }`}
        >
          {track.title}
        </Link>
        <div className="flex items-center gap-2 text-xs text-[#86868b] mt-0.5">
          <span>{track.genre}</span>
          <span>•</span>
          <span className="flex items-center gap-1 font-normal text-[#86868b]">
            <Headphones className="w-3 h-3 text-[#86868b]" />
            {(track.playsCount || 0).toLocaleString()} plays
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={handleLike}
          className={`p-2 rounded-full hover:bg-white/10 transition-colors ${
            liked ? 'text-[#fa233b]' : 'text-[#86868b] hover:text-white'
          }`}
          title={liked ? 'Geliked' : 'Like'}
        >
          <Heart className="w-4 h-4" fill={liked ? 'currentColor' : 'none'} />
        </button>

        <button
          onClick={handleRepost}
          className={`p-2 rounded-full hover:bg-white/10 transition-colors ${
            reposted ? 'text-emerald-400' : 'text-[#86868b] hover:text-white'
          }`}
          title={reposted ? 'Herplaatst' : 'Herplaatsen'}
        >
          <Repeat2 className="w-4 h-4" />
        </button>

        <button
          onClick={() => onShare(track)}
          className="p-2 rounded-full text-[#86868b] hover:text-white hover:bg-white/10 transition-colors"
          title="Deel naar socials"
        >
          <Share2 className="w-4 h-4" />
        </button>

        <span className="text-xs text-[#86868b] w-12 text-right hidden sm:inline tabular-nums font-mono">
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
    adminUpdateUser,
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
  const [editUsername, setEditUsername] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editGenre, setEditGenre] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editWebsite, setEditWebsite] = useState('');
  const [editPlan, setEditPlan] = useState<'gebruiker' | 'artiest' | 'label'>('artiest');
  const [editVerified, setEditVerified] = useState(false);
  const [editFollowersCount, setEditFollowersCount] = useState<number | string>(0);
  const [editLabelName, setEditLabelName] = useState('');
  const [editLabelId, setEditLabelId] = useState('');
  const [editSignedArtistIds, setEditSignedArtistIds] = useState<string[]>([]);
  const [editAvatarUrl, setEditAvatarUrl] = useState('');
  const [editBannerUrl, setEditBannerUrl] = useState('');
  const [editSocials, setEditSocials] = useState<UserSocials>({});

  const [userOverride, setUserOverride] = useState<User | null>(null);

  useEffect(() => {
    setUserOverride(null);
  }, [id]);

  useEffect(() => {
    const handler = () => {
      if (id) {
        const u = getUserById(id);
        if (u) setUserOverride({ ...u });
      }
    };
    window.addEventListener('cloudiaudi:users_updated', handler);
    return () => window.removeEventListener('cloudiaudi:users_updated', handler);
  }, [id]);

  const bannerInputRef = useRef<HTMLInputElement | null>(null);
  const avatarInputRef = useRef<HTMLInputElement | null>(null);

  const matchedUser = id ? getUserById(id) : undefined;
  const isOwnProfile =
    !id ||
    currentUser?.id === id ||
    currentUser?.username === id ||
    (currentUser?.id === 'admin_jamal' && (id === 'jamal-drenthe' || id === 'admin_jamal' || id === 'js_drenthe'));
  const isAdmin = currentUser?.role === 'admin';
  const canEdit = isOwnProfile || isAdmin;

  const activeUserObj = userOverride || matchedUser;
  const rawUser = isOwnProfile && currentUser && !userOverride
    ? { ...(activeUserObj || {}), ...currentUser }
    : (activeUserObj || (!id ? currentUser : undefined));

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
      <div className="min-h-screen bg-black text-[#f5f5f7]">
        <Navbar />
        <main className="pt-24 px-4">
          <div className="max-w-xl mx-auto text-center p-8 rounded-3xl bg-[#161617]/90 border border-white/[0.08] backdrop-blur-2xl">
            <h1 className="text-2xl font-semibold tracking-tight text-white">Gebruiker niet gevonden</h1>
            <p className="text-[#86868b] mt-2 text-sm">
              Het profiel dat je zoekt bestaat niet of is niet beschikbaar.
            </p>
            <Button asChild variant="apple" className="mt-6 rounded-full px-6">
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
    if (!file || !user) return;
    try {
      toast.loading('Banner uploaden en optimaliseren...');
      const compressedDataUrl = await compressImage(file, 1400, 500, 0.85);
      const updated = await adminUpdateUser(user.id, { bannerUrl: compressedDataUrl });
      if (isOwnProfile) {
        await updateProfile({ bannerUrl: compressedDataUrl });
      }
      if (updated) setUserOverride({ ...updated });
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
    if (!file || !user) return;
    try {
      toast.loading('Profielfoto uploaden...');
      const compressedDataUrl = await compressImage(file, 400, 400, 0.85);
      const updated = await adminUpdateUser(user.id, { avatarUrl: compressedDataUrl });
      if (isOwnProfile) {
        await updateProfile({ avatarUrl: compressedDataUrl });
      }
      if (updated) setUserOverride({ ...updated });
      toast.dismiss();
      toast.success('Profielfoto succesvol aangepast!');
    } catch {
      toast.dismiss();
      toast.error('Fout bij het uploaden van profielfoto');
    }
  };

  // Open Edit Profile modal
  const handleOpenEditModal = () => {
    if (!user) return;
    setEditDisplayName(user.displayName || '');
    setEditUsername(user.username || '');
    setEditBio(user.bio || '');
    setEditGenre(user.genre || '');
    setEditLocation(user.location || '');
    setEditWebsite(user.website || '');
    setEditPlan(user.plan || (isLabel ? 'label' : 'artiest'));
    setEditVerified(Boolean(user.verified));
    setEditFollowersCount(user.followersCount || 0);
    setEditLabelName(user.labelName || 'Zheavenzy');
    setEditLabelId(user.labelId || 'zheavenzy');
    setEditSignedArtistIds(
      user.signedArtistIds && user.signedArtistIds.length > 0
        ? [...user.signedArtistIds]
        : [
            'jamal-drenthe',
            'askylon',
            'rowu',
            'youandi',
            'raka-vw',
            'ar',
            'le3',
            'noddy-north',
            'shawn-basterd',
            'heg',
            'andreea-comandaru',
          ]
    );
    setEditAvatarUrl(user.avatarUrl || '');
    setEditBannerUrl(user.bannerUrl || '');
    setEditSocials(user.socials || {});
    setIsEditProfileOpen(true);
  };

  // Save profile edits
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      const cleanUsername = editUsername.trim().toLowerCase().replace(/^@/, '');
      const updates: Partial<User> = {
        displayName: editDisplayName.trim() || user.displayName,
        username: cleanUsername || user.username,
        bio: editBio.trim(),
        genre: editGenre.trim() || undefined,
        location: editLocation.trim() || undefined,
        website: editWebsite.trim() || undefined,
        avatarUrl: editAvatarUrl.trim() || user.avatarUrl,
        bannerUrl: editBannerUrl.trim() || user.bannerUrl,
        socials: editSocials,
      };

      if (isAdmin) {
        updates.plan = editPlan;
        updates.verified = editVerified;
        updates.followersCount = Math.max(0, parseInt(String(editFollowersCount), 10) || 0);
        if (editPlan === 'label' || user.id === 'zheavenzy') {
          updates.signedArtistIds = editSignedArtistIds;
        } else {
          updates.labelName = editLabelName.trim() || undefined;
          updates.labelId = editLabelId.trim() || undefined;
        }
      }

      const updated = await adminUpdateUser(user.id, updates);
      if (isOwnProfile) {
        await updateProfile(updates);
      }
      if (updated) {
        setUserOverride({ ...updated });
      }
      setIsEditProfileOpen(false);
      toast.success(`Profiel van ${updates.displayName || user.displayName} succesvol opgeslagen!`);
    } catch (err) {
      console.error(err);
      toast.error('Fout bij opslaan van profiel');
    }
  };

  const toggleSignedArtist = (artistId: string) => {
    setEditSignedArtistIds((prev) =>
      prev.includes(artistId) ? prev.filter((aid) => aid !== artistId) : [...prev, artistId]
    );
  };

  return (
    <div className="min-h-screen bg-black text-[#f5f5f7] pb-32">
      <Navbar />

      <main className="pt-16">
        {/* HORIZONTAL BANNER (Uploadable) */}
        <div className="relative h-56 sm:h-72 md:h-88 w-full overflow-hidden group bg-[#161617]">
          <img
            src={user.bannerUrl}
            alt="Profile Banner"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

          {/* Change Banner Button (Own Profile or Admin) */}
          {canEdit && (
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
                className="absolute top-4 right-4 bg-black/60 hover:bg-black/80 backdrop-blur-2xl text-white text-xs font-medium px-3.5 py-1.5 rounded-full border border-white/15 flex items-center gap-1.5 transition-all shadow-lg hover:scale-105"
              >
                <ImageIcon className="w-3.5 h-3.5 text-[#fa233b]" />
                <span>{isAdmin && !isOwnProfile ? 'Banner Aanpassen (Admin)' : 'Horizontale Banner Aanpassen'}</span>
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
                  <Avatar className="w-32 h-32 sm:w-40 sm:h-40 ring-4 ring-black shadow-2xl bg-[#1c1c1e] border border-white/10">
                    <AvatarImage src={user.avatarUrl} alt={user.displayName} />
                    <AvatarFallback className="text-4xl bg-[#1c1c1e] text-white">{user.displayName[0]}</AvatarFallback>
                  </Avatar>

                  {/* Change Avatar Overlay */}
                  {canEdit && (
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
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-xs font-medium"
                        title={isAdmin && !isOwnProfile ? 'Foto Wijzigen (Admin)' : 'Wijzig profielfoto'}
                      >
                        <Camera className="w-6 h-6 mb-1 text-white" />
                        <span>{isAdmin && !isOwnProfile ? 'Foto Wijzigen (Admin)' : 'Foto Wijzigen'}</span>
                      </button>
                    </>
                  )}
                </div>

                {/* NAME & BIO */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h1 className="text-2xl sm:text-4xl font-semibold tracking-[-0.03em] text-white">{user.displayName}</h1>
                    {user.role === 'admin' && (
                      <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-white/10 text-white border border-white/15">
                        Admin
                      </span>
                    )}
                    {isLabel ? (
                      <span className="text-[11px] font-semibold px-3 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1 shadow-sm">
                        <Building2 className="w-3 h-3 text-amber-400" />
                        Officiëel Record Label
                      </span>
                    ) : user.plan === 'artiest' ? (
                      <span className="text-[11px] font-medium px-3 py-0.5 rounded-full bg-[#fa233b]/15 text-[#fa233b] border border-[#fa233b]/30 flex items-center gap-1">
                        <Music2 className="w-3 h-3" />
                        Geverifieerde Artiest
                      </span>
                    ) : user.plan ? (
                      <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-white/[0.08] text-[#86868b] capitalize">
                        {user.plan}
                      </span>
                    ) : null}
                    {user.verified && (
                      <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Geverifieerd
                      </span>
                    )}
                  </div>

                  {/* Subline: username + label affiliation + genre + location */}
                  <div className="flex items-center gap-2 flex-wrap text-sm text-[#86868b]">
                    <span>@{user.username}</span>
                    {user.labelName && !isLabel && (
                      <>
                        <span>•</span>
                        <Link
                          to={`/label/${user.labelId || 'zheavenzy'}`}
                          className="inline-flex items-center gap-1 text-xs font-medium text-white hover:text-white/80 bg-white/[0.06] px-3 py-0.5 rounded-full border border-white/10 transition-colors"
                          title="Bekijk het officiële Zheavenzy label profiel"
                        >
                          <Building2 className="w-3 h-3 text-[#fa233b]" />
                          <span>Getekend bij {user.labelName} Label</span>
                        </Link>
                      </>
                    )}
                    {user.genre && (
                      <>
                        <span>•</span>
                        <span className="text-xs text-white/80 font-medium">{user.genre}</span>
                      </>
                    )}
                    {user.location && (
                      <>
                        <span>•</span>
                        <span className="text-xs text-[#86868b]">📍 {user.location}</span>
                      </>
                    )}
                  </div>

                  {user.bio ? (
                    <p className="mt-2 text-xs sm:text-sm text-[#86868b] max-w-xl leading-relaxed whitespace-pre-wrap">
                      {user.bio}
                    </p>
                  ) : (
                    isOwnProfile && (
                      <p className="text-xs text-[#86868b] italic">
                        Voeg een bio toe in profiel bewerken om fans over jezelf te vertellen.
                      </p>
                    )
                  )}

                  {/* SOCIAL MEDIA BUTTONS */}
                  <div className="flex items-center gap-2 pt-2 flex-wrap">
                    {user.socials?.tiktok ? (
                      <a
                        href={
                          user.socials.tiktok.startsWith('http')
                            ? user.socials.tiktok
                            : `https://www.tiktok.com/@${user.socials.tiktok.replace('@', '')}`
                        }
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1c1c1e] hover:bg-[#2c2c2e] text-xs font-medium text-[#86868b] hover:text-white border border-white/[0.08] transition-colors"
                      >
                        <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                          <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.24 1.07-.14 1.61.24 1.64 1.82 2.89 3.48 2.8 1.5-.03 2.77-1.14 2.95-2.62.06-.51.06-1.03.06-1.54.01-5.69 0-11.39 0-17.08z"/>
                        </svg>
                        <span>TikTok</span>
                      </a>
                    ) : null}

                    {user.socials?.youtube ? (
                      <a
                        href={
                          user.socials.youtube.startsWith('http')
                            ? user.socials.youtube
                            : `https://www.youtube.com/@${user.socials.youtube.replace('@', '')}`
                        }
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1c1c1e] hover:bg-[#2c2c2e] text-xs font-medium text-[#86868b] hover:text-white border border-white/[0.08] transition-colors"
                      >
                        <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                        </svg>
                        <span>YouTube</span>
                      </a>
                    ) : null}

                    {user.socials?.instagram ? (
                      <a
                        href={
                          user.socials.instagram.startsWith('http')
                            ? user.socials.instagram
                            : `https://www.instagram.com/${user.socials.instagram.replace('@', '')}`
                        }
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1c1c1e] hover:bg-[#2c2c2e] text-xs font-medium text-[#86868b] hover:text-white border border-white/[0.08] transition-colors"
                      >
                        <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                        </svg>
                        <span>Instagram</span>
                      </a>
                    ) : null}

                    {user.socials?.x ? (
                      <a
                        href={
                          user.socials.x.startsWith('http')
                            ? user.socials.x
                            : `https://x.com/${user.socials.x.replace('@', '')}`
                        }
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#1c1c1e] hover:bg-[#2c2c2e] text-xs font-medium text-[#86868b] hover:text-white border border-white/[0.08] transition-colors"
                      >
                        <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                        </svg>
                        <span>X</span>
                      </a>
                    ) : null}

                    {/* Edit socials shortcut */}
                    {canEdit && (
                      <button
                        onClick={handleOpenEditModal}
                        className="text-xs text-[#86868b] hover:text-white flex items-center gap-1 px-3 py-1 rounded-full bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] transition-colors"
                      >
                        <Edit3 className="w-3 h-3 text-[#fa233b]" />
                        <span>Socials Koppelen</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* ACTION BUTTONS */}
              <div className="flex items-center gap-2.5 flex-wrap">
                {/* Follow Button */}
                {!isOwnProfile && (
                  <Button
                    className={`rounded-full px-5 ${
                      isFollowing
                        ? 'bg-[#1c1c1e] hover:bg-[#2c2c2e] text-white border border-white/[0.08]'
                        : 'bg-white hover:bg-[#f5f5f7] text-black font-semibold'
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
                    variant="secondary"
                    className="rounded-full bg-[#1c1c1e] text-white hover:bg-[#2c2c2e] border border-white/[0.08]"
                    onClick={() => setIsDMOpen(true)}
                  >
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Stuur Bericht
                  </Button>
                )}

                {/* Demo Inzenden for Labels */}
                {isLabel && (
                  <Button
                    className="rounded-full bg-[#fa233b] hover:bg-[#fa233b]/90 text-white font-semibold shadow-sm"
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

                {/* Edit Profile Button */}
                {isOwnProfile ? (
                  <Button
                    variant="secondary"
                    className="rounded-full bg-[#1c1c1e] text-white hover:bg-[#2c2c2e] border border-white/[0.08]"
                    onClick={handleOpenEditModal}
                  >
                    <Edit3 className="w-4 h-4 mr-2" />
                    Profiel Bewerken
                  </Button>
                ) : isAdmin ? (
                  <Button
                    variant="secondary"
                    className="rounded-full bg-gradient-to-r from-amber-500/20 via-red-500/20 to-purple-500/20 hover:from-amber-500/30 hover:to-red-500/30 text-white border border-amber-500/40 font-medium shadow-sm transition-all hover:scale-[1.02]"
                    onClick={handleOpenEditModal}
                  >
                    <Edit3 className="w-4 h-4 mr-2 text-amber-400" />
                    {isLabel ? 'Label Beheren (Admin)' : 'Artiest Bewerken (Admin)'}
                  </Button>
                ) : null}

                {/* Share Profile Button */}
                <Button
                  variant="secondary"
                  size="icon"
                  className="rounded-full bg-[#1c1c1e] hover:bg-[#2c2c2e] border border-white/[0.08] text-white"
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
                    <Button variant="secondary" size="icon" className="rounded-full bg-[#1c1c1e] hover:bg-[#2c2c2e] border border-white/[0.08] text-white">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-[#1c1c1e] border-white/10 text-white rounded-2xl">
                    {canEdit ? (
                      <>
                        <DropdownMenuItem onClick={handleOpenEditModal} className="focus:bg-white/10 rounded-xl cursor-pointer">
                          <Edit3 className="w-4 h-4 mr-2 text-amber-400" />
                          {isAdmin && !isOwnProfile ? (isLabel ? 'Label Beheren (Admin)' : 'Artiest Bewerken (Admin)') : 'Profiel Bewerken'}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => bannerInputRef.current?.click()} className="focus:bg-white/10 rounded-xl cursor-pointer">
                          <ImageIcon className="w-4 h-4 mr-2" />
                          Omslagfoto Wijzigen
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => avatarInputRef.current?.click()} className="focus:bg-white/10 rounded-xl cursor-pointer">
                          <Camera className="w-4 h-4 mr-2" />
                          Profielfoto Wijzigen
                        </DropdownMenuItem>
                      </>
                    ) : null}
                    {!isOwnProfile && (
                      <>
                        <DropdownMenuItem onClick={() => setIsDMOpen(true)} className="focus:bg-white/10 rounded-xl cursor-pointer">
                          <MessageSquare className="w-4 h-4 mr-2" />
                          Privé bericht sturen
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => toast.info('Melding ontvangen')} className="focus:bg-white/10 rounded-xl cursor-pointer">
                          Rapporteer artiest
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* LIVE PROFILE STATS */}
            <div className="flex items-center gap-6 sm:gap-10 mt-6 pt-5 border-t border-white/[0.08] flex-wrap">
              <div>
                <p className="text-xl font-bold tracking-tight text-white">{userTracks.length}</p>
                <p className="text-xs text-[#86868b]">{isLabel ? 'Label Releases' : 'Tracks'}</p>
              </div>
              {isLabel && (
                <div>
                  <p className="text-xl font-bold tracking-tight text-white">{signedArtists.length}</p>
                  <p className="text-xs text-[#86868b]">Getekende Artiesten</p>
                </div>
              )}
              <div>
                <p className="text-xl font-bold tracking-tight text-white">{followersCount.toLocaleString()}</p>
                <p className="text-xs text-[#86868b]">Volgers</p>
              </div>
              <div>
                <p className="text-xl font-bold tracking-tight text-white">{user.followingCount || 0}</p>
                <p className="text-xs text-[#86868b]">Volgend</p>
              </div>
              <div>
                <p className="text-xl font-bold tracking-tight text-white">
                  {userTracks.reduce((acc: number, t: Track) => acc + (t.playsCount || 0), 0).toLocaleString()}
                </p>
                <p className="text-xs text-[#86868b]">Totale Plays</p>
              </div>
            </div>
          </div>

          {/* PROFILE TABS */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6 p-1 rounded-full bg-[#1c1c1e]/90 border border-white/[0.08] backdrop-blur-xl flex-wrap h-auto gap-1">
              {isLabel && (
                <TabsTrigger
                  value="roster"
                  className="flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-medium text-[#86868b] hover:text-white data-[state=active]:bg-white data-[state=active]:text-black transition-all"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Getekende Artiesten ({signedArtists.length})</span>
                </TabsTrigger>
              )}
              <TabsTrigger
                value="tracks"
                className="rounded-full px-4 py-1.5 text-xs font-medium text-[#86868b] hover:text-white data-[state=active]:bg-white data-[state=active]:text-black transition-all"
              >
                {isLabel ? `Alle Label Releases (${userTracks.length})` : `Tracks (${userTracks.length})`}
              </TabsTrigger>
              <TabsTrigger
                value="about"
                className="rounded-full px-4 py-1.5 text-xs font-medium text-[#86868b] hover:text-white data-[state=active]:bg-white data-[state=active]:text-black transition-all"
              >
                Over {user.displayName}
              </TabsTrigger>
              <TabsTrigger
                value="likes"
                className="rounded-full px-4 py-1.5 text-xs font-medium text-[#86868b] hover:text-white data-[state=active]:bg-white data-[state=active]:text-black transition-all"
              >
                Likes ({likedTracks.length})
              </TabsTrigger>
              <TabsTrigger
                value="reposts"
                className="rounded-full px-4 py-1.5 text-xs font-medium text-[#86868b] hover:text-white data-[state=active]:bg-white data-[state=active]:text-black transition-all"
              >
                Herplaatst ({repostedTracks.length})
              </TabsTrigger>
              <TabsTrigger
                value="playlists"
                className="rounded-full px-4 py-1.5 text-xs font-medium text-[#86868b] hover:text-white data-[state=active]:bg-white data-[state=active]:text-black transition-all"
              >
                Afspeellijsten ({userPlaylists.length})
              </TabsTrigger>
            </TabsList>

            {/* TAB: ROSTER (ONLY FOR RECORD LABELS) */}
            {isLabel && (
              <TabsContent value="roster" className="space-y-6">
                <div className="p-6 sm:p-8 rounded-3xl bg-[#161617]/90 border border-white/[0.08] backdrop-blur-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-white flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-amber-400" />
                      Officiële Zheavenzy Records Artiesten Roster
                    </h2>
                    <p className="text-sm text-[#86868b] mt-1 max-w-2xl leading-relaxed">
                      Ontdek alle 11 getekende artiesten op Zheavenzy. Van rauwe straatrap en drill tot zwoele R&B, futuristic melodic trap en krachtige pop anthems. Klik op een artiest om naar hun eigen profielpagina te gaan.
                    </p>
                  </div>
                  <Button
                    variant="apple"
                    className="rounded-full px-6 font-semibold shrink-0"
                    onClick={handlePlayAll}
                  >
                    <Play className="w-4 h-4 mr-2 fill-black" />
                    Speel Roster Releases
                  </Button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {signedArtists.map((artist) => (
                    <div
                      key={artist.id}
                      className="p-5 rounded-3xl bg-[#161617]/90 border border-white/[0.08] hover:border-white/20 transition-all flex flex-col justify-between group shadow-lg"
                    >
                      <div>
                        <div className="relative mb-3 flex justify-center">
                          <Avatar className="w-24 h-24 ring-2 ring-white/10 group-hover:ring-white/25 transition-all">
                            <AvatarImage src={artist.avatarUrl} alt={artist.displayName} />
                            <AvatarFallback className="bg-[#1c1c1e] text-white">{artist.displayName[0]}</AvatarFallback>
                          </Avatar>
                          <span className="absolute bottom-0 right-1/2 translate-x-8 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white text-black shadow">
                            Artist
                          </span>
                        </div>
                        <div className="text-center">
                          <h3 className="font-semibold text-base text-white group-hover:text-white transition-colors">
                            {artist.displayName}
                          </h3>
                          <p className="text-xs text-[#fa233b] font-medium mt-0.5">
                            {artist.genre || 'Zheavenzy Artist'}
                          </p>
                          <p className="text-xs text-[#86868b] mt-2 line-clamp-2 leading-relaxed">
                            {artist.bio}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-white/[0.08] flex items-center justify-between">
                        <span className="text-xs text-[#86868b]">
                          {artist.followersCount.toLocaleString()} volgers
                        </span>
                        <Button
                          size="sm"
                          variant="secondary"
                          className="rounded-full text-xs h-8 px-3.5 bg-[#1c1c1e] text-white hover:bg-[#2c2c2e] border border-white/[0.08] transition-colors"
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
                      variant="apple"
                      className="rounded-full px-6 font-semibold"
                      onClick={handlePlayAll}
                    >
                      <Play className="w-4 h-4 mr-2 fill-black" />
                      Speel Alles Af
                    </Button>
                    <Button
                      variant="secondary"
                      className="rounded-full px-5 bg-[#1c1c1e] text-white hover:bg-[#2c2c2e] border border-white/[0.08]"
                      onClick={handleShuffleTracks}
                    >
                      <Shuffle className="w-4 h-4 mr-2" />
                      Shuffle Nummers
                    </Button>
                  </div>
                  <div className="rounded-3xl bg-[#161617]/90 border border-white/[0.08] divide-y divide-white/[0.04] overflow-hidden backdrop-blur-2xl">
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
                <div className="text-center py-16 bg-[#161617]/50 rounded-3xl border border-white/[0.08]">
                  <p className="text-[#86868b] text-sm">Nog geen tracks geüpload.</p>
                  {isOwnProfile && (
                    <Button asChild variant="apple" className="mt-4 rounded-full px-6 font-semibold">
                      <Link to="/upload">Upload je eerste track</Link>
                    </Button>
                  )}
                </div>
              )}
            </TabsContent>

            {/* TAB: ABOUT (OVER DE ARTIEST OF HET LABEL) */}
            <TabsContent value="about" className="space-y-6">
              <div className="p-6 sm:p-8 rounded-3xl bg-[#161617]/90 border border-white/[0.08] backdrop-blur-2xl space-y-6">
                <div>
                  <h3 className="text-lg font-semibold tracking-tight text-white mb-2">Biografie</h3>
                  <p className="text-sm text-[#86868b] leading-relaxed whitespace-pre-wrap">
                    {user.bio || 'Geen biografie beschikbaar.'}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-4 border-t border-white/[0.08]">
                  {user.genre && (
                    <div className="p-4 rounded-2xl bg-[#1c1c1e]/60 border border-white/[0.08]">
                      <p className="text-xs text-[#86868b]">Muziekstijl / Focus</p>
                      <p className="text-sm font-semibold text-white mt-0.5">{user.genre}</p>
                    </div>
                  )}
                  {user.location && (
                    <div className="p-4 rounded-2xl bg-[#1c1c1e]/60 border border-white/[0.08]">
                      <p className="text-xs text-[#86868b]">Locatie</p>
                      <p className="text-sm font-semibold text-white mt-0.5">{user.location}</p>
                    </div>
                  )}
                  {user.labelName && !isLabel && (
                    <div className="p-4 rounded-2xl bg-[#1c1c1e]/60 border border-white/[0.08]">
                      <p className="text-xs text-[#86868b]">Platenlabel</p>
                      <Link
                        to={`/label/${user.labelId || 'zheavenzy'}`}
                        className="text-sm font-semibold text-white hover:underline flex items-center gap-1.5 mt-0.5"
                      >
                        <Building2 className="w-3.5 h-3.5 text-[#fa233b]" />
                        {user.labelName} Records
                      </Link>
                    </div>
                  )}
                  {isLabel && (
                    <div className="p-4 rounded-2xl bg-[#1c1c1e]/60 border border-white/[0.08]">
                      <p className="text-xs text-[#86868b]">Getekende Artiesten</p>
                      <p className="text-sm font-semibold text-white mt-0.5">
                        {signedArtists.length} Artiesten op het Roster
                      </p>
                    </div>
                  )}
                </div>

                {/* If artist signed to Zheavenzy, show fellow label family info */}
                {user.labelName === 'Zheavenzy' && !isLabel && (
                  <div className="p-5 rounded-2xl bg-[#1c1c1e]/70 border border-white/[0.08] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white font-bold shrink-0">
                        Z
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-white">Deel van de Zheavenzy Familie</h4>
                        <p className="text-xs text-[#86868b]">
                          {user.displayName} brengt officiële releases uit onder Zheavenzy Records.
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="rounded-full bg-[#161617] text-white hover:bg-[#242426] border border-white/[0.08] text-xs shrink-0"
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
                    <p className="text-sm text-[#86868b]">
                      Nummers geliked door <span className="text-white font-medium">{user.displayName}</span>
                    </p>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="rounded-full bg-[#1c1c1e] text-white hover:bg-[#2c2c2e] border border-white/[0.08]"
                      onClick={() => shufflePlayQueue(likedTracks)}
                    >
                      <Shuffle className="w-3.5 h-3.5 mr-1.5" />
                      Shuffle Likes
                    </Button>
                  </div>
                  <div className="rounded-3xl bg-[#161617]/90 border border-white/[0.08] divide-y divide-white/[0.04] overflow-hidden backdrop-blur-2xl">
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
                <div className="text-center py-16 bg-[#161617]/50 rounded-3xl border border-white/[0.08]">
                  <Heart className="w-10 h-10 mx-auto mb-2 text-[#86868b]/40" />
                  <p className="text-[#86868b] text-sm">Nog geen gelikete nummers zichtbaar.</p>
                  <p className="text-xs text-[#86868b] mt-1">
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
                    <p className="text-sm text-[#86868b]">
                      Nummers herplaatst door <span className="text-white font-medium">{user.displayName}</span>
                    </p>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="rounded-full bg-[#1c1c1e] text-white hover:bg-[#2c2c2e] border border-white/[0.08]"
                      onClick={() => shufflePlayQueue(repostedTracks)}
                    >
                      <Shuffle className="w-3.5 h-3.5 mr-1.5" />
                      Shuffle Herplaatst
                    </Button>
                  </div>
                  <div className="rounded-3xl bg-[#161617]/90 border border-white/[0.08] divide-y divide-white/[0.04] overflow-hidden backdrop-blur-2xl">
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
                <div className="text-center py-16 bg-[#161617]/50 rounded-3xl border border-white/[0.08]">
                  <Repeat2 className="w-10 h-10 mx-auto mb-2 text-[#86868b]/40" />
                  <p className="text-[#86868b] text-sm">Nog geen herplaatste nummers.</p>
                  <p className="text-xs text-[#86868b] mt-1">
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
                      className="rounded-3xl overflow-hidden hover:-translate-y-1 transition-all bg-[#161617]/90 border border-white/[0.08] hover:border-white/20 group shadow-lg"
                    >
                      <div className="w-full aspect-square overflow-hidden bg-[#1c1c1e]">
                        <TrackCover playlist={playlist} showBadge />
                      </div>
                      <div className="p-4">
                        <h3 className="font-semibold text-sm text-white group-hover:text-white transition-colors">
                          {playlist.title}
                        </h3>
                        <p className="text-xs text-[#86868b] mt-1">
                          {playlist.tracksCount} tracks
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 bg-[#161617]/50 rounded-3xl border border-white/[0.08]">
                  <p className="text-[#86868b] text-sm">Geen afspeellijsten gevonden.</p>
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
      {canEdit && (
        <Dialog open={isEditProfileOpen} onOpenChange={setIsEditProfileOpen}>
          <DialogContent className="sm:max-w-2xl bg-[#161617]/95 border-white/10 text-white rounded-3xl backdrop-blur-3xl shadow-[0_25px_70px_rgba(0,0,0,0.85)] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold tracking-tight flex items-center gap-2 text-white">
                <Edit3 className="w-5 h-5 text-[#fa233b]" />
                {isAdmin && !isOwnProfile
                  ? (isLabel ? `Record Label Beheren (Admin - ${user.displayName})` : `Artiest Profiel Bewerken (Admin - ${user.displayName})`)
                  : 'Profiel Bewerken'}
              </DialogTitle>
              <DialogDescription className="text-sm text-[#86868b]">
                {isAdmin && !isOwnProfile
                  ? 'Pas alle platformgegevens, verificatie, volgers, bio, socials en labelkoppelingen aan.'
                  : 'Pas je artiestennaam, biografie, visual branding en sociale media koppelingen aan.'}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSaveProfile} className="space-y-4 pt-2">
              {/* ADMIN CONTROL PANEL */}
              {isAdmin && (
                <div className="p-4 rounded-2xl bg-amber-500/[0.06] border border-amber-500/25 space-y-3.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-amber-300 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-amber-400" />
                      Admin Beheerdersinstellingen
                    </span>
                    <span className="text-[10px] text-amber-400/80 bg-amber-400/10 px-2 py-0.5 rounded-full font-mono">
                      admin access
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-medium text-[#86868b]">Account Plan / Rol</label>
                      <select
                        value={editPlan}
                        onChange={(e) => setEditPlan(e.target.value as 'gebruiker' | 'artiest' | 'label')}
                        className="w-full h-9 rounded-xl bg-[#1c1c1e] border border-white/10 text-xs text-white px-3 focus:outline-none focus:ring-1 focus:ring-amber-500/50"
                      >
                        <option value="artiest">Artiest (Muzikant)</option>
                        <option value="label">Label (Platenlabel)</option>
                        <option value="gebruiker">Gebruiker (Luisteraar)</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-medium text-[#86868b]">Aantal Volgers</label>
                      <Input
                        type="number"
                        value={editFollowersCount}
                        onChange={(e) => setEditFollowersCount(e.target.value)}
                        placeholder="Bijv. 18500"
                        className="h-9 rounded-xl bg-[#1c1c1e] border-white/10 text-white placeholder:text-[#86868b] text-xs font-mono"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-medium text-[#86868b]">Status Verificatie</label>
                      <button
                        type="button"
                        onClick={() => setEditVerified(!editVerified)}
                        className={`w-full h-9 rounded-xl border text-xs font-medium flex items-center justify-center gap-1.5 transition-colors ${
                          editVerified
                            ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                            : 'bg-[#1c1c1e] border-white/10 text-[#86868b] hover:text-white'
                        }`}
                      >
                        <CheckCircle2 className={`w-3.5 h-3.5 ${editVerified ? 'text-emerald-400' : 'text-[#86868b]'}`} />
                        <span>{editVerified ? 'Geverifieerd Vinkje' : 'Niet Geverifieerd'}</span>
                      </button>
                    </div>
                  </div>

                  {/* LABEL ROSTER MULTI-SELECT (FOR LABELS) */}
                  {(editPlan === 'label' || user.id === 'zheavenzy') ? (
                    <div className="space-y-2 pt-2 border-t border-amber-500/20">
                      <label className="text-[11px] font-semibold text-white flex items-center justify-between">
                        <span>Getekende Artiesten Roster ({editSignedArtistIds.length} getekend)</span>
                        <span className="text-[10px] text-[#86868b]">Klik om toe te voegen / verwijderen</span>
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-40 overflow-y-auto p-1 bg-black/40 rounded-xl border border-white/5">
                        {mockUsers
                          .filter((u) => u.id !== user.id && (u.plan === 'artiest' || u.labelId === 'zheavenzy' || u.id === 'jamal-drenthe'))
                          .map((artist) => {
                            const isSigned = editSignedArtistIds.includes(artist.id);
                            return (
                              <button
                                key={artist.id}
                                type="button"
                                onClick={() => toggleSignedArtist(artist.id)}
                                className={`flex items-center gap-2 p-1.5 rounded-lg text-left text-xs transition-all border ${
                                  isSigned
                                    ? 'bg-[#fa233b]/15 border-[#fa233b]/40 text-white font-medium shadow-sm'
                                    : 'bg-[#1c1c1e]/60 border-transparent text-[#86868b] hover:text-white hover:bg-[#1c1c1e]'
                                }`}
                              >
                                <Avatar className="w-5 h-5 shrink-0 ring-1 ring-white/10">
                                  <AvatarImage src={artist.avatarUrl} />
                                  <AvatarFallback className="text-[9px]">{artist.displayName[0]}</AvatarFallback>
                                </Avatar>
                                <span className="truncate flex-1">{artist.displayName}</span>
                                {isSigned && <CheckCircle2 className="w-3 h-3 text-[#fa233b] shrink-0" />}
                              </button>
                            );
                          })}
                      </div>
                    </div>
                  ) : (
                    /* LABEL AFFILIATION (FOR ARTISTS) */
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-amber-500/20">
                      <div className="space-y-1">
                        <label className="text-[11px] font-medium text-[#86868b]">Getekend bij Label (Naam)</label>
                        <Input
                          value={editLabelName}
                          onChange={(e) => setEditLabelName(e.target.value)}
                          placeholder="Bijv. Zheavenzy"
                          className="h-9 rounded-xl bg-[#1c1c1e] border-white/10 text-white placeholder:text-[#86868b] text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[11px] font-medium text-[#86868b]">Label Slug ID</label>
                        <Input
                          value={editLabelId}
                          onChange={(e) => setEditLabelId(e.target.value)}
                          placeholder="Bijv. zheavenzy"
                          className="h-9 rounded-xl bg-[#1c1c1e] border-white/10 text-white placeholder:text-[#86868b] text-xs font-mono"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* GENERAL INFO */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[#86868b]">Artiest / Label Display Naam</label>
                  <Input
                    value={editDisplayName}
                    onChange={(e) => setEditDisplayName(e.target.value)}
                    placeholder="Bijv. Askylon"
                    className="rounded-xl bg-[#1c1c1e] border-white/10 text-white placeholder:text-[#86868b]"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[#86868b]">Gebruikersnaam / URL Slug</label>
                  <Input
                    value={editUsername}
                    onChange={(e) => setEditUsername(e.target.value)}
                    placeholder="Bijv. askylon"
                    className="rounded-xl bg-[#1c1c1e] border-white/10 text-white placeholder:text-[#86868b] font-mono text-xs"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[#86868b]">Muziekgenre / Stijl</label>
                  <Input
                    value={editGenre}
                    onChange={(e) => setEditGenre(e.target.value)}
                    placeholder="Bijv. Trap / Cyberwave"
                    className="rounded-xl bg-[#1c1c1e] border-white/10 text-white placeholder:text-[#86868b] text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[#86868b]">Locatie / Stad</label>
                  <Input
                    value={editLocation}
                    onChange={(e) => setEditLocation(e.target.value)}
                    placeholder="Bijv. Amsterdam / Nederland"
                    className="rounded-xl bg-[#1c1c1e] border-white/10 text-white placeholder:text-[#86868b] text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-[#86868b]">Website URL</label>
                  <Input
                    value={editWebsite}
                    onChange={(e) => setEditWebsite(e.target.value)}
                    placeholder="https://zheavenzy.com"
                    className="rounded-xl bg-[#1c1c1e] border-white/10 text-white placeholder:text-[#86868b] text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-[#86868b]">Biografie & Omschrijving</label>
                <Textarea
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  placeholder="Vertel over de sound, achtergrond en discografie..."
                  rows={3}
                  className="rounded-xl bg-[#1c1c1e] border-white/10 text-white placeholder:text-[#86868b] resize-none text-xs leading-relaxed"
                />
              </div>

              {/* VISUAL BRANDING & IMAGE URLS */}
              <div className="space-y-3 pt-2 border-t border-white/[0.08]">
                <h4 className="text-xs font-semibold text-white flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-white" />
                  Visual Branding & Afbeeldingen
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] text-[#86868b]">Profielfoto URL</label>
                      <button
                        type="button"
                        onClick={() => avatarInputRef.current?.click()}
                        className="text-[11px] text-[#fa233b] hover:underline flex items-center gap-1"
                      >
                        <Camera className="w-3 h-3" />
                        Bestand Uploaden
                      </button>
                    </div>
                    <Input
                      value={editAvatarUrl}
                      onChange={(e) => setEditAvatarUrl(e.target.value)}
                      placeholder="https://..."
                      className="rounded-xl bg-[#1c1c1e] border-white/10 text-white placeholder:text-[#86868b] text-xs font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] text-[#86868b]">Horizontale Banner URL</label>
                      <button
                        type="button"
                        onClick={() => bannerInputRef.current?.click()}
                        className="text-[11px] text-[#fa233b] hover:underline flex items-center gap-1"
                      >
                        <ImageIcon className="w-3 h-3" />
                        Bestand Uploaden
                      </button>
                    </div>
                    <Input
                      value={editBannerUrl}
                      onChange={(e) => setEditBannerUrl(e.target.value)}
                      placeholder="https://..."
                      className="rounded-xl bg-[#1c1c1e] border-white/10 text-white placeholder:text-[#86868b] text-xs font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Socials Section */}
              <div className="space-y-3 pt-2 border-t border-white/[0.08]">
                <h4 className="text-xs font-semibold text-white flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-white" />
                  Social Media Links
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] text-[#86868b]">TikTok (@gebruikersnaam of url)</label>
                    <Input
                      value={editSocials.tiktok || ''}
                      onChange={(e) => setEditSocials({ ...editSocials, tiktok: e.target.value })}
                      placeholder="@jouw_tiktok"
                      className="rounded-xl bg-[#1c1c1e] border-white/10 text-white placeholder:text-[#86868b] text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] text-[#86868b]">Instagram (@gebruikersnaam of url)</label>
                    <Input
                      value={editSocials.instagram || ''}
                      onChange={(e) => setEditSocials({ ...editSocials, instagram: e.target.value })}
                      placeholder="@jouw_instagram"
                      className="rounded-xl bg-[#1c1c1e] border-white/10 text-white placeholder:text-[#86868b] text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] text-[#86868b]">YouTube (@kanaal of url)</label>
                    <Input
                      value={editSocials.youtube || ''}
                      onChange={(e) => setEditSocials({ ...editSocials, youtube: e.target.value })}
                      placeholder="@jouw_youtube"
                      className="rounded-xl bg-[#1c1c1e] border-white/10 text-white placeholder:text-[#86868b] text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] text-[#86868b]">X / Twitter (@handle)</label>
                    <Input
                      value={editSocials.x || ''}
                      onChange={(e) => setEditSocials({ ...editSocials, x: e.target.value })}
                      placeholder="@jouw_x"
                      className="rounded-xl bg-[#1c1c1e] border-white/10 text-white placeholder:text-[#86868b] text-xs"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <Button type="button" variant="ghost" className="rounded-full text-[#86868b] hover:text-white hover:bg-white/10" onClick={() => setIsEditProfileOpen(false)}>
                  Annuleren
                </Button>
                <Button type="submit" variant="apple" className="rounded-full px-6 font-semibold">
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
