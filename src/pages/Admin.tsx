import { useState, useEffect, useMemo } from 'react';
import { Link, Navigate } from 'react-router-dom';
import {
  Users,
  Music,
  Flag,
  TrendingUp,
  UserX,
  Trash2,
  CheckCircle,
  XCircle,
  Edit3,
  Building2,
  Music2,
  CheckCircle2,
  ShieldCheck,
  Search,
  Globe,
  Image as ImageIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Navbar } from '@/components/Navbar';
import { AudioPlayer } from '@/components/AudioPlayer';
import { TrackCover } from '@/components/TrackCover';
import { useAuth } from '@/context/AuthContext';
import { mockTracks, getUserById, getAllUsers, deleteMockUser } from '@/data/mockData';
import type { User, UserSocials } from '@/types';
import { toast } from 'sonner';

// Mock reports
const mockReports = [
  {
    id: '1',
    reporterId: '2',
    reportedType: 'track' as const,
    reportedId: '5',
    reason: 'Inappropriate content',
    status: 'pending' as const,
    createdAt: '2024-12-14T10:00:00Z',
  },
  {
    id: '2',
    reporterId: '3',
    reportedType: 'comment' as const,
    reportedId: '1',
    reason: 'Spam',
    status: 'resolved' as const,
    createdAt: '2024-12-13T15:00:00Z',
  },
];

