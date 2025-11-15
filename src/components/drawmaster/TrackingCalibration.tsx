import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Camera, Undo, Check, X } from "lucide-react";
import { toast } from "sonner";
import { TrackingPoint } from "@/lib/opencv/tracker";

interface TrackingCalibrationProps {
  onComplete: (referenceImage: string, points: TrackingPoint[], name: string) => void;
  onCancel: () => void;
}

export default function TrackingCalibration({ onComplete, onCancel }: TrackingCalibrationProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageCanvasRef = useRef<HTMLCanvasElement>(null);
  
  const [step, setStep] = useState<"capture" | "mark">("capture");
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [markedPoints, setMarkedPoints] = useState<TrackingPoint[]>([]);
  const [streamActive, setStreamActive] = useState(false);
  const [configName, setConfigName] = useState("");

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
    const stream = video.srcObject as MediaStream;
    stream?.getTracks().forEach(track => track.stop());
    setStreamActive(false);
    
    setStep("mark");
    toast.success("Photo capturée ! Cliquez sur les points de tracking");
  };

  const handleImageClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
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
    
    setMarkedPoints(prev => [...prev, newPoint]);
    drawPoints([...markedPoints, newPoint]);
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
    if (markedPoints.length < 4) {
      toast.error("Au moins 4 points sont requis");
      return;
    }
    
    if (!configName.trim()) {
      toast.error("Veuillez donner un nom à cette configuration");
      return;
    }
    
    if (capturedImage) {
      onComplete(capturedImage, markedPoints, configName.trim());
      toast.success("Configuration sauvegardée !");
    }
  };

  return (
    <Card className="p-6 space-y-4">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">
          {step === "capture" ? "Étape 1 : Capturer la référence" : "Étape 2 : Marquer les points"}
        </h3>
        <p className="text-sm text-muted-foreground">
          {step === "capture" 
            ? "Cadrez votre feuille avec les points de tracking dessinés"
            : `Cliquez sur chaque point de tracking (${markedPoints.length}/4 minimum)`
          }
        </p>
      </div>

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
            <Button variant="outline" onClick={onCancel}>
              <X className="w-4 h-4 mr-2" />
              Annuler
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
              disabled={markedPoints.length < 4 || !configName.trim()}
              className="flex-1"
            >
              <Check className="w-4 h-4 mr-2" />
              Valider ({markedPoints.length} points)
            </Button>
            <Button variant="outline" onClick={onCancel}>
              <X className="w-4 h-4 mr-2" />
              Annuler
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
