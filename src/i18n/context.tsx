import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import type { Language, Translations } from "./types";
import uk from "./translations/uk";
import en from "./translations/en";
import de from "./translations/de";
import es from "./translations/es";
import fr from "./translations/fr";

const translationsMap: Record<Language, Translations> = { uk, en, de, es, fr };

const LANG_KEY = "app_language";

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: Translations;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>(() => {
    const stored = localStorage.getItem(LANG_KEY);
    if (stored && stored in translationsMap) return stored as Language;
    return "uk";
  });

  const setLang = useCallback((newLang: Language) => {
    setLangState(newLang);
    localStorage.setItem(LANG_KEY, newLang);
    document.documentElement.lang = newLang;
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  return (
    <LanguageContext.Provider value={{ lang, setLang, t: translationsMap[lang] }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}
