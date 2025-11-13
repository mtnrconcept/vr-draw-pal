import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { ArrowLeft, Camera, Upload, MessageSquare, Maximize2, Grid3x3 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { AIAssistant } from "@/components/AIAssistant";

const Project = () => {
  const navigate = useNavigate();
  const [image, setImage] = useState<string | null>(null);
  const [opacity, setOpacity] = useState([50]);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [showAssistant, setShowAssistant] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showGrid, setShowGrid] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: "environment",
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCameraActive(true);
        toast.success("Caméra activée ! 📸");
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
        toast.success("Image chargée ! 🎨");
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      try {
        await containerRef.current?.requestFullscreen();
        setIsFullscreen(true);
        toast.success("Mode plein écran activé");
      } catch (error) {
        toast.error("Impossible d'activer le plein écran");
      }
    } else {
      await document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      stopCamera();
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  return (
    <div className="min-h-screen bg-background" ref={containerRef}>
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        {!isFullscreen && (
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

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowGrid(!showGrid)}
                className={showGrid ? "bg-primary/10" : ""}
              >
                <Grid3x3 className="mr-2 h-4 w-4" />
                Grille
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowAssistant(!showAssistant)}
                className="border-primary text-primary hover:bg-primary/10"
              >
                <MessageSquare className="mr-2 h-4 w-4" />
                Coach IA
              </Button>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Canvas Area */}
          <div className={isFullscreen ? "fixed inset-0 z-40" : "lg:col-span-2"}>
            <div className="bg-card rounded-xl border border-border shadow-[var(--shadow-card)] overflow-hidden h-full">
              <div className={`relative ${isFullscreen ? "h-screen" : "aspect-[4/3]"} bg-muted`}>
                {/* Camera Feed */}
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />

                {/* Grid Overlay */}
                {showGrid && isCameraActive && (
                  <div className="absolute inset-0 pointer-events-none">
                    <svg className="w-full h-full" style={{ opacity: 0.3 }}>
                      <defs>
                        <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
                          <path d="M 50 0 L 0 0 0 50" fill="none" stroke="white" strokeWidth="1"/>
                        </pattern>
                      </defs>
                      <rect width="100%" height="100%" fill="url(#grid)" />
                    </svg>
                  </div>
                )}

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
                        Activez la caméra pour projeter votre image
                      </p>
                    </div>
                  </div>
                )}

                {/* Fullscreen Controls Overlay */}
                {isFullscreen && isCameraActive && (
                  <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 bg-card/90 backdrop-blur rounded-full px-6 py-4 flex items-center gap-4 shadow-lg z-50">
                    <div className="flex items-center gap-2 min-w-[200px]">
                      <span className="text-sm font-medium text-card-foreground whitespace-nowrap">
                        Opacité: {opacity[0]}%
                      </span>
                      <Slider
                        value={opacity}
                        onValueChange={setOpacity}
                        max={100}
                        step={1}
                        className="w-32"
                      />
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={toggleFullscreen}
                    >
                      Quitter
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Controls */}
          {!isFullscreen && (
            <div className="space-y-6">
              {/* Camera Control */}
              <div className="bg-card rounded-xl border border-border shadow-[var(--shadow-card)] p-6">
                <h3 className="font-semibold text-card-foreground mb-4">
                  Contrôles caméra
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
                  <div className="space-y-2">
                    <Button
                      onClick={toggleFullscreen}
                      className="w-full bg-secondary hover:bg-secondary/90"
                    >
                      <Maximize2 className="mr-2 h-4 w-4" />
                      Mode plein écran
                    </Button>
                    <Button
                      onClick={stopCamera}
                      variant="destructive"
                      className="w-full"
                    >
                      Arrêter la caméra
                    </Button>
                  </div>
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
                  
                  <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                    <span>Transparent</span>
                    <span>Opaque</span>
                  </div>
                </div>
              )}
            </div>
          )}
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
