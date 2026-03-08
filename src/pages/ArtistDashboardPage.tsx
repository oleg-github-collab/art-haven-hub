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
import { useLanguage } from "@/i18n/context";

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
  { id: 2, title: "Карпатський туман", emoji: "🌄", price: 850, status: "promoted", views: 312, likes: 45, created: "1 тиждень тому", description: "Туманний ранок у Карпатах, олія на полотні 60×80.", translations: { en: "Foggy morning in Carpathians, oil on canvas 60×80." }, promotedUntil: "5d" },
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

const PROMO_OPTIONS_DAYS = [1, 3, 7, 30];
const PROMO_PRICES: Record<number, number> = { 1: 2, 3: 5, 7: 10, 30: 30 };
const PROMO_BADGES: Record<number, string | undefined> = { 1: undefined, 3: "-17%", 7: "-29%", 30: "-50%" };

/* ── component ──────────────────────────────────────── */
export default function ArtistDashboardPage() {
  const { t } = useLanguage();
  const d = t.dashboard;
  const { toast } = useToast();
  const [artworks, setArtworks] = useState<Artwork[]>(initialArtworks);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [filter, setFilter] = useState<string>("all");
  const [translateDialog, setTranslateDialog] = useState<{ open: boolean; ids: number[] }>({ open: false, ids: [] });
  const [promoDialog, setPromoDialog] = useState<{ open: boolean; ids: number[] }>({ open: false, ids: [] });
  const [translateLang, setTranslateLang] = useState("en");
  const [translating, setTranslating] = useState(false);
  const [selectedPromo, setSelectedPromo] = useState(1);

  const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
    active: { label: d.status_active, variant: "default" },
    promoted: { label: d.status_promoted, variant: "secondary" },
    sold: { label: d.status_sold, variant: "outline" },
    draft: { label: d.status_draft, variant: "outline" },
  };

  const filtered = useMemo(() => {
    if (filter === "all") return artworks;
    return artworks.filter((a) => a.status === filter);
  }, [artworks, filter]);

  const allSelected = filtered.length > 0 && filtered.every((a) => selected.has(a.id));

  const toggleAll = () => {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(filtered.map((a) => a.id)));
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
        title: d.translate_done,
        description: `${translateDialog.ids.length} ${d.translated_desc} ${lang.label}`,
      });
    }, 2000);
  };

  /* ── promote (mock) ── */
  const handlePromote = () => {
    const price = PROMO_PRICES[selectedPromo] || 0;
    setArtworks((prev) =>
      prev.map((a) => {
        if (!promoDialog.ids.includes(a.id)) return a;
        return { ...a, status: "promoted" as const, promotedUntil: `${selectedPromo}d` };
      })
    );
    setPromoDialog({ open: false, ids: [] });
    setSelected(new Set());
    toast({
      title: d.works_promoted,
      description: `${promoDialog.ids.length} ${d.works_promoted_desc} ${selectedPromo}d — €${price * promoDialog.ids.length}`,
    });
  };

  /* ── bulk delete (mock) ── */
  const handleBulkDelete = () => {
    setArtworks((prev) => prev.filter((a) => !selected.has(a.id)));
    toast({ title: d.deleted, description: `${selected.size} ${d.deleted_desc}` });
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
          <h1 className="font-serif text-2xl font-bold sm:text-3xl">{d.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{d.desc}</p>
        </div>

        {/* Stats row */}
        <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {[
            { label: d.total, value: stats.total, icon: Package, color: "text-foreground" },
            { label: d.active, value: stats.active, icon: Eye, color: "text-primary" },
            { label: d.sold, value: stats.sold, icon: Check, color: "text-green-600" },
            { label: d.views, value: stats.views, icon: BarChart3, color: "text-blue-600" },
            { label: d.likes, value: stats.likes, icon: Heart, color: "text-red-500" },
            { label: d.revenue, value: `€${stats.revenue.toLocaleString()}`, icon: Euro, color: "text-primary" },
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
              <SelectItem value="all">{d.all_works}</SelectItem>
              <SelectItem value="active">{d.status_active}</SelectItem>
              <SelectItem value="promoted">{d.promoted}</SelectItem>
              <SelectItem value="sold">{d.status_sold}</SelectItem>
              <SelectItem value="draft">{d.drafts}</SelectItem>
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
                  {selected.size} {d.selected}
                </Badge>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5"
                  onClick={() => setTranslateDialog({ open: true, ids: Array.from(selected) })}
                >
                  <Languages className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{d.ai_translate}</span>
                </Button>
                <Button
                  size="sm"
                  className="gap-1.5"
                  onClick={() => setPromoDialog({ open: true, ids: Array.from(selected) })}
                >
                  <Megaphone className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{d.promote}</span>
                </Button>
                <Button size="sm" variant="destructive" className="gap-1.5" onClick={handleBulkDelete}>
                  <Trash2 className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{d.delete_btn}</span>
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
            <span className="flex-1">{d.artwork}</span>
            <span className="w-20 text-center">{d.price}</span>
            <span className="w-20 text-center">{d.status}</span>
            <span className="w-20 text-center">{d.views}</span>
            <span className="w-16 text-center">{d.languages}</span>
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
                    <Languages className="mr-2 h-4 w-4" />{d.ai_translate}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setPromoDialog({ open: true, ids: [art.id] })}>
                    <Megaphone className="mr-2 h-4 w-4" />{d.promote}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem><Edit3 className="mr-2 h-4 w-4" />{d.edit}</DropdownMenuItem>
                  <DropdownMenuItem><Copy className="mr-2 h-4 w-4" />{d.duplicate}</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-destructive">
                    <Trash2 className="mr-2 h-4 w-4" />{d.delete_btn}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </motion.div>
          ))}

          {filtered.length === 0 && (
            <div className="py-12 text-center text-sm text-muted-foreground">{d.no_works}</div>
          )}
        </div>

        {/* Promoted hint */}
        {artworks.some((a) => a.status === "promoted") && (
          <div className="mt-4 rounded-xl border border-primary/20 bg-primary/5 p-4">
            <div className="flex items-start gap-3">
              <TrendingUp className="mt-0.5 h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-semibold">{d.active_promos}</p>
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
              {d.translate_title}
            </DialogTitle>
            <DialogDescription>
              {d.translate_desc}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium">{d.translate_lang}</label>
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
              <p className="mb-2 text-xs font-medium text-muted-foreground">{d.will_translate}</p>
              {translateDialog.ids.map((id) => {
                const a = artworks.find((x) => x.id === id);
                return a ? (
                  <div key={id} className="flex items-center gap-2 py-1 text-sm">
                    <span>{a.emoji}</span>
                    <span className="truncate">{a.title}</span>
                    {a.translations[translateLang] && (
                      <Badge variant="outline" className="ml-auto text-[10px]">{d.has_translation}</Badge>
                    )}
                  </div>
                ) : null;
              })}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setTranslateDialog({ open: false, ids: [] })}>
              {d.cancel}
            </Button>
            <Button onClick={handleTranslate} disabled={translating} className="gap-1.5">
              {translating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {d.translating}
                </>
              ) : (
                <>
                  <Globe className="h-4 w-4" />
                  {d.translate_btn}
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
              {d.promo_title}
            </DialogTitle>
            <DialogDescription>
              {promoDialog.ids.length > 1
                ? `${promoDialog.ids.length} ${d.promo_desc_multi}`
                : d.promo_desc_single}
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-3 py-2">
            {PROMO_OPTIONS_DAYS.map((days) => (
              <button
                key={days}
                onClick={() => setSelectedPromo(days)}
                className={`relative rounded-xl border p-4 text-left transition-all ${
                  selectedPromo === days
                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                    : "border-border hover:border-primary/40"
                }`}
              >
                {PROMO_BADGES[days] && (
                  <Badge className="absolute -top-2 right-2 text-[10px]">{PROMO_BADGES[days]}</Badge>
                )}
                <p className="text-sm font-semibold">{days}d</p>
                <p className="mt-1 text-lg font-bold text-primary">€{PROMO_PRICES[days]}</p>
                <p className="text-[11px] text-muted-foreground">{d.per_artwork}</p>
              </button>
            ))}
          </div>

          {promoDialog.ids.length > 1 && (
            <div className="rounded-lg bg-muted/50 p-3 text-sm">
              <span className="text-muted-foreground">{d.promo_total} </span>
              <span className="font-bold">
                €{(PROMO_PRICES[selectedPromo] || 0) * promoDialog.ids.length}
              </span>
              <span className="text-muted-foreground"> {d.promo_for} {promoDialog.ids.length}</span>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setPromoDialog({ open: false, ids: [] })}>
              {d.cancel}
            </Button>
            <Button onClick={handlePromote} className="gap-1.5">
              <ArrowUpRight className="h-4 w-4" />
              {d.pay_promote}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
