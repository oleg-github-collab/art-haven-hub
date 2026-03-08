import { motion } from "framer-motion";

const cookieTypes = [
  {
    type: "Необхідні",
    desc: "Забезпечують базову роботу платформи: авторизація, кошик, безпека. Не можуть бути вимкнені.",
    examples: "session_id, csrf_token, cart_session",
    duration: "Сесія / 30 днів",
  },
  {
    type: "Функціональні",
    desc: "Зберігають ваші налаштування: мову інтерфейсу, тему, переглянуті роботи.",
    examples: "lang_pref, theme, recently_viewed",
    duration: "1 рік",
  },
  {
    type: "Аналітичні",
    desc: "Допомагають нам розуміти, як користувачі взаємодіють з платформою, для покращення сервісу.",
    examples: "analytics_id, page_views",
    duration: "2 роки",
  },
  {
    type: "Маркетингові",
    desc: "Використовуються для показу релевантної реклами та вимірювання ефективності кампаній.",
    examples: "ad_tracking, campaign_id",
    duration: "90 днів",
  },
];

export default function CookiesPage() {
  return (
    <div className="container py-12 max-w-3xl">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold font-serif mb-2">Політика cookies</h1>
        <p className="text-sm text-muted-foreground mb-8">Останнє оновлення: 1 березня 2026</p>

        <section className="mb-8">
          <h2 className="text-lg font-semibold font-serif mb-2">Що таке cookies?</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Cookies — це невеликі текстові файли, які зберігаються у вашому браузері під час відвідування веб-сайтів. 
            Вони допомагають забезпечити коректну роботу платформи, запам'ятати ваші налаштування та покращити ваш досвід.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-semibold font-serif mb-4">Типи cookies, які ми використовуємо</h2>
          <div className="space-y-4">
            {cookieTypes.map(c => (
              <div key={c.type} className="rounded-xl border border-border bg-card p-5">
                <h3 className="font-semibold mb-1">{c.type}</h3>
                <p className="text-sm text-muted-foreground mb-2">{c.desc}</p>
                <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                  <span><strong>Приклади:</strong> {c.examples}</span>
                  <span><strong>Термін:</strong> {c.duration}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-8">
          <h2 className="text-lg font-semibold font-serif mb-2">Як керувати cookies</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Ви можете змінити налаштування cookies у своєму браузері в будь-який час. Зверніть увагу, що вимкнення 
            необхідних cookies може вплинути на роботу платформи. Для зміни налаштувань відвідайте розділ 
            «Конфіденційність» або «Cookies» у налаштуваннях вашого браузера.
          </p>
        </section>
      </motion.div>
    </div>
  );
}
