import { useState, useRef, useCallback, useMemo, useEffect } from "react";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import {
  Image, Sparkles, Instagram, Facebook, Twitter, ShoppingBag,
  Play, Save, Trash2, Plus, GripVertical, ChevronRight,
  Zap, Clock, Globe, Palette, Package, ArrowRight,
  BookTemplate, X, Check, Info, Workflow, Settings2,
  Copy, MoreHorizontal, Layers, FileText, Video,
  PenTool, MousePointerClick, Eye, Send,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/i18n/context";

/* ─── Node Type Definitions ─── */
interface WorkflowNode {
  id: string;
  type: string;
  label: string;
  icon: string;
  config: Record<string, any>;
  position: { x: number; y: number };
}

interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  nodes: Omit<WorkflowNode, "id">[];
  icon: string;
}

const PLATFORM_COLORS: Record<string, string> = {
  instagram: "bg-gradient-to-br from-pink-500 to-orange-400",
  pinterest: "bg-red-600",
  etsy: "bg-orange-500",
  tiktok: "bg-foreground",
  x: "bg-foreground",
  facebook: "bg-blue-600",
  threads: "bg-foreground",
  printful: "bg-green-600",
};

const PLATFORM_ICONS: Record<string, React.ElementType> = {
  instagram: Instagram,
  pinterest: Globe,
  etsy: ShoppingBag,
  tiktok: Video,
  x: Twitter,
  facebook: Facebook,
  threads: FileText,
  printful: Package,
};

/* ─── Available Node Types ─── */
const NODE_CATEGORIES = [
  {
    id: "source",
    label: "Джерело",
    labelEn: "Source",
    nodes: [
      { type: "artwork_source", label: "Вибрати роботи", labelEn: "Select Artworks", icon: "🎨", desc: "Оберіть роботи для публікації", descEn: "Choose artworks to publish" },
      { type: "text_source", label: "Текстовий пост", labelEn: "Text Post", icon: "📝", desc: "Напишіть текст для публікації", descEn: "Write post text" },
      { type: "gallery_source", label: "Галерея / Карусель", labelEn: "Gallery / Carousel", icon: "🖼️", desc: "Кілька зображень в одному пості", descEn: "Multiple images in one post" },
      { type: "video_source", label: "Відео / Reels", labelEn: "Video / Reels", icon: "🎬", desc: "Відеоконтент для публікації", descEn: "Video content to publish" },
    ],
  },
  {
    id: "ai",
    label: "ШІ обробка",
    labelEn: "AI Processing",
    nodes: [
      { type: "ai_adapt", label: "ШІ адаптація", labelEn: "AI Adapt", icon: "✨", desc: "Автоматична адаптація під платформу", descEn: "Auto-adapt content per platform" },
      { type: "ai_hashtags", label: "ШІ хештеги", labelEn: "AI Hashtags", icon: "🏷️", desc: "Генерація релевантних хештегів", descEn: "Generate relevant hashtags" },
      { type: "ai_translate", label: "ШІ переклад", labelEn: "AI Translate", icon: "🌐", desc: "Переклад тексту для аудиторії", descEn: "Translate text for audience" },
      { type: "ai_image_edit", label: "ШІ обробка фото", labelEn: "AI Image Edit", icon: "🖌️", desc: "Кроп, фільтри, watermark", descEn: "Crop, filters, watermark" },
    ],
  },
  {
    id: "platform",
    label: "Платформи",
    labelEn: "Platforms",
    nodes: [
      { type: "instagram", label: "Instagram", icon: "📸", desc: "Пост, Reels, Stories" },
      { type: "pinterest", label: "Pinterest", icon: "📌", desc: "Pin з посиланням на маркет" },
      { type: "etsy", label: "Etsy", icon: "🛒", desc: "Публікація товару + Printful" },
      { type: "tiktok", label: "TikTok", icon: "🎵", desc: "Відео з AI адаптацією" },
      { type: "x", label: "X (Twitter)", icon: "𝕏", desc: "Твіт з медіа" },
      { type: "facebook", label: "Facebook", icon: "📘", desc: "Пост у стрічку або групу" },
      { type: "threads", label: "Threads", icon: "🧵", desc: "Пост у Threads" },
    ],
  },
  {
    id: "action",
    label: "Дії",
    labelEn: "Actions",
    nodes: [
      { type: "schedule", label: "Розклад", labelEn: "Schedule", icon: "⏰", desc: "Запланувати час публікації", descEn: "Schedule publish time" },
      { type: "printful_sync", label: "Printful синхронізація", labelEn: "Printful Sync", icon: "📦", desc: "Синхронізація з Printful", descEn: "Sync with Printful" },
      { type: "analytics_track", label: "Трекінг аналітики", labelEn: "Analytics Tracking", icon: "📊", desc: "Відстежувати результати", descEn: "Track campaign results" },
    ],
  },
];

