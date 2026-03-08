import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Camera, RotateCcw, ZoomIn, ZoomOut, Move, Maximize2, Ruler, FlipHorizontal, Sun, SunDim } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";

interface ARPreviewProps {
  open: boolean;
  onClose: () => void;
  emoji: string;
  title: string;
  /** real artwork dimensions in cm */
  widthCm?: number;
  heightCm?: number;
}

export default function ARPreview({ open, onClose, emoji, title, widthCm = 60, heightCm = 80 }: ARPreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");

  // artwork transform
  const [scale, setScale] = useState(1);
  const [opacity, setOpacity] = useState(0.92);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [flipped, setFlipped] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  const [showRuler, setShowRuler] = useState(true);

  // drag
  const dragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });

  // pinch zoom
  const lastPinchDist = useRef<number | null>(null);

  const startCamera = useCallback(async (facing: "environment" | "user") => {
    try {
      if (stream) stream.getTracks().forEach(t => t.stop());
      const s = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing, width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      });
      setStream(s);
      if (videoRef.current) {
        videoRef.current.srcObject = s;
        videoRef.current.onloadedmetadata = () => setCameraReady(true);
      }
      setError(null);
    } catch {
      setError("Не вдалося отримати доступ до камери. Дозвольте доступ у налаштуваннях браузера.");
    }
  }, [stream]);

  useEffect(() => {
    if (open) {
      startCamera(facingMode);
      setPosition({ x: 0, y: 0 });
      setScale(1);
    }
    return () => {
      stream?.getTracks().forEach(t => t.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, facingMode]);

  const switchCamera = () => setFacingMode(f => f === "environment" ? "user" : "environment");

  // pointer drag
  const onPointerDown = (e: React.PointerEvent) => {
    dragging.current = true;
    dragStart.current = { x: e.clientX - position.x, y: e.clientY - position.y };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging.current) return;
    setPosition({ x: e.clientX - dragStart.current.x, y: e.clientY - dragStart.current.y });
  };
  const onPointerUp = () => { dragging.current = false; };

  // touch pinch zoom
  const onTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      if (lastPinchDist.current !== null) {
        const delta = dist - lastPinchDist.current;
        setScale(s => Math.max(0.2, Math.min(3, s + delta * 0.005)));
      }
      lastPinchDist.current = dist;
    }
  };
  const onTouchEnd = () => { lastPinchDist.current = null; };

  // compute display size: base ~200px for 60cm, scale proportionally
  const basePx = 200;
  const artW = (widthCm / 60) * basePx * scale;
  const artH = (heightCm / 60) * basePx * scale;

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex flex-col bg-black"
        ref={containerRef}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {/* Camera feed */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="absolute inset-0 h-full w-full object-cover"
        />

        {/* Grid overlay */}
        {showGrid && cameraReady && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="h-full w-full" style={{
              backgroundImage: "linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)",
              backgroundSize: "33.33% 33.33%",
            }} />
          </div>
        )}

        {/* Artwork overlay */}
        {cameraReady && (
          <div
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
          >
            <div
              className="pointer-events-auto cursor-grab active:cursor-grabbing relative select-none"
              style={{
                transform: `translate(${position.x}px, ${position.y}px) scaleX(${flipped ? -1 : 1})`,
                width: artW,
                height: artH,
                opacity,
                touchAction: "none",
              }}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
            >
              {/* Frame shadow */}
              <div className="absolute -inset-2 rounded-sm" style={{
                boxShadow: "0 8px 32px rgba(0,0,0,0.45), 0 2px 8px rgba(0,0,0,0.3)",
                border: "3px solid rgba(255,255,255,0.25)",
                borderRadius: "2px",
              }} />

              {/* Artwork content */}
              <div
                className="w-full h-full flex items-center justify-center rounded-sm"
                style={{
                  background: "linear-gradient(135deg, #f5f0e8 0%, #e8e0d0 50%, #d4c9b8 100%)",
                  border: "6px solid #8b7355",
                  boxShadow: "inset 0 0 20px rgba(0,0,0,0.1), inset 0 0 60px rgba(139,115,85,0.15)",
                }}
              >
                <span style={{ fontSize: Math.min(artW, artH) * 0.5 }} className="select-none">
                  {emoji}
                </span>
              </div>

              {/* Dimension labels */}
              {showRuler && (
                <>
                  {/* Width */}
                  <div className="absolute -bottom-7 left-0 right-0 flex items-center justify-center gap-1">
                    <div className="h-px flex-1 bg-white/60" />
                    <span className="text-[10px] font-mono text-white bg-black/50 px-1.5 py-0.5 rounded">
                      {widthCm} см
                    </span>
                    <div className="h-px flex-1 bg-white/60" />
                  </div>
                  {/* Height */}
                  <div className="absolute -right-10 top-0 bottom-0 flex flex-col items-center justify-center gap-1">
                    <div className="w-px flex-1 bg-white/60" />
                    <span className="text-[10px] font-mono text-white bg-black/50 px-1.5 py-0.5 rounded whitespace-nowrap" style={{ writingMode: "vertical-lr" }}>
                      {heightCm} см
                    </span>
                    <div className="w-px flex-1 bg-white/60" />
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80 p-6">
            <div className="rounded-2xl bg-card p-6 text-center max-w-sm">
              <Camera className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
              <p className="text-sm text-foreground mb-4">{error}</p>
              <Button onClick={() => startCamera(facingMode)}>Спробувати знову</Button>
            </div>
          </div>
        )}

        {/* Top bar */}
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-4 z-10">
          <Button size="icon" variant="ghost" className="h-10 w-10 rounded-full bg-black/40 text-white hover:bg-black/60" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
          <Badge className="bg-black/50 text-white border-none backdrop-blur-md text-xs">
            <Camera className="h-3 w-3 mr-1" /> AR Примірка
          </Badge>
          <Button size="icon" variant="ghost" className="h-10 w-10 rounded-full bg-black/40 text-white hover:bg-black/60" onClick={switchCamera}>
            <RotateCcw className="h-5 w-5" />
          </Button>
        </div>

        {/* Title */}
        <div className="absolute top-16 left-4 right-4 text-center z-10">
          <p className="text-white/90 text-sm font-medium backdrop-blur-sm bg-black/30 rounded-full px-4 py-1.5 inline-block truncate max-w-[80%]">
            {title}
          </p>
        </div>

        {/* Bottom controls */}
        <div className="absolute bottom-0 left-0 right-0 z-10 p-4 space-y-3">
          {/* Scale slider */}
          <div className="flex items-center gap-3 bg-black/50 backdrop-blur-md rounded-2xl px-4 py-3">
            <ZoomOut className="h-4 w-4 text-white/70 shrink-0" />
            <Slider
              value={[scale * 100]}
              onValueChange={v => setScale(v[0] / 100)}
              min={20}
              max={300}
              step={5}
              className="flex-1"
            />
            <ZoomIn className="h-4 w-4 text-white/70 shrink-0" />
            <span className="text-xs text-white/70 font-mono w-10 text-right">{Math.round(scale * 100)}%</span>
          </div>

          {/* Opacity slider */}
          <div className="flex items-center gap-3 bg-black/50 backdrop-blur-md rounded-2xl px-4 py-3">
            <SunDim className="h-4 w-4 text-white/70 shrink-0" />
            <Slider
              value={[opacity * 100]}
              onValueChange={v => setOpacity(v[0] / 100)}
              min={20}
              max={100}
              step={5}
              className="flex-1"
            />
            <Sun className="h-4 w-4 text-white/70 shrink-0" />
            <span className="text-xs text-white/70 font-mono w-10 text-right">{Math.round(opacity * 100)}%</span>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-center gap-2">
            <Button
              size="sm"
              variant={showRuler ? "default" : "ghost"}
              className={`rounded-full gap-1.5 ${!showRuler ? "bg-black/40 text-white hover:bg-black/60" : ""}`}
              onClick={() => setShowRuler(!showRuler)}
            >
              <Ruler className="h-3.5 w-3.5" /> Розміри
            </Button>
            <Button
              size="sm"
              variant={showGrid ? "default" : "ghost"}
              className={`rounded-full gap-1.5 ${!showGrid ? "bg-black/40 text-white hover:bg-black/60" : ""}`}
              onClick={() => setShowGrid(!showGrid)}
            >
              <Maximize2 className="h-3.5 w-3.5" /> Сітка
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="rounded-full gap-1.5 bg-black/40 text-white hover:bg-black/60"
              onClick={() => setFlipped(!flipped)}
            >
              <FlipHorizontal className="h-3.5 w-3.5" /> Відзеркалити
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="rounded-full gap-1.5 bg-black/40 text-white hover:bg-black/60"
              onClick={() => { setScale(1); setPosition({ x: 0, y: 0 }); setFlipped(false); setOpacity(0.92); }}
            >
              <RotateCcw className="h-3.5 w-3.5" /> Скинути
            </Button>
          </div>

          {/* Hint */}
          {cameraReady && (
            <p className="text-center text-[10px] text-white/50 pb-1">
              Перетягуйте картину • Зведіть пальці для масштабу • Наведіть камеру на стіну
            </p>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
