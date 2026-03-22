import { Link } from "react-router-dom";
import { Heart, Instagram, Facebook, Youtube, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/i18n";

const languageLabels = [
  { flag: "🇺🇦", label: "Українська" },
  { flag: "🇬🇧", label: "English" },
  { flag: "🇩🇪", label: "Deutsch" },
  { flag: "🇪🇸", label: "Español" },
  { flag: "🇫🇷", label: "Français" },
];

export default function Footer() {
  const { t } = useLanguage();

  const platformLinks = [
    { label: t.footer.board, href: "/board" },
    { label: t.footer.market, href: "/market" },
    { label: t.footer.artists, href: "/artists" },
    { label: t.footer.events, href: "/events" },
    { label: t.footer.pricing, href: "/pricing" },
  ];

  const communityLinks = [
    { label: t.footer.about, href: "/about" },
    { label: t.footer.dashboard, href: "/dashboard" },
    { label: t.footer.help, href: "/help" },
    { label: t.footer.blog, href: "/blog" },
  ];

  const legalLinks = [
    { label: t.footer.terms, href: "/terms" },
    { label: t.footer.privacy, href: "/privacy" },
    { label: t.footer.cookies, href: "/cookies" },
    { label: t.footer.refunds, href: "/refunds" },
  ];

  return (
    <footer className="border-t border-border bg-card/80 backdrop-blur-sm">
      {/* Newsletter */}
      <div className="border-b border-border">
        <div className="container py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold font-serif">{t.footer.subscribe_title}</h3>
            <p className="text-sm text-muted-foreground">{t.footer.subscribe_desc}</p>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <input
              type="email"
              placeholder={t.footer.subscribe_placeholder}
              className="h-9 rounded-lg border border-input bg-background px-3 text-sm flex-1 sm:w-64 focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <Button size="sm" className="h-9 shrink-0">
              <Send className="h-3.5 w-3.5 mr-1.5" />
              {t.footer.subscribe_btn}
            </Button>
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="container py-10">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-5">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link to="/" className="flex items-center gap-1.5 mb-3">
              <span className="text-lg font-bold font-serif text-primary">Inner</span>
              <span className="text-lg font-bold font-serif">Garden</span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">
              {t.common.platform_subtitle}
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
            <h4 className="mb-3 text-sm font-semibold font-sans">{t.footer.platform}</h4>
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
            <h4 className="mb-3 text-sm font-semibold font-sans">{t.footer.community}</h4>
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
            <h4 className="mb-3 text-sm font-semibold font-sans">{t.footer.legal}</h4>
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
            <h4 className="mb-3 text-sm font-semibold font-sans">{t.footer.languages}</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {languageLabels.map(lang => (
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
          <p>{t.footer.rights}</p>
          <div className="flex items-center gap-4">
            <Link to="/terms" className="hover:text-foreground transition-colors">{t.footer.terms_short}</Link>
            <Link to="/privacy" className="hover:text-foreground transition-colors">{t.footer.privacy_short}</Link>
            <Link to="/cookies" className="hover:text-foreground transition-colors">{t.footer.cookies_short}</Link>
          </div>
          <p className="flex items-center gap-1">
            {t.footer.made_with} <Heart className="h-3 w-3 text-primary" /> for Ukrainian artists
          </p>
        </div>
      </div>
    </footer>
  );
}
