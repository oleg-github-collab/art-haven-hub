import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Languages, Megaphone, CheckSquare, ChevronDown,
  Eye, Heart, TrendingUp, BarChart3, Package, Edit3,
  Trash2, Copy, MoreHorizontal, Sparkles, Globe, ArrowUpRight,
  Clock, Euro, Loader2, Check, X, Plus, Palette,
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
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/i18n/context";
import AnalyticsCharts from "@/components/dashboard/AnalyticsCharts";
import { useDashboardStats, useDashboardArtworks, type DashboardArtwork } from "@/hooks/useDashboard";

const LANGUAGES = [
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "de", label: "Deutsch", flag: "🇩🇪" },
  { code: "es", label: "Español", flag: "🇪🇸" },
  { code: "fr", label: "Français", flag: "🇫🇷" },
];

const PROMO_OPTIONS_DAYS = [1, 3, 7, 30];
const PROMO_PRICES: Record<number, number> = { 1: 2, 3: 5, 7: 10, 30: 30 };
const PROMO_BADGES: Record<number, string | undefined> = { 1: undefined, 3: "-17%", 7: "-29%", 30: "-50%" };

/* ── Stat Card ── */
function StatCard({ label, value, icon: Icon, accent }: {
  label: string; value: string | number; icon: React.ElementType; accent: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl border border-border bg-card p-4 card-shadow group hover:card-shadow-hover transition-shadow"
    >
      <div className={`absolute -top-4 -right-4 h-16 w-16 rounded-full ${accent} opacity-20 blur-xl group-hover:opacity-30 transition-opacity`} />
      <div className="flex items-center gap-2 mb-2">
        <div className={`flex h-8 w-8 items-center justify-center rounded-xl ${accent} bg-opacity-10`}>
          <Icon className="h-4 w-4" />
        </div>
        <span className="text-xs text-muted-foreground font-medium">{label}</span>
      </div>
      <p className="text-2xl font-bold font-serif">{value}</p>
    </motion.div>
  );
}

