import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Play, UserPlus, UserCheck, Share2, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Navbar } from '@/components/Navbar';
import { AudioPlayer } from '@/components/AudioPlayer';
import { useAuth } from '@/context/AuthContext';
import { usePlayer } from '@/context/PlayerContext';
import { getUserById, getTracksByUserId, mockPlaylists } from '@/data/mockData';
import type { Track } from '@/types';

function TrackRow({ track, index }: { track: Track; index: number }) {
  const { playTrack, currentTrack, isPlaying } = usePlayer();
  const isCurrentTrack = currentTrack?.id === track.id;

  return (
    <div
      className={`flex items-center gap-4 p-3 rounded-lg hover:bg-card transition-colors group ${
        isCurrentTrack ? 'bg-orange-500/10' : ''
      }`}
    >
      <span className="w-6 text-center text-sm text-muted-foreground">{index + 1}</span>
      <img
        src={track.coverUrl}
        alt={track.title}
        className="w-12 h-12 rounded object-cover"
      />
      <div className="flex-1 min-w-0">
        <Link
          to={`/track/${track.id}`}
          className={`font-medium truncate block ${isCurrentTrack ? 'text-orange-500' : ''}`}
        >
          {track.title}
        </Link>
        <p className="text-sm text-muted-foreground">{track.genre}</p>
      </div>
      <button
        onClick={() => playTrack(track)}
        className="opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center">
          {isCurrentTrack && isPlaying ? (
            <div className="flex gap-0.5">
              <span className="w-0.5 h-3 bg-white animate-bounce" />
              <span className="w-0.5 h-3 bg-white animate-bounce" style={{ animationDelay: '0.1s' }} />
              <span className="w-0.5 h-3 bg-white animate-bounce" style={{ animationDelay: '0.2s' }} />
            </div>
          ) : (
            <Play className="w-4 h-4 text-white ml-0.5" />
          )}
        </div>
      </button>
      <span className="text-sm text-muted-foreground">{track.durationFormatted}</span>
    </div>
  );
}

export function UserProfile() {
  const { id } = useParams<{ id: string }>();
  const { user: currentUser, isAuthenticated, followUser, unfollowUser } = useAuth();
  const { playQueue } = usePlayer();
  const [activeTab, setActiveTab] = useState('tracks');

  const user = id ? (currentUser?.id === id ? currentUser : getUserById(id)) : undefined;
  const userTracks = user ? getTracksByUserId(user.id) : [];
  const userPlaylists = user ? mockPlaylists.filter(p => p.userId === user.id) : [];
  const isFollowing = false; // In a real app, this would be checked
  const isOwnProfile = currentUser?.id === user?.id;

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-24 px-4">
          <div className="max-w-7xl mx-auto text-center">
            <h1 className="text-2xl font-bold">User not found</h1>
            <p className="text-muted-foreground mt-2">
              The user you're looking for doesn't exist.
            </p>
            <Button asChild className="mt-4 rounded-full">
              <Link to="/">Go Home</Link>
            </Button>
          </div>
        </main>
      </div>
    );
  }

  const handleFollow = () => {
    if (isFollowing) {
      unfollowUser(user.id);
    } else {
      followUser(user.id);
    }
  };

  const handlePlayAll = () => {
    if (userTracks.length > 0) {
      playQueue(userTracks);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <Navbar />
      <main className="pt-16">
        {/* Banner */}
        <div className="relative h-48 md:h-64">
          <img
            src={user.bannerUrl}
            alt=""
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
        </div>

        {/* Profile Info */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative -mt-20 mb-8">
            <div className="flex flex-col md:flex-row items-start md:items-end gap-6">
              {/* Avatar */}
              <Avatar className="w-32 h-32 md:w-40 md:h-40 ring-4 ring-background">
                <AvatarImage src={user.avatarUrl} alt={user.displayName} />
                <AvatarFallback className="text-4xl">{user.displayName[0]}</AvatarFallback>
              </Avatar>

              {/* Info */}
              <div className="flex-1">
                <h1 className="text-2xl md:text-3xl font-bold">{user.displayName}</h1>
                <p className="text-muted-foreground">@{user.username}</p>
                {user.bio && (
                  <p className="mt-2 text-sm max-w-xl">{user.bio}</p>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3">
                {isAuthenticated && !isOwnProfile && (
                  <Button
                    className={`rounded-full ${
                      isFollowing
                        ? 'bg-secondary hover:bg-secondary/80'
                        : 'bg-orange-500 hover:bg-orange-600'
                    }`}
                    onClick={handleFollow}
                  >
                    {isFollowing ? (
                      <>
                        <UserCheck className="w-4 h-4 mr-2" />
                        Following
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4 mr-2" />
                        Follow
                      </>
                    )}
                  </Button>
                )}
                <Button variant="outline" size="icon" className="rounded-full">
                  <Share2 className="w-4 h-4" />
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="icon" className="rounded-full">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem>Report</DropdownMenuItem>
                    {isOwnProfile && <DropdownMenuItem>Edit Profile</DropdownMenuItem>}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-6 mt-6">
              <div className="text-center">
                <p className="font-bold">{user.tracksCount}</p>
                <p className="text-sm text-muted-foreground">Tracks</p>
              </div>
              <div className="text-center">
                <p className="font-bold">{user.followersCount.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">Followers</p>
              </div>
              <div className="text-center">
                <p className="font-bold">{user.followingCount}</p>
                <p className="text-sm text-muted-foreground">Following</p>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="tracks">Tracks</TabsTrigger>
              <TabsTrigger value="playlists">Playlists</TabsTrigger>
              <TabsTrigger value="likes">Likes</TabsTrigger>
              <TabsTrigger value="reposts">Reposts</TabsTrigger>
            </TabsList>

            <TabsContent value="tracks" className="space-y-4">
              {userTracks.length > 0 ? (
                <>
                  <div className="flex items-center gap-4 mb-4">
                    <Button
                      className="rounded-full bg-orange-500 hover:bg-orange-600"
                      onClick={handlePlayAll}
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Play All
                    </Button>
                  </div>
                  <div className="bg-card/50 rounded-xl">
                    {userTracks.map((track, index) => (
                      <TrackRow key={track.id} track={track} index={index} />
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No tracks yet</p>
                  {isOwnProfile && (
                    <Button asChild className="mt-4 rounded-full">
                      <Link to="/upload">Upload Your First Track</Link>
                    </Button>
                  )}
                </div>
              )}
            </TabsContent>

            <TabsContent value="playlists">
              {userPlaylists.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {userPlaylists.map((playlist) => (
                    <Link
                      key={playlist.id}
                      to={`/playlist/${playlist.id}`}
                      className="bg-card rounded-xl overflow-hidden hover:-translate-y-1 transition-transform"
                    >
                      <img
                        src={playlist.coverUrl}
                        alt={playlist.title}
                        className="w-full aspect-square object-cover"
                      />
                      <div className="p-4">
                        <h3 className="font-semibold">{playlist.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {playlist.tracksCount} tracks
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No playlists yet</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="likes">
              <div className="text-center py-12">
                <p className="text-muted-foreground">Liked tracks will appear here</p>
              </div>
            </TabsContent>

            <TabsContent value="reposts">
              <div className="text-center py-12">
                <p className="text-muted-foreground">Reposted tracks will appear here</p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <AudioPlayer />
    </div>
  );
}
