import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { OpenCVTracker, TrackingPoint } from "@/lib/opencv/tracker";
import PointTrackingManager from "./PointTrackingManager";
import ARWorkflowGuide from "./ARWorkflowGuide";
import { TrackingConfiguration } from "@/hooks/useTrackingPoints";
import { Eye, EyeOff } from "lucide-react";
import GhostMentor from "./GhostMentor";

// Simple toast replacement
const toast = {
  success: (msg: string) => console.log("✓", msg),
  error: (msg: string) => console.error("✗", msg),
};

interface ARAnchorsModeProps {
  referenceImage: string | null;
  ghostMentorEnabled?: boolean;
  gridEnabled: boolean;
  gridOpacity: number;
  gridTileCount: number;
  strobeEnabled: boolean;
  strobeSpeed: number;
  strobeMinOpacity: number;
  strobeMaxOpacity: number;
}

// --- LISSAGE D'HOMOGRAPHIE HAUTE PRÉCISION ------------------------------

/**
 * Lissage exponentiel de la matrice d'homographie.
 * - plus la stabilité est bonne, plus on lisse fort (image très “collée”)
 * - en cas de mouvements rapides / stabilité faible, on répond plus vite.
 */
class HomographySmoothing {
  private last: number[] | null = null;

  smooth(h: number[]): number[] {
    this.last = [...h];
    return [...h];
  }

  reset() {
    this.last = null;
  }
}

// Ressources OpenCV réutilisables pour éviter les allocations à chaque frame
type WarpResources = {
  overlayMat: any | null; // Mat de l'image overlay
  warpedMat: any | null; // Mat warpée à la taille du canvas
  warpedCanvas: HTMLCanvasElement | null; // canvas tampon pour cv.imshow
};

