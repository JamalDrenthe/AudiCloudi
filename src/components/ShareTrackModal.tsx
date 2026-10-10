import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TrackCover } from '@/components/TrackCover';
import { toast } from 'sonner';
import { Copy, Check, Share2, Sparkles } from 'lucide-react';
import type { Track, User } from '@/types';

interface ShareTrackModalProps {
  isOpen: boolean;
  onClose: () => void;
  track?: Track | null;
  user?: User | null;
}

export function ShareTrackModal({ isOpen, onClose, track, user }: ShareTrackModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'https://cloudiaudi.com';
  const shareUrl = track
    ? `${currentOrigin}/track/${track.id}`
    : user
    ? `${currentOrigin}/user/${user.id}`
    : currentOrigin;

  const title = track
    ? `Luister naar "${track.title}" op CloudiAudi!`
    : user
    ? `Bekijk het profiel van ${user.displayName} op CloudiAudi!`
    : 'Ontdek CloudiAudi!';

  const text = track
    ? `Check deze track "${track.title}" door ${track.userName || 'artiest'} op CloudiAudi: ${shareUrl}`
    : `Bekijk ${user?.displayName || 'artiest'} op CloudiAudi: ${shareUrl}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success('Link gekopieerd naar klembord!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Kon link niet kopiëren');
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text,
          url: shareUrl,
        });
      } catch (err) {
        // Ignored if cancelled
      }
    } else {
      handleCopyLink();
    }
  };

  const handleOpenSocial = (platform: 'whatsapp' | 'x' | 'facebook' | 'telegram') => {
    let url = '';
    switch (platform) {
      case 'whatsapp':
        url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
        break;
      case 'x':
        url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
        break;
      case 'facebook':
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
        break;
      case 'telegram':
        url = `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(title)}`;
        break;
    }
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <Share2 className="w-5 h-5 text-orange-500" />
            {track ? 'Deel Track naar Socials' : 'Deel Profiel'}
          </DialogTitle>
          <DialogDescription>
            Deel rechtstreeks via WhatsApp, X, Facebook, of kopieer de link voor je socials!
          </DialogDescription>
        </DialogHeader>

        {track && (
          <div className="flex items-center gap-3 p-3 bg-secondary/50 rounded-xl border border-border/50 my-2">
            <div className="w-14 h-14 rounded-lg overflow-hidden shrink-0 bg-muted">
              <TrackCover track={track} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-sm truncate">{track.title}</p>
              <p className="text-xs text-muted-foreground truncate">{track.userName || 'CloudiAudi Artiest'}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-400 font-medium">
                  {track.playsCount?.toLocaleString() || 0} plays
                </span>
                <span className="text-[11px] text-muted-foreground capitalize">{track.genre}</span>
              </div>
            </div>
          </div>
        )}

        {/* Social Share Grid */}
        <div className="grid grid-cols-4 gap-3 py-3">
          {/* WhatsApp */}
          <button
            onClick={() => handleOpenSocial('whatsapp')}
            className="flex flex-col items-center gap-2 p-3 rounded-xl bg-secondary/40 hover:bg-emerald-500/15 hover:border-emerald-500/40 border border-transparent transition-all group"
          >
            <div className="w-11 h-11 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.694.06-2.146-.539-1.859-.765-3.047-2.65-3.14-2.775-.093-.125-.758-1.009-.758-1.924 0-.916.48-1.365.65-1.55.171-.185.374-.231.499-.231.125 0 .25.001.359.006.115.005.269-.044.421.323.157.38.536 1.309.584 1.405.048.096.08.209.016.335-.064.126-.096.204-.191.315-.096.111-.202.248-.289.333-.096.096-.197.201-.085.393.112.193.498.822 1.07 1.332.736.656 1.357.859 1.55.955.192.096.304.08.417-.048.112-.128.48-.561.608-.754.128-.192.256-.16.432-.096.176.064 1.121.529 1.313.625.192.096.32.144.368.224.048.08.048.465-.096.87zM12 2C6.477 2 2 6.477 2 12c0 1.891.524 3.66 1.436 5.176L2 22l4.982-1.308C8.425 21.547 10.155 22 12 22c5.523 0 10-4.477 10-10S17.523 2 Ra12 2z"/>
              </svg>
            </div>
            <span className="text-xs font-medium text-foreground">WhatsApp</span>
          </button>

          {/* X / Twitter */}
          <button
            onClick={() => handleOpenSocial('x')}
            className="flex flex-col items-center gap-2 p-3 rounded-xl bg-secondary/40 hover:bg-sky-500/15 hover:border-sky-500/40 border border-transparent transition-all group"
          >
            <div className="w-11 h-11 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
            </div>
            <span className="text-xs font-medium text-foreground">X (Twitter)</span>
          </button>

          {/* Facebook */}
          <button
            onClick={() => handleOpenSocial('facebook')}
            className="flex flex-col items-center gap-2 p-3 rounded-xl bg-secondary/40 hover:bg-blue-600/15 hover:border-blue-600/40 border border-transparent transition-all group"
          >
            <div className="w-11 h-11 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            </div>
            <span className="text-xs font-medium text-foreground">Facebook</span>
          </button>

          {/* Telegram */}
          <button
            onClick={() => handleOpenSocial('telegram')}
            className="flex flex-col items-center gap-2 p-3 rounded-xl bg-secondary/40 hover:bg-cyan-500/15 hover:border-cyan-500/40 border border-transparent transition-all group"
          >
            <div className="w-11 h-11 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.06-.19-.06-.06-.17-.04-.24-.02-.11.02-1.78 1.13-5.03 3.33-.48.33-.91.49-1.3.48-.43-.01-1.25-.24-1.86-.44-.75-.24-1.34-.37-1.29-.78.03-.21.32-.43.89-.66 3.48-1.51 5.8-2.51 6.96-3.01 3.32-1.42 4.01-1.67 4.46-1.68.1 0 .32.02.46.14.12.1.15.24.16.34.02.08.01.24 0 .34z"/>
              </svg>
            </div>
            <span className="text-xs font-medium text-foreground">Telegram</span>
          </button>
        </div>

        {/* Copy for TikTok & Instagram Info Banner */}
        <div className="p-3 bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-orange-500/10 rounded-xl border border-pink-500/20 flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-pink-400 shrink-0 mt-0.5" />
          <div className="text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">Voor TikTok & Instagram Stories:</span> Kopieer de link hieronder en plak deze in je bio, sound-sticker of deel in je story!
          </div>
        </div>

        {/* Link Input & Copy Button */}
        <div className="flex items-center gap-2 mt-2">
          <Input
            value={shareUrl}
            readOnly
            className="bg-secondary/60 text-xs font-mono select-all"
          />
          <Button
            onClick={handleCopyLink}
            variant="default"
            className="bg-orange-500 hover:bg-orange-600 text-white shrink-0"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 mr-1.5" />
                Gekopieerd
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 mr-1.5" />
                Kopiëren
              </>
            )}
          </Button>
        </div>

        {typeof navigator !== 'undefined' && 'share' in navigator && (
          <Button
            variant="outline"
            className="w-full mt-2 rounded-xl"
            onClick={handleNativeShare}
          >
            <Share2 className="w-4 h-4 mr-2 text-orange-400" />
            Meer deelopties via toestel
          </Button>
        )}
      </DialogContent>
    </Dialog>
  );
}
