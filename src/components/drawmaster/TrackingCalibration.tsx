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

type CalibrationStep = "instructions" | "upload" | "video-capture" | "anchor" | "capture" | "review";

export default function TrackingCalibration({ onComplete, onCancel }: TrackingCalibrationProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageCanvasRef = useRef<HTMLCanvasElement>(null);
  const videoOverlayCanvasRef = useRef<HTMLCanvasElement>(null);

  const [step, setStep] = useState<CalibrationStep>("instructions");
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [videoCaptureImage, setVideoCaptureImage] = useState<string | null>(null);
  const [markedPoints, setMarkedPoints] = useState<TrackingPoint[]>([]);
  const [streamActive, setStreamActive] = useState(false);
  const [configName, setConfigName] = useState("");
  const [overlayImage, setOverlayImage] = useState<string | null>(null);
  const [overlayAnchors, setOverlayAnchors] = useState<TrackingPoint[]>([]);
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
      };
      img.src = result;
      setStep("video-capture");
      toast.success("Image de référence chargée. Capturez maintenant votre feuille.");
    };
    reader.onerror = () => {
      toast.error("Impossible de lire l'image sélectionnée");
    };
    reader.readAsDataURL(file);
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
    if (step !== "video-capture" && step !== "capture") return;
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
    
    const imageData = canvas.toDataURL("image/jpeg", 0.75);
    
    if (!imageData || !imageData.startsWith("data:image/jpeg;base64,")) {
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
    setStep("instructions");
    setOverlayAnchors([]);
    setMarkedPoints([]);
    setCapturedImage(null);
    setVideoCaptureImage(null);
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
          {step === "instructions" && "Préparation : Dessinez les marqueurs"}
          {step === "upload" && "Étape 1 : Importer votre image"}
          {step === "video-capture" && "Étape 2 : Capturer votre feuille"}
          {step === "anchor" && "Étape 3 : Placer et aligner les ancres"}
          {step === "capture" && "Étape 4 : Capturer la référence finale"}
          {step === "review" && "Étape 5 : Vérifier et valider"}
        </h3>
        <p className="text-sm text-muted-foreground">
          {step === "instructions" && "Avant de commencer, préparez votre feuille avec 4 marqueurs de tracking bien visibles."}
          {step === "upload" && "Sélectionnez l'image de référence à projeter sur votre feuille."}
          {step === "video-capture" && "Positionnez votre feuille avec les 4 marqueurs visibles et capturez l'image."}
          {step === "anchor" &&
            "Placez les ancres directement sur la capture de votre feuille afin qu'elles correspondent à vos marqueurs physiques."}
          {step === "capture" && "Cadrez votre feuille avec la caméra puis capturez-la pour enregistrer les points physiques."}
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

      {step === "video-capture" && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Placez votre feuille de façon à ce que les 4 marqueurs soient bien visibles dans le cadre.
          </p>
          <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-black border border-border">
            <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover" />
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
            <Button variant="outline" onClick={() => setStep("upload")}>
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
            Les quatre ancres sont positionnées automatiquement sur les coins de votre feuille. Faites-les glisser
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
              onClick={() => setStep("capture")}
              disabled={videoAnchorRatios.length !== 4}
              className="flex-1"
            >
              <Upload className="w-4 h-4 mr-2" />
              Continuer vers la capture finale
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
  );
}