export function Admin() {
  const { user, isAuthenticated, adminUpdateUser } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  // User list state
  const [userList, setUserList] = useState<User[]>(() => getAllUsers());
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [userFilterRole, setUserFilterRole] = useState<'all' | 'label' | 'artiest' | 'user'>('all');

  // Edit user dialog state
  const [editingUser, setEditingUser] = useState<User | null>(null);
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

  // Sync users on custom event
  useEffect(() => {
    const handler = () => {
      setUserList(getAllUsers());
    };
    window.addEventListener('cloudiaudi:users_updated', handler);
    return () => window.removeEventListener('cloudiaudi:users_updated', handler);
  }, []);

  // Redirect if not admin
  if (!isAuthenticated || user?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  const stats = {
    totalUsers: userList.length,
    totalLabels: userList.filter((u) => u.plan === 'label' || u.id === 'zheavenzy').length,
    totalArtists: userList.filter((u) => u.plan === 'artiest' && u.id !== 'zheavenzy').length,
    totalTracks: mockTracks.length,
    totalPlays: mockTracks.reduce((acc, t) => acc + t.playsCount, 0),
    pendingReports: mockReports.filter((r) => r.status === 'pending').length,
  };

  const filteredUsers = useMemo(() => {
    return userList.filter((u) => {
      if (userSearchQuery.trim()) {
        const q = userSearchQuery.toLowerCase();
        const match =
          u.displayName.toLowerCase().includes(q) ||
          u.username.toLowerCase().includes(q) ||
          (u.genre && u.genre.toLowerCase().includes(q)) ||
          (u.location && u.location.toLowerCase().includes(q));
        if (!match) return false;
      }
      if (userFilterRole === 'label') return u.plan === 'label' || u.id === 'zheavenzy';
      if (userFilterRole === 'artiest') return u.plan === 'artiest' && u.id !== 'zheavenzy';
      if (userFilterRole === 'user') return u.plan !== 'label' && u.plan !== 'artiest' && u.id !== 'zheavenzy';
      return true;
    });
  }, [userList, userSearchQuery, userFilterRole]);

  const handleOpenEdit = (targetUser: User) => {
    setEditingUser(targetUser);
    setEditDisplayName(targetUser.displayName || '');
    setEditUsername(targetUser.username || '');
    setEditBio(targetUser.bio || '');
    setEditGenre(targetUser.genre || '');
    setEditLocation(targetUser.location || '');
    setEditWebsite(targetUser.website || '');
    setEditPlan(targetUser.plan || (targetUser.id === 'zheavenzy' ? 'label' : 'artiest'));
    setEditVerified(Boolean(targetUser.verified));
    setEditFollowersCount(targetUser.followersCount || 0);
    setEditLabelName(targetUser.labelName || 'Zheavenzy');
    setEditLabelId(targetUser.labelId || 'zheavenzy');
    setEditSignedArtistIds(
      targetUser.signedArtistIds && targetUser.signedArtistIds.length > 0
        ? [...targetUser.signedArtistIds]
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
    setEditAvatarUrl(targetUser.avatarUrl || '');
    setEditBannerUrl(targetUser.bannerUrl || '');
    setEditSocials(targetUser.socials || {});
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    try {
      const cleanUsername = editUsername.trim().toLowerCase().replace(/^@/, '');
      const updates: Partial<User> = {
        displayName: editDisplayName.trim() || editingUser.displayName,
        username: cleanUsername || editingUser.username,
        bio: editBio.trim(),
        genre: editGenre.trim() || undefined,
        location: editLocation.trim() || undefined,
        website: editWebsite.trim() || undefined,
        plan: editPlan,
        verified: editVerified,
        followersCount: Math.max(0, parseInt(String(editFollowersCount), 10) || 0),
        avatarUrl: editAvatarUrl.trim() || editingUser.avatarUrl,
        bannerUrl: editBannerUrl.trim() || editingUser.bannerUrl,
        socials: editSocials,
      };

      if (editPlan === 'label' || editingUser.id === 'zheavenzy') {
        updates.signedArtistIds = editSignedArtistIds;
      } else {
        updates.labelName = editLabelName.trim() || undefined;
        updates.labelId = editLabelId.trim() || undefined;
      }

      const res = await adminUpdateUser(editingUser.id, updates);
      if (res) {
        setUserList(getAllUsers());
      }
      setEditingUser(null);
      toast.success(`Profiel van "${updates.displayName || editingUser.displayName}" succesvol bijgewerkt!`);
    } catch (err) {
      console.error(err);
      toast.error('Fout bij het opslaan van profiel');
    }
  };

  const toggleSignedArtist = (artistId: string) => {
    setEditSignedArtistIds((prev) =>
      prev.includes(artistId) ? prev.filter((id) => id !== artistId) : [...prev, artistId]
    );
  };

  const handleDeleteUser = (userId: string, name: string) => {
    if (window.confirm(`Weet je zeker dat je het profiel van "${name}" wilt verwijderen?`)) {
      const ok = deleteMockUser(userId);
      if (ok) {
        setUserList(getAllUsers());
        toast.success(`Profiel "${name}" verwijderd`);
      } else {
        toast.error('Kon profiel niet verwijderen');
      }
    }
  };

  return (
    <div className="min-h-screen bg-black text-[#f5f5f7] pb-24">
      <Navbar />
      <main className="pt-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-white">Admin Panel</h1>
              <p className="text-[#86868b] mt-1 text-sm">Artiesten, labels & platform beheer</p>
            </div>
            <span className="px-3.5 py-1 rounded-full bg-white/10 text-white border border-white/15 text-xs font-medium flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              Admin Access
            </span>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6 p-1 rounded-full bg-[#1c1c1e]/90 border border-white/[0.08] backdrop-blur-xl flex-wrap h-auto gap-1">
              <TabsTrigger
                value="overview"
                className="rounded-full px-4 py-1.5 text-xs font-medium text-[#86868b] hover:text-white data-[state=active]:bg-white data-[state=active]:text-black transition-all"
              >
                Overview
              </TabsTrigger>
              <TabsTrigger
                value="users"
                className="rounded-full px-4 py-1.5 text-xs font-medium text-[#86868b] hover:text-white data-[state=active]:bg-white data-[state=active]:text-black transition-all flex items-center gap-1.5"
              >
                <span>Artiesten & Labels</span>
                <span className="px-2 py-0.2 text-[10px] bg-white/15 rounded-full font-bold">
                  {userList.length}
                </span>
              </TabsTrigger>
              <TabsTrigger
                value="tracks"
                className="rounded-full px-4 py-1.5 text-xs font-medium text-[#86868b] hover:text-white data-[state=active]:bg-white data-[state=active]:text-black transition-all"
              >
                Tracks
              </TabsTrigger>
              <TabsTrigger
                value="reports"
                className="rounded-full px-4 py-1.5 text-xs font-medium text-[#86868b] hover:text-white data-[state=active]:bg-white data-[state=active]:text-black transition-all flex items-center gap-1.5"
              >
                <span>Reports</span>
                {stats.pendingReports > 0 && (
                  <span className="px-1.5 py-0.2 text-[10px] bg-[#fa233b] text-white rounded-full font-bold">
                    {stats.pendingReports}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>

            {/* TAB 1: OVERVIEW */}
            <TabsContent value="overview">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <div className="p-6 rounded-3xl bg-[#161617]/90 border border-white/[0.08] backdrop-blur-2xl shadow-lg">
                  <div className="flex items-center justify-between pb-2">
                    <span className="text-xs font-medium text-[#86868b]">Profielen & Accounts</span>
                    <Users className="w-4 h-4 text-[#86868b]" />
                  </div>
                  <div className="text-3xl font-bold tracking-tight text-white mt-1">{stats.totalUsers}</div>
                  <p className="text-xs text-amber-400 mt-1 font-medium">
                    {stats.totalLabels} Labels • {stats.totalArtists} Artiesten
                  </p>
                </div>

                <div className="p-6 rounded-3xl bg-[#161617]/90 border border-white/[0.08] backdrop-blur-2xl shadow-lg">
                  <div className="flex items-center justify-between pb-2">
                    <span className="text-xs font-medium text-[#86868b]">Total Tracks</span>
                    <Music className="w-4 h-4 text-[#86868b]" />
                  </div>
                  <div className="text-3xl font-bold tracking-tight text-white mt-1">{stats.totalTracks}</div>
                  <p className="text-xs text-[#86868b] mt-1">23 Zheavenzy releases</p>
                </div>

                <div className="p-6 rounded-3xl bg-[#161617]/90 border border-white/[0.08] backdrop-blur-2xl shadow-lg">
                  <div className="flex items-center justify-between pb-2">
                    <span className="text-xs font-medium text-[#86868b]">Total Plays</span>
                    <TrendingUp className="w-4 h-4 text-[#86868b]" />
                  </div>
                  <div className="text-3xl font-bold tracking-tight text-white mt-1">
                    {(stats.totalPlays / 1000).toFixed(1)}K
                  </div>
                  <p className="text-xs text-[#86868b] mt-1">Populaire cyphers & singles</p>
                </div>

                <div className="p-6 rounded-3xl bg-[#161617]/90 border border-white/[0.08] backdrop-blur-2xl shadow-lg">
                  <div className="flex items-center justify-between pb-2">
                    <span className="text-xs font-medium text-[#86868b]">Pending Reports</span>
                    <Flag className="w-4 h-4 text-[#86868b]" />
                  </div>
                  <div className="text-3xl font-bold tracking-tight text-white mt-1">{stats.pendingReports}</div>
                  <p className="text-xs text-[#86868b] mt-1">Geen dringende meldingen</p>
                </div>
              </div>
            </TabsContent>

            {/* TAB 2: USER, ARTIST & LABEL MANAGEMENT */}
            <TabsContent value="users">
              <div className="p-6 sm:p-8 rounded-3xl bg-[#161617]/90 border border-white/[0.08] backdrop-blur-2xl space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-semibold tracking-tight text-white">
                      Artiesten- & Label Beheer
                    </h2>
                    <p className="text-xs text-[#86868b] mt-0.5">
                      Beheer en bewerk alle artiesten, labels, geverifieerde badges en visual branding.
                    </p>
                  </div>

                  {/* Filter Pills */}
                  <div className="flex items-center gap-1.5 p-1 rounded-full bg-[#1c1c1e] border border-white/10 self-stretch sm:self-auto overflow-x-auto">
                    <button
                      onClick={() => setUserFilterRole('all')}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                        userFilterRole === 'all'
                          ? 'bg-white text-black font-semibold shadow-sm'
                          : 'text-[#86868b] hover:text-white'
                      }`}
                    >
                      Alle ({userList.length})
                    </button>
                    <button
                      onClick={() => setUserFilterRole('label')}
                      className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 transition-all ${
                        userFilterRole === 'label'
                          ? 'bg-amber-400 text-black font-semibold shadow-sm'
                          : 'text-[#86868b] hover:text-white'
                      }`}
                    >
                      <Building2 className="w-3 h-3" />
                      Labels ({stats.totalLabels})
                    </button>
                    <button
                      onClick={() => setUserFilterRole('artiest')}
                      className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 transition-all ${
                        userFilterRole === 'artiest'
                          ? 'bg-[#fa233b] text-white font-semibold shadow-sm'
                          : 'text-[#86868b] hover:text-white'
                      }`}
                    >
                      <Music2 className="w-3 h-3" />
                      Artiesten ({stats.totalArtists})
                    </button>
                    <button
                      onClick={() => setUserFilterRole('user')}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                        userFilterRole === 'user'
                          ? 'bg-white text-black font-semibold shadow-sm'
                          : 'text-[#86868b] hover:text-white'
                      }`}
                    >
                      Gebruikers
                    </button>
                  </div>
                </div>

                {/* Search Bar */}
                <div className="relative">
                  <Search className="w-4 h-4 text-[#86868b] absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <Input
                    value={userSearchQuery}
                    onChange={(e) => setUserSearchQuery(e.target.value)}
                    placeholder="Zoek op naam, @handle, genre of stad..."
                    className="pl-10 h-10 rounded-2xl bg-[#1c1c1e]/80 border-white/10 text-white placeholder:text-[#86868b] text-xs"
                  />
                </div>

                {/* Users Table / List */}
                <div className="space-y-3 pt-1">
                  {filteredUsers.length === 0 ? (
                    <div className="text-center py-12 rounded-2xl bg-[#1c1c1e]/40 border border-white/5">
                      <p className="text-sm text-[#86868b]">Geen profielen gevonden die voldoen aan je zoekopdracht.</p>
                    </div>
                  ) : (
                    filteredUsers.map((item) => {
                      const isLabel = item.plan === 'label' || item.id === 'zheavenzy';
                      const isArtist = item.plan === 'artiest' && item.id !== 'zheavenzy';
                      const isAdminRole = item.role === 'admin';

                      return (
                        <div
                          key={item.id}
                          className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-[#1c1c1e]/70 border border-white/[0.06] rounded-2xl hover:border-white/15 transition-all gap-4"
                        >
                          <div className="flex items-center gap-3.5 min-w-0">
                            <Avatar className="w-12 h-12 ring-1 ring-white/10 bg-[#1c1c1e] shrink-0">
                              <AvatarImage src={item.avatarUrl} alt={item.displayName} />
                              <AvatarFallback className="bg-[#1c1c1e] text-white font-medium">
                                {item.displayName[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <Link
                                  to={`/user/${item.id}`}
                                  className="font-medium text-white hover:underline transition-colors text-sm truncate"
                                >
                                  {item.displayName}
                                </Link>

                                {item.verified && (
                                  <span title="Geverifieerd" className="text-emerald-400">
                                    <CheckCircle2 className="w-3.5 h-3.5 inline" />
                                  </span>
                                )}

                                {isLabel ? (
                                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                                    <Building2 className="w-2.5 h-2.5 text-amber-400" />
                                    Record Label
                                  </span>
                                ) : isArtist ? (
                                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-[#fa233b]/15 text-[#fa233b] border border-[#fa233b]/30 flex items-center gap-1">
                                    <Music2 className="w-2.5 h-2.5" />
                                    Artiest
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-white/[0.08] text-[#86868b] capitalize">
                                    {item.plan || 'Gebruiker'}
                                  </span>
                                )}

                                {isAdminRole && (
                                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/10 text-white border border-white/20">
                                    Admin
                                  </span>
                                )}
                              </div>

                              <p className="text-xs text-[#86868b] mt-1 flex items-center gap-2 flex-wrap">
                                <span className="font-mono">@{item.username}</span>
                                <span>•</span>
                                <span>{(item.followersCount || 0).toLocaleString()} volgers</span>
                                {item.genre && (
                                  <>
                                    <span>•</span>
                                    <span className="text-white/80">{item.genre}</span>
                                  </>
                                )}
                                {item.labelName && !isLabel && (
                                  <>
                                    <span>•</span>
                                    <span className="text-[#fa233b]">Label: {item.labelName}</span>
                                  </>
                                )}
                                {isLabel && item.signedArtistIds && (
                                  <>
                                    <span>•</span>
                                    <span className="text-amber-300 font-medium">
                                      {item.signedArtistIds.length} artiesten in roster
                                    </span>
                                  </>
                                )}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                            {/* Aanpassen Button */}
                            <Button
                              onClick={() => handleOpenEdit(item)}
                              variant="secondary"
                              size="sm"
                              className="rounded-full bg-white/10 hover:bg-white/15 text-white border border-white/15 text-xs px-3.5 flex items-center gap-1.5 transition-all"
                            >
                              <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                              <span>Aanpassen</span>
                            </Button>

                            {/* View Profile */}
                            <Button
                              asChild
                              variant="secondary"
                              size="sm"
                              className="rounded-full bg-[#1c1c1e] text-white hover:bg-[#2c2c2e] border border-white/[0.08] text-xs px-3.5"
                            >
                              <Link to={`/user/${item.id}`}>Bekijk Pagina</Link>
                            </Button>

                            {/* Delete User */}
                            <Button
                              onClick={() => handleDeleteUser(item.id, item.displayName)}
                              variant="ghost"
                              size="sm"
                              className="rounded-full text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 h-8 w-8 p-0"
                              title="Verwijder profiel"
                            >
                              <UserX className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </TabsContent>

            {/* TAB 3: TRACK MODERATION */}
            <TabsContent value="tracks">
              <div className="p-6 sm:p-8 rounded-3xl bg-[#161617]/90 border border-white/[0.08] backdrop-blur-2xl space-y-4">
                <h2 className="text-xl font-semibold tracking-tight text-white">Track Moderation</h2>
                <div className="space-y-3 pt-2">
                  {mockTracks.map((track) => {
                    const trackUser = getUserById(track.userId);
                    return (
                      <div
                        key={track.id}
                        className="flex items-center justify-between p-4 bg-[#1c1c1e]/70 border border-white/[0.06] rounded-2xl hover:border-white/10 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 bg-[#1c1c1e] shadow-sm">
                            <TrackCover track={track} />
                          </div>
                          <div>
                            <Link
                              to={`/track/${track.id}`}
                              className="font-medium text-white hover:underline transition-colors"
                            >
                              {track.title}
                            </Link>
                            <p className="text-xs text-[#86868b] mt-0.5">
                              by {trackUser?.displayName} • {track.playsCount} plays • {track.genre}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button asChild variant="secondary" size="sm" className="rounded-full bg-[#1c1c1e] text-white hover:bg-[#2c2c2e] border border-white/[0.08] text-xs px-3.5">
                            <Link to={`/track/${track.id}`}>View</Link>
                          </Button>
                          <Button variant="ghost" size="sm" className="rounded-full text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 h-8 w-8 p-0">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </TabsContent>

            {/* TAB 4: CONTENT REPORTS */}
            <TabsContent value="reports">
              <div className="p-6 sm:p-8 rounded-3xl bg-[#161617]/90 border border-white/[0.08] backdrop-blur-2xl space-y-4">
                <h2 className="text-xl font-semibold tracking-tight text-white">Content Reports</h2>
                <div className="space-y-3 pt-2">
                  {mockReports.map((report) => {
                    const reporter = getUserById(report.reporterId);
                    const reportedTrack =
                      report.reportedType === 'track'
                        ? mockTracks.find((t) => t.id === report.reportedId)
                        : null;

                    return (
                      <div
                        key={report.id}
                        className={`p-4 rounded-2xl border transition-colors ${
                          report.status === 'pending'
                            ? 'bg-[#fa233b]/10 border-[#fa233b]/25'
                            : 'bg-[#1c1c1e]/70 border-white/[0.06]'
                        }`}
                      >
                        <div className="flex items-start justify-between flex-wrap gap-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <span
                                className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${
                                  report.status === 'pending'
                                    ? 'bg-[#fa233b]/20 text-[#fa233b] border border-[#fa233b]/30'
                                    : 'bg-white/10 text-white border border-white/15'
                                }`}
                              >
                                {report.status}
                              </span>
                              <span className="text-xs text-[#86868b]">
                                Reported {new Date(report.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="mt-2 text-sm text-white">
                              <span className="font-semibold">{reporter?.displayName}</span>{' '}
                              reported a{' '}
                              <span className="font-semibold text-white/80">{report.reportedType}</span>
                            </p>
                            {reportedTrack && (
                              <p className="text-xs text-[#86868b] mt-0.5">
                                Track: {reportedTrack.title}
                              </p>
                            )}
                            <p className="text-xs text-[#86868b] mt-1">
                              Reason: <span className="italic text-white/80">{report.reason}</span>
                            </p>
                          </div>
                          {report.status === 'pending' && (
                            <div className="flex items-center gap-2">
                              <Button
                                variant="secondary"
                                size="sm"
                                className="rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 hover:bg-emerald-500/25 text-xs px-3"
                              >
                                <CheckCircle className="w-3.5 h-3.5 mr-1" />
                                Dismiss
                              </Button>
                              <Button
                                variant="secondary"
                                size="sm"
                                className="rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/25 hover:bg-rose-500/25 text-xs px-3"
                              >
                                <XCircle className="w-3.5 h-3.5 mr-1" />
                                Remove
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* ADMIN EDIT USER / ARTIST / LABEL DIALOG */}
      {editingUser && (
        <Dialog open={Boolean(editingUser)} onOpenChange={(open) => !open && setEditingUser(null)}>
          <DialogContent className="sm:max-w-2xl bg-[#161617]/95 border-white/10 text-white rounded-3xl backdrop-blur-3xl shadow-[0_25px_70px_rgba(0,0,0,0.85)] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold tracking-tight flex items-center gap-2 text-white">
                <Edit3 className="w-5 h-5 text-amber-400" />
                {editingUser.plan === 'label' || editingUser.id === 'zheavenzy'
                  ? `Record Label Beheren: ${editingUser.displayName}`
                  : `Artiest / Profiel Aanpassen: ${editingUser.displayName}`}
              </DialogTitle>
              <DialogDescription className="text-sm text-[#86868b]">
                Beheer metadata, verificatiestatus, volgers, visuele afbeeldingen en labelcontracten.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSaveEdit} className="space-y-4 pt-2">
              {/* ADMIN PRIVILEGED SETTINGS */}
              <div className="p-4 rounded-2xl bg-amber-500/[0.06] border border-amber-500/25 space-y-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-amber-300 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-amber-400" />
                    Admin Instellingen
                  </span>
                  <span className="text-[10px] text-amber-400/80 bg-amber-400/10 px-2 py-0.5 rounded-full font-mono">
                    ID: {editingUser.id}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-[#86868b]">Account Rol / Plan</label>
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
                    <label className="text-[11px] font-medium text-[#86868b]">Volgers Aantal</label>
                    <Input
                      type="number"
                      value={editFollowersCount}
                      onChange={(e) => setEditFollowersCount(e.target.value)}
                      placeholder="Bijv. 18500"
                      className="h-9 rounded-xl bg-[#1c1c1e] border-white/10 text-white placeholder:text-[#86868b] text-xs font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-[#86868b]">Verificatie Status</label>
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
                {(editPlan === 'label' || editingUser.id === 'zheavenzy') ? (
                  <div className="space-y-2 pt-2 border-t border-amber-500/20">
                    <label className="text-[11px] font-semibold text-white flex items-center justify-between">
                      <span>Getekende Artiesten Roster ({editSignedArtistIds.length} getekend)</span>
                      <span className="text-[10px] text-[#86868b]">Klik om toe te voegen / verwijderen</span>
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-40 overflow-y-auto p-1 bg-black/40 rounded-xl border border-white/5">
                      {userList
                        .filter((u) => u.id !== editingUser.id && (u.plan === 'artiest' || u.labelId === 'zheavenzy' || u.id === 'jamal-drenthe'))
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
                  <label className="text-xs font-medium text-[#86868b]">Gebruikersnaam / Handle (slug)</label>
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
                    <label className="text-[11px] text-[#86868b]">Profielfoto URL</label>
                    <Input
                      value={editAvatarUrl}
                      onChange={(e) => setEditAvatarUrl(e.target.value)}
                      placeholder="https://..."
                      className="rounded-xl bg-[#1c1c1e] border-white/10 text-white placeholder:text-[#86868b] text-xs font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] text-[#86868b]">Horizontale Banner URL</label>
                    <Input
                      value={editBannerUrl}
                      onChange={(e) => setEditBannerUrl(e.target.value)}
                      placeholder="https://..."
                      className="rounded-xl bg-[#1c1c1e] border-white/10 text-white placeholder:text-[#86868b] text-xs font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* SOCIAL MEDIA */}
              <div className="space-y-3 pt-2 border-t border-white/[0.08]">
                <h4 className="text-xs font-semibold text-white flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-white" />
                  Social Media Links
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] text-[#86868b]">TikTok (@handle of url)</label>
                    <Input
                      value={editSocials.tiktok || ''}
                      onChange={(e) => setEditSocials({ ...editSocials, tiktok: e.target.value })}
                      placeholder="@jouw_tiktok"
                      className="rounded-xl bg-[#1c1c1e] border-white/10 text-white placeholder:text-[#86868b] text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] text-[#86868b]">Instagram (@handle of url)</label>
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
                <Button type="button" variant="ghost" className="rounded-full text-[#86868b] hover:text-white hover:bg-white/10" onClick={() => setEditingUser(null)}>
                  Annuleren
                </Button>
                <Button type="submit" variant="apple" className="rounded-full px-6 font-semibold">
                  Wijzigingen Opslaan
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
