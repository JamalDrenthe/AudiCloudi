import { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/context/AuthContext';
import { mockUsers } from '@/data/mockData';
import { toast } from 'sonner';
import { MessageSquare, Send, Search, X, Check, Users, Inbox } from 'lucide-react';
import type { User } from '@/types';

interface DirectMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialRecipient?: User | null;
}

export function DirectMessageModal({ isOpen, onClose, initialRecipient }: DirectMessageModalProps) {
  const { user: currentUser, directMessages, sendDirectMessage, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState<'compose' | 'inbox'>('compose');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRecipients, setSelectedRecipients] = useState<User[]>([]);
  const [messageText, setMessageText] = useState('');
  const [isSending, setIsSending] = useState(false);

  // When initialRecipient changes and modal opens
  useEffect(() => {
    if (isOpen && initialRecipient && initialRecipient.id !== currentUser?.id) {
      setSelectedRecipients([initialRecipient]);
      setActiveTab('compose');
    }
  }, [isOpen, initialRecipient, currentUser?.id]);

  // Available users list (excluding current user)
  const availableUsers = useMemo(() => {
    return mockUsers.filter((u) => u.id !== currentUser?.id);
  }, [currentUser?.id]);

  // Filtered users for search suggestions
  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) {
      return availableUsers.slice(0, 5);
    }
    const q = searchQuery.toLowerCase().trim();
    return availableUsers.filter(
      (u) =>
        u.displayName.toLowerCase().includes(q) ||
        u.username.toLowerCase().includes(q) ||
        (u.bio && u.bio.toLowerCase().includes(q))
    );
  }, [availableUsers, searchQuery]);

  const handleToggleRecipient = (user: User) => {
    if (selectedRecipients.some((r) => r.id === user.id)) {
      setSelectedRecipients(selectedRecipients.filter((r) => r.id !== user.id));
    } else {
      setSelectedRecipients([...selectedRecipients, user]);
      setSearchQuery('');
    }
  };

  const handleRemoveRecipient = (userId: string) => {
    setSelectedRecipients(selectedRecipients.filter((r) => r.id !== userId));
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.error('Je moet ingelogd zijn om privé berichten te sturen.');
      return;
    }
    if (selectedRecipients.length === 0) {
      toast.error('Selecteer minimaal één ontvanger.');
      return;
    }
    if (!messageText.trim()) {
      toast.error('Vul een bericht in.');
      return;
    }

    setIsSending(true);
    try {
      const recipientIds = selectedRecipients.map((r) => r.id);
      const recipientNames = selectedRecipients.map((r) => r.displayName);

      await sendDirectMessage(recipientIds, recipientNames, messageText.trim());
      toast.success(
        selectedRecipients.length > 1
          ? `Bericht verstuurd naar ${selectedRecipients.length} personen!`
          : `Bericht verstuurd naar ${selectedRecipients[0].displayName}!`
      );
      setMessageText('');
      if (!initialRecipient) {
        setSelectedRecipients([]);
      }
      setActiveTab('inbox');
    } catch {
      toast.error('Fout bij versturen van bericht.');
    } finally {
      setIsSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-xl bg-[#161617]/95 border-white/10 text-white rounded-3xl backdrop-blur-3xl shadow-[0_25px_70px_rgba(0,0,0,0.85)] max-h-[85vh] flex flex-col p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-semibold tracking-tight text-white">
            <MessageSquare className="w-5 h-5 text-[#fa233b]" />
            Privé Berichten
          </DialogTitle>
          <DialogDescription className="text-xs text-[#86868b]">
            Stuur een direct privé bericht naar één of meerdere accounts tegelijk.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as 'compose' | 'inbox')} className="flex-1 flex flex-col min-h-0 mt-2">
          <TabsList className="p-1 rounded-full bg-[#1c1c1e]/90 border border-white/[0.08] backdrop-blur-xl grid grid-cols-2 mb-4">
            <TabsTrigger
              value="compose"
              className="flex items-center justify-center gap-2 rounded-full py-1.5 text-xs font-medium text-[#86868b] hover:text-white data-[state=active]:bg-white data-[state=active]:text-black transition-all"
            >
              <Send className="w-3.5 h-3.5" />
              Nieuw Bericht
            </TabsTrigger>
            <TabsTrigger
              value="inbox"
              className="flex items-center justify-center gap-2 rounded-full py-1.5 text-xs font-medium text-[#86868b] hover:text-white data-[state=active]:bg-white data-[state=active]:text-black transition-all"
            >
              <Inbox className="w-3.5 h-3.5" />
              Inbox ({directMessages.length})
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: COMPOSE MESSAGE */}
          <TabsContent value="compose" className="flex-1 flex flex-col min-h-0 space-y-4 m-0 overflow-y-auto pr-1">
            {/* Recipient Chips & Search */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-[#86868b] flex items-center justify-between">
                <span>Ontvangers ({selectedRecipients.length})</span>
                {selectedRecipients.length > 1 && (
                  <span className="text-[10px] text-white px-2.5 py-0.5 rounded-full bg-white/10 border border-white/15 flex items-center">
                    <Users className="w-3 h-3 mr-1" /> Groepsbericht
                  </span>
                )}
              </label>

              {/* Selected Chips */}
              {selectedRecipients.length > 0 && (
                <div className="flex flex-wrap gap-1.5 p-2 bg-[#1c1c1e]/60 rounded-2xl border border-white/[0.08]">
                  {selectedRecipients.map((rec) => (
                    <div
                      key={rec.id}
                      className="flex items-center gap-1.5 bg-white/10 border border-white/15 text-white text-xs px-2.5 py-1 rounded-full animate-in fade-in zoom-in-95"
                    >
                      <Avatar className="w-4 h-4">
                        <AvatarImage src={rec.avatarUrl} />
                        <AvatarFallback className="text-[8px] bg-black text-white">{rec.displayName[0]}</AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{rec.displayName}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveRecipient(rec.id)}
                        className="hover:text-white/60 transition-colors ml-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Search User Input */}
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#86868b]" />
                <Input
                  type="text"
                  placeholder="Zoek gebruikers op naam of @username..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 rounded-xl bg-[#1c1c1e] border-white/10 text-white placeholder:text-[#86868b] text-xs h-10"
                />
              </div>

              {/* Suggestions list */}
              <div className="max-h-36 overflow-y-auto space-y-1 bg-[#1c1c1e]/40 p-1.5 rounded-2xl border border-white/[0.06]">
                <p className="text-[11px] text-[#86868b] px-2 py-0.5">
                  Klik om ontvanger toe te voegen of te verwijderen:
                </p>
                {filteredUsers.length === 0 ? (
                  <p className="text-xs text-[#86868b] p-2 text-center">Geen gebruikers gevonden</p>
                ) : (
                  filteredUsers.map((user) => {
                    const isSelected = selectedRecipients.some((r) => r.id === user.id);
                    return (
                      <button
                        type="button"
                        key={user.id}
                        onClick={() => handleToggleRecipient(user)}
                        className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-colors ${
                          isSelected
                            ? 'bg-white/10 text-white border border-white/20'
                            : 'hover:bg-white/[0.06] text-white'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Avatar className="w-7 h-7 ring-1 ring-white/10 bg-[#1c1c1e]">
                            <AvatarImage src={user.avatarUrl} />
                            <AvatarFallback className="text-xs bg-[#1c1c1e] text-white">{user.displayName[0]}</AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold truncate leading-tight text-white">{user.displayName}</p>
                            <p className="text-[11px] text-[#86868b] truncate leading-tight">@{user.username}</p>
                          </div>
                        </div>
                        {isSelected ? (
                          <div className="w-5 h-5 rounded-full bg-white text-black flex items-center justify-center shrink-0">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        ) : (
                          <span className="text-[11px] text-[#86868b] px-2 py-0.5 rounded-full bg-[#1c1c1e] border border-white/[0.06]">
                            + Toevoegen
                          </span>
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* Message Body */}
            <form onSubmit={handleSendMessage} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-[#86868b]">Bericht</label>
                <Textarea
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Schrijf hier je privé bericht... bijvoorbeeld over een samenwerking, remix of feedback..."
                  rows={4}
                  className="rounded-xl bg-[#1c1c1e] border-white/10 text-white placeholder:text-[#86868b] text-xs resize-none"
                  maxLength={1000}
                />
                <div className="flex justify-between items-center text-[11px] text-[#86868b] px-1">
                  <span>Privé & beveiligd</span>
                  <span>{messageText.length} / 1000 tekens</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button type="button" variant="ghost" className="rounded-full text-[#86868b] hover:text-white hover:bg-white/10" onClick={onClose}>
                  Annuleren
                </Button>
                <Button
                  type="submit"
                  disabled={isSending || selectedRecipients.length === 0 || !messageText.trim()}
                  variant="apple"
                  className="rounded-full px-6 font-semibold"
                >
                  <Send className="w-3.5 h-3.5 mr-2" />
                  {isSending ? 'Versturen...' : 'Verstuur Bericht'}
                </Button>
              </div>
            </form>
          </TabsContent>

          {/* TAB 2: INBOX / HISTORY */}
          <TabsContent value="inbox" className="flex-1 min-h-0 overflow-y-auto space-y-3 m-0 pr-1">
            {directMessages.length === 0 ? (
              <div className="text-center py-12 text-[#86868b]">
                <Inbox className="w-10 h-10 mx-auto mb-2 opacity-40" />
                <p className="text-sm font-medium text-white">Nog geen berichten ontvangen</p>
                <p className="text-xs mt-1">Stuur een bericht naar een artiest om een gesprek te starten!</p>
              </div>
            ) : (
              directMessages.map((msg) => {
                const isSentByMe = msg.senderId === currentUser?.id || msg.senderId === 'admin_jamal';
                return (
                  <div
                    key={msg.id}
                    className="p-3.5 rounded-2xl bg-[#1c1c1e]/70 border border-white/[0.06] hover:border-white/15 transition-all space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Avatar className="w-7 h-7 ring-1 ring-white/10 bg-[#1c1c1e]">
                          <AvatarImage src={msg.senderAvatar} />
                          <AvatarFallback className="text-xs bg-[#1c1c1e] text-white">{msg.senderName?.[0] || 'U'}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-xs font-semibold leading-tight flex items-center gap-1.5 text-white">
                            {msg.senderName}
                            {isSentByMe && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/10 text-white font-normal">
                                Jij
                              </span>
                            )}
                          </p>
                          <p className="text-[10px] text-[#86868b] leading-tight">
                            Aan: {msg.recipientNames?.join(', ') || 'Ontvanger'}
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] text-[#86868b]">
                        {new Date(msg.createdAt).toLocaleDateString('nl-NL', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    <p className="text-xs text-[#f5f5f7] bg-[#161617] border border-white/[0.04] p-2.5 rounded-xl whitespace-pre-wrap leading-relaxed">
                      {msg.content}
                    </p>

                    <div className="flex justify-end pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          const originalSender = mockUsers.find((u) => u.id === msg.senderId);
                          if (originalSender) {
                            setSelectedRecipients([originalSender]);
                          }
                          setActiveTab('compose');
                        }}
                        className="text-[11px] text-white hover:underline font-medium"
                      >
                        Beantwoorden →
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
