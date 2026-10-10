import type { User, Track, Playlist, Comment, Genre, Notification } from '@/types';

// Mock Users
export const mockUsers: User[] = [
  {
    id: '1',
    email: 'alex@example.com',
    username: 'alexchen',
    displayName: 'Alex Chen',
    bio: 'Electronic music producer | Sound designer | Creating sonic landscapes',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop',
    bannerUrl: 'https://images.unsplash.com/photo-1571266028243-e4733b0f0bb0?w=1200&h=400&fit=crop',
    role: 'user',
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-12-01T15:30:00Z',
    followersCount: 2450,
    followingCount: 180,
    tracksCount: 12,
  },
  {
    id: '2',
    email: 'sarah@example.com',
    username: 'sarahbeats',
    displayName: 'Sarah Beats',
    bio: 'Hip hop producer | Beat maker | Collab inquiries welcome',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop',
    bannerUrl: 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=1200&h=400&fit=crop',
    role: 'user',
    createdAt: '2024-02-20T14:00:00Z',
    updatedAt: '2024-11-28T09:15:00Z',
    followersCount: 3890,
    followingCount: 245,
    tracksCount: 28,
  },
  {
    id: '3',
    email: 'marcus@example.com',
    username: 'marcusjazz',
    displayName: 'Marcus Johnson',
    bio: 'Jazz pianist | Composer | Live performance recordings',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop',
    bannerUrl: 'https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?w=1200&h=400&fit=crop',
    role: 'user',
    createdAt: '2024-03-10T08:30:00Z',
    updatedAt: '2024-12-05T11:20:00Z',
    followersCount: 1520,
    followingCount: 320,
    tracksCount: 15,
  },
  {
    id: '4',
    email: 'luna@example.com',
    username: 'lunamusic',
    displayName: 'Luna Reyes',
    bio: 'Indie artist | Singer-songwriter | Dreamy vibes only',
    avatarUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop',
    bannerUrl: 'https://images.unsplash.com/photo-1493225255756-d9584f8606e9?w=1200&h=400&fit=crop',
    role: 'user',
    createdAt: '2024-04-05T16:45:00Z',
    updatedAt: '2024-12-10T14:00:00Z',
    followersCount: 5670,
    followingCount: 412,
    tracksCount: 22,
  },
  {
    id: '5',
    email: 'david@example.com',
    username: 'davidpodcasts',
    displayName: 'David Miller',
    bio: 'Podcast creator | Tech talks | Interviews with innovators',
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop',
    bannerUrl: 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=1200&h=400&fit=crop',
    role: 'user',
    createdAt: '2024-05-12T11:00:00Z',
    updatedAt: '2024-12-08T10:30:00Z',
    followersCount: 890,
    followingCount: 67,
    tracksCount: 45,
  },
  {
    id: '6',
    email: 'admin@cloudiaudi.com',
    username: 'admin',
    displayName: 'CloudiAudi Admin',
    bio: 'Platform administrator',
    avatarUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&h=400&fit=crop',
    bannerUrl: 'https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=1200&h=400&fit=crop',
    role: 'admin',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-12-15T00:00:00Z',
    followersCount: 0,
    followingCount: 0,
    tracksCount: 0,
  },
];

// Generate waveform data
const generateWaveform = (length: number = 100): number[] => {
  return Array.from({ length }, () => Math.random() * 0.8 + 0.2);
};

