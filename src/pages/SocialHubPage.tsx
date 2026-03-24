import { useState } from "react";
import { motion } from "framer-motion";
import {
  Instagram, Facebook, Twitter, ShoppingBag, Video, FileText,
  Globe, Package, Link2, Unlink, CheckCircle2,
  Eye, Heart, TrendingUp, Plus,
  Zap, Calendar, Send, Clock,
  Workflow, ChevronRight, Plug,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/i18n/context";
import { Link } from "react-router-dom";
import ContentCalendar from "@/components/dashboard/ContentCalendar";
import AutoPostQueue from "@/components/dashboard/AutoPostQueue";
import ConnectorSetup from "@/components/artflow/ConnectorSetup";
import AIAssistantChat from "@/components/artflow/AIAssistantChat";
import {
  useSocialAccounts, useConnectAccount, useDisconnectAccount, useUpdateAutoPost,
  useCampaigns, useSocialHubStats,
  type Campaign,
} from "@/hooks/useSocialHub";

/* ─── Platform UI Config ─── */
const PLATFORM_CONFIG: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  instagram: { icon: Instagram, color: "bg-gradient-to-br from-pink-500 to-orange-400", label: "Instagram" },
  pinterest: { icon: Globe, color: "bg-red-600", label: "Pinterest" },
  etsy: { icon: ShoppingBag, color: "bg-orange-500", label: "Etsy" },
  tiktok: { icon: Video, color: "bg-foreground", label: "TikTok" },
  x: { icon: Twitter, color: "bg-foreground", label: "X (Twitter)" },
  facebook: { icon: Facebook, color: "bg-blue-600", label: "Facebook" },
  threads: { icon: FileText, color: "bg-foreground", label: "Threads" },
  printful: { icon: Package, color: "bg-green-600", label: "Printful" },
};

const ALL_PLATFORMS = ["instagram", "pinterest", "etsy", "tiktok", "x", "facebook", "threads", "printful"];

