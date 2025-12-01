import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { processImageForPencils } from "@/lib/art/pencil-guide";
import PerspectiveGrid, { VanishingPoint } from "./PerspectiveGrid";

interface VRModeProps {
  referenceImage: string | null;
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
  assistanceLevel?: "soft" | "medium" | "hard";
  showGhostLines?: boolean;
  showHeatmap?: boolean;
  showTrajectories?: boolean;
  sensitivity?: number;
  onAnalysisUpdate?: (update: { errors?: number; corrections?: number; accuracy?: number | null; feedback?: string | null }) => void;
  // New props
  grayscaleMode?: boolean;
  showPencilGuides?: boolean;
  activePencilFilter?: string | null;
  isolateZone?: boolean;
  // Perspective props
  perspectiveEnabled: boolean;
  horizonPosition: number;
  vanishingPoints: VanishingPoint[];
  onVanishingPointsChange: (points: VanishingPoint[]) => void;
  perspectiveLineCount: number;
  perspectiveOpacity: number;
}

// Minimal type definition for WebXR to avoid build errors if types are missing
type XRSession = any;

/**
 * VRMode attempts to use the WebXR API to start an immersive VR session.
 * On devices like Vision Pro (or any headset that supports immersive‑vr),
 * the user can tap the "Entrer en VR" button to enter the headset view.
 *
 * When WebXR is not available, we fall back to a pseudo‑VR mode that still
 * shows the camera overlay and reference image but explains that VR is not
 * supported on this device.
 */
