import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Upload, Menu, X, User, LogOut, Bell, ListMusic, Coins, CreditCard, Trophy, MessageSquare, Music2 } from 'lucide-react';
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
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDMOpen, setIsDMOpen] = useState(false);

  const unreadNotifications = mockNotifications.filter(n => !n.read).length;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      addRecentSearch(searchQuery.trim(), user?.id);
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 h-12 md:h-14 bg-black/80 backdrop-blur-2xl backdrop-saturate-180 border-b border-white/[0.08] transition-all">
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
                {/* Apple Wallet / Credits Pill */}
                <Link
                  to="/pricing"
                  className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.08] hover:bg-white/[0.14] border border-white/[0.08] text-xs font-medium text-[#f5f5f7] transition-all"
                  title="Credits overzicht"
                >
                  <Coins className="w-3 h-3 text-amber-400" />
                  <span className="font-mono text-[11px]">{(credits || 0).toLocaleString()}</span>
                </Link>

                {/* Direct Messages */}
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="relative text-[#f5f5f7]/80 hover:text-white"
                  onClick={() => setIsDMOpen(true)}
                  title="Privé berichten"
                >
                  <MessageSquare className="w-4 h-4" />
                  {directMessages.length > 0 && (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-[#fa233b] rounded-full ring-2 ring-black" />
                  )}
                </Button>

                {/* Notifications */}
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="relative text-[#f5f5f7]/80 hover:text-white"
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
              <div className="hidden sm:flex items-center gap-2">
                <Button variant="ghost" size="sm" asChild className="text-xs text-[#f5f5f7]/80 hover:text-white">
                  <Link to="/login">Inloggen</Link>
                </Button>
                <Button variant="apple" size="sm" asChild className="text-xs px-3.5 h-7">
                  <Link to="/register">Aanmelden</Link>
                </Button>
              </div>
            )}

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon-sm"
              className="lg:hidden text-[#f5f5f7]"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Menu"
            >
              {isMobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-x-0 top-12 md:top-14 bottom-0 bg-black/95 backdrop-blur-2xl z-40 p-6 flex flex-col justify-between overflow-y-auto">
          <div className="space-y-6">
            {/* Mobile Search */}
            <form onSubmit={handleSearch}>
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#86868b]" />
                <input
                  type="search"
                  placeholder="Zoeken naar tracks, artiesten..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-10 pl-10 pr-4 text-sm bg-white/[0.08] text-white placeholder-[#86868b] border border-white/10 rounded-full outline-none"
                />
              </div>
            </form>

            {/* Navigation links */}
            <div className="flex flex-col space-y-1">
              <Link
                to="/"
                onClick={() => setIsMobileMenuOpen(false)}
                className="px-3 py-2.5 text-lg font-medium text-white hover:bg-white/[0.05] rounded-xl transition-colors"
              >
                Home
              </Link>
              <Link
                to="/charts"
                onClick={() => setIsMobileMenuOpen(false)}
                className="px-3 py-2.5 text-lg font-medium text-amber-400 hover:bg-white/[0.05] rounded-xl transition-colors flex items-center justify-between"
              >
                <span>Top 20 Hitlijst</span>
                <Trophy className="w-5 h-5" />
              </Link>
              <Link
                to="/artists"
                onClick={() => setIsMobileMenuOpen(false)}
                className="px-3 py-2.5 text-lg font-medium text-[#fa233b] hover:bg-white/[0.05] rounded-xl transition-colors flex items-center justify-between"
              >
                <span>Artiesten & Zheavenzy</span>
                <Music2 className="w-5 h-5" />
              </Link>
              <Link
                to="/library"
                onClick={() => setIsMobileMenuOpen(false)}
                className="px-3 py-2.5 text-lg font-medium text-white hover:bg-white/[0.05] rounded-xl transition-colors"
              >
                Mijn Bibliotheek
              </Link>
              <Link
                to="/pricing"
                onClick={() => setIsMobileMenuOpen(false)}
                className="px-3 py-2.5 text-lg font-medium text-white hover:bg-white/[0.05] rounded-xl transition-colors flex items-center justify-between"
              >
                <span>Prijzen & Credits</span>
                <Coins className="w-5 h-5 text-amber-400" />
              </Link>
              {isAuthenticated && (
                <Link
                  to="/upload"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="px-3 py-2.5 text-lg font-medium text-white hover:bg-white/[0.05] rounded-xl transition-colors flex items-center justify-between"
                >
                  <span>Upload Nummers</span>
                  <Upload className="w-5 h-5" />
                </Link>
              )}
            </div>
          </div>

          {!isAuthenticated && (
            <div className="pt-6 border-t border-white/10 flex flex-col gap-3">
              <Button variant="apple" size="lg" className="w-full text-sm font-semibold" asChild>
                <Link to="/register" onClick={() => setIsMobileMenuOpen(false)}>Account aanmaken</Link>
              </Button>
              <Button variant="secondary" size="lg" className="w-full text-sm" asChild>
                <Link to="/login" onClick={() => setIsMobileMenuOpen(false)}>Inloggen</Link>
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Direct Message Modal */}
      <DirectMessageModal isOpen={isDMOpen} onClose={() => setIsDMOpen(false)} />
    </nav>
  );
}
