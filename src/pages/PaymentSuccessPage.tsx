import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle, ArrowRight, Package, Mail, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/i18n";

export default function PaymentSuccessPage() {
  const { t } = useLanguage();

  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center px-4 py-16">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
        className="w-full max-w-md text-center"
      >
        {/* Animated check */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 300, damping: 15 }}
          className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.4, type: "spring" }}
          >
            <CheckCircle className="h-10 w-10 text-primary" />
          </motion.div>
        </motion.div>

        {/* Confetti dots */}
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute h-2 w-2 rounded-full bg-primary"
            initial={{ opacity: 0, scale: 0 }}
            animate={{
              opacity: [0, 1, 0],
              scale: [0, 1.5, 0],
              x: Math.cos(i * 60 * Math.PI / 180) * 80,
              y: Math.sin(i * 60 * Math.PI / 180) * 80 - 40,
            }}
            transition={{ delay: 0.5 + i * 0.08, duration: 0.8 }}
            style={{ left: "50%", top: "30%" }}
          />
        ))}

        <h1 className="mb-3 text-3xl font-bold">{t.payment.success_title}</h1>
        <p className="mb-2 text-muted-foreground">{t.payment.success_desc}</p>
        <p className="mb-8 text-sm text-muted-foreground">
          {t.payment.order_number}: <span className="font-mono font-semibold text-foreground">#MST-{Date.now().toString(36).toUpperCase()}</span>
        </p>

        {/* Info cards */}
        <div className="mb-8 space-y-3 text-left">
          <div className="flex items-start gap-3 rounded-xl border border-border bg-card p-4">
            <Mail className="h-5 w-5 text-primary mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium">{t.payment.email_sent}</p>
              <p className="text-xs text-muted-foreground">{t.payment.email_sent_desc}</p>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-xl border border-border bg-card p-4">
            <Package className="h-5 w-5 text-primary mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium">{t.payment.shipping_info}</p>
              <p className="text-xs text-muted-foreground">{t.payment.shipping_info_desc}</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button asChild size="lg" className="gap-2">
            <Link to="/market">
              {t.payment.continue_shopping}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="gap-2">
            <Link to="/">
              <Home className="h-4 w-4" />
              {t.payment.go_home}
            </Link>
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
