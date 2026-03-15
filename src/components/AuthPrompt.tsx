import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Lock, UserPlus, ShoppingBag, MessageCircle, Palette, Star, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/i18n";

const benefits = [
  { icon: ShoppingBag, key: "buy_sell" as const },
  { icon: MessageCircle, key: "messaging" as const },
  { icon: Palette, key: "dashboard" as const },
  { icon: Star, key: "community" as const },
];

export default function AuthPrompt({ returnTo }: { returnTo?: string }) {
  const { t } = useLanguage();

  const loginUrl = returnTo ? `/login?returnTo=${encodeURIComponent(returnTo)}` : "/login";
  const signupUrl = returnTo ? `/signup?returnTo=${encodeURIComponent(returnTo)}` : "/signup";

  return (
    <div className="flex min-h-[calc(100vh-3.5rem-4rem)] items-center justify-center px-4 py-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg text-center"
      >
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
          <Lock className="h-8 w-8 text-primary" />
        </div>

        <h1 className="mb-3 text-3xl font-bold">{t.auth_prompt.title}</h1>
        <p className="mb-8 text-muted-foreground leading-relaxed">
          {t.auth_prompt.desc}
        </p>

        <div className="mb-8 grid grid-cols-2 gap-3 text-left">
          {benefits.map((b, i) => (
            <motion.div
              key={b.key}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.08 }}
              className="flex items-start gap-3 rounded-xl border border-border/60 bg-card p-3.5"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <b.icon className="h-4.5 w-4.5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium leading-tight">{t.auth_prompt[b.key]}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button size="lg" className="gap-2 text-sm font-semibold" asChild>
            <Link to={signupUrl}>
              <UserPlus className="h-4 w-4" />
              {t.auth_prompt.signup_cta}
            </Link>
          </Button>
          <Button variant="outline" size="lg" className="gap-2 text-sm" asChild>
            <Link to={loginUrl}>
              {t.auth_prompt.login_cta}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        <p className="mt-6 text-xs text-muted-foreground">
          {t.auth_prompt.free_note}
        </p>
      </motion.div>
    </div>
  );
}
