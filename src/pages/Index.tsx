import { useRef, lazy, Suspense } from "react";
import { Link } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, Users, Megaphone, Calendar, ShoppingBag, MessageCircle, Video, Star, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/i18n";
import { useHeroScroll } from "@/components/hero/useHeroScroll";
import { useMousePosition } from "@/components/hero/useMousePosition";

const HeroScene = lazy(() => import("@/components/hero/HeroScene"));

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.12, duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] as const },
  }),
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};

const scaleReveal = {
  hidden: { opacity: 0, scale: 0.92, y: 30 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
};

export default function Index() {
  const { t } = useLanguage();
  const heroRef = useRef<HTMLElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);

  const reducedMotion = useRef(
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  ).current;

  const { scrollProgress, textOpacity, textY } = useHeroScroll(heroRef);
  const { mouse, update: mouseUpdate } = useMousePosition();

  // Section parallax
  const { scrollYProgress: featuresProgress } = useScroll({ target: featuresRef, offset: ["start end", "end start"] });
  const featuresY = useTransform(featuresProgress, [0, 1], [60, -30]);

  const { scrollYProgress: boardProgress } = useScroll({ target: boardRef, offset: ["start end", "end start"] });
  const boardY = useTransform(boardProgress, [0, 1], [40, -20]);

  const { scrollYProgress: ctaProgress } = useScroll({ target: ctaRef, offset: ["start end", "center center"] });
  const ctaScale = useTransform(ctaProgress, [0, 1], [0.92, 1]);
  const ctaOpacity = useTransform(ctaProgress, [0, 0.4], [0, 1]);

  const features = [
    { icon: Megaphone, title: t.home.feat_board, desc: t.home.feat_board_desc, link: "/board" },
    { icon: Users, title: t.home.feat_networking, desc: t.home.feat_networking_desc, link: "/artists" },
    { icon: Calendar, title: t.home.feat_events, desc: t.home.feat_events_desc, link: "/events" },
    { icon: ShoppingBag, title: t.home.feat_market, desc: t.home.feat_market_desc, link: "/market" },
    { icon: MessageCircle, title: t.home.feat_messenger, desc: t.home.feat_messenger_desc, link: "/messenger" },
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
      <section ref={heroRef} className="relative overflow-hidden min-h-[85vh] lg:min-h-[90vh]">
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

        {/* Floating particles overlay */}
        {!reducedMotion && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute rounded-full bg-primary/5"
                style={{
                  width: 80 + i * 40,
                  height: 80 + i * 40,
                  left: `${15 + i * 14}%`,
                  top: `${20 + (i % 3) * 25}%`,
                }}
                animate={{
                  y: [0, -20 - i * 5, 0],
                  x: [0, 10 + i * 3, 0],
                  scale: [1, 1.05, 1],
                }}
                transition={{
                  duration: 6 + i * 1.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: i * 0.8,
                }}
              />
            ))}
          </div>
        )}

        {/* Text content overlay */}
        <div className="container relative z-10 py-24 lg:py-32">
          <motion.div
            initial="hidden"
            animate="visible"
            className="max-w-xl"
            style={{ opacity: textOpacity, y: textY }}
          >
            <motion.div variants={fadeUp} custom={0} className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-semibold text-primary backdrop-blur-sm">
              <Sparkles className="h-3.5 w-3.5" />
              {t.home.hero_badge}
            </motion.div>
            <motion.h1 variants={fadeUp} custom={1} className="mb-6 text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl xl:text-7xl">
              {t.home.hero_title_1}<span className="text-gradient">{t.home.hero_title_highlight}</span>{t.home.hero_title_2}
            </motion.h1>
            <motion.p variants={fadeUp} custom={2} className="mb-8 text-lg leading-relaxed text-muted-foreground sm:text-xl">
              {t.home.hero_desc}
            </motion.p>
            <motion.div variants={fadeUp} custom={3} className="flex flex-wrap gap-3">
              <Button size="lg" className="group" asChild>
                <Link to="/board">
                  {t.home.hero_cta_board}
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="backdrop-blur-sm bg-background/50" asChild>
                <Link to="/artists">{t.home.hero_cta_artists}</Link>
              </Button>
            </motion.div>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        {!reducedMotion && (
          <motion.div
            className="absolute bottom-8 left-1/2 -translate-x-1/2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
          >
            <motion.div
              className="flex h-10 w-6 items-start justify-center rounded-full border-2 border-foreground/20 p-1"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <motion.div
                className="h-2 w-1 rounded-full bg-foreground/40"
                animate={{ y: [0, 12, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              />
            </motion.div>
          </motion.div>
        )}
      </section>

      {/* Features */}
      <section ref={featuresRef} className="py-20 lg:py-28 overflow-hidden">
        <motion.div className="container" style={{ y: reducedMotion ? 0 : featuresY }}>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="mx-auto mb-14 max-w-2xl text-center"
          >
            <motion.p variants={scaleReveal} className="mb-3 text-sm font-semibold uppercase tracking-widest text-primary">{t.home.features_badge}</motion.p>
            <motion.h2 variants={scaleReveal} className="mb-4 text-3xl font-bold sm:text-4xl lg:text-5xl">{t.home.features_title}</motion.h2>
            <motion.p variants={scaleReveal} className="text-muted-foreground text-lg">{t.home.features_desc}</motion.p>
          </motion.div>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            variants={staggerContainer}
            className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          >
            {features.map((f) => (
              <motion.div key={f.title} variants={scaleReveal}>
                {f.link ? (
                  <Link to={f.link} className="group block h-full rounded-2xl border border-border bg-card p-6 transition-all duration-300 hover:card-shadow-hover hover:border-primary/20 hover:-translate-y-1">
                    <FeatureContent icon={f.icon} title={f.title} desc={f.desc} />
                  </Link>
                ) : (
                  <div className="h-full rounded-2xl border border-border bg-card p-6 transition-all duration-300 hover:card-shadow">
                    <FeatureContent icon={f.icon} title={f.title} desc={f.desc} />
                  </div>
                )}
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* Announcements Preview */}
      <section ref={boardRef} className="border-t border-border bg-card py-20 lg:py-28 overflow-hidden">
        <motion.div className="container" style={{ y: reducedMotion ? 0 : boardY }}>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="mb-10 flex items-end justify-between"
          >
            <div>
              <motion.p variants={scaleReveal} className="mb-2 text-sm font-semibold uppercase tracking-widest text-primary">{t.home.board_badge}</motion.p>
              <motion.h2 variants={scaleReveal} className="text-3xl font-bold lg:text-4xl">{t.home.board_title}</motion.h2>
            </div>
            <motion.div variants={scaleReveal}>
              <Button variant="outline" className="group" asChild>
                <Link to="/board">{t.home.board_all} <ArrowRight className="ml-1.5 h-4 w-4 transition-transform group-hover:translate-x-1" /></Link>
              </Button>
            </motion.div>
          </motion.div>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid gap-6 md:grid-cols-2"
          >
            <motion.div variants={scaleReveal}>
              <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold font-sans">
                <span className="inline-flex h-7 items-center rounded-full bg-primary/10 px-3 text-xs font-bold text-primary">{t.home.can_label}</span>
                {t.home.can_title}
              </h3>
              <div className="space-y-3">
                {sampleAnnouncements.filter(a => a.type === "offer").map((a, i) => (
                  <motion.div key={i} initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                    <AnnouncementCard {...a} />
                  </motion.div>
                ))}
              </div>
            </motion.div>
            <motion.div variants={scaleReveal}>
              <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold font-sans">
                <span className="inline-flex h-7 items-center rounded-full bg-accent px-3 text-xs font-bold text-accent-foreground">{t.home.want_label}</span>
                {t.home.want_title}
              </h3>
              <div className="space-y-3">
                {sampleAnnouncements.filter(a => a.type === "seek").map((a, i) => (
                  <motion.div key={i} initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}>
                    <AnnouncementCard {...a} />
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      </section>

      {/* CTA */}
      <section className="py-20 lg:py-28">
        <div className="container" ref={ctaRef}>
          <motion.div
            style={{ scale: reducedMotion ? 1 : ctaScale, opacity: reducedMotion ? 1 : ctaOpacity }}
            className="mx-auto max-w-3xl rounded-3xl border border-border bg-card p-10 text-center card-shadow sm:p-14 relative overflow-hidden"
          >
            {/* Decorative glow */}
            <div className="absolute -top-20 -right-20 h-40 w-40 rounded-full bg-primary/5 blur-3xl" />
            <div className="absolute -bottom-20 -left-20 h-40 w-40 rounded-full bg-primary/5 blur-3xl" />
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer} className="relative">
              <motion.h2 variants={scaleReveal} className="mb-4 text-3xl font-bold sm:text-4xl lg:text-5xl">{t.home.cta_title}</motion.h2>
              <motion.p variants={scaleReveal} className="mb-8 text-muted-foreground text-lg">{t.home.cta_desc}</motion.p>
              <motion.div variants={scaleReveal} className="flex flex-wrap justify-center gap-3">
                <Button size="lg" className="group">
                  {t.home.cta_register}
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link to="/pricing">{t.home.cta_pricing}</Link>
                </Button>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </>
  );
}

function FeatureContent({ icon: Icon, title, desc }: { icon: React.ElementType; title: string; desc: string }) {
  return (
    <>
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 transition-colors group-hover:bg-primary/15">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <h3 className="mb-2 text-base font-semibold font-sans">{title}</h3>
      <p className="text-sm leading-relaxed text-muted-foreground">{desc}</p>
    </>
  );
}

function AnnouncementCard({ author, title, tags, city }: { author: string; title: string; tags: string[]; city: string }) {
  return (
    <div className="rounded-xl border border-border bg-background p-4 transition-all duration-200 hover:card-shadow hover:-translate-y-0.5">
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
