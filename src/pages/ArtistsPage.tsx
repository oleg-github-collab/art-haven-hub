import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { MapPin, Users, ExternalLink, UserPlus, Search, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/i18n";
import { useArtists } from "@/hooks/useArtists";

export default function ArtistsPage() {
  const { t } = useLanguage();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const { data, isLoading } = useArtists({ search: debouncedSearch });
  const artists = data?.artists || [];

  const handleSearchChange = (value: string) => {
    setSearch(value);
    clearTimeout((window as any).__artistSearchTimeout);
    (window as any).__artistSearchTimeout = setTimeout(() => setDebouncedSearch(value), 300);
  };

  return (
    <div className="py-10 lg:py-16">
      <div className="container">
        <div className="mb-10">
          <p className="mb-2 text-sm font-semibold uppercase tracking-widest text-primary">{t.artists.badge}</p>
          <h1 className="text-3xl font-bold sm:text-4xl">{t.artists.title}</h1>
          <p className="mt-2 text-muted-foreground">{t.artists.desc}</p>
        </div>

        <div className="mb-8 max-w-md relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={e => handleSearchChange(e.target.value)}
            placeholder={t.artists.search || "Search artists..."}
            className="pl-10"
          />
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : artists.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            {t.artists.no_results || "No artists found"}
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {artists.map((a, i) => {
              const initials = a.display_name
                ?.split(" ")
                .map(w => w[0])
                .join("")
                .slice(0, 2)
                .toUpperCase() || "?";
              const isPro = a.roles?.includes("pro") || a.is_verified;

              return (
                <motion.div
                  key={a.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className={`group rounded-xl border bg-card p-5 transition-all hover:card-shadow-hover ${
                    isPro ? "border-primary/30 ring-1 ring-primary/10" : "border-border"
                  }`}
                >
                  {isPro && <Badge className="mb-3 bg-primary/10 text-primary hover:bg-primary/15">PRO</Badge>}
                  <div className="mb-4 flex items-center gap-3">
                    {a.avatar_url ? (
                      <img src={a.avatar_url} alt={a.display_name} className="h-12 w-12 rounded-full object-cover" />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                        {initials}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="font-semibold font-sans truncate">{a.display_name}</p>
                      <p className="text-xs text-muted-foreground truncate">@{a.handle}</p>
                    </div>
                  </div>
                  {a.bio && (
                    <p className="mb-3 text-xs text-muted-foreground line-clamp-2">{a.bio}</p>
                  )}
                  <div className="mb-3 flex items-center gap-3 text-xs text-muted-foreground">
                    {a.location && (
                      <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {a.location}</span>
                    )}
                    <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {a.follower_count || 0}</span>
                  </div>
                  {a.tags && a.tags.length > 0 && (
                    <div className="mb-4 flex flex-wrap gap-1.5">
                      {a.tags.slice(0, 4).map(tag => (
                        <span key={tag} className="rounded-full bg-secondary px-2.5 py-0.5 text-xs text-secondary-foreground">{tag}</span>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="flex-1" asChild>
                      <Link to={`/profile/${a.handle}`}>
                        <ExternalLink className="mr-1.5 h-3.5 w-3.5" /> {t.artists.profile}
                      </Link>
                    </Button>
                    <Button size="sm" variant="ghost"><UserPlus className="h-3.5 w-3.5" /></Button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {data && data.total > artists.length && (
          <div className="mt-8 text-center text-sm text-muted-foreground">
            {artists.length} / {data.total}
          </div>
        )}
      </div>
    </div>
  );
}
