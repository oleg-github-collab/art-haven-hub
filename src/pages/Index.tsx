import { useRef, lazy, Suspense } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Users, Megaphone, Calendar, ShoppingBag, MessageCircle, Video, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/i18n";
import { useHeroScroll } from "@/components/hero/useHeroScroll";
import { useMousePosition } from "@/components/hero/useMousePosition";

const HeroScene = lazy(() => import("@/components/hero/HeroScene"));

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] as const },
  }),
};

export default function Index() {
  const { t } = useLanguage();
  const heroRef = useRef<HTMLElement>(null);

  const reducedMotion = useRef(
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  ).current;

  const { scrollProgress, textOpacity, textY } = useHeroScroll(heroRef);
  const { mouse, update: mouseUpdate } = useMousePosition();

  const features = [
    { icon: Megaphone, title: t.home.feat_board, desc: t.home.feat_board_desc, link: "/board" },
    { icon: Users, title: t.home.feat_networking, desc: t.home.feat_networking_desc, link: "/artists" },
    { icon: Calendar, title: t.home.feat_events, desc: t.home.feat_events_desc, link: "/events" },
    { icon: ShoppingBag, title: t.home.feat_market, desc: t.home.feat_market_desc, link: "/market" },
    { icon: MessageCircle, title: t.home.feat_messenger, desc: t.home.feat_messenger_desc },
    { icon: Video, title: t.home.feat_audio, desc: t.home.feat_audio_desc },
    { icon: Star, title: t.home.feat_promo, desc: t.home.feat_promo_desc },
  ];

  const sampleAnnouncements = [
    { type: "offer", author: "Олена М.", title: "Зроблю каліграфію для запрошень", tags: ["каліграфія", "дизайн"], city: "Берлін" },
    { type: "offer", author: "Артем К.", title: "Є вільний виставковий простір на 2 тижні", tags: ["простір", "виставка"], city: "Відень" },
    { type: "seek", author: "Ірина Т.", title: "Шукаю куратора для групової виставки", tags: ["куратор", "виставка"], city: "Варшава" },
    { type: "seek", author: "Дмитро Л.", title: "Потрібна упаковка та доставка 12 картин", tags: ["логістика", "доставка"], city: "Мадрид" },
  ];

  return (
    <>
      {/* Hero — full-width WebGL gradient background */}
      <section ref={heroRef} className="relative overflow-hidden min-h-[80vh]">
        {/* WebGL background */}
        <div className="absolute inset-0">
          {reducedMotion ? (
            <div className="w-full h-full hero-gradient" />
          ) : (
            <Suspense fallback={<div className="w-full h-full hero-gradient" />}>
              <HeroScene
                scrollProgress={scrollProgress}
                mouse={mouse}
                mouseUpdate={mouseUpdate}
              />
            </Suspense>
          )}
        </div>

        {/* Text content overlay */}
        <div className="container relative z-10 py-20 lg:py-28">
          <motion.div
            initial="hidden"
            animate="visible"
            className="max-w-xl"
            style={{ opacity: textOpacity, y: textY }}
          >
            <motion.p variants={fadeUp} custom={0} className="mb-4 text-sm font-semibold uppercase tracking-widest text-primary">
              {t.home.hero_badge}
            </motion.p>
            <motion.h1 variants={fadeUp} custom={1} className="mb-6 text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
              {t.home.hero_title_1}<span className="text-gradient">{t.home.hero_title_highlight}</span>{t.home.hero_title_2}
            </motion.h1>
            <motion.p variants={fadeUp} custom={2} className="mb-8 text-lg leading-relaxed text-muted-foreground">
              {t.home.hero_desc}
            </motion.p>
            <motion.div variants={fadeUp} custom={3} className="flex flex-wrap gap-3">
              <Button size="lg" asChild>
                <Link to="/board">
                  {t.home.hero_cta_board}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/artists">{t.home.hero_cta_artists}</Link>
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 lg:py-28">
        <div className="container">
          <div className="mx-auto mb-14 max-w-2xl text-center">
            <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-primary">{t.home.features_badge}</p>
            <h2 className="mb-4 text-3xl font-bold sm:text-4xl">{t.home.features_title}</h2>
            <p className="text-muted-foreground">{t.home.features_desc}</p>
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
              <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-primary">{t.home.board_badge}</p>
              <h2 className="text-3xl font-bold">{t.home.board_title}</h2>
            </div>
            <Button variant="outline" asChild>
              <Link to="/board">{t.home.board_all} <ArrowRight className="ml-1.5 h-4 w-4" /></Link>
            </Button>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold font-sans">
                <span className="inline-flex h-7 items-center rounded-full bg-primary/10 px-3 text-xs font-bold text-primary">{t.home.can_label}</span>
                {t.home.can_title}
              </h3>
              <div className="space-y-3">
                {sampleAnnouncements.filter(a => a.type === "offer").map((a, i) => (
                  <AnnouncementCard key={i} {...a} />
                ))}
              </div>
            </div>
            <div>
              <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold font-sans">
                <span className="inline-flex h-7 items-center rounded-full bg-accent px-3 text-xs font-bold text-accent-foreground">{t.home.want_label}</span>
                {t.home.want_title}
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
            <h2 className="mb-4 text-3xl font-bold sm:text-4xl">{t.home.cta_title}</h2>
            <p className="mb-8 text-muted-foreground">{t.home.cta_desc}</p>
            <div className="flex flex-wrap justify-center gap-3">
              <Button size="lg">{t.home.cta_register}</Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/pricing">{t.home.cta_pricing}</Link>
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