const VRMode = ({
  referenceImage,
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
  perspectiveEnabled,
  horizonPosition,
  vanishingPoints,
  onVanishingPointsChange,
  perspectiveLineCount,
  perspectiveOpacity,
}: VRModeProps) => {
  const [isSupported, setIsSupported] = useState<boolean | null>(null);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [status, setStatus] = useState<string>("");
  const [processedImage, setProcessedImage] = useState<string | null>(null);

  const xrSessionRef = useRef<XRSession | null>(null);

  // Check for WebXR support on mount
  useEffect(() => {
    const checkSupport = async () => {
      try {
        const navAny = navigator as any;
        if (navAny.xr && navAny.xr.isSessionSupported) {
          const supported = await navAny.xr.isSessionSupported("immersive-vr");
          setIsSupported(supported);
          setStatus(
            supported
              ? "Appareil compatible WebXR détecté. Vision Pro / casque VR prêt."
              : "WebXR détecté mais mode immersif VR non disponible sur cet appareil."
          );
        } else {
          setIsSupported(false);
          setStatus(
            "Ce navigateur ne supporte pas WebXR. Le mode VR reste en mode démo 2D."
          );
        }
      } catch (err) {
        console.error(err);
        setIsSupported(false);
        setStatus("Erreur lors de la vérification WebXR.");
      }
    };
    checkSupport();
  }, []);

  // Process image for pencil guides
  useEffect(() => {
    if (!referenceImage || !showPencilGuides) {
      setProcessedImage(null);
      return;
    }

    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.src = referenceImage;
    img.onload = () => {
      const overlay = processImageForPencils(img, activePencilFilter || null, isolateZone);
      setProcessedImage(overlay);
    };
  }, [referenceImage, showPencilGuides, activePencilFilter, isolateZone]);

  const startVRSession = async () => {
    try {
      const navAny = navigator as any;
      if (!navAny.xr) {
        setStatus("WebXR non disponible dans ce navigateur.");
        return;
      }
      const session: XRSession = await navAny.xr.requestSession("immersive-vr", {
        requiredFeatures: ["local-floor"],
      });
      xrSessionRef.current = session;
      setIsSessionActive(true);
      setStatus("Session VR Vision Pro / casque VR démarrée.");
      session.addEventListener("end", () => {
        setIsSessionActive(false);
        setStatus("Session VR terminée.");
      });
    } catch (err) {
      console.error(err);
      setStatus(
        "Impossible de démarrer la session VR (permissions ou support manquant)."
      );
    }
  };

  const endVRSession = async () => {
    try {
      if (xrSessionRef.current) {
        await xrSessionRef.current.end();
        xrSessionRef.current = null;
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSessionActive(false);
    }
  };

  const tileCount = Math.max(gridTileCount, 1);
  const gridCellSize = `calc(100% / ${tileCount})`;
  const clampedGridOpacity = Math.min(Math.max(gridOpacity, 0), 100) / 100;
  const strobeOverlayOpacity = strobeEnabled ? clampedGridOpacity : 0;

  const displayImage = (showPencilGuides && processedImage) ? processedImage : referenceImage;
  const isIsolated = showPencilGuides && isolateZone && activePencilFilter;

  // Container dimensions for perspective (using 16:9 aspect ratio)
  const containerWidth = 1600;
  const containerHeight = 900;

  return (
    <div className="space-y-4">
      <Card className="mobile-card space-y-4 rounded-[28px] border border-white/60 bg-white/85 p-4 shadow-[var(--shadow-card)] backdrop-blur-xl sm:p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              Mode VR Vision Pro
            </p>
            <p className="text-[11px] text-muted-foreground">
              Projette votre référence dans un environnement immersif compatible Vision Pro / WebXR.
            </p>
          </div>
          <div className="flex items-center gap-2">
            {!isSessionActive ? (
              <Button
                size="sm"
                className="h-9 rounded-full bg-accent px-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-white shadow-[0_0_30px_rgba(147,51,234,0.7)] hover:bg-accent/90"
                onClick={startVRSession}
                disabled={isSupported === false}
              >
                Entrer en VR
              </Button>
            ) : (
              <Button
                size="sm"
                variant="outline"
                className="h-9 rounded-full border-white/60 bg-white/70 px-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-foreground hover:bg-white"
                onClick={endVRSession}
              >
                Quitter la VR
              </Button>
            )}
          </div>
        </div>
        <p className="text-xs text-muted-foreground">{status}</p>
      </Card>

      <div className="space-y-3">
        <Card className="relative overflow-hidden rounded-[28px] border border-white/60 bg-white/85 shadow-[var(--shadow-card)]">
          <div className="relative w-full" style={{ aspectRatio: 16 / 9 }}>
            {/* VR preview placeholder */}
            <div
              className="absolute inset-0 flex items-center justify-center bg-[radial-gradient(circle_at_center,_rgba(245,245,245,0.6),_rgba(245,245,245,0.95))]"
              style={{ filter: `brightness(${brightness}%) contrast(${contrast}%)` }}
            >
              {displayImage ? (
                <img
                  src={displayImage}
                  alt="VR Reference"
                  className={`max-h-full max-w-full rounded-[20px] border border-white/20 object-contain shadow-[0_0_40px_rgba(0,0,0,0.15)] ${isIsolated ? "" : "mix-blend-multiply"}`}
                  style={{ opacity: isIsolated ? 1 : 0.8 }}
                />
              ) : (
                <p className="mx-6 text-center text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  Charge une image de référence dans les outils de projection pour la voir en VR
                </p>
              )}
            </div>
            {/* Grid overlay */}
            {gridEnabled && (
              <div
                className="pointer-events-none absolute inset-0"
                style={{
                  opacity: clampedGridOpacity,
                  backgroundImage:
                    "linear-gradient(to right, rgba(0,0,0,0.3) 1px, transparent 1px)," +
                    "linear-gradient(to bottom, rgba(0,0,0,0.3) 1px, transparent 1px)",
                  backgroundSize: `${gridCellSize} ${gridCellSize}`,
                  backgroundRepeat: "repeat",
                }}
              />
            )}
            {/* Subtle strobe overlay (visual hint only) */}
            {strobeEnabled && (
              <div
                className="pointer-events-none absolute inset-0 bg-gradient-to-br from-black/10 via-transparent to-black/10"
                style={{
                  opacity: strobeOverlayOpacity * 0.7,
                  mixBlendMode: "screen",
                }}
              />
            )}
            {/* Perspective Grid Overlay */}
            <PerspectiveGrid
              enabled={perspectiveEnabled}
              horizonPosition={horizonPosition}
              vanishingPoints={vanishingPoints}
              onVanishingPointsChange={onVanishingPointsChange}
              lineCount={perspectiveLineCount}
              gridOpacity={perspectiveOpacity}
              containerWidth={containerWidth}
              containerHeight={containerHeight}
            />
            {/* Mode labels */}
            <div className="pointer-events-none absolute left-4 top-4 flex flex-col gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-foreground">
              <span className="inline-flex items-center rounded-full bg-white/70 px-3 py-1 shadow-md shadow-black/10">
                Vision Pro / WebXR
              </span>
              {isSessionActive && (
                <span className="inline-flex items-center rounded-full bg-accent px-3 py-1 text-white shadow-md shadow-accent/50">
                  Session VR active
                </span>
              )}
            </div>
          </div>
        </Card>
        <p className="text-[11px] text-muted-foreground">
          Une fois la session VR démarrée, la scène est transférée dans le casque. La prévisualisation ci-dessus reste une représentation 2D de votre overlay.
        </p>
      </div>
    </div>
  );
};

export default VRMode;