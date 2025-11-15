import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { OpenCVTracker, TrackingPoint } from "@/lib/opencv/tracker";
import PointTrackingManager from "./PointTrackingManager";
import { TrackingConfiguration } from "@/hooks/useTrackingPoints";
import {
  AlertTriangle,
  Eye,
  EyeOff,
  LocateFixed,
  Maximize2,
  Minimize2,
} from "lucide-react";

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
  contrast: number;
  brightness: number;
}

// --- LISSAGE D'HOMOGRAPHIE HAUTE PRÉCISION ------------------------------

/**
 * Lissage exponentiel de la matrice d'homographie.
 * - plus la stabilité est bonne, plus on lisse fort (image très “collée”)
 * - en cas de mouvements rapides / stabilité faible, on répond plus vite.
 */
class HomographySmoothing {
  private last: number[] | null = null;

  smooth(h: number[], blend = 1): number[] {
    const alpha = Math.min(Math.max(blend, 0), 1);

    if (!this.last) {
      this.last = [...h];
      return [...h];
    }

    const smoothed = this.last.map((previous, index) => {
      const target = h[index] ?? 0;
      return previous * (1 - alpha) + target * alpha;
    });

    this.last = [...smoothed];
    return [...smoothed];
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
  contrast,
  brightness,
}: ARAnchorsModeProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);
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
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hasLostAnchors, setHasLostAnchors] = useState(false);
  const [calibrationTrigger, setCalibrationTrigger] = useState(0);
  const anchorLossFramesRef = useRef(0);
  const quickRestartingRef = useRef(false);
  const wasTrackingBeforeCalibrationRef = useRef(false);

  useEffect(() => {
    if (strobeEnabled) {
      strobeAnimationRef.current = -Math.PI / 2;
    } else {
      strobeAnimationRef.current = 0;
    }
  }, [strobeEnabled, strobeMinOpacity, strobeMaxOpacity]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement === videoContainerRef.current);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = async () => {
    const container = videoContainerRef.current;
    if (!container) return;

    try {
      if (document.fullscreenElement === container) {
        await document.exitFullscreen?.();
      } else if (!document.fullscreenElement) {
        await container.requestFullscreen?.();
      } else if (document.exitFullscreen) {
        await document.exitFullscreen();
        if (container.requestFullscreen) {
          await container.requestFullscreen();
        }
      }
    } catch (error) {
      console.error("Impossible de changer le mode plein écran", error);
    }
  };

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
      anchorLossFramesRef.current = 0;
      setHasLostAnchors(false);
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

  const loadReferenceImageData = useCallback(async (source: string) => {
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
  }, []);

  const initializeTracker = useCallback(async () => {
    if (!trackingReferenceImageUrl) {
      throw new Error("Aucune image de référence disponible");
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!canvas || !video) {
      throw new Error("Flux vidéo indisponible");
    }

    if (!video.videoWidth || !video.videoHeight) {
      throw new Error("La vidéo n'est pas prête. Réessayez dans un instant");
    }

    const referenceImageData = await loadReferenceImageData(
      trackingReferenceImageUrl
    );

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Impossible d'initialiser le canvas vidéo");
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
  }, [configuredPoints, loadReferenceImageData, trackingReferenceImageUrl]);

  const startTracking = useCallback(
    async (options?: { silent?: boolean }) => {
      const silent = options?.silent ?? false;

      if (!streamActive || configuredPoints.length < 4) {
        if (!silent) {
          toast.error("Configurez d'abord les points de tracking (minimum 4)");
        }
        return false;
      }

      if (!(window as any).cv) {
        if (!silent) {
          toast.error("OpenCV non chargé");
        }
        return false;
      }

      if (!trackingReferenceImageUrl) {
        if (!silent) {
          toast.error("Aucune image de référence disponible");
        }
        return false;
      }

      if (!silent) {
        setIsInitializingTracking(true);
      }

      try {
        await initializeTracker();
        setTrackingActive(true);
        setHasLostAnchors(false);
        if (!silent) {
          toast.success("Tracking activé");
        }
        return true;
      } catch (error) {
        console.error(error);
        if (!silent) {
          toast.error(
            (error as Error).message ||
              "Impossible d'initialiser le tracking"
          );
        }
        trackerRef.current?.dispose();
        trackerRef.current = null;
        return false;
      } finally {
        if (!silent) {
          setIsInitializingTracking(false);
        }
      }
    },
    [
      configuredPoints.length,
      initializeTracker,
      streamActive,
      trackingReferenceImageUrl,
    ]
  );

  const stopTracking = useCallback(
    (options?: { silent?: boolean }) => {
      setTrackingActive(false);
      trackerRef.current?.dispose();
      trackerRef.current = null;
      smoothingRef.current.reset();
      lastGoodHomographyRef.current = null;
      anchorLossFramesRef.current = 0;
      setHasLostAnchors(false);

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

      if (!options?.silent) {
        toast.success("Tracking arrêté");
      }
    },
    []
  );

  const quickRestartTracking = useCallback(async () => {
    if (quickRestartingRef.current || !trackingActive) {
      return;
    }

    quickRestartingRef.current = true;
    stopTracking({ silent: true });
    await new Promise((resolve) => setTimeout(resolve, 160));
    const restarted = await startTracking({ silent: true });
    if (!restarted) {
      setHasLostAnchors(true);
    }
    quickRestartingRef.current = false;
  }, [startTracking, stopTracking, trackingActive]);

  const handleRepositionAnchors = () => {
    if (!configuredPoints.length) {
      toast.error("Aucune configuration d'ancrage disponible");
      return;
    }

    wasTrackingBeforeCalibrationRef.current = trackingActive;
    if (trackingActive) {
      stopTracking({ silent: true });
    }

    anchorLossFramesRef.current = 0;
    setHasLostAnchors(false);
    setCalibrationTrigger((value) => value + 1);
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
        ctx.filter = `brightness(${brightness}%) contrast(${contrast}%)`;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        ctx.filter = "none";

        // 2) Récupérer la frame pour le tracker
        const frameImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const result = trackerRef.current!.trackFrame(frameImageData);

        setMatchedPoints(result.matchedPoints);
        setTrackingStability(result.stability);

        const stablePointThreshold = Math.max(
          4,
          Math.floor(configuredPoints.length * 0.5)
        );
        const minimumContinuationPoints = Math.max(
          4,
          Math.floor(configuredPoints.length * 0.3)
        );
        const stabilityRatio = Math.max(
          0,
          Math.min(1, result.stability / 100)
        );

        const hasLiveHomography =
          result.isTracking &&
          !!result.homography &&
          result.matchedPoints >= minimumContinuationPoints;

        const trackingConfident =
          hasLiveHomography &&
          result.matchedPoints >= stablePointThreshold &&
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
        if (hasLiveHomography && result.homography) {
          try {
            const rawFinalH = multiplyHomographies(
              result.homography,
              overlayToReferenceHomography
            );
            const blend = trackingConfident
              ? stabilityRatio
              : Math.max(0.15, stabilityRatio * 0.5);
            const finalH = smoothingRef.current.smooth(rawFinalH, blend);
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

        if (lastGoodHomographyRef.current) {
          const lostPointsRecently =
            !trackingConfident ||
            !result.isTracking ||
            result.matchedPoints < minimumContinuationPoints;

          if (lostPointsRecently) {
            anchorLossFramesRef.current += 1;
          } else if (anchorLossFramesRef.current !== 0) {
            anchorLossFramesRef.current = 0;
            if (hasLostAnchors) {
              setHasLostAnchors(false);
            }
          }

          if (
            anchorLossFramesRef.current > 12 &&
            !quickRestartingRef.current &&
            streamActive
          ) {
            if (!hasLostAnchors) {
              setHasLostAnchors(true);
            }
            quickRestartTracking();
            anchorLossFramesRef.current = 0;
          }
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
    gridEnabled,
    gridOpacity,
    gridTileCount,
    strobeEnabled,
    strobeSpeed,
    strobeMinOpacity,
    strobeMaxOpacity,
    brightness,
    contrast,
    hasLostAnchors,
    quickRestartTracking,
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
      stopTracking({ silent: true });
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
    anchorLossFramesRef.current = 0;
    setHasLostAnchors(false);

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

    if (wasTrackingBeforeCalibrationRef.current && streamActive) {
      wasTrackingBeforeCalibrationRef.current = false;
      setTimeout(() => {
        startTracking();
      }, 200);
    } else {
      wasTrackingBeforeCalibrationRef.current = false;
    }
  };

  return (
    <div className="space-y-6">
      <div
        ref={videoContainerRef}
        className={`relative w-full overflow-hidden rounded-[28px] border border-white/60 bg-black/85 shadow-[var(--shadow-card)] ${
          isFullscreen ? "h-full" : "aspect-video"
        }`}
      >
        <video
          ref={videoRef}
          className="absolute inset-0 h-full w-full object-cover"
          style={{ filter: `brightness(${brightness}%) contrast(${contrast}%)` }}
          autoPlay
          playsInline
          muted
        />

        <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />

        <Button
          type="button"
          size="icon"
          variant="secondary"
          onClick={toggleFullscreen}
          className="absolute left-4 top-4 z-20 h-10 w-10 rounded-full border border-white/40 bg-black/60 text-white shadow-[0_10px_30px_rgba(15,23,42,0.45)] hover:bg-black/80"
        >
          {isFullscreen ? (
            <Minimize2 className="h-5 w-5" />
          ) : (
            <Maximize2 className="h-5 w-5" />
          )}
        </Button>

        {trackingActive && (
          <div className="absolute right-4 top-4 rounded-[20px] border border-white/40 bg-black/70 px-4 py-3 text-white shadow-[0_10px_30px_rgba(15,23,42,0.45)]">
            <p className="text-xs font-semibold uppercase tracking-widest">Tracking actif</p>
            <div className="mt-2 flex items-center gap-2">
              <div className="h-2 w-28 overflow-hidden rounded-full bg-white/20">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${trackingStability}%` }}
                />
              </div>
              <span className="text-xs font-semibold">{Math.round(trackingStability)}%</span>
            </div>
            <p className="mt-1 text-[10px] uppercase tracking-widest text-white/70">
              Points : {matchedPoints}/{configuredPoints.length}
            </p>
          </div>
        )}

        {hasLostAnchors && (
          <div className="absolute inset-x-4 bottom-4 z-30 rounded-[22px] border border-amber-200/80 bg-amber-50/95 p-4 shadow-[0_12px_30px_rgba(253,230,138,0.35)] backdrop-blur">
            <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold text-amber-900">
                <AlertTriangle className="h-4 w-4" />
                <span>Points de tracking perdus</span>
              </div>
              <Button
                size="sm"
                onClick={handleRepositionAnchors}
                className="w-full rounded-full bg-amber-500 text-xs font-semibold uppercase tracking-widest text-amber-950 shadow-[0_10px_24px_-18px_rgba(217,119,6,0.65)] transition hover:bg-amber-400 sm:w-auto"
              >
                <LocateFixed className="mr-2 h-4 w-4" />
                Repositionner les ancres
              </Button>
            </div>
            <p className="mt-2 text-[11px] font-medium uppercase tracking-widest text-amber-700/80">
              Un recalibrage automatique a été tenté. Replacez les ancres si nécessaire.
            </p>
          </div>
        )}
      </div>

      <Alert className="rounded-[28px] border border-white/60 bg-white/75 p-6 shadow-[var(--shadow-card)] backdrop-blur-xl">
        <AlertDescription className="text-sm leading-relaxed text-muted-foreground">
          Mode AR par points : configurez vos ancres (minimum 4, idéalement 6 à 8) puis lancez le tracking pour projeter votre image comme si elle était imprimée.
        </AlertDescription>
      </Alert>

      {hasLostAnchors && (
        <Alert className="rounded-[28px] border border-amber-200 bg-amber-50/95 p-6 shadow-[var(--shadow-card)] backdrop-blur-xl">
          <AlertDescription className="flex flex-col gap-2 text-sm font-medium text-amber-900">
            <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest">
              <AlertTriangle className="h-4 w-4" />
              Recalibrage recommandé
            </span>
            <span className="text-sm font-normal text-amber-800">
              Le suivi a perdu une ou plusieurs ancres. Déclenchez le repositionnement pour réaligner vos points de référence sur la feuille.
            </span>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
        <Card className="space-y-6 rounded-[28px] border border-white/60 bg-white/80 p-6 shadow-[var(--shadow-card)] backdrop-blur-xl">
          <div className="flex flex-col gap-3 sm:flex-row">
            {!streamActive ? (
              <Button
                className="h-12 flex-1 rounded-full bg-gradient-to-r from-primary to-secondary text-xs font-semibold uppercase tracking-widest text-white shadow-[0_18px_40px_-22px_rgba(92,80,255,0.7)] transition hover:scale-[1.01]"
                onClick={startCamera}
              >
                Activer la caméra
              </Button>
            ) : !trackingActive ? (
              <Button
                className="h-12 flex-1 rounded-full bg-primary text-xs font-semibold uppercase tracking-widest text-white shadow-[0_18px_40px_-22px_rgba(92,80,255,0.7)] transition hover:scale-[1.01]"
                onClick={() => startTracking()}
                disabled={
                  configuredPoints.length < 4 ||
                  isInitializingTracking ||
                  !trackingReferenceImageUrl
                }
              >
                {isInitializingTracking ? "Initialisation..." : "Démarrer le tracking"}
              </Button>
            ) : (
              <Button
                className="h-12 flex-1 rounded-full text-xs font-semibold uppercase tracking-widest"
                variant="destructive"
                onClick={() => stopTracking()}
              >
                Arrêter le tracking
              </Button>
            )}
          </div>

          {trackingActive && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-[22px] border border-white/60 bg-white/75 p-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground shadow-[var(--shadow-card)] backdrop-blur-xl">
                <div className="flex items-center justify-between">
                  <span>{strobeEnabled ? "Opacité contrôlée par le strobe" : "Opacité"}</span>
                  {!strobeEnabled && <span className="text-primary">{overlayOpacity[0]}%</span>}
                </div>
                <Slider
                  id="opacity"
                  value={overlayOpacity}
                  onValueChange={(value) => !strobeEnabled && setOverlayOpacity(value)}
                  min={0}
                  max={100}
                  step={5}
                  disabled={strobeEnabled}
                  className="mt-3"
                />
              </div>

              <div className="rounded-[22px] border border-white/60 bg-white/75 p-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground shadow-[var(--shadow-card)] backdrop-blur-xl">
                <div className="flex items-center justify-between">
                  <span>Points de debug</span>
                  <div className="flex items-center gap-2">
                    {showDebugPoints ? (
                      <Eye className="h-4 w-4 text-primary" />
                    ) : (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    )}
                    <Switch
                      id="debug-points"
                      checked={showDebugPoints}
                      onCheckedChange={setShowDebugPoints}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {trackingActive && (
            <div className="rounded-[24px] border border-primary/40 bg-primary/10 p-5 text-xs font-semibold uppercase tracking-widest text-primary-foreground shadow-[var(--shadow-card)]">
              <p>Tracking 2D stabilisé</p>
              <p className="mt-2 text-[11px] font-normal normal-case text-primary-foreground/80">
                L'image reste verrouillée sur votre feuille grâce au lissage adaptatif et au maintien de la dernière pose fiable pour une sensation quasi imprimée.
              </p>
            </div>
          )}
        </Card>

        <div className="space-y-6">
          <Card className="rounded-[28px] border border-white/60 bg-white/80 p-6 shadow-[var(--shadow-card)] backdrop-blur-xl">
            <PointTrackingManager
              onConfigurationReady={handleConfigurationReady}
              externalCalibrationTrigger={calibrationTrigger}
            />
          </Card>
        </div>
      </div>
    </div>
  );
}
