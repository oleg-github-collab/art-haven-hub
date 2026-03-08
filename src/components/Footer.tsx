import { Link } from "react-router-dom";
import { Heart, Palette, Instagram, Facebook, Youtube, Send } from "lucide-react";
import { Button } from "@/components/ui/button";

const platformLinks = [
  { label: "Дошка оголошень", href: "/board" },
  { label: "Маркет", href: "/market" },
  { label: "Митці", href: "/artists" },
  { label: "Події", href: "/events" },
  { label: "Тарифи", href: "/pricing" },
];

const communityLinks = [
  { label: "Про платформу", href: "/about" },
  { label: "Панель митця", href: "/dashboard" },
  { label: "Допомога", href: "/help" },
  { label: "Блог", href: "/blog" },
];

const legalLinks = [
  { label: "Умови використання", href: "/terms" },
  { label: "Політика конфіденційності", href: "/privacy" },
  { label: "Політика cookies", href: "/cookies" },
  { label: "Повернення та скасування", href: "/refunds" },
];

const languages = [
  { flag: "🇺🇦", label: "Українська" },
  { flag: "🇬🇧", label: "English" },
  { flag: "🇩🇪", label: "Deutsch" },
  { flag: "🇪🇸", label: "Español" },
  { flag: "🇫🇷", label: "Français" },
];

export default function Footer() {
  return (
    <footer className="border-t border-border bg-card/80 backdrop-blur-sm">
      {/* Newsletter */}
      <div className="border-b border-border">
        <div className="container py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold font-serif">Будьте в курсі подій</h3>
            <p className="text-sm text-muted-foreground">Підпишіться на розсилку — нові митці, події та ексклюзиви</p>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <input
              type="email"
              placeholder="ваш@email.com"
              className="h-9 rounded-lg border border-input bg-background px-3 text-sm flex-1 sm:w-64 focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <Button size="sm" className="h-9 shrink-0">
              <Send className="h-3.5 w-3.5 mr-1.5" />
              Підписатися
            </Button>
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="container py-10">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-5">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary">
                <Palette className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="text-lg font-bold font-serif">Мистецтво</span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">
              Платформа для українських митців та креативних індустрій по всьому світу.
            </p>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                <Instagram className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                <Facebook className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                <Youtube className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Platform */}
          <div>
            <h4 className="mb-3 text-sm font-semibold font-sans">Платформа</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {platformLinks.map(link => (
                <li key={link.href}>
                  <Link to={link.href} className="hover:text-foreground transition-colors">{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Community */}
          <div>
            <h4 className="mb-3 text-sm font-semibold font-sans">Спільнота</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {communityLinks.map(link => (
                <li key={link.href}>
                  <Link to={link.href} className="hover:text-foreground transition-colors">{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="mb-3 text-sm font-semibold font-sans">Правова інформація</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {legalLinks.map(link => (
                <li key={link.href}>
                  <Link to={link.href} className="hover:text-foreground transition-colors">{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Languages */}
          <div>
            <h4 className="mb-3 text-sm font-semibold font-sans">Мови</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {languages.map(lang => (
                <li key={lang.flag} className="flex items-center gap-1.5 cursor-pointer hover:text-foreground transition-colors">
                  <span>{lang.flag}</span> {lang.label}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-border">
        <div className="container py-4 flex flex-col items-center gap-2 text-center text-xs text-muted-foreground sm:flex-row sm:justify-between">
          <p>© 2026 Мистецтво. Усі права захищено.</p>
          <div className="flex items-center gap-4">
            <Link to="/terms" className="hover:text-foreground transition-colors">Умови</Link>
            <Link to="/privacy" className="hover:text-foreground transition-colors">Конфіденційність</Link>
            <Link to="/cookies" className="hover:text-foreground transition-colors">Cookies</Link>
          </div>
          <p className="flex items-center gap-1">
            Створено з <Heart className="h-3 w-3 text-primary" /> для українських митців
          </p>
        </div>
      </div>
    </footer>
  );
}
