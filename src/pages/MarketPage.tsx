import { motion } from "framer-motion";
import { Search, Filter, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type Item = {
  id: number;
  title: string;
  category: string;
  price: string;
  seller: string;
  city: string;
  image: string;
};

const items: Item[] = [
  { id: 1, title: "Абстрактний пейзаж, олія, 80×100", category: "Живопис", price: "€1,200", seller: "Марина К.", city: "Берлін", image: "🎨" },
  { id: 2, title: "Керамічна ваза ручної роботи", category: "Кераміка", price: "€180", seller: "Олексій Г.", city: "Відень", image: "🏺" },
  { id: 3, title: "Фотопринт «Карпати» 60×90, лімітована серія", category: "Фотографія", price: "€350", seller: "Дарія К.", city: "Прага", image: "📷" },
  { id: 4, title: "Дерев'яний мольберт, великий, б/у", category: "Інвентар", price: "€45", seller: "Вікторія С.", city: "Мадрид", image: "🖼️" },
  { id: 5, title: "Набір масляних фарб Winsor & Newton", category: "Матеріали", price: "€95", seller: "Сергій Л.", city: "Мюнхен", image: "🎨" },
  { id: 6, title: "Послуги пакування та доставки картин", category: "Послуги", price: "від €50", seller: "TransArt EU", city: "Вся Європа", image: "📦" },
];

export default function MarketPage() {
  return (
    <div className="py-10 lg:py-16">
      <div className="container">
        <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-primary">Маркетплейс</p>
            <h1 className="text-3xl font-bold sm:text-4xl">Маркет</h1>
            <p className="mt-2 text-muted-foreground">Мистецтво, матеріали, інвентар та послуги для творчої діяльності.</p>
          </div>
          <Button>
            <ShoppingBag className="mr-1.5 h-4 w-4" />
            Розмістити товар
          </Button>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="group overflow-hidden rounded-xl border border-border bg-card transition-all hover:card-shadow-hover"
            >
              <div className="flex h-44 items-center justify-center bg-secondary text-5xl">
                {item.image}
              </div>
              <div className="p-5">
                <Badge className="mb-2 bg-secondary text-secondary-foreground">{item.category}</Badge>
                <h3 className="mb-1 font-semibold font-sans">{item.title}</h3>
                <p className="mb-3 text-lg font-bold text-primary">{item.price}</p>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{item.seller} · {item.city}</span>
                  <Button size="sm" variant="outline">Детальніше</Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
