import { motion } from "framer-motion";
import { Plus, MapPin, Clock, MessageCircle, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLanguage } from "@/i18n";
import { useState } from "react";
import { useAnnouncements, type Announcement } from "@/hooks/useBoard";

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hrs = Math.floor(diff / 3600000);
  if (hrs < 24) return `${hrs} год тому`;
  return `${Math.floor(hrs / 24)} д тому`;
}

export default function BoardPage() {
  const [activeTab, setActiveTab] = useState("all");
  const { t } = useLanguage();
  const typeFilter = activeTab === "all" ? undefined : activeTab;
  const { data: announcements, isLoading } = useAnnouncements(typeFilter);
  const items = announcements || [];

  return (
    <div className="py-10 lg:py-16">
      <div className="container">
        <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-primary">{t.board.badge}</p>
            <h1 className="text-3xl font-bold sm:text-4xl">{t.board.title}</h1>
            <p className="mt-2 text-muted-foreground">{t.board.desc}</p>
          </div>
          <Button>
            <Plus className="mr-1.5 h-4 w-4" />
            {t.board.create}
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
          <TabsList className="bg-secondary">
            <TabsTrigger value="all">{t.board.all}</TabsTrigger>
            <TabsTrigger value="offer">{t.board.can}</TabsTrigger>
            <TabsTrigger value="seek">{t.board.want}</TabsTrigger>
          </TabsList>
        </Tabs>

        {isLoading && <div className="py-16 text-center text-muted-foreground">Завантаження...</div>}

        <div className="grid gap-6 lg:grid-cols-2">
          <div>
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold font-sans">
              <span className="inline-flex h-7 items-center rounded-full bg-primary/10 px-3 text-xs font-bold text-primary">{t.board.can_label}</span>
              {t.board.can_title}
            </h2>
            <div className="space-y-4">
              {items.filter(a => a.type === "offer").map((a, i) => (
                <motion.div key={a.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <BoardCard announcement={a} respondLabel={t.board.respond} premiumLabel={t.board.premium} />
                </motion.div>
              ))}
            </div>
          </div>
          <div>
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold font-sans">
              <span className="inline-flex h-7 items-center rounded-full bg-accent px-3 text-xs font-bold text-accent-foreground">{t.board.want_label}</span>
              {t.board.want_title}
            </h2>
            <div className="space-y-4">
              {items.filter(a => a.type === "seek").map((a, i) => (
                <motion.div key={a.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <BoardCard announcement={a} respondLabel={t.board.respond} premiumLabel={t.board.premium} />
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function BoardCard({ announcement: a, respondLabel, premiumLabel }: { announcement: Announcement; respondLabel: string; premiumLabel: string }) {
  const avatar = (a.author?.display_name || "?").split(" ").map(w => w[0]).join("").slice(0, 2);
  return (
    <div className="group rounded-xl border bg-card p-5 transition-all hover:card-shadow-hover border-border">
      <div className="mb-3 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-secondary-foreground">{avatar}</div>
        <div className="flex-1">
          <p className="text-sm font-medium">{a.author?.display_name || "User"}</p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {a.location && <><MapPin className="h-3 w-3" /> {a.location}</>}
            <span>·</span>
            <Clock className="h-3 w-3" /> {timeAgo(a.created_at)}
          </div>
        </div>
      </div>
      <h3 className="mb-1.5 font-semibold font-sans">{a.title}</h3>
      <p className="mb-3 text-sm leading-relaxed text-muted-foreground">{a.description}</p>
      <div className="mb-4 flex flex-wrap gap-1.5">
        {(a.tags || []).map(t => <span key={t} className="rounded-full bg-secondary px-2.5 py-0.5 text-xs text-secondary-foreground">{t}</span>)}
      </div>
      <div className="flex gap-2">
        <Button size="sm" variant="outline" className="flex-1">
          <MessageCircle className="mr-1.5 h-3.5 w-3.5" /> {respondLabel}
        </Button>
        <Button size="sm" variant="ghost"><UserPlus className="h-3.5 w-3.5" /></Button>
      </div>
    </div>
  );
}