// Mock Tracks
export const mockTracks: Track[] = [
  {
    id: '1',
    userId: '1',
    title: 'Neon Dreams',
    description: 'A journey through the city at night. Synthwave vibes with modern production.',
    genre: 'Electronic',
    tags: ['synthwave', 'electronic', 'night', 'ambient'],
    duration: 245,
    durationFormatted: '4:05',
    waveformData: generateWaveform(),
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    coverUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&h=400&fit=crop',
    isPrivate: false,
    isExplicit: false,
    license: 'cc-by',
    playsCount: 12540,
    likesCount: 892,
    repostsCount: 234,
    commentsCount: 45,
    createdAt: '2024-12-01T10:00:00Z',
    updatedAt: '2024-12-01T10:00:00Z',
  },
  {
    id: '2',
    userId: '2',
    title: 'Midnight Flow',
    description: 'Lofi hip hop beat for those late night study sessions.',
    genre: 'Hip Hop',
    tags: ['lofi', 'hiphop', 'chill', 'study'],
    duration: 183,
    durationFormatted: '3:03',
    waveformData: generateWaveform(),
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    coverUrl: 'https://images.unsplash.com/photo-1493225255756-d9584f8606e9?w=400&h=400&fit=crop',
    isPrivate: false,
    isExplicit: false,
    license: 'cc-by-nc',
    playsCount: 8920,
    likesCount: 654,
    repostsCount: 178,
    commentsCount: 32,
    createdAt: '2024-11-28T15:30:00Z',
    updatedAt: '2024-11-28T15:30:00Z',
  },
  {
    id: '3',
    userId: '3',
    title: 'Piano Reflections',
    description: 'Solo piano piece recorded live in my studio.',
    genre: 'Jazz',
    tags: ['piano', 'jazz', 'solo', 'live'],
    duration: 312,
    durationFormatted: '5:12',
    waveformData: generateWaveform(),
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
    coverUrl: 'https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?w=400&h=400&fit=crop',
    isPrivate: false,
    isExplicit: false,
    license: 'all-rights-reserved',
    playsCount: 5670,
    likesCount: 423,
    repostsCount: 89,
    commentsCount: 28,
    createdAt: '2024-11-25T09:00:00Z',
    updatedAt: '2024-11-25T09:00:00Z',
  },
  {
    id: '4',
    userId: '4',
    title: 'Ocean Waves',
    description: 'Indie folk track inspired by coastal memories.',
    genre: 'Indie',
    tags: ['indie', 'folk', 'acoustic', 'ocean'],
    duration: 226,
    durationFormatted: '3:46',
    waveformData: generateWaveform(),
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
    coverUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=400&fit=crop',
    isPrivate: false,
    isExplicit: false,
    license: 'cc-by-sa',
    playsCount: 15230,
    likesCount: 1234,
    repostsCount: 456,
    commentsCount: 67,
    createdAt: '2024-11-20T14:00:00Z',
    updatedAt: '2024-11-20T14:00:00Z',
  },
  {
    id: '5',
    userId: '1',
    title: 'Cyber Punk',
    description: 'High energy electronic track for gaming and workouts.',
    genre: 'Electronic',
    tags: ['electronic', 'gaming', 'energy', 'dubstep'],
    duration: 198,
    durationFormatted: '3:18',
    waveformData: generateWaveform(),
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3',
    coverUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=400&fit=crop',
    isPrivate: false,
    isExplicit: true,
    license: 'cc-by',
    playsCount: 22100,
    likesCount: 1876,
    repostsCount: 678,
    commentsCount: 89,
    createdAt: '2024-11-15T11:00:00Z',
    updatedAt: '2024-11-15T11:00:00Z',
  },
  {
    id: '6',
    userId: '5',
    title: 'Tech Talk #42: AI Revolution',
    description: 'Discussing the latest developments in artificial intelligence.',
    genre: 'Podcast',
    tags: ['podcast', 'tech', 'ai', 'interview'],
    duration: 3240,
    durationFormatted: '54:00',
    waveformData: generateWaveform(),
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3',
    coverUrl: 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=400&h=400&fit=crop',
    isPrivate: false,
    isExplicit: false,
    license: 'all-rights-reserved',
    playsCount: 3450,
    likesCount: 234,
    repostsCount: 45,
    commentsCount: 23,
    createdAt: '2024-11-10T08:00:00Z',
    updatedAt: '2024-11-10T08:00:00Z',
  },
  {
    id: '7',
    userId: '2',
    title: 'Urban Nights',
    description: 'Trap beat with dark atmosphere.',
    genre: 'Hip Hop',
    tags: ['trap', 'hiphop', 'dark', 'beat'],
    duration: 165,
    durationFormatted: '2:45',
    waveformData: generateWaveform(),
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3',
    coverUrl: 'https://images.unsplash.com/photo-1496293455970-f8581aae0e3c?w=400&h=400&fit=crop',
    isPrivate: false,
    isExplicit: false,
    license: 'cc-by-nc',
    playsCount: 7890,
    likesCount: 567,
    repostsCount: 123,
    commentsCount: 34,
    createdAt: '2024-11-05T16:00:00Z',
    updatedAt: '2024-11-05T16:00:00Z',
  },
  {
    id: '8',
    userId: '4',
    title: 'Stargazing',
    description: 'Dreamy ambient track for relaxation.',
    genre: 'Ambient',
    tags: ['ambient', 'chill', 'sleep', 'relaxation'],
    duration: 420,
    durationFormatted: '7:00',
    waveformData: generateWaveform(),
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3',
    coverUrl: 'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=400&h=400&fit=crop',
    isPrivate: false,
    isExplicit: false,
    license: 'public-domain',
    playsCount: 9870,
    likesCount: 789,
    repostsCount: 234,
    commentsCount: 56,
    createdAt: '2024-11-01T12:00:00Z',
    updatedAt: '2024-11-01T12:00:00Z',
  },
  {
    id: '9',
    userId: '3',
    title: 'Blue Note Session',
    description: 'Jazz quartet improvisation.',
    genre: 'Jazz',
    tags: ['jazz', 'quartet', 'improvisation', 'live'],
    duration: 456,
    durationFormatted: '7:36',
    waveformData: generateWaveform(),
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3',
    coverUrl: 'https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?w=400&h=400&fit=crop',
    isPrivate: false,
    isExplicit: false,
    license: 'all-rights-reserved',
    playsCount: 4320,
    likesCount: 345,
    repostsCount: 67,
    commentsCount: 19,
    createdAt: '2024-10-28T10:00:00Z',
    updatedAt: '2024-10-28T10:00:00Z',
  },
  {
    id: '10',
    userId: '1',
    title: 'Future Bass Drop',
    description: 'Experimental future bass track.',
    genre: 'Electronic',
    tags: ['futurebass', 'electronic', 'experimental', 'drop'],
    duration: 234,
    durationFormatted: '3:54',
    waveformData: generateWaveform(),
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3',
    coverUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&h=400&fit=crop',
    isPrivate: false,
    isExplicit: false,
    license: 'cc-by',
    playsCount: 15670,
    likesCount: 1234,
    repostsCount: 445,
    commentsCount: 78,
    createdAt: '2024-10-25T14:00:00Z',
    updatedAt: '2024-10-25T14:00:00Z',
  },
  {
    id: '11',
    userId: '2',
    title: 'Boom Bap Classic',
    description: 'Old school hip hop beat.',
    genre: 'Hip Hop',
    tags: ['boombap', 'oldschool', 'hiphop', 'classic'],
    duration: 192,
    durationFormatted: '3:12',
    waveformData: generateWaveform(),
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-11.mp3',
    coverUrl: 'https://images.unsplash.com/photo-1571266028243-e4733b0f0bb0?w=400&h=400&fit=crop',
    isPrivate: false,
    isExplicit: false,
    license: 'cc-by-nc',
    playsCount: 6780,
    likesCount: 456,
    repostsCount: 89,
    commentsCount: 21,
    createdAt: '2024-10-20T09:00:00Z',
    updatedAt: '2024-10-20T09:00:00Z',
  },
  {
    id: '12',
    userId: '4',
    title: 'Summer Breeze',
    description: 'Upbeat indie pop track.',
    genre: 'Pop',
    tags: ['pop', 'indie', 'upbeat', 'summer'],
    duration: 201,
    durationFormatted: '3:21',
    waveformData: generateWaveform(),
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-12.mp3',
    coverUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=400&fit=crop',
    isPrivate: false,
    isExplicit: false,
    license: 'cc-by-sa',
    playsCount: 18900,
    likesCount: 1567,
    repostsCount: 678,
    commentsCount: 92,
    createdAt: '2024-10-15T11:00:00Z',
    updatedAt: '2024-10-15T11:00:00Z',
  },
];

