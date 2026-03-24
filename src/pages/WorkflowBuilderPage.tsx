import { useState, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Image, Sparkles, Instagram, Facebook, Twitter, ShoppingBag,
  Play, Save, Trash2, Plus, ChevronRight,
  Zap, Clock, Globe, Package, ArrowRight,
  BookTemplate, X, Check, Info, Workflow, Settings2,
  Copy, MoreHorizontal, Layers, FileText, Video,
  Eye, Send, AlertTriangle, CheckCircle2, Loader2,
  ZoomIn, ZoomOut, Maximize, TestTube,
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
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/i18n/context";
import { useWorkflows, useCreateWorkflow, useUpdateWorkflow } from "@/hooks/useSocialHub";
import { useExecuteWorkflow, useTestWorkflow } from "@/hooks/useArtflow";
import ExecutionPanel from "@/components/artflow/ExecutionPanel";
import NodeConfigPanel from "@/components/artflow/NodeConfigPanel";
import AIAssistantChat from "@/components/artflow/AIAssistantChat";
import GhostWizard from "@/components/artflow/GhostWizard";

/* ─── Node Type Definitions ─── */
interface WorkflowNode {
  id: string;
  type: string;
  label: string;
  icon: string;
  config: Record<string, any>;
  position: { x: number; y: number };
  status?: "idle" | "running" | "done" | "error";
}

interface Connection {
  from: string;
  to: string;
}

interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  nodes: Omit<WorkflowNode, "id">[];
  connections?: { fromIdx: number; toIdx: number }[];
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

const CATEGORY_COLORS: Record<string, string> = {
  source: "border-emerald-500/40",
  ai: "border-violet-500/40",
  platform: "border-blue-500/40",
  action: "border-amber-500/40",
};

/* ─── Available Node Types ─── */
const NODE_CATEGORIES = [
  {
    id: "source",
    label: "Джерело",
    labelEn: "Source",
    color: "text-emerald-500",
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
    color: "text-violet-500",
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
    color: "text-blue-500",
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
    color: "text-amber-500",
    nodes: [
      { type: "schedule", label: "Розклад", labelEn: "Schedule", icon: "⏰", desc: "Запланувати час публікації", descEn: "Schedule publish time" },
      { type: "printful_sync", label: "Printful синхронізація", labelEn: "Printful Sync", icon: "📦", desc: "Синхронізація з Printful", descEn: "Sync with Printful" },
      { type: "analytics_track", label: "Трекінг аналітики", labelEn: "Analytics Tracking", icon: "📊", desc: "Відстежувати результати", descEn: "Track campaign results" },
    ],
  },
];

const TEMPLATES: WorkflowTemplate[] = [
  {
    id: "instagram_post", name: "Instagram пост з картиною", description: "Вибір роботи → ШІ адаптація → Хештеги → Instagram", icon: "📸",
    nodes: [
      { type: "artwork_source", label: "Вибрати роботи", icon: "🎨", config: {}, position: { x: 60, y: 120 } },
      { type: "ai_adapt", label: "ШІ адаптація", icon: "✨", config: { platform: "instagram" }, position: { x: 320, y: 120 } },
      { type: "ai_hashtags", label: "ШІ хештеги", icon: "🏷️", config: {}, position: { x: 580, y: 120 } },
      { type: "instagram", label: "Instagram", icon: "📸", config: {}, position: { x: 840, y: 120 } },
    ],
    connections: [{ fromIdx: 0, toIdx: 1 }, { fromIdx: 1, toIdx: 2 }, { fromIdx: 2, toIdx: 3 }],
  },
  {
    id: "multi_platform", name: "Мультиплатформна кампанія", description: "Одна робота → AI → 4 платформи", icon: "🚀",
    nodes: [
      { type: "artwork_source", label: "Вибрати роботи", icon: "🎨", config: {}, position: { x: 60, y: 200 } },
      { type: "ai_adapt", label: "ШІ адаптація", icon: "✨", config: {}, position: { x: 320, y: 200 } },
      { type: "instagram", label: "Instagram", icon: "📸", config: {}, position: { x: 600, y: 60 } },
      { type: "pinterest", label: "Pinterest", icon: "📌", config: {}, position: { x: 600, y: 170 } },
      { type: "facebook", label: "Facebook", icon: "📘", config: {}, position: { x: 600, y: 280 } },
      { type: "threads", label: "Threads", icon: "🧵", config: {}, position: { x: 600, y: 390 } },
    ],
    connections: [{ fromIdx: 0, toIdx: 1 }, { fromIdx: 1, toIdx: 2 }, { fromIdx: 1, toIdx: 3 }, { fromIdx: 1, toIdx: 4 }, { fromIdx: 1, toIdx: 5 }],
  },
  {
    id: "etsy_printful", name: "Etsy + Printful товар", description: "Робота → Printful мокапи → Etsy публікація", icon: "🛒",
    nodes: [
      { type: "artwork_source", label: "Вибрати роботи", icon: "🎨", config: {}, position: { x: 60, y: 150 } },
      { type: "ai_image_edit", label: "ШІ обробка", icon: "🖌️", config: {}, position: { x: 320, y: 150 } },
      { type: "printful_sync", label: "Printful", icon: "📦", config: {}, position: { x: 580, y: 80 } },
      { type: "etsy", label: "Etsy", icon: "🛒", config: {}, position: { x: 580, y: 240 } },
    ],
    connections: [{ fromIdx: 0, toIdx: 1 }, { fromIdx: 1, toIdx: 2 }, { fromIdx: 1, toIdx: 3 }],
  },
  {
    id: "tiktok_reels", name: "TikTok + Reels кампанія", description: "Відео → ШІ монтаж → TikTok + Reels", icon: "🎬",
    nodes: [
      { type: "video_source", label: "Відео", icon: "🎬", config: {}, position: { x: 60, y: 150 } },
      { type: "ai_adapt", label: "ШІ адаптація", icon: "✨", config: {}, position: { x: 320, y: 150 } },
      { type: "tiktok", label: "TikTok", icon: "🎵", config: {}, position: { x: 580, y: 80 } },
      { type: "instagram", label: "Instagram", icon: "📸", config: { format: "reels" }, position: { x: 580, y: 240 } },
    ],
    connections: [{ fromIdx: 0, toIdx: 1 }, { fromIdx: 1, toIdx: 2 }, { fromIdx: 1, toIdx: 3 }],
  },
];

/* ─── Helpers ─── */
function getNodeCategory(type: string): string {
  for (const cat of NODE_CATEGORIES) {
    if (cat.nodes.some(n => n.type === type)) return cat.id;
  }
  return "action";
}

/* ─── Node Component ─── */
function WorkflowNodeCard({
  node, isSelected, onSelect, onDelete, onDragEnd, onStartConnect, connectingFrom,
}: {
  node: WorkflowNode;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onDragEnd: (pos: { x: number; y: number }) => void;
  onStartConnect: (id: string) => void;
  connectingFrom: string | null;
}) {
  const isPlatform = Object.keys(PLATFORM_COLORS).includes(node.type);
  const PlatformIcon = isPlatform ? PLATFORM_ICONS[node.type] : null;
  const category = getNodeCategory(node.type);
  const catBorder = CATEGORY_COLORS[category] || "border-border/60";

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
      className="absolute cursor-grab active:cursor-grabbing select-none group"
      style={{ left: node.position.x, top: node.position.y }}
    >
      <div className={`relative flex items-center gap-3 rounded-2xl border-2 px-4 py-3 backdrop-blur-md transition-all min-w-[170px] ${
        isSelected
          ? "border-primary bg-primary/10 shadow-lg shadow-primary/20"
          : `${catBorder} bg-card/90 hover:border-primary/40 hover:shadow-md`
      }`}>
        {/* Status indicator */}
        {node.status && node.status !== "idle" && (
          <div className="absolute -top-1.5 -left-1.5">
            {node.status === "running" && <Loader2 className="h-4 w-4 text-primary animate-spin" />}
            {node.status === "done" && <CheckCircle2 className="h-4 w-4 text-green-500" />}
            {node.status === "error" && <AlertTriangle className="h-4 w-4 text-destructive" />}
          </div>
        )}

        {/* Input connector */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (connectingFrom && connectingFrom !== node.id) {
              onStartConnect(node.id);
            }
          }}
          className={`absolute -left-2.5 top-1/2 -translate-y-1/2 h-5 w-5 rounded-full border-2 transition-all ${
            connectingFrom && connectingFrom !== node.id
              ? "border-primary bg-primary/30 scale-125"
              : "border-primary/50 bg-background hover:border-primary hover:bg-primary/20"
          }`}
        />

        {/* Output connector */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onStartConnect(node.id);
          }}
          className={`absolute -right-2.5 top-1/2 -translate-y-1/2 h-5 w-5 rounded-full border-2 transition-all ${
            connectingFrom === node.id
              ? "border-primary bg-primary scale-125"
              : "border-primary/50 bg-primary/20 hover:border-primary hover:bg-primary/40"
          }`}
        />

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
  const [connections, setConnections] = useState<Connection[]>([]);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [connectingFrom, setConnectingFrom] = useState<string | null>(null);
  const [workflowName, setWorkflowName] = useState("");
  const [templateDialog, setTemplateDialog] = useState(false);
  const [saveDialog, setSaveDialog] = useState(false);
  const [savedTemplates, setSavedTemplates] = useState<{ id: string; name: string; nodes: WorkflowNode[]; connections: Connection[] }[]>([]);
  const [sidebarTab, setSidebarTab] = useState("nodes");
  const [isRunning, setIsRunning] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [savedWorkflowId, setSavedWorkflowId] = useState<string | null>(null);
  const [executionId, setExecutionId] = useState<string | null>(null);
  const [wizardDone, setWizardDone] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);

  // API hooks for real execution
  const createWorkflowMut = useCreateWorkflow();
  const updateWorkflowMut = useUpdateWorkflow();
  const executeWorkflowMut = useExecuteWorkflow();
  const testWorkflowMut = useTestWorkflow();

  const addNode = useCallback((type: string, label: string, icon: string) => {
    const id = `${type}_${Date.now()}`;
    const offset = nodes.length * 40;
    setNodes(prev => [...prev, { id, type, label, icon, config: {}, position: { x: 200 + offset, y: 150 + (offset % 120) }, status: "idle" }]);
  }, [nodes.length]);

  const deleteNode = useCallback((id: string) => {
    setNodes(prev => prev.filter(n => n.id !== id));
    setConnections(prev => prev.filter(c => c.from !== id && c.to !== id));
    if (selectedNode === id) setSelectedNode(null);
  }, [selectedNode]);

  const updateNodePosition = useCallback((id: string, pos: { x: number; y: number }) => {
    setNodes(prev => prev.map(n => n.id === id ? { ...n, position: { x: Math.max(0, pos.x), y: Math.max(0, pos.y) } } : n));
  }, []);

  const handleConnect = useCallback((nodeId: string) => {
    if (!connectingFrom) {
      setConnectingFrom(nodeId);
      return;
    }
    if (connectingFrom === nodeId) {
      setConnectingFrom(null);
      return;
    }
    // Check for duplicate
    const exists = connections.some(c => c.from === connectingFrom && c.to === nodeId);
    if (!exists) {
      setConnections(prev => [...prev, { from: connectingFrom, to: nodeId }]);
    }
    setConnectingFrom(null);
  }, [connectingFrom, connections]);

  const loadTemplate = useCallback((template: WorkflowTemplate) => {
    const newNodes = template.nodes.map((n, i) => ({ ...n, id: `${n.type}_${Date.now()}_${i}`, status: "idle" as const }));
    setNodes(newNodes);
    const newConns = (template.connections || []).map(c => ({
      from: newNodes[c.fromIdx]?.id || "",
      to: newNodes[c.toIdx]?.id || "",
    })).filter(c => c.from && c.to);
    setConnections(newConns);
    setWorkflowName(template.name);
    setTemplateDialog(false);
    toast({ title: wf.template_loaded, description: template.name });
  }, [toast, wf]);

  const saveAsTemplate = useCallback(() => {
    if (!workflowName.trim()) return;
    setSavedTemplates(prev => [...prev, { id: `custom_${Date.now()}`, name: workflowName, nodes: [...nodes], connections: [...connections] }]);
    setSaveDialog(false);
    toast({ title: wf.template_saved, description: workflowName });
  }, [workflowName, nodes, connections, toast, wf]);

  const saveWorkflow = useCallback(async () => {
    if (!workflowName.trim()) return null;
    const payload = {
      name: workflowName,
      nodes: JSON.stringify(nodes),
      connections: JSON.stringify(connections),
      trigger_type: "manual",
    };
    try {
      if (savedWorkflowId) {
        await updateWorkflowMut.mutateAsync({ id: savedWorkflowId, ...payload });
        return savedWorkflowId;
      } else {
        const result = await createWorkflowMut.mutateAsync(payload);
        setSavedWorkflowId(result.id);
        return result.id;
      }
    } catch {
      toast({ title: "Failed to save workflow", variant: "destructive" });
      return null;
    }
  }, [workflowName, nodes, connections, savedWorkflowId, createWorkflowMut, updateWorkflowMut, toast]);

  const runWorkflow = useCallback(async () => {
    if (nodes.length === 0) {
      toast({ title: wf.empty_workflow, variant: "destructive" });
      return;
    }
    setIsRunning(true);
    try {
      // Save first, then execute
      const wfId = await saveWorkflow();
      if (!wfId) {
        // Fallback to simulated execution if no name set
        nodes.forEach((node, i) => {
          setTimeout(() => setNodes(prev => prev.map((n, j) => j === i ? { ...n, status: "running" } : n)), i * 800);
          setTimeout(() => {
            setNodes(prev => prev.map((n, j) => j === i ? { ...n, status: "done" } : n));
            if (i === nodes.length - 1) setTimeout(() => setIsRunning(false), 400);
          }, i * 800 + 600);
        });
        toast({ title: wf.workflow_started, description: `${nodes.length} ${wf.nodes_processing}` });
        return;
      }
      const exec = await executeWorkflowMut.mutateAsync(wfId);
      setExecutionId(exec.id);
      toast({ title: wf.workflow_started, description: `${nodes.length} ${wf.nodes_processing}` });
    } catch {
      toast({ title: "Execution failed", variant: "destructive" });
    } finally {
      setIsRunning(false);
    }
  }, [nodes, saveWorkflow, executeWorkflowMut, toast, wf]);

  const testWorkflow = useCallback(async () => {
    if (nodes.length === 0) return;
    const wfId = await saveWorkflow();
    if (!wfId) return;
    try {
      const exec = await testWorkflowMut.mutateAsync(wfId);
      setExecutionId(exec.id);
      toast({ title: "Test started" });
    } catch {
      toast({ title: "Test failed", variant: "destructive" });
    }
  }, [nodes, saveWorkflow, testWorkflowMut, toast]);

  const updateNodeConfig = useCallback((nodeId: string, config: Record<string, any>) => {
    setNodes(prev => prev.map(n => n.id === nodeId ? { ...n, config } : n));
  }, []);

  const deleteConnection = useCallback((from: string, to: string) => {
    setConnections(prev => prev.filter(c => !(c.from === from && c.to === to)));
  }, []);

  const handleApplyAIWorkflow = useCallback((aiNodes: unknown[], aiConnections: unknown[]) => {
    const newNodes = (aiNodes as any[]).map((n, i) => ({
      ...n,
      id: `${n.type}_${Date.now()}_${i}`,
      status: "idle" as const,
      position: n.position || { x: 60 + i * 260, y: 150 },
      config: n.config || {},
    }));
    setNodes(newNodes);
    const newConns = (aiConnections as any[]).map(c => ({
      from: newNodes[c.fromIdx]?.id || c.from || "",
      to: newNodes[c.toIdx]?.id || c.to || "",
    })).filter(c => c.from && c.to);
    setConnections(newConns);
  }, []);

  // Validation warnings
  const warnings = useMemo(() => {
    const w: string[] = [];
    const hasSource = nodes.some(n => getNodeCategory(n.type) === "source");
    const hasPlatform = nodes.some(n => getNodeCategory(n.type) === "platform");
    if (nodes.length > 0 && !hasSource) w.push("Додайте вузол-джерело");
    if (nodes.length > 0 && !hasPlatform) w.push("Додайте платформу для публікації");
    // Check for disconnected nodes
    const connectedIds = new Set(connections.flatMap(c => [c.from, c.to]));
    const disconnected = nodes.filter(n => nodes.length > 1 && !connectedIds.has(n.id));
    if (disconnected.length > 0) w.push(`${disconnected.length} вузл(ів) не з'єднані`);
    return w;
  }, [nodes, connections]);

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

            {warnings.length > 0 && (
              <Badge variant="secondary" className="rounded-full gap-1 text-[10px] text-amber-600 bg-amber-500/10">
                <AlertTriangle className="h-3 w-3" />
                {warnings.length}
              </Badge>
            )}

            <Button size="sm" variant="outline" className="gap-1.5 rounded-full" onClick={() => setTemplateDialog(true)}>
              <BookTemplate className="h-4 w-4" />
              <span className="hidden sm:inline">{wf.templates}</span>
            </Button>
            <Button size="sm" variant="outline" className="gap-1.5 rounded-full" onClick={() => setSaveDialog(true)}>
              <Save className="h-4 w-4" />
              <span className="hidden sm:inline">{wf.save}</span>
            </Button>
            <Button size="sm" variant="outline" className="gap-1.5 rounded-full" onClick={testWorkflow} disabled={isRunning || nodes.length === 0 || testWorkflowMut.isPending}>
              {testWorkflowMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <TestTube className="h-4 w-4" />}
              <span className="hidden sm:inline">Test</span>
            </Button>
            <Button size="sm" className="gap-1.5 rounded-full" onClick={runWorkflow} disabled={isRunning || nodes.length === 0}>
              {isRunning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
              {wf.run}
            </Button>
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-120px)]">
        {/* Left Sidebar */}
        <div className="w-72 border-r border-border bg-card/40 backdrop-blur-sm overflow-y-auto shrink-0">
          <Tabs value={sidebarTab} onValueChange={setSidebarTab} className="w-full">
            <TabsList className="w-full rounded-none border-b border-border bg-transparent h-11">
              <TabsTrigger value="nodes" className="flex-1 text-xs rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary">{wf.nodes}</TabsTrigger>
              <TabsTrigger value="guide" className="flex-1 text-xs rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary">{wf.guide}</TabsTrigger>
            </TabsList>

            <TabsContent value="nodes" className="mt-0 p-3 space-y-4">
              {NODE_CATEGORIES.map(cat => (
                <div key={cat.id}>
                  <p className={`text-[10px] uppercase tracking-widest font-semibold mb-2 px-1 ${cat.color}`}>{cat.label}</p>
                  <div className="space-y-1.5">
                    {cat.nodes.map(n => (
                      <motion.button
                        key={n.type}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => addNode(n.type, n.label, n.icon)}
                        className={`flex w-full items-center gap-2.5 rounded-xl border bg-background/60 px-3 py-2.5 text-left hover:bg-primary/5 transition-all group ${CATEGORY_COLORS[cat.id] || "border-border/50"}`}
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
                  <h4 className="text-xs font-bold mb-2">{wf.platforms_info}</h4>
                  <div className="space-y-2">
                    {[
                      { name: "Instagram", desc: wf.insta_desc, color: "from-pink-500 to-orange-400" },
                      { name: "Pinterest", desc: wf.pinterest_desc, color: "from-red-500 to-red-600" },
                      { name: "Etsy", desc: wf.etsy_desc, color: "from-orange-500 to-orange-600" },
                      { name: "TikTok", desc: wf.tiktok_desc, color: "from-foreground/80 to-foreground" },
                      { name: "X", desc: wf.x_desc, color: "from-foreground/80 to-foreground" },
                      { name: "Facebook", desc: wf.fb_desc, color: "from-blue-500 to-blue-600" },
                      { name: "Threads", desc: wf.threads_desc, color: "from-foreground/80 to-foreground" },
                    ].map(p => (
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
          {/* Connecting mode overlay */}
          {connectingFrom && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30">
              <Badge className="rounded-full bg-primary text-primary-foreground gap-1.5 px-4 py-1.5 shadow-lg">
                <ArrowRight className="h-3.5 w-3.5" />
                Клікніть на вузол для з'єднання
                <button onClick={() => setConnectingFrom(null)} className="ml-1"><X className="h-3 w-3" /></button>
              </Badge>
            </div>
          )}

          {/* Empty state */}
          {nodes.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-sm">
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

          {/* SVG connections */}
          <svg className="absolute inset-0 pointer-events-none" style={{ width: "100%", height: "100%", transform: `scale(${zoom})`, transformOrigin: "0 0" }}>
            <defs>
              <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.5" />
                <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.9" />
              </linearGradient>
              <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill="hsl(var(--primary))" fillOpacity="0.6" />
              </marker>
            </defs>
            {connections.map((conn, i) => {
              const fromNode = nodes.find(n => n.id === conn.from);
              const toNode = nodes.find(n => n.id === conn.to);
              if (!fromNode || !toNode) return null;
              const x1 = fromNode.position.x + 180;
              const y1 = fromNode.position.y + 28;
              const x2 = toNode.position.x;
              const y2 = toNode.position.y + 28;
              const mx = (x1 + x2) / 2;
              return (
                <motion.path
                  key={`${conn.from}-${conn.to}`}
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.5, delay: i * 0.08 }}
                  d={`M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`}
                  fill="none"
                  stroke="url(#lineGrad)"
                  strokeWidth="2"
                  markerEnd="url(#arrowhead)"
                />
              );
            })}
          </svg>

          {/* Render Nodes */}
          <div style={{ transform: `scale(${zoom})`, transformOrigin: "0 0" }}>
            <AnimatePresence>
              {nodes.map(node => (
                <WorkflowNodeCard
                  key={node.id}
                  node={node}
                  isSelected={selectedNode === node.id}
                  onSelect={() => setSelectedNode(node.id === selectedNode ? null : node.id)}
                  onDelete={() => deleteNode(node.id)}
                  onDragEnd={pos => updateNodePosition(node.id, pos)}
                  onStartConnect={handleConnect}
                  connectingFrom={connectingFrom}
                />
              ))}
            </AnimatePresence>
          </div>

          {/* Bottom toolbar */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 rounded-2xl border border-border bg-card/90 backdrop-blur-md px-4 py-2 shadow-lg">
            <Badge variant="secondary" className="text-xs rounded-full">{nodes.length} {wf.nodes_count}</Badge>
            <div className="h-4 w-px bg-border" />

            {/* Zoom controls */}
            <Button size="icon" variant="ghost" className="h-7 w-7 rounded-full" onClick={() => setZoom(z => Math.max(0.5, z - 0.1))}>
              <ZoomOut className="h-3.5 w-3.5" />
            </Button>
            <span className="text-[10px] text-muted-foreground w-8 text-center">{Math.round(zoom * 100)}%</span>
            <Button size="icon" variant="ghost" className="h-7 w-7 rounded-full" onClick={() => setZoom(z => Math.min(1.5, z + 0.1))}>
              <ZoomIn className="h-3.5 w-3.5" />
            </Button>
            <Button size="icon" variant="ghost" className="h-7 w-7 rounded-full" onClick={() => setZoom(1)}>
              <Maximize className="h-3.5 w-3.5" />
            </Button>

            <div className="h-4 w-px bg-border" />
            <Button size="sm" variant="ghost" className="h-7 text-xs rounded-full" onClick={() => { setNodes([]); setConnections([]); }}>
              <Trash2 className="h-3.5 w-3.5 mr-1" />
              {wf.clear}
            </Button>
          </div>

          {/* Warnings panel */}
          {warnings.length > 0 && nodes.length > 0 && (
            <div className="absolute top-3 right-3 max-w-xs space-y-1.5">
              {warnings.map((w, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-2 rounded-lg bg-amber-500/10 border border-amber-500/20 px-3 py-1.5">
                  <AlertTriangle className="h-3 w-3 text-amber-500 shrink-0" />
                  <span className="text-[10px] text-amber-700 dark:text-amber-400">{w}</span>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Right Sidebar — Node Config */}
        <AnimatePresence>
          {selectedNode && (() => {
            const node = nodes.find(n => n.id === selectedNode);
            if (!node) return null;
            return (
              <NodeConfigPanel
                node={node}
                connections={connections}
                allNodes={nodes}
                onUpdateConfig={updateNodeConfig}
                onDeleteNode={deleteNode}
                onDeleteConnection={deleteConnection}
                onClose={() => setSelectedNode(null)}
              />
            );
          })()}
        </AnimatePresence>
      </div>

      {/* Execution Panel */}
      <ExecutionPanel executionId={executionId} onClose={() => setExecutionId(null)} />

      {/* AI Assistant */}
      <AIAssistantChat
        onApplyWorkflow={handleApplyAIWorkflow}
        currentNodes={nodes}
        currentConnections={connections}
      />

      {/* Ghost Wizard (first visit) */}
      {!wizardDone && (
        <GhostWizard
          onComplete={() => setWizardDone(true)}
          onAddNode={(type) => addNode(type, type.replace(/_/g, " "), NODE_CATEGORIES.flatMap(c => c.nodes).find(n => n.type === type)?.icon || "?")}
        />
      )}

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
            {TEMPLATES.map(tpl => (
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
                  <Badge variant="secondary" className="text-[10px] rounded-full px-2 py-0 mt-1.5">{tpl.nodes.length} {wf.nodes_count}</Badge>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </motion.button>
            ))}

            {savedTemplates.length > 0 && (
              <>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1 pt-2">{wf.my_templates}</p>
                {savedTemplates.map(tpl => (
                  <motion.button
                    key={tpl.id}
                    whileHover={{ scale: 1.01 }}
                    onClick={() => { setNodes(tpl.nodes); setConnections(tpl.connections); setWorkflowName(tpl.name); setTemplateDialog(false); }}
                    className="flex w-full items-center gap-4 rounded-xl border border-primary/20 bg-primary/5 p-4 text-left hover:bg-primary/10 transition-all"
                  >
                    <span className="text-2xl">💾</span>
                    <div className="flex-1">
                      <p className="text-sm font-semibold">{tpl.name}</p>
                      <Badge variant="secondary" className="text-[10px] rounded-full px-2 py-0 mt-1">{tpl.nodes.length} {wf.nodes_count}</Badge>
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
          <Input value={workflowName} onChange={(e) => setWorkflowName(e.target.value)} placeholder={wf.workflow_name} className="rounded-xl" />
          <DialogFooter>
            <Button variant="outline" className="rounded-full" onClick={() => setSaveDialog(false)}>{wf.cancel}</Button>
            <Button className="rounded-full gap-1.5" onClick={saveAsTemplate}><Save className="h-4 w-4" />{wf.save}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
