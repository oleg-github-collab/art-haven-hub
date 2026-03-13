import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
import { Menu, X, Search, Bell, MessageCircle, User, ShoppingCart, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "@/contexts/CartContext";
import { useLanguage, type Language } from "@/i18n";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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
  const [mobileOpen, setMobileOpen] = useState(false);
  const { totalItems } = useCart();
  const { lang, setLang, t } = useLanguage();

  const currentFlag = languages.find(l => l.code === lang)?.flag || "🇺🇦";

  const navItems = [
    { label: t.nav.home, href: "/" },
    { label: t.nav.feed, href: "/feed" },
    { label: t.nav.board, href: "/board" },
    { label: t.nav.market, href: "/market" },
    { label: t.nav.artists, href: "/artists" },
    { label: t.nav.events, href: "/events" },
    { label: t.nav.pricing, href: "/pricing" },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-border/40 bg-background/70 backdrop-blur-2xl">
      <div className="container flex h-14 items-center justify-between gap-3">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary shadow-md group-hover:shadow-lg transition-shadow">
            <Palette className="h-4 w-4 text-primary-foreground" />
          </div>
          <div className="hidden sm:flex flex-col leading-none">
            <span className="text-base font-bold font-serif tracking-tight">{t.common.platform_name}</span>
            <span className="text-[10px] text-muted-foreground font-sans -mt-0.5">{t.common.platform_subtitle}</span>
          </div>
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
          <Button variant="ghost" size="icon" className="hidden sm:flex h-8 w-8 relative">
            <Bell className="h-4 w-4" />
            <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-primary" />
          </Button>
          <Button variant="ghost" size="icon" className="hidden sm:flex h-8 w-8" asChild>
            <Link to="/messenger">
              <MessageCircle className="h-4 w-4" />
            </Link>
          </Button>

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

          {/* Auth */}
          <Button size="sm" className="hidden sm:flex h-8 text-xs" asChild>
            <Link to="/login">
              <User className="mr-1 h-3.5 w-3.5" />
              {t.nav.login}
            </Link>
          </Button>

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
              <Link
                to="/dashboard"
                onClick={() => setMobileOpen(false)}
                className="rounded-lg px-4 py-2.5 text-sm font-medium text-muted-foreground hover:bg-accent/60 flex items-center gap-2"
              >
                <Palette className="h-4 w-4" />
                {t.nav.panel}
              </Link>
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
                <Button size="sm" className="flex-1">
                  <User className="mr-1.5 h-4 w-4" />
                  {t.nav.login}
                </Button>
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
