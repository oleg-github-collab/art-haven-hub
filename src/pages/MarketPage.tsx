import { useState, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "@/i18n";
import { motion, AnimatePresence } from "framer-motion";
import { Search, SlidersHorizontal, ShoppingBag, MapPin, Star, Heart, Eye, Grid3X3, List, X, ChevronDown, MessageCircle, Share2, Clock, Shield, Tag, ShoppingCart, Gavel } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { useCart } from "@/contexts/CartContext";
import { items as allItems, categories, sortOptions, conditions, countries, type MarketItem } from "@/data/marketItems";
import { toast } from "sonner";

const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.97 },
  visible: (i: number) => ({
    opacity: 1, y: 0, scale: 1,
    transition: { delay: i * 0.04, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] as const },
  }),
  exit: { opacity: 0, y: -10, scale: 0.97, transition: { duration: 0.2 } },
};

export default function MarketPage() {
  const { t } = useLanguage();
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [likedItems, setLikedItems] = useState<Set<number>>(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const [priceRange, setPriceRange] = useState([0, 1500]);
  const [selectedCondition, setSelectedCondition] = useState<string | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const { addItem } = useCart();

  const toggleLike = useCallback((id: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setLikedItems(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const handleQuickAdd = useCallback((item: MarketItem, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem({ id: item.id, title: item.title, price: item.price, priceNum: item.priceNum, seller: item.seller, emoji: item.emoji });
    toast.success(t.market.added_to_cart);
  }, [addItem]);

  const filtered = useMemo(() => {
    let result = allItems;
    if (activeCategory !== "all") result = result.filter(i => i.category === activeCategory);
    if (selectedCondition) result = result.filter(i => i.condition === selectedCondition);
    if (selectedCountry) result = result.filter(i => i.country === selectedCountry);
    result = result.filter(i => i.priceNum >= priceRange[0] && i.priceNum <= priceRange[1]);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(i =>
        i.title.toLowerCase().includes(q) ||
        i.seller.toLowerCase().includes(q) ||
        i.tags.some(t => t.toLowerCase().includes(q)) ||
        i.city.toLowerCase().includes(q)
      );
    }
    switch (sortBy) {
      case "price-asc": return [...result].sort((a, b) => a.priceNum - b.priceNum);
      case "price-desc": return [...result].sort((a, b) => b.priceNum - a.priceNum);
      case "popular": return [...result].sort((a, b) => b.views - a.views);
      case "rating": return [...result].sort((a, b) => b.sellerRating - a.sellerRating);
      default: return result;
    }
  }, [search, activeCategory, sortBy, priceRange, selectedCondition, selectedCountry]);

  const activeFiltersCount = [selectedCondition, selectedCountry, priceRange[0] > 0 || priceRange[1] < 1500 ? "price" : null].filter(Boolean).length;

  return (
    <div className="py-10 lg:py-16">
      <div className="container">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-primary">{t.market.badge}</p>
            <h1 className="text-3xl font-bold sm:text-4xl">{t.market.title}</h1>
            <p className="mt-2 text-muted-foreground">{t.market.desc}</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.4 }}>
            <Button className="gap-2">
              <ShoppingBag className="h-4 w-4" />
              {t.market.add_item}
            </Button>
          </motion.div>
        </div>

        {/* Search & Controls */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.4 }}
          className="mb-6 rounded-xl border border-border bg-card/80 p-4 backdrop-blur-sm"
          style={{ boxShadow: "var(--card-shadow)" }}
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={t.market.search_placeholder}
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-10 bg-background/60"
              />
              {search && (
                <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)} className="gap-1.5 relative">
                <SlidersHorizontal className="h-3.5 w-3.5" />
                {t.market.filters}
                {activeFiltersCount > 0 && (
                  <span className="ml-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                    {activeFiltersCount}
                  </span>
                )}
              </Button>
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value)}
                  className="h-9 appearance-none rounded-md border border-input bg-background px-3 pr-8 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {sortOptions.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground pointer-events-none" />
              </div>
              <div className="hidden sm:flex items-center rounded-md border border-input">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 transition-colors ${viewMode === "grid" ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground"}`}
                >
                  <Grid3X3 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2 transition-colors ${viewMode === "list" ? "bg-accent text-accent-foreground" : "text-muted-foreground hover:text-foreground"}`}
                >
                  <List className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Extended Filters Panel */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
              >
                <Separator className="my-3" />

                {/* Categories */}
                <div className="mb-4">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Категорія</p>
                  <div className="flex flex-wrap gap-2">
                    {categories.map(cat => (
                      <button
                        key={cat.id}
                        onClick={() => setActiveCategory(cat.id)}
                        className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium transition-all ${
                          activeCategory === cat.id
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                        }`}
                      >
                        {cat.label}
                        <span className={`text-xs ${activeCategory === cat.id ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                          {cat.count}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Price range */}
                <div className="mb-4">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Ціна: €{priceRange[0]} — €{priceRange[1]}
                  </p>
                  <Slider
                    min={0}
                    max={1500}
                    step={10}
                    value={priceRange}
                    onValueChange={setPriceRange}
                    className="max-w-sm"
                  />
                </div>

                {/* Condition */}
                <div className="mb-4">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Стан</p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setSelectedCondition(null)}
                      className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${!selectedCondition ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"}`}
                    >
                      Усі
                    </button>
                    {conditions.map(c => (
                      <button
                        key={c}
                        onClick={() => setSelectedCondition(selectedCondition === c ? null : c)}
                        className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${selectedCondition === c ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"}`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Country */}
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Країна</p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setSelectedCountry(null)}
                      className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${!selectedCountry ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"}`}
                    >
                      Усі
                    </button>
                    {countries.map(c => (
                      <button
                        key={c}
                        onClick={() => setSelectedCountry(selectedCountry === c ? null : c)}
                        className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${selectedCountry === c ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"}`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Results count */}
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {filtered.length} {filtered.length === 1 ? "результат" : "результатів"}
            {activeCategory !== "all" && ` у категорії «${categories.find(c => c.id === activeCategory)?.label}»`}
          </p>
        </div>

        {/* Items Grid/List */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`${activeCategory}-${sortBy}-${viewMode}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className={viewMode === "grid"
              ? "grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
              : "flex flex-col gap-4"
            }
          >
            {filtered.map((item, i) => (
              viewMode === "grid"
                ? <GridCard key={item.id} item={item} index={i} liked={likedItems.has(item.id)} onLike={toggleLike} onQuickAdd={handleQuickAdd} />
                : <ListCard key={item.id} item={item} index={i} liked={likedItems.has(item.id)} onLike={toggleLike} onQuickAdd={handleQuickAdd} />
            ))}
          </motion.div>
        </AnimatePresence>

        {filtered.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-20 text-center">
            <p className="text-lg font-medium text-muted-foreground">{t.market.nothing_found}</p>
            <p className="mt-1 text-sm text-muted-foreground">{t.market.try_change}</p>
          </motion.div>
        )}
      </div>
    </div>
  );
}

/* ───── Grid Card ───── */
function GridCard({ item, index, liked, onLike, onQuickAdd }: {
  item: MarketItem; index: number; liked: boolean;
  onLike: (id: number, e: React.MouseEvent) => void;
  onQuickAdd: (item: MarketItem, e: React.MouseEvent) => void;
}) {
  return (
    <motion.div variants={cardVariants} initial="hidden" animate="visible" exit="exit" custom={index} layout>
      <Link
        to={`/market/${item.id}`}
        className="group relative block cursor-pointer overflow-hidden rounded-xl border border-border bg-card/80 backdrop-blur-sm transition-all duration-300 hover:border-primary/20 hover:-translate-y-1"
        style={{ boxShadow: "var(--card-shadow)" }}
      >
        {item.featured && (
          <div className="absolute left-3 top-3 z-10">
            <Badge className="bg-primary text-primary-foreground text-xs shadow-sm">⭐ Топ</Badge>
          </div>
        )}
        {item.biddable && (
          <div className="absolute left-3 top-3 z-10" style={item.featured ? { left: "5.5rem" } : {}}>
            <Badge variant="outline" className="bg-background/80 backdrop-blur-sm text-xs gap-1">
              <Gavel className="h-3 w-3" /> Аукціон
            </Badge>
          </div>
        )}
        <button
          onClick={(e) => onLike(item.id, e)}
          className={`absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full backdrop-blur-md transition-all ${
            liked ? "bg-primary/20 text-primary" : "bg-background/60 text-muted-foreground hover:text-primary hover:bg-primary/10"
          }`}
        >
          <Heart className={`h-4 w-4 ${liked ? "fill-primary" : ""}`} />
        </button>

        <div className="flex h-40 items-center justify-center bg-secondary/60 text-5xl transition-transform duration-500 group-hover:scale-105">
          {item.emoji}
        </div>

        <div className="p-4">
          <Badge variant="outline" className="mb-2 text-xs font-normal">{item.subcategory}</Badge>
          <h3 className="mb-1.5 line-clamp-2 text-sm font-semibold leading-snug font-sans group-hover:text-primary transition-colors">{item.title}</h3>
          <div className="mb-3 flex items-baseline gap-2">
            <span className="text-lg font-bold text-primary font-sans">{item.price}</span>
            {item.biddable && item.currentBid && (
              <span className="text-xs text-muted-foreground">ставка: €{item.currentBid}</span>
            )}
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" />
              <span>{item.city}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Star className="h-3 w-3 fill-primary text-primary" />
                <span>{item.sellerRating}</span>
              </div>
              <button
                onClick={(e) => onQuickAdd(item, e)}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition-all"
              >
                <ShoppingCart className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

/* ───── List Card ───── */
function ListCard({ item, index, liked, onLike, onQuickAdd }: {
  item: MarketItem; index: number; liked: boolean;
  onLike: (id: number, e: React.MouseEvent) => void;
  onQuickAdd: (item: MarketItem, e: React.MouseEvent) => void;
}) {
  return (
    <motion.div variants={cardVariants} initial="hidden" animate="visible" exit="exit" custom={index} layout>
      <Link
        to={`/market/${item.id}`}
        className="group flex cursor-pointer gap-4 rounded-xl border border-border bg-card/80 p-4 backdrop-blur-sm transition-all duration-300 hover:border-primary/20"
        style={{ boxShadow: "var(--card-shadow)" }}
      >
        <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-lg bg-secondary/60 text-4xl">
          {item.emoji}
        </div>
        <div className="flex flex-1 flex-col justify-between min-w-0">
          <div>
            <div className="mb-1 flex items-center gap-2 flex-wrap">
              <Badge variant="outline" className="text-xs font-normal">{item.subcategory}</Badge>
              {item.featured && <Badge className="bg-primary text-primary-foreground text-xs">⭐ Топ</Badge>}
              {item.biddable && <Badge variant="outline" className="text-xs gap-1"><Gavel className="h-3 w-3" /> Аукціон</Badge>}
            </div>
            <h3 className="mb-1 text-sm font-semibold font-sans group-hover:text-primary transition-colors truncate">{item.title}</h3>
            <p className="text-xs text-muted-foreground line-clamp-1">{item.description}</p>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{item.city}</span>
              <span className="flex items-center gap-1"><Star className="h-3 w-3 fill-primary text-primary" />{item.sellerRating}</span>
              <span className="flex items-center gap-1"><Eye className="h-3 w-3" />{item.views}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold text-primary font-sans">{item.price}</span>
              <button
                onClick={(e) => onQuickAdd(item, e)}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground transition-all"
              >
                <ShoppingCart className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={(e) => onLike(item.id, e)}
                className={`flex h-7 w-7 items-center justify-center rounded-full transition-colors ${liked ? "text-primary" : "text-muted-foreground hover:text-primary"}`}
              >
                <Heart className={`h-3.5 w-3.5 ${liked ? "fill-primary" : ""}`} />
              </button>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
