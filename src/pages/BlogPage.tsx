import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Calendar, User, ArrowRight, Tag } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { useLanguage } from "@/i18n";

const blogPosts = [
  {
    id: "1",
    title: "Як українське мистецтво завойовує світові галереї",
    excerpt: "Огляд найуспішніших українських митців, чиї роботи експонуються в провідних музеях Європи та США.",
    category: "news",
    author: "Олена Коваленко",
    date: "5 березня 2026",
    readTime: "7 хв",
    image: "https://images.unsplash.com/photo-1578321272176-b7bbc0679853?w=600&h=400&fit=crop",
    featured: true,
  },
  {
    id: "2",
    title: "Інтерв'ю з Марією Примаченко-молодшою",
    excerpt: "Розмова про спадщину великої художниці та сучасне народне мистецтво.",
    category: "interviews",
    author: "Андрій Шевченко",
    date: "3 березня 2026",
    readTime: "12 хв",
    image: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=600&h=400&fit=crop",
    featured: true,
  },
  {
    id: "3",
    title: "Основи цифрового живопису: від ескізу до продажу",
    excerpt: "Покроковий гайд для початківців у світі digital art.",
    category: "tutorials",
    author: "Ігор Мельник",
    date: "1 березня 2026",
    readTime: "15 хв",
    image: "https://images.unsplash.com/photo-1561998338-13ad7883b20f?w=600&h=400&fit=crop",
    featured: false,
  },
  {
    id: "4",
    title: "Виставка «Код України» в Берліні",
    excerpt: "Репортаж з відкриття масштабної експозиції українського сучасного мистецтва.",
    category: "exhibitions",
    author: "Катерина Бойко",
    date: "28 лютого 2026",
    readTime: "5 хв",
    image: "https://images.unsplash.com/photo-1594744803329-e58b31de8bf5?w=600&h=400&fit=crop",
    featured: false,
  },
  {
    id: "5",
    title: "Тренди арт-ринку 2026: що купують колекціонери",
    excerpt: "Аналіз продажів та прогнози на рік від експертів ринку.",
    category: "market",
    author: "Олексій Петренко",
    date: "25 лютого 2026",
    readTime: "10 хв",
    image: "https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=600&h=400&fit=crop",
    featured: false,
  },
  {
    id: "6",
    title: "Як правильно фотографувати свої роботи",
    excerpt: "Поради від професійного фотографа для митців.",
    category: "tutorials",
    author: "Дмитро Савчук",
    date: "22 лютого 2026",
    readTime: "8 хв",
    image: "https://images.unsplash.com/photo-1452587925148-ce544e77e70d?w=600&h=400&fit=crop",
    featured: false,
  },
];

export default function BlogPage() {
  const { t } = useLanguage();
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const categories = [
    { id: "all", label: t.blog.all },
    { id: "news", label: t.blog.news },
    { id: "interviews", label: t.blog.interviews },
    { id: "tutorials", label: t.blog.tutorials },
    { id: "exhibitions", label: t.blog.exhibitions },
    { id: "market", label: t.blog.art_market },
  ];

  const filteredPosts = blogPosts.filter(post => {
    const matchesCategory = activeCategory === "all" || post.category === activeCategory;
    const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          post.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const featuredPosts = filteredPosts.filter(p => p.featured);
  const regularPosts = filteredPosts.filter(p => !p.featured);

  return (
    <div className="min-h-screen">
      <section className="border-b border-border bg-gradient-to-b from-accent/30 to-background">
        <div className="container py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl"
          >
            <h1 className="text-4xl font-bold font-serif mb-3">{t.blog.title}</h1>
            <p className="text-lg text-muted-foreground">{t.blog.desc}</p>
          </motion.div>

          <div className="mt-8 flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t.blog.search_placeholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {categories.map(cat => (
                <Button
                  key={cat.id}
                  variant={activeCategory === cat.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveCategory(cat.id)}
                >
                  {cat.label}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <div className="container py-10">
        {featuredPosts.length > 0 && (
          <section className="mb-12">
            <h2 className="text-xl font-semibold font-serif mb-6 flex items-center gap-2">
              <Tag className="h-5 w-5 text-primary" />
              {t.blog.recommended}
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              {featuredPosts.map((post, i) => (
                <motion.article
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="group relative overflow-hidden rounded-2xl border border-border bg-card"
                >
                  <div className="aspect-[16/9] overflow-hidden">
                    <img src={post.image} alt={post.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  </div>
                  <div className="p-6">
                    <Badge variant="secondary" className="mb-3">
                      {categories.find(c => c.id === post.category)?.label}
                    </Badge>
                    <h3 className="text-xl font-semibold font-serif mb-2 group-hover:text-primary transition-colors">{post.title}</h3>
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{post.excerpt}</p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1"><User className="h-3.5 w-3.5" />{post.author}</span>
                        <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{post.date}</span>
                      </div>
                      <span>{post.readTime}</span>
                    </div>
                  </div>
                  <Link to={`/blog/${post.id}`} className="absolute inset-0" />
                </motion.article>
              ))}
            </div>
          </section>
        )}

        <section>
          <h2 className="text-xl font-semibold font-serif mb-6">{t.blog.all_articles}</h2>
          {regularPosts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">{t.blog.no_results}</div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {regularPosts.map((post, i) => (
                <motion.article
                  key={post.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="group relative overflow-hidden rounded-xl border border-border bg-card hover:shadow-lg transition-shadow"
                >
                  <div className="aspect-[4/3] overflow-hidden">
                    <img src={post.image} alt={post.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  </div>
                  <div className="p-5">
                    <Badge variant="outline" className="mb-2 text-xs">
                      {categories.find(c => c.id === post.category)?.label}
                    </Badge>
                    <h3 className="font-semibold font-serif mb-2 line-clamp-2 group-hover:text-primary transition-colors">{post.title}</h3>
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{post.excerpt}</p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{post.date}</span>
                      <span className="flex items-center gap-1 text-primary font-medium">
                        {t.blog.read} <ArrowRight className="h-3 w-3" />
                      </span>
                    </div>
                  </div>
                  <Link to={`/blog/${post.id}`} className="absolute inset-0" />
                </motion.article>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
