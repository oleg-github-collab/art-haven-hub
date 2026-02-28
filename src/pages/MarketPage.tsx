import { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, SlidersHorizontal, ShoppingBag, MapPin, Star, Heart, Eye, Grid3X3, List, X, ChevronDown, MessageCircle, Share2, ExternalLink, Clock, Shield, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";

type Item = {
  id: number;
  title: string;
  category: string;
  subcategory: string;
  price: string;
  priceNum: number;
  seller: string;
  sellerRating: number;
  sellerReviews: number;
  city: string;
  country: string;
  emoji: string;
  description: string;
  tags: string[];
  condition?: string;
  featured: boolean;
  date: string;
  views: number;
  likes: number;
};

const categories = [
  { id: "all", label: "Усі", count: 12 },
  { id: "painting", label: "Живопис", count: 3 },
  { id: "ceramics", label: "Кераміка", count: 2 },
  { id: "photo", label: "Фотографія", count: 2 },
  { id: "inventory", label: "Інвентар", count: 2 },
  { id: "materials", label: "Матеріали", count: 1 },
  { id: "services", label: "Послуги", count: 2 },
];

const sortOptions = [
  { id: "newest", label: "Найновіші" },
  { id: "price-asc", label: "Дешевші" },
  { id: "price-desc", label: "Дорожчі" },
  { id: "popular", label: "Популярні" },
];

const items: Item[] = [
  { id: 1, title: "Абстрактний пейзаж, олія на полотні, 80×100 см", category: "painting", subcategory: "Олійний живопис", price: "€1,200", priceNum: 1200, seller: "Марина Ковальчук", sellerRating: 4.9, sellerReviews: 23, city: "Берлін", country: "Німеччина", emoji: "🎨", description: "Оригінальна робота олійними фарбами. Абстрактний пейзаж, натхненний Карпатськими горами. Полотно на підрамнику, готове до експозиції. Сертифікат автентичності додається.", tags: ["олія", "абстракція", "пейзаж", "оригінал"], condition: "Нова робота", featured: true, date: "2 дні тому", views: 156, likes: 24 },
  { id: 2, title: "Керамічна ваза ручної роботи «Степ»", category: "ceramics", subcategory: "Декоративна кераміка", price: "€180", priceNum: 180, seller: "Олексій Гончаренко", sellerRating: 4.7, sellerReviews: 15, city: "Відень", country: "Австрія", emoji: "🏺", description: "Ваза із шамотної глини, ручне формування та глазурування. Висота 35 см. Декоративний виріб, натхненний українськими степовими мотивами.", tags: ["кераміка", "ручна робота", "декор"], condition: "Нова робота", featured: false, date: "5 днів тому", views: 89, likes: 12 },
  { id: 3, title: "Фотопринт «Карпати» 60×90, лімітована серія", category: "photo", subcategory: "Арт-принт", price: "€350", priceNum: 350, seller: "Дарія Коваленко", sellerRating: 5.0, sellerReviews: 31, city: "Прага", country: "Чехія", emoji: "📷", description: "Лімітований фотопринт на музейному папері Hahnemühle. Тираж 25 примірників, нумерація та підпис автора. Зображення зимових Карпат у золотому світлі.", tags: ["фото", "принт", "лімітований", "Карпати"], condition: "Нова", featured: true, date: "1 день тому", views: 234, likes: 45 },
  { id: 4, title: "Мольберт студійний великий, дерево", category: "inventory", subcategory: "Обладнання студії", price: "€45", priceNum: 45, seller: "Вікторія Савченко", sellerRating: 4.5, sellerReviews: 8, city: "Мадрид", country: "Іспанія", emoji: "🖼️", description: "Великий дерев'яний мольберт для роботи з полотнами до 180 см. У хорошому стані, є незначні сліди фарби. Самовивіз з Мадрида.", tags: ["мольберт", "студія", "б/у"], condition: "Б/у, гарний стан", featured: false, date: "1 тиждень тому", views: 67, likes: 5 },
  { id: 5, title: "Набір масляних фарб Winsor & Newton, 24 кольори", category: "materials", subcategory: "Фарби", price: "€95", priceNum: 95, seller: "Сергій Литвиненко", sellerRating: 4.8, sellerReviews: 19, city: "Мюнхен", country: "Німеччина", emoji: "🎨", description: "Професійний набір масляних фарб Winsor & Newton Artists' Oil Colour. 24 тюбики по 37 мл. Новий, у заводській упаковці.", tags: ["фарби", "олія", "Winsor & Newton", "матеріали"], condition: "Новий", featured: false, date: "3 дні тому", views: 112, likes: 18 },
  { id: 6, title: "Послуги пакування та доставки картин по Європі", category: "services", subcategory: "Логістика", price: "від €50", priceNum: 50, seller: "TransArt EU", sellerRating: 4.9, sellerReviews: 47, city: "Вся Європа", country: "", emoji: "📦", description: "Професійне пакування та доставка творів мистецтва по всій Європі. Страхування вантажу. Досвід роботи з галереями та аукціонними домами. Індивідуальні рішення для кожного замовлення.", tags: ["логістика", "доставка", "пакування", "страхування"], featured: true, date: "постійна", views: 432, likes: 67 },
  { id: 7, title: "Серія акварелей «Ботаніка», 5 аркушів", category: "painting", subcategory: "Акварель", price: "€680", priceNum: 680, seller: "Наталія Бондар", sellerRating: 4.6, sellerReviews: 11, city: "Лісабон", country: "Португалія", emoji: "🌿", description: "Серія з 5 ботанічних акварелей на папері Arches 300 г/м². Формат 30×40 см кожна. Тема — рідкісні рослини Карпат.", tags: ["акварель", "ботаніка", "серія"], condition: "Нова робота", featured: false, date: "4 дні тому", views: 98, likes: 15 },
  { id: 8, title: "Фотосесія для портфоліо митця", category: "services", subcategory: "Фотопослуги", price: "€200", priceNum: 200, seller: "Андрій Мельник", sellerRating: 4.8, sellerReviews: 22, city: "Берлін", country: "Німеччина", emoji: "📸", description: "Професійна фотосесія для портфоліо: зйомка робіт у студії або in-situ, портрет митця, ретуш та обробка. До 30 фото у високій якості.", tags: ["фото", "портфоліо", "студія"], featured: false, date: "6 днів тому", views: 145, likes: 21 },
  { id: 9, title: "Набір для шовкографії, початківець", category: "inventory", subcategory: "Обладнання", price: "€120", priceNum: 120, seller: "Ольга Петренко", sellerRating: 4.4, sellerReviews: 6, city: "Амстердам", country: "Нідерланди", emoji: "🖌️", description: "Повний стартовий набір для шовкографії: рамка, сітка, ракель, емульсія, 4 кольори фарби. Ідеально для початківців.", tags: ["шовкографія", "друк", "набір"], condition: "Новий", featured: false, date: "2 тижні тому", views: 54, likes: 7 },
  { id: 10, title: "Графіка тушшю «Місто вночі», 50×70", category: "painting", subcategory: "Графіка", price: "€420", priceNum: 420, seller: "Роман Шевченко", sellerRating: 4.9, sellerReviews: 28, city: "Париж", country: "Франція", emoji: "✒️", description: "Оригінальна графіка тушшю та пером. Детальне зображення нічного міста. Паспарту та рама в комплекті.", tags: ["графіка", "туш", "місто", "оригінал"], condition: "Нова робота", featured: true, date: "3 дні тому", views: 187, likes: 33 },
  { id: 11, title: "Керамічний посуд «Трипілля», сет 6 од.", category: "ceramics", subcategory: "Авторський посуд", price: "€340", priceNum: 340, seller: "Катерина Різник", sellerRating: 5.0, sellerReviews: 14, city: "Мюнхен", country: "Німеччина", emoji: "🍶", description: "Авторський набір посуду з трипільськими мотивами. 6 предметів: 2 тарілки, 2 піали, глечик, чашка. Глазурована кераміка, safe для посудомийки.", tags: ["кераміка", "Трипілля", "посуд", "авторський"], condition: "Нова робота", featured: false, date: "1 тиждень тому", views: 123, likes: 19 },
  { id: 12, title: "Відеоарт «Потік» для виставки, 4K loop", category: "photo", subcategory: "Відеоарт", price: "€900", priceNum: 900, seller: "Максим Іваненко", sellerRating: 4.7, sellerReviews: 9, city: "Барселона", country: "Іспанія", emoji: "🎬", description: "Відеоарт у форматі 4K, безшовний loop тривалістю 12 хв. Тема — вода та рух. Ліцензія для виставкового показу.", tags: ["відеоарт", "4K", "виставка", "ліцензія"], condition: "Цифровий продукт", featured: false, date: "5 днів тому", views: 76, likes: 11 },
];

const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.97 },
  visible: (i: number) => ({
    opacity: 1, y: 0, scale: 1,
    transition: { delay: i * 0.04, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] as const },
  }),
  exit: { opacity: 0, y: -10, scale: 0.97, transition: { duration: 0.2 } },
};

