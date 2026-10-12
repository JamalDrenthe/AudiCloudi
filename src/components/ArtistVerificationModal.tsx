import { useState, useRef } from 'react';
import {
  ShieldCheck,
  Upload,
  CheckCircle2,
  FileText,
  Globe,
  User as UserIcon,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import type { User } from '@/types';

interface ArtistVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetArtist?: User | null;
  mode?: 'claim' | 'verify';
}

function compressDocImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const maxWidth = 1200;
        const maxHeight = 800;
        let width = img.width;
        let height = img.height;
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        if (height > maxHeight) {
          width = Math.round((width * maxHeight) / height);
          height = maxHeight;
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve(e.target?.result as string);
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function ArtistVerificationModal({
  isOpen,
  onClose,
  targetArtist,
  mode = 'verify',
}: ArtistVerificationModalProps) {
  const { user: currentUser, isAuthenticated, submitVerification, claimArtistProfile } = useAuth();

  const [legalName, setLegalName] = useState('');
  const [docType, setDocType] = useState<'paspoort' | 'id_kaart' | 'rijbewijs'>('paspoort');
  const [docNumber, setDocNumber] = useState('');
  const [docUrl, setDocUrl] = useState('');
  const [proofUrl, setProofUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const artistToVerify = targetArtist || currentUser;
  const isClaimMode = mode === 'claim';

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      toast.loading('Document verwerken...');
      const compressedData = await compressDocImage(file);
      setDocUrl(compressedData);
      toast.dismiss();
      toast.success('ID / Paspoort document geüpload!');
    } catch {
      toast.dismiss();
      toast.error('Fout bij het uploaden van het document');
    }
  };

  // Demo fallback quick document if testing
  const handleUseDemoDoc = () => {
    setDocUrl('https://images.unsplash.com/photo-1544717305-2782549b5136?w=800&h=500&fit=crop');
    toast.info('Voorbeeld ID / Paspoort document geselecteerd voor test');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.error('Log eerst in om verificatie aan te vragen.');
      return;
    }
    if (!legalName.trim()) {
      toast.error('Vul je volledige wettelijke naam in.');
      return;
    }
    if (!docUrl) {
      toast.error('Upload een foto of scan van je ID-kaart of paspoort.');
      return;
    }

    try {
      setIsSubmitting(true);
      if (isClaimMode && artistToVerify) {
        await claimArtistProfile(artistToVerify.id, {
          legalName,
          docType,
          docUrl,
          proofUrl,
          notes,
        });
        toast.success(`Claim- & ID-verificatie voor ${artistToVerify.displayName} succesvol ingediend!`);
      } else {
        await submitVerification({
          artistId: artistToVerify?.id,
          artistName: artistToVerify?.displayName,
          legalName,
          docType,
          docNumber,
          docUrl,
          proofUrl,
          notes,
        });
        toast.success('ID-verificatie succesvol ingediend! De beheerder controleert je document om het vinkje toe te kennen.');
      }
      onClose();
    } catch (err) {
      console.error(err);
      toast.error('Er is een fout opgetreden bij het indienen.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-xl bg-[#161617]/95 border-white/10 text-white rounded-3xl backdrop-blur-3xl shadow-[0_25px_70px_rgba(0,0,0,0.85)] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[11px] font-semibold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              Officiële Verificatie
            </span>
            {isClaimMode && (
              <span className="px-2.5 py-0.5 rounded-full bg-[#fa233b]/15 text-[#fa233b] border border-[#fa233b]/30 text-[11px] font-semibold flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                Profiel Claimen
              </span>
            )}
          </div>
          <DialogTitle className="text-xl font-semibold tracking-tight text-white flex items-center gap-2">
            {isClaimMode
              ? `Claim Artiestenprofiel: ${artistToVerify?.displayName || 'Artiest'}`
              : `ID / Paspoort Verificatie voor Geverifieerd Vinkje`}
          </DialogTitle>
          <DialogDescription className="text-xs text-[#86868b] leading-relaxed">
            Om identiteitsfraude te voorkomen en de integriteit van muziekrechten te beschermen,
            vereist CloudiAudi een eenmalige controle met een geldig paspoort of ID-kaart voor het officiële vinkje.
          </DialogDescription>
        </DialogHeader>

        {/* ARTIST INFO SUMMARY */}
        {artistToVerify && (
          <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-[#1c1c1e]/70 border border-white/[0.06]">
            <Avatar className="w-12 h-12 ring-1 ring-white/10 shrink-0">
              <AvatarImage src={artistToVerify.avatarUrl} />
              <AvatarFallback>{artistToVerify.displayName[0]}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm text-white truncate">{artistToVerify.displayName}</span>
                <span className="text-xs text-[#86868b]">@{artistToVerify.username}</span>
              </div>
              <p className="text-[11px] text-[#86868b] mt-0.5 truncate">
                {artistToVerify.genre || 'Artiest'} • {artistToVerify.labelName ? `Getekend bij ${artistToVerify.labelName}` : 'Independent'}
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          {/* STEP 1: LEGAL DETAILS */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-white flex items-center gap-1.5 border-b border-white/[0.06] pb-1.5">
              <UserIcon className="w-3.5 h-3.5 text-[#fa233b]" />
              1. Wettelijke Gegevens van de Artiest
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-[#86868b]">
                  Wettelijke Naam (voor- & achternaam) *
                </label>
                <Input
                  value={legalName}
                  onChange={(e) => setLegalName(e.target.value)}
                  placeholder="Bijv. Bibi van der Zee"
                  className="rounded-xl bg-[#1c1c1e] border-white/10 text-white placeholder:text-[#86868b] text-xs"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-medium text-[#86868b]">Type Identiteitsbewijs *</label>
                <select
                  value={docType}
                  onChange={(e) => setDocType(e.target.value as 'paspoort' | 'id_kaart' | 'rijbewijs')}
                  className="w-full h-9 rounded-xl bg-[#1c1c1e] border border-white/10 text-xs text-white px-3 focus:outline-none focus:ring-1 focus:ring-[#fa233b]"
                >
                  <option value="paspoort">Paspoort (Nationaal / Internationaal)</option>
                  <option value="id_kaart">Nederlandse Identiteitskaart (ID-kaart)</option>
                  <option value="rijbewijs">Rijbewijs</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-medium text-[#86868b]">Documentnummer (Optioneel)</label>
              <Input
                value={docNumber}
                onChange={(e) => setDocNumber(e.target.value)}
                placeholder="Bijv. NX829104"
                className="rounded-xl bg-[#1c1c1e] border-white/10 text-white placeholder:text-[#86868b] text-xs font-mono"
              />
            </div>
          </div>

          {/* STEP 2: DOCUMENT UPLOAD */}
          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-1.5">
              <h4 className="text-xs font-semibold text-white flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-[#fa233b]" />
                2. Upload ID-kaart of Paspoort *
              </h4>
              <button
                type="button"
                onClick={handleUseDemoDoc}
                className="text-[10px] text-amber-400 hover:underline"
              >
                Gebruik Test Document
              </button>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="image/*"
              className="hidden"
            />

            {docUrl ? (
              <div className="relative rounded-2xl overflow-hidden border border-emerald-500/30 bg-black/40 p-2">
                <div className="flex items-center justify-between pb-2 px-1">
                  <span className="text-[11px] font-medium text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Document geüpload
                  </span>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-[11px] text-[#fa233b] hover:underline"
                  >
                    Vervang document
                  </button>
                </div>
                <img
                  src={docUrl}
                  alt="Geüpload identiteitsbewijs"
                  className="w-full h-36 object-cover rounded-xl border border-white/10"
                />
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-white/15 hover:border-[#fa233b]/50 rounded-2xl p-6 text-center cursor-pointer transition-colors bg-[#1c1c1e]/40 hover:bg-[#1c1c1e]/70"
              >
                <Upload className="w-8 h-8 mx-auto text-[#86868b] mb-2" />
                <p className="text-xs font-medium text-white">Klik om foto of scan van je ID of paspoort te uploaden</p>
                <p className="text-[10px] text-[#86868b] mt-1">
                  JPG of PNG (max 10MB). Zorg dat je naam en foto scherp zichtbaar zijn.
                </p>
              </div>
            )}

            <div className="flex items-start gap-2 p-2.5 rounded-xl bg-amber-500/[0.06] border border-amber-500/20 text-[11px] text-amber-200/90 leading-tight">
              <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
              <span>
                Privacygarantie: Je identiteitsbewijs wordt uitsluitend vertrouwelijk gebruikt voor verificatie door het platform en wordt nooit publiekelijk zichtbaar gemaakt.
              </span>
            </div>
          </div>

          {/* STEP 3: PROOF & SOCIALS */}
          <div className="space-y-3 pt-1">
            <h4 className="text-xs font-semibold text-white flex items-center gap-1.5 border-b border-white/[0.06] pb-1.5">
              <Globe className="w-3.5 h-3.5 text-[#fa233b]" />
              3. Bewijs van Artiestenschap & Socials
            </h4>

            <div className="space-y-1">
              <label className="text-[11px] font-medium text-[#86868b]">
                Officiële Link (Spotify, Instagram, Apple Music of Contract)
              </label>
              <Input
                value={proofUrl}
                onChange={(e) => setProofUrl(e.target.value)}
                placeholder="https://instagram.com/jouwnaam of spotify link"
                className="rounded-xl bg-[#1c1c1e] border-white/10 text-white placeholder:text-[#86868b] text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-medium text-[#86868b]">
                Toelichting / Notities voor het Beheer
              </label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Bijv. Ik ben de officiële maker van deze muziek en wil graag mijn profiel beheren en verifiëren..."
                rows={2}
                className="rounded-xl bg-[#1c1c1e] border-white/10 text-white placeholder:text-[#86868b] resize-none text-xs"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-white/[0.08]">
            <Button
              type="button"
              variant="ghost"
              className="rounded-full text-[#86868b] hover:text-white hover:bg-white/10"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Annuleren
            </Button>
            <Button
              type="submit"
              variant="apple"
              className="rounded-full px-6 font-semibold"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Bezig met indienen...' : isClaimMode ? 'Claim & Verificatie Indienen' : 'Verificatie Aanvragen'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