/* ── main component ── */
export default function ArtistDashboardPage() {
  const { t } = useLanguage();
  const d = t.dashboard;
  const { toast } = useToast();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [filter, setFilter] = useState<string>("all");
  const [translateDialog, setTranslateDialog] = useState<{ open: boolean; ids: string[] }>({ open: false, ids: [] });
  const [promoDialog, setPromoDialog] = useState<{ open: boolean; ids: string[] }>({ open: false, ids: [] });
  const [translateLang, setTranslateLang] = useState("en");
  const [translating, setTranslating] = useState(false);
  const [selectedPromo, setSelectedPromo] = useState(1);

  const { data: stats } = useDashboardStats();
  const { data: artworks, isLoading } = useDashboardArtworks(filter === "all" ? undefined : filter);

  const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive"; dot: string }> = {
    active: { label: d.status_active, variant: "secondary", dot: "bg-green-500" },
    promoted: { label: d.status_promoted, variant: "default", dot: "bg-primary" },
    sold: { label: d.status_sold, variant: "outline", dot: "bg-muted-foreground" },
    draft: { label: d.status_draft, variant: "outline", dot: "bg-muted-foreground/50" },
  };

  const filtered = artworks || [];
  const allSelected = filtered.length > 0 && filtered.every((a) => selected.has(a.id));
  const toggleAll = () => allSelected ? setSelected(new Set()) : setSelected(new Set(filtered.map((a) => a.id)));
  const toggleOne = (id: string) => setSelected((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const handleTranslate = () => {
    setTranslating(true);
    setTimeout(() => {
      setTranslating(false);
      setTranslateDialog({ open: false, ids: [] });
      setSelected(new Set());
      toast({ title: d.translate_done, description: `${translateDialog.ids.length} ${d.translated_desc}` });
    }, 2000);
  };

  const handlePromote = () => {
    const price = PROMO_PRICES[selectedPromo] || 0;
    setPromoDialog({ open: false, ids: [] });
    setSelected(new Set());
    toast({ title: d.works_promoted, description: `${promoDialog.ids.length} ${d.works_promoted_desc} ${selectedPromo}d — €${price * promoDialog.ids.length}` });
  };

  const handleBulkDelete = () => {
    toast({ title: d.deleted, description: `${selected.size} ${d.deleted_desc}` });
    setSelected(new Set());
  };

  const displayStats = {
    total: stats?.total || 0,
    active: stats?.active || 0,
    sold: stats?.sold || 0,
    views: stats?.views || 0,
    likes: stats?.likes || 0,
    revenue: stats?.revenue || 0,
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero header */}
      <div className="relative overflow-hidden border-b border-border bg-gradient-to-br from-card via-background to-accent/20">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,hsl(var(--primary)/0.08),transparent_60%)]" />
        <div className="container max-w-5xl relative py-8 sm:py-12">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10">
                  <Palette className="h-5 w-5 text-primary" />
                </div>
                <h1 className="font-serif text-2xl font-bold sm:text-3xl">{d.title}</h1>
              </div>
              <p className="text-sm text-muted-foreground max-w-md">{d.desc}</p>
            </div>
            <div className="flex items-center gap-2">
              <Link to="/social-hub">
                <Button variant="outline" className="gap-2 rounded-full hidden sm:flex">
                  <Megaphone className="h-4 w-4" />
                  SMM Hub
                </Button>
              </Link>
              <Button className="gap-2 rounded-full hidden sm:flex">
                <Plus className="h-4 w-4" />
                {d.all_works === "Усі роботи" ? "Додати роботу" : "Add artwork"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container max-w-5xl py-6 sm:py-8">
        {/* Stats */}
        <div className="mb-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <StatCard label={d.total} value={displayStats.total} icon={Package} accent="bg-foreground/10 text-foreground" />
          <StatCard label={d.active} value={displayStats.active} icon={Eye} accent="bg-primary/10 text-primary" />
          <StatCard label={d.sold} value={displayStats.sold} icon={Check} accent="bg-green-500/10 text-green-600" />
          <StatCard label={d.views} value={displayStats.views.toLocaleString()} icon={BarChart3} accent="bg-blue-500/10 text-blue-600" />
          <StatCard label={d.likes} value={displayStats.likes} icon={Heart} accent="bg-red-500/10 text-red-500" />
          <StatCard label={d.revenue} value={`€${displayStats.revenue.toLocaleString()}`} icon={Euro} accent="bg-primary/10 text-primary" />
        </div>

        {/* Analytics Charts */}
        <AnalyticsCharts labels={{
          analytics: d.analytics,
          views_week: d.views_week,
          sales_dynamics: d.sales_dynamics,
          views: d.views,
          sales: d.sales,
          period_week: d.period_week,
          period_month: d.period_month,
          period_year: d.period_year,
        }} />

        {/* Toolbar */}
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[150px] rounded-full">
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
                <Badge variant="secondary" className="gap-1 rounded-full px-3">
                  <CheckSquare className="h-3 w-3" />
                  {selected.size} {d.selected}
                </Badge>
                <Button size="sm" variant="outline" className="gap-1.5 rounded-full" onClick={() => setTranslateDialog({ open: true, ids: Array.from(selected) })}>
                  <Languages className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{d.ai_translate}</span>
                </Button>
                <Button size="sm" className="gap-1.5 rounded-full" onClick={() => setPromoDialog({ open: true, ids: Array.from(selected) })}>
                  <Megaphone className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{d.promote}</span>
                </Button>
                <Button size="sm" variant="destructive" className="gap-1.5 rounded-full" onClick={handleBulkDelete}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Artworks list */}
        <div className="overflow-hidden rounded-2xl border border-border bg-card card-shadow">
          {/* Table header */}
          <div className="hidden items-center gap-3 border-b border-border bg-muted/30 px-5 py-3.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider sm:flex">
            <Checkbox checked={allSelected} onCheckedChange={toggleAll} />
            <span className="flex-1">{d.artwork}</span>
            <span className="w-20 text-center">{d.price}</span>
            <span className="w-24 text-center">{d.status}</span>
            <span className="w-20 text-center">{d.views}</span>
            <span className="w-16 text-center">{d.languages}</span>
            <span className="w-10" />
          </div>

          {isLoading && (
            <div className="py-16 text-center text-sm text-muted-foreground">
              Завантаження...
            </div>
          )}

          {filtered.map((art, i) => (
            <motion.div
              key={art.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.04 }}
              className={`flex flex-col gap-2 border-b border-border/60 px-5 py-3.5 last:border-0 sm:flex-row sm:items-center sm:gap-3 transition-colors ${
                selected.has(art.id)
                  ? "bg-primary/5"
                  : "hover:bg-muted/20"
              }`}
            >
              <Checkbox checked={selected.has(art.id)} onCheckedChange={() => toggleOne(art.id)} />

              <div className="flex flex-1 items-center gap-3 min-w-0">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary/60 text-xl shrink-0 ring-1 ring-border/50">
                  {art.cover_image ? "🖼️" : "🎨"}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{art.title}</p>
                  <p className="truncate text-xs text-muted-foreground">{new Date(art.created_at).toLocaleDateString("uk-UA")}</p>
                </div>
              </div>

              <span className="w-20 text-center text-sm font-semibold">€{art.price.toLocaleString()}</span>

              <div className="flex w-24 justify-center">
                <Badge variant={statusConfig[art.status]?.variant || "outline"} className="text-xs gap-1.5 rounded-full px-2.5">
                  <span className={`h-1.5 w-1.5 rounded-full ${statusConfig[art.status]?.dot || "bg-muted-foreground"}`} />
                  {statusConfig[art.status]?.label || art.status}
                </Badge>
              </div>

              <span className="w-20 text-center text-sm text-muted-foreground">{art.views}</span>

              <div className="flex w-16 justify-center gap-0.5">
                <span className="text-xs text-muted-foreground">—</span>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="rounded-xl">
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
                  <DropdownMenuItem className="text-destructive"><Trash2 className="mr-2 h-4 w-4" />{d.delete_btn}</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </motion.div>
          ))}

          {!isLoading && filtered.length === 0 && (
            <div className="py-16 text-center text-sm text-muted-foreground">
              <Package className="mx-auto mb-3 h-8 w-8 text-muted-foreground/30" />
              <p>{d.no_works}</p>
            </div>
          )}
        </div>

        {/* Active promos hint */}
        {filtered.some((a) => a.is_promoted) && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-5 rounded-2xl border border-primary/20 bg-primary/5 p-5"
          >
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 shrink-0">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold">{d.active_promos}</p>
                {filtered.filter((a) => a.is_promoted).map((a) => (
                  <p key={a.id} className="text-xs text-muted-foreground mt-1">«{a.title}» — {a.promoted_until ? new Date(a.promoted_until).toLocaleDateString("uk-UA") : ""}</p>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* ── Translate Dialog ── */}
      <Dialog open={translateDialog.open} onOpenChange={(o) => setTranslateDialog((p) => ({ ...p, open: o }))}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              {d.translate_title}
            </DialogTitle>
            <DialogDescription>{d.translate_desc}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium">{d.translate_lang}</label>
              <Select value={translateLang} onValueChange={setTranslateLang}>
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {LANGUAGES.map((l) => <SelectItem key={l.code} value={l.code}>{l.flag} {l.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="rounded-xl bg-muted/50 p-3">
              <p className="mb-2 text-xs font-medium text-muted-foreground">{d.will_translate}</p>
              {translateDialog.ids.map((id) => {
                const a = filtered.find((x) => x.id === id);
                return a ? (
                  <div key={id} className="flex items-center gap-2 py-1 text-sm">
                    <span>🎨</span>
                    <span className="truncate">{a.title}</span>
                  </div>
                ) : null;
              })}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTranslateDialog({ open: false, ids: [] })} className="rounded-full">{d.cancel}</Button>
            <Button onClick={handleTranslate} disabled={translating} className="gap-1.5 rounded-full">
              {translating ? <><Loader2 className="h-4 w-4 animate-spin" />{d.translating}</> : <><Globe className="h-4 w-4" />{d.translate_btn}</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Promote Dialog ── */}
      <Dialog open={promoDialog.open} onOpenChange={(o) => setPromoDialog((p) => ({ ...p, open: o }))}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Megaphone className="h-5 w-5 text-primary" />
              {d.promo_title}
            </DialogTitle>
            <DialogDescription>
              {promoDialog.ids.length > 1 ? `${promoDialog.ids.length} ${d.promo_desc_multi}` : d.promo_desc_single}
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-2">
            {PROMO_OPTIONS_DAYS.map((days) => (
              <button
                key={days}
                onClick={() => setSelectedPromo(days)}
                className={`relative rounded-2xl border p-4 text-left transition-all ${
                  selectedPromo === days
                    ? "border-primary bg-primary/5 ring-2 ring-primary/30"
                    : "border-border hover:border-primary/40"
                }`}
              >
                {PROMO_BADGES[days] && <Badge className="absolute -top-2 right-2 text-[10px] rounded-full">{PROMO_BADGES[days]}</Badge>}
                <p className="text-sm font-semibold">{days}d</p>
                <p className="mt-1 text-lg font-bold text-primary">€{PROMO_PRICES[days]}</p>
                <p className="text-[11px] text-muted-foreground">{d.per_artwork}</p>
              </button>
            ))}
          </div>
          {promoDialog.ids.length > 1 && (
            <div className="rounded-xl bg-muted/50 p-3 text-sm">
              <span className="text-muted-foreground">{d.promo_total} </span>
              <span className="font-bold">€{(PROMO_PRICES[selectedPromo] || 0) * promoDialog.ids.length}</span>
              <span className="text-muted-foreground"> {d.promo_for} {promoDialog.ids.length}</span>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setPromoDialog({ open: false, ids: [] })} className="rounded-full">{d.cancel}</Button>
            <Button onClick={handlePromote} className="gap-1.5 rounded-full"><ArrowUpRight className="h-4 w-4" />{d.pay_promote}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
