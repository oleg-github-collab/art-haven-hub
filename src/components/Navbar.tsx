import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Menu, X, Search, Bell, MessageCircle, User, ShoppingCart, Palette, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage, type Language } from "@/i18n";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const languages: { code: Language; label: string; flag: string }[] = [
  { code: "uk", label: "Українська", flag: "🇺🇦" },
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "de", label: "Deutsch", flag: "🇩🇪" },
  { code: "es", label: "Español", flag: "🇪🇸" },
  { code: "fr", label: "Français", flag: "🇫🇷" },
];

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { totalItems } = useCart();
  const { isAuthenticated, user, logout } = useAuth();
  const { lang, setLang, t } = useLanguage();

  const currentFlag = languages.find(l => l.code === lang)?.flag || "🇺🇦";

  // Guest: only public pages; Authenticated: full nav
  const navItems = isAuthenticated
    ? [
        { label: t.nav.home, href: "/" },
        { label: t.nav.feed, href: "/feed" },
        { label: t.nav.board, href: "/board" },
        { label: t.nav.market, href: "/market" },
        { label: t.nav.artists, href: "/artists" },
        { label: t.nav.events, href: "/events" },
        { label: t.nav.pricing, href: "/pricing" },
      ]
    : [
        { label: t.nav.home, href: "/" },
        { label: t.nav.board, href: "/board" },
        { label: t.nav.market, href: "/market" },
        { label: t.nav.pricing, href: "/pricing" },
      ];

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const initials = user?.display_name
    ? user.display_name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()
    : user?.handle?.[0]?.toUpperCase() || "U";

  return (
    <header className="sticky top-0 z-50 border-b border-border/40 bg-background/70 backdrop-blur-2xl">
      <div className="container flex h-14 items-center justify-between gap-3">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-1.5 group">
          <span className="text-xl font-bold font-serif tracking-tight text-primary">Inner</span>
          <span className="text-xl font-bold font-serif tracking-tight">Garden</span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-0.5 lg:flex">
          {navItems.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.href}
                to={item.href}
                className="relative px-3 py-1.5 text-sm font-medium transition-colors rounded-lg"
              >
                <span className={isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground"}>
                  {item.label}
                </span>
                {isActive && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="absolute inset-x-1 -bottom-[13px] h-0.5 rounded-full bg-primary"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="hidden sm:flex h-8 w-8">
            <Search className="h-4 w-4" />
          </Button>

          {isAuthenticated && (
            <>
              <Button variant="ghost" size="icon" className="hidden sm:flex h-8 w-8 relative">
                <Bell className="h-4 w-4" />
                <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-primary" />
              </Button>
              <Button variant="ghost" size="icon" className="hidden sm:flex h-8 w-8" asChild>
                <Link to="/messenger">
                  <MessageCircle className="h-4 w-4" />
                </Link>
              </Button>
            </>
          )}

          {/* Language Picker */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="hidden sm:flex h-8 w-8 text-base">
                {currentFlag}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[160px]">
              {languages.map(l => (
                <DropdownMenuItem
                  key={l.code}
                  onClick={() => setLang(l.code)}
                  className={lang === l.code ? "bg-accent" : ""}
                >
                  <span className="mr-2">{l.flag}</span>
                  {l.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {isAuthenticated ? (
            <>
              {/* Cart */}
              <Button variant="ghost" size="icon" className="hidden sm:flex h-8 w-8 relative" asChild>
                <Link to="/cart">
                  <ShoppingCart className="h-4 w-4" />
                  {totalItems > 0 && (
                    <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                      {totalItems > 9 ? "9+" : totalItems}
                    </span>
                  )}
                </Link>
              </Button>

              {/* Dashboard */}
              <Button variant="ghost" size="sm" className="hidden md:flex h-8 text-xs gap-1.5" asChild>
                <Link to="/dashboard">
                  <Palette className="h-3.5 w-3.5" />
                  {t.nav.panel}
                </Link>
              </Button>

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                    <Avatar className="h-7 w-7">
                      <AvatarImage src={user?.avatar_url} alt={user?.display_name || user?.handle} />
                      <AvatarFallback className="text-[11px] font-semibold bg-primary/10 text-primary">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium truncate">{user?.display_name || user?.handle}</p>
                    <p className="text-xs text-muted-foreground truncate">@{user?.handle}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/profile" className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      {t.nav.profile}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/dashboard" className="cursor-pointer">
                      <Palette className="mr-2 h-4 w-4" />
                      {t.nav.panel}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive focus:text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    {t.nav.logout}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              {/* Guest: Sign In / Sign Up */}
              <Button variant="ghost" size="sm" className="hidden sm:flex h-8 text-xs" asChild>
                <Link to="/login">
                  {t.nav.login}
                </Link>
              </Button>
              <Button size="sm" className="hidden sm:flex h-8 text-xs" asChild>
                <Link to="/signup">
                  {t.nav.signup}
                </Link>
              </Button>
            </>
          )}

          {/* Mobile toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden h-8 w-8"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-border/60 lg:hidden bg-background/95 backdrop-blur-xl"
          >
            <nav className="container flex flex-col gap-0.5 py-3">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
                    location.pathname === item.href
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:bg-accent/60"
                  }`}
                >
                  {item.label}
                </Link>
              ))}

              {isAuthenticated && (
                <>
                  <Link
                    to="/dashboard"
                    onClick={() => setMobileOpen(false)}
                    className="rounded-lg px-4 py-2.5 text-sm font-medium text-muted-foreground hover:bg-accent/60 flex items-center gap-2"
                  >
                    <Palette className="h-4 w-4" />
                    {t.nav.panel}
                  </Link>
                  <Link
                    to="/profile"
                    onClick={() => setMobileOpen(false)}
                    className="rounded-lg px-4 py-2.5 text-sm font-medium text-muted-foreground hover:bg-accent/60 flex items-center gap-2"
                  >
                    <User className="h-4 w-4" />
                    {t.nav.profile}
                  </Link>
                </>
              )}

              {/* Mobile language picker */}
              <div className="mt-2 flex flex-wrap gap-2 px-4">
                {languages.map(l => (
                  <button
                    key={l.code}
                    onClick={() => setLang(l.code)}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                      lang === l.code
                        ? "bg-primary text-primary-foreground"
                        : "bg-secondary text-secondary-foreground"
                    }`}
                  >
                    {l.flag} {l.label}
                  </button>
                ))}
              </div>

              <div className="mt-2 flex items-center gap-2 px-4">
                {isAuthenticated ? (
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    onClick={() => { setMobileOpen(false); handleLogout(); }}
                  >
                    <LogOut className="mr-1.5 h-4 w-4" />
                    {t.nav.logout}
                  </Button>
                ) : (
                  <>
                    <Button variant="outline" size="sm" className="flex-1" asChild>
                      <Link to="/login" onClick={() => setMobileOpen(false)}>
                        {t.nav.login}
                      </Link>
                    </Button>
                    <Button size="sm" className="flex-1" asChild>
                      <Link to="/signup" onClick={() => setMobileOpen(false)}>
                        {t.nav.signup}
                      </Link>
                    </Button>
                  </>
                )}
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
