import { motion } from "framer-motion";
import {
  Grid3X3, Bookmark, Heart, MessageCircle, ShoppingBag, Star,
  Image as ImageIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLanguage } from "@/i18n";

interface Work {
  id: number;
  title: string;
  likes: number;
  comments: number;
}

interface Review {
  author: string;
  text: string;
  rating: number;
}

interface ProfileTabsProps {
  works: Work[];
  reviews: Review[];
  isOwn: boolean;
}

export default function ProfileTabs({ works, reviews, isOwn }: ProfileTabsProps) {
  const { t } = useLanguage();

  return (
    <div className="container max-w-3xl mt-6 pb-10">
      <Tabs defaultValue="works">
        <TabsList className="w-full justify-start border-b border-border bg-transparent p-0 h-auto gap-0">
          {[
            { value: "works", icon: Grid3X3, label: t.profile.works },
            { value: "market", icon: ShoppingBag, label: t.profile.market },
            { value: "saved", icon: Bookmark, label: t.profile.saved },
            { value: "reviews", icon: Star, label: t.profile.reviews },
          ].map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="gap-1.5 rounded-none border-b-2 border-transparent px-4 py-3 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none text-muted-foreground data-[state=active]:text-foreground"
            >
              <tab.icon className="h-4 w-4" />{tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="works" className="mt-5">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {works.map((w, i) => (
              <motion.div
                key={w.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06, duration: 0.35 }}
                className="group relative aspect-square cursor-pointer overflow-hidden rounded-2xl bg-secondary/60 ring-1 ring-border/50"
              >
                <div className="flex h-full items-center justify-center">
                  <ImageIcon className="h-10 w-10 text-muted-foreground/30" />
                </div>
                <div className="absolute inset-0 flex items-center justify-center gap-5 bg-foreground/60 backdrop-blur-sm opacity-0 transition-all duration-300 group-hover:opacity-100">
                  <span className="flex items-center gap-1.5 text-sm font-semibold text-background">
                    <Heart className="h-4 w-4" />{w.likes}
                  </span>
                  <span className="flex items-center gap-1.5 text-sm font-semibold text-background">
                    <MessageCircle className="h-4 w-4" />{w.comments}
                  </span>
                </div>
                <div className="absolute bottom-0 inset-x-0 p-2.5 bg-gradient-to-t from-foreground/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="text-xs font-medium text-background truncate">{w.title}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="market" className="mt-5">
          <EmptyState icon={ShoppingBag} text={t.profile.no_market_items}>
            {isOwn && <Button size="sm" className="mt-3 rounded-full">{t.profile.add_item}</Button>}
          </EmptyState>
        </TabsContent>

        <TabsContent value="saved" className="mt-5">
          <EmptyState icon={Bookmark} text={t.profile.no_saved} />
        </TabsContent>

        <TabsContent value="reviews" className="mt-5">
          <div className="space-y-3">
            {reviews.map((r, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className="rounded-2xl border border-border bg-card p-4 card-shadow"
              >
                <div className="mb-2 flex items-center gap-2">
                  <span className="text-sm font-semibold">{r.author}</span>
                  <div className="flex gap-0.5">
                    {Array.from({ length: r.rating }).map((_, j) => (
                      <Star key={j} className="h-3.5 w-3.5 fill-primary text-primary" />
                    ))}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{r.text}</p>
              </motion.div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function EmptyState({ icon: Icon, text, children }: { icon: React.ElementType; text: string; children?: React.ReactNode }) {
  return (
    <div className="py-16 text-center text-sm text-muted-foreground">
      <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary/60">
        <Icon className="h-7 w-7 text-muted-foreground/40" />
      </div>
      <p>{text}</p>
      {children}
    </div>
  );
}
