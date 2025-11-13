import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { ArrowLeft, Camera, Upload, MessageSquare } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { AIAssistant } from "@/components/AIAssistant";

const Project = () => {
  const navigate = useNavigate();
  const [image, setImage] = useState<string | null>(null);
  const [opacity, setOpacity] = useState([50]);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [showAssistant, setShowAssistant] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCameraActive(true);
      }
    } catch (error) {
      toast.error("Impossible d'accéder à la caméra");
      console.error("Camera error:", error);
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
      setIsCameraActive(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImage(event.target?.result as string);
        toast.success("Image chargée avec succès !");
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            onClick={() => {
              stopCamera();
              navigate(-1);
            }}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour
          </Button>

          <Button
            variant="outline"
            onClick={() => setShowAssistant(!showAssistant)}
            className="border-primary text-primary hover:bg-primary/10"
          >
            <MessageSquare className="mr-2 h-4 w-4" />
            Assistant IA
          </Button>
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Canvas Area */}
          <div className="lg:col-span-2">
            <div className="bg-card rounded-xl border border-border shadow-[var(--shadow-card)] overflow-hidden">
              <div className="relative aspect-[4/3] bg-muted">
                {/* Camera Feed */}
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />

                {/* Image Overlay */}
                {image && isCameraActive && (
                  <div
                    className="absolute inset-0 flex items-center justify-center p-8"
                    style={{ opacity: opacity[0] / 100 }}
                  >
                    <img
                      src={image}
                      alt="Reference"
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                )}

                {/* Placeholder */}
                {!isCameraActive && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center space-y-4">
                      <Camera className="w-16 h-16 mx-auto text-muted-foreground" />
                      <p className="text-muted-foreground">
                        Activez la caméra pour commencer
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="space-y-6">
            {/* Camera Control */}
            <div className="bg-card rounded-xl border border-border shadow-[var(--shadow-card)] p-6">
              <h3 className="font-semibold text-card-foreground mb-4">
                Contrôles
              </h3>
              
              {!isCameraActive ? (
                <Button
                  onClick={startCamera}
                  className="w-full bg-primary hover:bg-primary/90"
                >
                  <Camera className="mr-2 h-4 w-4" />
                  Activer la caméra
                </Button>
              ) : (
                <Button
                  onClick={stopCamera}
                  variant="destructive"
                  className="w-full"
                >
                  Arrêter la caméra
                </Button>
              )}
            </div>

            {/* Image Upload */}
            <div className="bg-card rounded-xl border border-border shadow-[var(--shadow-card)] p-6">
              <h3 className="font-semibold text-card-foreground mb-4">
                Image de référence
              </h3>
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                className="w-full"
              >
                <Upload className="mr-2 h-4 w-4" />
                {image ? "Changer l'image" : "Charger une image"}
              </Button>

              {image && (
                <div className="mt-4">
                  <img
                    src={image}
                    alt="Preview"
                    className="w-full rounded-lg border border-border"
                  />
                </div>
              )}
            </div>

            {/* Opacity Control */}
            {image && isCameraActive && (
              <div className="bg-card rounded-xl border border-border shadow-[var(--shadow-card)] p-6">
                <h3 className="font-semibold text-card-foreground mb-4">
                  Opacité: {opacity[0]}%
                </h3>
                
                <Slider
                  value={opacity}
                  onValueChange={setOpacity}
                  max={100}
                  step={1}
                  className="w-full"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* AI Assistant Panel */}
      {showAssistant && (
        <AIAssistant onClose={() => setShowAssistant(false)} />
      )}
    </div>
  );
};

export default Project;
