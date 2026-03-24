import { useState } from "react";
import { motion } from "framer-motion";
import { X, Trash2, Loader2, Zap } from "lucide-react";
import { useAISuggestConfig } from "@/hooks/useArtflow";

interface NodeConfigPanelProps {
  node: {
    id: string;
    type: string;
    label: string;
    icon: string;
    config: Record<string, any>;
  };
  connections: { from: string; to: string }[];
  allNodes: { id: string; label: string; icon: string }[];
  onUpdateConfig: (nodeId: string, config: Record<string, any>) => void;
  onDeleteNode: (nodeId: string) => void;
  onDeleteConnection: (from: string, to: string) => void;
  onClose: () => void;
}

// Maps node types to configurable fields
const NODE_FIELDS: Record<string, { key: string; label: string; type: "text" | "select" | "number" | "toggle" | "textarea"; options?: { value: string; label: string }[]; defaultValue?: any }[]> = {
  artwork_source: [
    { key: "selection", label: "Selection mode", type: "select", options: [{ value: "manual", label: "Manual pick" }, { value: "latest", label: "Latest uploads" }, { value: "tag", label: "By tag" }] },
    { key: "tag", label: "Tag filter", type: "text" },
    { key: "limit", label: "Max artworks", type: "number", defaultValue: 5 },
  ],
  text_source: [
    { key: "text", label: "Post text", type: "textarea" },
  ],
  gallery_source: [
    { key: "limit", label: "Max images", type: "number", defaultValue: 10 },
    { key: "layout", label: "Layout", type: "select", options: [{ value: "carousel", label: "Carousel" }, { value: "grid", label: "Grid" }, { value: "collage", label: "Collage" }] },
  ],
  video_source: [
    { key: "max_duration", label: "Max duration (sec)", type: "number", defaultValue: 60 },
    { key: "format", label: "Format", type: "select", options: [{ value: "mp4", label: "MP4" }, { value: "mov", label: "MOV" }] },
  ],
  ai_adapt: [
    { key: "platform", label: "Target platform", type: "select", options: [{ value: "auto", label: "Auto-detect" }, { value: "instagram", label: "Instagram" }, { value: "pinterest", label: "Pinterest" }, { value: "etsy", label: "Etsy" }, { value: "tiktok", label: "TikTok" }] },
    { key: "tone", label: "Tone", type: "select", options: [{ value: "professional", label: "Professional" }, { value: "casual", label: "Casual" }, { value: "artistic", label: "Artistic" }, { value: "minimal", label: "Minimal" }] },
    { key: "auto_crop", label: "Auto crop", type: "toggle", defaultValue: true },
  ],
  ai_hashtags: [
    { key: "max_count", label: "Max hashtags", type: "number", defaultValue: 15 },
    { key: "language", label: "Language", type: "select", options: [{ value: "en", label: "English" }, { value: "uk", label: "Ukrainian" }, { value: "multi", label: "Multilingual" }] },
  ],
  ai_translate: [
    { key: "target_lang", label: "Target language", type: "select", options: [{ value: "en", label: "English" }, { value: "uk", label: "Ukrainian" }, { value: "de", label: "German" }, { value: "es", label: "Spanish" }, { value: "fr", label: "French" }] },
  ],
  ai_image_edit: [
    { key: "watermark", label: "Add watermark", type: "toggle" },
    { key: "watermark_text", label: "Watermark text", type: "text" },
    { key: "resize", label: "Resize", type: "select", options: [{ value: "none", label: "None" }, { value: "1080x1080", label: "1080x1080" }, { value: "1200x628", label: "1200x628" }, { value: "1000x1500", label: "1000x1500 (Pin)" }] },
  ],
  instagram: [
    { key: "format", label: "Post format", type: "select", options: [{ value: "post", label: "Post" }, { value: "reels", label: "Reels" }, { value: "story", label: "Story" }, { value: "carousel", label: "Carousel" }] },
    { key: "caption", label: "Caption", type: "textarea" },
  ],
  pinterest: [
    { key: "board_id", label: "Board", type: "text" },
    { key: "link_url", label: "Link URL", type: "text" },
    { key: "alt_text", label: "Alt text", type: "text" },
  ],
  etsy: [
    { key: "product_type", label: "Product type", type: "select", options: [{ value: "print", label: "Art Print" }, { value: "canvas", label: "Canvas" }, { value: "poster", label: "Poster" }, { value: "tshirt", label: "T-Shirt" }, { value: "mug", label: "Mug" }] },
    { key: "price", label: "Price ($)", type: "number" },
    { key: "with_printful", label: "Printful fulfillment", type: "toggle" },
  ],
  tiktok: [
    { key: "caption", label: "Caption", type: "textarea" },
    { key: "music", label: "Music ID", type: "text" },
  ],
  x: [
    { key: "text", label: "Tweet text", type: "textarea" },
  ],
  facebook: [
    { key: "caption", label: "Caption", type: "textarea" },
    { key: "target", label: "Post to", type: "select", options: [{ value: "feed", label: "Feed" }, { value: "page", label: "Page" }, { value: "group", label: "Group" }] },
  ],
  threads: [
    { key: "text", label: "Text", type: "textarea" },
  ],
  schedule: [
    { key: "datetime", label: "Date & time", type: "text" },
    { key: "repeat", label: "Repeat", type: "select", options: [{ value: "none", label: "Once" }, { value: "daily", label: "Daily" }, { value: "weekly", label: "Weekly" }, { value: "monthly", label: "Monthly" }] },
  ],
  printful_sync: [
    { key: "product_id", label: "Product template ID", type: "text" },
    { key: "auto_fulfill", label: "Auto-fulfill orders", type: "toggle" },
  ],
  analytics_track: [
    { key: "metrics", label: "Track metrics", type: "select", options: [{ value: "all", label: "All" }, { value: "views", label: "Views only" }, { value: "engagement", label: "Engagement" }, { value: "conversions", label: "Conversions" }] },
  ],
};