// Mock Playlists
export const mockPlaylists: Playlist[] = [
  {
    id: '1',
    userId: '1',
    title: 'My Favorites',
    description: 'Tracks I love to listen to',
    isPublic: true,
    coverUrl: 'https://images.unsplash.com/photo-1493225255756-d9584f8606e9?w=400&h=400&fit=crop',
    tracksCount: 24,
    createdAt: '2024-06-01T10:00:00Z',
    updatedAt: '2024-12-10T15:00:00Z',
  },
  {
    id: '2',
    userId: '2',
    title: 'Study Beats',
    description: 'Lofi and chill tracks for focusing',
    isPublic: true,
    coverUrl: 'https://images.unsplash.com/photo-1516280440614-6697288d5d38?w=400&h=400&fit=crop',
    tracksCount: 56,
    createdAt: '2024-07-15T14:00:00Z',
    updatedAt: '2024-12-08T09:00:00Z',
  },
  {
    id: '3',
    userId: '3',
    title: 'Jazz Collection',
    description: 'Best jazz tracks on the platform',
    isPublic: true,
    coverUrl: 'https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?w=400&h=400&fit=crop',
    tracksCount: 32,
    createdAt: '2024-08-01T11:00:00Z',
    updatedAt: '2024-12-05T16:00:00Z',
  },
  {
    id: '4',
    userId: '4',
    title: 'Dreamy Vibes',
    description: 'Ambient and dreamy tracks',
    isPublic: true,
    coverUrl: 'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=400&h=400&fit=crop',
    tracksCount: 18,
    createdAt: '2024-09-01T08:00:00Z',
    updatedAt: '2024-12-01T12:00:00Z',
  },
];

