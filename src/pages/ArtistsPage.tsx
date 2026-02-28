import { motion } from "framer-motion";
import { MapPin, Users, ExternalLink, UserPlus, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type Artist = {
  id: number;
  name: string;
  initials: string;
  role: string;
  city: string;
  tags: string[];
  connections: number;
  rating: number;
  premium: boolean;
};

const artists: Artist[] = [
  { id: 1, name: "Марина Камінська", initials: "МК", role: "Художниця, живопис", city: "Берлін", tags: ["живопис", "олія", "абстракція"], connections: 234, rating: 4.9, premium: true },
  { id: 2, name: "Олексій Гончар", initials: "ОГ", role: "Скульптор, кераміка", city: "Відень", tags: ["скульптура", "кераміка", "інсталяції"], connections: 167, rating: 4.7, premium: false },
  { id: 3, name: "Дарія Ковальчук", initials: "ДК", role: "Фотографка", city: "Прага", tags: ["фото", "документалістика", "портрет"], connections: 312, rating: 4.8, premium: true },
  { id: 4, name: "Андрій Петренко", initials: "АП", role: "Куратор виставок", city: "Варшава", tags: ["куратор", "виставки", "contemporary"], connections: 489, rating: 5.0, premium: true },
  { id: 5, name: "Вікторія Степаненко", initials: "ВС", role: "Графічний дизайн, ілюстрація", city: "Мадрид", tags: ["ілюстрація", "графіка", "постери"], connections: 198, rating: 4.6, premium: false },
  { id: 6, name: "Роман Ткачук", initials: "РТ", role: "Перформанс-художник", city: "Лондон", tags: ["перформанс", "відео-арт", "медіа"], connections: 145, rating: 4.5, premium: false },
  { id: 7, name: "Світлана Бойко", initials: "СБ", role: "Арт-дилер, галеристка", city: "Париж", tags: ["арт-дилер", "галерея", "продаж"], connections: 567, rating: 4.9, premium: true },
  { id: 8, name: "Максим Лисенко", initials: "МЛ", role: "Цифровий художник, NFT", city: "Лісабон", tags: ["digital", "NFT", "генеративне"], connections: 278, rating: 4.4, premium: false },
];

export default function ArtistsPage() {
  return (
    <div className="py-10 lg:py-16">
      <div className="container">
        <div className="mb-10">
          <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-primary">Каталог</p>
          <h1 className="text-3xl font-bold sm:text-4xl">Митці та спеціалісти</h1>
          <p className="mt-2 text-muted-foreground">Знаходь партнерів, кураторів, арт-дилерів та інших фахівців креативних індустрій.</p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {artists.map((a, i) => (
            <motion.div
              key={a.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className={`group rounded-xl border bg-card p-5 transition-all hover:card-shadow-hover ${a.premium ? "border-primary/30 ring-1 ring-primary/10" : "border-border"}`}
            >
              {a.premium && (
                <Badge className="mb-3 bg-primary/10 text-primary hover:bg-primary/15">⭐ PRO</Badge>
              )}
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                  {a.initials}
                </div>
                <div>
                  <p className="font-semibold font-sans">{a.name}</p>
                  <p className="text-xs text-muted-foreground">{a.role}</p>
                </div>
              </div>
              <div className="mb-3 flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {a.city}</span>
                <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {a.connections}</span>
                <span className="flex items-center gap-1"><Star className="h-3 w-3 text-primary" /> {a.rating}</span>
              </div>
              <div className="mb-4 flex flex-wrap gap-1.5">
                {a.tags.map(t => (
                  <span key={t} className="rounded-full bg-secondary px-2.5 py-0.5 text-xs text-secondary-foreground">{t}</span>
                ))}
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="flex-1">
                  <ExternalLink className="mr-1.5 h-3.5 w-3.5" /> Профіль
                </Button>
                <Button size="sm" variant="ghost">
                  <UserPlus className="h-3.5 w-3.5" />
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
