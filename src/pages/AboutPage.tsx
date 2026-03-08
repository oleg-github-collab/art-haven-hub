import { motion } from "framer-motion";
import { Palette, Users, Globe, ShieldCheck, Zap, Heart } from "lucide-react";

const values = [
  { icon: Palette, title: "Мистецтво понад усе", desc: "Ми створюємо простір, де кожен митець може вільно творити, продавати та знаходити свою аудиторію." },
  { icon: Users, title: "Спільнота", desc: "Об'єднуємо художників, колекціонерів, галеристів та поціновувачів мистецтва з усього світу." },
  { icon: Globe, title: "Без кордонів", desc: "Українське мистецтво доступне глобально — з автоматичним перекладом на 5 мов." },
  { icon: ShieldCheck, title: "Прозорість", desc: "Чесна комісія від 5%, захист покупців, верифікація митців." },
  { icon: Zap, title: "Технології", desc: "ШІ-переклади, AR-прев'ю, аналітика продажів — інструменти для зростання." },
  { icon: Heart, title: "Підтримка України", desc: "Частина прибутку спрямовується на підтримку української культури та митців." },
];

export default function AboutPage() {
  return (
    <div className="container py-12 max-w-4xl">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
        <h1 className="text-4xl font-bold font-serif mb-4">Про платформу Мистецтво</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          <strong>Мистецтво</strong> — це українська онлайн-платформа, створена для того, щоб об'єднати митців, 
          колекціонерів та поціновувачів мистецтва з усього світу. Ми віримо, що кожен має право на доступ 
          до мистецтва, а кожен митець заслуговує на справедливу винагороду за свою працю.
        </p>
      </motion.div>

      <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="mb-12">
        <h2 className="text-2xl font-bold font-serif mb-2 text-center">Наша місія</h2>
        <p className="text-muted-foreground text-center max-w-xl mx-auto">
          Зробити українське мистецтво видимим у світі та надати митцям сучасні інструменти для розвитку їхньої творчої кар'єри.
        </p>
      </motion.section>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 mb-12">
        {values.map((v, i) => (
          <motion.div
            key={v.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * i }}
            className="rounded-xl border border-border bg-card p-6 card-shadow"
          >
            <v.icon className="h-8 w-8 text-primary mb-3" />
            <h3 className="font-semibold font-serif text-lg mb-1">{v.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{v.desc}</p>
          </motion.div>
        ))}
      </div>

      <section className="rounded-xl border border-border bg-accent/30 p-8 text-center">
        <h2 className="text-2xl font-bold font-serif mb-2">Як це працює</h2>
        <div className="grid gap-6 sm:grid-cols-3 mt-6 text-sm">
          <div>
            <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">1</div>
            <h4 className="font-semibold mb-1">Створіть профіль</h4>
            <p className="text-muted-foreground">Зареєструйтесь як митець або колекціонер. Додайте портфоліо.</p>
          </div>
          <div>
            <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">2</div>
            <h4 className="font-semibold mb-1">Публікуйте роботи</h4>
            <p className="text-muted-foreground">Завантажте твори, додайте описи — ШІ перекладе на 5 мов автоматично.</p>
          </div>
          <div>
            <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">3</div>
            <h4 className="font-semibold mb-1">Продавайте та зростайте</h4>
            <p className="text-muted-foreground">Отримуйте замовлення, аналітику та знижуйте комісію з ростом продажів.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
