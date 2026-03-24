import { useState } from "react";
import { motion } from "framer-motion";
import { Check, AlertTriangle, Loader2, Unplug, TestTube, ExternalLink } from "lucide-react";
import { useConnectors, useAddConnector, useRemoveConnector, useTestConnector, type Connector } from "@/hooks/useArtflow";
import { useToast } from "@/hooks/use-toast";

const PLATFORMS = [
  { id: "openai", name: "OpenAI", icon: "🤖", category: "AI", color: "from-green-500/20 to-emerald-500/20", fields: [{ key: "api_key", label: "API Key", type: "password" }] },
  { id: "cloudinary", name: "Cloudinary", icon: "☁️", category: "Storage", color: "from-blue-500/20 to-cyan-500/20", fields: [{ key: "cloud_name", label: "Cloud Name", type: "text" }, { key: "api_key", label: "API Key", type: "text" }, { key: "api_secret", label: "API Secret", type: "password" }] },
  { id: "pinterest", name: "Pinterest", icon: "📌", category: "Social", color: "from-red-500/20 to-rose-500/20", oauth: true },
  { id: "etsy", name: "Etsy", icon: "🧶", category: "Marketplace", color: "from-orange-500/20 to-amber-500/20", oauth: true },
  { id: "shopify", name: "Shopify", icon: "🛍️", category: "Marketplace", color: "from-green-500/20 to-lime-500/20", fields: [{ key: "access_token", label: "Access Token", type: "password" }, { key: "shop_domain", label: "Shop Domain", type: "text" }] },
  { id: "printful", name: "Printful", icon: "👕", category: "Fulfillment", color: "from-purple-500/20 to-violet-500/20", fields: [{ key: "access_token", label: "API Token", type: "password" }] },
];

export default function ConnectorSetup() {
  const { data: connectors = [], isLoading } = useConnectors();
  const addMut = useAddConnector();
  const removeMut = useRemoveConnector();
  const testMut = useTestConnector();
  const { toast } = useToast();
  const [expandedPlatform, setExpandedPlatform] = useState<string | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});

  const getConnector = (platformId: string): Connector | undefined =>
    connectors.find((c) => c.platform === platformId);

  const handleConnect = async (platformId: string) => {
    const platform = PLATFORMS.find((p) => p.id === platformId);
    if (!platform) return;

    try {
      await addMut.mutateAsync({ platform: platformId, credentials: formData });
      toast({ title: `${platform.name} connected!` });
      setExpandedPlatform(null);
      setFormData({});
    } catch {
      toast({ title: "Connection failed", variant: "destructive" });
    }
  };

  const handleDisconnect = async (platformId: string) => {
    try {
      await removeMut.mutateAsync(platformId);
      toast({ title: "Disconnected" });
    } catch {
      toast({ title: "Failed to disconnect", variant: "destructive" });
    }
  };

  const handleTest = async (platformId: string) => {
    try {
      await testMut.mutateAsync(platformId);
      toast({ title: "Connection OK!" });
    } catch {
      toast({ title: "Connection test failed", variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-violet-400" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {PLATFORMS.map((platform) => {
        const connector = getConnector(platform.id);
        const isConnected = connector?.status === "active";
        const isExpired = connector?.status === "expired";
        const isError = connector?.status === "error";
        const isExpanded = expandedPlatform === platform.id;

        return (
          <motion.div
            key={platform.id}
            layout
            className={`rounded-xl border backdrop-blur-sm overflow-hidden transition-all ${
              isConnected ? "border-emerald-500/30 bg-emerald-500/5" :
              isError ? "border-red-500/30 bg-red-500/5" :
              "border-white/10 bg-white/5"
            }`}
          >
            <div className="p-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${platform.color} flex items-center justify-center text-xl`}>
                  {platform.icon}
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-white">{platform.name}</h4>
                  <p className="text-xs text-gray-500">{platform.category}</p>
                </div>
                {isConnected && <Check className="w-5 h-5 text-emerald-400" />}
                {isExpired && <AlertTriangle className="w-5 h-5 text-amber-400" />}
                {isError && <AlertTriangle className="w-5 h-5 text-red-400" />}
              </div>

              <div className="mt-3 flex gap-2">
                {isConnected ? (
                  <>
                    <button
                      onClick={() => handleTest(platform.id)}
                      disabled={testMut.isPending}
                      className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg bg-white/10 text-white text-xs hover:bg-white/20 transition disabled:opacity-50"
                    >
                      {testMut.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <TestTube className="w-3 h-3" />}
                      Test
                    </button>
                    <button
                      onClick={() => handleDisconnect(platform.id)}
                      className="flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 text-xs hover:bg-red-500/30 transition"
                    >
                      <Unplug className="w-3 h-3" />
                    </button>
                  </>
                ) : platform.oauth ? (
                  <button
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg bg-violet-500/20 text-violet-300 text-xs hover:bg-violet-500/30 transition"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Connect via OAuth
                  </button>
                ) : (
                  <button
                    onClick={() => setExpandedPlatform(isExpanded ? null : platform.id)}
                    className="flex-1 px-3 py-1.5 rounded-lg bg-violet-500/20 text-violet-300 text-xs hover:bg-violet-500/30 transition"
                  >
                    {isExpanded ? "Cancel" : "Connect"}
                  </button>
                )}
              </div>
            </div>

            {isExpanded && platform.fields && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="border-t border-white/10 p-4 space-y-3"
              >
                {platform.fields.map((field) => (
                  <div key={field.key}>
                    <label className="text-xs text-gray-400 mb-1 block">{field.label}</label>
                    <input
                      type={field.type}
                      value={formData[field.key] || ""}
                      onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                      className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-sm text-white placeholder-gray-600 focus:border-violet-500/50 focus:outline-none"
                      placeholder={`Enter ${field.label.toLowerCase()}`}
                    />
                  </div>
                ))}
                <button
                  onClick={() => handleConnect(platform.id)}
                  disabled={addMut.isPending}
                  className="w-full py-2 rounded-lg bg-violet-600 text-white text-sm font-medium hover:bg-violet-500 transition disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {addMut.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                  Save & Connect
                </button>
              </motion.div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}
