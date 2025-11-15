import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Camera, Undo, Check, X, Upload } from "lucide-react";
import { toast } from "sonner";
import { TrackingPoint } from "@/lib/opencv/tracker";

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

type CalibrationStep = "upload" | "anchor" | "capture" | "mark";

export default function TrackingCalibration({ onComplete, onCancel }: TrackingCalibrationProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageCanvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);

  const [step, setStep] = useState<CalibrationStep>("upload");
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [markedPoints, setMarkedPoints] = useState<TrackingPoint[]>([]);
  const [streamActive, setStreamActive] = useState(false);
  const [configName, setConfigName] = useState("");
  const [overlayImage, setOverlayImage] = useState<string | null>(null);
  const [overlayAnchors, setOverlayAnchors] = useState<TrackingPoint[]>([]);

  useEffect(() => {
    if (step !== "anchor" || !overlayImage) return;
    redrawOverlayCanvas(overlayAnchors);
  }, [overlayAnchors, overlayImage, step]);

  useEffect(() => {
    if (step !== "mark" || !capturedImage) return;
    drawPoints(markedPoints);
  }, [capturedImage, markedPoints, step]);

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
      setStep("anchor");
      toast.success("Image de référence chargée. Placez les points d'ancrage.");
    };
    reader.onerror = () => {
      toast.error("Impossible de lire l'image sélectionnée");
    };
    reader.readAsDataURL(file);
  };

  const redrawOverlayCanvas = (anchors: TrackingPoint[]) => {
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
  };

  const handleOverlayClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (overlayAnchors.length >= 4) {
      toast.warning("Les 4 points d'ancrage sont déjà placés");
      return;
    }

    const canvas = overlayCanvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    const newAnchor: TrackingPoint = {
      id: `anchor_${Date.now()}`,
      x,
      y,
      label: `Ancre ${overlayAnchors.length + 1}`
    };

    const updatedAnchors = [...overlayAnchors, newAnchor];
    setOverlayAnchors(updatedAnchors);
    redrawOverlayCanvas(updatedAnchors);
  };

  const removeLastAnchor = () => {
    const updatedAnchors = overlayAnchors.slice(0, -1);
    setOverlayAnchors(updatedAnchors);
    redrawOverlayCanvas(updatedAnchors);
  };

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

  const stopCameraStream = () => {
    const video = videoRef.current;
    const stream = video?.srcObject as MediaStream | null;
    stream?.getTracks().forEach(track => track.stop());
    if (video) {
      video.srcObject = null;
    }
    setStreamActive(false);
  };

  const captureReference = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas) return;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    
    if (!ctx) return;
    
    ctx.drawImage(video, 0, 0);
    const imageData = canvas.toDataURL("image/jpeg", 0.95);
    setCapturedImage(imageData);

    // Stop camera
    stopCameraStream();

    setMarkedPoints([]);
    setStep("mark");
    toast.success("Photo capturée ! Cliquez sur les points physiques dans l'ordre des ancres");
  };

  const handleImageClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (overlayAnchors.length === 0) {
      toast.error("Définissez d'abord les points d'ancrage de l'image");
      return;
    }

    if (markedPoints.length >= overlayAnchors.length) {
      toast.warning("Tous les points physiques ont été définis");
      return;
    }

    const canvas = imageCanvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    
    const newPoint: TrackingPoint = {
      id: `point_${Date.now()}`,
      x,
      y,
      label: `Point ${markedPoints.length + 1}`
    };

    const nextPoints = [...markedPoints, newPoint];
    setMarkedPoints(nextPoints);
    drawPoints(nextPoints);
  };

  const drawPoints = (points: TrackingPoint[]) => {
    const canvas = imageCanvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx || !canvas || !capturedImage) return;
    
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      
      points.forEach((point, idx) => {
        // Draw circle
        ctx.beginPath();
        ctx.arc(point.x, point.y, 10, 0, 2 * Math.PI);
        ctx.fillStyle = "rgba(34, 197, 94, 0.7)";
        ctx.fill();
        ctx.strokeStyle = "#22c55e";
        ctx.lineWidth = 3;
        ctx.stroke();
        
        // Draw number
        ctx.fillStyle = "white";
        ctx.font = "bold 16px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText((idx + 1).toString(), point.x, point.y);
      });
    };
    img.src = capturedImage;
  };

  const removeLastPoint = () => {
    const newPoints = markedPoints.slice(0, -1);
    setMarkedPoints(newPoints);
    drawPoints(newPoints);
  };

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
    onCancel();
  };

  return (
    <Card className="p-6 space-y-4">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">
          {step === "upload" && "Étape 1 : Importer votre image"}
          {step === "anchor" && "Étape 2 : Placer les points d'ancrage"}
          {step === "capture" && "Étape 3 : Capturer la feuille"}
          {step === "mark" && "Étape 4 : Associer les points"}
        </h3>
        <p className="text-sm text-muted-foreground">
          {step === "upload" && "Sélectionnez l'image de référence à projeter sur votre feuille."}
          {step === "anchor" && "Cliquez sur les 4 coins de l'image pour positionner les points d'ancrage."}
          {step === "capture" && "Cadrez votre feuille avec la caméra puis capturez-la pour repérer les points physiques."}
          {step === "mark" && `Cliquez sur les points dessinés (${markedPoints.length}/${overlayAnchors.length}) en suivant l'ordre des ancres.`}
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
          <div className="relative w-full rounded-lg overflow-hidden border border-border">
            <canvas
              ref={overlayCanvasRef}
              onClick={handleOverlayClick}
              className="w-full cursor-crosshair"
            />
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
              disabled={overlayAnchors.length !== 4}
              className="flex-1"
            >
              <Upload className="w-4 h-4 mr-2" />
              Valider les ancres
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
          <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-black">
            <video
              ref={videoRef}
              className="absolute inset-0 w-full h-full object-cover"
            />
            <canvas ref={canvasRef} className="hidden" />
          </div>

          <div className="flex gap-2">
            {!streamActive ? (
              <Button onClick={startCamera} className="flex-1">
                <Camera className="w-4 h-4 mr-2" />
                Activer la caméra
              </Button>
            ) : (
              <Button onClick={captureReference} className="flex-1">
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
              disabled={!overlayImage}
              onClick={() => {
                if (streamActive) {
                  stopCameraStream();
                }
                setStep("anchor");
              }}
            >
              Revenir aux ancres
            </Button>
          </div>
        </div>
      )}

      {step === "mark" && capturedImage && (
        <div className="space-y-4">
          <div className="relative w-full rounded-lg overflow-hidden border border-border">
            <canvas
              ref={imageCanvasRef}
              onClick={handleImageClick}
              className="w-full cursor-crosshair"
            />
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
              onClick={removeLastPoint}
              disabled={markedPoints.length === 0}
            >
              <Undo className="w-4 h-4 mr-2" />
              Annuler le dernier
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
                setStep("capture");
              }}
            >
              Reprendre la capture
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
