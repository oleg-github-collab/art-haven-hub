import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft, ChevronRight, Plus, Clock, Instagram, Globe,
  ShoppingBag, Video, FileText, Facebook, Twitter, Package,
  MoreHorizontal, Edit3, Trash2, Copy, Eye, Send,
  CalendarDays, GripVertical,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

/* ─── Types ─── */
interface ScheduledPost {
  id: string;
  title: string;
  platform: string;
  time: string; // HH:mm
  date: string; // YYYY-MM-DD
  status: "draft" | "scheduled" | "published" | "failed";
  preview?: string;
  caption?: string;
}

interface ContentCalendarProps {
  labels: {
    title: string;
    new_post: string;
    today: string;
    mon: string; tue: string; wed: string; thu: string; fri: string; sat: string; sun: string;
    draft: string; scheduled: string; published: string; failed: string;
    no_posts: string;
    add_post: string;
    platform: string;
    time: string;
    caption: string;
    save: string;
    cancel: string;
    delete_post: string;
    duplicate: string;
    edit: string;
    post_saved: string;
    post_deleted: string;
    view: string;
    week: string;
    month: string;
  };
}

const PLATFORM_MAP: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  instagram: { icon: Instagram, color: "bg-gradient-to-br from-pink-500 to-orange-400", label: "Instagram" },
  pinterest: { icon: Globe, color: "bg-red-600", label: "Pinterest" },
  etsy: { icon: ShoppingBag, color: "bg-orange-500", label: "Etsy" },
  tiktok: { icon: Video, color: "bg-foreground", label: "TikTok" },
  x: { icon: Twitter, color: "bg-foreground", label: "X" },
  facebook: { icon: Facebook, color: "bg-blue-600", label: "Facebook" },
  threads: { icon: FileText, color: "bg-foreground", label: "Threads" },
  printful: { icon: Package, color: "bg-green-600", label: "Printful" },
};

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-muted-foreground",
  scheduled: "bg-blue-500",
  published: "bg-green-500",
  failed: "bg-destructive",
};

/* ─── Mock data ─── */
function generateMockPosts(): ScheduledPost[] {
  const today = new Date();
  const posts: ScheduledPost[] = [];
  const platforms = ["instagram", "pinterest", "facebook", "tiktok", "x", "threads"];
  const titles = ["Нова колекція", "Art Drop", "Весняний розпродаж", "Behind the scenes", "Реліз принтів", "Weekly inspiration"];
  
  for (let i = -3; i < 14; i++) {
    if (Math.random() > 0.5) {
      const d = new Date(today);
      d.setDate(d.getDate() + i);
      const count = Math.floor(Math.random() * 3) + 1;
      for (let j = 0; j < count; j++) {
        posts.push({
          id: `post_${i}_${j}`,
          title: titles[Math.floor(Math.random() * titles.length)],
          platform: platforms[Math.floor(Math.random() * platforms.length)],
          time: `${String(9 + Math.floor(Math.random() * 12)).padStart(2, "0")}:${Math.random() > 0.5 ? "00" : "30"}`,
          date: d.toISOString().split("T")[0],
          status: i < 0 ? "published" : i === 0 ? (Math.random() > 0.5 ? "scheduled" : "draft") : "scheduled",
          caption: "Lorem ipsum dolor sit amet...",
        });
      }
    }
  }
  return posts;
}

/* ─── Helper ─── */
function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number) {
  const d = new Date(year, month, 1).getDay();
  return d === 0 ? 6 : d - 1; // Monday = 0
}

const MONTH_NAMES_UK = ["Січень", "Лютий", "Березень", "Квітень", "Травень", "Червень", "Липень", "Серпень", "Вересень", "Жовтень", "Листопад", "Грудень"];

