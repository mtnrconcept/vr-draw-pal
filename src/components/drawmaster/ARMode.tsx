import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Simple toast replacement
const toast = {
  success: (msg: string) => console.log("✓", msg),
  error: (msg: string) => console.error("✗", msg)
};

// Types
interface TrackingPoint {
  id: string;
  x: number;
  y: number;
  label?: string;
}

interface TrackingConfiguration {
  id: string;
  name: string;
  referenceImage: string;
  trackingPoints: TrackingPoint[];
  overlayImage: string;
  overlayAnchors: TrackingPoint[];
}

interface TrackingResult {
  isTracking: boolean;
  homography: number[] | null;
  matchedPoints: number;
  stability: number;
}

// OpenCV Tracker simplifié
class SimpleTracker {
  private cv: any;
  private referencePoints: TrackingPoint[] = [];
  private templates: any[] = [];
  private lastPositions: { x: number; y: number }[] = [];

  constructor() {
    this.cv = (window as any).cv;
    if (!this.cv) throw new Error("OpenCV non chargé");
  }

  initializeReferencePoints(imageData: ImageData, points: TrackingPoint[]) {
    this.dispose();
    if (points.length < 4) throw new Error("Minimum 4 points requis");

    const src = this.cv.matFromImageData(imageData);
    const gray = new this.cv.Mat();
    this.cv.cvtColor(src, gray, this.cv.COLOR_RGBA2GRAY);

    this.referencePoints = [...points];
    this.lastPositions = points.map(p => ({ x: p.x, y: p.y }));
    this.templates = [];

    const templateSize = 64;

    points.forEach(point => {
      const half = Math.floor(templateSize / 2);
      const startX = Math.max(0, Math.min(gray.cols - templateSize, Math.round(point.x) - half));
      const startY = Math.max(0, Math.min(gray.rows - templateSize, Math.round(point.y) - half));

      const rect = new this.cv.Rect(startX, startY, templateSize, templateSize);
      const roi = gray.roi(rect);
      const template = new this.cv.Mat();
      roi.copyTo(template);

      this.templates.push({
        mat: template,
        centerX: startX + templateSize / 2,
        centerY: startY + templateSize / 2,
        offsetX: point.x - (startX + templateSize / 2),
        offsetY: point.y - (startY + templateSize / 2)
      });

      roi.delete();
    });

    src.delete();
    gray.delete();
  }

  trackFrame(frameData: ImageData): TrackingResult {
    if (this.templates.length === 0) {
      return { isTracking: false, homography: null, matchedPoints: 0, stability: 0 };
    }

    const frame = this.cv.matFromImageData(frameData);
    const gray = new this.cv.Mat();
    this.cv.cvtColor(frame, gray, this.cv.COLOR_RGBA2GRAY);

    const srcPoints: number[] = [];
    const dstPoints: number[] = [];
    let matchedCount = 0;
    let stabilitySum = 0;

    this.templates.forEach((template, idx) => {
      const searchRadius = 100;
      const lastPos = this.lastPositions[idx];

      let searchX = Math.round(lastPos.x - template.mat.cols / 2 - searchRadius);
      let searchY = Math.round(lastPos.y - template.mat.rows / 2 - searchRadius);
      let searchW = template.mat.cols + searchRadius * 2;
      let searchH = template.mat.rows + searchRadius * 2;

      searchX = Math.max(0, searchX);
      searchY = Math.max(0, searchY);
      searchW = Math.min(searchW, gray.cols - searchX);
      searchH = Math.min(searchH, gray.rows - searchY);

      if (searchW < template.mat.cols || searchH < template.mat.rows) return;

      const rect = new this.cv.Rect(searchX, searchY, searchW, searchH);
      const roi = gray.roi(rect);
      const result = new this.cv.Mat();

      try {
        this.cv.matchTemplate(roi, template.mat, result, this.cv.TM_CCOEFF_NORMED);
        const minMax = this.cv.minMaxLoc(result);

        if (minMax.maxVal > 0.6) {
          const matchX = searchX + minMax.maxLoc.x + template.mat.cols / 2 + template.offsetX;
          const matchY = searchY + minMax.maxLoc.y + template.mat.rows / 2 + template.offsetY;

          this.lastPositions[idx] = { x: matchX, y: matchY };
          srcPoints.push(this.referencePoints[idx].x, this.referencePoints[idx].y);
          dstPoints.push(matchX, matchY);
          matchedCount++;
          stabilitySum += minMax.maxVal;
        }
      } catch (e) {
        console.error("Template matching failed:", e);
      }

      roi.delete();
      result.delete();
    });

    let homography: number[] | null = null;
    let stability = 0;

    if (matchedCount >= 4) {
      try {
        const srcMat = this.cv.matFromArray(matchedCount, 1, this.cv.CV_32FC2, srcPoints);
        const dstMat = this.cv.matFromArray(matchedCount, 1, this.cv.CV_32FC2, dstPoints);
        const H = this.cv.findHomography(srcMat, dstMat, this.cv.RANSAC, 5.0);

        if (!H.empty()) {
          homography = [];
          for (let i = 0; i < 9; i++) {
            homography.push(H.doubleAt(Math.floor(i / 3), i % 3));
          }
          stability = Math.min(100, (stabilitySum / matchedCount) * 100);
        }

        H.delete();
        srcMat.delete();
        dstMat.delete();
      } catch (e) {
        console.error("Homography failed:", e);
      }
    }

    frame.delete();
    gray.delete();

    return {
      isTracking: homography !== null,
      homography,
      matchedPoints: matchedCount,
      stability
    };
  }

