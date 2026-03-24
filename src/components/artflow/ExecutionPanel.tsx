import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Play, Loader2, CheckCircle2, XCircle, Clock, ChevronDown, ChevronUp } from "lucide-react";
import { useExecution, useCancelExecution, type WorkflowExecution, type ExecutionNodeLog } from "@/hooks/useArtflow";

interface ExecutionPanelProps {
  executionId: string | null;
  onClose: () => void;
}

export default function ExecutionPanel({ executionId, onClose }: ExecutionPanelProps) {
  const { data: execution, isLoading } = useExecution(executionId || "");
  const cancelMut = useCancelExecution();
  const [expandedNode, setExpandedNode] = useState<string | null>(null);

  if (!executionId) return null;

  const statusIcon = (status: string) => {
    switch (status) {
      case "running": return <Loader2 className="w-4 h-4 animate-spin text-blue-400" />;
      case "success": case "completed": return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
      case "failed": return <XCircle className="w-4 h-4 text-red-400" />;
      case "queued": case "pending": return <Clock className="w-4 h-4 text-amber-400" />;
      default: return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const statusColor = (status: string) => {
    switch (status) {
      case "running": return "border-blue-500/30 bg-blue-500/5";
      case "success": case "completed": return "border-emerald-500/30 bg-emerald-500/5";
      case "failed": return "border-red-500/30 bg-red-500/5";
      default: return "border-white/10 bg-white/5";
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ x: 400, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 400, opacity: 0 }}
        className="fixed right-0 top-0 h-full w-96 bg-gray-900/95 backdrop-blur-xl border-l border-white/10 z-50 flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Play className="w-5 h-5 text-violet-400" />
            <h3 className="font-semibold text-white">Execution</h3>
          </div>
          <div className="flex items-center gap-2">
            {execution && (execution.status === "queued" || execution.status === "running") && (
              <button
                onClick={() => cancelMut.mutate(executionId!)}
                className="text-xs px-2 py-1 rounded bg-red-500/20 text-red-400 hover:bg-red-500/30 transition"
              >
                Cancel
              </button>
            )}
            <button onClick={onClose} className="p-1 hover:bg-white/10 rounded transition">
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Status */}
        {execution && (
          <div className={`mx-4 mt-4 p-3 rounded-lg border ${statusColor(execution.status)}`}>
            <div className="flex items-center gap-2">
              {statusIcon(execution.status)}
              <span className="text-sm font-medium text-white capitalize">{execution.status}</span>
              <span className="text-xs text-gray-500 ml-auto">{execution.trigger_type}</span>
            </div>
            {execution.error && (
              <p className="text-xs text-red-400 mt-2">{execution.error}</p>
            )}
          </div>
        )}

        {/* Node Logs */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-violet-400" />
            </div>
          )}

          {execution?.node_logs?.map((log: ExecutionNodeLog) => (
            <motion.div
              key={log.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`border rounded-lg overflow-hidden ${statusColor(log.status)}`}
            >
              <button
                onClick={() => setExpandedNode(expandedNode === log.node_id ? null : log.node_id)}
                className="w-full flex items-center gap-3 p-3 text-left hover:bg-white/5 transition"
              >
                {statusIcon(log.status)}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{log.node_type}</p>
                  <p className="text-xs text-gray-500">{log.node_id}</p>
                </div>
                {log.duration_ms > 0 && (
                  <span className="text-xs text-gray-500">{log.duration_ms}ms</span>
                )}
                {expandedNode === log.node_id ? (
                  <ChevronUp className="w-4 h-4 text-gray-500" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                )}
              </button>

              <AnimatePresence>
                {expandedNode === log.node_id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t border-white/5"
                  >
                    <div className="p-3 space-y-2">
                      {log.error && (
                        <div className="text-xs text-red-400 bg-red-500/10 p-2 rounded">
                          {log.error}
                        </div>
                      )}
                      {log.output_data && Object.keys(log.output_data).length > 0 && (
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Output</p>
                          <pre className="text-xs text-gray-300 bg-black/30 p-2 rounded overflow-x-auto max-h-40">
                            {JSON.stringify(log.output_data, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}

          {execution && !execution.node_logs?.length && !isLoading && (
            <p className="text-center text-gray-500 text-sm py-4">Waiting for execution to start...</p>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