export default function ContentCalendar({ labels }: ContentCalendarProps) {
  const { toast } = useToast();
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [posts, setPosts] = useState<ScheduledPost[]>(generateMockPosts);
  const [viewMode, setViewMode] = useState<"month" | "week">("month");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [createDialog, setCreateDialog] = useState(false);
  const [newPost, setNewPost] = useState({ title: "", platform: "instagram", time: "12:00", caption: "" });

  const todayStr = today.toISOString().split("T")[0];

  const prevMonth = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(y => y - 1); }
    else setCurrentMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(y => y + 1); }
    else setCurrentMonth(m => m + 1);
  };
  const goToday = () => { setCurrentMonth(today.getMonth()); setCurrentYear(today.getFullYear()); };

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfWeek(currentYear, currentMonth);
  const dayLabels = [labels.mon, labels.tue, labels.wed, labels.thu, labels.fri, labels.sat, labels.sun];

  const postsByDate = useMemo(() => {
    const map: Record<string, ScheduledPost[]> = {};
    posts.forEach(p => {
      if (!map[p.date]) map[p.date] = [];
      map[p.date].push(p);
    });
    Object.values(map).forEach(arr => arr.sort((a, b) => a.time.localeCompare(b.time)));
    return map;
  }, [posts]);

  const handleCreatePost = () => {
    if (!selectedDate || !newPost.title.trim()) return;
    const post: ScheduledPost = {
      id: `post_${Date.now()}`,
      title: newPost.title,
      platform: newPost.platform,
      time: newPost.time,
      date: selectedDate,
      status: "scheduled",
      caption: newPost.caption,
    };
    setPosts(prev => [...prev, post]);
    setCreateDialog(false);
    setNewPost({ title: "", platform: "instagram", time: "12:00", caption: "" });
    toast({ title: labels.post_saved });
  };

  const deletePost = (id: string) => {
    setPosts(prev => prev.filter(p => p.id !== id));
    toast({ title: labels.post_deleted });
  };

  const duplicatePost = (post: ScheduledPost) => {
    const d = new Date(post.date);
    d.setDate(d.getDate() + 1);
    setPosts(prev => [...prev, { ...post, id: `post_${Date.now()}`, date: d.toISOString().split("T")[0], status: "draft" }]);
    toast({ title: labels.duplicate });
  };

  // Build calendar grid
  const calendarCells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) calendarCells.push(null);
  for (let d = 1; d <= daysInMonth; d++) calendarCells.push(d);
  while (calendarCells.length % 7 !== 0) calendarCells.push(null);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
            <CalendarDays className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-bold">{labels.title}</h3>
            <p className="text-[10px] text-muted-foreground">
              {MONTH_NAMES_UK[currentMonth]} {currentYear}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Select value={viewMode} onValueChange={(v) => setViewMode(v as any)}>
            <SelectTrigger className="w-28 h-8 rounded-full text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">{labels.month}</SelectItem>
              <SelectItem value="week">{labels.week}</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex items-center rounded-full border border-border bg-card">
            <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full" onClick={prevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="ghost" className="h-8 px-3 text-xs font-medium" onClick={goToday}>
              {labels.today}
            </Button>
            <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full" onClick={nextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1">
        {dayLabels.map(d => (
          <div key={d} className="text-center text-[10px] font-semibold uppercase tracking-wider text-muted-foreground py-2">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarCells.map((day, i) => {
          if (day === null) return <div key={`empty-${i}`} className="min-h-[100px] rounded-xl bg-muted/20" />;
          
          const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const dayPosts = postsByDate[dateStr] || [];
          const isToday = dateStr === todayStr;
          const isSelected = dateStr === selectedDate;

          return (
            <motion.div
              key={dateStr}
              whileHover={{ scale: 1.02 }}
              onClick={() => setSelectedDate(dateStr === selectedDate ? null : dateStr)}
              className={`min-h-[100px] rounded-xl border p-1.5 cursor-pointer transition-all ${
                isToday
                  ? "border-primary/40 bg-primary/5 ring-1 ring-primary/20"
                  : isSelected
                    ? "border-primary/30 bg-primary/5"
                    : "border-border/40 bg-card/60 hover:border-border hover:bg-card"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className={`text-xs font-semibold ${isToday ? "text-primary" : "text-foreground"}`}>
                  {day}
                </span>
                {dayPosts.length > 0 && (
                  <Badge variant="secondary" className="text-[8px] rounded-full px-1.5 py-0 h-4">
                    {dayPosts.length}
                  </Badge>
                )}
              </div>

              <div className="space-y-0.5">
                {dayPosts.slice(0, 3).map(post => {
                  const pl = PLATFORM_MAP[post.platform];
                  const Icon = pl?.icon || Globe;
                  return (
                    <div
                      key={post.id}
                      className="flex items-center gap-1 rounded-md bg-background/80 px-1 py-0.5 group/post"
                    >
                      <div className={`h-3.5 w-3.5 rounded flex items-center justify-center text-white shrink-0 ${pl?.color || "bg-muted"}`}>
                        <Icon className="h-2 w-2" />
                      </div>
                      <span className="text-[9px] truncate flex-1 font-medium">{post.title}</span>
                      <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${STATUS_COLORS[post.status]}`} />
                    </div>
                  );
                })}
                {dayPosts.length > 3 && (
                  <span className="text-[9px] text-muted-foreground pl-1">+{dayPosts.length - 3}</span>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Selected date detail panel */}
      <AnimatePresence>
        {selectedDate && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold">
                  {new Date(selectedDate + "T00:00:00").toLocaleDateString("uk-UA", { weekday: "long", day: "numeric", month: "long" })}
                </h4>
                <Button size="sm" className="rounded-full gap-1.5" onClick={() => setCreateDialog(true)}>
                  <Plus className="h-3.5 w-3.5" />
                  {labels.add_post}
                </Button>
              </div>

              {(postsByDate[selectedDate] || []).length === 0 ? (
                <p className="text-xs text-muted-foreground py-4 text-center">{labels.no_posts}</p>
              ) : (
                <div className="space-y-2">
                  {(postsByDate[selectedDate] || []).map(post => {
                    const pl = PLATFORM_MAP[post.platform];
                    const Icon = pl?.icon || Globe;
                    return (
                      <motion.div
                        key={post.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-3 rounded-xl border border-border/60 bg-background/60 p-3"
                      >
                        <div className={`h-10 w-10 rounded-xl flex items-center justify-center text-white shrink-0 ${pl?.color}`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold truncate">{post.title}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                              <Clock className="h-2.5 w-2.5" /> {post.time}
                            </span>
                            <Badge variant="secondary" className="text-[9px] rounded-full px-1.5 py-0 gap-1">
                              <span className={`h-1.5 w-1.5 rounded-full ${STATUS_COLORS[post.status]}`} />
                              {labels[post.status as keyof typeof labels] || post.status}
                            </Badge>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full shrink-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="rounded-xl">
                            <DropdownMenuItem><Edit3 className="mr-2 h-3.5 w-3.5" />{labels.edit}</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => duplicatePost(post)}><Copy className="mr-2 h-3.5 w-3.5" />{labels.duplicate}</DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive" onClick={() => deletePost(post.id)}>
                              <Trash2 className="mr-2 h-3.5 w-3.5" />{labels.delete_post}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Post Dialog */}
      <Dialog open={createDialog} onOpenChange={setCreateDialog}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="h-5 w-5 text-primary" />
              {labels.new_post}
            </DialogTitle>
            <DialogDescription>
              {selectedDate && new Date(selectedDate + "T00:00:00").toLocaleDateString("uk-UA", { day: "numeric", month: "long", year: "numeric" })}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <label className="mb-1.5 block text-xs font-medium">Назва</label>
              <Input
                value={newPost.title}
                onChange={e => setNewPost(p => ({ ...p, title: e.target.value }))}
                placeholder="Art Drop #42"
                className="rounded-xl"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-xs font-medium">{labels.platform}</label>
                <Select value={newPost.platform} onValueChange={v => setNewPost(p => ({ ...p, platform: v }))}>
                  <SelectTrigger className="rounded-xl text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(PLATFORM_MAP).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium">{labels.time}</label>
                <Input
                  type="time"
                  value={newPost.time}
                  onChange={e => setNewPost(p => ({ ...p, time: e.target.value }))}
                  className="rounded-xl text-xs"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium">{labels.caption}</label>
              <Textarea
                value={newPost.caption}
                onChange={e => setNewPost(p => ({ ...p, caption: e.target.value }))}
                placeholder="..."
                className="rounded-xl text-xs resize-none"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" className="rounded-full" onClick={() => setCreateDialog(false)}>{labels.cancel}</Button>
            <Button className="rounded-full gap-1.5" onClick={handleCreatePost}>
              <Plus className="h-4 w-4" />{labels.save}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
