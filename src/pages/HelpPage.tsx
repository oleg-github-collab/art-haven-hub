import { motion } from "framer-motion";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Mail, MessageCircle, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const faqItems = [
  { q: "Як зареєструватися на платформі?", a: "Натисніть «Увійти» у верхньому меню, оберіть «Створити обліковий запис» та заповніть форму. Ви можете зареєструватись через email або Google-акаунт." },
  { q: "Яка комісія за продаж?", a: "Комісія залежить від загальної суми продажів: від 15% (до €1000) до 5% (від €5000). Детальну шкалу дивіться на сторінці Тарифи." },
  { q: "Як вивести зароблені кошти?", a: "Виплати здійснюються через Stripe на ваш банківський рахунок протягом 7 робочих днів після підтвердження отримання покупцем." },
  { q: "Чи можу я продавати цифрові роботи?", a: "Так! Ви можете продавати як фізичні твори, так і цифрові файли (принти, ілюстрації, фотографії тощо)." },
  { q: "Як працює ШІ-переклад?", a: "У панелі митця оберіть роботи та натисніть «ШІ Переклад». Система автоматично перекладе описи на обрані мови (EN, DE, ES, FR)." },
  { q: "Як просунути оголошення в Топ?", a: "У панелі митця оберіть роботу та натисніть «Просувати». Оберіть тривалість — від 1 до 30 днів. Оголошення з'явиться у верхній частині каталогу." },
  { q: "Як повернути товар?", a: "Фізичні товари можна повернути протягом 14 днів. Цифрові товари не підлягають поверненню після завантаження. Детальніше — на сторінці «Повернення»." },
  { q: "Як зв'язатися з підтримкою?", a: "Напишіть нам на support@mystetstvo.art або скористайтесь месенджером на платформі." },
];

export default function HelpPage() {
  return (
    <div className="container py-12 max-w-3xl">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold font-serif mb-2">Центр допомоги</h1>
        <p className="text-sm text-muted-foreground mb-8">Знайдіть відповіді на найпоширеніші запитання</p>

        <Accordion type="single" collapsible className="mb-10">
          {faqItems.map((item, i) => (
            <AccordionItem key={i} value={`faq-${i}`}>
              <AccordionTrigger className="text-left text-sm">{item.q}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">{item.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        <h2 className="text-xl font-bold font-serif mb-4">Не знайшли відповідь?</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-border bg-card p-5 text-center card-shadow">
            <Mail className="h-8 w-8 text-primary mx-auto mb-2" />
            <h3 className="font-semibold text-sm mb-1">Email</h3>
            <p className="text-xs text-muted-foreground">support@mystetstvo.art</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-5 text-center card-shadow">
            <MessageCircle className="h-8 w-8 text-primary mx-auto mb-2" />
            <h3 className="font-semibold text-sm mb-1">Месенджер</h3>
            <Button variant="link" size="sm" asChild className="text-xs p-0 h-auto">
              <Link to="/messenger">Написати в чат</Link>
            </Button>
          </div>
          <div className="rounded-xl border border-border bg-card p-5 text-center card-shadow">
            <FileText className="h-8 w-8 text-primary mx-auto mb-2" />
            <h3 className="font-semibold text-sm mb-1">Документація</h3>
            <Button variant="link" size="sm" asChild className="text-xs p-0 h-auto">
              <Link to="/terms">Умови та політики</Link>
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
