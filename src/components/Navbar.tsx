import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Upload, Menu, X, User, Settings, LogOut, Bell, ListMusic, Coins, CreditCard, Trophy, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
    <nav className="fixed top-0 left-0 right-0 z-50 h-16 bg-background/95 backdrop-blur-xl border-b border-border">
      <div className="h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-full gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 flex-shrink-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-5 h-5 text-white" fill="currentColor">
                <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
              </svg>
            </div>
            <span className="text-xl font-bold hidden sm:block">CloudiAudi</span>
          </Link>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="flex-1 max-w-xl hidden sm:block">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search for tracks, artists..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-secondary border-0 focus-visible:ring-primary"
              />
            </div>
          </form>

          {/* Navigation Links - Desktop */}
          <div className="hidden md:flex items-center gap-1">
            <Button variant="ghost" asChild>
              <Link to="/">Home</Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link to="/charts" className="flex items-center gap-1.5 text-amber-400 hover:text-amber-300">
                <Trophy className="w-4 h-4" />
                <span>Top 20</span>
              </Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link to="/library">Library</Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link to="/pricing">Prijzen</Link>
            </Button>
            {isAuthenticated && (
              <Button variant="ghost" asChild>
                <Link to="/upload">
                  <Upload className="w-4 h-4 mr-2" />
                  Upload
                </Link>
              </Button>
            )}
          </div>

          {/* User Menu */}
          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <>
                {/* Credits Balance Pill */}
                <Link
                  to="/pricing"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border border-orange-500/30 text-xs font-semibold transition-all hover:scale-105"
                  title="Klik om je credits te beheren of op te waarderen"
                >
                  <Coins className="w-3.5 h-3.5" />
                  <span>{(credits || 0).toLocaleString()}</span>
                  <span className="hidden sm:inline text-orange-400/80 font-normal">credits</span>
                </Link>

                {/* Direct Messages */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative"
                  onClick={() => setIsDMOpen(true)}
                  title="Privé berichten"
                >
                  <MessageSquare className="w-5 h-5" />
                  {directMessages.length > 0 && (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-orange-500 rounded-full" />
                  )}
                </Button>

                {/* Notifications */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative"
                  onClick={() => navigate('/notifications')}
                >
                  <Bell className="w-5 h-5" />
                  {unreadNotifications > 0 && (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-orange-500 rounded-full" />
                  )}
                </Button>

                {/* User Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={user?.avatarUrl} alt={user?.displayName} />
                        <AvatarFallback>{user?.displayName?.[0]}</AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <div className="flex items-center gap-2 p-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user?.avatarUrl} alt={user?.displayName} />
                        <AvatarFallback>{user?.displayName?.[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <p className="text-sm font-medium">{user?.displayName}</p>
                        <p className="text-xs text-muted-foreground">@{user?.username}</p>
                      </div>
                    </div>
                    <div className="px-2 py-1.5 bg-secondary/50 rounded-md mx-2 my-1 flex items-center justify-between text-xs">
                      <span className="text-muted-foreground capitalize">Plan: <strong className="text-foreground">{plan || 'Artiest'}</strong></span>
                      <span className="font-mono text-orange-400 font-semibold flex items-center gap-1">
                        <Coins className="w-3 h-3" />
                        {(credits || 0).toLocaleString()}
                      </span>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setIsDMOpen(true)}>
                      <MessageSquare className="mr-2 h-4 w-4 text-orange-400" />
                      Privé Berichten
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/charts">
                        <Trophy className="mr-2 h-4 w-4 text-amber-400" />
                        Top 20 Hitlijst
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/library?tab=uploads">
                        <ListMusic className="mr-2 h-4 w-4" />
                        My Library
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/pricing">
                        <CreditCard className="mr-2 h-4 w-4 text-orange-400" />
                        Abonnement & Credits
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to={`/user/${user?.id}`}>
                        <User className="mr-2 h-4 w-4" />
                        Profile
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/settings">
                        <Settings className="mr-2 h-4 w-4" />
                        Settings
                      </Link>
                    </DropdownMenuItem>
                    {user?.role === 'admin' && (
                      <DropdownMenuItem asChild>
                        <Link to="/admin">Admin Panel</Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={logout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      Log out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <div className="hidden sm:flex items-center gap-2">
                <Button variant="ghost" asChild>
                  <Link to="/login">Log in</Link>
                </Button>
                <Button asChild className="rounded-full">
                  <Link to="/register">Sign up</Link>
                </Button>
              </div>
            )}

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-background border-b border-border">
          <div className="px-4 py-4 space-y-4">
            {/* Mobile Search */}
            <form onSubmit={handleSearch}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search for tracks, artists..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-secondary border-0"
                />
              </div>
            </form>

            {/* Mobile Nav Links */}
            <div className="space-y-2">
              <Button variant="ghost" className="w-full justify-start" asChild>
                <Link to="/">Home</Link>
              </Button>
              <Button variant="ghost" className="w-full justify-start text-amber-400 font-semibold" asChild>
                <Link to="/charts" className="flex items-center gap-2">
                  <Trophy className="w-4 h-4" />
                  Top 20 Hitlijst
                </Link>
              </Button>
              <Button variant="ghost" className="w-full justify-start" asChild>
                <Link to="/library">Library</Link>
              </Button>
              <Button variant="ghost" className="w-full justify-start" asChild>
                <Link to="/pricing">Prijzen & Credits</Link>
              </Button>
              {isAuthenticated && (
                <>
                  <Button
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      setIsDMOpen(true);
                    }}
                  >
                    <MessageSquare className="w-4 h-4 mr-2 text-orange-400" />
                    Privé Berichten
                  </Button>
                  <Button variant="ghost" className="w-full justify-start" asChild>
                    <Link to="/upload">
                      <Upload className="w-4 h-4 mr-2" />
                      Upload
                    </Link>
                  </Button>
                </>
              )}
            </div>

            {/* Mobile Auth */}
            {!isAuthenticated && (
              <div className="space-y-2 pt-4 border-t border-border">
                <Button variant="outline" className="w-full" asChild>
                  <Link to="/login">Log in</Link>
                </Button>
                <Button className="w-full rounded-full" asChild>
                  <Link to="/register">Sign up</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Direct Message Modal */}
      <DirectMessageModal isOpen={isDMOpen} onClose={() => setIsDMOpen(false)} />
    </nav>
  );
}
