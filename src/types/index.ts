export interface UserSocials {
  tiktok?: string;
  youtube?: string;
  instagram?: string;
  x?: string;
}

// User types
export interface User {
  id: string;
  email: string;
  username: string;
  displayName: string;
  bio: string;
  avatarUrl: string;
  bannerUrl: string;
  role: 'user' | 'moderator' | 'admin';
  plan?: 'gebruiker' | 'artiest' | 'label';
  credits?: number;
  monthlyUploadsCount?: number;
  monthlyUploadsLimit?: number;
  createdAt: string;
  updatedAt: string;
  followersCount: number;
  followingCount: number;
  tracksCount: number;
  isFollowing?: boolean;
  socials?: UserSocials;
  reposts?: string[];
  likes?: string[];
}

export interface DirectMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  recipientIds: string[];
  recipientNames: string[];
  content: string;
  createdAt: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// Track types
export interface Track {
  id: string;
  userId: string;
  userEmail?: string;
  userName?: string;
  title: string;
  description: string;
  genre: string;
  tags: string[];
  duration: number;
  durationFormatted: string;
  waveformData: number[];
  audioUrl: string;
  coverUrl: string;
  coverVideoUrl?: string;
  coverType?: 'image' | 'video';
  isMastered?: boolean;
  albumId?: string;
  albumTitle?: string;
  isPrivate: boolean;
  isExplicit: boolean;
  license: 'all-rights-reserved' | 'cc-by' | 'cc-by-sa' | 'cc-by-nc' | 'cc-by-nd' | 'public-domain';
  playsCount: number;
  likesCount: number;
  repostsCount: number;
  commentsCount: number;
  createdAt: string;
  updatedAt: string;
  user?: User;
  isLiked?: boolean;
  isReposted?: boolean;
}

// Playlist types
export interface Playlist {
  id: string;
  userId: string;
  title: string;
  description: string;
  isPublic: boolean;
  coverUrl: string;
  coverVideoUrl?: string;
  coverType?: 'image' | 'video';
  type?: 'playlist' | 'album';
  tracksCount: number;
  trackIds?: string[];
  createdAt: string;
  updatedAt: string;
  user?: User;
  tracks?: Track[];
}

// Comment types
export interface Comment {
  id: string;
  userId: string;
  trackId: string;
  parentId: string | null;
  content: string;
  likesCount: number;
  createdAt: string;
  updatedAt?: string;
  user?: User;
  replies?: Comment[];
}

// Notification types
export type NotificationType = 'like' | 'repost' | 'comment' | 'follow';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  actorId: string;
  trackId?: string;
  read: boolean;
  createdAt: string;
  actor?: User;
  track?: Track;
}

// Follow types
export interface Follow {
  id: string;
  followerId: string;
  followingId: string;
  createdAt: string;
}

// Like types
export interface Like {
  id: string;
  userId: string;
  trackId: string;
  createdAt: string;
}

// Repost types
export interface Repost {
  id: string;
  userId: string;
  trackId: string;
  createdAt: string;
}

// Report types
export interface Report {
  id: string;
  reporterId: string;
  reportedType: 'track' | 'user' | 'comment';
  reportedId: string;
  reason: string;
  status: 'pending' | 'resolved' | 'dismissed';
  createdAt: string;
}

// Genre types
export interface Genre {
  id: string;
  name: string;
  slug: string;
  coverUrl: string;
  tracksCount: number;
}

// Player types
export interface PlayerState {
  currentTrack: Track | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  queue: Track[];
  queueIndex: number;
  isShuffled: boolean;
  repeatMode: 'none' | 'one' | 'all';
}

// Search types
export interface SearchFilters {
  genre?: string;
  duration?: 'short' | 'medium' | 'long';
  uploadDate?: 'today' | 'week' | 'month' | 'year';
  sortBy?: 'relevance' | 'newest' | 'popular';
}

// Form types
export interface LoginFormData {
  email: string;
  password: string;
}

export interface RegisterFormData {
  email: string;
  username: string;
  password: string;
  confirmPassword: string;
}

export interface UploadFormData {
  title: string;
  description: string;
  genre: string;
  tags: string[];
  isPrivate: boolean;
  isExplicit: boolean;
  license: Track['license'];
}

export interface ProfileFormData {
  displayName: string;
  bio: string;
}

// Stats types
export interface AdminStats {
  totalUsers: number;
  totalTracks: number;
  totalPlays: number;
  totalStorage: number;
  pendingReports: number;
  newUsersToday: number;
  newTracksToday: number;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}