// Mock Comments
export const mockComments: Comment[] = [
  {
    id: '1',
    userId: '2',
    trackId: '1',
    parentId: null,
    content: 'Amazing track! Love the synthwave vibes.',
    likesCount: 12,
    createdAt: '2024-12-02T10:00:00Z',
  },
  {
    id: '2',
    userId: '3',
    trackId: '1',
    parentId: null,
    content: 'The production quality is incredible!',
    likesCount: 8,
    createdAt: '2024-12-02T14:00:00Z',
  },
  {
    id: '3',
    userId: '4',
    trackId: '2',
    parentId: null,
    content: 'Perfect for studying, thanks!',
    likesCount: 15,
    createdAt: '2024-11-29T09:00:00Z',
  },
  {
    id: '4',
    userId: '1',
    trackId: '3',
    parentId: null,
    content: 'Beautiful piano playing, Marcus!',
    likesCount: 6,
    createdAt: '2024-11-26T11:00:00Z',
  },
];

// Mock Genres
export const mockGenres: Genre[] = [
  {
    id: '1',
    name: 'Electronic',
    slug: 'electronic',
    coverUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&h=400&fit=crop',
    tracksCount: 3450,
  },
  {
    id: '2',
    name: 'Hip Hop',
    slug: 'hip-hop',
    coverUrl: 'https://images.unsplash.com/photo-1571266028243-e4733b0f0bb0?w=400&h=400&fit=crop',
    tracksCount: 2890,
  },
  {
    id: '3',
    name: 'Rock',
    slug: 'rock',
    coverUrl: 'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?w=400&h=400&fit=crop',
    tracksCount: 2100,
  },
  {
    id: '4',
    name: 'Pop',
    slug: 'pop',
    coverUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&h=400&fit=crop',
    tracksCount: 4200,
  },
  {
    id: '5',
    name: 'Jazz',
    slug: 'jazz',
    coverUrl: 'https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?w=400&h=400&fit=crop',
    tracksCount: 980,
  },
  {
    id: '6',
    name: 'Classical',
    slug: 'classical',
    coverUrl: 'https://images.unsplash.com/photo-1507838153414-b4b713384a76?w=400&h=400&fit=crop',
    tracksCount: 650,
  },
  {
    id: '7',
    name: 'Podcasts',
    slug: 'podcasts',
    coverUrl: 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=400&h=400&fit=crop',
    tracksCount: 1200,
  },
  {
    id: '8',
    name: 'Ambient',
    slug: 'ambient',
    coverUrl: 'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=400&h=400&fit=crop',
    tracksCount: 780,
  },
];

// Mock Notifications
export const mockNotifications: Notification[] = [
  {
    id: '1',
    userId: '1',
    type: 'like',
    actorId: '2',
    trackId: '1',
    read: false,
    createdAt: '2024-12-15T10:00:00Z',
  },
  {
    id: '2',
    userId: '1',
    type: 'follow',
    actorId: '3',
    read: false,
    createdAt: '2024-12-14T15:00:00Z',
  },
  {
    id: '3',
    userId: '1',
    type: 'comment',
    actorId: '4',
    trackId: '1',
    read: true,
    createdAt: '2024-12-13T09:00:00Z',
  },
];

// Helper function to get user by ID
export const getUserById = (id: string): User | undefined => {
  return mockUsers.find(user => user.id === id);
};

// Helper function to get track by ID
export const getTrackById = (id: string): Track | undefined => {
  return mockTracks.find(track => track.id === id);
};

// Helper function to get tracks by user ID
export const getTracksByUserId = (userId: string): Track[] => {
  return mockTracks.filter(track => track.userId === userId);
};

// Helper function to get tracks by genre
export const getTracksByGenre = (genre: string): Track[] => {
  return mockTracks.filter(track => track.genre.toLowerCase() === genre.toLowerCase());
};

// Helper function to search tracks
export const searchTracks = (query: string): Track[] => {
  const lowerQuery = query.toLowerCase();
  return mockTracks.filter(track =>
    track.title.toLowerCase().includes(lowerQuery) ||
    track.description.toLowerCase().includes(lowerQuery) ||
    track.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
  );
};

// Helper function to get trending tracks
export const getTrendingTracks = (limit: number = 8): Track[] => {
  return [...mockTracks]
    .sort((a, b) => b.playsCount - a.playsCount)
    .slice(0, limit);
};

// Helper function to get new tracks
export const getNewTracks = (limit: number = 8): Track[] => {
  return [...mockTracks]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit);
};

// Helper function to get latest tracks by followed creator IDs
export const getTracksByFollowingIds = (followingIds: string[]): Track[] => {
  if (!followingIds || followingIds.length === 0) return [];
  return mockTracks
    .filter(track => followingIds.includes(track.userId))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};
