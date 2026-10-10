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
      <DialogContent className="sm:max-w-md bg-[#161617]/95 border-white/10 text-white rounded-3xl backdrop-blur-3xl shadow-[0_25px_70px_rgba(0,0,0,0.85)] p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-semibold tracking-tight text-white">
            <Share2 className="w-5 h-5 text-[#fa233b]" />
            {track ? 'Deel Track naar Socials' : 'Deel Profiel'}
          </DialogTitle>
          <DialogDescription className="text-xs text-[#86868b]">
            Deel rechtstreeks via WhatsApp, X, Facebook, of kopieer de link voor je socials!
          </DialogDescription>
        </DialogHeader>

        {track && (
          <div className="flex items-center gap-3.5 p-3 bg-[#1c1c1e]/70 rounded-2xl border border-white/[0.08] my-2">
            <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 bg-black/40 ring-1 ring-white/10 shadow-sm">
              <TrackCover track={track} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-sm truncate text-white">{track.title}</p>
              <p className="text-xs text-[#86868b] truncate mt-0.5">{track.userName || 'CloudiAudi Artiest'}</p>
              <div className="flex items-center gap-2 mt-1.5">
                <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-white/10 text-white font-medium border border-white/15">
                  {track.playsCount?.toLocaleString() || 0} plays
                </span>
                <span className="text-[10px] text-[#86868b] capitalize">{track.genre}</span>
              </div>
            </div>
          </div>
        )}

        {/* Social Share Grid */}
        <div className="grid grid-cols-4 gap-2.5 py-3">
          {/* WhatsApp */}
          <button
            onClick={() => handleOpenSocial('whatsapp')}
            className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-[#1c1c1e]/60 hover:bg-[#1c1c1e] hover:border-emerald-500/40 border border-white/[0.06] transition-all group"
          >
            <div className="w-11 h-11 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.694.06-2.146-.539-1.859-.765-3.047-2.65-3.14-2.775-.093-.125-.758-1.009-.758-1.924 0-.916.48-1.365.65-1.55.171-.185.374-.231.499-.231.125 0 .25.001.359.006.115.005.269-.044.421.323.157.38.536 1.309.584 1.405.048.096.08.209.016.335-.064.126-.096.204-.191.315-.096.111-.202.248-.289.333-.096.096-.197.201-.085.393.112.193.498.822 1.07 1.332.736.656 1.357.859 1.55.955.192.096.304.08.417-.048.112-.128.48-.561.608-.754.128-.192.256-.16.432-.096.176.064 1.121.529 1.313.625.192.096.32.144.368.224.048.08.048.465-.096.87zM12 2C6.477 2 2 6.477 2 12c0 1.891.524 3.66 1.436 5.176L2 22l4.982-1.308C8.425 21.547 10.155 22 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2z"/>
              </svg>
            </div>
            <span className="text-xs font-medium text-white">WhatsApp</span>
          </button>

          {/* X / Twitter */}
          <button
            onClick={() => handleOpenSocial('x')}
            className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-[#1c1c1e]/60 hover:bg-[#1c1c1e] hover:border-sky-500/40 border border-white/[0.06] transition-all group"
          >
            <div className="w-11 h-11 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
            </div>
            <span className="text-xs font-medium text-white">X</span>
          </button>

          {/* Facebook */}
          <button
            onClick={() => handleOpenSocial('facebook')}
            className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-[#1c1c1e]/60 hover:bg-[#1c1c1e] hover:border-blue-600/40 border border-white/[0.06] transition-all group"
          >
            <div className="w-11 h-11 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            </div>
            <span className="text-xs font-medium text-white">Facebook</span>
          </button>

          {/* Telegram */}
          <button
            onClick={() => handleOpenSocial('telegram')}
            className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-[#1c1c1e]/60 hover:bg-[#1c1c1e] hover:border-cyan-500/40 border border-white/[0.06] transition-all group"
          >
            <div className="w-11 h-11 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center group-hover:scale-110 transition-transform">
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69.01-.03.01-.14-.06-.19-.06-.06-.17-.04-.24-.02-.11.02-1.78 1.13-5.03 3.33-.48.33-.91.49-1.3.48-.43-.01-1.25-.24-1.86-.44-.75-.24-1.34-.37-1.29-.78.03-.21.32-.43.89-.66 3.48-1.51 5.8-2.51 6.96-3.01 3.32-1.42 4.01-1.67 4.46-1.68.1 0 .32.02.46.14.12.1.15.24.16.34.02.08.01.24 0 .34z"/>
              </svg>
            </div>
            <span className="text-xs font-medium text-white">Telegram</span>
          </button>
        </div>

        {/* Copy for TikTok & Instagram Info Banner */}
        <div className="p-3 bg-white/[0.04] rounded-2xl border border-white/[0.08] flex items-start gap-3">
          <Sparkles className="w-4 h-4 text-white shrink-0 mt-0.5" />
          <div className="text-xs text-[#86868b] leading-relaxed">
            <span className="font-semibold text-white">Voor TikTok & Instagram Stories:</span> Kopieer de link hieronder en plak deze in je bio, sound-sticker of deel in je story!
          </div>
        </div>

        {/* Link Input & Copy Button */}
        <div className="flex items-center gap-2 mt-2">
          <Input
            value={shareUrl}
            readOnly
            className="rounded-xl bg-[#1c1c1e] border-white/10 text-white text-xs font-mono select-all h-10"
          />
          <Button
            onClick={handleCopyLink}
            variant="apple"
            className="rounded-full px-5 font-semibold shrink-0 h-10"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 mr-1.5 stroke-[3]" />
                Gekopieerd
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 mr-1.5" />
                Kopiëren
              </>
            )}
          </Button>
        </div>

        {typeof navigator !== 'undefined' && 'share' in navigator && (
          <Button
            variant="secondary"
            className="w-full mt-2 rounded-full bg-[#1c1c1e] text-white hover:bg-[#2c2c2e] border border-white/[0.08] text-xs h-10"
            onClick={handleNativeShare}
          >
            <Share2 className="w-3.5 h-3.5 mr-2 text-white" />
            Meer deelopties via toestel
          </Button>
        )}
      </DialogContent>
    </Dialog>
  );
}
