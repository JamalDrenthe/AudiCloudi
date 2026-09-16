import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Play, Clock, Heart, ListMusic, Users, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Navbar } from '@/components/Navbar';
import { AudioPlayer } from '@/components/AudioPlayer';
import { useAuth } from '@/context/AuthContext';
import { usePlayer } from '@/context/PlayerContext';
import { getTrendingTracks, mockPlaylists, mockUsers, getUserById } from '@/data/mockData';

const recentTracks = getTrendingTracks(10);
const likedTracks = getTrendingTracks(8).reverse();
const following = mockUsers.slice(0, 5);

export function Library() {
  const { user, isAuthenticated } = useAuth();
  const { playTrack } = usePlayer();
  const [activeTab, setActiveTab] = useState('history');
  const [isCreatePlaylistOpen, setIsCreatePlaylistOpen] = useState(false);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-24 px-4">
          <div className="max-w-md mx-auto text-center">
            <h1 className="text-2xl font-bold">Sign in to view your library</h1>
            <p className="text-muted-foreground mt-2">
              Your listening history, liked tracks, and playlists will appear here.
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
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Your Library</h1>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="history">
                <Clock className="w-4 h-4 mr-2" />
                History
              </TabsTrigger>
              <TabsTrigger value="likes">
                <Heart className="w-4 h-4 mr-2" />
                Likes
              </TabsTrigger>
              <TabsTrigger value="playlists">
                <ListMusic className="w-4 h-4 mr-2" />
                Playlists
              </TabsTrigger>
              <TabsTrigger value="following">
                <Users className="w-4 h-4 mr-2" />
                Following
              </TabsTrigger>
            </TabsList>

            <TabsContent value="history">
              <h2 className="text-xl font-semibold mb-4">Recently Played</h2>
              {recentTracks.length > 0 ? (
                <div className="space-y-2">
                  {recentTracks.map((track, index) => {
                    const artist = getUserById(track.userId);
                    return (
                      <div
                        key={track.id}
                        className="flex items-center gap-4 p-3 rounded-lg hover:bg-card transition-colors group"
                      >
                        <span className="w-6 text-center text-sm text-muted-foreground">
                          {index + 1}
                        </span>
                        <img
                          src={track.coverUrl}
                          alt={track.title}
                          className="w-12 h-12 rounded object-cover"
                        />
                        <div className="flex-1 min-w-0">
                          <Link
                            to={`/track/${track.id}`}
                            className="font-medium truncate block hover:text-orange-500 transition-colors"
                          >
                            {track.title}
                          </Link>
                          <Link
                            to={`/user/${track.userId}`}
                            className="text-sm text-muted-foreground hover:text-orange-500 transition-colors"
                          >
                            {artist?.displayName}
                          </Link>
                        </div>
                        <button
                          onClick={() => playTrack(track)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center">
                            <Play className="w-4 h-4 text-white ml-0.5" />
                          </div>
                        </button>
                        <span className="text-sm text-muted-foreground">
                          {track.durationFormatted}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No listening history yet</p>
                  <Button asChild className="mt-4 rounded-full">
                    <Link to="/discover">Discover Music</Link>
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="likes">
              <h2 className="text-xl font-semibold mb-4">Liked Tracks</h2>
              {likedTracks.length > 0 ? (
                <div className="space-y-2">
                  {likedTracks.map((track, index) => {
                    const artist = getUserById(track.userId);
                    return (
                      <div
                        key={track.id}
                        className="flex items-center gap-4 p-3 rounded-lg hover:bg-card transition-colors group"
                      >
                        <span className="w-6 text-center text-sm text-muted-foreground">
                          {index + 1}
                        </span>
                        <img
                          src={track.coverUrl}
                          alt={track.title}
                          className="w-12 h-12 rounded object-cover"
                        />
                        <div className="flex-1 min-w-0">
                          <Link
                            to={`/track/${track.id}`}
                            className="font-medium truncate block hover:text-orange-500 transition-colors"
                          >
                            {track.title}
                          </Link>
                          <Link
                            to={`/user/${track.userId}`}
                            className="text-sm text-muted-foreground hover:text-orange-500 transition-colors"
                          >
                            {artist?.displayName}
                          </Link>
                        </div>
                        <button
                          onClick={() => playTrack(track)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center">
                            <Play className="w-4 h-4 text-white ml-0.5" />
                          </div>
                        </button>
                        <span className="text-sm text-muted-foreground">
                          {track.durationFormatted}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No liked tracks yet</p>
                  <Button asChild className="mt-4 rounded-full">
                    <Link to="/discover">Discover Music</Link>
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="playlists">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Your Playlists</h2>
                <Dialog open={isCreatePlaylistOpen} onOpenChange={setIsCreatePlaylistOpen}>
                  <DialogTrigger asChild>
                    <Button className="rounded-full">
                      <Plus className="w-4 h-4 mr-2" />
                      Create Playlist
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create New Playlist</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                      <div>
                        <Label htmlFor="playlist-name">Name</Label>
                        <Input id="playlist-name" placeholder="My Awesome Playlist" />
                      </div>
                      <div>
                        <Label htmlFor="playlist-description">Description</Label>
                        <Textarea
                          id="playlist-description"
                          placeholder="Add a description..."
                        />
                      </div>
                      <Button
                        className="w-full rounded-full bg-orange-500 hover:bg-orange-600"
                        onClick={() => setIsCreatePlaylistOpen(false)}
                      >
                        Create Playlist
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
                {mockPlaylists
                  .filter((p) => p.userId === user?.id)
                  .map((playlist) => (
                    <Link
                      key={playlist.id}
                      to={`/playlist/${playlist.id}`}
                      className="group"
                    >
                      <div className="aspect-square rounded-xl overflow-hidden mb-3">
                        <img
                          src={playlist.coverUrl}
                          alt={playlist.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      </div>
                      <h3 className="font-medium group-hover:text-orange-500 transition-colors">
                        {playlist.title}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {playlist.tracksCount} tracks
                      </p>
                    </Link>
                  ))}
              </div>
            </TabsContent>

            <TabsContent value="following">
              <h2 className="text-xl font-semibold mb-4">Artists You Follow</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6">
                {following.map((user) => (
                  <Link key={user.id} to={`/user/${user.id}`} className="text-center group">
                    <Avatar className="w-24 h-24 mx-auto mb-3 ring-4 ring-transparent group-hover:ring-orange-500/30 transition-all">
                      <AvatarImage src={user.avatarUrl} alt={user.displayName} />
                      <AvatarFallback>{user.displayName[0]}</AvatarFallback>
                    </Avatar>
                    <h3 className="font-medium group-hover:text-orange-500 transition-colors">
                      {user.displayName}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {user.followersCount.toLocaleString()} followers
                    </p>
                  </Link>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <AudioPlayer />
    </div>
  );
}
