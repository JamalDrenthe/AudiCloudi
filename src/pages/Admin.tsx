import { useState } from 'react';
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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Navbar } from '@/components/Navbar';
import { AudioPlayer } from '@/components/AudioPlayer';
import { TrackCover } from '@/components/TrackCover';
import { useAuth } from '@/context/AuthContext';
import { mockUsers, mockTracks, getUserById } from '@/data/mockData';

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
  const { user, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  // Redirect if not admin
  if (!isAuthenticated || user?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  const stats = {
    totalUsers: mockUsers.length,
    totalTracks: mockTracks.length,
    totalPlays: mockTracks.reduce((acc, t) => acc + t.playsCount, 0),
    pendingReports: mockReports.filter((r) => r.status === 'pending').length,
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <Navbar />
      <main className="pt-24 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold">Admin Panel</h1>
              <p className="text-muted-foreground">Manage your platform</p>
            </div>
            <Badge variant="secondary" className="text-orange-500">
              Admin Access
            </Badge>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="users">Users</TabsTrigger>
              <TabsTrigger value="tracks">Tracks</TabsTrigger>
              <TabsTrigger value="reports">
                Reports
                {stats.pendingReports > 0 && (
                  <span className="ml-2 px-1.5 py-0.5 text-xs bg-orange-500 text-white rounded-full">
                    {stats.pendingReports}
                  </span>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                    <Users className="w-4 h-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.totalUsers}</div>
                    <p className="text-xs text-muted-foreground">
                      +3 new today
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Total Tracks</CardTitle>
                    <Music className="w-4 h-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.totalTracks}</div>
                    <p className="text-xs text-muted-foreground">
                      +5 uploaded today
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Total Plays</CardTitle>
                    <TrendingUp className="w-4 h-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {(stats.totalPlays / 1000).toFixed(1)}K
                    </div>
                    <p className="text-xs text-muted-foreground">
                      +12% from last week
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Pending Reports</CardTitle>
                    <Flag className="w-4 h-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.pendingReports}</div>
                    <p className="text-xs text-muted-foreground">
                      Requires attention
                    </p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="users">
              <Card>
                <CardHeader>
                  <CardTitle>User Management</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {mockUsers
                      .filter((u) => u.role !== 'admin')
                      .map((user) => (
                        <div
                          key={user.id}
                          className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg"
                        >
                          <div className="flex items-center gap-4">
                            <Avatar>
                              <AvatarImage src={user.avatarUrl} alt={user.displayName} />
                              <AvatarFallback>{user.displayName[0]}</AvatarFallback>
                            </Avatar>
                            <div>
                              <Link
                                to={`/user/${user.id}`}
                                className="font-medium hover:text-orange-500 transition-colors"
                              >
                                {user.displayName}
                              </Link>
                              <p className="text-sm text-muted-foreground">
                                @{user.username} • {user.tracksCount} tracks •{' '}
                                {user.followersCount} followers
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm">
                              View
                            </Button>
                            <Button variant="destructive" size="sm">
                              <UserX className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="tracks">
              <Card>
                <CardHeader>
                  <CardTitle>Track Moderation</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {mockTracks.map((track) => {
                      const trackUser = getUserById(track.userId);
                      return (
                        <div
                          key={track.id}
                          className="flex items-center justify-between p-4 bg-secondary/50 rounded-lg"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded overflow-hidden shrink-0 bg-muted">
                              <TrackCover track={track} />
                            </div>
                            <div>
                              <Link
                                to={`/track/${track.id}`}
                                className="font-medium hover:text-orange-500 transition-colors"
                              >
                                {track.title}
                              </Link>
                              <p className="text-sm text-muted-foreground">
                                by {trackUser?.displayName} • {track.playsCount} plays •{' '}
                                {track.genre}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button variant="outline" size="sm">
                              View
                            </Button>
                            <Button variant="destructive" size="sm">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="reports">
              <Card>
                <CardHeader>
                  <CardTitle>Content Reports</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {mockReports.map((report) => {
                      const reporter = getUserById(report.reporterId);
                      const reportedTrack =
                        report.reportedType === 'track'
                          ? mockTracks.find((t) => t.id === report.reportedId)
                          : null;

                      return (
                        <div
                          key={report.id}
                          className={`p-4 rounded-lg ${
                            report.status === 'pending'
                              ? 'bg-orange-500/10 border border-orange-500/20'
                              : 'bg-secondary/50'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <Badge
                                  variant={
                                    report.status === 'pending' ? 'default' : 'secondary'
                                  }
                                >
                                  {report.status}
                                </Badge>
                                <span className="text-sm text-muted-foreground">
                                  Reported {new Date(report.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                              <p className="mt-2">
                                <span className="font-medium">{reporter?.displayName}</span>{' '}
                                reported a{' '}
                                <span className="font-medium">{report.reportedType}</span>
                              </p>
                              {reportedTrack && (
                                <p className="text-sm text-muted-foreground">
                                  Track: {reportedTrack.title}
                                </p>
                              )}
                              <p className="text-sm mt-1">
                                Reason: <span className="italic">{report.reason}</span>
                              </p>
                            </div>
                            {report.status === 'pending' && (
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-green-500"
                                >
                                  <CheckCircle className="w-4 h-4 mr-1" />
                                  Dismiss
                                </Button>
                                <Button variant="destructive" size="sm">
                                  <XCircle className="w-4 h-4 mr-1" />
                                  Remove
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      <AudioPlayer />
    </div>
  );
}