const TEMPLATES: WorkflowTemplate[] = [
  {
    id: "instagram_post",
    name: "Instagram пост з картиною",
    description: "Вибір роботи → ШІ адаптація → Хештеги → Instagram",
    icon: "📸",
    nodes: [
      { type: "artwork_source", label: "Вибрати роботи", icon: "🎨", config: {}, position: { x: 60, y: 120 } },
      { type: "ai_adapt", label: "ШІ адаптація", icon: "✨", config: { platform: "instagram" }, position: { x: 340, y: 120 } },
      { type: "ai_hashtags", label: "ШІ хештеги", icon: "🏷️", config: {}, position: { x: 620, y: 120 } },
      { type: "instagram", label: "Instagram", icon: "📸", config: {}, position: { x: 900, y: 120 } },
    ],
  },
  {
    id: "multi_platform",
    name: "Мультиплатформна кампанія",
    description: "Одна робота → AI → 4 платформи одночасно",
    icon: "🚀",
    nodes: [
      { type: "artwork_source", label: "Вибрати роботи", icon: "🎨", config: {}, position: { x: 60, y: 200 } },
      { type: "ai_adapt", label: "ШІ адаптація", icon: "✨", config: {}, position: { x: 340, y: 200 } },
      { type: "instagram", label: "Instagram", icon: "📸", config: {}, position: { x: 640, y: 60 } },
      { type: "pinterest", label: "Pinterest", icon: "📌", config: {}, position: { x: 640, y: 170 } },
      { type: "facebook", label: "Facebook", icon: "📘", config: {}, position: { x: 640, y: 280 } },
      { type: "threads", label: "Threads", icon: "🧵", config: {}, position: { x: 640, y: 390 } },
    ],
  },
  {
    id: "etsy_printful",
    name: "Etsy + Printful товар",
    description: "Робота → Printful мокапи → Etsy публікація",
    icon: "🛒",
    nodes: [
      { type: "artwork_source", label: "Вибрати роботи", icon: "🎨", config: {}, position: { x: 60, y: 150 } },
      { type: "ai_image_edit", label: "ШІ обробка", icon: "🖌️", config: {}, position: { x: 340, y: 150 } },
      { type: "printful_sync", label: "Printful", icon: "📦", config: {}, position: { x: 620, y: 80 } },
      { type: "etsy", label: "Etsy", icon: "🛒", config: {}, position: { x: 620, y: 240 } },
    ],
  },
  {
    id: "tiktok_reels",
    name: "TikTok + Reels кампанія",
    description: "Відео → ШІ монтаж → TikTok + Instagram Reels",
    icon: "🎬",
    nodes: [
      { type: "video_source", label: "Відео", icon: "🎬", config: {}, position: { x: 60, y: 150 } },
      { type: "ai_adapt", label: "ШІ адаптація", icon: "✨", config: {}, position: { x: 340, y: 150 } },
      { type: "tiktok", label: "TikTok", icon: "🎵", config: {}, position: { x: 620, y: 80 } },
      { type: "instagram", label: "Instagram", icon: "📸", config: { format: "reels" }, position: { x: 620, y: 240 } },
    ],
  },
];

