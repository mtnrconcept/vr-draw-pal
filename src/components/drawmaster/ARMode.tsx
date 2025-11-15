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

// Simple toast replacement
const toast = {
  success: (msg: string) => console.log("✓", msg),
  error: (msg: string) => console.error("✗", msg)
};

interface ARAnchorsModeProps {
  referenceImage: string | null;
  ghostMentorEnabled?: boolean;
}

// Classe pour lisser les homographies et éviter les sauts
class HomographySmoothing {
  private history: number[][] = [];
  private maxHistory: number;
  
  constructor(windowSize: number = 3) {
    this.maxHistory = windowSize;
  }
  
  smooth(homography: number[]): number[] {
    this.history.push([...homography]);
    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }
    
    // Moyenne pondérée (plus de poids sur les valeurs récentes)
    const smoothed = new Array(9).fill(0);
    let totalWeight = 0;
    
    this.history.forEach((h, idx) => {
      const weight = idx + 1; // Poids croissant
      totalWeight += weight;
      h.forEach((val, i) => {
        smoothed[i] += val * weight;
      });
    });
    
    return smoothed.map(v => v / totalWeight);
  }
  
  reset() {
    this.history = [];
  }
}

export default function ARAnchorsMode({ referenceImage }: ARAnchorsModeProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const trackerRef = useRef<OpenCVTracker | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const smoothingRef = useRef<HomographySmoothing>(new HomographySmoothing(5));

  const [streamActive, setStreamActive] = useState(false);
  const [trackingActive, setTrackingActive] = useState(false);
  const [trackingStability, setTrackingStability] = useState(0);
  const [matchedPoints, setMatchedPoints] = useState(0);
  const [configuredPoints, setConfiguredPoints] = useState<TrackingPoint[]>([]);
  const [trackingReferenceImageUrl, setTrackingReferenceImageUrl] = useState<string | null>(null);
  const [overlayImageUrl, setOverlayImageUrl] = useState<string | null>(null);
  const [overlayToReferenceHomography, setOverlayToReferenceHomography] = useState<number[] | null>(null);
  const [isInitializingTracking, setIsInitializingTracking] = useState(false);
  const [overlayImage, setOverlayImage] = useState<HTMLImageElement | null>(null);
  const [showDebugPoints, setShowDebugPoints] = useState(false);
  const [overlayOpacity, setOverlayOpacity] = useState([70]);

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
        video: { facingMode: "environment", width: 1280, height: 720 }
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
      a[6] * b[2] + a[7] * b[5] + a[8] * b[8]
    ];
  };

  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      trackerRef.current?.dispose();
    };
  }, []);

  const loadReferenceImageData = async (dataUrl: string) => {
    return new Promise<ImageData>((resolve, reject) => {
      const image = new Image();
      image.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = image.width;
        canvas.height = image.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Impossible d'initialiser le canvas"));
          return;
        }
        ctx.drawImage(image, 0, 0);
        const imageData = ctx.getImageData(0, 0, image.width, image.height);
        resolve(imageData);
      };
      image.onerror = () => reject(new Error("Impossible de charger l'image de référence"));
      image.src = dataUrl;
    });
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
      const referenceImageData = await loadReferenceImageData(trackingReferenceImageUrl);

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

      trackerRef.current.initializeReferencePoints(referenceImageData, configuredPoints);
      setMatchedPoints(0);
      setTrackingStability(0);
      setTrackingActive(true);
      toast.success("Tracking activé");
    } catch (error) {
      console.error(error);
      toast.error((error as Error).message || "Impossible d'initialiser le tracking");
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
    
    // Nettoyer le canvas
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
    
    toast.success("Tracking arrêté");
  };

  useEffect(() => {
    if (!trackingActive || !trackerRef.current || !streamActive || !overlayImage) return;

    const trackLoop = () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const cv = (window as any).cv;

      if (!video || !canvas || !cv) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // CRUCIAL: Effacer complètement le canvas à chaque frame
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // 1. Dessiner la vidéo en arrière-plan
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // 2. Capturer frame pour tracking
      const frameImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const result = trackerRef.current!.trackFrame(frameImageData);

      setMatchedPoints(result.matchedPoints);
      setTrackingStability(result.stability);

      // 3. Si tracking OK, projeter l'overlay
      if (result.isTracking && result.homography && overlayToReferenceHomography) {
        try {
          // Calculer homographie finale
          const rawFinalH = multiplyHomographies(result.homography, overlayToReferenceHomography);
          
          // Appliquer le lissage pour éviter les sauts
          const finalH = smoothingRef.current.smooth(rawFinalH);

          // Créer matrice OpenCV
          const HMat = cv.matFromArray(3, 3, cv.CV_64F, finalH);

          // Convertir overlay en Mat
          const overlayCanvas = document.createElement("canvas");
          overlayCanvas.width = overlayImage.width;
          overlayCanvas.height = overlayImage.height;
          const overlayCtx = overlayCanvas.getContext("2d")!;
          overlayCtx.drawImage(overlayImage, 0, 0);
          const overlayImageData = overlayCtx.getImageData(0, 0, overlayImage.width, overlayImage.height);
          const overlayMat = cv.matFromImageData(overlayImageData);

          // Warper l'overlay
          const warpedMat = new cv.Mat();
          cv.warpPerspective(
            overlayMat, 
            warpedMat, 
            HMat, 
            new cv.Size(canvas.width, canvas.height),
            cv.INTER_LINEAR,
            cv.BORDER_TRANSPARENT
          );

          // Convertir en ImageData et dessiner
          const warpedCanvas = document.createElement("canvas");
          warpedCanvas.width = canvas.width;
          warpedCanvas.height = canvas.height;
          cv.imshow(warpedCanvas, warpedMat);

          // Superposer avec opacité contrôlée
          ctx.globalAlpha = overlayOpacity[0] / 100;
          ctx.drawImage(warpedCanvas, 0, 0);
          ctx.globalAlpha = 1.0;

          // Dessiner points de debug SEULEMENT si activé
          if (showDebugPoints) {
            configuredPoints.forEach((refPt, idx) => {
              const h = finalH;
              const w = h[6] * refPt.x + h[7] * refPt.y + h[8];
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

          // Cleanup
          HMat.delete();
          overlayMat.delete();
          warpedMat.delete();
        } catch (error) {
          console.error("Warp failed:", error);
        }
      }

      animationFrameRef.current = requestAnimationFrame(trackLoop);
    };

    trackLoop();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [trackingActive, streamActive, overlayImage, configuredPoints, overlayToReferenceHomography, showDebugPoints, overlayOpacity]);

  const computeOverlayToReference = (overlayPoints: TrackingPoint[], referencePoints: TrackingPoint[]) => {
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
      src = cv.matFromArray(overlayPoints.length, 1, cv.CV_32FC2, overlayPoints.flatMap(p => [p.x, p.y]));
      dst = cv.matFromArray(referencePoints.length, 1, cv.CV_32FC2, referencePoints.flatMap(p => [p.x, p.y]));
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

    const transform = computeOverlayToReference(config.overlayAnchors, config.trackingPoints);
    setOverlayToReferenceHomography(transform);
    setMatchedPoints(0);
    setTrackingStability(0);
    smoothingRef.current.reset();
    toast.success(`Configuration prête avec ${config.trackingPoints.length} points`);
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
            Mode AR par Points : Configurez vos points de tracking (minimum 4, recommandé 6-8 pour plus de stabilité), 
            puis activez le tracking pour projeter votre image.
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
                <span className="text-xs">{Math.round(trackingStability)}%</span>
              </div>
              <p className="text-xs">Points: {matchedPoints}/{configuredPoints.length}</p>
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
                {isInitializingTracking ? "Initialisation..." : "Démarrer le tracking"}
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
                    <Label htmlFor="opacity" className="text-sm">Opacité: {overlayOpacity[0]}%</Label>
                  </div>
                  <Slider
                    id="opacity"
                    value={overlayOpacity}
                    onValueChange={setOverlayOpacity}
                    min={0}
                    max={100}
                    step={5}
                  />
                </div>
              </Card>

              <Card className="p-3">
                <div className="flex items-center justify-between">
                  <Label htmlFor="debug-points" className="text-sm">Points de debug</Label>
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
            <p className="font-semibold text-sm">Tracking 2D actif avec lissage</p>
            <p className="text-xs text-muted-foreground">
              L'image suit les mouvements de la feuille de manière fluide
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