export default function NodeConfigPanel({ node, connections, allNodes, onUpdateConfig, onDeleteNode, onDeleteConnection, onClose }: NodeConfigPanelProps) {
  const [config, setConfig] = useState<Record<string, any>>({ ...node.config });
  const suggestMut = useAISuggestConfig();

  const fields = NODE_FIELDS[node.type] || [];
  const nodeConns = connections.filter(c => c.from === node.id || c.to === node.id);

  const updateField = (key: string, value: any) => {
    const next = { ...config, [key]: value };
    setConfig(next);
    onUpdateConfig(node.id, next);
  };

  const handleAISuggest = async () => {
    try {
      const result = await suggestMut.mutateAsync({ node_type: node.type, context: config });
      const next = { ...config, ...result };
      setConfig(next);
      onUpdateConfig(node.id, next);
    } catch {
      // ignore
    }
  };

  return (
    <motion.div
      initial={{ x: 300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 300, opacity: 0 }}
      className="w-72 border-l border-border bg-card/40 backdrop-blur-sm overflow-y-auto shrink-0 p-4"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold">Node Settings</h3>
        <button onClick={onClose} className="p-1 hover:bg-accent rounded-full transition">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="space-y-4">
        {/* Node identity */}
        <div className="flex items-center gap-3 rounded-xl border border-border bg-background/60 p-3">
          <span className="text-2xl">{node.icon}</span>
          <div>
            <p className="text-sm font-semibold">{node.label}</p>
            <p className="text-[10px] text-muted-foreground">{node.type.replace(/_/g, " ")}</p>
          </div>
        </div>

        {/* AI suggest button */}
        {fields.length > 0 && (
          <button
            onClick={handleAISuggest}
            disabled={suggestMut.isPending}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs hover:bg-violet-500/20 transition disabled:opacity-50"
          >
            {suggestMut.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
            AI suggest config
          </button>
        )}

        {/* Connections info */}
        {nodeConns.length > 0 && (
          <div className="rounded-xl border border-border/50 bg-muted/20 p-2.5">
            <p className="text-[10px] font-semibold text-muted-foreground mb-1.5">
              Connections ({nodeConns.length})
            </p>
            {nodeConns.map(c => {
              const otherId = c.from === node.id ? c.to : c.from;
              const other = allNodes.find(n => n.id === otherId);
              return other ? (
                <div key={`${c.from}-${c.to}`} className="flex items-center gap-1.5 py-0.5">
                  <span className="text-xs">{c.from === node.id ? "\u2192" : "\u2190"}</span>
                  <span className="text-[10px]">{other.icon}</span>
                  <span className="text-[10px] truncate">{other.label}</span>
                  <button
                    onClick={() => onDeleteConnection(c.from, c.to)}
                    className="ml-auto text-muted-foreground hover:text-destructive"
                  >
                    <X className="h-2.5 w-2.5" />
                  </button>
                </div>
              ) : null;
            })}
          </div>
        )}

        {/* Dynamic fields */}
        {fields.map(field => (
          <div key={field.key} className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">{field.label}</label>

            {field.type === "text" && (
              <input
                type="text"
                value={config[field.key] || ""}
                onChange={(e) => updateField(field.key, e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm focus:border-primary/50 focus:outline-none"
              />
            )}

            {field.type === "number" && (
              <input
                type="number"
                value={config[field.key] ?? field.defaultValue ?? ""}
                onChange={(e) => updateField(field.key, Number(e.target.value))}
                className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm focus:border-primary/50 focus:outline-none"
              />
            )}

            {field.type === "textarea" && (
              <textarea
                value={config[field.key] || ""}
                onChange={(e) => updateField(field.key, e.target.value)}
                rows={3}
                className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm resize-none focus:border-primary/50 focus:outline-none"
              />
            )}

            {field.type === "select" && field.options && (
              <select
                value={config[field.key] || field.options[0]?.value || ""}
                onChange={(e) => updateField(field.key, e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border rounded-xl text-sm focus:border-primary/50 focus:outline-none"
              >
                {field.options.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            )}

            {field.type === "toggle" && (
              <button
                onClick={() => updateField(field.key, !config[field.key])}
                className={`relative w-11 h-6 rounded-full transition-colors ${config[field.key] ? "bg-violet-500" : "bg-muted"}`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform ${config[field.key] ? "translate-x-5" : ""}`}
                />
              </button>
            )}
          </div>
        ))}

        {fields.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-2">No configurable fields for this node type.</p>
        )}

        {/* Delete */}
        <button
          onClick={() => onDeleteNode(node.id)}
          className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-destructive/30 text-destructive text-xs hover:bg-destructive/10 transition"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Delete node
        </button>
      </div>
    </motion.div>
  );
}