/* ─── Node Component ─── */
function WorkflowNodeCard({
  node, isSelected, onSelect, onDelete, onDragEnd,
}: {
  node: WorkflowNode;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onDragEnd: (pos: { x: number; y: number }) => void;
}) {
  const isPlatform = Object.keys(PLATFORM_COLORS).includes(node.type);
  const PlatformIcon = isPlatform ? PLATFORM_ICONS[node.type] : null;

  return (
    <motion.div
      drag
      dragMomentum={false}
      onDragEnd={(_, info) => {
        onDragEnd({
          x: node.position.x + info.offset.x,
          y: node.position.y + info.offset.y,
        });
      }}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.6 }}
      whileDrag={{ scale: 1.08, zIndex: 50 }}
      onClick={onSelect}
      className={`absolute cursor-grab active:cursor-grabbing select-none group`}
      style={{ left: node.position.x, top: node.position.y }}
    >
      <div className={`relative flex items-center gap-3 rounded-2xl border-2 px-4 py-3 backdrop-blur-md transition-all min-w-[160px] ${
        isSelected
          ? "border-primary bg-primary/10 shadow-lg shadow-primary/20"
          : "border-border/60 bg-card/80 hover:border-primary/40 hover:shadow-md"
      }`}>
        {/* Connector dots */}
        <div className="absolute -left-2 top-1/2 -translate-y-1/2 h-4 w-4 rounded-full border-2 border-primary/60 bg-background" />
        <div className="absolute -right-2 top-1/2 -translate-y-1/2 h-4 w-4 rounded-full border-2 border-primary/60 bg-primary/20" />

        {isPlatform && PlatformIcon ? (
          <div className={`flex h-10 w-10 items-center justify-center rounded-xl text-white shrink-0 ${PLATFORM_COLORS[node.type]}`}>
            <PlatformIcon className="h-5 w-5" />
          </div>
        ) : (
          <span className="text-2xl shrink-0">{node.icon}</span>
        )}

        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold truncate">{node.label}</p>
          <p className="text-[10px] text-muted-foreground capitalize">{node.type.replace(/_/g, " ")}</p>
        </div>

        {/* Delete button */}
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground text-[10px] opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <X className="h-3 w-3" />
        </button>
      </div>
    </motion.div>
  );
}

