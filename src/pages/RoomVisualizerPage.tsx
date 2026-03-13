import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, Image, ZoomIn, ZoomOut, RotateCcw, Maximize2, Frame, Sun, SunDim, Download, Share2, ArrowLeft, Ruler, Move } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useLanguage } from "@/i18n";
import { Link, useSearchParams } from "react-router-dom";
import { getItemById } from "@/data/marketItems";

const FRAME_STYLES = [
  { id: "none", label: "None", border: "none", shadow: "0 4px 20px rgba(0,0,0,0.3)" },
  { id: "thin-black", label: "Thin Black", border: "3px solid hsl(0 0% 10%)", shadow: "0 4px 24px rgba(0,0,0,0.35)" },
  { id: "thin-white", label: "Thin White", border: "3px solid hsl(0 0% 95%)", shadow: "0 4px 24px rgba(0,0,0,0.25)" },
  { id: "classic-gold", label: "Gold", border: "6px solid hsl(38 70% 50%)", shadow: "0 6px 28px rgba(0,0,0,0.35), inset 0 0 8px rgba(180,140,60,0.3)" },
  { id: "wood", label: "Wood", border: "8px solid hsl(25 40% 35%)", shadow: "0 6px 28px rgba(0,0,0,0.3)" },
  { id: "modern", label: "Modern", border: "2px solid hsl(0 0% 50%)", shadow: "0 2px 16px rgba(0,0,0,0.2)" },
];

