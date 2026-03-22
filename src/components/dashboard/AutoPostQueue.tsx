import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap, Clock, CheckCircle2, AlertCircle, XCircle,
  Instagram, Globe, ShoppingBag, Video, FileText,
  Facebook, Twitter, Package, MoreHorizontal, RefreshCw,
  Pause, Play, Trash2, Eye, Send, ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";

interface QueueItem {
  id: string;
  title: string;
  platform: string;
  scheduledAt: string;
  status: "pending" | "processing" | "published" | "failed" | "paused";
  retries?: number;
}

interface AutoPostQueueProps {
  labels: {
    title: string;
    desc: string;
    auto_enabled: string;
    queue_empty: string;
    pending: string;
    processing: string;
    published: string;
    failed: string;
    paused: string;
    retry: string;
    pause: string;
    resume: string;
    remove: string;
    view_post: string;
    clear_completed: string;
    total_in_queue: string;
    next_post: string;
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

const STATUS_CONFIG: Record<string, { icon: React.ElementType; color: string; bgColor: string }> = {
  pending: { icon: Clock, color: "text-blue-500", bgColor: "bg-blue-500/10" },
  processing: { icon: RefreshCw, color: "text-primary", bgColor: "bg-primary/10" },
  published: { icon: CheckCircle2, color: "text-green-500", bgColor: "bg-green-500/10" },
  failed: { icon: XCircle, color: "text-destructive", bgColor: "bg-destructive/10" },
  paused: { icon: Pause, color: "text-muted-foreground", bgColor: "bg-muted" },
};

const MOCK_QUEUE: QueueItem[] = [
  { id: "q1", title: "Весняна колекція — пост 1", platform: "instagram", scheduledAt: "2026-03-22T14:00:00", status: "pending" },
  { id: "q2", title: "Весняна колекція — пін", platform: "pinterest", scheduledAt: "2026-03-22T14:05:00", status: "pending" },
  { id: "q3", title: "Новий принт — твіт", platform: "x", scheduledAt: "2026-03-22T15:00:00", status: "pending" },
  { id: "q4", title: "Art process reel", platform: "tiktok", scheduledAt: "2026-03-22T16:30:00", status: "processing" },
  { id: "q5", title: "Weekly thread", platform: "threads", scheduledAt: "2026-03-21T10:00:00", status: "published" },
  { id: "q6", title: "FB gallery post", platform: "facebook", scheduledAt: "2026-03-21T12:00:00", status: "failed", retries: 2 },
];

export default function AutoPostQueue({ labels }: AutoPostQueueProps) {
  const { toast } = useToast();
  const [queue, setQueue] = useState(MOCK_QUEUE);
  const [autoEnabled, setAutoEnabled] = useState(true);

  const pendingCount = queue.filter(q => q.status === "pending").length;
  const nextPost = queue.find(q => q.status === "pending");

  const togglePause = (id: string) => {
    setQueue(prev => prev.map(q =>
      q.id === id ? { ...q, status: q.status === "paused" ? "pending" : "paused" as any } : q
    ));
  };

  const retry = (id: string) => {
    setQueue(prev => prev.map(q =>
      q.id === id ? { ...q, status: "pending" as const, retries: 0 } : q
    ));
    toast({ title: labels.retry });
  };

  const remove = (id: string) => {
    setQueue(prev => prev.filter(q => q.id !== id));
    toast({ title: labels.remove });
  };

  const clearCompleted = () => {
    setQueue(prev => prev.filter(q => q.status !== "published"));
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
            <Zap className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-bold">{labels.title}</h3>
            <p className="text-[10px] text-muted-foreground">{labels.desc}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-[10px] text-muted-foreground">{labels.auto_enabled}</p>
            <Switch checked={autoEnabled} onCheckedChange={setAutoEnabled} />
          </div>
        </div>
      </div>

      {/* Stats bar */}
      <div className="flex items-center gap-3 rounded-xl border border-border bg-card/60 p-3">
        <Badge variant="secondary" className="rounded-full text-xs gap-1.5">
          <Send className="h-3 w-3" />
          {pendingCount} {labels.total_in_queue}
        </Badge>
        {nextPost && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <ArrowRight className="h-3 w-3" />
            <span>{labels.next_post}:</span>
            <span className="font-medium text-foreground">{nextPost.title}</span>
            <span className="text-[10px]">
              {new Date(nextPost.scheduledAt).toLocaleTimeString("uk-UA", { hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>
        )}
        <div className="flex-1" />
        <Button size="sm" variant="ghost" className="h-7 text-xs rounded-full" onClick={clearCompleted}>
          {labels.clear_completed}
        </Button>
      </div>

      {/* Queue items */}
      <div className="space-y-2">
        <AnimatePresence>
          {queue.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">{labels.queue_empty}</div>
          ) : (
            queue.map((item, i) => {
              const pl = PLATFORM_MAP[item.platform];
              const Icon = pl?.icon || Globe;
              const st = STATUS_CONFIG[item.status];
              const StIcon = st?.icon || Clock;

              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ delay: i * 0.03 }}
                  className={`flex items-center gap-3 rounded-xl border p-3 transition-all ${
                    item.status === "processing"
                      ? "border-primary/30 bg-primary/5"
                      : item.status === "failed"
                        ? "border-destructive/30 bg-destructive/5"
                        : "border-border/60 bg-card/60"
                  }`}
                >
                  <div className={`h-9 w-9 rounded-lg flex items-center justify-center text-white shrink-0 ${pl?.color}`}>
                    <Icon className="h-4 w-4" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold truncate">{item.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Clock className="h-2.5 w-2.5" />
                        {new Date(item.scheduledAt).toLocaleString("uk-UA", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </span>
                      <Badge variant="secondary" className={`text-[9px] rounded-full px-1.5 py-0 gap-1 ${st?.bgColor}`}>
                        <StIcon className={`h-2.5 w-2.5 ${st?.color} ${item.status === "processing" ? "animate-spin" : ""}`} />
                        <span className={st?.color}>{labels[item.status as keyof typeof labels] || item.status}</span>
                      </Badge>
                      {item.retries && item.retries > 0 && (
                        <span className="text-[9px] text-destructive">×{item.retries}</span>
                      )}
                    </div>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full shrink-0">
                        <MoreHorizontal className="h-3.5 w-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="rounded-xl">
                      <DropdownMenuItem><Eye className="mr-2 h-3.5 w-3.5" />{labels.view_post}</DropdownMenuItem>
                      {item.status === "failed" && (
                        <DropdownMenuItem onClick={() => retry(item.id)}>
                          <RefreshCw className="mr-2 h-3.5 w-3.5" />{labels.retry}
                        </DropdownMenuItem>
                      )}
                      {(item.status === "pending" || item.status === "paused") && (
                        <DropdownMenuItem onClick={() => togglePause(item.id)}>
                          {item.status === "paused"
                            ? <><Play className="mr-2 h-3.5 w-3.5" />{labels.resume}</>
                            : <><Pause className="mr-2 h-3.5 w-3.5" />{labels.pause}</>
                          }
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem className="text-destructive" onClick={() => remove(item.id)}>
                        <Trash2 className="mr-2 h-3.5 w-3.5" />{labels.remove}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
