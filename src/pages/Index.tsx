import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Users, Megaphone, Calendar, ShoppingBag, MessageCircle, Video, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroArt from "@/assets/hero-art.jpg";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const },
  }),
};

const features = [
  { icon: Megaphone, title: "Дошка оголошень", desc: "«Можу» та «Хочу» — знайди або запропонуй послуги, інвентар, простір.", link: "/board" },
  { icon: Users, title: "Нетворкінг", desc: "Зʼєднуйся з митцями, кураторами, галеристами та арт-дилерами.", link: "/artists" },
  { icon: Calendar, title: "Події", desc: "Виставки, перформанси, воркшопи по всьому світу.", link: "/events" },
  { icon: ShoppingBag, title: "Маркет", desc: "Продавай та рекламуй мистецтво, послуги та матеріали.", link: "/market" },
  { icon: MessageCircle, title: "Месенджер", desc: "Особисті повідомлення, групові чати, канали для аудиторії." },
  { icon: Video, title: "Аудіо & Відео", desc: "Онлайн-кімнати для дискусій, лекцій та спільної роботи." },
  { icon: Star, title: "Просування", desc: "Платна підписка для топ-розміщення, галереї та автопостингу." },
];

const sampleAnnouncements = [
  { type: "offer", author: "Олена М.", title: "Зроблю каліграфію для запрошень", tags: ["каліграфія", "дизайн"], city: "Берлін" },
  { type: "offer", author: "Артем К.", title: "Є вільний виставковий простір на 2 тижні", tags: ["простір", "виставка"], city: "Відень" },
  { type: "seek", author: "Ірина Т.", title: "Шукаю куратора для групової виставки", tags: ["куратор", "виставка"], city: "Варшава" },
  { type: "seek", author: "Дмитро Л.", title: "Потрібна упаковка та доставка 12 картин", tags: ["логістика", "доставка"], city: "Мадрид" },
];

export default function Index() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden hero-gradient">
        <div className="container relative z-10 py-20 lg:py-28">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <motion.div initial="hidden" animate="visible" className="max-w-xl">
              <motion.p variants={fadeUp} custom={0} className="mb-4 text-sm font-semibold uppercase tracking-widest text-primary">
                Для українських митців у всьому світі
              </motion.p>
              <motion.h1 variants={fadeUp} custom={1} className="mb-6 text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
                Обʼєднуємо <span className="text-gradient">творчість</span> без кордонів
              </motion.h1>
              <motion.p variants={fadeUp} custom={2} className="mb-8 text-lg leading-relaxed text-muted-foreground">
                Нетворкінг, маркетплейс, події та спільнота для митців, кураторів, галеристів та всіх, хто повʼязаний з креативними індустріями.
              </motion.p>
              <motion.div variants={fadeUp} custom={3} className="flex flex-wrap gap-3">
                <Button size="lg" asChild>
                  <Link to="/board">
                    Дошка оголошень
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link to="/artists">Переглянути митців</Link>
                </Button>
              </motion.div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, duration: 0.7 }}
              className="relative"
            >
              <div className="overflow-hidden rounded-2xl card-shadow">
                <img src={heroArt} alt="Мистецтво" className="w-full object-cover" />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 lg:py-28">
        <div className="container">
          <div className="mx-auto mb-14 max-w-2xl text-center">
            <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-primary">Можливості платформи</p>
            <h2 className="mb-4 text-3xl font-bold sm:text-4xl">Все для творчої діяльності</h2>
            <p className="text-muted-foreground">Від пошуку партнерів до продажу мистецтва — одна платформа для всього.</p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
              >
                {f.link ? (
                  <Link to={f.link} className="group block h-full rounded-xl border border-border bg-card p-6 transition-all hover:card-shadow-hover hover:border-primary/20">
                    <FeatureContent icon={f.icon} title={f.title} desc={f.desc} />
                  </Link>
                ) : (
                  <div className="h-full rounded-xl border border-border bg-card p-6">
                    <FeatureContent icon={f.icon} title={f.title} desc={f.desc} />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Announcements Preview */}
      <section className="border-t border-border bg-card py-20 lg:py-28">
        <div className="container">
          <div className="mb-10 flex items-end justify-between">
            <div>
              <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-primary">Дошка оголошень</p>
              <h2 className="text-3xl font-bold">Можу / Хочу</h2>
            </div>
            <Button variant="outline" asChild>
              <Link to="/board">Всі оголошення <ArrowRight className="ml-1.5 h-4 w-4" /></Link>
            </Button>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            {/* Можу */}
            <div>
              <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold font-sans">
                <span className="inline-flex h-7 items-center rounded-full bg-primary/10 px-3 text-xs font-bold text-primary">МОЖУ</span>
                Пропоную
              </h3>
              <div className="space-y-3">
                {sampleAnnouncements.filter(a => a.type === "offer").map((a, i) => (
                  <AnnouncementCard key={i} {...a} />
                ))}
              </div>
            </div>
            {/* Хочу */}
            <div>
              <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold font-sans">
                <span className="inline-flex h-7 items-center rounded-full bg-accent px-3 text-xs font-bold text-accent-foreground">ХОЧУ</span>
                Шукаю
              </h3>
              <div className="space-y-3">
                {sampleAnnouncements.filter(a => a.type === "seek").map((a, i) => (
                  <AnnouncementCard key={i} {...a} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 lg:py-28">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mx-auto max-w-3xl rounded-2xl border border-border bg-card p-10 text-center card-shadow sm:p-14"
          >
            <h2 className="mb-4 text-3xl font-bold sm:text-4xl">Приєднуйся до спільноти</h2>
            <p className="mb-8 text-muted-foreground">Безкоштовна реєстрація. Почни знаходити можливості, партнерів та натхнення вже сьогодні.</p>
            <div className="flex flex-wrap justify-center gap-3">
              <Button size="lg">Створити акаунт</Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/pricing">Переглянути тарифи</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  );
}

function FeatureContent({ icon: Icon, title, desc }: { icon: React.ElementType; title: string; desc: string }) {
  return (
    <>
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <h3 className="mb-2 text-base font-semibold font-sans">{title}</h3>
      <p className="text-sm leading-relaxed text-muted-foreground">{desc}</p>
    </>
  );
}

function AnnouncementCard({ author, title, tags, city }: { author: string; title: string; tags: string[]; city: string }) {
  return (
    <div className="rounded-xl border border-border bg-background p-4 transition-all hover:card-shadow">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm font-medium">{author}</span>
        <span className="text-xs text-muted-foreground">{city}</span>
      </div>
      <p className="mb-3 text-sm">{title}</p>
      <div className="flex flex-wrap gap-1.5">
        {tags.map(t => (
          <span key={t} className="rounded-full bg-secondary px-2.5 py-0.5 text-xs text-secondary-foreground">{t}</span>
        ))}
      </div>
    </div>
  );
}
