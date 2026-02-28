import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, MapPin, Clock, MessageCircle, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type Announcement = {
  id: number;
  type: "offer" | "seek";
  author: string;
  avatar: string;
  title: string;
  description: string;
  tags: string[];
  city: string;
  time: string;
  premium: boolean;
};

const mockData: Announcement[] = [
  { id: 1, type: "offer", author: "Олена Мельник", avatar: "ОМ", title: "Каліграфія та леттеринг для проєктів", description: "Створю каліграфічні написи для запрошень, постерів, сертифікатів. Досвід 8 років.", tags: ["каліграфія", "дизайн", "леттеринг"], city: "Берлін", time: "2 год тому", premium: true },
  { id: 2, type: "offer", author: "Артем Коваленко", avatar: "АК", title: "Вільний виставковий простір 80м² на 2 тижні", description: "Галерейний простір у центрі Відня, білі стіни, натуральне світло, підвіска.", tags: ["простір", "виставка", "галерея"], city: "Відень", time: "5 год тому", premium: false },
  { id: 3, type: "offer", author: "Марія Бойко", avatar: "МБ", title: "Фотографую мистецькі роботи професійно", description: "Якісна зйомка картин, скульптур, інсталяцій для каталогів та онлайн-продажу.", tags: ["фото", "каталог", "репродукції"], city: "Прага", time: "8 год тому", premium: false },
  { id: 4, type: "offer", author: "Сергій Литвин", avatar: "СЛ", title: "Перевезення та пакування творів по Європі", description: "Спеціалізована логістика для мистецтва. Страхування, кліматичний транспорт.", tags: ["логістика", "пакування", "доставка"], city: "Мюнхен", time: "1 день тому", premium: true },
  { id: 5, type: "seek", author: "Ірина Ткаченко", avatar: "ІТ", title: "Шукаю куратора для групової виставки", description: "Планую групову виставку 5 українських художників у Варшаві, весна 2026.", tags: ["куратор", "виставка", "групова"], city: "Варшава", time: "3 год тому", premium: false },
  { id: 6, type: "seek", author: "Дмитро Лисенко", avatar: "ДЛ", title: "Потрібна упаковка та відправка 12 картин до Іспанії", description: "Великий формат, олія на полотні. Потрібен надійний перевізник.", tags: ["логістика", "пакування", "Іспанія"], city: "Мадрид", time: "6 год тому", premium: true },
  { id: 7, type: "seek", author: "Наталія Шевченко", avatar: "НШ", title: "Шукаю арт-дилера для роботи з колекціонерами", description: "Маю серію з 30 робіт, шукаю представника для продажу на європейському ринку.", tags: ["арт-дилер", "продаж", "колекціонери"], city: "Лісабон", time: "12 год тому", premium: false },
  { id: 8, type: "seek", author: "Олексій Бондар", avatar: "ОБ", title: "Потрібен простір для скульптурного воркшопу", description: "3 дні, 10 учасників, потрібна вентиляція та великий стіл.", tags: ["воркшоп", "простір", "скульптура"], city: "Барселона", time: "1 день тому", premium: false },
];

export default function BoardPage() {
  const [activeTab, setActiveTab] = useState("all");

  const filtered = activeTab === "all" ? mockData : mockData.filter(a => a.type === activeTab);

  return (
    <div className="py-10 lg:py-16">
      <div className="container">
        {/* Header */}
        <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-primary">Оголошення</p>
            <h1 className="text-3xl font-bold sm:text-4xl">Дошка «Можу / Хочу»</h1>
            <p className="mt-2 text-muted-foreground">Знайди або запропонуй послуги, простір, інвентар та партнерства.</p>
          </div>
          <Button>
            <Plus className="mr-1.5 h-4 w-4" />
            Створити оголошення
          </Button>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
          <TabsList className="bg-secondary">
            <TabsTrigger value="all">Усі</TabsTrigger>
            <TabsTrigger value="offer">🟢 Можу</TabsTrigger>
            <TabsTrigger value="seek">🔵 Хочу</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Two-column grid */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Можу column */}
          <div>
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold font-sans">
              <span className="inline-flex h-7 items-center rounded-full bg-primary/10 px-3 text-xs font-bold text-primary">МОЖУ</span>
              Пропоную
            </h2>
            <div className="space-y-4">
              {filtered.filter(a => a.type === "offer").map((a, i) => (
                <motion.div
                  key={a.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <BoardCard announcement={a} />
                </motion.div>
              ))}
            </div>
          </div>
          {/* Хочу column */}
          <div>
            <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold font-sans">
              <span className="inline-flex h-7 items-center rounded-full bg-accent px-3 text-xs font-bold text-accent-foreground">ХОЧУ</span>
              Шукаю
            </h2>
            <div className="space-y-4">
              {filtered.filter(a => a.type === "seek").map((a, i) => (
                <motion.div
                  key={a.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <BoardCard announcement={a} />
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function BoardCard({ announcement: a }: { announcement: Announcement }) {
  return (
    <div className={`group rounded-xl border bg-card p-5 transition-all hover:card-shadow-hover ${a.premium ? "border-primary/30 ring-1 ring-primary/10" : "border-border"}`}>
      {a.premium && (
        <Badge className="mb-3 bg-primary/10 text-primary hover:bg-primary/15">⭐ Преміум</Badge>
      )}
      <div className="mb-3 flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-secondary-foreground">
          {a.avatar}
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium">{a.author}</p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" /> {a.city}
            <span>·</span>
            <Clock className="h-3 w-3" /> {a.time}
          </div>
        </div>
      </div>
      <h3 className="mb-1.5 font-semibold font-sans">{a.title}</h3>
      <p className="mb-3 text-sm leading-relaxed text-muted-foreground">{a.description}</p>
      <div className="mb-4 flex flex-wrap gap-1.5">
        {a.tags.map(t => (
          <span key={t} className="rounded-full bg-secondary px-2.5 py-0.5 text-xs text-secondary-foreground">{t}</span>
        ))}
      </div>
      <div className="flex gap-2">
        <Button size="sm" variant="outline" className="flex-1">
          <MessageCircle className="mr-1.5 h-3.5 w-3.5" /> Відгукнутись
        </Button>
        <Button size="sm" variant="ghost">
          <UserPlus className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
