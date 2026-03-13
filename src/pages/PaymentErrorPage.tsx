import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { AlertTriangle, ArrowLeft, RefreshCw, MessageCircle, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/i18n";

export default function PaymentErrorPage() {
  const { t } = useLanguage();

  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center px-4 py-16">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 200, damping: 20 }}
        className="w-full max-w-md text-center"
      >
        <motion.div
          initial={{ scale: 0, rotate: -10 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 300, damping: 15 }}
          className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10"
        >
          <AlertTriangle className="h-10 w-10 text-destructive" />
        </motion.div>

        <h1 className="mb-3 text-3xl font-bold">{t.payment.error_title}</h1>
        <p className="mb-2 text-muted-foreground">{t.payment.error_desc}</p>
        <p className="mb-8 text-sm text-muted-foreground">{t.payment.error_code}: <span className="font-mono text-foreground">ERR_PAYMENT_DECLINED</span></p>

        {/* Suggestions */}
        <div className="mb-8 space-y-3 text-left">
          <div className="flex items-start gap-3 rounded-xl border border-border bg-card p-4">
            <HelpCircle className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium">{t.payment.error_tip_title}</p>
              <ul className="mt-1.5 space-y-1">
                {[t.payment.tip_1, t.payment.tip_2, t.payment.tip_3].map((tip, i) => (
                  <li key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                    <span className="text-primary mt-0.5">•</span> {tip}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Button size="lg" className="gap-2" onClick={() => window.history.back()}>
            <RefreshCw className="h-4 w-4" />
            {t.payment.try_again}
          </Button>
          <Button asChild variant="outline" size="lg" className="gap-2">
            <Link to="/cart">
              <ArrowLeft className="h-4 w-4" />
              {t.payment.back_to_cart}
            </Link>
          </Button>
        </div>

        <p className="mt-6 text-xs text-muted-foreground">
          {t.payment.need_help}{" "}
          <Link to="/help" className="text-primary hover:underline inline-flex items-center gap-1">
            <MessageCircle className="h-3 w-3" />
            {t.payment.contact_support}
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
