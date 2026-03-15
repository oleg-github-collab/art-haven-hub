import { useParams, Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Star, Heart, Share2, ShoppingCart, MapPin, Eye, Clock, Shield, Truck, RotateCcw, Tag, MessageCircle, Gavel, ChevronRight, Plus, Minus, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { useCart } from "@/contexts/CartContext";
import { useArtwork, useSimilarArtworks, formatPrice } from "@/hooks/useArtworks";
import { useLanguage } from "@/i18n";
import { toast } from "sonner";
import ARPreview from "@/components/ARPreview";

export default function ProductPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { t } = useLanguage();
  const { data: artwork, isLoading } = useArtwork(id || "");
  const { data: similarArtworks } = useSimilarArtworks(id || "");
  const [liked, setLiked] = useState(false);
  const [bidAmount, setBidAmount] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [arOpen, setArOpen] = useState(false);

  const item = artwork ? {
    id: artwork.id,
    title: artwork.title,
    category: artwork.category_id,
    subcategory: artwork.subcategory || artwork.category_id,
    price: formatPrice(artwork.price_cents, artwork.currency),
    priceNum: artwork.price_cents / 100,
    seller: artwork.artist?.display_name || "Artist",
    sellerRating: artwork.avg_rating || 0,
    sellerReviews: artwork.review_count || 0,
    city: artwork.city || "",
    country: artwork.country || "",
    emoji: artwork.emoji || "🎨",
    description: artwork.description || "",
    fullDescription: artwork.full_description,
    tags: artwork.tags || [],
    condition: artwork.condition,
    featured: artwork.is_featured || artwork.is_promoted,
    date: new Date(artwork.created_at).toLocaleDateString("uk-UA"),
    views: artwork.view_count,
    likes: artwork.like_count,
    biddable: artwork.is_biddable,
    currentBid: artwork.current_bid_cents / 100,
    bidCount: artwork.bid_count,
    shippingOptions: artwork.shipping_options,
    returnPolicy: artwork.return_policy,
    artworkWidth: artwork.width_cm,
    artworkHeight: artwork.height_cm,
    reviews: [] as { author: string; rating: number; text: string; date: string }[],
  } : null;

  const isArtwork = ["painting", "photo", "ceramics"].includes(item?.category ?? "");

  if (!item) {
    return (
      <div className="container py-20 text-center">
        <p className="text-lg text-muted-foreground">{t.product.not_found}</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate("/market")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> {t.product.back_to_market}
        </Button>
      </div>
    );
  }

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) {
      addItem({ id: item.id, title: item.title, price: item.price, priceNum: item.priceNum, seller: item.seller, emoji: item.emoji });
    }
    toast.success(`${item.title} ${t.product.added_to_cart}`);
  };

  const handleBid = () => {
    const amount = parseFloat(bidAmount);
    if (!amount || amount <= (item.currentBid ?? item.priceNum)) {
      toast.error(t.product.bid_too_low);
      return;
    }
    toast.success(`${t.product.bid_accepted} €${amount}`);
    setBidAmount("");
  };

  const relatedItems = (similarArtworks || []).slice(0, 4).map(a => ({
    id: a.id,
    title: a.title,
    emoji: a.emoji || "🎨",
    price: formatPrice(a.price_cents, a.currency),
  }));

  return (
    <div className="py-6 lg:py-10">
      <div className="container">
        <motion.nav initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6 flex items-center gap-2 text-sm text-muted-foreground">
          <Link to="/market" className="hover:text-foreground transition-colors">{t.market.title}</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-foreground font-medium truncate max-w-[200px] sm:max-w-none">{item.title}</span>
        </motion.nav>

        <div className="grid gap-8 lg:grid-cols-5">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }} className="lg:col-span-3">
            <div className="relative overflow-hidden rounded-2xl border border-border bg-secondary/40">
              <div className="flex aspect-[4/3] items-center justify-center text-[8rem]">{item.emoji}</div>
              {item.featured && <Badge className="absolute left-4 top-4 bg-primary text-primary-foreground shadow-md">{t.market.top}</Badge>}
              <button onClick={() => setLiked(!liked)} className={`absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full backdrop-blur-md transition-all ${liked ? "bg-primary/20 text-primary" : "bg-background/70 text-muted-foreground hover:text-primary"}`}>
                <Heart className={`h-5 w-5 ${liked ? "fill-primary" : ""}`} />
              </button>
              {isArtwork && (
                <button onClick={() => setArOpen(true)} className="absolute right-4 top-16 flex h-10 w-10 items-center justify-center rounded-full bg-primary/90 text-primary-foreground backdrop-blur-md transition-all hover:bg-primary shadow-lg" title={t.product.ar_preview}>
                  <Camera className="h-5 w-5" />
                </button>
              )}
            </div>

            <div className="mt-8 space-y-6">
              <div>
                <h2 className="mb-3 text-lg font-semibold font-sans">{t.product.description}</h2>
                <p className="text-sm leading-relaxed text-foreground/85">{item.fullDescription || item.description}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {item.tags.map(tg => (
                  <span key={tg} className="inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1.5 text-xs font-medium text-secondary-foreground">
                    <Tag className="h-3 w-3" /> {tg}
                  </span>
                ))}
              </div>
              {(item.shippingOptions || item.returnPolicy) && (
                <>
                  <Separator />
                  <div className="grid gap-4 sm:grid-cols-2">
                    {item.shippingOptions && (
                      <div className="rounded-xl border border-border bg-card/60 p-4 backdrop-blur-sm">
                        <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold font-sans"><Truck className="h-4 w-4 text-primary" /> {t.product.shipping}</h3>
                        <ul className="space-y-1">{item.shippingOptions.map((o, i) => (<li key={i} className="text-xs text-muted-foreground">• {o}</li>))}</ul>
                      </div>
                    )}
                    {item.returnPolicy && (
                      <div className="rounded-xl border border-border bg-card/60 p-4 backdrop-blur-sm">
                        <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold font-sans"><RotateCcw className="h-4 w-4 text-primary" /> {t.product.returns}</h3>
                        <p className="text-xs text-muted-foreground">{item.returnPolicy}</p>
                      </div>
                    )}
                  </div>
                </>
              )}
              {item.reviews && item.reviews.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h2 className="mb-4 text-lg font-semibold font-sans">{t.product.reviews} ({item.reviews.length})</h2>
                    <div className="space-y-3">
                      {item.reviews.map((r, i) => (
                        <div key={i} className="rounded-xl border border-border bg-card/60 p-4 backdrop-blur-sm">
                          <div className="mb-2 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">{r.author.split(" ").map(w => w[0]).join("")}</div>
                              <span className="text-sm font-medium font-sans">{r.author}</span>
                            </div>
                            <div className="flex items-center gap-1">{Array.from({ length: 5 }).map((_, si) => (<Star key={si} className={`h-3 w-3 ${si < r.rating ? "fill-primary text-primary" : "text-muted-foreground/30"}`} />))}</div>
                          </div>
                          <p className="text-xs text-foreground/80">{r.text}</p>
                          <p className="mt-1.5 text-xs text-muted-foreground">{r.date}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.1 }} className="lg:col-span-2">
            <div className="sticky top-20 space-y-5">
              <div className="rounded-2xl border border-border bg-card/80 p-6 backdrop-blur-xl" style={{ boxShadow: "var(--card-shadow)" }}>
                <Badge variant="outline" className="mb-3 text-xs">{item.subcategory}</Badge>
                <h1 className="mb-3 text-xl font-bold leading-tight sm:text-2xl">{item.title}</h1>
                <div className="mb-4 flex items-baseline gap-3">
                  <span className="text-3xl font-bold text-primary font-sans">{item.price}</span>
                  {item.condition && <Badge variant="secondary" className="text-xs">{item.condition}</Badge>}
                </div>
                <div className="mb-5 flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Eye className="h-3.5 w-3.5" /> {item.views}</span>
                  <span className="flex items-center gap-1"><Heart className="h-3.5 w-3.5" /> {item.likes}</span>
                  <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {item.date}</span>
                </div>
                <div className="mb-3 flex items-center gap-3">
                  <div className="flex items-center rounded-lg border border-input">
                    <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="flex h-9 w-9 items-center justify-center text-muted-foreground hover:text-foreground transition-colors"><Minus className="h-4 w-4" /></button>
                    <span className="w-8 text-center text-sm font-medium">{quantity}</span>
                    <button onClick={() => setQuantity(q => q + 1)} className="flex h-9 w-9 items-center justify-center text-muted-foreground hover:text-foreground transition-colors"><Plus className="h-4 w-4" /></button>
                  </div>
                  <Button className="flex-1 gap-2" onClick={handleAddToCart}><ShoppingCart className="h-4 w-4" />{t.product.add_to_cart}</Button>
                </div>
                <div className="flex gap-2">
                  {isArtwork && (<Button variant="outline" className="flex-1 gap-2" onClick={() => setArOpen(true)}><Camera className="h-4 w-4" />{t.product.ar_preview}</Button>)}
                  <Button variant="outline" className="flex-1 gap-2"><MessageCircle className="h-4 w-4" />{t.product.write_msg}</Button>
                  <Button variant="outline" size="icon" onClick={() => setLiked(!liked)}><Heart className={`h-4 w-4 ${liked ? "fill-primary text-primary" : ""}`} /></Button>
                  <Button variant="outline" size="icon"><Share2 className="h-4 w-4" /></Button>
                </div>
                <p className="mt-3 text-center text-xs text-muted-foreground flex items-center justify-center gap-1"><Shield className="h-3 w-3" /> {t.product.secure_deal}</p>
              </div>

              {item.biddable && (
                <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5 backdrop-blur-sm">
                  <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold font-sans"><Gavel className="h-4 w-4 text-primary" /> {t.product.auction}</h3>
                  <div className="mb-3 flex items-baseline gap-2">
                    <span className="text-lg font-bold text-primary font-sans">€{item.currentBid}</span>
                    <span className="text-xs text-muted-foreground">{t.product.current_bid} · {item.bidCount} {t.product.bids}</span>
                  </div>
                  <div className="flex gap-2">
                    <Input type="number" placeholder={`€${(item.currentBid ?? 0) + 10}+`} value={bidAmount} onChange={e => setBidAmount(e.target.value)} className="bg-background/60" />
                    <Button onClick={handleBid} className="gap-1.5 shrink-0"><Gavel className="h-3.5 w-3.5" /> {t.product.bid}</Button>
                  </div>
                </div>
              )}

              <div className="rounded-2xl border border-border bg-card/80 p-5 backdrop-blur-xl" style={{ boxShadow: "var(--card-shadow)" }}>
                <h3 className="mb-3 text-sm font-semibold font-sans">{t.product.seller}</h3>
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">{item.seller.split(" ").map(w => w[0]).join("")}</div>
                  <div>
                    <p className="text-sm font-semibold font-sans">{item.seller}</p>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Star className="h-3 w-3 fill-primary text-primary" />
                      <span>{item.sellerRating}</span>
                      <span>·</span>
                      <span>{item.sellerReviews} {t.product.seller_reviews}</span>
                    </div>
                    <div className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" /> {item.city}{item.country ? `, ${item.country}` : ""}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {relatedItems.length > 0 && (
          <div className="mt-16">
            <Separator className="mb-8" />
            <h2 className="mb-6 text-2xl font-bold">{t.product.related}</h2>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {relatedItems.map(ri => (
                <Link key={ri.id} to={`/market/${ri.id}`} className="group rounded-xl border border-border bg-card/80 p-4 backdrop-blur-sm transition-all duration-300 hover:border-primary/20" style={{ boxShadow: "var(--card-shadow)" }}>
                  <div className="mb-3 flex h-32 items-center justify-center rounded-lg bg-secondary/60 text-4xl transition-transform group-hover:scale-105">{ri.emoji}</div>
                  <h3 className="mb-1 text-sm font-semibold font-sans line-clamp-2 group-hover:text-primary transition-colors">{ri.title}</h3>
                  <p className="text-base font-bold text-primary font-sans">{ri.price}</p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      <ARPreview open={arOpen} onClose={() => setArOpen(false)} emoji={item.emoji} title={item.title} widthCm={item.artworkWidth ?? 60} heightCm={item.artworkHeight ?? 80} />
    </div>
  );
}
