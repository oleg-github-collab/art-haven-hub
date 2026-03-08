import { useState } from "react";
import { motion } from "framer-motion";
import { Check, Crown, Zap, Star, TrendingUp, Shield, ArrowRight, Percent, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";

const plans = [
  {
    id: "free",
    name: "Старт",
    icon: Zap,
    price: { monthly: 0, yearly: 0 },
    description: "Для початку роботи на платформі",
    features: [
      "До 5 оголошень",
      "Базовий профіль",
      "Доступ до маркету",
      "Месенджер",
      "Стрічка та Дошка",
    ],
    limitations: [
      "Без топ-оголошень",
      "Без аналітики",
      "Комісія за продажі",
    ],
    cta: "Поточний план",
    highlighted: false,
  },
  {
    id: "pro",
    name: "Профі",
    icon: Star,
    price: { monthly: 12, yearly: 99 },
    description: "Для активних продавців",
    features: [
      "До 30 оголошень",
      "Розширений профіль",
      "3 топ-оголошення / місяць",
      "Базова аналітика",
      "Пріоритетна підтримка",
      "Значок «Профі» на профілі",
      "Зменшена комісія -1%",
    ],
    limitations: [],
    cta: "Обрати Профі",
    highlighted: true,
    badge: "Популярний",
  },
  {
    id: "gallery",
    name: "Галерея",
    icon: Crown,
    price: { monthly: 39, yearly: 349 },
    description: "Для галерей та професіоналів",
    features: [
      "Необмежені оголошення",
      "Преміум профіль",
      "10 топ-оголошень / місяць",
      "Розширена аналітика",
      "Пріоритетна підтримка 24/7",
      "Значок «Галерея»",
      "Зменшена комісія -3%",
      "API доступ",
      "Мультикористувачі",
    ],
    limitations: [],
    cta: "Обрати Галерею",
    highlighted: false,
  },
];

const commissionTiers = [
  { max: 1000, rate: 15, label: "до €1 000" },
  { max: 1500, rate: 13.5, label: "до €1 500" },
  { max: 2000, rate: 11, label: "до €2 000" },
  { max: 2500, rate: 9, label: "до €2 500" },
  { max: 5000, rate: 7, label: "до €5 000" },
  { max: Infinity, rate: 5, label: "від €5 000" },
];

const topPricing = [
  { duration: "1 день", price: 2, discount: null },
  { duration: "3 дні", price: 5, discount: "−17%" },
  { duration: "7 днів", price: 10, discount: "−29%" },
  { duration: "30 днів", price: 30, discount: "−50%" },
];

export default function PricingPage() {
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly");

  const handleSubscribe = (planId: string) => {
    toast.info("Stripe буде підключено найближчим часом!");
  };

  const handleBoost = (duration: string) => {
    toast.info(`Топ-оголошення на ${duration} — Stripe буде підключено!`);
  };

  return (
    <div className="py-10 lg:py-16">
      <div className="container max-w-6xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 text-center"
        >
          <Badge variant="secondary" className="mb-4 text-xs font-sans">
            <TrendingUp className="mr-1 h-3 w-3" /> Плани та тарифи
          </Badge>
          <h1 className="mb-3 text-4xl font-bold lg:text-5xl">
            Обери свій <span className="text-gradient">план</span>
          </h1>
          <p className="mx-auto max-w-xl text-muted-foreground">
            Від безкоштовного старту до професійних інструментів для галерей.
            Усі оплати через Stripe.
          </p>

          {/* Billing toggle */}
          <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-border bg-card p-1">
            <button
              onClick={() => setBilling("monthly")}
              className={`rounded-full px-4 py-2 text-sm font-medium font-sans transition-colors ${
                billing === "monthly"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Щомісячно
            </button>
            <button
              onClick={() => setBilling("yearly")}
              className={`rounded-full px-4 py-2 text-sm font-medium font-sans transition-colors ${
                billing === "yearly"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Щорічно
              <span className="ml-1.5 text-xs opacity-80">−30%</span>
            </button>
          </div>
        </motion.div>

        {/* Plans */}
        <div className="mb-20 grid gap-6 md:grid-cols-3">
          {plans.map((plan, i) => {
            const Icon = plan.icon;
            const price = billing === "monthly" ? plan.price.monthly : plan.price.yearly;
            const perMonth = billing === "yearly" && plan.price.yearly > 0
              ? Math.round(plan.price.yearly / 12)
              : plan.price.monthly;

            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className={`relative flex flex-col rounded-2xl border p-6 backdrop-blur-sm transition-shadow hover:shadow-lg ${
                  plan.highlighted
                    ? "border-primary bg-primary/[0.03] shadow-md"
                    : "border-border bg-card/80"
                }`}
                style={{ boxShadow: plan.highlighted ? undefined : "var(--card-shadow)" }}
              >
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground font-sans shadow-md">
                      {plan.badge}
                    </Badge>
                  </div>
                )}

                <div className="mb-4 flex items-center gap-3">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                      plan.highlighted ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold font-serif">{plan.name}</h3>
                    <p className="text-xs text-muted-foreground">{plan.description}</p>
                  </div>
                </div>

                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold font-sans">
                      {price === 0 ? "Безкоштовно" : `€${price}`}
                    </span>
                    {price > 0 && (
                      <span className="text-sm text-muted-foreground font-sans">
                        /{billing === "monthly" ? "міс" : "рік"}
                      </span>
                    )}
                  </div>
                  {billing === "yearly" && perMonth > 0 && (
                    <p className="mt-1 text-xs text-muted-foreground font-sans">
                      ≈ €{perMonth}/міс
                    </p>
                  )}
                </div>

                <ul className="mb-6 flex-1 space-y-2.5">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span>{f}</span>
                    </li>
                  ))}
                  {plan.limitations.map((l) => (
                    <li key={l} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <span className="mt-0.5 h-4 w-4 shrink-0 text-center">—</span>
                      <span>{l}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  className="w-full font-sans"
                  variant={plan.highlighted ? "default" : "outline"}
                  size="lg"
                  disabled={plan.id === "free"}
                  onClick={() => handleSubscribe(plan.id)}
                >
                  {plan.cta}
                  {plan.id !== "free" && <ArrowRight className="ml-1 h-4 w-4" />}
                </Button>
              </motion.div>
            );
          })}
        </div>

        {/* Commission section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-20"
        >
          <div className="mb-8 text-center">
            <Badge variant="secondary" className="mb-4 text-xs font-sans">
              <Percent className="mr-1 h-3 w-3" /> Комісія платформи
            </Badge>
            <h2 className="mb-2 text-3xl font-bold">Прозора система комісій</h2>
            <p className="mx-auto max-w-lg text-muted-foreground">
              Чим більше продаєте — тим менша комісія. Комісія розраховується
              від загальної суми продажів на платформі.
            </p>
          </div>

          <div className="mx-auto max-w-3xl">
            <div className="overflow-hidden rounded-2xl border border-border bg-card/80 backdrop-blur-sm" style={{ boxShadow: "var(--card-shadow)" }}>
              {/* Visual progress bar */}
              <div className="p-6">
                <div className="relative mb-6 h-3 overflow-hidden rounded-full bg-secondary">
                  <div
                    className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-primary to-primary/60"
                    style={{ width: "35%" }}
                  />
                </div>

                <div className="grid gap-0 divide-y divide-border">
                  {commissionTiers.map((tier, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between py-4 first:pt-0 last:pb-0"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold font-sans ${
                            i <= 1
                              ? "bg-destructive/10 text-destructive"
                              : i <= 3
                              ? "bg-primary/10 text-primary"
                              : "bg-green-500/10 text-green-600"
                          }`}
                        >
                          {i + 1}
                        </div>
                        <div>
                          <p className="text-sm font-medium font-sans">{tier.label}</p>
                          <p className="text-xs text-muted-foreground">
                            загальних продажів
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-2xl font-bold font-sans">{tier.rate}%</span>
                        <p className="text-xs text-muted-foreground">комісія</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              <div className="flex items-center gap-2 bg-secondary/30 px-6 py-3.5">
                <Info className="h-4 w-4 text-muted-foreground shrink-0" />
                <p className="text-xs text-muted-foreground">
                  Підписники «Профі» отримують додаткове зниження −1%, «Галерея» — −3% від поточної ставки.
                </p>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Top listings */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <div className="mb-8 text-center">
            <Badge variant="secondary" className="mb-4 text-xs font-sans">
              <TrendingUp className="mr-1 h-3 w-3" /> Просування
            </Badge>
            <h2 className="mb-2 text-3xl font-bold">Топ-оголошення</h2>
            <p className="mx-auto max-w-lg text-muted-foreground">
              Підніміть ваше оголошення на першу позицію у маркеті.
              Збільште перегляди до 5× та привертайте більше покупців.
            </p>
          </div>

          <div className="mx-auto grid max-w-3xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {topPricing.map((opt, i) => (
              <motion.div
                key={opt.duration}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="relative flex flex-col items-center rounded-2xl border border-border bg-card/80 p-5 text-center backdrop-blur-sm transition-shadow hover:shadow-md"
                style={{ boxShadow: "var(--card-shadow)" }}
              >
                {opt.discount && (
                  <Badge className="absolute -top-2.5 bg-primary text-primary-foreground font-sans text-[10px]">
                    {opt.discount}
                  </Badge>
                )}
                <p className="mb-1 text-sm font-medium text-muted-foreground">
                  {opt.duration}
                </p>
                <p className="mb-4 text-3xl font-bold font-sans">€{opt.price}</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full font-sans"
                  onClick={() => handleBoost(opt.duration)}
                >
                  Підняти
                </Button>
              </motion.div>
            ))}
          </div>

          <div className="mx-auto mt-6 max-w-xl rounded-xl border border-dashed border-border bg-secondary/30 p-4 text-center">
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Shield className="h-4 w-4" />
              Усі платежі захищені через Stripe
            </div>
          </div>
        </motion.section>
      </div>
    </div>
  );
}
