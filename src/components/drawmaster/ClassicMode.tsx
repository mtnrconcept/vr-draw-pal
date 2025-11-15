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
      setDynamicOpacity(opacity / 100);
      strobePhaseRef.current = 0;
      return;
    }

    let frame: number;
    const animate = () => {
      const min = Math.min(strobeMinOpacity, strobeMaxOpacity) / 100;
      const max = Math.max(strobeMinOpacity, strobeMaxOpacity) / 100;
      const range = Math.max(max - min, 0);

      strobePhaseRef.current += 0.05 * strobeSpeed;
      const oscillation = (Math.sin(strobePhaseRef.current) + 1) / 2;
      const value = range > 0 ? min + oscillation * range : min;
      setDynamicOpacity(value);
      frame = requestAnimationFrame(animate);
    };

    frame = requestAnimationFrame(animate);
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
    <div className="space-y-4">
      <div className="relative w-full aspect-video bg-muted rounded-lg overflow-hidden">
        {/* Camera feed */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
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
          <div className="absolute top-4 right-4 bg-primary/20 text-primary-foreground px-3 py-1 rounded-full text-sm">
            Ghost Mentor Actif
          </div>
        )}
      </div>

      <Card className="p-4 space-y-4">
        <div>
          <Label>Opacité de l'image</Label>
          <Slider
            value={[opacity]}
            onValueChange={(value) => !strobeEnabled && setOpacity(value[0])}
            min={0}
            max={100}
            step={1}
            className="mt-2"
            disabled={strobeEnabled}
          />
          <span className="text-sm text-muted-foreground">
            {strobeEnabled ? "Contrôlée par le strobe" : `${opacity}%`}
          </span>
        </div>

        <div>
          <Label>Échelle</Label>
          <Slider
            value={[scale]}
            onValueChange={(value) => setScale(value[0])}
            min={0.1}
            max={3}
            step={0.1}
            className="mt-2"
          />
          <span className="text-sm text-muted-foreground">{scale.toFixed(1)}x</span>
        </div>

        <div>
          <Label>Rotation</Label>
          <Slider
            value={[rotation]}
            onValueChange={(value) => setRotation(value[0])}
            min={-180}
            max={180}
            step={1}
            className="mt-2"
          />
          <span className="text-sm text-muted-foreground">{rotation}°</span>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPosition({ x: 0, y: 0 })}
          >
            <Move className="w-4 h-4 mr-2" />
            Centrer
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setRotation(0)}
          >
            <RotateCw className="w-4 h-4 mr-2" />
            Reset Rotation
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setScale(1)}
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