/* ─── Main Component ─── */
export default function WorkflowBuilderPage() {
  const { t } = useLanguage();
  const wf = t.workflow;
  const { toast } = useToast();

  const [nodes, setNodes] = useState<WorkflowNode[]>([]);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [workflowName, setWorkflowName] = useState("");
  const [templateDialog, setTemplateDialog] = useState(false);
  const [saveDialog, setSaveDialog] = useState(false);
  const [savedTemplates, setSavedTemplates] = useState<{ id: string; name: string; nodes: WorkflowNode[] }[]>([]);
  const [sidebarTab, setSidebarTab] = useState("nodes");
  const canvasRef = useRef<HTMLDivElement>(null);

  const addNode = useCallback((type: string, label: string, icon: string) => {
    const id = `${type}_${Date.now()}`;
    const offset = nodes.length * 30;
    setNodes((prev) => [
      ...prev,
      { id, type, label, icon, config: {}, position: { x: 200 + offset, y: 150 + offset } },
    ]);
  }, [nodes.length]);

  const deleteNode = useCallback((id: string) => {
    setNodes((prev) => prev.filter((n) => n.id !== id));
    if (selectedNode === id) setSelectedNode(null);
  }, [selectedNode]);

  const updateNodePosition = useCallback((id: string, pos: { x: number; y: number }) => {
    setNodes((prev) => prev.map((n) => (n.id === id ? { ...n, position: { x: Math.max(0, pos.x), y: Math.max(0, pos.y) } } : n)));
  }, []);

  const loadTemplate = useCallback((template: WorkflowTemplate) => {
    const newNodes = template.nodes.map((n, i) => ({
      ...n,
      id: `${n.type}_${Date.now()}_${i}`,
    }));
    setNodes(newNodes);
    setWorkflowName(template.name);
    setTemplateDialog(false);
    toast({ title: wf.template_loaded, description: template.name });
  }, [toast, wf]);

  const saveAsTemplate = useCallback(() => {
    if (!workflowName.trim()) return;
    const tpl = { id: `custom_${Date.now()}`, name: workflowName, nodes: [...nodes] };
    setSavedTemplates((prev) => [...prev, tpl]);
    setSaveDialog(false);
    toast({ title: wf.template_saved, description: workflowName });
  }, [workflowName, nodes, toast, wf]);

  const runWorkflow = useCallback(() => {
    if (nodes.length === 0) {
      toast({ title: wf.empty_workflow, variant: "destructive" });
      return;
    }
    toast({ title: wf.workflow_started, description: `${nodes.length} ${wf.nodes_processing}` });
  }, [nodes, toast, wf]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card/60 backdrop-blur-md sticky top-0 z-40">
        <div className="container max-w-[1600px] flex items-center justify-between py-3 px-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10">
              <Workflow className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="font-serif text-lg font-bold">{wf.title}</h1>
              <p className="text-xs text-muted-foreground">{wf.desc}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Input
              value={workflowName}
              onChange={(e) => setWorkflowName(e.target.value)}
              placeholder={wf.workflow_name}
              className="w-48 rounded-full text-sm h-9"
            />
            <Button size="sm" variant="outline" className="gap-1.5 rounded-full" onClick={() => setTemplateDialog(true)}>
              <BookTemplate className="h-4 w-4" />
              <span className="hidden sm:inline">{wf.templates}</span>
            </Button>
            <Button size="sm" variant="outline" className="gap-1.5 rounded-full" onClick={() => setSaveDialog(true)}>
              <Save className="h-4 w-4" />
              <span className="hidden sm:inline">{wf.save}</span>
            </Button>
            <Button size="sm" className="gap-1.5 rounded-full" onClick={runWorkflow}>
              <Play className="h-4 w-4" />
              {wf.run}
            </Button>
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-120px)]">
        {/* Left Sidebar — Node Library */}
        <div className="w-72 border-r border-border bg-card/40 backdrop-blur-sm overflow-y-auto shrink-0">
          <Tabs value={sidebarTab} onValueChange={setSidebarTab} className="w-full">
            <TabsList className="w-full rounded-none border-b border-border bg-transparent h-11">
              <TabsTrigger value="nodes" className="flex-1 text-xs rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary">
                {wf.nodes}
              </TabsTrigger>
              <TabsTrigger value="guide" className="flex-1 text-xs rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary">
                {wf.guide}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="nodes" className="mt-0 p-3 space-y-4">
              {NODE_CATEGORIES.map((cat) => (
                <div key={cat.id}>
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold mb-2 px-1">
                    {cat.label}
                  </p>
                  <div className="space-y-1.5">
                    {cat.nodes.map((n) => (
                      <motion.button
                        key={n.type}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => addNode(n.type, n.label, n.icon)}
                        className="flex w-full items-center gap-2.5 rounded-xl border border-border/50 bg-background/60 px-3 py-2.5 text-left hover:border-primary/40 hover:bg-primary/5 transition-all group"
                      >
                        <span className="text-lg">{n.icon}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold truncate">{n.label}</p>
                          <p className="text-[10px] text-muted-foreground truncate">{n.desc}</p>
                        </div>
                        <Plus className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </motion.button>
                    ))}
                  </div>
                </div>
              ))}
            </TabsContent>

            <TabsContent value="guide" className="mt-0 p-4 space-y-4">
              <div className="space-y-3">
                <div className="rounded-xl border border-primary/20 bg-primary/5 p-3">
                  <h4 className="text-xs font-bold flex items-center gap-1.5 mb-1.5">
                    <Info className="h-3.5 w-3.5 text-primary" />
                    {wf.how_it_works}
                  </h4>
                  <ol className="text-[11px] text-muted-foreground space-y-1.5 list-decimal list-inside">
                    <li>{wf.step_1}</li>
                    <li>{wf.step_2}</li>
                    <li>{wf.step_3}</li>
                    <li>{wf.step_4}</li>
                  </ol>
                </div>

                <div className="rounded-xl border border-border bg-muted/30 p-3">
                  <h4 className="text-xs font-bold mb-1.5">{wf.platforms_info}</h4>
                  <div className="space-y-2">
                    {[
                      { name: "Instagram", desc: wf.insta_desc, color: "from-pink-500 to-orange-400" },
                      { name: "Pinterest", desc: wf.pinterest_desc, color: "from-red-500 to-red-600" },
                      { name: "Etsy", desc: wf.etsy_desc, color: "from-orange-500 to-orange-600" },
                      { name: "TikTok", desc: wf.tiktok_desc, color: "from-foreground/80 to-foreground" },
                      { name: "X", desc: wf.x_desc, color: "from-foreground/80 to-foreground" },
                      { name: "Facebook", desc: wf.fb_desc, color: "from-blue-500 to-blue-600" },
                      { name: "Threads", desc: wf.threads_desc, color: "from-foreground/80 to-foreground" },
                    ].map((p) => (
                      <div key={p.name} className="flex items-start gap-2">
                        <div className={`mt-0.5 h-4 w-4 rounded bg-gradient-to-br ${p.color} shrink-0`} />
                        <div>
                          <p className="text-[11px] font-semibold">{p.name}</p>
                          <p className="text-[10px] text-muted-foreground">{p.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl border border-border bg-muted/30 p-3">
                  <h4 className="text-xs font-bold mb-1.5 flex items-center gap-1.5">
                    <Package className="h-3.5 w-3.5" />
                    Printful
                  </h4>
                  <p className="text-[10px] text-muted-foreground">{wf.printful_desc}</p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Canvas */}
        <div className="flex-1 relative overflow-hidden bg-[radial-gradient(circle_at_center,hsl(var(--muted)/0.3)_1px,transparent_1px)] bg-[length:24px_24px]" ref={canvasRef}>
          {/* Empty state */}
          {nodes.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center max-w-sm"
              >
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-primary/10">
                  <Workflow className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-serif text-lg font-bold mb-2">{wf.empty_title}</h3>
                <p className="text-sm text-muted-foreground mb-4">{wf.empty_desc}</p>
                <Button variant="outline" className="rounded-full gap-1.5" onClick={() => setTemplateDialog(true)}>
                  <BookTemplate className="h-4 w-4" />
                  {wf.use_template}
                </Button>
              </motion.div>
            </div>
          )}

          {/* Render Nodes */}
          <AnimatePresence>
            {nodes.map((node) => (
              <WorkflowNodeCard
                key={node.id}
                node={node}
                isSelected={selectedNode === node.id}
                onSelect={() => setSelectedNode(node.id === selectedNode ? null : node.id)}
                onDelete={() => deleteNode(node.id)}
                onDragEnd={(pos) => updateNodePosition(node.id, pos)}
              />
            ))}
          </AnimatePresence>

          {/* SVG connections */}
          {nodes.length > 1 && (
            <svg className="absolute inset-0 pointer-events-none" style={{ width: "100%", height: "100%" }}>
              <defs>
                <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.8" />
                </linearGradient>
              </defs>
              {nodes.slice(0, -1).map((n, i) => {
                const next = nodes[i + 1];
                if (!next) return null;
                const x1 = n.position.x + 170;
                const y1 = n.position.y + 28;
                const x2 = next.position.x;
                const y2 = next.position.y + 28;
                const mx = (x1 + x2) / 2;
                return (
                  <motion.path
                    key={`${n.id}-${next.id}`}
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 0.6, delay: i * 0.1 }}
                    d={`M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`}
                    fill="none"
                    stroke="url(#lineGrad)"
                    strokeWidth="2"
                    strokeDasharray="6 4"
                  />
                );
              })}
            </svg>
          )}

          {/* Bottom toolbar */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 rounded-2xl border border-border bg-card/90 backdrop-blur-md px-4 py-2 shadow-lg">
            <Badge variant="secondary" className="text-xs rounded-full">
              {nodes.length} {wf.nodes_count}
            </Badge>
            <div className="h-4 w-px bg-border" />
            <Button size="sm" variant="ghost" className="h-7 text-xs rounded-full" onClick={() => setNodes([])}>
              <Trash2 className="h-3.5 w-3.5 mr-1" />
              {wf.clear}
            </Button>
          </div>
        </div>

        {/* Right Sidebar — Node Config */}
        <AnimatePresence>
          {selectedNode && (() => {
            const node = nodes.find((n) => n.id === selectedNode);
            if (!node) return null;
            return (
              <motion.div
                initial={{ x: 300, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 300, opacity: 0 }}
                className="w-72 border-l border-border bg-card/40 backdrop-blur-sm overflow-y-auto shrink-0 p-4"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold">{wf.node_settings}</h3>
                  <Button size="icon" variant="ghost" className="h-7 w-7 rounded-full" onClick={() => setSelectedNode(null)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3 rounded-xl border border-border bg-background/60 p-3">
                    <span className="text-2xl">{node.icon}</span>
                    <div>
                      <p className="text-sm font-semibold">{node.label}</p>
                      <p className="text-[10px] text-muted-foreground">{node.type}</p>
                    </div>
                  </div>

                  {/* Platform-specific config */}
                  {["instagram", "tiktok"].includes(node.type) && (
                    <div className="space-y-2">
                      <label className="text-xs font-medium">{wf.post_format}</label>
                      <Select defaultValue="post">
                        <SelectTrigger className="rounded-xl text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="post">Post</SelectItem>
                          <SelectItem value="reels">Reels</SelectItem>
                          <SelectItem value="story">Story</SelectItem>
                          <SelectItem value="carousel">Carousel</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {node.type === "etsy" && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-medium">Printful інтеграція</label>
                        <Switch />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-medium">{wf.product_type}</label>
                        <Select defaultValue="print">
                          <SelectTrigger className="rounded-xl text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="print">Art Print</SelectItem>
                            <SelectItem value="canvas">Canvas</SelectItem>
                            <SelectItem value="poster">Poster</SelectItem>
                            <SelectItem value="tshirt">T-Shirt</SelectItem>
                            <SelectItem value="mug">Mug</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}

                  {node.type === "ai_adapt" && (
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <label className="text-xs font-medium">{wf.tone}</label>
                        <Select defaultValue="professional">
                          <SelectTrigger className="rounded-xl text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="professional">Professional</SelectItem>
                            <SelectItem value="casual">Casual</SelectItem>
                            <SelectItem value="artistic">Artistic</SelectItem>
                            <SelectItem value="minimal">Minimal</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-medium">{wf.auto_crop}</label>
                        <Switch defaultChecked />
                      </div>
                    </div>
                  )}

                  {node.type === "schedule" && (
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <label className="text-xs font-medium">{wf.schedule_time}</label>
                        <Input type="datetime-local" className="rounded-xl text-xs" />
                      </div>
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-medium">{wf.repeat}</label>
                        <Switch />
                      </div>
                    </div>
                  )}

                  {node.type === "ai_hashtags" && (
                    <div className="space-y-2">
                      <label className="text-xs font-medium">{wf.max_hashtags}</label>
                      <Input type="number" defaultValue="15" className="rounded-xl text-xs" />
                    </div>
                  )}

                  <div className="space-y-2">
                    <label className="text-xs font-medium">{wf.caption}</label>
                    <Textarea placeholder={wf.caption_placeholder} className="rounded-xl text-xs resize-none" rows={3} />
                  </div>
                </div>
              </motion.div>
            );
          })()}
        </AnimatePresence>
      </div>

      {/* Templates Dialog */}
      <Dialog open={templateDialog} onOpenChange={setTemplateDialog}>
        <DialogContent className="max-w-lg rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookTemplate className="h-5 w-5 text-primary" />
              {wf.templates}
            </DialogTitle>
            <DialogDescription>{wf.templates_desc}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 max-h-96 overflow-y-auto py-2">
            {TEMPLATES.map((tpl) => (
              <motion.button
                key={tpl.id}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => loadTemplate(tpl)}
                className="flex w-full items-center gap-4 rounded-xl border border-border bg-background/60 p-4 text-left hover:border-primary/40 hover:bg-primary/5 transition-all"
              >
                <span className="text-3xl">{tpl.icon}</span>
                <div className="flex-1">
                  <p className="text-sm font-semibold">{tpl.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{tpl.description}</p>
                  <div className="flex items-center gap-1 mt-2">
                    <Badge variant="secondary" className="text-[10px] rounded-full px-2 py-0">
                      {tpl.nodes.length} {wf.nodes_count}
                    </Badge>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </motion.button>
            ))}

            {savedTemplates.length > 0 && (
              <>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1 pt-2">{wf.my_templates}</p>
                {savedTemplates.map((tpl) => (
                  <motion.button
                    key={tpl.id}
                    whileHover={{ scale: 1.01 }}
                    onClick={() => { setNodes(tpl.nodes); setWorkflowName(tpl.name); setTemplateDialog(false); }}
                    className="flex w-full items-center gap-4 rounded-xl border border-primary/20 bg-primary/5 p-4 text-left hover:bg-primary/10 transition-all"
                  >
                    <span className="text-2xl">💾</span>
                    <div className="flex-1">
                      <p className="text-sm font-semibold">{tpl.name}</p>
                      <Badge variant="secondary" className="text-[10px] rounded-full px-2 py-0 mt-1">
                        {tpl.nodes.length} {wf.nodes_count}
                      </Badge>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </motion.button>
                ))}
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Save Dialog */}
      <Dialog open={saveDialog} onOpenChange={setSaveDialog}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle>{wf.save_template}</DialogTitle>
            <DialogDescription>{wf.save_template_desc}</DialogDescription>
          </DialogHeader>
          <Input
            value={workflowName}
            onChange={(e) => setWorkflowName(e.target.value)}
            placeholder={wf.workflow_name}
            className="rounded-xl"
          />
          <DialogFooter>
            <Button variant="outline" className="rounded-full" onClick={() => setSaveDialog(false)}>{wf.cancel}</Button>
            <Button className="rounded-full gap-1.5" onClick={saveAsTemplate}>
              <Save className="h-4 w-4" />{wf.save}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
