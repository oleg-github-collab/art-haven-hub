import { motion } from "framer-motion";
import { MapPin, Calendar, Clock, Users, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type Event = {
  id: number;
  title: string;
  type: string;
  date: string;
  time: string;
  city: string;
  venue: string;
  organizer: string;
  attendees: number;
  description: string;
  featured: boolean;
};

const events: Event[] = [
  { id: 1, title: "Українське сучасне мистецтво: нова хвиля", type: "Виставка", date: "15 бер 2026", time: "18:00", city: "Берлін", venue: "Galerie Am Kupfergraben", organizer: "Андрій Петренко", attendees: 120, description: "Групова виставка 12 українських художників, які працюють в еміграції.", featured: true },
  { id: 2, title: "Воркшоп: Кераміка для початківців", type: "Воркшоп", date: "22 бер 2026", time: "10:00", city: "Відень", venue: "Keramikwerkstatt Wien", organizer: "Олексій Гончар", attendees: 15, description: "Інтерактивний воркшоп з основ ручної ліпки та глазурування.", featured: false },
  { id: 3, title: "Art Talk: Ринок мистецтва в Європі 2026", type: "Лекція", date: "28 бер 2026", time: "19:00", city: "Онлайн", venue: "Zoom / Платформа", organizer: "Світлана Бойко", attendees: 250, description: "Дискусія про тренди, ціноутворення та стратегії для українських митців.", featured: true },
  { id: 4, title: "Перформанс «Коріння»", type: "Перформанс", date: "5 кві 2026", time: "20:00", city: "Лондон", venue: "Barbican Centre", organizer: "Роман Ткачук", attendees: 80, description: "Мультимедійний перформанс про ідентичність та коріння в еміграції.", featured: false },
  { id: 5, title: "Ярмарок мистецтва: Українські митці Парижа", type: "Ярмарок", date: "12 кві 2026", time: "11:00", city: "Париж", venue: "Le Marais Gallery Space", organizer: "Світлана Бойко", attendees: 300, description: "Великий щорічний арт-ярмарок з продажем робіт, нетворкінгом та лекціями.", featured: true },
  { id: 6, title: "Відкриття виставки «Світло в тіні»", type: "Виставка", date: "20 кві 2026", time: "17:00", city: "Варшава", venue: "Zachęta Gallery", organizer: "Дарія Ковальчук", attendees: 90, description: "Фотовиставка, присвячена життю українських родин в еміграції.", featured: false },
];

const typeColors: Record<string, string> = {
  "Виставка": "bg-primary/10 text-primary",
  "Воркшоп": "bg-accent text-accent-foreground",
  "Лекція": "bg-secondary text-secondary-foreground",
  "Перформанс": "bg-primary/10 text-primary",
  "Ярмарок": "bg-primary/10 text-primary",
};

export default function EventsPage() {
  return (
    <div className="py-10 lg:py-16">
      <div className="container">
        <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-primary">Календар</p>
            <h1 className="text-3xl font-bold sm:text-4xl">Події та заходи</h1>
            <p className="mt-2 text-muted-foreground">Виставки, воркшопи, лекції та зустрічі для українських митців.</p>
          </div>
          <Button>
            <Calendar className="mr-1.5 h-4 w-4" />
            Створити подію
          </Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {events.map((e, i) => (
            <motion.div
              key={e.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className={`group rounded-xl border bg-card p-6 transition-all hover:card-shadow-hover ${e.featured ? "border-primary/30 ring-1 ring-primary/10" : "border-border"}`}
            >
              <div className="mb-3 flex items-center gap-2">
                <Badge className={typeColors[e.type] || "bg-secondary text-secondary-foreground"}>{e.type}</Badge>
                {e.featured && <Badge className="bg-primary/10 text-primary hover:bg-primary/15">⭐ Рекомендоване</Badge>}
              </div>
              <h3 className="mb-2 text-lg font-bold font-serif">{e.title}</h3>
              <p className="mb-4 text-sm leading-relaxed text-muted-foreground">{e.description}</p>
              <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {e.date}</span>
                <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {e.time}</span>
                <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {e.city}</span>
                <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {e.attendees}</span>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">Організатор: <span className="font-medium text-foreground">{e.organizer}</span></p>
                <Button size="sm" variant="outline">
                  Детальніше <ArrowRight className="ml-1 h-3.5 w-3.5" />
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
