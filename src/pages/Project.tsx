import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { ArrowLeft, Camera, Upload, MessageSquare, Maximize2, Grid3x3 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { AIAssistant } from "@/components/AIAssistant";
import { requestCameraStream, CameraAccessError } from "@/lib/media/camera";

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
      const stream = await requestCameraStream({
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
      const message =
        error instanceof CameraAccessError
          ? error.message
          : "Impossible d'accéder à la caméra";
      toast.error(message);
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
    <div className="relative min-h-screen overflow-hidden text-white" ref={containerRef}>

      <div className={`mx-auto w-full ${isFullscreen ? "" : "max-w-6xl px-4 pb-16 pt-16 sm:px-6 lg:px-8"}`}>
        {!isFullscreen && (
          <div className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => {
                  stopCamera();
                  navigate(-1);
                }}
                className="h-12 rounded-full border border-white/50 bg-white/70 px-5 text-foreground shadow-[var(--shadow-card)] backdrop-blur"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Retour
              </Button>

              <div className="rounded-full bg-white/60 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground shadow-inner shadow-white/50">
                Studio de projection AR
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button
                variant="outline"
                onClick={() => setShowGrid(!showGrid)}
                className={`h-12 rounded-full border-white/60 bg-white/70 px-5 text-sm font-semibold text-foreground shadow-[0_12px_30px_-22px_rgba(15,23,42,0.25)] backdrop-blur transition hover:bg-white ${showGrid ? "ring-2 ring-primary/40" : ""}`}
              >
                <Grid3x3 className="mr-2 h-4 w-4" />
                Grille
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowAssistant(!showAssistant)}
                className="h-12 rounded-full border-primary/50 bg-white/70 px-5 text-sm font-semibold text-primary shadow-[0_16px_36px_-26px_rgba(92,80,255,0.6)] backdrop-blur transition hover:bg-white"
              >
                <MessageSquare className="mr-2 h-4 w-4" />
                Coach IA
              </Button>
            </div>
          </div>
        )}

        <div className={`${isFullscreen ? "h-full" : "grid gap-8 lg:grid-cols-[1.7fr_1fr]"}`}>
          <div className={isFullscreen ? "fixed inset-0 z-40 bg-black" : "relative rounded-[36px] border border-white/65 bg-white/75 p-6 shadow-[var(--shadow-soft)] backdrop-blur-xl"}>
            <div className={`relative ${isFullscreen ? "h-full" : "rounded-[28px] border border-white/60 bg-black/80"}`}>
              <div className={`relative ${isFullscreen ? "h-full" : "aspect-[4/3] overflow-hidden rounded-[26px]"}`}>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className={`${isFullscreen ? "h-full w-full object-cover" : "h-full w-full object-cover"}`}
                />

                {showGrid && isCameraActive && (
                  <div className="pointer-events-none absolute inset-0">
                    <svg className="h-full w-full" style={{ opacity: 0.35 }}>
                      <defs>
                        <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
                          <path d="M 60 0 L 0 0 0 60" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="1" />
                        </pattern>
                      </defs>
                      <rect width="100%" height="100%" fill="url(#grid)" />
                    </svg>
                  </div>
                )}

                {image && isCameraActive && (
                  <div
                    className="pointer-events-none absolute inset-0 flex items-center justify-center p-6"
                    style={{ opacity: opacity[0] / 100 }}
                  >
                    <img
                      src={image}
                      alt="Reference"
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                )}

                {!isCameraActive && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 rounded-[26px] bg-black/70 text-center text-white">
                    <Camera className="h-14 w-14 opacity-70" />
                    <p className="max-w-xs text-sm text-white/80">Activez la caméra pour projeter votre image et ajuster l'opacité en direct.</p>
                  </div>
                )}

                {isFullscreen && isCameraActive && (
                  <div className="pointer-events-auto absolute bottom-8 left-1/2 z-50 flex -translate-x-1/2 items-center gap-4 rounded-full border border-white/40 bg-white/80 px-6 py-4 text-sm text-foreground shadow-[var(--shadow-card)] backdrop-blur">
                    <span className="font-semibold">Opacité {opacity[0]}%</span>
                    <Slider
                      value={opacity}
                      onValueChange={setOpacity}
                      max={100}
                      step={1}
                      className="w-36"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={toggleFullscreen}
                      className="rounded-full border border-white/50 bg-white/60 px-4 text-xs font-semibold"
                    >
                      Quitter
                    </Button>
                  </div>
                )}
              </div>

              {!isFullscreen && (
                <div className="mt-6 grid gap-4 rounded-[26px] border border-white/50 bg-white/70 p-6 text-sm text-muted-foreground shadow-inner shadow-white/50 sm:grid-cols-2">
                  <div className="space-y-2">
                    <h3 className="text-base font-semibold text-foreground">Statut caméra</h3>
                    <p className="leading-relaxed">
                      {isCameraActive ? "Projection en cours. Ajustez l'opacité ou lancez le mode plein écran pour dessiner sans distraction." : "La caméra est inactive. Téléchargez une référence et démarrez la projection en un clic."}
                    </p>
                  </div>
                  <div className="flex flex-col gap-3">
                    {!isCameraActive ? (
                      <Button
                        onClick={startCamera}
                        className="h-12 rounded-full bg-gradient-to-r from-primary to-secondary px-6 text-sm font-semibold text-white shadow-[0_18px_40px_-22px_rgba(92,80,255,0.7)] transition hover:scale-[1.01]"
                      >
                        <Camera className="mr-2 h-4 w-4" />
                        Activer la caméra
                      </Button>
                    ) : (
                      <div className="flex flex-col gap-2">
                        <Button
                          onClick={toggleFullscreen}
                          className="h-11 rounded-full bg-secondary px-6 text-sm font-semibold text-white shadow-[0_16px_36px_-24px_rgba(255,151,118,0.6)] transition hover:scale-[1.01]"
                        >
                          <Maximize2 className="mr-2 h-4 w-4" />
                          Mode plein écran
                        </Button>
                        <Button
                          onClick={stopCamera}
                          variant="destructive"
                          className="h-11 rounded-full text-sm font-semibold"
                        >
                          Arrêter la caméra
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {!isFullscreen && (
            <div className="space-y-6">
              <div className="rounded-[32px] border border-white/65 bg-white/75 p-6 shadow-[var(--shadow-card)] backdrop-blur-xl">
                <h3 className="text-lg font-semibold text-foreground">Image de référence</h3>
                <p className="mt-2 text-sm text-muted-foreground">Téléchargez une image à projeter sur votre surface de dessin. Formats recommandés : PNG, JPG, moins de 10 Mo.</p>

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
                  className="mt-4 h-11 w-full rounded-full border border-dashed border-primary/40 bg-white/70 px-6 text-sm font-semibold text-primary shadow-[0_12px_30px_-22px_rgba(92,80,255,0.5)] backdrop-blur transition hover:bg-white"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  {image ? "Changer l'image" : "Charger une image"}
                </Button>

                {image && (
                  <div className="mt-6 overflow-hidden rounded-[24px] border border-white/60">
                    <img
                      src={image}
                      alt="Preview"
                      className="w-full object-cover"
                    />
                  </div>
                )}
              </div>

              {image && isCameraActive && (
                <div className="rounded-[32px] border border-white/65 bg-white/75 p-6 shadow-[var(--shadow-card)] backdrop-blur-xl">
                  <h3 className="text-lg font-semibold text-foreground">Opacité de la projection</h3>
                  <p className="mt-2 text-sm text-muted-foreground">Ajustez la transparence de votre image projetée pour alterner entre esquisse et observation.</p>

                  <Slider
                    value={opacity}
                    onValueChange={setOpacity}
                    max={100}
                    step={1}
                    className="mt-6"
                  />

                  <div className="mt-4 flex items-center justify-between text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                    <span>Transparent</span>
                    <span>{opacity[0]}%</span>
                    <span>Opaque</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {showAssistant && (
        <AIAssistant onClose={() => setShowAssistant(false)} />
      )}
    </div>
  );
};

export default Project;
