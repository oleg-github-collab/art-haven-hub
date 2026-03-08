import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Languages, Megaphone, CheckSquare, Square, ChevronDown,
  Eye, Heart, TrendingUp, BarChart3, Package, Edit3,
  Trash2, Copy, MoreHorizontal, Sparkles, Globe, ArrowUpRight,
  Clock, Euro, Loader2, Check, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

/* ── fake artwork data ──────────────────────────────── */
interface Artwork {
  id: number;
  title: string;
  emoji: string;
  price: number;
  status: "active" | "draft" | "sold" | "promoted";
  views: number;
  likes: number;
  created: string;
  description: string;
  translations: Record<string, string>;
  promotedUntil?: string;
}

const initialArtworks: Artwork[] = [
  { id: 1, title: "Абстрактний пейзаж", emoji: "🎨", price: 1200, status: "active", views: 156, likes: 24, created: "2 дні тому", description: "Оригінальна робота олійними фарбами. Абстрактний пейзаж, натхненний Карпатськими горами.", translations: {} },
  { id: 2, title: "Карпатський туман", emoji: "🌄", price: 850, status: "promoted", views: 312, likes: 45, created: "1 тиждень тому", description: "Туманний ранок у Карпатах, олія на полотні 60×80.", translations: { en: "Foggy morning in Carpathians, oil on canvas 60×80." }, promotedUntil: "ще 5 днів" },
  { id: 3, title: "Весняний Відень", emoji: "🌸", price: 680, status: "active", views: 89, likes: 12, created: "5 днів тому", description: "Акварельна серія, натхненна весняними парками Відня.", translations: {} },
  { id: 4, title: "Море вночі", emoji: "🌊", price: 1500, status: "sold", views: 234, likes: 56, created: "2 тижні тому", description: "Нічне море, масло, мастихін. 100×120 см.", translations: { en: "Night sea, oil, palette knife. 100×120 cm.", de: "Nächtliches Meer, Öl, Spachtel. 100×120 cm." } },
  { id: 5, title: "Портрет з квітами", emoji: "💐", price: 950, status: "draft", views: 0, likes: 0, created: "вчора", description: "Портрет молодої жінки з квітами у волоссі.", translations: {} },
  { id: 6, title: "Старе місто", emoji: "🏘️", price: 420, status: "active", views: 67, likes: 8, created: "3 дні тому", description: "Графіка тушшю, детальне зображення старого міста.", translations: {} },
];

const LANGUAGES = [
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "de", label: "Deutsch", flag: "🇩🇪" },
  { code: "es", label: "Español", flag: "🇪🇸" },
  { code: "fr", label: "Français", flag: "🇫🇷" },
];

const PROMO_OPTIONS = [
  { days: 1, price: 2, label: "1 день" },
  { days: 3, price: 5, label: "3 дні", badge: "-17%" },
  { days: 7, price: 10, label: "7 днів", badge: "-29%" },
  { days: 30, price: 30, label: "30 днів", badge: "-50%" },
];

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  active: { label: "Активна", variant: "default" },
  promoted: { label: "Топ", variant: "secondary" },
  sold: { label: "Продано", variant: "outline" },
  draft: { label: "Чернетка", variant: "outline" },
};