export default function RoomVisualizerPage() {
  const { t } = useLanguage();
  const [searchParams] = useSearchParams();
  const itemId = searchParams.get("item");
  const item = itemId ? getItemById(Number(itemId)) : null;

  const [roomImage, setRoomImage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // painting transform
  const [scale, setScale] = useState(0.3);
  const [opacity, setOpacity] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: -50 });
  const [frameIdx, setFrameIdx] = useState(1);
  const [showRuler, setShowRuler] = useState(true);

  // drag state
  const dragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });

  const artWidth = item?.artworkWidth || 80;
  const artHeight = item?.artworkHeight || 60;

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = e => {
      setRoomImage(e.target?.result as string);
      setPosition({ x: 0, y: -50 });
      setScale(0.3);
    };
    reader.readAsDataURL(file);
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  // painting drag
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

  // pinch zoom
  const lastPinch = useRef<number | null>(null);
  const onTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dist = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
      if (lastPinch.current !== null) {
        const delta = dist - lastPinch.current;
        setScale(s => Math.max(0.1, Math.min(1.5, s + delta * 0.002)));
      }
      lastPinch.current = dist;
    }
  };
  const onTouchEnd = () => { lastPinch.current = null; };

  const frame = FRAME_STYLES[frameIdx];

  // keyboard controls
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const step = e.shiftKey ? 10 : 2;
      if (e.key === "ArrowUp") setPosition(p => ({ ...p, y: p.y - step }));
      if (e.key === "ArrowDown") setPosition(p => ({ ...p, y: p.y + step }));
      if (e.key === "ArrowLeft") setPosition(p => ({ ...p, x: p.x - step }));
      if (e.key === "ArrowRight") setPosition(p => ({ ...p, x: p.x + step }));
      if (e.key === "+" || e.key === "=") setScale(s => Math.min(1.5, s + 0.05));
      if (e.key === "-") setScale(s => Math.max(0.1, s - 0.05));
    };
    if (roomImage) window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [roomImage]);

  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex flex-col bg-muted/30">
      {/* Header */}
      <div className="border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="container flex items-center justify-between py-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
              <Link to={item ? `/market/${item.id}` : "/market"}><ArrowLeft className="h-4 w-4" /></Link>
            </Button>
            <div>
              <h1 className="text-sm font-semibold font-sans">{t.room_viz.title}</h1>
              {item && <p className="text-xs text-muted-foreground truncate max-w-[200px] sm:max-w-none">{item.title}</p>}
            </div>
          </div>
          {roomImage && (
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs hidden sm:flex">
                <Download className="h-3.5 w-3.5" />
                {t.room_viz.save}
              </Button>
              <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs hidden sm:flex">
                <Share2 className="h-3.5 w-3.5" />
                {t.room_viz.share}
              </Button>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Canvas */}
        <div
          ref={containerRef}
          className="relative flex-1 flex items-center justify-center overflow-hidden"
          onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={onDrop}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          {!roomImage ? (
            /* Upload zone */
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-lg mx-4"
            >
              <label
                className={`group flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-12 sm:p-16 text-center cursor-pointer transition-all ${
                  isDragging
                    ? "border-primary bg-primary/5 scale-[1.02]"
                    : "border-border hover:border-primary/50 hover:bg-accent/30"
                }`}
              >
                <div className={`mb-4 flex h-16 w-16 items-center justify-center rounded-2xl transition-colors ${
                  isDragging ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
                }`}>
                  <Upload className="h-7 w-7" />
                </div>
                <h3 className="mb-2 text-lg font-semibold font-sans">{t.room_viz.upload_title}</h3>
                <p className="mb-4 text-sm text-muted-foreground max-w-xs">{t.room_viz.upload_desc}</p>
                <span className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
                  <Image className="h-4 w-4" />
                  {t.room_viz.choose_photo}
                </span>
                <p className="mt-3 text-xs text-muted-foreground">{t.room_viz.formats}</p>
                <input type="file" accept="image/*" className="hidden" onChange={onFileChange} />
              </label>

              {/* Preview painting info */}
              {item && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="mt-6 rounded-xl border border-border bg-card p-4 flex items-center gap-4"
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-accent text-3xl shrink-0">
                    {item.emoji}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.artworkWidth}×{item.artworkHeight} {t.room_viz.cm} • {item.seller}</p>
                  </div>
                </motion.div>
              )}
            </motion.div>
          ) : (
            /* Room with painting overlay */
            <>
              <img src={roomImage} alt="Room" className="absolute inset-0 h-full w-full object-contain" />

              {/* Painting overlay */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div
                  className="pointer-events-auto cursor-grab active:cursor-grabbing select-none relative"
                  style={{
                    transform: `translate(${position.x}px, ${position.y}px)`,
                    width: `${artWidth * scale}%`,
                    aspectRatio: `${artWidth}/${artHeight}`,
                    maxWidth: "80%",
                    opacity,
                    touchAction: "none",
                  }}
                  onPointerDown={onPointerDown}
                  onPointerMove={onPointerMove}
                  onPointerUp={onPointerUp}
                >
                  <div
                    className="w-full h-full rounded-sm flex items-center justify-center"
                    style={{
                      border: frame.border,
                      boxShadow: frame.shadow,
                      background: "linear-gradient(135deg, #f5f0e8 0%, #e8e0d0 50%, #d4c9b8 100%)",
                    }}
                  >
                    <span style={{ fontSize: `clamp(2rem, 8vw, 6rem)` }} className="select-none">
                      {item?.emoji || "🎨"}
                    </span>
                  </div>

                  {/* Dimension labels */}
                  {showRuler && (
                    <>
                      <div className="absolute -bottom-6 left-0 right-0 flex items-center justify-center gap-1">
                        <div className="h-px flex-1 bg-foreground/40" />
                        <span className="text-[10px] font-mono bg-background/80 px-1.5 py-0.5 rounded text-foreground/70">
                          {artWidth} {t.room_viz.cm}
                        </span>
                        <div className="h-px flex-1 bg-foreground/40" />
                      </div>
                      <div className="absolute -right-8 top-0 bottom-0 flex flex-col items-center justify-center gap-1">
                        <div className="w-px flex-1 bg-foreground/40" />
                        <span className="text-[10px] font-mono bg-background/80 px-1.5 py-0.5 rounded text-foreground/70 whitespace-nowrap" style={{ writingMode: "vertical-lr" }}>
                          {artHeight} {t.room_viz.cm}
                        </span>
                        <div className="w-px flex-1 bg-foreground/40" />
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Drag hint on mobile */}
              <div className="absolute bottom-4 left-4 right-4 lg:hidden">
                <p className="text-center text-[10px] text-muted-foreground bg-background/70 backdrop-blur-sm rounded-lg py-2 px-3">
                  <Move className="inline h-3 w-3 mr-1" />
                  {t.room_viz.drag_hint}
                </p>
              </div>
            </>
          )}
        </div>

        {/* Controls sidebar */}
        {roomImage && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="w-full lg:w-80 border-t lg:border-t-0 lg:border-l border-border bg-card/80 backdrop-blur-xl p-4 lg:p-6 space-y-5 overflow-y-auto max-h-[40vh] lg:max-h-none"
          >
            {/* Scale */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-2 block">{t.room_viz.scale}</label>
              <div className="flex items-center gap-3">
                <ZoomOut className="h-4 w-4 text-muted-foreground shrink-0" />
                <Slider value={[scale * 100]} onValueChange={v => setScale(v[0] / 100)} min={10} max={150} step={2} />
                <ZoomIn className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-xs font-mono text-muted-foreground w-10 text-right">{Math.round(scale * 100)}%</span>
              </div>
            </div>

            {/* Opacity */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-2 block">{t.room_viz.opacity}</label>
              <div className="flex items-center gap-3">
                <SunDim className="h-4 w-4 text-muted-foreground shrink-0" />
                <Slider value={[opacity * 100]} onValueChange={v => setOpacity(v[0] / 100)} min={30} max={100} step={5} />
                <Sun className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="text-xs font-mono text-muted-foreground w-10 text-right">{Math.round(opacity * 100)}%</span>
              </div>
            </div>

            {/* Frame style */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-2 block">{t.room_viz.frame}</label>
              <div className="grid grid-cols-3 gap-2">
                {FRAME_STYLES.map((f, i) => (
                  <button
                    key={f.id}
                    onClick={() => setFrameIdx(i)}
                    className={`rounded-lg p-2 text-center text-[11px] font-medium transition-all ${
                      i === frameIdx
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "bg-secondary text-secondary-foreground hover:bg-accent"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Toggle buttons */}
            <div className="flex gap-2">
              <Button
                variant={showRuler ? "default" : "outline"}
                size="sm"
                className="flex-1 gap-1.5 text-xs"
                onClick={() => setShowRuler(!showRuler)}
              >
                <Ruler className="h-3.5 w-3.5" />
                {t.room_viz.dimensions}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 gap-1.5 text-xs"
                onClick={() => { setScale(0.3); setPosition({ x: 0, y: -50 }); setOpacity(1); setFrameIdx(1); }}
              >
                <RotateCcw className="h-3.5 w-3.5" />
                {t.room_viz.reset}
              </Button>
            </div>

            {/* Change photo */}
            <div>
              <label className="block">
                <span className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border px-4 py-2.5 text-xs font-medium text-muted-foreground cursor-pointer hover:bg-accent/40 transition-colors">
                  <Upload className="h-3.5 w-3.5" />
                  {t.room_viz.change_photo}
                </span>
                <input type="file" accept="image/*" className="hidden" onChange={onFileChange} />
              </label>
            </div>

            {/* Mobile save/share */}
            <div className="flex gap-2 lg:hidden">
              <Button variant="outline" size="sm" className="flex-1 gap-1.5 text-xs">
                <Download className="h-3.5 w-3.5" />
                {t.room_viz.save}
              </Button>
              <Button variant="outline" size="sm" className="flex-1 gap-1.5 text-xs">
                <Share2 className="h-3.5 w-3.5" />
                {t.room_viz.share}
              </Button>
            </div>

            {/* Painting info */}
            {item && (
              <div className="rounded-lg border border-border bg-background p-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{item.emoji}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium truncate">{item.title}</p>
                    <p className="text-[11px] text-muted-foreground">{item.price} • {artWidth}×{artHeight} {t.room_viz.cm}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Keyboard hint */}
            <p className="text-[10px] text-muted-foreground hidden lg:block">
              {t.room_viz.keyboard_hint}
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
