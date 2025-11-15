import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Move, RotateCw, ZoomIn } from "lucide-react";

interface ClassicModeProps {
  referenceImage: string | null;
  ghostMentorEnabled: boolean;
  gridEnabled: boolean;
  gridOpacity: number;
  gridTileCount: number;
  strobeEnabled: boolean;
  strobeSpeed: number;
  strobeMinOpacity: number;
  strobeMaxOpacity: number;
  contrast: number;
  brightness: number;
}

const ClassicMode = ({
  referenceImage,
  ghostMentorEnabled,
  gridEnabled,
  gridOpacity,
  gridTileCount,
  strobeEnabled,
  strobeSpeed,
  strobeMinOpacity,
  strobeMaxOpacity,
  contrast,
  brightness,
}: ClassicModeProps) => {
  const [opacity, setOpacity] = useState(50);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [rotation, setRotation] = useState(0);
  const [scale, setScale] = useState(1);
  const canvasRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const strobePhaseRef = useRef(0);
  const [dynamicOpacity, setDynamicOpacity] = useState(opacity / 100);

  useEffect(() => {
    // Initialize camera stream
    const initCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" }
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error("Erreur d'accès à la caméra:", error);
      }
    };

    initCamera();

    return () => {
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  useEffect(() => {
    if (!strobeEnabled) {
      strobePhaseRef.current = 0;
      setDynamicOpacity(opacity / 100);
      return;
    }

    strobePhaseRef.current = -Math.PI / 2;

    let frame: number;
    const animate = () => {
      const min = Math.min(strobeMinOpacity, strobeMaxOpacity) / 100;
      const max = Math.max(strobeMinOpacity, strobeMaxOpacity) / 100;
      const range = Math.max(max - min, 0);

      const oscillation = (Math.sin(strobePhaseRef.current) + 1) / 2;
      const value = range > 0 ? min + oscillation * range : min;
      setDynamicOpacity(value);

      strobePhaseRef.current += 0.05 * strobeSpeed;
      frame = requestAnimationFrame(animate);
    };

    animate();

    return () => cancelAnimationFrame(frame);
  }, [strobeEnabled, strobeSpeed, strobeMinOpacity, strobeMaxOpacity, opacity]);

  useEffect(() => {
    if (!strobeEnabled) {
      setDynamicOpacity(opacity / 100);
    }
  }, [opacity, strobeEnabled]);

  const tileCount = Math.max(gridTileCount, 1);
  const gridCellSize = `calc(100% / ${tileCount})`;

  return (
    <div className="space-y-6">
      <div className="relative w-full overflow-hidden rounded-[28px] border border-white/60 bg-black/80 shadow-[var(--shadow-card)]">
        {/* Camera feed */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="h-full w-full object-cover"
          style={{ filter: `brightness(${brightness}%) contrast(${contrast}%)` }}
        />

        {/* Reference image overlay */}
        {referenceImage && (
          <div
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
            style={{ opacity: dynamicOpacity }}
          >
            <img
              src={referenceImage}
              alt="Reference"
              className="max-w-full max-h-full"
              style={{
                transform: `translate(${position.x}px, ${position.y}px) rotate(${rotation}deg) scale(${scale})`,
              }}
            />
          </div>
        )}

        {gridEnabled && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              opacity: Math.min(Math.max(gridOpacity, 0), 100) / 100,
              backgroundImage:
                "linear-gradient(to right, rgba(255,255,255,0.9) 1px, transparent 1px)," +
                "linear-gradient(to bottom, rgba(255,255,255,0.9) 1px, transparent 1px)",
              backgroundSize: `${gridCellSize} ${gridCellSize}`,
              backgroundRepeat: "repeat",
            }}
          />
        )}

        {ghostMentorEnabled && (
          <div className="absolute right-4 top-4 rounded-full bg-primary/30 px-4 py-1 text-xs font-semibold uppercase tracking-widest text-white shadow-[0_10px_30px_rgba(92,80,255,0.4)]">
            Ghost Mentor actif
          </div>
        )}
      </div>

      <Card className="space-y-5 rounded-[28px] border border-white/60 bg-white/75 p-6 shadow-[var(--shadow-card)] backdrop-blur-xl">
        <div className="space-y-3">
          <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Opacité de l'image</Label>
          <Slider
            value={[opacity]}
            onValueChange={(value) => !strobeEnabled && setOpacity(value[0])}
            min={0}
            max={100}
            step={1}
            disabled={strobeEnabled}
          />
          <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            {strobeEnabled ? "Contrôlée par le strobe" : `${opacity}%`}
          </span>
        </div>

        <div className="space-y-3">
          <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Échelle</Label>
          <Slider
            value={[scale]}
            onValueChange={(value) => setScale(value[0])}
            min={0.1}
            max={3}
            step={0.1}
          />
          <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{scale.toFixed(1)}x</span>
        </div>

        <div className="space-y-3">
          <Label className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Rotation</Label>
          <Slider
            value={[rotation]}
            onValueChange={(value) => setRotation(value[0])}
            min={-180}
            max={180}
            step={1}
          />
          <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{rotation}°</span>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPosition({ x: 0, y: 0 })}
            className="h-10 flex-1 rounded-full border-white/60 bg-white/70 text-xs font-semibold uppercase tracking-widest text-foreground shadow-inner shadow-white/40 backdrop-blur transition hover:bg-white"
          >
            <Move className="w-4 h-4 mr-2" />
            Centrer
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setRotation(0)}
            className="h-10 flex-1 rounded-full border-white/60 bg-white/70 text-xs font-semibold uppercase tracking-widest text-foreground shadow-inner shadow-white/40 backdrop-blur transition hover:bg-white"
          >
            <RotateCw className="w-4 h-4 mr-2" />
            Reset Rotation
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setScale(1)}
            className="h-10 flex-1 rounded-full border-white/60 bg-white/70 text-xs font-semibold uppercase tracking-widest text-foreground shadow-inner shadow-white/40 backdrop-blur transition hover:bg-white"
          >
            <ZoomIn className="w-4 h-4 mr-2" />
            Reset Échelle
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default ClassicMode;