/* ── component ──────────────────────────────────────── */
export default function ArtistDashboardPage() {
  const { toast } = useToast();
  const [artworks, setArtworks] = useState<Artwork[]>(initialArtworks);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [filter, setFilter] = useState<string>("all");
  const [translateDialog, setTranslateDialog] = useState<{ open: boolean; ids: number[] }>({ open: false, ids: [] });
  const [promoDialog, setPromoDialog] = useState<{ open: boolean; ids: number[] }>({ open: false, ids: [] });
  const [translateLang, setTranslateLang] = useState("en");
  const [translating, setTranslating] = useState(false);
  const [selectedPromo, setSelectedPromo] = useState(1);

  const filtered = useMemo(() => {
    if (filter === "all") return artworks;
    return artworks.filter((a) => a.status === filter);
  }, [artworks, filter]);

  const allSelected = filtered.length > 0 && filtered.every((a) => selected.has(a.id));

  const toggleAll = () => {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((a) => a.id)));
    }
  };

  const toggleOne = (id: number) => {
    setSelected((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  /* ── AI translate (mock) ── */
  const handleTranslate = () => {
    setTranslating(true);
    setTimeout(() => {
      const lang = LANGUAGES.find((l) => l.code === translateLang)!;
      setArtworks((prev) =>
        prev.map((a) => {
          if (!translateDialog.ids.includes(a.id)) return a;
          return {
            ...a,
            translations: {
              ...a.translations,
              [translateLang]: `[${lang.flag} AI] ${a.description.slice(0, 60)}...`,
            },
          };
        })
      );
      setTranslating(false);
      setTranslateDialog({ open: false, ids: [] });
      setSelected(new Set());
      toast({
        title: "Переклад завершено",
        description: `${translateDialog.ids.length} опис(ів) перекладено на ${lang.label}`,
      });
    }, 2000);
  };

  /* ── promote (mock) ── */
  const handlePromote = () => {
    const promo = PROMO_OPTIONS.find((p) => p.days === selectedPromo)!;
    setArtworks((prev) =>
      prev.map((a) => {
        if (!promoDialog.ids.includes(a.id)) return a;
        return { ...a, status: "promoted" as const, promotedUntil: `ще ${promo.days} д.` };
      })
    );
    setPromoDialog({ open: false, ids: [] });
    setSelected(new Set());
    toast({
      title: "Роботи просунуто",
      description: `${promoDialog.ids.length} робота(и) в топі на ${promo.label} за €${promo.price * promoDialog.ids.length}`,
    });
  };

  /* ── bulk delete (mock) ── */
  const handleBulkDelete = () => {
    setArtworks((prev) => prev.filter((a) => !selected.has(a.id)));
    toast({ title: "Видалено", description: `${selected.size} робота(и) видалено` });
    setSelected(new Set());
  };

  /* ── stats ── */
  const stats = useMemo(() => ({
    total: artworks.length,
    active: artworks.filter((a) => a.status === "active" || a.status === "promoted").length,
    sold: artworks.filter((a) => a.status === "sold").length,
    views: artworks.reduce((s, a) => s + a.views, 0),
    likes: artworks.reduce((s, a) => s + a.likes, 0),
    revenue: artworks.filter((a) => a.status === "sold").reduce((s, a) => s + a.price, 0),
  }), [artworks]);

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-5xl py-6 sm:py-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-serif text-2xl font-bold sm:text-3xl">Панель митця</h1>
          <p className="mt-1 text-sm text-muted-foreground">Керуйте роботами, перекладами та просуванням</p>
        </div>

        {/* Stats row */}
        <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {[
            { label: "Усього", value: stats.total, icon: Package, color: "text-foreground" },
            { label: "Активні", value: stats.active, icon: Eye, color: "text-primary" },
            { label: "Продано", value: stats.sold, icon: Check, color: "text-green-600" },
            { label: "Перегляди", value: stats.views, icon: BarChart3, color: "text-blue-600" },
            { label: "Вподобання", value: stats.likes, icon: Heart, color: "text-red-500" },
            { label: "Дохід", value: `€${stats.revenue.toLocaleString()}`, icon: Euro, color: "text-primary" },
          ].map((s) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border border-border bg-card p-3 sm:p-4"
            >
              <div className="flex items-center gap-2">
                <s.icon className={`h-4 w-4 ${s.color}`} />
                <span className="text-xs text-muted-foreground">{s.label}</span>
              </div>
              <p className="mt-1 text-lg font-bold">{s.value}</p>
            </motion.div>
          ))}
        </div>

        {/* Toolbar */}
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Усі роботи</SelectItem>
              <SelectItem value="active">Активні</SelectItem>
              <SelectItem value="promoted">Топ</SelectItem>
              <SelectItem value="sold">Продані</SelectItem>
              <SelectItem value="draft">Чернетки</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex-1" />

          <AnimatePresence>
            {selected.size > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex items-center gap-2"
              >
                <Badge variant="secondary" className="gap-1">
                  <CheckSquare className="h-3 w-3" />
                  {selected.size} обрано
                </Badge>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5"
                  onClick={() => setTranslateDialog({ open: true, ids: Array.from(selected) })}
                >
                  <Languages className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">ШІ-переклад</span>
                </Button>
                <Button
                  size="sm"
                  className="gap-1.5"
                  onClick={() => setPromoDialog({ open: true, ids: Array.from(selected) })}
                >
                  <Megaphone className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Просувати</span>
                </Button>
                <Button size="sm" variant="destructive" className="gap-1.5" onClick={handleBulkDelete}>
                  <Trash2 className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Видалити</span>
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          {/* Header */}
          <div className="hidden items-center gap-3 border-b border-border bg-muted/50 px-4 py-3 text-xs font-medium text-muted-foreground sm:flex">
            <Checkbox checked={allSelected} onCheckedChange={toggleAll} />
            <span className="flex-1">Робота</span>
            <span className="w-20 text-center">Ціна</span>
            <span className="w-20 text-center">Статус</span>
            <span className="w-20 text-center">Перегляди</span>
            <span className="w-16 text-center">Мови</span>
            <span className="w-10" />
          </div>

          {/* Rows */}
          {filtered.map((art, i) => (
            <motion.div
              key={art.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.03 }}
              className={`flex flex-col gap-2 border-b border-border px-4 py-3 last:border-0 sm:flex-row sm:items-center sm:gap-3 ${
                selected.has(art.id) ? "bg-primary/5" : "hover:bg-muted/30"
              } transition-colors`}
            >
              <Checkbox checked={selected.has(art.id)} onCheckedChange={() => toggleOne(art.id)} />

              {/* Artwork info */}
              <div className="flex flex-1 items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary text-xl">
                  {art.emoji}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{art.title}</p>
                  <p className="truncate text-xs text-muted-foreground">{art.created}</p>
                </div>
              </div>

              {/* Price */}
              <span className="w-20 text-center text-sm font-medium">€{art.price.toLocaleString()}</span>

              {/* Status */}
              <div className="flex w-20 justify-center">
                <Badge variant={statusConfig[art.status].variant} className="text-xs">
                  {art.status === "promoted" && <TrendingUp className="mr-1 h-3 w-3" />}
                  {statusConfig[art.status].label}
                </Badge>
              </div>

              {/* Views */}
              <span className="w-20 text-center text-sm text-muted-foreground">{art.views}</span>

              {/* Languages */}
              <div className="flex w-16 justify-center gap-0.5">
                {Object.keys(art.translations).length > 0 ? (
                  Object.keys(art.translations).map((code) => {
                    const lang = LANGUAGES.find((l) => l.code === code);
                    return (
                      <span key={code} className="text-xs" title={lang?.label}>
                        {lang?.flag}
                      </span>
                    );
                  })
                ) : (
                  <span className="text-xs text-muted-foreground">—</span>
                )}
              </div>

              {/* Actions */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setTranslateDialog({ open: true, ids: [art.id] })}>
                    <Languages className="mr-2 h-4 w-4" />ШІ-переклад
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setPromoDialog({ open: true, ids: [art.id] })}>
                    <Megaphone className="mr-2 h-4 w-4" />Просувати
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem><Edit3 className="mr-2 h-4 w-4" />Редагувати</DropdownMenuItem>
                  <DropdownMenuItem><Copy className="mr-2 h-4 w-4" />Дублювати</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-destructive">
                    <Trash2 className="mr-2 h-4 w-4" />Видалити
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </motion.div>
          ))}

          {filtered.length === 0 && (
            <div className="py-12 text-center text-sm text-muted-foreground">Немає робіт у цій категорії</div>
          )}
        </div>

        {/* Promoted hint */}
        {artworks.some((a) => a.status === "promoted") && (
          <div className="mt-4 rounded-xl border border-primary/20 bg-primary/5 p-4">
            <div className="flex items-start gap-3">
              <TrendingUp className="mt-0.5 h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-semibold">Активні просування</p>
                {artworks
                  .filter((a) => a.status === "promoted")
                  .map((a) => (
                    <p key={a.id} className="text-xs text-muted-foreground">
                      «{a.title}» — {a.promotedUntil}
                    </p>
                  ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Translate Dialog ── */}
      <Dialog open={translateDialog.open} onOpenChange={(o) => setTranslateDialog((p) => ({ ...p, open: o }))}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              ШІ-переклад описів
            </DialogTitle>
            <DialogDescription>
              Оберіть мову для автоматичного перекладу{" "}
              {translateDialog.ids.length > 1 ? `${translateDialog.ids.length} робіт` : "роботи"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Мова перекладу</label>
              <Select value={translateLang} onValueChange={setTranslateLang}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGES.map((l) => (
                    <SelectItem key={l.code} value={l.code}>
                      {l.flag} {l.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="rounded-lg bg-muted/50 p-3">
              <p className="mb-2 text-xs font-medium text-muted-foreground">Буде перекладено:</p>
              {translateDialog.ids.map((id) => {
                const a = artworks.find((x) => x.id === id);
                return a ? (
                  <div key={id} className="flex items-center gap-2 py-1 text-sm">
                    <span>{a.emoji}</span>
                    <span className="truncate">{a.title}</span>
                    {a.translations[translateLang] && (
                      <Badge variant="outline" className="ml-auto text-[10px]">є переклад</Badge>
                    )}
                  </div>
                ) : null;
              })}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setTranslateDialog({ open: false, ids: [] })}>
              Скасувати
            </Button>
            <Button onClick={handleTranslate} disabled={translating} className="gap-1.5">
              {translating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Перекладаю…
                </>
              ) : (
                <>
                  <Globe className="h-4 w-4" />
                  Перекласти
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Promote Dialog ── */}
      <Dialog open={promoDialog.open} onOpenChange={(o) => setPromoDialog((p) => ({ ...p, open: o }))}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Megaphone className="h-5 w-5 text-primary" />
              Просувати роботу
            </DialogTitle>
            <DialogDescription>
              {promoDialog.ids.length > 1
                ? `Обрано ${promoDialog.ids.length} робіт для просування`
                : "Оберіть тривалість розміщення у топі"}
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-3 py-2">
            {PROMO_OPTIONS.map((opt) => (
              <button
                key={opt.days}
                onClick={() => setSelectedPromo(opt.days)}
                className={`relative rounded-xl border p-4 text-left transition-all ${
                  selectedPromo === opt.days
                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                    : "border-border hover:border-primary/40"
                }`}
              >
                {opt.badge && (
                  <Badge className="absolute -top-2 right-2 text-[10px]">{opt.badge}</Badge>
                )}
                <p className="text-sm font-semibold">{opt.label}</p>
                <p className="mt-1 text-lg font-bold text-primary">€{opt.price}</p>
                <p className="text-[11px] text-muted-foreground">за роботу</p>
              </button>
            ))}
          </div>

          {promoDialog.ids.length > 1 && (
            <div className="rounded-lg bg-muted/50 p-3 text-sm">
              <span className="text-muted-foreground">Разом: </span>
              <span className="font-bold">
                €{(PROMO_OPTIONS.find((p) => p.days === selectedPromo)?.price || 0) * promoDialog.ids.length}
              </span>
              <span className="text-muted-foreground"> за {promoDialog.ids.length} робіт</span>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setPromoDialog({ open: false, ids: [] })}>
              Скасувати
            </Button>
            <Button onClick={handlePromote} className="gap-1.5">
              <ArrowUpRight className="h-4 w-4" />
              Оплатити та просунути
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
