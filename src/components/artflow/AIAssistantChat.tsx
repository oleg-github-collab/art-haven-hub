import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Send, Loader2, X, Wand2, Copy, Check } from "lucide-react";
import { useAIGenerateWorkflow, useAIExplain, type AIWorkflowResult } from "@/hooks/useArtflow";

interface AIAssistantChatProps {
  onApplyWorkflow?: (nodes: unknown[], connections: unknown[]) => void;
  currentNodes?: unknown[];
  currentConnections?: unknown[];
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  workflow?: AIWorkflowResult;
}

export default function AIAssistantChat({ onApplyWorkflow, currentNodes, currentConnections }: AIAssistantChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    { id: "welcome", role: "assistant", content: "Hi! I'm your ArtFlow AI assistant. Describe the workflow you want to create, and I'll build it for you. For example: \"Publish my artworks to Pinterest with AI captions\"" }
  ]);
  const [copied, setCopied] = useState(false);
  const generateMut = useAIGenerateWorkflow();
  const explainMut = useAIExplain();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || generateMut.isPending) return;

    const userMsg: Message = { id: Date.now().toString(), role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");

    try {
      const result = await generateMut.mutateAsync(text);
      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: result.explanation || "Here's the workflow I created:",
        workflow: result,
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      setMessages((prev) => [...prev, {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Sorry, I couldn't generate the workflow. Please try rephrasing your request.",
      }]);
    }
  };

  const handleExplain = async () => {
    if (!currentNodes || !currentConnections) return;
    const userMsg: Message = { id: Date.now().toString(), role: "user", content: "What does my current workflow do?" };
    setMessages((prev) => [...prev, userMsg]);

    try {
      const result = await explainMut.mutateAsync({ nodes: currentNodes, connections: currentConnections });
      setMessages((prev) => [...prev, {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: result.explanation,
      }]);
    } catch {
      setMessages((prev) => [...prev, {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "I couldn't analyze the workflow. Make sure it has nodes and connections.",
      }]);
    }
  };

  const handleApply = (workflow: AIWorkflowResult) => {
    if (onApplyWorkflow && workflow.nodes && workflow.connections) {
      onApplyWorkflow(workflow.nodes, workflow.connections);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <>
      {/* Floating button */}
      <motion.button
        onClick={() => { setIsOpen(!isOpen); setTimeout(() => inputRef.current?.focus(), 100); }}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-gradient-to-br from-violet-600 to-purple-600 text-white shadow-lg shadow-violet-500/25 flex items-center justify-center hover:scale-105 transition-transform"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        {isOpen ? <X className="w-6 h-6" /> : <Sparkles className="w-6 h-6" />}
      </motion.button>

      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-24 right-6 z-40 w-96 max-h-[70vh] bg-gray-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 border-b border-white/10 flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center">
                <Wand2 className="w-4 h-4 text-violet-400" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">ArtFlow AI</h4>
                <p className="text-xs text-gray-500">Workflow assistant</p>
              </div>
              {currentNodes && currentNodes.length > 0 && (
                <button
                  onClick={handleExplain}
                  disabled={explainMut.isPending}
                  className="ml-auto text-xs px-2 py-1 rounded bg-white/10 text-gray-300 hover:bg-white/20 transition"
                >
                  Explain workflow
                </button>
              )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[200px] max-h-[400px]">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
                    msg.role === "user"
                      ? "bg-violet-600 text-white"
                      : "bg-white/10 text-gray-200"
                  }`}>
                    <p className="text-sm leading-relaxed">{msg.content}</p>

                    {msg.workflow && msg.workflow.nodes && (msg.workflow.nodes as unknown[]).length > 0 && (
                      <div className="mt-3 pt-3 border-t border-white/10">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs text-gray-400">
                            {(msg.workflow.nodes as unknown[]).length} nodes
                          </span>
                          <button
                            onClick={() => handleApply(msg.workflow!)}
                            className="flex items-center gap-1 text-xs px-2 py-1 rounded bg-violet-500/30 text-violet-300 hover:bg-violet-500/40 transition"
                          >
                            {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                            {copied ? "Applied!" : "Apply to canvas"}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {(generateMut.isPending || explainMut.isPending) && (
                <div className="flex justify-start">
                  <div className="bg-white/10 rounded-2xl px-4 py-3">
                    <Loader2 className="w-4 h-4 animate-spin text-violet-400" />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-white/10">
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  placeholder="Describe your workflow..."
                  className="flex-1 px-4 py-2.5 bg-black/30 border border-white/10 rounded-xl text-sm text-white placeholder-gray-600 focus:border-violet-500/50 focus:outline-none"
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || generateMut.isPending}
                  className="p-2.5 rounded-xl bg-violet-600 text-white hover:bg-violet-500 transition disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
