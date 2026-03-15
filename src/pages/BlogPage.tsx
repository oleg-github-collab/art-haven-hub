import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Search, Calendar, User, ArrowRight, Tag } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { useLanguage } from "@/i18n";
import { useBlogPosts, type BlogPost } from "@/hooks/useBoard";

export default function BlogPage() {
  const { t } = useLanguage();
  const [activeCategory, setActiveCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const { data: posts, isLoading } = useBlogPosts();

  const categories = [
    { id: "all", label: t.blog.all },
    { id: "news", label: t.blog.news },
    { id: "interviews", label: t.blog.interviews },
    { id: "tutorials", label: t.blog.tutorials },
    { id: "exhibitions", label: t.blog.exhibitions },
    { id: "market", label: t.blog.art_market },
  ];

  const filteredPosts = useMemo(() => {
    const all = posts || [];
    return all.filter(post => {
      const matchesCategory = activeCategory === "all" || (post.tags || []).includes(activeCategory);
      const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            (post.excerpt || "").toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [posts, activeCategory, searchQuery]);

  const featuredPosts = filteredPosts.slice(0, 2);
  const regularPosts = filteredPosts.slice(2);

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
        {isLoading && <div className="py-16 text-center text-muted-foreground">Завантаження...</div>}

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
                  {post.cover_image && (
                    <div className="aspect-[16/9] overflow-hidden">
                      <img src={post.cover_image} alt={post.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    </div>
                  )}
                  <div className="p-6">
                    {post.tags?.[0] && (
                      <Badge variant="secondary" className="mb-3">
                        {categories.find(c => c.id === post.tags[0])?.label || post.tags[0]}
                      </Badge>
                    )}
                    <h3 className="text-xl font-semibold font-serif mb-2 group-hover:text-primary transition-colors">{post.title}</h3>
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{post.excerpt || ""}</p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1"><User className="h-3.5 w-3.5" />{post.author?.display_name || "Author"}</span>
                        <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{new Date(post.created_at).toLocaleDateString("uk-UA")}</span>
                      </div>
                    </div>
                  </div>
                  <Link to={`/blog/${post.slug}`} className="absolute inset-0" />
                </motion.article>
              ))}
            </div>
          </section>
        )}

        <section>
          <h2 className="text-xl font-semibold font-serif mb-6">{t.blog.all_articles}</h2>
          {!isLoading && regularPosts.length === 0 && featuredPosts.length === 0 ? (
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
                  {post.cover_image && (
                    <div className="aspect-[4/3] overflow-hidden">
                      <img src={post.cover_image} alt={post.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    </div>
                  )}
                  <div className="p-5">
                    {post.tags?.[0] && (
                      <Badge variant="outline" className="mb-2 text-xs">
                        {categories.find(c => c.id === post.tags[0])?.label || post.tags[0]}
                      </Badge>
                    )}
                    <h3 className="font-semibold font-serif mb-2 line-clamp-2 group-hover:text-primary transition-colors">{post.title}</h3>
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{post.excerpt || ""}</p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{new Date(post.created_at).toLocaleDateString("uk-UA")}</span>
                      <span className="flex items-center gap-1 text-primary font-medium">
                        {t.blog.read} <ArrowRight className="h-3 w-3" />
                      </span>
                    </div>
                  </div>
                  <Link to={`/blog/${post.slug}`} className="absolute inset-0" />
                </motion.article>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
