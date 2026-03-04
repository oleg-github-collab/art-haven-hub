import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  MapPin, LinkIcon, Calendar, Grid3X3, Bookmark, Heart,
  MessageCircle, Settings, Share2, MoreHorizontal, BadgeCheck,
  Users, Image as ImageIcon, ShoppingBag, Star, Edit3, Camera,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ProfileData {
  name: string;
  handle: string;
  bio: string;
  location: string;
  website: string;
  joined: string;
  verified: boolean;
  followers: number;
  following: number;
  posts: number;
  isOwn: boolean;
  isFollowing: boolean;
  tags: string[];
  coverColor: string;
}

const profiles: Record<string, ProfileData> = {
  me: {
    name: "Ваш Профіль",
    handle: "@you",
    bio: "Митець, куратор, мрійник. Створюю мистецтво, що обʼєднує людей 🎨",
    location: "Берлін, Німеччина",
    website: "myart.studio",
    joined: "Березень 2024",
    verified: false,
    followers: 248,
    following: 186,
    posts: 42,
    isOwn: true,
    isFollowing: false,
    tags: ["живопис", "кераміка", "інсталяції"],
    coverColor: "from-primary/20 to-accent",
  },
  "olena-art": {
    name: "Олена Мирна",
    handle: "@olena.art",
    bio: "Акварелістка 🎨 Пишу Карпати, море та людей. Виставки: Берлін, Відень, Варшава.\nОригінали та принти у маркеті ↓",
    location: "Відень, Австрія",
    website: "olena-art.com",
    joined: "Січень 2024",
    verified: true,
    followers: 4820,
    following: 312,
    posts: 156,
    isOwn: false,
    isFollowing: false,
    tags: ["акварель", "пейзаж", "портрет"],
    coverColor: "from-blue-500/20 to-primary/10",
  },
};

const sampleWorks = [
  { id: 1, title: "Зимовий ранок", likes: 142, comments: 23 },
  { id: 2, title: "Карпатський туман", likes: 89, comments: 12 },
  { id: 3, title: "Весняний Відень", likes: 234, comments: 45 },
  { id: 4, title: "Море вночі", likes: 178, comments: 31 },
  { id: 5, title: "Старе місто", likes: 67, comments: 8 },
  { id: 6, title: "Портрет з квітами", likes: 312, comments: 56 },
];

