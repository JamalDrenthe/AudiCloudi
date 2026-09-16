import { useState } from 'react';
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
import { usePlayer } from '@/context/PlayerContext';
import { useAuth } from '@/context/AuthContext';
import { getTrackById, getUserById, getTracksByUserId, mockComments } from '@/data/mockData';
import { formatDistanceToNow } from '@/lib/utils';

function CommentItem({ comment }: { comment: typeof mockComments[0] }) {
  const user = getUserById(comment.userId);

  return (
    <div className="flex gap-4">
      <Avatar className="h-10 w-10">
        <AvatarImage src={user?.avatarUrl} alt={user?.displayName} />
        <AvatarFallback>{user?.displayName?.[0]}</AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <Link
            to={`/user/${comment.userId}`}
            className="font-medium hover:text-orange-500 transition-colors"
          >
            {user?.displayName}
          </Link>
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(comment.createdAt)}
          </span>
        </div>
        <p className="text-sm mt-1">{comment.content}</p>
        <div className="flex items-center gap-4 mt-2">
          <button className="text-xs text-muted-foreground hover:text-orange-500 transition-colors flex items-center gap-1">
            <Heart className="w-3 h-3" />
            {comment.likesCount}
          </button>
          <button className="text-xs text-muted-foreground hover:text-orange-500 transition-colors">
            Reply
          </button>
        </div>
      </div>
    </div>
  );
}

export function TrackDetail() {
  const { id } = useParams<{ id: string }>();
  const { user, isAuthenticated } = useAuth();
  const { playTrack, currentTrack, isPlaying, togglePlay, addToQueue } = usePlayer();
  const [isLiked, setIsLiked] = useState(false);
  const [isReposted, setIsReposted] = useState(false);
  const [commentText, setCommentText] = useState('');

  const track = id ? getTrackById(id) : undefined;
  const trackUser = track ? getUserById(track.userId) : undefined;
  const relatedTracks = track ? getTracksByUserId(track.userId).filter(t => t.id !== track.id).slice(0, 5) : [];
  const trackComments = track ? mockComments.filter(c => c.trackId === track.id) : [];
  const isCurrentTrack = currentTrack?.id === track?.id;

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

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    // In a real app, this would submit the comment
    setCommentText('');
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
                  <img
                    src={track.coverUrl}
                    alt={track.title}
                    className="w-full h-full object-cover"
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
                  {isAuthenticated && (
                    <>
                      <Button
                        variant="outline"
                        size="icon"
                        className={`rounded-full ${isLiked ? 'text-orange-500 border-orange-500' : ''}`}
                        onClick={() => setIsLiked(!isLiked)}
                      >
                        <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className={`rounded-full ${isReposted ? 'text-orange-500 border-orange-500' : ''}`}
                        onClick={() => setIsReposted(!isReposted)}
                      >
                        <Repeat className="w-5 h-5" />
                      </Button>
                    </>
                  )}
                  <Button variant="outline" size="icon" className="rounded-full" onClick={handleDownload}>
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
                      <DropdownMenuItem>Add to Playlist</DropdownMenuItem>
                      <DropdownMenuItem>
                        <Share2 className="w-4 h-4 mr-2" />
                        Share
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

              <Separator />

              {/* Comments */}
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Comments ({track.commentsCount})
                </h3>

                {isAuthenticated && (
                  <form onSubmit={handleSubmitComment} className="mb-6">
                    <div className="flex gap-4">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={user?.avatarUrl} alt={user?.displayName} />
                        <AvatarFallback>{user?.displayName?.[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <Textarea
                          placeholder="Write a comment..."
                          value={commentText}
                          onChange={(e) => setCommentText(e.target.value)}
                          className="min-h-[80px]"
                        />
                        <div className="flex justify-end mt-2">
                          <Button
                            type="submit"
                            disabled={!commentText.trim()}
                            className="rounded-full bg-orange-500 hover:bg-orange-600"
                          >
                            Post Comment
                          </Button>
                        </div>
                      </div>
                    </div>
                  </form>
                )}

                <div className="space-y-6">
                  {trackComments.map((comment) => (
                    <CommentItem key={comment.id} comment={comment} />
                  ))}
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
                {isAuthenticated && (
                  <Button className="w-full mt-4 rounded-full" variant="outline">
                    Follow
                  </Button>
                )}
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
                        <img
                          src={relatedTrack.coverUrl}
                          alt={relatedTrack.title}
                          className="w-12 h-12 rounded object-cover"
                        />
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
      <AudioPlayer />
    </div>
  );
}