export default function SocialHubPage() {
  const { t } = useLanguage();
  const sh = t.social_hub;
  const { toast } = useToast();
  const [tab, setTab] = useState("accounts");

  // API hooks
  const { data: apiAccounts } = useSocialAccounts();
  const { data: apiCampaigns } = useCampaigns();
  const { data: stats } = useSocialHubStats();
  const connectMutation = useConnectAccount();
  const disconnectMutation = useDisconnectAccount();
  const autoPostMutation = useUpdateAutoPost();

  // Merge API accounts with platform definitions (show all platforms, mark connected ones)
  const connectedMap = new Map((apiAccounts || []).map(a => [a.platform, a]));
  const accounts = ALL_PLATFORMS.map(platform => {
    const cfg = PLATFORM_CONFIG[platform];
    const apiAcc = connectedMap.get(platform);
    return {
      platform,
      icon: cfg?.icon || Globe,
      color: cfg?.color || "bg-muted",
      label: cfg?.label || platform,
      connected: apiAcc?.connected ?? false,
      handle: apiAcc?.handle ?? "",
      followers: apiAcc?.followers ?? 0,
      autoPost: apiAcc?.auto_post ?? false,
    };
  });

  const campaigns: Campaign[] = apiCampaigns || [];

  const toggleConnect = (platform: string) => {
    const acc = accounts.find(a => a.platform === platform);
    if (!acc) return;
    if (acc.connected) {
      disconnectMutation.mutate(platform, {
        onSuccess: () => toast({ title: sh.disconnected, description: acc.label }),
      });
    } else {
      connectMutation.mutate(
        { platform, handle: `@myart_${platform}` },
        { onSuccess: () => toast({ title: sh.connected, description: acc.label }) },
      );
    }
  };

  const toggleAutoPost = (platform: string, checked: boolean) => {
    autoPostMutation.mutate({ platform, auto_post: checked });
  };

  const statusConfig: Record<string, { label: string; color: string }> = {
    draft: { label: sh.status_draft, color: "bg-muted-foreground" },
    scheduled: { label: sh.status_scheduled, color: "bg-blue-500" },
    active: { label: sh.status_active, color: "bg-green-500" },
    completed: { label: sh.status_completed, color: "bg-primary" },
  };

  const calendarLabels = {
    title: sh.calendar_title,
    new_post: sh.new_post || "Новий пост",
    today: sh.today || "Сьогодні",
    mon: sh.mon || "Пн", tue: sh.tue || "Вт", wed: sh.wed || "Ср",
    thu: sh.thu || "Чт", fri: sh.fri || "Пт", sat: sh.sat || "Сб", sun: sh.sun || "Нд",
    draft: sh.status_draft, scheduled: sh.status_scheduled,
    published: sh.published || "Опубліковано",
    failed: sh.failed || "Помилка",
    no_posts: sh.no_posts || "Немає постів на цей день",
    add_post: sh.add_post || "Додати пост",
    platform: sh.platform || "Платформа",
    time: sh.time || "Час",
    caption: sh.caption || "Опис",
    save: sh.save || "Зберегти",
    cancel: sh.cancel || "Скасувати",
    delete_post: sh.delete_post || "Видалити",
    duplicate: sh.duplicate || "Дублювати",
    edit: sh.edit,
    post_saved: sh.post_saved || "Пост збережено",
    post_deleted: sh.post_deleted || "Пост видалено",
    view: sh.view || "Переглянути",
    week: sh.week || "Тиждень",
    month: sh.month || "Місяць",
  };

  const autoPostLabels = {
    title: sh.autopost_title || "Черга автопостингу",
    desc: sh.autopost_desc || "Автоматична публікація за розкладом",
    auto_enabled: sh.auto_post,
    queue_empty: sh.queue_empty || "Черга порожня",
    pending: sh.status_scheduled,
    processing: sh.processing || "Обробка...",
    published: sh.published || "Опубліковано",
    failed: sh.failed || "Помилка",
    paused: sh.paused || "Пауза",
    retry: sh.retry || "Повторити",
    pause: sh.pause || "Пауза",
    resume: sh.resume || "Відновити",
    remove: sh.remove || "Видалити",
    view_post: sh.view || "Переглянути",
    clear_completed: sh.clear_completed || "Очистити завершені",
    total_in_queue: sh.total_in_queue || "в черзі",
    next_post: sh.next_post || "Наступний",
  };

  const formatNumber = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(1)}K` : String(n);

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="relative overflow-hidden border-b border-border bg-gradient-to-br from-card via-background to-primary/5">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,hsl(var(--primary)/0.08),transparent_60%)]" />
        <div className="container max-w-5xl relative py-8 sm:py-12">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10">
                  <Zap className="h-5 w-5 text-primary" />
                </div>
                <h1 className="font-serif text-2xl font-bold sm:text-3xl">{sh.title}</h1>
              </div>
              <p className="text-sm text-muted-foreground max-w-md">{sh.desc}</p>
            </div>
            <Link to="/workflow-builder">
              <Button className="gap-2 rounded-full hidden sm:flex">
                <Workflow className="h-4 w-4" />
                {sh.open_builder}
              </Button>
            </Link>
          </div>

          <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatMini label={sh.connected_accounts} value={stats?.connected_accounts ?? accounts.filter(a => a.connected).length} icon={Link2} />
            <StatMini label={sh.active_campaigns} value={stats?.active_campaigns ?? campaigns.filter(c => c.status === "active").length} icon={TrendingUp} />
            <StatMini label={sh.total_reach} value={formatNumber(stats?.total_reach ?? 0)} icon={Eye} />
            <StatMini label={sh.engagement} value={formatNumber(stats?.total_engagement ?? 0)} icon={Heart} />
          </div>
        </div>
      </div>

      <div className="container max-w-5xl py-6 sm:py-8">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="mb-6 h-10 w-fit rounded-full bg-muted/60 p-1">
            <TabsTrigger value="accounts" className="gap-1.5 rounded-full px-4 text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <Link2 className="h-3.5 w-3.5" />
              {sh.accounts_tab}
            </TabsTrigger>
            <TabsTrigger value="campaigns" className="gap-1.5 rounded-full px-4 text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <Send className="h-3.5 w-3.5" />
              {sh.campaigns_tab}
            </TabsTrigger>
            <TabsTrigger value="calendar" className="gap-1.5 rounded-full px-4 text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <Calendar className="h-3.5 w-3.5" />
              {sh.calendar_tab}
            </TabsTrigger>
            <TabsTrigger value="autopost" className="gap-1.5 rounded-full px-4 text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <Zap className="h-3.5 w-3.5" />
              {sh.autopost_tab || "Автопост"}
            </TabsTrigger>
            <TabsTrigger value="connectors" className="gap-1.5 rounded-full px-4 text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <Plug className="h-3.5 w-3.5" />
              Connectors
            </TabsTrigger>
          </TabsList>

          {/* Accounts Tab */}
          <TabsContent value="accounts" className="mt-0 space-y-3">
            {accounts.map((acc, i) => {
              const Icon = acc.icon;
              return (
                <motion.div
                  key={acc.platform}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className={`flex items-center gap-4 rounded-2xl border p-4 transition-all ${
                    acc.connected
                      ? "border-primary/20 bg-primary/5"
                      : "border-border bg-card hover:border-border/80"
                  }`}
                >
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl text-white shrink-0 ${acc.color}`}>
                    <Icon className="h-6 w-6" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold">{acc.label}</p>
                      {acc.connected && (
                        <Badge variant="secondary" className="text-[10px] rounded-full px-2 py-0 gap-1">
                          <CheckCircle2 className="h-2.5 w-2.5 text-green-500" />
                          {sh.connected}
                        </Badge>
                      )}
                    </div>
                    {acc.connected ? (
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-xs text-muted-foreground">{acc.handle}</span>
                        {acc.followers > 0 && (
                          <span className="text-xs text-muted-foreground">• {acc.followers.toLocaleString()} {sh.followers}</span>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">{sh.not_connected}</p>
                    )}
                  </div>

                  {acc.connected && (
                    <div className="flex items-center gap-2">
                      <div className="text-right mr-2">
                        <p className="text-[10px] text-muted-foreground">{sh.auto_post}</p>
                        <Switch
                          checked={acc.autoPost}
                          onCheckedChange={(checked) => toggleAutoPost(acc.platform, checked)}
                        />
                      </div>
                    </div>
                  )}

                  <Button
                    size="sm"
                    variant={acc.connected ? "outline" : "default"}
                    className="rounded-full gap-1.5 shrink-0"
                    onClick={() => toggleConnect(acc.platform)}
                    disabled={connectMutation.isPending || disconnectMutation.isPending}
                  >
                    {acc.connected ? (
                      <><Unlink className="h-3.5 w-3.5" />{sh.disconnect}</>
                    ) : (
                      <><Link2 className="h-3.5 w-3.5" />{sh.connect}</>
                    )}
                  </Button>
                </motion.div>
              );
            })}
          </TabsContent>

          {/* Campaigns Tab */}
          <TabsContent value="campaigns" className="mt-0 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">{sh.recent_campaigns}</h3>
              <Link to="/workflow-builder">
                <Button size="sm" className="rounded-full gap-1.5">
                  <Plus className="h-3.5 w-3.5" />
                  {sh.new_campaign}
                </Button>
              </Link>
            </div>

            {campaigns.length === 0 && (
              <div className="text-center py-12 text-sm text-muted-foreground">
                {sh.no_posts || "Немає кампаній"}
              </div>
            )}

            {campaigns.map((camp, i) => (
              <motion.div
                key={camp.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="rounded-2xl border border-border bg-card p-5 hover:border-primary/30 transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-sm font-semibold">{camp.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-[10px] rounded-full gap-1 px-2 py-0">
                        <span className={`h-1.5 w-1.5 rounded-full ${statusConfig[camp.status]?.color}`} />
                        {statusConfig[camp.status]?.label}
                      </Badge>
                      {camp.scheduled_at && (
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <Clock className="h-2.5 w-2.5" />
                          {new Date(camp.scheduled_at).toLocaleDateString("uk-UA")}
                        </span>
                      )}
                    </div>
                  </div>
                  <Link to="/workflow-builder">
                    <Button size="sm" variant="ghost" className="rounded-full gap-1 text-xs">
                      {sh.edit} <ChevronRight className="h-3.5 w-3.5" />
                    </Button>
                  </Link>
                </div>

                <div className="flex items-center gap-2 mb-3">
                  {camp.platforms.map((p) => {
                    const cfg = PLATFORM_CONFIG[p.toLowerCase()];
                    if (!cfg) return null;
                    const PIcon = cfg.icon;
                    return (
                      <div key={p} className={`flex h-7 w-7 items-center justify-center rounded-lg text-white text-xs ${cfg.color}`}>
                        <PIcon className="h-3.5 w-3.5" />
                      </div>
                    );
                  })}
                </div>

                {camp.status === "active" && (
                  <div className="flex items-center gap-4 pt-3 border-t border-border/50">
                    <div className="flex items-center gap-1.5">
                      <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-xs font-medium">{camp.reach.toLocaleString()}</span>
                      <span className="text-[10px] text-muted-foreground">{sh.reach}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Heart className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-xs font-medium">{camp.engagement.toLocaleString()}</span>
                      <span className="text-[10px] text-muted-foreground">{sh.engagement}</span>
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </TabsContent>

          {/* Calendar Tab */}
          <TabsContent value="calendar" className="mt-0">
            <ContentCalendar labels={calendarLabels} />
          </TabsContent>

          {/* Auto-post Tab */}
          <TabsContent value="autopost" className="mt-0">
            <AutoPostQueue labels={autoPostLabels} />
          </TabsContent>

          {/* Connectors Tab */}
          <TabsContent value="connectors" className="mt-0">
            <div className="mb-4">
              <h3 className="text-sm font-semibold mb-1">Platform Connectors</h3>
              <p className="text-xs text-muted-foreground">Connect your accounts to enable real workflow automation.</p>
            </div>
            <ConnectorSetup />
          </TabsContent>
        </Tabs>
      </div>

      {/* AI Assistant floating chat */}
      <AIAssistantChat />
    </div>
  );
}

function StatMini({ label, value, icon: Icon }: { label: string; value: string | number; icon: React.ElementType }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-border bg-card/80 p-3"
    >
      <div className="flex items-center gap-2 mb-1">
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-lg font-bold font-serif">{value}</p>
    </motion.div>
  );
}
