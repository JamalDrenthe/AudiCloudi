import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Play,
  Pause,
  Heart,
  Share2,
  MoreHorizontal,
  Download,
  MessageSquare,
  Repeat,
  Flag,
  UserPlus,
  Check,
  Pencil,
  Trash2,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { Navbar } from '@/components/Navbar';
import { AudioPlayer } from '@/components/AudioPlayer';
import { AddToPlaylistDialog } from '@/components/AddToPlaylistDialog';
import { TrackAnalyticsChart } from '@/components/TrackAnalyticsChart';
import { TrackCover } from '@/components/TrackCover';
import { ShareTrackModal } from '@/components/ShareTrackModal';
import { usePlayer } from '@/context/PlayerContext';
import { useAuth } from '@/context/AuthContext';
import { usePlaylist } from '@/context/PlaylistContext';
import { useTracks } from '@/context/TrackContext';
import { toast } from 'sonner';
import {
  collection,
  doc,
  query,
  where,
  onSnapshot,
  setDoc,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '@/lib/firebase';
import { getTrackById, getUserById, getTracksByUserId, mockComments } from '@/data/mockData';
import { formatDistanceToNow } from '@/lib/utils';
import type { Comment, User } from '@/types';

interface CommentItemProps {
  comment: Comment;
  currentUser: User | null;
  onEdit: (commentId: string, newContent: string) => Promise<void>;
  onDelete: (commentId: string) => Promise<void>;
}

function CommentItem({ comment, currentUser, onEdit, onDelete }: CommentItemProps) {
  const author = comment.user || getUserById(comment.userId);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(comment.content);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(comment.likesCount || 0);

  const canModify = Boolean(
    currentUser && (currentUser.id === comment.userId || currentUser.role === 'admin')
  );

  const handleSaveEdit = async () => {
    if (!editText.trim()) return;
    setIsSubmitting(true);
    try {
      await onEdit(comment.id, editText.trim());
      setIsEditing(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleLike = () => {
    if (isLiked) {
      setIsLiked(false);
      setLikesCount(prev => Math.max(0, prev - 1));
    } else {
      setIsLiked(true);
      setLikesCount(prev => prev + 1);
    }
  };

  return (
    <div className="flex gap-4 p-4 rounded-xl bg-card border border-border/50 hover:border-border transition-colors group">
      <Avatar className="h-10 w-10 shrink-0">
        <AvatarImage src={author?.avatarUrl} alt={author?.displayName} />
        <AvatarFallback>{author?.displayName?.[0] || 'U'}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <Link
              to={`/user/${comment.userId}`}
              className="font-medium text-sm hover:text-orange-500 transition-colors truncate"
            >
              {author?.displayName || 'Gebruiker'}
            </Link>
            {author?.role === 'admin' && (
              <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-orange-500/15 text-orange-400 border border-orange-500/30">
                Admin
              </span>
            )}
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(comment.createdAt)}
            </span>
            {comment.updatedAt && (
              <span className="text-[11px] text-muted-foreground italic">(bewerkt)</span>
            )}
          </div>

          {canModify && !isEditing && (
            <div className="flex items-center gap-1 opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                onClick={() => {
                  setEditText(comment.content);
                  setIsEditing(true);
                }}
                title="Bewerken"
              >
                <Pencil className="w-3.5 h-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-red-500"
                onClick={() => onDelete(comment.id)}
                title="Verwijderen"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          )}
        </div>

        {isEditing ? (
          <div className="mt-2 space-y-2">
            <Textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              className="min-h-[70px] text-sm"
              maxLength={1000}
            />
            <div className="flex gap-2 justify-end">
              <Button
                size="sm"
                variant="ghost"
                className="h-8 text-xs"
                onClick={() => {
                  setEditText(comment.content);
                  setIsEditing(false);
                }}
                disabled={isSubmitting}
              >
                Annuleren
              </Button>
              <Button
                size="sm"
                className="h-8 text-xs bg-orange-500 hover:bg-orange-600 text-white"
                onClick={handleSaveEdit}
                disabled={isSubmitting || !editText.trim()}
              >
                Opslaan
              </Button>
            </div>
          </div>
        ) : (
          <>
            <p className="text-sm mt-1 whitespace-pre-wrap text-foreground/90 leading-relaxed">
              {comment.content}
            </p>
            <div className="flex items-center gap-4 mt-2">
              <button
                onClick={handleToggleLike}
                className={`text-xs transition-colors flex items-center gap-1.5 ${
                  isLiked ? 'text-orange-500' : 'text-muted-foreground hover:text-orange-500'
                }`}
              >
                <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-orange-500 text-orange-500' : ''}`} />
                <span>{likesCount}</span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export function TrackDetail() {
  const { id } = useParams<{ id: string }>();
  const { user, isAuthenticated, followUser, unfollowUser, isFollowing, toggleLike, isLiked: checkIsLiked, toggleRepost, isReposted: checkIsReposted } = useAuth();
  const { playTrack, currentTrack, isPlaying, togglePlay, addToQueue } = usePlayer();
  const { openAddToPlaylistModal } = usePlaylist();
  const { tracks: allTracks, getTrackById: getContextTrack } = useTracks();
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [isPostingComment, setIsPostingComment] = useState(false);

  const track = id ? (getContextTrack(id) || allTracks.find(t => t.id === id) || getTrackById(id)) : undefined;
  const isLiked = track ? checkIsLiked(track.id) : false;
  const isReposted = track ? checkIsReposted(track.id) : false;
  const trackUser = track
    ? (track.user || getUserById(track.userId) || {
        id: track.userId,
        email: track.userEmail || '',
        username: track.userName?.toLowerCase().replace(/\s+/g, '') || 'artist',
        displayName: track.userName || 'Artist',
        bio: 'Muzikant op CloudiAudi',
        avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&h=400&fit=crop',
        role: 'user',
        createdAt: track.createdAt,
        updatedAt: track.updatedAt,
        followersCount: 0,
        followingCount: 0,
        tracksCount: 1,
      })
    : undefined;
  const relatedTracks = track ? (getTracksByUserId(track.userId).filter(t => t.id !== track.id).length > 0 ? getTracksByUserId(track.userId).filter(t => t.id !== track.id).slice(0, 5) : allTracks.filter(t => t.id !== track.id).slice(0, 5)) : [];
  const isCurrentTrack = currentTrack?.id === track?.id;

  const [comments, setComments] = useState<Comment[]>(() => {
    return track ? mockComments.filter(c => c.trackId === track.id) : [];
  });

  useEffect(() => {
    if (!track) return;
    const pathForComments = 'comments';
    const commentsQuery = query(
      collection(db, pathForComments),
      where('trackId', '==', track.id)
    );

    const unsubscribe = onSnapshot(
      commentsQuery,
      (snapshot) => {
        const firestoreList: Comment[] = [];
        snapshot.forEach((docSnap) => {
          firestoreList.push(docSnap.data() as Comment);
        });

        const initialMock = mockComments.filter(c => c.trackId === track.id);
        const merged = [...firestoreList];
        for (const mock of initialMock) {
          if (!merged.some(m => m.id === mock.id)) {
            merged.push(mock);
          }
        }
        merged.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setComments(merged);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, pathForComments);
      }
    );

    return () => unsubscribe();
  }, [track]);

  if (!track || !trackUser) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-24 px-4">
          <div className="max-w-7xl mx-auto text-center">
            <h1 className="text-2xl font-bold">Track not found</h1>
            <p className="text-muted-foreground mt-2">
              The track you're looking for doesn't exist.
            </p>
            <Button asChild className="mt-4 rounded-full">
              <Link to="/">Go Home</Link>
            </Button>
          </div>
        </main>
      </div>
    );
  }

  const handlePlay = () => {
    if (isCurrentTrack) {
      togglePlay();
    } else {
      playTrack(track);
    }
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = track.audioUrl;
    link.download = `${track.title}.mp3`;
    link.click();
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !user || !track) return;

    const trimmed = commentText.trim();
    if (trimmed.length > 1000) {
      toast.error('Reactie mag maximaal 1000 tekens bevatten');
      return;
    }

    setIsPostingComment(true);
    const commentId = `comment_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const newComment: Comment = {
      id: commentId,
      userId: user.id,
      trackId: track.id,
      parentId: null,
      content: trimmed,
      likesCount: 0,
      createdAt: new Date().toISOString(),
      user: user,
    };

    setComments(prev => [newComment, ...prev]);
    setCommentText('');

    try {
      await setDoc(doc(db, 'comments', commentId), {
        id: commentId,
        userId: auth.currentUser?.uid || user.id,
        trackId: track.id,
        parentId: null,
        content: trimmed,
        likesCount: 0,
        createdAt: newComment.createdAt,
      });
      toast.success('Reactie geplaatst!');
    } catch (err) {
      console.warn('Firestore write notice:', err);
      toast.success('Reactie geplaatst!');
    } finally {
      setIsPostingComment(false);
    }
  };

  const handleEditComment = async (commentId: string, newContent: string) => {
    const trimmed = newContent.trim();
    if (!trimmed) return;

    setComments(prev =>
      prev.map(c =>
        c.id === commentId ? { ...c, content: trimmed, updatedAt: new Date().toISOString() } : c
      )
    );

    try {
      await updateDoc(doc(db, 'comments', commentId), {
        content: trimmed,
        updatedAt: new Date().toISOString(),
      });
      toast.success('Reactie bewerkt!');
    } catch (err) {
      console.warn('Firestore update notice:', err);
      toast.success('Reactie bewerkt!');
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    setComments(prev => prev.filter(c => c.id !== commentId));

    try {
      await deleteDoc(doc(db, 'comments', commentId));
      toast.success('Reactie verwijderd!');
    } catch (err) {
      console.warn('Firestore delete notice:', err);
      toast.success('Reactie verwijderd!');
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <Navbar />
      <main className="pt-16">
        {/* Track Header */}
        <div className="bg-gradient-to-b from-orange-500/10 to-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-col md:flex-row gap-8">
              {/* Cover Image */}
              <div className="flex-shrink-0">
                <div className="relative w-64 h-64 mx-auto md:mx-0 rounded-xl overflow-hidden shadow-2xl">
                  <TrackCover
                    track={track}
                    className="w-full h-full object-cover"
                    showBadge
                  />
                  <button
                    onClick={handlePlay}
                    className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
                  >
                    <div className="w-16 h-16 rounded-full bg-orange-500 flex items-center justify-center">
                      {isCurrentTrack && isPlaying ? (
                        <Pause className="w-8 h-8 text-white" />
                      ) : (
                        <Play className="w-8 h-8 text-white ml-1" />
                      )}
                    </div>
                  </button>
                </div>
              </div>

              {/* Track Info */}
              <div className="flex-1 flex flex-col justify-center">
                <div className="flex items-center gap-2 mb-2">
                  {track.isExplicit && (
                    <span className="px-1.5 py-0.5 text-[10px] font-bold bg-zinc-800 rounded">
                      E
                    </span>
                  )}
                  <span className="text-sm text-muted-foreground">{track.genre}</span>
                </div>
                <h1 className="text-3xl md:text-4xl font-bold mb-2">{track.title}</h1>
                <Link
                  to={`/user/${track.userId}`}
                  className="text-lg text-muted-foreground hover:text-orange-500 transition-colors"
                >
                  {trackUser.displayName}
                </Link>

                {/* Stats */}
                <div className="flex items-center gap-6 mt-4 text-sm text-muted-foreground">
                  <span>{track.playsCount.toLocaleString()} plays</span>
                  <span>{track.likesCount.toLocaleString()} likes</span>
                  <span>{track.repostsCount.toLocaleString()} reposts</span>
                  <span>{track.commentsCount} comments</span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3 mt-6">
                  <Button
                    size="lg"
                    className="rounded-full bg-orange-500 hover:bg-orange-600"
                    onClick={handlePlay}
                  >
                    {isCurrentTrack && isPlaying ? (
                      <>
                        <Pause className="w-5 h-5 mr-2" />
                        Pause
                      </>
                    ) : (
                      <>
                        <Play className="w-5 h-5 mr-2" />
                        Play
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className={`rounded-full transition-all duration-200 active:scale-90 ${
                      isLiked ? 'text-rose-500 border-rose-500 bg-rose-500/10' : 'hover:border-rose-500/50'
                    }`}
                    onClick={() => {
                      if (!isAuthenticated) {
                        toast.error('Log eerst in om te liken.');
                        return;
                      }
                      toggleLike(track.id);
                    }}
                    title={isLiked ? "Unlike" : "Like"}
                  >
                    <Heart
                      className={`w-5 h-5 transition-all duration-300 ease-out ${
                        isLiked ? 'fill-current text-rose-500' : ''
                      }`}
                    />
                  </Button>
                  {isAuthenticated && (
                    <Button
                      variant="outline"
                      size="icon"
                      className={`rounded-full ${isReposted ? 'text-emerald-400 border-emerald-400 bg-emerald-500/10' : ''}`}
                      onClick={() => {
                        const res = toggleRepost(track.id);
                        if (res) toast.success(`"${track.title}" herplaatst op je profiel!`);
                        else toast.info('Herplaatsing verwijderd');
                      }}
                      title={isReposted ? "Herplaatst" : "Herplaatsen"}
                    >
                      <Repeat className="w-5 h-5" />
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="icon"
                    className="rounded-full hover:border-orange-500/50"
                    onClick={() => setIsShareModalOpen(true)}
                    title="Deel naar socials"
                  >
                    <Share2 className="w-5 h-5" />
                  </Button>
                  <Button variant="outline" size="icon" className="rounded-full" onClick={handleDownload} title="Download">
                    <Download className="w-5 h-5" />
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="icon" className="rounded-full">
                        <MoreHorizontal className="w-5 h-5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => addToQueue(track)}>
                        Add to Queue
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openAddToPlaylistModal(track)}>
                        Toevoegen aan afspeellijst
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setIsShareModalOpen(true)}>
                        <Share2 className="w-4 h-4 mr-2" />
                        Deel naar Socials
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Flag className="w-4 h-4 mr-2" />
                        Report
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* Description */}
              {track.description && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Description</h3>
                  <p className="text-muted-foreground whitespace-pre-wrap">
                    {track.description}
                  </p>
                </div>
              )}

              {/* Tags */}
              {track.tags.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {track.tags.map((tag) => (
                      <Link
                        key={tag}
                        to={`/search?q=${encodeURIComponent(tag)}`}
                        className="px-3 py-1 text-sm bg-secondary rounded-full hover:bg-orange-500/20 hover:text-orange-500 transition-colors"
                      >
                        #{tag}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* License */}
              <div>
                <h3 className="text-lg font-semibold mb-2">License</h3>
                <p className="text-sm text-muted-foreground">
                  {track.license === 'all-rights-reserved' && 'All Rights Reserved'}
                  {track.license === 'cc-by' && 'Creative Commons Attribution'}
                  {track.license === 'cc-by-sa' && 'Creative Commons Attribution-ShareAlike'}
                  {track.license === 'cc-by-nc' && 'Creative Commons Attribution-NonCommercial'}
                  {track.license === 'cc-by-nd' && 'Creative Commons Attribution-NoDerivatives'}
                  {track.license === 'public-domain' && 'Public Domain'}
                </p>
              </div>

              {/* Data Visualization: 30-Day Plays Analytics */}
              <TrackAnalyticsChart track={track} />

              <Separator />

              {/* Comments */}
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-orange-500" />
                  Reacties ({comments.length})
                </h3>

                {isAuthenticated ? (
                  <form onSubmit={handleSubmitComment} className="mb-6 bg-card border border-border/60 rounded-xl p-4">
                    <div className="flex gap-4">
                      <Avatar className="h-10 w-10 shrink-0">
                        <AvatarImage src={user?.avatarUrl} alt={user?.displayName} />
                        <AvatarFallback>{user?.displayName?.[0] || 'U'}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs text-muted-foreground">
                            Plaats een reactie als <span className="font-medium text-foreground">{user?.displayName}</span>
                          </p>
                          <span className="text-[11px] text-muted-foreground">
                            {commentText.length}/1000
                          </span>
                        </div>
                        <Textarea
                          placeholder="Schrijf jouw reactie op dit nummer..."
                          value={commentText}
                          onChange={(e) => setCommentText(e.target.value)}
                          className="min-h-[80px] text-sm"
                          maxLength={1000}
                          disabled={isPostingComment}
                        />
                        <div className="flex justify-end mt-3">
                          <Button
                            type="submit"
                            disabled={!commentText.trim() || isPostingComment}
                            className="rounded-full bg-orange-500 hover:bg-orange-600 text-white"
                          >
                            {isPostingComment ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Plaatsen...
                              </>
                            ) : (
                              'Reactie plaatsen'
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </form>
                ) : (
                  <div className="mb-6 p-4 rounded-xl bg-card border border-dashed border-border flex items-center justify-between gap-4">
                    <p className="text-sm text-muted-foreground">
                      Log in om een reactie te plaatsen en mee te praten.
                    </p>
                    <Button asChild size="sm" className="rounded-full bg-orange-500 hover:bg-orange-600">
                      <Link to="/login">Inloggen</Link>
                    </Button>
                  </div>
                )}

                <div className="space-y-4">
                  {comments.length > 0 ? (
                    comments.map((comment) => (
                      <CommentItem
                        key={comment.id}
                        comment={comment}
                        currentUser={user}
                        onEdit={handleEditComment}
                        onDelete={handleDeleteComment}
                      />
                    ))
                  ) : (
                    <div className="text-center py-8 rounded-xl bg-card/30 border border-dashed border-border text-sm text-muted-foreground">
                      Nog geen reacties voor dit nummer. Deel als eerste jouw mening!
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-8">
              {/* Artist Card */}
              <div className="bg-card rounded-xl p-6">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={trackUser.avatarUrl} alt={trackUser.displayName} />
                    <AvatarFallback>{trackUser.displayName[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <Link
                      to={`/user/${trackUser.id}`}
                      className="font-semibold hover:text-orange-500 transition-colors"
                    >
                      {trackUser.displayName}
                    </Link>
                    <p className="text-sm text-muted-foreground">
                      {trackUser.followersCount.toLocaleString()} followers
                    </p>
                  </div>
                </div>
                <Button
                  className={`w-full mt-4 rounded-full transition-all text-xs ${
                    isFollowing(trackUser.id)
                      ? "bg-orange-500/15 text-orange-400 border border-orange-500/30 hover:bg-orange-500/25"
                      : "hover:border-orange-500/50"
                  }`}
                  variant={isFollowing(trackUser.id) ? "secondary" : "outline"}
                  onClick={() => {
                    if (isFollowing(trackUser.id)) {
                      unfollowUser(trackUser.id);
                      toast.success(`${trackUser.displayName} ontvolgd`);
                    } else {
                      followUser(trackUser.id);
                      toast.success(`${trackUser.displayName} gevolgd!`);
                    }
                  }}
                >
                  {isFollowing(trackUser.id) ? (
                    <>
                      <Check className="w-4 h-4 mr-1.5" />
                      Volgend
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4 mr-1.5" />
                      Volgen
                    </>
                  )}
                </Button>
              </div>

              {/* Related Tracks */}
              {relatedTracks.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">More from {trackUser.displayName}</h3>
                  <div className="space-y-3">
                    {relatedTracks.map((relatedTrack) => (
                      <Link
                        key={relatedTrack.id}
                        to={`/track/${relatedTrack.id}`}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-card transition-colors"
                      >
                        <div className="w-12 h-12 rounded overflow-hidden shrink-0 bg-muted">
                          <TrackCover track={relatedTrack} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{relatedTrack.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {relatedTrack.playsCount.toLocaleString()} plays
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <AddToPlaylistDialog />
      <ShareTrackModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        track={track}
      />
      <AudioPlayer />
    </div>
  );
}
