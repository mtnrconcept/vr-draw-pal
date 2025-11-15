import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Camera, Undo, Check, X, Upload } from "lucide-react";
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
}

type CalibrationStep = "upload" | "anchor" | "capture" | "review";

export default function TrackingCalibration({ onComplete, onCancel }: TrackingCalibrationProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageCanvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const videoOverlayCanvasRef = useRef<HTMLCanvasElement>(null);

  const [step, setStep] = useState<CalibrationStep>("upload");
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [markedPoints, setMarkedPoints] = useState<TrackingPoint[]>([]);
  const [streamActive, setStreamActive] = useState(false);
  const [configName, setConfigName] = useState("");
  const [overlayImage, setOverlayImage] = useState<string | null>(null);
  const [overlayAnchors, setOverlayAnchors] = useState<TrackingPoint[]>([]);
  const [maxPoints, setMaxPoints] = useState(4);
  const [draggingAnchorId, setDraggingAnchorId] = useState<string | null>(null);
  const [videoAnchorRatios, setVideoAnchorRatios] = useState<
    { id: string; label: string; ratioX: number; ratioY: number }[]
  >([]);

  const handleOverlayUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setOverlayImage(result);
      setOverlayAnchors([]);
      setVideoAnchorRatios([]);
      setMarkedPoints([]);
      setStep("anchor");
      toast.success("Image de référence chargée. Placez les points d'ancrage.");
    };
    reader.onerror = () => {
      toast.error("Impossible de lire l'image sélectionnée");
    };
    reader.readAsDataURL(file);
  };

  const redrawOverlayCanvas = useCallback(
    (anchors: TrackingPoint[]) => {
      const canvas = overlayCanvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!canvas || !ctx || !overlayImage) return;

      const img = new Image();
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);

        anchors.forEach((point, idx) => {
          ctx.beginPath();
          ctx.arc(point.x, point.y, 12, 0, 2 * Math.PI);
          ctx.fillStyle = "rgba(59, 130, 246, 0.7)";
          ctx.fill();
          ctx.strokeStyle = "#3b82f6";
          ctx.lineWidth = 3;
          ctx.stroke();

          ctx.fillStyle = "white";
          ctx.font = "bold 16px sans-serif";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText((idx + 1).toString(), point.x, point.y);
        });
      };
      img.src = overlayImage;
    },
    [overlayImage]
  );

  useEffect(() => {
    if (step !== "anchor" || !overlayImage) return;
    redrawOverlayCanvas(overlayAnchors);
  }, [overlayAnchors, overlayImage, redrawOverlayCanvas, step]);

  const redrawVideoCanvas = useCallback(
    (ratios: { id: string; label: string; ratioX: number; ratioY: number }[] = videoAnchorRatios) => {
      const canvas = videoOverlayCanvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!canvas || !ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

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
    },
    [videoAnchorRatios]
  );

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateCanvasSize = () => {
      const canvas = videoOverlayCanvasRef.current;
      if (!canvas) return;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      redrawVideoCanvas();
    };

    video.addEventListener("loadedmetadata", updateCanvasSize);
    if (video.readyState >= 2) {
      updateCanvasSize();
    }

    return () => {
      video.removeEventListener("loadedmetadata", updateCanvasSize);
    };
  }, [step, redrawVideoCanvas]);

  useEffect(() => {
    redrawVideoCanvas();
  }, [videoAnchorRatios, redrawVideoCanvas]);

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

  const handleOverlayClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (overlayAnchors.length >= 4) {
      toast.warning("Les 4 points d'ancrage sont déjà placés");
      return;
    }

    const canvas = overlayCanvasRef.current;
    if (!canvas) return;

    const { x, y } = getCanvasCoordinates(canvas, e);

    const ratioX = canvas.width ? x / canvas.width : 0;
    const ratioY = canvas.height ? y / canvas.height : 0;

    const newAnchor: TrackingPoint = {
      id: `anchor_${Date.now()}`,
      x,
      y,
      label: `Ancre ${overlayAnchors.length + 1}`
    };

    const updatedAnchors = [...overlayAnchors, newAnchor];
    setOverlayAnchors(updatedAnchors);
    redrawOverlayCanvas(updatedAnchors);

    setVideoAnchorRatios(prev => [
      ...prev,
      { id: newAnchor.id, label: newAnchor.label, ratioX, ratioY }
    ]);
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
    }
  };

  const handleVideoPointerMove = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!draggingAnchorId) return;
    const canvas = videoOverlayCanvasRef.current;
    if (!canvas) return;

    const { x, y } = getCanvasCoordinates(canvas, event);
    const clampedX = Math.max(0, Math.min(canvas.width, x));
    const clampedY = Math.max(0, Math.min(canvas.height, y));

    const ratioX = canvas.width ? clampedX / canvas.width : 0;
    const ratioY = canvas.height ? clampedY / canvas.height : 0;

    setVideoAnchorRatios(prev =>
      prev.map(anchor =>
        anchor.id === draggingAnchorId
          ? { ...anchor, ratioX, ratioY }
          : anchor
      )
    );
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

  const removeLastAnchor = () => {
    const updatedAnchors = overlayAnchors.slice(0, -1);
    setOverlayAnchors(updatedAnchors);
    redrawOverlayCanvas(updatedAnchors);
    setVideoAnchorRatios(prev => prev.slice(0, -1));
  };

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: 1280, height: 720 }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
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
      toast.error("Impossible d'accéder à la caméra");
    }
  }, [redrawVideoCanvas]);

  useEffect(() => {
    if (step !== "anchor" && step !== "capture") return;
    if (!streamActive) {
      void startCamera();
    }
  }, [startCamera, step, streamActive]);

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

  const captureReference = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas) return;
    
    // Limit resolution to reduce base64 size
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
    
    // Use lower quality to reduce base64 size
    const imageData = canvas.toDataURL("image/jpeg", 0.75);
    
    // Validate the image data
    if (!imageData || !imageData.startsWith("data:image/jpeg;base64,")) {
      toast.error("Erreur lors de la capture de l'image");
      return;
    }
    
    setCapturedImage(imageData);

    const pointsFromVideo = videoAnchorRatios.map((anchor, index) => ({
      id: `point_${anchor.id}`,
      x: anchor.ratioX * canvas.width,
      y: anchor.ratioY * canvas.height,
      label: `Point ${index + 1}`
    }));

    setMarkedPoints(pointsFromVideo);

    // Stop camera
    stopCameraStream();

    setStep("review");
    toast.success("Photo capturée ! Vérifiez l'alignement des points");
  };
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
      name: configName.trim()
    });
    toast.success("Configuration sauvegardée !");
  };

  const resetAndCancel = () => {
    if (streamActive) {
      stopCameraStream();
    }
    setStep("upload");
    setOverlayAnchors([]);
    setMarkedPoints([]);
    setCapturedImage(null);
    setOverlayImage(null);
    setConfigName("");
    setVideoAnchorRatios([]);
    setDraggingAnchorId(null);
    onCancel();
  };

  return (
    <Card className="p-6 space-y-4">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">
          {step === "upload" && "Étape 1 : Importer votre image"}
          {step === "anchor" && "Étape 2 : Placer et aligner les ancres"}
          {step === "capture" && "Étape 3 : Capturer la feuille"}
          {step === "review" && "Étape 4 : Vérifier et valider"}
        </h3>
        <p className="text-sm text-muted-foreground">
          {step === "upload" && "Sélectionnez l'image de référence à projeter sur votre feuille."}
          {step === "anchor" &&
            "Ajoutez les ancres sur l'image de gauche puis ajustez-les sur la vidéo pour correspondre aux marques physiques."}
          {step === "capture" && "Cadrez votre feuille avec la caméra puis capturez-la pour enregistrer les points physiques."}
          {step === "review" && "Vérifiez l'alignement final puis validez la configuration."}
        </p>
      </div>

      {step === "upload" && (
        <div className="space-y-4">
          <div className="border border-dashed border-border rounded-lg p-6 text-center">
            <p className="text-sm text-muted-foreground mb-4">
              Importez l'image que vous souhaitez reproduire sur votre feuille.
            </p>
            <Input type="file" accept="image/*" onChange={handleOverlayUpload} />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={resetAndCancel}>
              <X className="w-4 h-4 mr-2" />
              Annuler
            </Button>
          </div>
        </div>
      )}

      {step === "anchor" && overlayImage && (
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-xs text-muted-foreground mb-2">
                Cliquez sur l'image pour placer les points d'ancrage virtuels.
              </p>
              <div className="relative w-full rounded-lg overflow-hidden border border-border">
                <canvas
                  ref={overlayCanvasRef}
                  onClick={handleOverlayClick}
                  className="w-full cursor-crosshair"
                />
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-2">
                Ajustez les ancres directement sur la vidéo pour les aligner sur vos marques physiques.
              </p>
              <div className="relative w-full aspect-video rounded-lg overflow-hidden border border-border bg-black">
                <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover" />
                <canvas
                  ref={videoOverlayCanvasRef}
                  className="absolute inset-0 w-full h-full cursor-move"
                  onPointerDown={handleVideoPointerDown}
                  onPointerMove={handleVideoPointerMove}
                  onPointerUp={handleVideoPointerUp}
                  onPointerLeave={handleVideoPointerLeave}
                />
              </div>
              {!streamActive && (
                <Button onClick={startCamera} className="mt-2 w-full">
                  <Camera className="w-4 h-4 mr-2" />
                  Activer la caméra
                </Button>
              )}
            </div>
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Placez les points dans l'ordre : haut gauche → haut droite → bas droite → bas gauche.</span>
            <span>{overlayAnchors.length}/4</span>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={removeLastAnchor}
              disabled={overlayAnchors.length === 0}
            >
              <Undo className="w-4 h-4 mr-2" />
              Retirer le dernier
            </Button>
            <Button
              onClick={() => setStep("capture")}
              disabled={overlayAnchors.length !== maxPoints || videoAnchorRatios.length !== overlayAnchors.length}
              className="flex-1"
            >
              <Upload className="w-4 h-4 mr-2" />
              Continuer vers la capture
            </Button>
            <Button variant="outline" onClick={resetAndCancel}>
              <X className="w-4 h-4 mr-2" />
              Annuler
            </Button>
          </div>
        </div>
      )}

      {step === "capture" && (
        <div className="space-y-4">
          <p className="text-xs text-muted-foreground">
            Assurez-vous que la feuille et les points physiques sont bien visibles avant de capturer.
          </p>
          <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-black">
            <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover" />
            <canvas ref={canvasRef} className="hidden" />
          </div>

          <div className="flex gap-2">
            {!streamActive ? (
              <Button onClick={startCamera} className="flex-1">
                <Camera className="w-4 h-4 mr-2" />
                Activer la caméra
              </Button>
            ) : (
              <Button
                onClick={captureReference}
                className="flex-1"
                disabled={videoAnchorRatios.length !== overlayAnchors.length}
              >
                <Check className="w-4 h-4 mr-2" />
                Capturer
              </Button>
            )}
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
                if (!streamActive) {
                  void startCamera();
                }
                setStep("anchor");
              }}
            >
              Revenir aux ancres
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
                if (!streamActive) {
                  void startCamera();
                }
                setStep("capture");
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
                if (!streamActive) {
                  void startCamera();
                }
                setStep("anchor");
              }}
            >
              Revenir aux ancres
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
