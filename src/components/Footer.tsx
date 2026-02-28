import { Link } from "react-router-dom";
import { Heart } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="container py-12">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <span className="text-base font-bold text-primary-foreground font-serif">М</span>
              </div>
              <span className="text-lg font-semibold font-serif">Мистецтво</span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Платформа для українських митців та креативних індустрій по всьому світу.
            </p>
          </div>
          <div>
            <h4 className="mb-3 text-sm font-semibold font-sans">Платформа</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/board" className="hover:text-foreground transition-colors">Дошка оголошень</Link></li>
              <li><Link to="/artists" className="hover:text-foreground transition-colors">Митці</Link></li>
              <li><Link to="/events" className="hover:text-foreground transition-colors">Події</Link></li>
              <li><Link to="/market" className="hover:text-foreground transition-colors">Маркет</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-3 text-sm font-semibold font-sans">Спільнота</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/about" className="hover:text-foreground transition-colors">Про нас</Link></li>
              <li><Link to="/pricing" className="hover:text-foreground transition-colors">Тарифи</Link></li>
              <li><Link to="/help" className="hover:text-foreground transition-colors">Допомога</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-3 text-sm font-semibold font-sans">Мови</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>🇺🇦 Українська</li>
              <li>🇬🇧 English</li>
              <li>🇩🇪 Deutsch</li>
              <li>🇪🇸 Español</li>
              <li>🇫🇷 Français</li>
            </ul>
          </div>
        </div>
        <div className="mt-10 flex flex-col items-center gap-2 border-t border-border pt-6 text-center text-xs text-muted-foreground sm:flex-row sm:justify-between">
          <p>© 2026 Мистецтво. Усі права захищено.</p>
          <p className="flex items-center gap-1">
            Створено з <Heart className="h-3 w-3 text-primary" /> для українських митців
          </p>
        </div>
      </div>
    </footer>
  );
}
