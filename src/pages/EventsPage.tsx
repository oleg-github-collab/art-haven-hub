import { motion } from "framer-motion";
import { MapPin, Calendar, Clock, Users, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/i18n";
import { useEvents, type EventItem } from "@/hooks/useBoard";

const typeColors: Record<string, string> = {
  "exhibition": "bg-primary/10 text-primary",
  "workshop": "bg-accent text-accent-foreground",
  "lecture": "bg-secondary text-secondary-foreground",
  "performance": "bg-primary/10 text-primary",
  "fair": "bg-primary/10 text-primary",
};

export default function EventsPage() {
  const { t } = useLanguage();
  const { data: events, isLoading } = useEvents();
  const items = events || [];

  return (
    <div className="py-10 lg:py-16">
      <div className="container">
        <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-primary">{t.events.badge}</p>
            <h1 className="text-3xl font-bold sm:text-4xl">{t.events.title}</h1>
            <p className="mt-2 text-muted-foreground">{t.events.desc}</p>
          </div>
          <Button>
            <Calendar className="mr-1.5 h-4 w-4" />
            {t.events.create}
          </Button>
        </div>

        {isLoading && <div className="py-16 text-center text-muted-foreground">Завантаження...</div>}

        <div className="grid gap-6 lg:grid-cols-2">
          {items.map((e, i) => (
            <motion.div key={e.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
              className={`group rounded-xl border bg-card p-6 transition-all hover:card-shadow-hover ${e.is_featured ? "border-primary/30 ring-1 ring-primary/10" : "border-border"}`}
            >
              <div className="mb-3 flex items-center gap-2">
                <Badge className={typeColors[e.event_type] || "bg-secondary text-secondary-foreground"}>{e.event_type}</Badge>
                {e.is_featured && <Badge className="bg-primary/10 text-primary hover:bg-primary/15">{t.events.recommended}</Badge>}
              </div>
              <h3 className="mb-2 text-lg font-bold font-serif">{e.title}</h3>
              <p className="mb-4 text-sm leading-relaxed text-muted-foreground">{e.description}</p>
              <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {new Date(e.starts_at).toLocaleDateString("uk-UA")}</span>
                <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {new Date(e.starts_at).toLocaleTimeString("uk-UA", { hour: "2-digit", minute: "2-digit" })}</span>
                <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {e.city || (e.is_online ? "Онлайн" : "")}</span>
                <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {e.attendee_count}</span>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">{t.events.organizer}: <span className="font-medium text-foreground">{e.organizer?.display_name || ""}</span></p>
                <Button size="sm" variant="outline">
                  {t.events.details} <ArrowRight className="ml-1 h-3.5 w-3.5" />
                </Button>
              </div>
            </motion.div>
          ))}
        </div>

        {!isLoading && items.length === 0 && (
          <div className="py-16 text-center text-muted-foreground">
            Поки немає подій
          </div>
        )}
      </div>
    </div>
  );
}
