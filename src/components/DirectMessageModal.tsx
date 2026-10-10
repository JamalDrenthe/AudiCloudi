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
import { Badge } from '@/components/ui/badge';
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
      <DialogContent className="sm:max-w-xl bg-card border-border max-h-[85vh] flex flex-col p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <MessageSquare className="w-5 h-5 text-orange-500" />
            Privé Berichten
          </DialogTitle>
          <DialogDescription>
            Stuur een direct privé bericht naar één of meerdere accounts tegelijk.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as 'compose' | 'inbox')} className="flex-1 flex flex-col min-h-0 mt-2">
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="compose" className="flex items-center gap-2">
              <Send className="w-4 h-4" />
              Nieuw Bericht
            </TabsTrigger>
            <TabsTrigger value="inbox" className="flex items-center gap-2">
              <Inbox className="w-4 h-4" />
              Inbox ({directMessages.length})
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: COMPOSE MESSAGE */}
          <TabsContent value="compose" className="flex-1 flex flex-col min-h-0 space-y-4 m-0 overflow-y-auto pr-1">
            {/* Recipient Chips & Search */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground flex items-center justify-between">
                <span>Ontvangers ({selectedRecipients.length})</span>
                {selectedRecipients.length > 1 && (
                  <Badge variant="outline" className="text-[10px] text-orange-400 border-orange-500/30">
                    <Users className="w-3 h-3 mr-1" /> Groepsbericht
                  </Badge>
                )}
              </label>

              {/* Selected Chips */}
              {selectedRecipients.length > 0 && (
                <div className="flex flex-wrap gap-1.5 p-2 bg-secondary/40 rounded-xl border border-border">
                  {selectedRecipients.map((rec) => (
                    <div
                      key={rec.id}
                      className="flex items-center gap-1.5 bg-orange-500/15 border border-orange-500/30 text-orange-300 text-xs px-2.5 py-1 rounded-full animate-in fade-in zoom-in-95"
                    >
                      <Avatar className="w-4 h-4">
                        <AvatarImage src={rec.avatarUrl} />
                        <AvatarFallback className="text-[8px]">{rec.displayName[0]}</AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{rec.displayName}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveRecipient(rec.id)}
                        className="hover:text-red-400 transition-colors ml-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Search User Input */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Zoek gebruikers op naam of @username om toe te voegen..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 bg-secondary/50 text-sm"
                />
              </div>

              {/* Suggestions list */}
              <div className="max-h-36 overflow-y-auto space-y-1 bg-secondary/20 p-1.5 rounded-xl border border-border/50">
                <p className="text-[11px] text-muted-foreground px-2 py-0.5">
                  Klik om ontvanger toe te voegen of te verwijderen:
                </p>
                {filteredUsers.length === 0 ? (
                  <p className="text-xs text-muted-foreground p-2 text-center">Geen gebruikers gevonden</p>
                ) : (
                  filteredUsers.map((user) => {
                    const isSelected = selectedRecipients.some((r) => r.id === user.id);
                    return (
                      <button
                        type="button"
                        key={user.id}
                        onClick={() => handleToggleRecipient(user)}
                        className={`w-full flex items-center justify-between p-2 rounded-lg text-left transition-colors ${
                          isSelected
                            ? 'bg-orange-500/20 text-orange-300 border border-orange-500/40'
                            : 'hover:bg-secondary/70 text-foreground'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Avatar className="w-7 h-7">
                            <AvatarImage src={user.avatarUrl} />
                            <AvatarFallback className="text-xs">{user.displayName[0]}</AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold truncate leading-tight">{user.displayName}</p>
                            <p className="text-[11px] text-muted-foreground truncate leading-tight">@{user.username}</p>
                          </div>
                        </div>
                        {isSelected ? (
                          <div className="w-5 h-5 rounded-full bg-orange-500 text-white flex items-center justify-center shrink-0">
                            <Check className="w-3 h-3" />
                          </div>
                        ) : (
                          <span className="text-[11px] text-muted-foreground px-2 py-0.5 rounded bg-secondary">
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
                <label className="text-xs font-semibold text-muted-foreground">Bericht</label>
                <Textarea
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Schrijf hier je privé bericht... bijvoorbeeld over een samenwerking, remix of feedback..."
                  rows={4}
                  className="bg-secondary/50 text-sm resize-none"
                  maxLength={1000}
                />
                <div className="flex justify-between items-center text-[11px] text-muted-foreground px-1">
                  <span>Privé & beveiligd</span>
                  <span>{messageText.length} / 1000 tekens</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button type="button" variant="ghost" onClick={onClose}>
                  Annuleren
                </Button>
                <Button
                  type="submit"
                  disabled={isSending || selectedRecipients.length === 0 || !messageText.trim()}
                  className="bg-orange-500 hover:bg-orange-600 text-white rounded-full px-5"
                >
                  <Send className="w-4 h-4 mr-2" />
                  {isSending ? 'Versturen...' : 'Verstuur Bericht'}
                </Button>
              </div>
            </form>
          </TabsContent>

          {/* TAB 2: INBOX / HISTORY */}
          <TabsContent value="inbox" className="flex-1 min-h-0 overflow-y-auto space-y-3 m-0 pr-1">
            {directMessages.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Inbox className="w-10 h-10 mx-auto mb-2 opacity-40" />
                <p className="text-sm font-medium">Nog geen berichten ontvangen</p>
                <p className="text-xs mt-1">Stuur een bericht naar een artiest om een gesprek te starten!</p>
              </div>
            ) : (
              directMessages.map((msg) => {
                const isSentByMe = msg.senderId === currentUser?.id || msg.senderId === 'admin_jamal';
                return (
                  <div
                    key={msg.id}
                    className="p-3 rounded-xl bg-secondary/30 border border-border/60 hover:border-orange-500/30 transition-all space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Avatar className="w-7 h-7">
                          <AvatarImage src={msg.senderAvatar} />
                          <AvatarFallback className="text-xs">{msg.senderName?.[0] || 'U'}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-xs font-semibold leading-tight flex items-center gap-1.5">
                            {msg.senderName}
                            {isSentByMe && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-orange-500/20 text-orange-400 font-normal">
                                Jij
                              </span>
                            )}
                          </p>
                          <p className="text-[10px] text-muted-foreground leading-tight">
                            Aan: {msg.recipientNames?.join(', ') || 'Ontvanger'}
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(msg.createdAt).toLocaleDateString('nl-NL', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    <p className="text-xs text-foreground/90 bg-secondary/50 p-2.5 rounded-lg whitespace-pre-wrap leading-relaxed">
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
                        className="text-[11px] text-orange-400 hover:text-orange-300 font-medium"
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
