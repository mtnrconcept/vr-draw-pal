import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Camera, Undo, Check, X, Pencil, ImagePlus } from "lucide-react";
import { TrackingPoint } from "@/lib/opencv/tracker";

// Simple toast replacement
const toast = {
  success: (msg: string) => console.log("✓", msg),
  error: (msg: string) => console.error("✗", msg),
  warning: (msg: string) => console.warn("⚠", msg)
};

interface TrackingCalibrationProps {
  onComplete: (result: TrackingCalibrationResult) => void;
  onCancel: () => void;
}

export interface TrackingCalibrationResult {
  referenceImage: string;
  trackingPoints: TrackingPoint[];
  overlayImage: string;
  overlayAnchors: TrackingPoint[];
  name: string;
  overlayPreview?: string | null;
  overlayWidth?: number;
  overlayHeight?: number;
}

type CalibrationStep = "instructions" | "upload" | "video-capture" | "anchor" | "review";

export default function TrackingCalibration({ onComplete, onCancel }: TrackingCalibrationProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageCanvasRef = useRef<HTMLCanvasElement>(null);
  const videoOverlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadAnimationTimeoutRef = useRef<number | null>(null);  const pendingUploadPreviewRef = useRef<string | null>(null);
  const uploadTimerDoneRef = useRef(false);

  const [step, setStep] = useState<CalibrationStep>("instructions");
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [videoCaptureImage, setVideoCaptureImage] = useState<string | null>(null);
  const [markedPoints, setMarkedPoints] = useState<TrackingPoint[]>([]);
  const [streamActive, setStreamActive] = useState(false);
  const [configName, setConfigName] = useState("");
  const [overlayImage, setOverlayImage] = useState<string | null>(null);
  const [overlayPreview, setOverlayPreview] = useState<string | null>(null);
  const [overlayDimensions, setOverlayDimensions] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const [overlayAnchors, setOverlayAnchors] = useState<TrackingPoint[]>([]);
  const [draggingAnchorId, setDraggingAnchorId] = useState<string | null>(null);
  const [videoAnchorRatios, setVideoAnchorRatios] = useState<
    { id: string; label: string; ratioX: number; ratioY: number }[]
  >([]);
  const [uploadState, setUploadState] = useState<"idle" | "animating" | "ready">("idle");
  const [selectedOverlayName, setSelectedOverlayName] = useState<string | null>(null);
  const [cameraAspectRatio, setCameraAspectRatio] = useState(4 / 3);

  const completeUploadPreview = (preview: string) => {
    setOverlayPreview(preview);
    setUploadState("ready");
    toast.success("Miniature prête. Validez pour continuer.");
    pendingUploadPreviewRef.current = null;
  };

  useEffect(() => {
    return () => {
      if (uploadAnimationTimeoutRef.current) {
        window.clearTimeout(uploadAnimationTimeoutRef.current);
      }
    };
  }, []);

  const handleOverlayUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    setSelectedOverlayName(file.name);

    if (uploadAnimationTimeoutRef.current) {
      window.clearTimeout(uploadAnimationTimeoutRef.current);
      uploadAnimationTimeoutRef.current = null;
    }

    pendingUploadPreviewRef.current = null;
    uploadTimerDoneRef.current = false;
    setUploadState("animating");
    setOverlayPreview(null);

    uploadAnimationTimeoutRef.current = window.setTimeout(() => {
      uploadTimerDoneRef.current = true;
      if (pendingUploadPreviewRef.current) {
        completeUploadPreview(pendingUploadPreviewRef.current);
      } else {
        setUploadState("ready");
      }
      uploadAnimationTimeoutRef.current = null;
    }, 5000);

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setOverlayImage(result);
      setOverlayDimensions(null);
      setVideoAnchorRatios([]);
      setMarkedPoints([]);

      const img = new Image();
      img.onload = () => {
        const anchors: TrackingPoint[] = [
          { id: "anchor_top_left", x: 0, y: 0, label: "Ancre 1" },
          { id: "anchor_top_right", x: img.width, y: 0, label: "Ancre 2" },
          { id: "anchor_bottom_left", x: 0, y: img.height, label: "Ancre 3" },
          { id: "anchor_bottom_right", x: img.width, y: img.height, label: "Ancre 4" }
        ];
        setOverlayAnchors(anchors);
        setOverlayDimensions({
          width: img.naturalWidth || img.width,
          height: img.naturalHeight || img.height
        });

        const maxPreview = 720;
        const largestSide = Math.max(img.width, img.height);
        const scale = largestSide > maxPreview ? maxPreview / largestSide : 1;
        const previewCanvas = document.createElement("canvas");
        previewCanvas.width = Math.max(1, Math.round(img.width * scale));
        previewCanvas.height = Math.max(1, Math.round(img.height * scale));
        const ctx = previewCanvas.getContext("2d");
        let previewData = result;
        if (ctx) {
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = "high";
          ctx.filter = "blur(0.2px)";
          ctx.drawImage(img, 0, 0, previewCanvas.width, previewCanvas.height);
          ctx.filter = "none";
          previewData = previewCanvas.toDataURL("image/jpeg", 0.9);
        }
        pendingUploadPreviewRef.current = previewData;
        if (uploadTimerDoneRef.current) {
          completeUploadPreview(previewData);
        }
      };
      img.src = result;
    };
    reader.onerror = () => {
      setUploadState("idle");
      toast.error("Impossible de lire l'image sélectionnée");
      if (uploadAnimationTimeoutRef.current) {
        window.clearTimeout(uploadAnimationTimeoutRef.current);
        uploadAnimationTimeoutRef.current = null;
      }
    };
    reader.readAsDataURL(file);
  };

  const resetOverlayState = () => {
    setOverlayImage(null);
    setOverlayPreview(null);
    setOverlayDimensions(null);
    setOverlayAnchors([]);
    setMarkedPoints([]);
    setSelectedOverlayName(null);
    if (uploadAnimationTimeoutRef.current) {
      window.clearTimeout(uploadAnimationTimeoutRef.current);
      uploadAnimationTimeoutRef.current = null;
    }
    pendingUploadPreviewRef.current = null;
    uploadTimerDoneRef.current = false;
    setUploadState("idle");
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

  const proceedToVideoCapture = () => {
    if (!overlayImage || uploadState !== "ready") {
      toast.error("Attendez la fin de l'animation avant de valider.");
      return;
    }
    setStep("video-capture");
    toast.success("Image de référence chargée. Capturez maintenant votre feuille.");
  };

  const getDefaultVideoAnchors = useCallback(() => {
    const baseAnchors = [
      { id: "anchor_top_left", label: "Ancre 1", ratioX: 0, ratioY: 0 },
      { id: "anchor_top_right", label: "Ancre 2", ratioX: 1, ratioY: 0 },
      { id: "anchor_bottom_left", label: "Ancre 3", ratioX: 0, ratioY: 1 },
      { id: "anchor_bottom_right", label: "Ancre 4", ratioX: 1, ratioY: 1 }
    ];

    return baseAnchors.map(anchor => {
      const matchingOverlayAnchor = overlayAnchors.find(item => item.id === anchor.id);
      return matchingOverlayAnchor
        ? { ...anchor, label: matchingOverlayAnchor.label ?? anchor.label }
        : anchor;
    });
  }, [overlayAnchors]);

  const redrawVideoCanvas = useCallback(
    (ratios: { id: string; label: string; ratioX: number; ratioY: number }[] = videoAnchorRatios) => {
      const canvas = videoOverlayCanvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!canvas || !ctx || !videoCaptureImage) return;

      const img = new Image();
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);

        ratios.forEach((anchor, idx) => {
          const x = anchor.ratioX * canvas.width;
          const y = anchor.ratioY * canvas.height;

          ctx.beginPath();
          ctx.arc(x, y, 12, 0, 2 * Math.PI);
          ctx.fillStyle = "rgba(59, 130, 246, 0.7)";
          ctx.fill();
          ctx.strokeStyle = "#3b82f6";
          ctx.lineWidth = 3;
          ctx.stroke();

          ctx.fillStyle = "white";
          ctx.font = "bold 16px sans-serif";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText((idx + 1).toString(), x, y);
        });
      };
      img.src = videoCaptureImage;
    },
    [videoAnchorRatios, videoCaptureImage]
  );

  useEffect(() => {
    if (step !== "anchor" || !videoCaptureImage) return;
    redrawVideoCanvas();
  }, [videoCaptureImage, redrawVideoCanvas, step]);

  const resetVideoAnchors = useCallback(() => {
    const defaultAnchors = getDefaultVideoAnchors();
    setVideoAnchorRatios(defaultAnchors);
    redrawVideoCanvas(defaultAnchors);
  }, [getDefaultVideoAnchors, redrawVideoCanvas]);

  useEffect(() => {
    if (step !== "anchor" || !videoCaptureImage) return;
    if (videoAnchorRatios.length !== 4) {
      resetVideoAnchors();
    }
  }, [resetVideoAnchors, step, videoAnchorRatios.length, videoCaptureImage]);

  const getCanvasCoordinates = (
    canvas: HTMLCanvasElement,
    event: React.MouseEvent | React.PointerEvent
  ) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const x = (event.clientX - rect.left) * scaleX;
    const y = (event.clientY - rect.top) * scaleY;

    return { x, y };
  };

  const getAnchorIdForPosition = (canvas: HTMLCanvasElement, x: number, y: number) => {
    const horizontal = x < canvas.width / 2 ? "left" : "right";
    const vertical = y < canvas.height / 2 ? "top" : "bottom";
    return `anchor_${vertical}_${horizontal}`;
  };

  const updateAnchorPosition = (anchorId: string, canvas: HTMLCanvasElement, x: number, y: number) => {
    const clampedX = Math.max(0, Math.min(canvas.width, x));
    const clampedY = Math.max(0, Math.min(canvas.height, y));
    const ratioX = canvas.width ? clampedX / canvas.width : 0;
    const ratioY = canvas.height ? clampedY / canvas.height : 0;

    setVideoAnchorRatios(prev => {
      let updated = false;
      const next = prev.map(anchor =>
        anchor.id === anchorId ? ((updated = true), { ...anchor, ratioX, ratioY }) : anchor
      );

      if (!updated) {
        const anchorLabel =
          overlayAnchors.find(anchor => anchor.id === anchorId)?.label ?? `Ancre ${anchorId}`;
        return [
          ...next,
          {
            id: anchorId,
            label: anchorLabel,
            ratioX,
            ratioY
          }
        ];
      }

      return next;
    });
  };

  const handleVideoPointerDown = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = videoOverlayCanvasRef.current;
    if (!canvas) return;

    const { x, y } = getCanvasCoordinates(canvas, event);
    const hitAnchor = videoAnchorRatios.find(anchor => {
      const anchorX = anchor.ratioX * canvas.width;
      const anchorY = anchor.ratioY * canvas.height;
      return Math.hypot(x - anchorX, y - anchorY) <= 16;
    });

    if (hitAnchor) {
      setDraggingAnchorId(hitAnchor.id);
      canvas.setPointerCapture(event.pointerId);
    } else {
      const targetId = getAnchorIdForPosition(canvas, x, y);
      updateAnchorPosition(targetId, canvas, x, y);
    }
  };

  const handleVideoPointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!draggingAnchorId) return;
    const canvas = videoOverlayCanvasRef.current;
    if (!canvas) return;

    const { x, y } = getCanvasCoordinates(canvas, event);
    updateAnchorPosition(draggingAnchorId, canvas, x, y);
  };

  const handleVideoPointerUp = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!draggingAnchorId) return;
    const canvas = videoOverlayCanvasRef.current;
    if (canvas) {
      canvas.releasePointerCapture(event.pointerId);
    }
    setDraggingAnchorId(null);
  };

  const handleVideoPointerLeave = () => {
    setDraggingAnchorId(null);
  };

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: 1280, height: 720 }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          updateCameraAspectRatio();
        };
        await videoRef.current.play();
        updateCameraAspectRatio();
        const overlay = videoOverlayCanvasRef.current;
        if (overlay) {
          overlay.width = videoRef.current.videoWidth;
          overlay.height = videoRef.current.videoHeight;
          redrawVideoCanvas();
        }
      }

      setStreamActive(true);
      toast.success("Caméra activée");
    } catch (err) {
      console.error(err);
      let message = "Impossible d'accéder à la caméra";
      if (err instanceof DOMException) {
        if (err.name === "NotReadableError") {
          message =
            "La caméra est déjà utilisée par un autre mode. Fermez les autres flux vidéo puis réessayez.";
        } else if (err.name === "NotAllowedError") {
          message = "Autorisez l'accès à la caméra pour continuer la calibration.";
        }
      }
      toast.error(message);
    }
  }, [redrawVideoCanvas, updateCameraAspectRatio]);
  useEffect(() => {
    if (step !== "video-capture") return;
    if (!streamActive) {
      void startCamera();
    }
  }, [startCamera, step, streamActive]);

  const captureVideoFrame = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas) return;
    
    const maxWidth = 1280;
    const maxHeight = 720;
    
    let width = video.videoWidth;
    let height = video.videoHeight;
    
    if (width > maxWidth || height > maxHeight) {
      const ratio = Math.min(maxWidth / width, maxHeight / height);
      width = Math.floor(width * ratio);
      height = Math.floor(height * ratio);
    }
    
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, width, height);
    
    const imageData = canvas.toDataURL("image/png");
    
    if (!imageData || !imageData.startsWith("data:image/png;base64,")) {
      toast.error("Erreur lors de la capture de l'image");
      return;
    }
    
    setVideoCaptureImage(imageData);
    stopCameraStream();
    setStep("anchor");
    toast.success("Vidéo capturée ! Placez maintenant les points d'ancrage.");
  };

  const stopCameraStream = () => {
    const video = videoRef.current;
    const stream = video?.srcObject as MediaStream | null;
    stream?.getTracks().forEach(track => track.stop());
    if (video) {
      video.srcObject = null;
    }
    setStreamActive(false);
    setDraggingAnchorId(null);
  };

  const finalizeAnchors = useCallback(() => {
    if (!videoCaptureImage) {
      toast.error("Capturez votre feuille avant de valider les ancres");
      return;
    }

    const img = new Image();
    img.onload = () => {
      const pointsFromVideo = videoAnchorRatios.map((anchor, index) => ({
        id: `point_${anchor.id}`,
        x: anchor.ratioX * img.width,
        y: anchor.ratioY * img.height,
        label: `Point ${index + 1}`
      }));

      setCapturedImage(videoCaptureImage);
      setMarkedPoints(pointsFromVideo);
      setStep("review");
      toast.success("Ancres alignées ! Vérifiez l'aperçu final.");
    };
    img.onerror = () => {
      toast.error("Impossible de charger la capture pour finaliser les ancres");
    };
    img.src = videoCaptureImage;
  }, [videoAnchorRatios, videoCaptureImage]);
  const drawPoints = useCallback(
    (points: TrackingPoint[]) => {
      const canvas = imageCanvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!ctx || !canvas || !capturedImage) return;

      const img = new Image();
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        points.forEach((point, idx) => {
          ctx.beginPath();
          ctx.arc(point.x, point.y, 10, 0, 2 * Math.PI);
          ctx.fillStyle = "rgba(34, 197, 94, 0.7)";
          ctx.fill();
          ctx.strokeStyle = "#22c55e";
          ctx.lineWidth = 3;
          ctx.stroke();

          ctx.fillStyle = "white";
          ctx.font = "bold 16px sans-serif";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText((idx + 1).toString(), point.x, point.y);
        });
      };
      img.src = capturedImage;
    },
    [capturedImage]
  );

  useEffect(() => {
    if (step !== "review" || !capturedImage) return;
    drawPoints(markedPoints);
  }, [capturedImage, drawPoints, markedPoints, step]);

  const handleComplete = () => {
    if (!overlayImage) {
      toast.error("Veuillez sélectionner l'image à reproduire");
      return;
    }

    if (overlayAnchors.length !== 4) {
      toast.error("Positionnez les 4 points d'ancrage sur l'image");
      return;
    }

    if (!capturedImage) {
      toast.error("Capturez la référence de votre feuille");
      return;
    }

    if (markedPoints.length !== overlayAnchors.length) {
      toast.error("Définissez les points physiques correspondant aux ancres");
      return;
    }

    if (!configName.trim()) {
      toast.error("Veuillez donner un nom à cette configuration");
      return;
    }

    onComplete({
      referenceImage: capturedImage,
      trackingPoints: markedPoints,
      overlayImage,
      overlayAnchors,
      name: configName.trim(),
      overlayPreview: overlayPreview ?? overlayImage,
      overlayWidth: overlayDimensions?.width,
      overlayHeight: overlayDimensions?.height
    });
    toast.success("Configuration sauvegardée !");
  };

  const resetAndCancel = () => {
    resetOverlayState();
    setStep("instructions");
    setCapturedImage(null);
    setVideoCaptureImage(null);
    setConfigName("");
    setVideoAnchorRatios([]);
    setDraggingAnchorId(null);
    if (streamActive) {
      stopCameraStream();
    }
    onCancel();
  };

  const handleReturnToUpload = () => {
    if (streamActive) {
      stopCameraStream();
    }
    setStep("upload");
  };

  return (
    <div className="mobile-safe-area w-full">
    <Card className="mobile-card p-4 sm:p-6 space-y-4">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">
          {step === "instructions" && "Préparation : Dessinez les marqueurs"}
          {step === "upload" && "Étape 1 : Importer votre image"}
          {step === "video-capture" && "Étape 2 : Capturer votre feuille"}
          {step === "anchor" && "Étape 3 : Placer et aligner les ancres"}
          {step === "review" && "Étape 4 : Vérifier et valider"}
        </h3>
        <p className="text-sm text-muted-foreground">
          {step === "instructions" && "Avant de commencer, préparez votre feuille avec 4 marqueurs de tracking bien visibles."}
          {step === "upload" && "Sélectionnez l'image de référence à projeter sur votre feuille."}
          {step === "video-capture" && "Positionnez votre feuille avec les 4 marqueurs visibles et capturez l'image."}
          {step === "anchor" &&
            "Cliquez sur chacun de vos marqueurs pour faire apparaître automatiquement l'ancre correspondante (haut-gauche, haut-droite, bas-gauche, bas-droite), puis ajustez-la en la faisant glisser si nécessaire."}
          {step === "review" && "Vérifiez l'alignement final puis validez la configuration."}
        </p>
      </div>

      {step === "instructions" && (
        <div className="space-y-4">
          <div className="border border-border rounded-lg p-6 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold flex-shrink-0">
                1
              </div>
              <div>
                <h4 className="font-semibold mb-1">Dessinez 4 marqueurs de tracking</h4>
                <p className="text-sm text-muted-foreground">
                  Sur votre feuille blanche, dessinez 4 marqueurs noirs épais aux 4 coins de votre zone de dessin. 
                  Utilisez des formes simples et bien contrastées :
                </p>
                <ul className="list-disc list-inside text-sm text-muted-foreground mt-2 space-y-1">
                  <li><strong>Croix épaisses (+)</strong> de 2-3 cm</li>
                  <li><strong>Cercles noirs remplis (●)</strong> de 2 cm de diamètre</li>
                  <li><strong>Carrés noirs (■)</strong> de 2x2 cm</li>
                </ul>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold flex-shrink-0">
                2
              </div>
              <div>
                <h4 className="font-semibold mb-1">Positionnement recommandé</h4>
                <p className="text-sm text-muted-foreground">
                  Placez les marqueurs dans l'ordre : <strong>haut-gauche → haut-droite → bas-droite → bas-gauche</strong>
                </p>
                <div className="mt-3 border border-border rounded p-4 bg-muted/30 font-mono text-xs">
                  <pre>
{`    +                    +
    (1)                (2)




    +                    +
    (3)                (4)`}
                  </pre>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold flex-shrink-0">
                3
              </div>
              <div>
                <h4 className="font-semibold mb-1">Conseils importants</h4>
                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                  <li>Utilisez un marqueur noir épais ou un stylo feutre</li>
                  <li>Assurez-vous que les marqueurs sont bien contrastés sur le fond blanc</li>
                  <li>Évitez les zones avec des ombres</li>
                  <li>Gardez au moins 3 cm de marge depuis les bords de la feuille</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={resetAndCancel}>
              <X className="w-4 h-4 mr-2" />
              Annuler
            </Button>
            <Button onClick={() => setStep("upload")}>
              Continuer
            </Button>
          </div>
        </div>
      )}

      {step === "upload" && (
        <div className="space-y-4">
          <div className="mobile-card border border-dashed border-border rounded-lg p-4 text-center space-y-6 sm:p-6">
            {uploadState === "idle" && (
              <>
                <p className="text-sm text-muted-foreground">
                  Importez l'image que vous souhaitez projeter. Nous conservons la version originale en pleine définition pour l'AR, quelle que soit la webcam utilisée.
                </p>
                <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-start">
                  <Input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    onChange={handleOverlayUpload}
                    className="sr-only"
                  />
                  <Button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="rounded-full bg-primary px-6 text-xs font-semibold uppercase tracking-widest text-white shadow-[0_12px_30px_-18px_rgba(92,80,255,0.7)] hover:bg-primary/90"
                  >
                    <ImagePlus className="mr-2 h-4 w-4" />
                    Sélectionner une image
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    L'animation du crayon se lance pendant 5 secondes dès que vous choisissez votre fichier.
                  </p>
                </div>
              </>
            )}

            {uploadState === "animating" && (
              <div className="space-y-6">
                <p className="text-sm text-muted-foreground">
                  Patientez pendant que le crayon virtuel prépare votre miniature haute fidélité...
                </p>
                <div className="relative mx-auto h-56 w-full max-w-md">
                  <div className="absolute inset-0 rounded-[32px] border-2 border-dashed border-primary/40 bg-white/70 shadow-lg" />
                  <div className="absolute inset-4 rounded-[24px] bg-gradient-to-br from-white/90 to-primary/5 shadow-inner" />
                  <div className="absolute inset-6 flex flex-col gap-3 p-4 text-left">
                    <div className="h-2 rounded-full bg-primary/15 overflow-hidden">
                      <div className="h-full bg-primary/60 animate-sketch-line" />
                    </div>
                    <div className="h-2 rounded-full bg-primary/15 overflow-hidden w-3/4">
                      <div className="h-full bg-primary/45 animate-sketch-line-delayed" />
                    </div>
                    <div className="h-2 rounded-full bg-primary/15 overflow-hidden w-1/2">
                      <div className="h-full bg-primary/35 animate-sketch-line" />
                    </div>
                  </div>
                  <div className="absolute top-8 left-8 animate-pencil-path">
                    <div className="w-14 h-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-xl">
                      <Pencil className="w-6 h-6" />
                    </div>
                  </div>
                </div>
                <div className="h-2 rounded-full bg-border overflow-hidden">
                  <div className="h-full bg-primary animate-pencil-progress" />
                </div>
                <p className="text-xs text-muted-foreground">
                  L'animation dure 5 secondes, juste le temps de générer un aperçu optimisé.
                </p>
              </div>
            )}

            {uploadState === "ready" && overlayPreview && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">
                  Aperçu compressé pour l'interface (l'image source reste intacte).
                </p>
                {selectedOverlayName && (
                  <p className="text-sm font-semibold text-foreground">
                    Fichier sélectionné : <span className="font-normal">{selectedOverlayName}</span>
                  </p>
                )}
                <div className="border rounded-lg overflow-hidden bg-black/5">
                  <img
                    src={overlayPreview}
                    alt="Aperçu de l'image importée"
                    className="w-full max-h-64 object-contain"
                  />
                </div>
                {overlayDimensions && (
                  <p className="text-xs text-muted-foreground">
                    Qualité source : {overlayDimensions.width} × {overlayDimensions.height} px
                  </p>
                )}
              </div>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {uploadState === "ready" && (
              <div className="flex gap-2">
                <Button onClick={proceedToVideoCapture}>
                  <Check className="w-4 h-4 mr-2" />
                  Valider
                </Button>
                <Button variant="ghost" onClick={resetOverlayState}>
                  Changer d'image
                </Button>
              </div>
            )}
            <Button variant="outline" onClick={resetAndCancel} className="ml-auto">
              <X className="w-4 h-4 mr-2" />
              Annuler
            </Button>
          </div>
        </div>
      )}

      {step === "video-capture" && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Placez votre feuille de façon à ce que les 4 marqueurs soient bien visibles dans le cadre.
          </p>
          <div
            className="relative w-full overflow-hidden rounded-lg border border-border bg-black"
            style={{ aspectRatio: cameraAspectRatio }}
          >
            <video
              ref={videoRef}
              className="absolute inset-0 h-full w-full object-contain"
              onLoadedMetadata={updateCameraAspectRatio}
            />
          </div>
          <canvas ref={canvasRef} className="hidden" />

          <div className="flex gap-2">
            {!streamActive ? (
              <Button onClick={startCamera} className="flex-1">
                <Camera className="w-4 h-4 mr-2" />
                Activer la caméra
              </Button>
            ) : (
              <Button onClick={captureVideoFrame} className="flex-1">
                <Check className="w-4 h-4 mr-2" />
                Capturer l'image
              </Button>
            )}
            <Button variant="outline" onClick={handleReturnToUpload}>
              Retour
            </Button>
            <Button variant="outline" onClick={resetAndCancel}>
              <X className="w-4 h-4 mr-2" />
              Annuler
            </Button>
          </div>
        </div>
      )}

      {step === "anchor" && overlayImage && videoCaptureImage && (
        <div className="space-y-4">
          <p className="text-xs text-muted-foreground">
            Cliquez pour placer une ancre sur chacun de vos marqueurs. Vous pouvez ensuite les glisser pour affiner leur alignement
            directement sur l'image capturée pour les aligner précisément avec vos points de tracking.
          </p>
          <div className="relative w-full rounded-lg overflow-hidden border border-border bg-black">
            <canvas
              ref={videoOverlayCanvasRef}
              className="w-full cursor-move"
              onPointerDown={handleVideoPointerDown}
              onPointerMove={handleVideoPointerMove}
              onPointerUp={handleVideoPointerUp}
              onPointerLeave={handleVideoPointerLeave}
            />
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Ordre des points : 1 = haut gauche, 2 = haut droite, 3 = bas gauche, 4 = bas droite.</span>
            <span>{videoAnchorRatios.length}/4</span>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={resetVideoAnchors}>
              <Undo className="w-4 h-4 mr-2" />
              Réinitialiser les ancres
            </Button>
            <Button
              onClick={finalizeAnchors}
              disabled={videoAnchorRatios.length !== 4}
              className="flex-1"
            >
              <Check className="w-4 h-4 mr-2" />
              Valider les ancres
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setVideoCaptureImage(null);
                setVideoAnchorRatios([]);
                setStep("video-capture");
              }}
            >
              Recapturer la feuille
            </Button>
            <Button variant="outline" onClick={resetAndCancel}>
              <X className="w-4 h-4 mr-2" />
              Annuler
            </Button>
          </div>
        </div>
      )}

      {step === "review" && capturedImage && (
        <div className="space-y-4">
          <div className="relative w-full rounded-lg overflow-hidden border border-border">
            <canvas ref={imageCanvasRef} className="w-full" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="config-name">Nom de la configuration</Label>
            <Input
              id="config-name"
              value={configName}
              onChange={(e) => setConfigName(e.target.value)}
              placeholder="Ex: Feuille A4 portrait"
            />
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setCapturedImage(null);
                setMarkedPoints([]);
                setVideoCaptureImage(null);
                setVideoAnchorRatios([]);
                setStep("video-capture");
              }}
            >
              <Undo className="w-4 h-4 mr-2" />
              Refaire la capture
            </Button>
            <Button
              onClick={handleComplete}
              disabled={markedPoints.length !== overlayAnchors.length || !configName.trim()}
              className="flex-1"
            >
              <Check className="w-4 h-4 mr-2" />
              Valider l'alignement
            </Button>
            <Button variant="outline" onClick={resetAndCancel}>
              <X className="w-4 h-4 mr-2" />
              Annuler
            </Button>
          </div>

          <div className="flex justify-end">
            <Button
              variant="outline"
              onClick={() => {
                setCapturedImage(null);
                setMarkedPoints([]);
                if (!videoCaptureImage) {
                  setStep("video-capture");
                } else {
                  setStep("anchor");
                }
              }}
            >
              Revenir aux ancres
            </Button>
          </div>
        </div>
      )}
    </Card>
    </div>
  );
}