export default function MarketPage() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [likedItems, setLikedItems] = useState<Set<number>>(new Set());
  const [showFilters, setShowFilters] = useState(false);

  const toggleLike = useCallback((id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setLikedItems(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const filtered = useMemo(() => {
    let result = items;
    if (activeCategory !== "all") result = result.filter(i => i.category === activeCategory);
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
      default: return result;
    }
  }, [search, activeCategory, sortBy]);

  return (
    <div className="py-10 lg:py-16">
      <div className="container">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-primary">Маркетплейс</p>
            <h1 className="text-3xl font-bold sm:text-4xl">Маркет</h1>
            <p className="mt-2 text-muted-foreground">Мистецтво, матеріали, інвентар та послуги для творчої діяльності.</p>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.4 }}>
            <Button className="gap-2">
              <ShoppingBag className="h-4 w-4" />
              Розмістити товар
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
                placeholder="Пошук за назвою, автором, тегом, містом…"
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
              <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)} className="gap-1.5">
                <SlidersHorizontal className="h-3.5 w-3.5" />
                Фільтри
              </Button>
              {/* Sort */}
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
              {/* View toggle */}
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

          {/* Category tabs */}
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
                ? <GridCard key={item.id} item={item} index={i} liked={likedItems.has(item.id)} onLike={toggleLike} onSelect={setSelectedItem} />
                : <ListCard key={item.id} item={item} index={i} liked={likedItems.has(item.id)} onLike={toggleLike} onSelect={setSelectedItem} />
            ))}
          </motion.div>
        </AnimatePresence>

        {filtered.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-20 text-center">
            <p className="text-lg font-medium text-muted-foreground">Нічого не знайдено</p>
            <p className="mt-1 text-sm text-muted-foreground">Спробуйте змінити пошуковий запит або фільтри</p>
          </motion.div>
        )}
      </div>

      {/* Detail Dialog */}
      <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
        {selectedItem && (
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-background/95 backdrop-blur-xl border-border">
            <DialogHeader>
              <div className="flex items-start gap-3">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-secondary text-3xl">
                  {selectedItem.emoji}
                </div>
                <div className="min-w-0">
                  <DialogTitle className="text-xl font-bold leading-tight font-serif">{selectedItem.title}</DialogTitle>
                  <DialogDescription className="mt-1">
                    {selectedItem.subcategory} · {selectedItem.city}{selectedItem.country ? `, ${selectedItem.country}` : ""}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="mt-2 space-y-5">
              {/* Price & badges */}
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-2xl font-bold text-primary font-sans">{selectedItem.price}</span>
                {selectedItem.featured && (
                  <Badge className="bg-primary/10 text-primary border-primary/20">⭐ Топ</Badge>
                )}
                {selectedItem.condition && (
                  <Badge variant="outline" className="text-muted-foreground">{selectedItem.condition}</Badge>
                )}
              </div>

              {/* Description */}
              <p className="text-sm leading-relaxed text-foreground/90">{selectedItem.description}</p>

              {/* Tags */}
              <div className="flex flex-wrap gap-1.5">
                {selectedItem.tags.map(t => (
                  <span key={t} className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
                    <Tag className="h-3 w-3" />
                    {t}
                  </span>
                ))}
              </div>

              <Separator />

              {/* Seller info */}
              <div className="flex items-center justify-between rounded-xl bg-card p-4 border border-border">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                    {selectedItem.seller.split(" ").map(w => w[0]).join("")}
                  </div>
                  <div>
                    <p className="text-sm font-semibold font-sans">{selectedItem.seller}</p>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Star className="h-3 w-3 fill-primary text-primary" />
                      <span>{selectedItem.sellerRating}</span>
                      <span>·</span>
                      <span>{selectedItem.sellerReviews} відгуків</span>
                    </div>
                  </div>
                </div>
                <Button size="sm" variant="outline" className="gap-1.5">
                  <MessageCircle className="h-3.5 w-3.5" />
                  Написати
                </Button>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Eye className="h-3.5 w-3.5" /> {selectedItem.views} переглядів</span>
                <span className="flex items-center gap-1"><Heart className="h-3.5 w-3.5" /> {selectedItem.likes} вподобань</span>
                <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {selectedItem.date}</span>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button className="flex-1 gap-2">
                  <MessageCircle className="h-4 w-4" />
                  Звʼязатись із продавцем
                </Button>
                <Button variant="outline" size="icon">
                  <Heart className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon">
                  <Share2 className="h-4 w-4" />
                </Button>
              </div>

              <p className="text-center text-xs text-muted-foreground flex items-center justify-center gap-1">
                <Shield className="h-3 w-3" />
                Безпечна угода через платформу «Мистецтво»
              </p>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}

/* ───── Grid Card ───── */
function GridCard({ item, index, liked, onLike, onSelect }: {
  item: Item; index: number; liked: boolean;
  onLike: (id: number, e: React.MouseEvent) => void;
  onSelect: (item: Item) => void;
}) {
  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      custom={index}
      layout
      onClick={() => onSelect(item)}
      className="group relative cursor-pointer overflow-hidden rounded-xl border border-border bg-card/80 backdrop-blur-sm transition-all duration-300 hover:border-primary/20"
      style={{ boxShadow: "var(--card-shadow)" }}
      whileHover={{ y: -4, boxShadow: "var(--card-shadow-hover)" }}
    >
      {item.featured && (
        <div className="absolute left-3 top-3 z-10">
          <Badge className="bg-primary text-primary-foreground text-xs shadow-sm">⭐ Топ</Badge>
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
        <p className="mb-3 text-lg font-bold text-primary font-sans">{item.price}</p>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" />
            <span>{item.city}</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Star className="h-3 w-3 fill-primary text-primary" />
            <span>{item.sellerRating}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ───── List Card ───── */
function ListCard({ item, index, liked, onLike, onSelect }: {
  item: Item; index: number; liked: boolean;
  onLike: (id: number, e: React.MouseEvent) => void;
  onSelect: (item: Item) => void;
}) {
  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      custom={index}
      layout
      onClick={() => onSelect(item)}
      className="group flex cursor-pointer gap-4 rounded-xl border border-border bg-card/80 p-4 backdrop-blur-sm transition-all duration-300 hover:border-primary/20"
      style={{ boxShadow: "var(--card-shadow)" }}
      whileHover={{ x: 4, boxShadow: "var(--card-shadow-hover)" }}
    >
      <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-lg bg-secondary/60 text-4xl">
        {item.emoji}
      </div>
      <div className="flex flex-1 flex-col justify-between min-w-0">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <Badge variant="outline" className="text-xs font-normal">{item.subcategory}</Badge>
            {item.featured && <Badge className="bg-primary text-primary-foreground text-xs">⭐ Топ</Badge>}
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
              onClick={(e) => onLike(item.id, e)}
              className={`flex h-7 w-7 items-center justify-center rounded-full transition-colors ${liked ? "text-primary" : "text-muted-foreground hover:text-primary"}`}
            >
              <Heart className={`h-3.5 w-3.5 ${liked ? "fill-primary" : ""}`} />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
