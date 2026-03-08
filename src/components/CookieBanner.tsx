import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Cookie, X, Settings, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Link } from "react-router-dom";
import { useLanguage } from "@/i18n";

const COOKIE_CONSENT_KEY = "cookie_consent";

interface CookiePreferences {
  necessary: boolean;
  functional: boolean;
  analytics: boolean;
  marketing: boolean;
}

export default function CookieBanner() {
  const { t } = useLanguage();
  const [isVisible, setIsVisible] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    necessary: true,
    functional: true,
    analytics: false,
    marketing: false,
  });

  useEffect(() => {
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!consent) {
      const timer = setTimeout(() => setIsVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const saveConsent = (prefs: CookiePreferences) => {
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(prefs));
    setIsVisible(false);
  };

  const acceptAll = () => saveConsent({ necessary: true, functional: true, analytics: true, marketing: true });
  const acceptSelected = () => saveConsent(preferences);
  const rejectOptional = () => saveConsent({ necessary: true, functional: false, analytics: false, marketing: false });

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-0 left-0 right-0 z-50 p-4 md:p-6"
      >
        <div className="container max-w-4xl">
          <div className="relative rounded-2xl border border-border bg-card/95 backdrop-blur-xl shadow-2xl overflow-hidden">
            <div className="p-5 md:p-6">
              <div className="flex items-start gap-4">
                <div className="hidden sm:flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                  <Cookie className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold font-serif mb-1">{t.cookie.title}</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {t.cookie.description}{" "}
                    <Link to="/cookies" className="text-primary hover:underline">{t.cookie.learn_more}</Link>
                  </p>

                  <AnimatePresence>
                    {showSettings && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden mb-4"
                      >
                        <div className="space-y-3 p-4 rounded-xl bg-accent/50 border border-border">
                          <CookieOption label={t.cookie.necessary} description={t.cookie.necessary_desc} checked={preferences.necessary} disabled />
                          <CookieOption label={t.cookie.functional} description={t.cookie.functional_desc} checked={preferences.functional} onChange={(v) => setPreferences({ ...preferences, functional: v })} />
                          <CookieOption label={t.cookie.analytics} description={t.cookie.analytics_desc} checked={preferences.analytics} onChange={(v) => setPreferences({ ...preferences, analytics: v })} />
                          <CookieOption label={t.cookie.marketing} description={t.cookie.marketing_desc} checked={preferences.marketing} onChange={(v) => setPreferences({ ...preferences, marketing: v })} />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="flex flex-wrap gap-2">
                    <Button onClick={acceptAll} size="sm" className="gap-1.5">
                      <Check className="h-4 w-4" />
                      {t.cookie.accept_all}
                    </Button>
                    {showSettings ? (
                      <Button onClick={acceptSelected} variant="secondary" size="sm">{t.cookie.save_selection}</Button>
                    ) : (
                      <Button onClick={() => setShowSettings(true)} variant="outline" size="sm" className="gap-1.5">
                        <Settings className="h-4 w-4" />
                        {t.cookie.customize}
                      </Button>
                    )}
                    <Button onClick={rejectOptional} variant="ghost" size="sm">{t.cookie.only_necessary}</Button>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={rejectOptional}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

function CookieOption({ label, description, checked, onChange, disabled }: {
  label: string; description: string; checked: boolean; onChange?: (value: boolean) => void; disabled?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} disabled={disabled} />
    </div>
  );
}