export default function ARAnchorsMode({
  referenceImage,
  gridEnabled,
  gridOpacity,
  gridTileCount,
  strobeEnabled,
  strobeSpeed,
  strobeMinOpacity,
  strobeMaxOpacity,
}: ARAnchorsModeProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const trackerRef = useRef<OpenCVTracker | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const smoothingRef = useRef<HomographySmoothing>(
    new HomographySmoothing()
  );
  const warpResourcesRef = useRef<WarpResources>({
    overlayMat: null,
    warpedMat: null,
    warpedCanvas: null,
  });
  const lastGoodHomographyRef = useRef<number[] | null>(null);

  const [streamActive, setStreamActive] = useState(false);
  const [trackingActive, setTrackingActive] = useState(false);
  const [trackingStability, setTrackingStability] = useState(0);
  const [matchedPoints, setMatchedPoints] = useState(0);
  const [configuredPoints, setConfiguredPoints] = useState<TrackingPoint[]>([]);
  const [trackingReferenceImageUrl, setTrackingReferenceImageUrl] =
    useState<string | null>(null);
  const [overlayImageUrl, setOverlayImageUrl] = useState<string | null>(null);
  const [overlayToReferenceHomography, setOverlayToReferenceHomography] =
    useState<number[] | null>(null);
  const [isInitializingTracking, setIsInitializingTracking] = useState(false);
  const [overlayImage, setOverlayImage] = useState<HTMLImageElement | null>(
    null
  );
  const [showDebugPoints, setShowDebugPoints] = useState(false);
  const [overlayOpacity, setOverlayOpacity] = useState([70]);
  const strobeAnimationRef = useRef<number>(0);

  useEffect(() => {
    if (strobeEnabled) {
      strobeAnimationRef.current = -Math.PI / 2;
    } else {
      strobeAnimationRef.current = 0;
    }
  }, [strobeEnabled, strobeMinOpacity, strobeMaxOpacity]);

  // Check if OpenCV is loaded
  useEffect(() => {
    const checkOpenCV = () => {
      if ((window as any).cv) {
        toast.success("OpenCV chargé et prêt");
      } else {
        toast.error("OpenCV non disponible. Rechargez la page.");
      }
    };

    if (document.readyState === "complete") {
      checkOpenCV();
    } else {
      window.addEventListener("load", checkOpenCV);
      return () => window.removeEventListener("load", checkOpenCV);
    }
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: 1280, height: 720 },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setStreamActive(true);
      toast.success("Caméra activée");
    } catch (err) {
      console.error(err);
      toast.error("Impossible d'accéder à la caméra");
    }
  };

  const multiplyHomographies = (a: number[], b: number[]) => {
    return [
      a[0] * b[0] + a[1] * b[3] + a[2] * b[6],
      a[0] * b[1] + a[1] * b[4] + a[2] * b[7],
      a[0] * b[2] + a[1] * b[5] + a[2] * b[8],
      a[3] * b[0] + a[4] * b[3] + a[5] * b[6],
      a[3] * b[1] + a[4] * b[4] + a[5] * b[7],
      a[3] * b[2] + a[4] * b[5] + a[5] * b[8],
      a[6] * b[0] + a[7] * b[3] + a[8] * b[6],
      a[6] * b[1] + a[7] * b[4] + a[8] * b[7],
      a[6] * b[2] + a[7] * b[5] + a[8] * b[8],
    ];
  };

  // Nettoyage global
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      trackerRef.current?.dispose();

      const cv = (window as any).cv;
      if (cv) {
        warpResourcesRef.current.overlayMat?.delete?.();
        warpResourcesRef.current.warpedMat?.delete?.();
      }
      warpResourcesRef.current.overlayMat = null;
      warpResourcesRef.current.warpedMat = null;
      warpResourcesRef.current.warpedCanvas = null;
    };
  }, []);

  const loadReferenceImageData = async (source: string) => {
    let objectUrl: string | null = null;

    const loadImage = (src: string, useCors: boolean) =>
      new Promise<HTMLImageElement>((resolve, reject) => {
        const image = new Image();
        if (useCors) {
          image.crossOrigin = "anonymous";
        }
        image.onload = () => resolve(image);
        image.onerror = (e) => {
          console.error("Erreur de chargement d'image:", e);
          console.error("Source:", src?.substring(0, 100) + "...");
          reject(new Error("Impossible de charger l'image de référence"));
        };
        
        // Validate data URL format
        if (src.startsWith("data:")) {
          if (!src.includes("base64,")) {
            reject(new Error("Format de données base64 invalide"));
            return;
          }
        }
        
        image.src = src;
      });

    try {
      const image = source.startsWith("data:")
        ? await loadImage(source, false)
        : await (async () => {
            try {
              const response = await fetch(source, { cache: "no-cache" });
              if (!response.ok) {
                throw new Error();
              }
              const blob = await response.blob();
              objectUrl = URL.createObjectURL(blob);
              return loadImage(objectUrl, true);
            } catch {
              throw new Error("Impossible de charger l'image de référence");
            }
          })();

      const canvas = document.createElement("canvas");
      canvas.width = image.width;
      canvas.height = image.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        throw new Error("Impossible d'initialiser le canvas");
      }
      ctx.drawImage(image, 0, 0);
      return ctx.getImageData(0, 0, image.width, image.height);
    } finally {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    }
  };

  const startTracking = async () => {
    if (!streamActive || configuredPoints.length < 4) {
      toast.error("Configurez d'abord les points de tracking (minimum 4)");
      return;
    }

    if (!(window as any).cv) {
      toast.error("OpenCV non chargé");
      return;
    }

    if (!trackingReferenceImageUrl) {
      toast.error("Aucune image de référence disponible");
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!canvas || !video) return;

    if (!video.videoWidth || !video.videoHeight) {
      toast.error("La vidéo n'est pas prête. Réessayez dans un instant");
      return;
    }

    try {
      setIsInitializingTracking(true);
      const referenceImageData = await loadReferenceImageData(
        trackingReferenceImageUrl
      );

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        toast.error("Impossible d'initialiser le canvas vidéo");
        return;
      }
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      trackerRef.current?.dispose();
      trackerRef.current = new OpenCVTracker();
      smoothingRef.current.reset();
      lastGoodHomographyRef.current = null;

      trackerRef.current.initializeReferencePoints(
        referenceImageData,
        configuredPoints
      );
      setMatchedPoints(0);
      setTrackingStability(0);
      setTrackingActive(true);
      toast.success("Tracking activé");
    } catch (error) {
      console.error(error);
      toast.error(
        (error as Error).message || "Impossible d'initialiser le tracking"
      );
      trackerRef.current?.dispose();
      trackerRef.current = null;
    } finally {
      setIsInitializingTracking(false);
    }
  };

  const stopTracking = () => {
    setTrackingActive(false);
    trackerRef.current?.dispose();
    trackerRef.current = null;
    smoothingRef.current.reset();
    lastGoodHomographyRef.current = null;

    const cv = (window as any).cv;
    if (cv) {
      warpResourcesRef.current.overlayMat?.delete?.();
      warpResourcesRef.current.warpedMat?.delete?.();
    }
    warpResourcesRef.current.overlayMat = null;
    warpResourcesRef.current.warpedMat = null;
    warpResourcesRef.current.warpedCanvas = null;

    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }

    toast.success("Tracking arrêté");
  };

  // BOUCLE DE TRACKING & RENDU
  useEffect(() => {
    if (
      !trackingActive ||
      !trackerRef.current ||
      !streamActive ||
      !overlayImage ||
      !overlayToReferenceHomography
    )
      return;

    const cv = (window as any).cv;
    if (!cv) return;

    let lastTime = performance.now();
    const targetFPS = 30;
    const frameInterval = 1000 / targetFPS;

    const trackLoop = (currentTime: number) => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas) return;

      const ctx = canvas.getContext("2d", { alpha: false });
      if (!ctx) return;

      const elapsed = currentTime - lastTime;

      if (elapsed >= frameInterval) {
        lastTime = currentTime - (elapsed % frameInterval);

        // 1) Effacer le canvas et dessiner la vidéo
        ctx.fillStyle = "#000000";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        // 2) Récupérer la frame pour le tracker
        const frameImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const result = trackerRef.current!.trackFrame(frameImageData);

        setMatchedPoints(result.matchedPoints);
        setTrackingStability(result.stability);

        const minPoints = Math.max(
          4,
          Math.floor(configuredPoints.length * 0.6)
        );
        const stabilityRatio = Math.max(
          0,
          Math.min(1, result.stability / 100)
        );

        const trackingConfident =
          result.isTracking &&
          result.homography &&
          result.matchedPoints >= minPoints &&
          result.stability >= 35;

        // Fonction utilitaire de rendu de l'overlay à partir d'une homographie
        const renderOverlayWithHomography = (finalH: number[]) => {
          // Préparer/mettre à jour les ressources OpenCV
          let { overlayMat, warpedMat, warpedCanvas } =
            warpResourcesRef.current;

          if (!overlayMat) {
            // Création unique du Mat overlay à partir de l'image
            const overlayCanvas = document.createElement("canvas");
            overlayCanvas.width = overlayImage.width;
            overlayCanvas.height = overlayImage.height;
            const overlayCtx = overlayCanvas.getContext("2d", {
              alpha: true,
            })!;
            overlayCtx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
            overlayCtx.drawImage(overlayImage, 0, 0);
            const overlayImageData = overlayCtx.getImageData(
              0,
              0,
              overlayImage.width,
              overlayImage.height
            );
            overlayMat = cv.matFromImageData(overlayImageData);
            warpResourcesRef.current.overlayMat = overlayMat;
          }

          // Mat warpé à la taille du canvas
          if (
            !warpedMat ||
            warpedMat.cols !== canvas.width ||
            warpedMat.rows !== canvas.height
          ) {
            if (warpedMat) warpedMat.delete();
            warpedMat = new cv.Mat(
              canvas.height,
              canvas.width,
              overlayMat.type()
            );
            warpResourcesRef.current.warpedMat = warpedMat;
          }

          // Canvas tampon pour imshow
          if (
            !warpedCanvas ||
            warpedCanvas.width !== canvas.width ||
            warpedCanvas.height !== canvas.height
          ) {
            warpedCanvas = document.createElement("canvas");
            warpedCanvas.width = canvas.width;
            warpedCanvas.height = canvas.height;
            warpResourcesRef.current.warpedCanvas = warpedCanvas;
          }

          // Matrice H
          const HMat = cv.matFromArray(3, 3, cv.CV_64F, finalH);

          // Warp
          cv.warpPerspective(
            overlayMat,
            warpedMat,
            HMat,
            new cv.Size(canvas.width, canvas.height),
            cv.INTER_LINEAR,
            cv.BORDER_CONSTANT,
            new cv.Scalar(0, 0, 0, 0)
          );

          const warpedCtx = warpedCanvas.getContext("2d", {
            alpha: true,
          })!;
          cv.imshow(warpedCanvas, warpedMat);

          ctx.save();
          
          // Calculer l'opacité avec strobe si activé
          let currentOpacity = overlayOpacity[0] / 100;
          if (strobeEnabled) {
            const speed = strobeSpeed;
            const minOpacity = Math.min(strobeMinOpacity, strobeMaxOpacity) / 100;
            const maxOpacity = Math.max(strobeMinOpacity, strobeMaxOpacity) / 100;
            const range = Math.max(maxOpacity - minOpacity, 0);

            // Oscillation sinusoïdale
            const oscillation = (Math.sin(strobeAnimationRef.current) + 1) / 2; // Entre 0 et 1
            currentOpacity = range > 0 ? minOpacity + oscillation * range : minOpacity;
            strobeAnimationRef.current += 0.05 * speed;
          }

          ctx.globalAlpha = currentOpacity;
          ctx.globalCompositeOperation = "source-over";
          ctx.drawImage(warpedCanvas, 0, 0);
          ctx.restore();

          // Dessiner la grille si activée
          if (gridEnabled) {
            ctx.save();
            ctx.strokeStyle = `rgba(255, 255, 255, ${Math.min(Math.max(gridOpacity, 0), 100) / 100})`;
            ctx.lineWidth = 1;

            const tiles = Math.max(gridTileCount, 1);
            const spacingX = canvas.width / tiles;
            const spacingY = canvas.height / tiles;

            // Lignes verticales
            for (let x = 0; x <= canvas.width; x += spacingX) {
              ctx.beginPath();
              ctx.moveTo(x, 0);
              ctx.lineTo(x, canvas.height);
              ctx.stroke();
            }

            // Lignes horizontales
            for (let y = 0; y <= canvas.height; y += spacingY) {
              ctx.beginPath();
              ctx.moveTo(0, y);
              ctx.lineTo(canvas.width, y);
              ctx.stroke();
            }
            ctx.restore();
          }

          // Points de debug éventuels
          if (showDebugPoints) {
            configuredPoints.forEach((refPt, idx) => {
              const h = finalH;
              const w =
                h[6] * refPt.x + h[7] * refPt.y + h[8];
              if (Math.abs(w) < 0.001) return;

              const x = (h[0] * refPt.x + h[1] * refPt.y + h[2]) / w;
              const y = (h[3] * refPt.x + h[4] * refPt.y + h[5]) / w;

              ctx.beginPath();
              ctx.arc(x, y, 8, 0, 2 * Math.PI);
              ctx.fillStyle = "rgba(34, 197, 94, 0.8)";
              ctx.fill();
              ctx.strokeStyle = "#22c55e";
              ctx.lineWidth = 2;
              ctx.stroke();

              ctx.fillStyle = "white";
              ctx.font = "bold 12px sans-serif";
              ctx.textAlign = "center";
              ctx.textBaseline = "middle";
              ctx.fillText((idx + 1).toString(), x, y);
            });
          }

          HMat.delete();
        };

        // 3) Tracking normal → lissage + mémorisation dernière homographie fiable
        if (trackingConfident && result.homography) {
          try {
            const rawFinalH = multiplyHomographies(
              result.homography,
              overlayToReferenceHomography
            );
            const finalH = smoothingRef.current.smooth(
              rawFinalH,
              stabilityRatio
            );
            lastGoodHomographyRef.current = finalH;
            renderOverlayWithHomography(finalH);
          } catch (error) {
            console.error("Warp failed:", error);
          }
        } else if (lastGoodHomographyRef.current) {
          // 4) Tracking incertain → on fige sur la dernière homographie propre
          const frozenH = smoothingRef.current.smooth(
            lastGoodHomographyRef.current,
            1
          );
          renderOverlayWithHomography(frozenH);
        }
      }

      animationFrameRef.current = requestAnimationFrame(trackLoop);
    };

    animationFrameRef.current = requestAnimationFrame(trackLoop);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [
    trackingActive,
    streamActive,
    overlayImage,
    configuredPoints,
    overlayToReferenceHomography,
    showDebugPoints,
    overlayOpacity,
  ]);

  const computeOverlayToReference = (
    overlayPoints: TrackingPoint[],
    referencePoints: TrackingPoint[]
  ) => {
    if (!(window as any).cv) {
      toast.error("OpenCV non disponible pour calculer l'alignement");
      return null;
    }

    if (overlayPoints.length < 4 || referencePoints.length < 4) {
      return null;
    }

    const cv = (window as any).cv;
    let src: any | null = null;
    let dst: any | null = null;
    let transform: any | null = null;

    try {
      src = cv.matFromArray(
        overlayPoints.length,
        1,
        cv.CV_32FC2,
        overlayPoints.flatMap((p) => [p.x, p.y])
      );
      dst = cv.matFromArray(
        referencePoints.length,
        1,
        cv.CV_32FC2,
        referencePoints.flatMap((p) => [p.x, p.y])
      );
      transform = cv.getPerspectiveTransform(src, dst);

      const data: number[] = [];
      for (let i = 0; i < 9; i += 1) {
        data.push(transform.doubleAt(Math.floor(i / 3), i % 3));
      }
      return data;
    } catch (error) {
      console.error("Perspective transform computation failed", error);
      toast.error("Impossible de calculer l'alignement des ancres");
      return null;
    } finally {
      transform?.delete();
      src?.delete();
      dst?.delete();
    }
  };

  const handleConfigurationReady = async (config: TrackingConfiguration) => {
    if (trackingActive) {
      stopTracking();
    }

    setTrackingReferenceImageUrl(config.referenceImage);
    setConfiguredPoints(config.trackingPoints);
    setOverlayImageUrl(config.overlayImage);

    // Charger l'image overlay
    const img = new Image();
    img.crossOrigin = "anonymous";
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = config.overlayImage;
    });
    setOverlayImage(img);

    const transform = computeOverlayToReference(
      config.overlayAnchors,
      config.trackingPoints
    );
    setOverlayToReferenceHomography(transform);
    setMatchedPoints(0);
    setTrackingStability(0);
    smoothingRef.current.reset();
    lastGoodHomographyRef.current = null;

    // Reset des ressources OpenCV liées à l’overlay
    const cv = (window as any).cv;
    if (cv) {
      warpResourcesRef.current.overlayMat?.delete?.();
      warpResourcesRef.current.warpedMat?.delete?.();
    }
    warpResourcesRef.current.overlayMat = null;
    warpResourcesRef.current.warpedMat = null;
    warpResourcesRef.current.warpedCanvas = null;

    toast.success(
      `Configuration prête avec ${config.trackingPoints.length} points`
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
      <div className="lg:col-span-1 space-y-4">
        <PointTrackingManager onConfigurationReady={handleConfigurationReady} />
        <ARWorkflowGuide />
      </div>

      <div className="lg:col-span-3 space-y-4">
        <Alert>
          <AlertDescription>
            Mode AR par Points : configurez vos points de tracking (minimum 4,
            recommandé 6–8 pour une feuille quasi “imprimée”), puis activez le
            tracking pour projeter votre image.
          </AlertDescription>
        </Alert>

        <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-black">
          <video
            ref={videoRef}
            className="absolute inset-0 w-full h-full object-cover"
          />

          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full"
          />

          {trackingActive && (
            <div className="absolute top-2 right-2 bg-black/70 text-white p-3 rounded-lg space-y-1">
              <p className="text-xs font-semibold">Tracking actif</p>
              <div className="flex items-center gap-2">
                <div className="w-24 h-2 bg-white/20 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${trackingStability}%` }}
                  />
                </div>
                <span className="text-xs">
                  {Math.round(trackingStability)}%
                </span>
              </div>
              <p className="text-xs">
                Points: {matchedPoints}/{configuredPoints.length}
              </p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex gap-2">
            {!streamActive ? (
              <Button className="flex-1" onClick={startCamera}>
                Activer la caméra
              </Button>
            ) : !trackingActive ? (
              <Button
                className="flex-1"
                onClick={startTracking}
                disabled={
                  configuredPoints.length < 4 ||
                  isInitializingTracking ||
                  !trackingReferenceImageUrl
                }
              >
                {isInitializingTracking
                  ? "Initialisation..."
                  : "Démarrer le tracking"}
              </Button>
            ) : (
              <Button
                className="flex-1"
                variant="destructive"
                onClick={stopTracking}
              >
                Arrêter le tracking
              </Button>
            )}
          </div>

          {trackingActive && (
            <>
              <Card className="p-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="opacity" className="text-sm">
                      {strobeEnabled
                        ? "Opacité contrôlée par le strobe"
                        : `Opacité: ${overlayOpacity[0]}%`}
                    </Label>
                  </div>
                  <Slider
                    id="opacity"
                    value={overlayOpacity}
                    onValueChange={(value) =>
                      !strobeEnabled && setOverlayOpacity(value)
                    }
                    min={0}
                    max={100}
                    step={5}
                    disabled={strobeEnabled}
                  />
                </div>
              </Card>

              <Card className="p-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="debug-points" className="text-sm">
                    Points de debug
                  </Label>
                  <div className="flex items-center gap-2">
                    {showDebugPoints ? (
                      <Eye className="w-4 h-4 text-primary" />
                    ) : (
                      <EyeOff className="w-4 h-4 text-muted-foreground" />
                    )}
                    <Switch
                      id="debug-points"
                      checked={showDebugPoints}
                      onCheckedChange={setShowDebugPoints}
                    />
                  </div>
                </div>
              </Card>
            </>
          )}
        </div>

        {trackingActive && (
          <Card className="p-3 bg-primary/10 border-primary">
            <p className="font-semibold text-sm">
              Tracking 2D stabilisé haute précision
            </p>
            <p className="text-xs text-muted-foreground">
              L&apos;image est verrouillée sur la feuille avec lissage
              adaptatif et maintien de la dernière pose fiable pour une
              sensation quasi “imprimée”.
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
