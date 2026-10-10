import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Search, Upload, Menu, X, User, LogOut, Bell, ListMusic, Coins, CreditCard, Trophy, MessageSquare, Music2, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DirectMessageModal } from '@/components/DirectMessageModal';
import { useAuth } from '@/context/AuthContext';
import { mockNotifications } from '@/data/mockData';
import { addRecentSearch } from '@/lib/searchHistory';
import logoImg from '@/assets/logo.png';

export function Navbar() {
  const { user, isAuthenticated, logout, credits, plan, directMessages } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDMOpen, setIsDMOpen] = useState(false);

  const unreadNotifications = mockNotifications.filter(n => !n.read).length;

  // Automatically close mobile menu on route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // Lock background scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      addRecentSearch(searchQuery.trim(), user?.id);
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 h-12 md:h-14 bg-black/80 backdrop-blur-2xl backdrop-saturate-150 border-b border-white/[0.08] transition-all">
      <div className="h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-full gap-3 sm:gap-6">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 flex-shrink-0 group">
            <div className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center transition-transform duration-200 group-hover:scale-105">
              <img src={logoImg} alt="CloudiAudi" className="w-full h-full object-contain drop-shadow-[0_2px_8px_rgba(40,80,180,0.4)]" />
            </div>
            <span className="text-sm font-semibold tracking-[-0.02em] text-[#f5f5f7] hidden sm:block group-hover:text-white transition-colors">
              CloudiAudi
            </span>
          </Link>

          {/* Navigation Links - Desktop */}
          <div className="hidden lg:flex items-center gap-6">
            <Link
              to="/"
              className="text-[13px] font-normal text-[#f5f5f7]/70 hover:text-white transition-colors duration-200 tracking-tight"
            >
              Home
            </Link>
            <Link
              to="/charts"
              className="text-[13px] font-normal text-[#f5f5f7]/70 hover:text-white transition-colors duration-200 tracking-tight flex items-center gap-1.5"
            >
              <Trophy className="w-3.5 h-3.5 text-amber-400" />
              <span>Top 20</span>
            </Link>
            <Link
              to="/artists"
              className="text-[13px] font-normal text-[#f5f5f7]/70 hover:text-white transition-colors duration-200 tracking-tight flex items-center gap-1.5"
            >
              <Music2 className="w-3.5 h-3.5 text-[#fa233b]" />
              <span>Artiesten</span>
            </Link>
            <Link
              to="/library"
              className="text-[13px] font-normal text-[#f5f5f7]/70 hover:text-white transition-colors duration-200 tracking-tight"
            >
              Library
            </Link>
            <Link
              to="/pricing"
              className="text-[13px] font-normal text-[#f5f5f7]/70 hover:text-white transition-colors duration-200 tracking-tight"
            >
              Prijzen
            </Link>
            {isAuthenticated && (
              <Link
                to="/upload"
                className="text-[13px] font-normal text-[#f5f5f7]/70 hover:text-white transition-colors duration-200 tracking-tight flex items-center gap-1"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload</span>
              </Link>
            )}
          </div>

          {/* Apple Spotlight Search Bar */}
          <form onSubmit={handleSearch} className="flex-1 max-w-xs sm:max-w-sm hidden sm:block">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#86868b] group-focus-within:text-[#f5f5f7] transition-colors" />
              <input
                type="search"
                placeholder="Zoeken naar nummers, artiesten..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-8 pl-9 pr-3 text-xs bg-white/[0.08] hover:bg-white/[0.12] focus:bg-white/[0.14] text-[#f5f5f7] placeholder-[#86868b] border border-white/[0.08] focus:border-white/20 rounded-full outline-none transition-all duration-200"
              />
            </div>
          </form>

          {/* Right Action Icons & User */}
          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <>
                {/* Apple Wallet / Credits Pill (visible on sm+) */}
                <Link
                  to="/pricing"
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.08] hover:bg-white/[0.14] border border-white/[0.08] text-xs font-medium text-[#f5f5f7] transition-all"
                  title="Credits overzicht"
                >
                  <Coins className="w-3 h-3 text-amber-400" />
                  <span className="font-mono text-[11px]">{(credits || 0).toLocaleString()}</span>
                </Link>

                {/* Direct Messages (visible on md+) */}
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="hidden md:flex relative text-[#f5f5f7]/80 hover:text-white"
                  onClick={() => setIsDMOpen(true)}
                  title="Privé berichten"
                >
                  <MessageSquare className="w-4 h-4" />
                  {directMessages.length > 0 && (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-[#fa233b] rounded-full ring-2 ring-black" />
                  )}
                </Button>

                {/* Notifications (visible on md+) */}
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="hidden md:flex relative text-[#f5f5f7]/80 hover:text-white"
                  onClick={() => navigate('/notifications')}
                  title="Meldingen"
                >
                  <Bell className="w-4 h-4" />
                  {unreadNotifications > 0 && (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-[#fa233b] rounded-full ring-2 ring-black" />
                  )}
                </Button>

                {/* User Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="relative h-7 w-7 rounded-full overflow-hidden ring-1 ring-white/20 hover:ring-white/40 transition-all outline-none">
                      <Avatar className="h-full w-full">
                        <AvatarImage src={user?.avatarUrl} alt={user?.displayName} />
                        <AvatarFallback className="text-xs">{user?.displayName?.[0]}</AvatarFallback>
                      </Avatar>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-60 bg-[#1c1c1e]/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl p-1.5 text-[#f5f5f7]" align="end">
                    <div className="flex items-center gap-2.5 p-2 rounded-xl bg-white/[0.04]">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user?.avatarUrl} alt={user?.displayName} />
                        <AvatarFallback>{user?.displayName?.[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col min-w-0">
                        <p className="text-xs font-semibold text-white truncate">{user?.displayName}</p>
                        <p className="text-[11px] text-[#86868b] truncate">@{user?.username}</p>
                      </div>
                    </div>
                    <div className="px-2.5 py-1.5 bg-white/[0.03] rounded-lg my-1 flex items-center justify-between text-xs">
                      <span className="text-[#86868b] text-[11px] capitalize">Plan: <strong className="text-white font-medium">{plan || 'Artiest'}</strong></span>
                      <span className="font-mono text-amber-400 font-medium text-[11px] flex items-center gap-1">
                        <Coins className="w-3 h-3" />
                        {(credits || 0).toLocaleString()}
                      </span>
                    </div>
                    <DropdownMenuSeparator className="bg-white/[0.08]" />
                    <DropdownMenuItem className="rounded-lg text-xs hover:bg-white/[0.08] cursor-pointer" onClick={() => setIsDMOpen(true)}>
                      <MessageSquare className="mr-2 h-3.5 w-3.5 text-[#fa233b]" />
                      Privé Berichten
                    </DropdownMenuItem>
                    <DropdownMenuItem className="rounded-lg text-xs hover:bg-white/[0.08] cursor-pointer" asChild>
                      <Link to="/charts">
                        <Trophy className="mr-2 h-3.5 w-3.5 text-amber-400" />
                        Top 20 Hitlijst
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="rounded-lg text-xs hover:bg-white/[0.08] cursor-pointer" asChild>
                      <Link to="/library?tab=uploads">
                        <ListMusic className="mr-2 h-3.5 w-3.5" />
                        Mijn Bibliotheek
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="rounded-lg text-xs hover:bg-white/[0.08] cursor-pointer" asChild>
                      <Link to="/pricing">
                        <CreditCard className="mr-2 h-3.5 w-3.5 text-[#2997ff]" />
                        Abonnement & Credits
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="rounded-lg text-xs hover:bg-white/[0.08] cursor-pointer" asChild>
                      <Link to={`/user/${user?.id}`}>
                        <User className="mr-2 h-3.5 w-3.5" />
                        Profiel
                      </Link>
                    </DropdownMenuItem>
                    {user?.role === 'admin' && (
                      <DropdownMenuItem className="rounded-lg text-xs hover:bg-white/[0.08] cursor-pointer" asChild>
                        <Link to="/admin">Admin Paneel</Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator className="bg-white/[0.08]" />
                    <DropdownMenuItem className="rounded-lg text-xs text-rose-400 hover:bg-white/[0.08] cursor-pointer" onClick={logout}>
                      <LogOut className="mr-2 h-3.5 w-3.5" />
                      Uitloggen
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" asChild className="text-xs text-[#f5f5f7]/80 hover:text-white px-2.5 sm:px-3">
                  <Link to="/login">Inloggen</Link>
                </Button>
                <Button variant="apple" size="sm" asChild className="hidden sm:inline-flex text-xs px-3.5 h-7">
                  <Link to="/register">Aanmelden</Link>
                </Button>
              </div>
            )}

            {/* Mobile Menu Button - High contrast, accessible Apple glass button */}
            <button
              type="button"
              className="lg:hidden w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/[0.08] hover:bg-white/[0.16] active:scale-95 border border-white/10 flex items-center justify-center text-white transition-all shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label={isMobileMenuOpen ? "Menu sluiten" : "Menu openen"}
            >
              {isMobileMenuOpen ? (
                <X className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              ) : (
                <Menu className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              )}
            </button>
          </div>
        </div>
      </div>
    </nav>

    {/* Fullscreen Apple-Style Mobile Menu Overlay (Rendered outside <nav> to avoid containing-block collapse) */}
    {isMobileMenuOpen && (
      <div
        className="lg:hidden fixed inset-0 z-[100] bg-black/98 backdrop-blur-3xl flex flex-col animate-fade-in"
        style={{ height: '100dvh' }}
      >
        {/* Mobile Header Bar */}
        <div className="h-12 md:h-14 px-4 sm:px-6 flex items-center justify-between border-b border-white/[0.08] flex-shrink-0 bg-black/50">
          <Link
            to="/"
            onClick={() => setIsMobileMenuOpen(false)}
            className="flex items-center gap-2.5"
          >
            <div className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center">
              <img src={logoImg} alt="CloudiAudi" className="w-full h-full object-contain drop-shadow-[0_2px_8px_rgba(40,80,180,0.4)]" />
            </div>
            <span className="text-sm font-semibold tracking-[-0.02em] text-[#f5f5f7]">
              CloudiAudi
            </span>
          </Link>

          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(false)}
            className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/[0.1] hover:bg-white/[0.2] active:scale-95 border border-white/15 flex items-center justify-center text-white transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
            aria-label="Menu sluiten"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </button>
        </div>

        {/* Scrollable Menu Body */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-5 space-y-5 overscroll-contain">
          {/* Spotlight Search */}
          <form onSubmit={handleSearch} className="w-full">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#86868b]" />
              <input
                type="search"
                placeholder="Zoeken naar tracks, artiesten..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-11 pl-10 pr-4 text-sm bg-white/[0.08] text-white placeholder-[#86868b] border border-white/10 rounded-2xl outline-none focus:border-white/30 focus:bg-white/[0.12] transition-all"
              />
            </div>
          </form>

          {/* User Status Card (when logged in) */}
          {isAuthenticated && user && (
            <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/[0.08] space-y-3">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 ring-1 ring-white/20">
                  <AvatarImage src={user.avatarUrl} alt={user.displayName} />
                  <AvatarFallback className="text-xs font-semibold">{user.displayName?.[0]}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">{user.displayName}</p>
                  <p className="text-xs text-[#86868b] truncate">@{user.username}</p>
                </div>
                <Link
                  to="/pricing"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="px-2.5 py-1 rounded-full bg-white/[0.08] hover:bg-white/[0.14] border border-white/[0.08] flex items-center gap-1.5 text-xs text-amber-400 font-medium transition-colors"
                >
                  <Coins className="w-3.5 h-3.5" />
                  <span className="font-mono text-xs">{(credits || 0).toLocaleString()}</span>
                </Link>
              </div>

              {/* Quick User Actions */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/[0.06]">
                <button
                  type="button"
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    setIsDMOpen(true);
                  }}
                  className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] active:scale-98 text-xs font-medium text-white transition-all"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-[#fa233b]" />
                  <span>Berichten</span>
                  {directMessages.length > 0 && (
                    <span className="w-2 h-2 rounded-full bg-[#fa233b]" />
                  )}
                </button>
                <Link
                  to="/notifications"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] active:scale-98 text-xs font-medium text-white transition-all"
                >
                  <Bell className="w-3.5 h-3.5 text-blue-400" />
                  <span>Meldingen</span>
                  {unreadNotifications > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full bg-[#fa233b] text-[10px] text-white font-bold">
                      {unreadNotifications}
                    </span>
                  )}
                </Link>
              </div>
            </div>
          )}

          {/* Navigation Links Group */}
          <div className="space-y-1">
            <p className="text-[11px] font-semibold text-[#86868b] tracking-wider uppercase px-3 mb-1">
              Navigatie
            </p>

            <Link
              to="/"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center justify-between px-3.5 py-3 rounded-xl text-base font-medium text-white hover:bg-white/[0.06] active:bg-white/[0.1] transition-colors"
            >
              <span>Home</span>
            </Link>

            <Link
              to="/charts"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center justify-between px-3.5 py-3 rounded-xl text-base font-medium text-amber-400 hover:bg-white/[0.06] active:bg-white/[0.1] transition-colors"
            >
              <div className="flex items-center gap-3">
                <Trophy className="w-5 h-5 text-amber-400" />
                <span>Top 20 Hitlijst</span>
              </div>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-400/10 border border-amber-400/20 text-amber-400 font-semibold">
                Hot
              </span>
            </Link>

            <Link
              to="/artists"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center justify-between px-3.5 py-3 rounded-xl text-base font-medium text-white hover:bg-white/[0.06] active:bg-white/[0.1] transition-colors"
            >
              <div className="flex items-center gap-3">
                <Music2 className="w-5 h-5 text-[#fa233b]" />
                <span>Artiesten & Zheavenzy</span>
              </div>
            </Link>

            <Link
              to="/library"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center justify-between px-3.5 py-3 rounded-xl text-base font-medium text-white hover:bg-white/[0.06] active:bg-white/[0.1] transition-colors"
            >
              <div className="flex items-center gap-3">
                <ListMusic className="w-5 h-5 text-[#86868b]" />
                <span>Mijn Bibliotheek</span>
              </div>
            </Link>

            <Link
              to="/pricing"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center justify-between px-3.5 py-3 rounded-xl text-base font-medium text-white hover:bg-white/[0.06] active:bg-white/[0.1] transition-colors"
            >
              <div className="flex items-center gap-3">
                <CreditCard className="w-5 h-5 text-[#2997ff]" />
                <span>Prijzen & Credits</span>
              </div>
            </Link>

            {isAuthenticated && (
              <Link
                to="/upload"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center justify-between px-3.5 py-3 rounded-xl text-base font-medium text-[#f5f5f7] bg-white/[0.05] hover:bg-white/[0.1] active:bg-white/[0.12] border border-white/10 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Upload className="w-5 h-5 text-[#fa233b]" />
                  <span>Upload Nummers</span>
                </div>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#fa233b]/20 text-[#fa233b] font-semibold">
                  Studio
                </span>
              </Link>
            )}

            {isAuthenticated && (
              <Link
                to={`/user/${user?.id}`}
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center justify-between px-3.5 py-3 rounded-xl text-base font-medium text-white hover:bg-white/[0.06] active:bg-white/[0.1] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-[#86868b]" />
                  <span>Mijn Profiel</span>
                </div>
              </Link>
            )}

            {user?.role === 'admin' && (
              <Link
                to="/admin"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center justify-between px-3.5 py-3 rounded-xl text-base font-medium text-purple-400 hover:bg-white/[0.06] active:bg-white/[0.1] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-purple-400" />
                  <span>Admin Paneel</span>
                </div>
              </Link>
            )}
          </div>

          {/* Bottom Actions */}
          <div className="pt-4 border-t border-white/10">
            {isAuthenticated ? (
              <Button
                variant="outline"
                size="lg"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  logout();
                }}
                className="w-full text-rose-400 border-rose-500/20 hover:bg-rose-500/10 hover:border-rose-500/30 flex items-center justify-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                <span>Uitloggen</span>
              </Button>
            ) : (
              <div className="space-y-3">
                <Button variant="apple" size="lg" className="w-full text-sm font-semibold" asChild>
                  <Link to="/register" onClick={() => setIsMobileMenuOpen(false)}>
                    Account aanmaken
                  </Link>
                </Button>
                <Button variant="secondary" size="lg" className="w-full text-sm" asChild>
                  <Link to="/login" onClick={() => setIsMobileMenuOpen(false)}>
                    Inloggen
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    )}

    {/* Direct Message Modal */}
    <DirectMessageModal isOpen={isDMOpen} onClose={() => setIsDMOpen(false)} />
  </>
);
}
