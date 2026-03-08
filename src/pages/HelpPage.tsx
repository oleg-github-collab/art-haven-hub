import { motion } from "framer-motion";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Mail, MessageCircle, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useLanguage } from "@/i18n";

const faqItemsByLang: Record<string, { q: string; a: string }[]> = {
  uk: [
    { q: "Як зареєструватися на платформі?", a: "Натисніть «Увійти» у верхньому меню, оберіть «Створити обліковий запис» та заповніть форму." },
    { q: "Яка комісія за продаж?", a: "Комісія залежить від загальної суми продажів: від 15% (до €1000) до 5% (від €5000)." },
    { q: "Як вивести зароблені кошти?", a: "Виплати здійснюються через Stripe на ваш банківський рахунок протягом 7 робочих днів." },
    { q: "Чи можу я продавати цифрові роботи?", a: "Так! Ви можете продавати як фізичні твори, так і цифрові файли." },
    { q: "Як працює ШІ-переклад?", a: "У панелі митця оберіть роботи та натисніть «ШІ Переклад». Система перекладе описи автоматично." },
    { q: "Як просунути оголошення в Топ?", a: "У панелі митця оберіть роботу та натисніть «Просувати». Оберіть тривалість — від 1 до 30 днів." },
    { q: "Як повернути товар?", a: "Фізичні товари можна повернути протягом 14 днів. Цифрові товари не підлягають поверненню після завантаження." },
    { q: "Як зв'язатися з підтримкою?", a: "Напишіть нам на support@mystetstvo.art або скористайтесь месенджером на платформі." },
  ],
  en: [
    { q: "How do I register on the platform?", a: "Click 'Sign In' in the top menu, select 'Create Account' and fill in the form." },
    { q: "What is the sales commission?", a: "Commission depends on total sales: from 15% (up to €1000) to 5% (from €5000)." },
    { q: "How do I withdraw earnings?", a: "Payouts are made via Stripe to your bank account within 7 business days." },
    { q: "Can I sell digital works?", a: "Yes! You can sell both physical and digital works." },
    { q: "How does AI translation work?", a: "In the artist dashboard, select works and click 'AI Translate'. The system will translate descriptions automatically." },
    { q: "How to promote a listing to Top?", a: "In the artist dashboard, select a work and click 'Promote'. Choose duration from 1 to 30 days." },
    { q: "How to return an item?", a: "Physical items can be returned within 14 days. Digital items are non-refundable after download." },
    { q: "How to contact support?", a: "Email us at support@mystetstvo.art or use the platform messenger." },
  ],
  de: [
    { q: "Wie registriere ich mich auf der Plattform?", a: "Klicken Sie oben im Menü auf 'Anmelden', wählen Sie 'Konto erstellen' und füllen Sie das Formular aus." },
    { q: "Wie hoch ist die Verkaufsprovision?", a: "Die Provision hängt vom Gesamtumsatz ab: von 15% (bis €1000) bis 5% (ab €5000)." },
    { q: "Wie ziehe ich meine Einnahmen ab?", a: "Auszahlungen erfolgen über Stripe auf Ihr Bankkonto innerhalb von 7 Werktagen." },
    { q: "Kann ich digitale Werke verkaufen?", a: "Ja! Sie können sowohl physische als auch digitale Werke verkaufen." },
    { q: "Wie funktioniert die KI-Übersetzung?", a: "Wählen Sie im Künstler-Dashboard Werke aus und klicken Sie auf 'KI-Übersetzen'." },
    { q: "Wie bewerbe ich eine Anzeige als Top?", a: "Im Künstler-Dashboard wählen Sie ein Werk und klicken auf 'Bewerben'. Wählen Sie eine Dauer von 1 bis 30 Tagen." },
    { q: "Wie kann ich einen Artikel zurückgeben?", a: "Physische Artikel können innerhalb von 14 Tagen zurückgegeben werden. Digitale Artikel sind nach dem Download nicht erstattungsfähig." },
    { q: "Wie kontaktiere ich den Support?", a: "Schreiben Sie an support@mystetstvo.art oder nutzen Sie den Plattform-Messenger." },
  ],
  es: [
    { q: "¿Cómo me registro en la plataforma?", a: "Haz clic en 'Iniciar sesión' en el menú superior, selecciona 'Crear cuenta' y rellena el formulario." },
    { q: "¿Cuál es la comisión por venta?", a: "La comisión depende de las ventas totales: del 15% (hasta €1000) al 5% (desde €5000)." },
    { q: "¿Cómo retiro mis ganancias?", a: "Los pagos se realizan a través de Stripe a tu cuenta bancaria en un plazo de 7 días laborables." },
    { q: "¿Puedo vender obras digitales?", a: "¡Sí! Puedes vender tanto obras físicas como digitales." },
    { q: "¿Cómo funciona la traducción IA?", a: "En el panel del artista, selecciona las obras y haz clic en 'Traducción IA'." },
    { q: "¿Cómo promocionar un anuncio?", a: "En el panel del artista, selecciona una obra y haz clic en 'Promocionar'. Elige la duración de 1 a 30 días." },
    { q: "¿Cómo devolver un artículo?", a: "Los artículos físicos se pueden devolver en 14 días. Los digitales no son reembolsables después de la descarga." },
    { q: "¿Cómo contactar con soporte?", a: "Escríbenos a support@mystetstvo.art o usa el mensajero de la plataforma." },
  ],
  fr: [
    { q: "Comment s'inscrire sur la plateforme ?", a: "Cliquez sur 'Se connecter' dans le menu supérieur, sélectionnez 'Créer un compte' et remplissez le formulaire." },
    { q: "Quelle est la commission sur les ventes ?", a: "La commission dépend du total des ventes : de 15% (jusqu'à €1000) à 5% (à partir de €5000)." },
    { q: "Comment retirer mes gains ?", a: "Les paiements sont effectués via Stripe sur votre compte bancaire sous 7 jours ouvrés." },
    { q: "Puis-je vendre des œuvres numériques ?", a: "Oui ! Vous pouvez vendre des œuvres physiques et numériques." },
    { q: "Comment fonctionne la traduction IA ?", a: "Dans le tableau de bord artiste, sélectionnez les œuvres et cliquez sur 'Traduction IA'." },
    { q: "Comment promouvoir une annonce ?", a: "Dans le tableau de bord artiste, sélectionnez une œuvre et cliquez sur 'Promouvoir'. Choisissez une durée de 1 à 30 jours." },
    { q: "Comment retourner un article ?", a: "Les articles physiques peuvent être retournés sous 14 jours. Les articles numériques ne sont pas remboursables après téléchargement." },
    { q: "Comment contacter le support ?", a: "Écrivez-nous à support@mystetstvo.art ou utilisez la messagerie de la plateforme." },
  ],
};

