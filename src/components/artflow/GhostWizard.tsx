import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, ChevronRight, ChevronLeft, X, Check, Zap, Link2, Plus, Play } from "lucide-react";

interface GhostWizardProps {
  onComplete: () => void;
  onAddNode?: (type: string) => void;
  onOpenConnectors?: () => void;
}

const STEPS = [
  {
    id: "welcome",
    icon: "👻",
    title: "Welcome to ArtFlow!",
    desc: "Your no-code automation studio. Let's build your first workflow in 60 seconds.",
    highlight: null,
  },
  {
    id: "connectors",
    icon: "🔌",
    title: "Connect your platforms",
    desc: "Link Pinterest, Etsy, Shopify, Cloudinary and more. Your credentials are encrypted.",
    highlight: "connectors",
    action: "openConnectors",
  },
  {
    id: "source",
    icon: "🎨",
    title: "Add a source node",
    desc: "Drag an artwork or text source onto the canvas — this is where your content starts.",
    highlight: "sidebar-source",
    action: "addSource",
  },
  {
    id: "ai",
    icon: "✨",
    title: "Add AI processing",
    desc: "Let AI generate captions, hashtags, translations and optimize images automatically.",
    highlight: "sidebar-ai",
    action: "addAI",
  },
  {
    id: "destination",
    icon: "📌",
    title: "Choose destinations",
    desc: "Add platform nodes — Instagram, Pinterest, Etsy, Shopify. Connect them with lines.",
    highlight: "sidebar-platform",
  },
  {
    id: "run",
    icon: "🚀",
    title: "Run your workflow!",
    desc: "Hit the Run button and watch your content flow to all platforms in real time.",
    highlight: "run-button",
  },
];

const STORAGE_KEY = "artflow-wizard-completed";

export default function GhostWizard({ onComplete, onAddNode, onOpenConnectors }: GhostWizardProps) {
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const done = localStorage.getItem(STORAGE_KEY);
    if (!done) {
      setVisible(true);
    }
  }, []);

  const finish = () => {
    localStorage.setItem(STORAGE_KEY, "true");
    setVisible(false);
    onComplete();
  };

  const handleAction = () => {
    const current = STEPS[step];
    if (current.action === "openConnectors" && onOpenConnectors) {
      onOpenConnectors();
    } else if (current.action === "addSource" && onAddNode) {
      onAddNode("artwork_source");
    } else if (current.action === "addAI" && onAddNode) {
      onAddNode("ai_adapt");
    }
  };

  const next = () => {
    handleAction();
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      finish();
    }
  };

  const prev = () => {
    if (step > 0) setStep(step - 1);
  };

  if (!visible) return null;

  const current = STEPS[step];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] flex items-center justify-center"
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

        {/* Card */}
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          className="relative z-10 w-full max-w-md mx-4"
        >
          <div className="rounded-3xl border border-white/10 bg-gray-900/95 backdrop-blur-xl p-8 shadow-2xl">
            {/* Close */}
            <button
              onClick={finish}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-white/10 transition text-gray-500 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Ghost mascot */}
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
              className="text-center mb-6"
            >
              <span className="text-6xl">{current.icon}</span>
            </motion.div>

            {/* Content */}
            <div className="text-center mb-8">
              <h3 className="text-xl font-bold text-white mb-2">{current.title}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{current.desc}</p>
            </div>

            {/* Step indicators */}
            <div className="flex items-center justify-center gap-2 mb-6">
              {STEPS.map((_, i) => (
                <motion.div
                  key={i}
                  animate={{
                    width: i === step ? 24 : 8,
                    backgroundColor: i === step ? "rgb(139,92,246)" : i < step ? "rgb(139,92,246)" : "rgba(255,255,255,0.2)",
                  }}
                  className="h-2 rounded-full"
                />
              ))}
            </div>

            {/* Navigation */}
            <div className="flex items-center gap-3">
              {step > 0 && (
                <button
                  onClick={prev}
                  className="flex items-center gap-1 px-4 py-2.5 rounded-xl text-sm text-gray-400 hover:text-white hover:bg-white/10 transition"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Back
                </button>
              )}

              <div className="flex-1" />

              <button
                onClick={finish}
                className="px-4 py-2.5 rounded-xl text-sm text-gray-500 hover:text-white transition"
              >
                Skip
              </button>

              <button
                onClick={next}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-medium hover:bg-violet-500 transition shadow-lg shadow-violet-500/25"
              >
                {step === STEPS.length - 1 ? (
                  <>
                    <Check className="w-4 h-4" />
                    Let's go!
                  </>
                ) : (
                  <>
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