  dispose() {
    this.templates.forEach(t => t.mat?.delete());
    this.templates = [];
    this.referencePoints = [];
    this.lastPositions = [];
  }
}

// Composant principal
export default function ARModeFixed() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const compositeCanvasRef = useRef<HTMLCanvasElement>(null);
  const trackerRef = useRef<SimpleTracker | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const [streamActive, setStreamActive] = useState(false);
  const [trackingActive, setTrackingActive] = useState(false);
  const [trackingStability, setTrackingStability] = useState(0);
  const [matchedPoints, setMatchedPoints] = useState(0);
  const [overlayImage, setOverlayImage] = useState<HTMLImageElement | null>(null);
  const [config, setConfig] = useState<TrackingConfiguration | null>(null);
  const [overlayToReferenceH, setOverlayToReferenceH] = useState<number[] | null>(null);

  // Vérifier OpenCV
  useEffect(() => {
    const checkOpenCV = () => {
      if ((window as any).cv) {
        toast.success("OpenCV chargé ✓");
      } else {
        toast.error("OpenCV non disponible");
      }
    };
    
    if (document.readyState === "complete") {
      checkOpenCV();
    } else {
      window.addEventListener("load", checkOpenCV);
      return () => window.removeEventListener("load", checkOpenCV);
    }
  }, []);

  // Démarrer caméra
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

  // Calculer homographie overlay → reference
  const computeOverlayToReference = (overlayAnchors: TrackingPoint[], refPoints: TrackingPoint[]) => {
    if (!(window as any).cv || overlayAnchors.length < 4 || refPoints.length < 4) {
      return null;
    }

    const cv = (window as any).cv;
    const srcPts = overlayAnchors.flatMap(p => [p.x, p.y]);
    const dstPts = refPoints.flatMap(p => [p.x, p.y]);

    const srcMat = cv.matFromArray(overlayAnchors.length, 1, cv.CV_32FC2, srcPts);
    const dstMat = cv.matFromArray(refPoints.length, 1, cv.CV_32FC2, dstPts);
    
    try {
      const H = cv.getPerspectiveTransform(srcMat, dstMat);
      const result: number[] = [];
      for (let i = 0; i < 9; i++) {
        result.push(H.doubleAt(Math.floor(i / 3), i % 3));
      }
      H.delete();
      srcMat.delete();
      dstMat.delete();
      return result;
    } catch (e) {
      console.error("Failed to compute overlay transform:", e);
      srcMat.delete();
      dstMat.delete();
      return null;
    }
  };

  // Charger une configuration
  const loadConfiguration = async (mockConfig: TrackingConfiguration) => {
    if (trackingActive) {
      setTrackingActive(false);
      trackerRef.current?.dispose();
      trackerRef.current = null;
    }

    // Charger l'image overlay
    const img = new Image();
    img.crossOrigin = "anonymous";
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = mockConfig.overlayImage;
    });

    setOverlayImage(img);
    setConfig(mockConfig);

    // Calculer transformation overlay → reference
    const H = computeOverlayToReference(mockConfig.overlayAnchors, mockConfig.trackingPoints);
    setOverlayToReferenceH(H);

    toast.success(`Configuration chargée : ${mockConfig.name}`);
  };

  // Démarrer le tracking
  const startTracking = async () => {
    if (!streamActive || !config || !overlayImage) {
      toast.error("Chargez d'abord une configuration");
      return;
    }

    if (!(window as any).cv) {
      toast.error("OpenCV non chargé");
      return;
    }

    const video = videoRef.current;
    const canvas = compositeCanvasRef.current;

    if (!video || !canvas) return;
    if (!video.videoWidth || !video.videoHeight) {
      toast.error("La vidéo n'est pas prête");
      return;
    }

    try {
      // Préparer canvas
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Charger l'image de référence
      const refCanvas = document.createElement("canvas");
      const refCtx = refCanvas.getContext("2d")!;
      const refImg = new Image();
      refImg.src = config.referenceImage;
      await new Promise(resolve => { refImg.onload = resolve; });
      
      refCanvas.width = refImg.width;
      refCanvas.height = refImg.height;
      refCtx.drawImage(refImg, 0, 0);
      const refImageData = refCtx.getImageData(0, 0, refImg.width, refImg.height);

      // Initialiser tracker
      trackerRef.current?.dispose();
      trackerRef.current = new SimpleTracker();
      trackerRef.current.initializeReferencePoints(refImageData, config.trackingPoints);

      setTrackingActive(true);
      toast.success("Tracking démarré");
    } catch (error) {
      console.error(error);
      toast.error("Impossible d'initialiser le tracking");
    }
  };

  // Multiplier deux homographies
  const multiplyHomographies = (A: number[], B: number[]): number[] => {
    return [
      A[0]*B[0] + A[1]*B[3] + A[2]*B[6],
      A[0]*B[1] + A[1]*B[4] + A[2]*B[7],
      A[0]*B[2] + A[1]*B[5] + A[2]*B[8],
      A[3]*B[0] + A[4]*B[3] + A[5]*B[6],
      A[3]*B[1] + A[4]*B[4] + A[5]*B[7],
      A[3]*B[2] + A[4]*B[5] + A[5]*B[8],
      A[6]*B[0] + A[7]*B[3] + A[8]*B[6],
      A[6]*B[1] + A[7]*B[4] + A[8]*B[7],
      A[6]*B[2] + A[7]*B[5] + A[8]*B[8]
    ];
  };

  // Boucle de rendu
  useEffect(() => {
    if (!trackingActive || !trackerRef.current || !streamActive || !overlayImage) return;

    const trackLoop = () => {
      const video = videoRef.current;
      const canvas = compositeCanvasRef.current;
      const cv = (window as any).cv;

      if (!video || !canvas || !cv) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // 1. Dessiner la vidéo en arrière-plan
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // 2. Capturer frame pour tracking
      const frameImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const result = trackerRef.current!.trackFrame(frameImageData);

      setMatchedPoints(result.matchedPoints);
      setTrackingStability(result.stability);

      // 3. Si tracking OK, projeter l'overlay
      if (result.isTracking && result.homography && overlayToReferenceH) {
        try {
          // Calculer homographie finale : H_total = H_cam_to_ref × H_overlay_to_ref
          const finalH = multiplyHomographies(result.homography, overlayToReferenceH);

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

          // Superposer avec transparence
          ctx.globalAlpha = 0.7;
          ctx.drawImage(warpedCanvas, 0, 0);
          ctx.globalAlpha = 1.0;

          // Dessiner points de debug
          const trackedPoints = config!.trackingPoints.map((refPt, idx) => {
            const h = finalH;
            const w = h[6] * refPt.x + h[7] * refPt.y + h[8];
            if (Math.abs(w) < 0.001) return null;
            return {
              x: (h[0] * refPt.x + h[1] * refPt.y + h[2]) / w,
              y: (h[3] * refPt.x + h[4] * refPt.y + h[5]) / w
            };
          }).filter(p => p !== null);

          trackedPoints.forEach((pt, idx) => {
            if (!pt) return;
            ctx.beginPath();
            ctx.arc(pt.x, pt.y, 8, 0, 2 * Math.PI);
            ctx.fillStyle = "rgba(34, 197, 94, 0.8)";
            ctx.fill();
            ctx.strokeStyle = "#22c55e";
            ctx.lineWidth = 2;
            ctx.stroke();

            ctx.fillStyle = "white";
            ctx.font = "bold 12px sans-serif";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText((idx + 1).toString(), pt.x, pt.y);
          });

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
  }, [trackingActive, streamActive, overlayImage, config, overlayToReferenceH]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      trackerRef.current?.dispose();
    };
  }, []);

  // Configuration de test
  const loadTestConfig = () => {
    const mockConfig: TrackingConfiguration = {
      id: "test-config",
      name: "Configuration Test",
      referenceImage: "data:image/svg+xml,%3Csvg width='800' height='600' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='800' height='600' fill='%23f0f0f0'/%3E%3Ccircle cx='100' cy='100' r='40' fill='%23ff0000'/%3E%3Ccircle cx='700' cy='100' r='40' fill='%2300ff00'/%3E%3Ccircle cx='700' cy='500' r='40' fill='%230000ff'/%3E%3Ccircle cx='100' cy='500' r='40' fill='%23ffff00'/%3E%3Ctext x='400' y='300' text-anchor='middle' font-size='48' fill='%23333'%3ETRACKING TEST%3C/text%3E%3C/svg%3E",
      trackingPoints: [
        { id: "p1", x: 100, y: 100, label: "Point 1" },
        { id: "p2", x: 700, y: 100, label: "Point 2" },
        { id: "p3", x: 700, y: 500, label: "Point 3" },
        { id: "p4", x: 100, y: 500, label: "Point 4" }
      ],
      overlayImage: "data:image/svg+xml,%3Csvg width='400' height='300' xmlns='http://www.w3.org/2000/svg'%3E%3Cdefs%3E%3ClinearGradient id='grad' x1='0%25' y1='0%25' x2='100%25' y2='100%25'%3E%3Cstop offset='0%25' style='stop-color:%236366f1;stop-opacity:1'/%3E%3Cstop offset='100%25' style='stop-color:%23ec4899;stop-opacity:1'/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width='400' height='300' fill='url(%23grad)'/%3E%3Ctext x='200' y='150' text-anchor='middle' font-size='36' fill='white' font-weight='bold'%3EOVERLAY%3C/text%3E%3C/svg%3E",
      overlayAnchors: [
        { id: "a1", x: 0, y: 0, label: "Ancre 1" },
        { id: "a2", x: 400, y: 0, label: "Ancre 2" },
        { id: "a3", x: 400, y: 300, label: "Ancre 3" },
        { id: "a4", x: 0, y: 300, label: "Ancre 4" }
      ]
    };

    loadConfiguration(mockConfig);
  };

  return (
    <div className="space-y-4 p-4">
      <Alert>
        <AlertDescription>
          <strong>Mode AR Corrigé 2D</strong> - L'image suit maintenant les mouvements de la feuille grâce à warpPerspective d'OpenCV
        </AlertDescription>
      </Alert>

      <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-black">
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover opacity-0"
        />

        <canvas
          ref={compositeCanvasRef}
          className="absolute inset-0 w-full h-full object-cover"
        />

        {trackingActive && (
          <div className="absolute top-2 right-2 bg-black/70 text-white p-3 rounded-lg space-y-1">
            <p className="text-xs font-semibold">Tracking actif</p>
            <div className="flex items-center gap-2">
              <div className="w-24 h-2 bg-white/20 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-green-500 transition-all"
                  style={{ width: `${trackingStability}%` }}
                />
              </div>
              <span className="text-xs">{Math.round(trackingStability)}%</span>
            </div>
            <p className="text-xs">Points: {matchedPoints}/4</p>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        {!streamActive ? (
          <Button className="flex-1" onClick={startCamera}>
            Activer la caméra
          </Button>
        ) : !config ? (
          <Button className="flex-1" onClick={loadTestConfig}>
            Charger config test
          </Button>
        ) : (
          <Button 
            className="flex-1" 
            onClick={startTracking}
            disabled={trackingActive || !overlayImage}
          >
            {trackingActive ? "Tracking actif" : "Démarrer le tracking"}
          </Button>
        )}
      </div>

      {config && (
        <Card className="p-3 bg-primary/10">
          <p className="font-semibold text-sm">{config.name}</p>
          <p className="text-xs text-muted-foreground">
            {config.trackingPoints.length} points • Overlay chargé
          </p>
        </Card>
      )}
    </div>
  );
}