export default function HelpPage() {
  const { lang, t } = useLanguage();
  const faqItems = faqItemsByLang[lang] || faqItemsByLang.uk;

  return (
    <div className="container py-12 max-w-3xl">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold font-serif mb-2">{t.help.title}</h1>
        <p className="text-sm text-muted-foreground mb-8">{t.help.desc}</p>

        <Accordion type="single" collapsible className="mb-10">
          {faqItems.map((item, i) => (
            <AccordionItem key={i} value={`faq-${i}`}>
              <AccordionTrigger className="text-left text-sm">{item.q}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">{item.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        <h2 className="text-xl font-bold font-serif mb-4">{t.help.not_found}</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-border bg-card p-5 text-center card-shadow">
            <Mail className="h-8 w-8 text-primary mx-auto mb-2" />
            <h3 className="font-semibold text-sm mb-1">{t.help.email}</h3>
            <p className="text-xs text-muted-foreground">support@mystetstvo.art</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-5 text-center card-shadow">
            <MessageCircle className="h-8 w-8 text-primary mx-auto mb-2" />
            <h3 className="font-semibold text-sm mb-1">{t.help.messenger}</h3>
            <Button variant="link" size="sm" asChild className="text-xs p-0 h-auto">
              <Link to="/messenger">{t.help.write_chat}</Link>
            </Button>
          </div>
          <div className="rounded-xl border border-border bg-card p-5 text-center card-shadow">
            <FileText className="h-8 w-8 text-primary mx-auto mb-2" />
            <h3 className="font-semibold text-sm mb-1">{t.help.docs}</h3>
            <Button variant="link" size="sm" asChild className="text-xs p-0 h-auto">
              <Link to="/terms">{t.help.terms_policies}</Link>
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
