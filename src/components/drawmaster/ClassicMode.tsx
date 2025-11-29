import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { RotateCw } from "lucide-react";
import { requestCameraStream, CameraAccessError } from "@/lib/media/camera";
import { toast } from "sonner";
import { processImageForPencils } from "@/lib/art/pencil-guide";
import AIOverlay from "./AIOverlay";
import AIToolbar from "./AIToolbar";
import AIActionButtons from "./AIActionButtons";
import FloatingToolsPanel from "./FloatingToolsPanel";

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
  // Ghost Mentor props
  assistanceLevel: "soft" | "medium" | "hard";
  showGhostLines: boolean;
  showHeatmap: boolean;
  showTrajectories: boolean;
  sensitivity: number;
  onAnalysisUpdate?: (update: { errors?: number; corrections?: number; accuracy?: number | null; feedback?: string | null }) => void;
  // New props
  grayscaleMode?: boolean;
  showPencilGuides?: boolean;
  activePencilFilter?: string | null;
  isolateZone?: boolean;
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
  assistanceLevel,
  showGhostLines,
  showHeatmap,
  showTrajectories,
  sensitivity,
  onAnalysisUpdate,
  grayscaleMode,
  showPencilGuides,
  activePencilFilter,
  isolateZone,
}: ClassicModeProps) => {
  const [opacity, setOpacity] = useState(50);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [rotation, setRotation] = useState(0);
  const [scale, setScale] = useState(1);
  const canvasRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const strobePhaseRef = useRef(0);
  const [dynamicOpacity, setDynamicOpacity] = useState(opacity / 100);
  const [cameraAspectRatio, setCameraAspectRatio] = useState(4 / 3);

  // Pencil Guide State
  const [processedOverlay, setProcessedOverlay] = useState<string | null>(null);

  // AI Overlay States
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [activeActions, setActiveActions] = useState<string[]>(["style-active"]);
  const [showAIGuides, setShowAIGuides] = useState(false);
  const [showAIGrid, setShowAIGrid] = useState(false);
  const [showAnatomy, setShowAnatomy] = useState(false);
  const [showLighting, setShowLighting] = useState(false);
  const [showToolsPanel, setShowToolsPanel] = useState(false);

  const handleToolSelect = (tool: string) => {
    setActiveTool(tool === activeTool ? null : tool);

    // Toggle overlays based on tool
    switch (tool) {
      case "guides":
        setShowAIGuides(!showAIGuides);
        break;
      case "anatomy":
        setShowAnatomy(!showAnatomy);
        break;
      case "lighting":
        setShowLighting(!showLighting);
        break;
      case "layers":
        setShowToolsPanel(!showToolsPanel);
        break;
    }
  };

  const handleAction = (action: string) => {
    if (activeActions.includes(action)) {
      setActiveActions(activeActions.filter(a => a !== action));
    } else {
      setActiveActions([...activeActions, action]);
    }

    // Handle specific actions
    switch (action) {
      case "zone-isolation":
        // Toggle zone isolation
        break;
      case "ai-help":
        // Request AI help
        toast.info("Assistant IA activé");
        break;
    }
  };

  const updateCameraAspectRatio = useCallback(() => {
    const video = videoRef.current;
    if (video && video.videoWidth && video.videoHeight) {
      const ratio = video.videoWidth / video.videoHeight;
      if (ratio > 0) {
        setCameraAspectRatio(ratio);
      }
    }
  }, []);

  // Process image for pencil guides
  useEffect(() => {
    if (!referenceImage || !showPencilGuides) {
      setProcessedOverlay(null);
      return;
    }

    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.src = referenceImage;
    img.onload = () => {
      const overlay = processImageForPencils(img, activePencilFilter || null, isolateZone);
      setProcessedOverlay(overlay);
    };
  }, [referenceImage, showPencilGuides, activePencilFilter, isolateZone]);

  useEffect(() => {
    // Initialize camera stream
    const initCamera = async () => {
      try {
        const stream = await requestCameraStream({
          video: { facingMode: "environment" },
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = updateCameraAspectRatio;
        }
      } catch (error) {
        const message =
          error instanceof CameraAccessError
            ? error.message
            : "Erreur d'accès à la caméra";
        console.error("Erreur d'accès à la caméra:", error);
        toast.error(message);
      }
    };

    initCamera();

    return () => {
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
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

  // Basic analysis loop for Classic Mode
  useEffect(() => {
    if (!onAnalysisUpdate || !ghostMentorEnabled) return;

    const interval = setInterval(() => {
      // In Classic Mode without tracking, we can't give precise accuracy.
      // We provide general feedback.
      onAnalysisUpdate({
        accuracy: null,
        errors: 0,
        corrections: 0,
        feedback: "Mode projection actif. Alignez votre dessin avec le modèle."
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [onAnalysisUpdate, ghostMentorEnabled]);

  const tileCount = Math.max(gridTileCount, 1);
  const gridCellSize = `calc(100% / ${tileCount})`;

  // Determine image filters
  const getImageFilter = () => {
    if (showGhostLines) return "grayscale(100%) invert(100%) contrast(150%)";
    if (grayscaleMode) return "grayscale(100%) contrast(120%)";
    return "none";
  };

  const isIsolated = showPencilGuides && isolateZone && activePencilFilter;

  return (
    <div className="mobile-safe-area space-y-6 mobile-stack-gap">
      <div
        className="relative w-full overflow-hidden rounded-[28px] border border-white/60 bg-black/80 shadow-[var(--shadow-card)]"
        style={{ aspectRatio: cameraAspectRatio }}
      >
        {/* Camera feed */}
        <video
          ref={videoRef}
          data-drawmaster-video="primary"
          autoPlay
          playsInline
          muted
          className="h-full w-full object-contain"
          onLoadedMetadata={updateCameraAspectRatio}
          style={{ filter: `brightness(${brightness}%) contrast(${contrast}%)` }}
        />

        {/* Reference image overlay */}
        {referenceImage && (
          <div
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
            style={{ opacity: dynamicOpacity }}
          >
            {/* Main Reference Image - Hidden if isolated */}
            {!isIsolated && (
              <img
                src={referenceImage}
                alt="Reference"
                className="max-w-full max-h-full absolute"
                style={{
                  transform: `translate(${position.x}px, ${position.y}px) rotate(${rotation}deg) scale(${scale})`,
                  filter: getImageFilter(),
                }}
              />
            )}

            {/* Pencil Guide Overlay */}
            {showPencilGuides && processedOverlay && (
              <img
                src={processedOverlay}
                alt="Pencil Guide Overlay"
                className={`max-w-full max-h-full absolute ${isIsolated ? "" : "mix-blend-multiply"}`}
                style={{
                  transform: `translate(${position.x}px, ${position.y}px) rotate(${rotation}deg) scale(${scale})`,
                  opacity: isIsolated ? 1 : 0.8,
                }}
              />
            )}
          </div>
        )}

        {/* Ghost Mentor Overlays */}
        {ghostMentorEnabled && showHeatmap && (
          <div
            className="absolute inset-0 pointer-events-none mix-blend-overlay opacity-50"
            style={{
              background: "radial-gradient(circle at 50% 50%, rgba(255, 0, 0, 0.2), transparent 70%)"
            }}
          />
        )}

        {ghostMentorEnabled && showTrajectories && (
          <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-60">
            <path
              d="M 100 100 Q 200 50 300 100 T 500 100"
              fill="none"
              stroke="#00ff00"
              strokeWidth="2"
              strokeDasharray="5,5"
            />
          </svg>
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

        {/* AI Overlay - Guides, grilles, commentaires */}
        <AIOverlay
          enabled={ghostMentorEnabled}
          mode="classic"
          showGuides={showAIGuides}
          showGrid={showAIGrid || gridEnabled}
          showAnatomy={showAnatomy}
          showLighting={showLighting}
          showComments={ghostMentorEnabled}
        />

        {/* AI Toolbar - Barre d'outils latérale */}
        <AIToolbar
          onToolSelect={handleToolSelect}
          activeTool={activeTool}
          position="left"
        />

        {/* AI Action Buttons - Boutons d'action en bas */}
        <AIActionButtons
          onAction={handleAction}
          activeActions={activeActions}
        />

        {/* Floating Tools Panel - Panneau d'outils flottant */}
        <FloatingToolsPanel
          visible={showToolsPanel}
          position={{ bottom: "20%", right: "5%" }}
        />
      </div>

      <Card className="mobile-card space-y-5 rounded-[28px] border border-white/60 bg-white/75 p-4 shadow-[var(--shadow-card)] backdrop-blur-xl sm:p-6">
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
            className="flex-1"
            onClick={() => {
              setPosition({ x: 0, y: 0 });
              setRotation(0);
              setScale(1);
            }}
          >
            <RotateCw className="mr-2 h-4 w-4" />
            Réinitialiser
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default ClassicMode;