export default function ProfilePage_() {
  const { handle } = useParams();
  const profileKey = handle || "me";
  const profile = profiles[profileKey] || profiles["me"];

  const [following, setFollowing] = useState(profile.isFollowing);
  const [followerCount, setFollowerCount] = useState(profile.followers);

  const toggleFollow = () => {
    setFollowing((f) => !f);
    setFollowerCount((c) => (following ? c - 1 : c + 1));
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Cover */}
      <div className={`h-36 bg-gradient-to-r ${profile.coverColor} sm:h-48`} />

      <div className="container max-w-3xl">
        {/* Avatar + actions */}
        <div className="relative -mt-12 mb-4 flex items-end justify-between sm:-mt-16">
          <div className="relative">
            <Avatar className="h-24 w-24 border-4 border-background sm:h-32 sm:w-32">
              <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-bold sm:text-3xl">
                {profile.name.split(" ").map((w) => w[0]).join("").slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            {profile.isOwn && (
              <button className="absolute bottom-1 right-1 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md">
                <Camera className="h-4 w-4" />
              </button>
            )}
          </div>
          <div className="flex gap-2 pb-2">
            {profile.isOwn ? (
              <>
                <Button variant="outline" size="sm"><Edit3 className="mr-1.5 h-3.5 w-3.5" />Редагувати</Button>
                <Button variant="outline" size="icon" className="h-9 w-9"><Settings className="h-4 w-4" /></Button>
              </>
            ) : (
              <>
                <Button size="sm" variant={following ? "outline" : "default"} onClick={toggleFollow}>
                  {following ? "Відписатись" : "Підписатись"}
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link to="/messenger"><MessageCircle className="mr-1.5 h-3.5 w-3.5" />Написати</Link>
                </Button>
                <Button variant="outline" size="icon" className="h-9 w-9"><Share2 className="h-4 w-4" /></Button>
              </>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="mb-6">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold sm:text-2xl">{profile.name}</h1>
            {profile.verified && <BadgeCheck className="h-5 w-5 text-primary" />}
          </div>
          <p className="text-sm text-muted-foreground">{profile.handle}</p>
          <p className="mt-2 whitespace-pre-line text-sm leading-relaxed">{profile.bio}</p>

          <div className="mt-3 flex flex-wrap gap-1.5">
            {profile.tags.map((t) => (
              <Badge key={t} variant="secondary" className="text-xs">#{t}</Badge>
            ))}
          </div>

          <div className="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{profile.location}</span>
            <span className="flex items-center gap-1"><LinkIcon className="h-3.5 w-3.5" /><a href="#" className="text-primary hover:underline">{profile.website}</a></span>
            <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />З {profile.joined}</span>
          </div>

          <div className="mt-3 flex gap-5 text-sm">
            <span><strong className="font-semibold">{followerCount.toLocaleString()}</strong> <span className="text-muted-foreground">підписників</span></span>
            <span><strong className="font-semibold">{profile.following}</strong> <span className="text-muted-foreground">підписок</span></span>
            <span><strong className="font-semibold">{profile.posts}</strong> <span className="text-muted-foreground">дописів</span></span>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="works" className="mb-8">
          <TabsList className="w-full justify-start border-b border-border bg-transparent p-0">
            <TabsTrigger value="works" className="gap-1.5 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent">
              <Grid3X3 className="h-4 w-4" />Роботи
            </TabsTrigger>
            <TabsTrigger value="market" className="gap-1.5 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent">
              <ShoppingBag className="h-4 w-4" />Маркет
            </TabsTrigger>
            <TabsTrigger value="saved" className="gap-1.5 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent">
              <Bookmark className="h-4 w-4" />Збережене
            </TabsTrigger>
            <TabsTrigger value="reviews" className="gap-1.5 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent">
              <Star className="h-4 w-4" />Відгуки
            </TabsTrigger>
          </TabsList>

          <TabsContent value="works" className="mt-4">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {sampleWorks.map((w, i) => (
                <motion.div
                  key={w.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className="group relative aspect-square cursor-pointer overflow-hidden rounded-xl bg-secondary"
                >
                  <div className="flex h-full items-center justify-center">
                    <ImageIcon className="h-8 w-8 text-muted-foreground/40" />
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center gap-4 bg-foreground/60 opacity-0 transition-opacity group-hover:opacity-100">
                    <span className="flex items-center gap-1 text-sm font-semibold text-background">
                      <Heart className="h-4 w-4" />{w.likes}
                    </span>
                    <span className="flex items-center gap-1 text-sm font-semibold text-background">
                      <MessageCircle className="h-4 w-4" />{w.comments}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="market" className="mt-4">
            <div className="py-12 text-center text-sm text-muted-foreground">
              <ShoppingBag className="mx-auto mb-3 h-8 w-8 text-muted-foreground/40" />
              <p>Товари у маркеті поки відсутні</p>
              {profile.isOwn && <Button size="sm" className="mt-3">Додати товар</Button>}
            </div>
          </TabsContent>

          <TabsContent value="saved" className="mt-4">
            <div className="py-12 text-center text-sm text-muted-foreground">
              <Bookmark className="mx-auto mb-3 h-8 w-8 text-muted-foreground/40" />
              <p>Збережених дописів поки немає</p>
            </div>
          </TabsContent>

          <TabsContent value="reviews" className="mt-4">
            <div className="space-y-4">
              {[
                { author: "Артем К.", text: "Фантастична якість робіт! Отримав картину дуже швидко, упаковка ідеальна.", rating: 5 },
                { author: "Марія Д.", text: "Дуже приємна комунікація, рекомендую як продавця.", rating: 5 },
              ].map((r, i) => (
                <div key={i} className="rounded-xl border border-border bg-card p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <span className="text-sm font-semibold">{r.author}</span>
                    <div className="flex gap-0.5">
                      {Array.from({ length: r.rating }).map((_, j) => (
                        <Star key={j} className="h-3.5 w-3.5 fill-primary text-primary" />
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">{r.text}</p>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
