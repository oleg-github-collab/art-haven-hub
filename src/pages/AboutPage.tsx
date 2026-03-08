import { motion } from "framer-motion";
import { Palette, Users, Globe, ShieldCheck, Zap, Heart } from "lucide-react";
import { useLanguage } from "@/i18n";

export default function AboutPage() {
  const { t } = useLanguage();

  const values = [
    { icon: Palette, title: t.about.value_art, desc: t.about.value_art_desc },
    { icon: Users, title: t.about.value_community, desc: t.about.value_community_desc },
    { icon: Globe, title: t.about.value_borders, desc: t.about.value_borders_desc },
    { icon: ShieldCheck, title: t.about.value_transparency, desc: t.about.value_transparency_desc },
    { icon: Zap, title: t.about.value_tech, desc: t.about.value_tech_desc },
    { icon: Heart, title: t.about.value_support, desc: t.about.value_support_desc },
  ];

  return (
    <div className="container py-12 max-w-4xl">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
        <h1 className="text-4xl font-bold font-serif mb-4">{t.about.title}</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">{t.about.desc}</p>
      </motion.div>

      <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="mb-12">
        <h2 className="text-2xl font-bold font-serif mb-2 text-center">{t.about.mission_title}</h2>
        <p className="text-muted-foreground text-center max-w-xl mx-auto">{t.about.mission_desc}</p>
      </motion.section>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 mb-12">
        {values.map((v, i) => (
          <motion.div key={v.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 * i }}
            className="rounded-xl border border-border bg-card p-6 card-shadow"
          >
            <v.icon className="h-8 w-8 text-primary mb-3" />
            <h3 className="font-semibold font-serif text-lg mb-1">{v.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{v.desc}</p>
          </motion.div>
        ))}
      </div>

      <section className="rounded-xl border border-border bg-accent/30 p-8 text-center">
        <h2 className="text-2xl font-bold font-serif mb-2">{t.about.how_title}</h2>
        <div className="grid gap-6 sm:grid-cols-3 mt-6 text-sm">
          <div>
            <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">1</div>
            <h4 className="font-semibold mb-1">{t.about.step1_title}</h4>
            <p className="text-muted-foreground">{t.about.step1_desc}</p>
          </div>
          <div>
            <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">2</div>
            <h4 className="font-semibold mb-1">{t.about.step2_title}</h4>
            <p className="text-muted-foreground">{t.about.step2_desc}</p>
          </div>
          <div>
            <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">3</div>
            <h4 className="font-semibold mb-1">{t.about.step3_title}</h4>
            <p className="text-muted-foreground">{t.about.step3_desc}</p>
          </div>
        </div>
      </section>
    </div>
  );
}
