import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { 
  Grid,
  Zap,
  Palette,
  Flashlight,
  Video,
  Upload,
} from "lucide-react";
import { toast } from "sonner";

interface DrawingToolsProps {
  referenceImage: string | null;
  onImageSelect: (image: string | null) => void;
  gridEnabled: boolean;
  onGridEnabledChange: (enabled: boolean) => void;
  gridOpacity: number;
  onGridOpacityChange: (opacity: number) => void;
  gridTileCount: number;
  onGridTileCountChange: (count: number) => void;
  strobeEnabled: boolean;
  onStrobeEnabledChange: (enabled: boolean) => void;
  strobeSpeed: number;
  onStrobeSpeedChange: (speed: number) => void;
  strobeMinOpacity: number;
  strobeMaxOpacity: number;
  onStrobeMinOpacityChange: (min: number) => void;
  onStrobeMaxOpacityChange: (max: number) => void;
  contrast: number;
  onContrastChange: (value: number) => void;
  brightness: number;
  onBrightnessChange: (value: number) => void;
}

const DrawingTools = ({
  referenceImage,
  onImageSelect,
  gridEnabled,
  onGridEnabledChange,
  gridOpacity,
  onGridOpacityChange,
  gridTileCount,
  onGridTileCountChange,
  strobeEnabled,
  onStrobeEnabledChange,
  strobeSpeed,
  onStrobeSpeedChange,
  strobeMinOpacity,
  strobeMaxOpacity,
  onStrobeMinOpacityChange,
  onStrobeMaxOpacityChange,
  contrast,
  onContrastChange,
  brightness,
  onBrightnessChange,
}: DrawingToolsProps) => {
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [timelapseRecording, setTimelapseRecording] = useState(false);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        onImageSelect(e.target?.result as string);
        toast.success("Image de référence chargée");
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleTorch = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }
      });
      const track = stream.getVideoTracks()[0];
      const capabilities = track.getCapabilities() as any;
      
      if (capabilities.torch) {
        await track.applyConstraints({
          advanced: [{ torch: !torchEnabled } as any]
        });
        setTorchEnabled(!torchEnabled);
        toast.success(torchEnabled ? "Lampe éteinte" : "Lampe allumée");
      } else {
        toast.error("La lampe torche n'est pas disponible sur cet appareil");
      }
    } catch (error) {
      toast.error("Impossible de contrôler la lampe");
    }
  };

  const toggleTimelapse = () => {
    setTimelapseRecording(!timelapseRecording);
    toast.success(timelapseRecording ? "Enregistrement arrêté" : "Enregistrement démarré");
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="overflow-x-hidden rounded-[20px] border border-white/60 bg-white/70 p-4 shadow-[var(--shadow-card)] backdrop-blur-xl sm:rounded-[24px] sm:p-5 lg:rounded-[28px]">
        <Label htmlFor="image-upload" className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Image de référence
        </Label>
        <input id="image-upload" type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
        <Button variant="outline" className="mt-3 h-10 w-full rounded-full border border-dashed border-primary/40 bg-white/70 px-4 text-xs font-semibold uppercase tracking-widest text-primary shadow-[0_12px_30px_-22px_rgba(92,80,255,0.5)] backdrop-blur transition hover:bg-white sm:mt-4 sm:h-11 sm:px-6" onClick={() => document.getElementById("image-upload")?.click()}>
          <Upload className="mr-1.5 h-3.5 w-3.5 sm:mr-2 sm:h-4 sm:w-4" />
          {referenceImage ? "Changer l'image" : "Charger une image"}
        </Button>
      </div>

      <Card className="space-y-3 overflow-x-hidden rounded-[20px] border border-white/60 bg-white/70 p-4 shadow-[var(--shadow-card)] backdrop-blur-xl sm:space-y-4 sm:rounded-[24px] sm:p-5 lg:rounded-[28px]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground sm:gap-3 sm:text-sm">
            <Grid className="h-3.5 w-3.5 text-primary sm:h-4 sm:w-4" />
            Grille
          </div>
          <Switch checked={gridEnabled} onCheckedChange={onGridEnabledChange} />
        </div>
        {gridEnabled && (
          <div className="space-y-3 rounded-[18px] border border-white/50 bg-white/60 p-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground shadow-inner shadow-white/50 sm:space-y-4 sm:rounded-[22px] sm:p-4">
            <div>
              <div className="mb-2 flex items-center justify-between"><span>Opacité</span><span className="text-primary">{gridOpacity}%</span></div>
              <Slider value={[gridOpacity]} onValueChange={(value) => onGridOpacityChange(value[0])} min={0} max={100} step={1} />
            </div>
            <div>
              <div className="mb-2 flex items-center justify-between"><span>Nombre de carreaux</span><span className="text-primary">{gridTileCount} × {gridTileCount}</span></div>
              <Slider value={[gridTileCount]} onValueChange={(value) => onGridTileCountChange(Math.round(value[0]))} min={2} max={20} step={1} />
            </div>
          </div>
        )}
      </Card>

      <Card className="space-y-3 overflow-x-hidden rounded-[20px] border border-white/60 bg-white/70 p-4 shadow-[var(--shadow-card)] backdrop-blur-xl sm:space-y-4 sm:rounded-[24px] sm:p-5 lg:rounded-[28px]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground sm:gap-3 sm:text-sm">
            <Zap className="h-3.5 w-3.5 text-secondary sm:h-4 sm:w-4" />
            Strobe
          </div>
          <Switch checked={strobeEnabled} onCheckedChange={onStrobeEnabledChange} />
        </div>
        {strobeEnabled && (
          <div className="space-y-3 rounded-[18px] border border-white/50 bg-white/60 p-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground shadow-inner shadow-white/50 sm:space-y-4 sm:rounded-[22px] sm:p-4">
            <div><div className="mb-2 flex items-center justify-between"><span>Vitesse</span><span className="text-secondary">{strobeSpeed} Hz</span></div><Slider value={[strobeSpeed]} onValueChange={(value) => onStrobeSpeedChange(value[0])} min={1} max={10} step={0.5} /></div>
            <div><div className="mb-2 flex items-center justify-between"><span>Opacité minimale</span><span className="text-secondary">{strobeMinOpacity}%</span></div><Slider value={[strobeMinOpacity]} onValueChange={(value) => onStrobeMinOpacityChange(Math.min(Math.round(value[0]), strobeMaxOpacity))} min={0} max={100} step={1} /></div>
            <div><div className="mb-2 flex items-center justify-between"><span>Opacité maximale</span><span className="text-secondary">{strobeMaxOpacity}%</span></div><Slider value={[strobeMaxOpacity]} onValueChange={(value) => onStrobeMaxOpacityChange(Math.max(Math.round(value[0]), strobeMinOpacity))} min={0} max={100} step={1} /></div>
          </div>
        )}
      </Card>

      <Card className="space-y-3 overflow-x-hidden rounded-[20px] border border-white/60 bg-white/70 p-4 shadow-[var(--shadow-card)] backdrop-blur-xl sm:space-y-4 sm:rounded-[24px] sm:p-5 lg:rounded-[28px]">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground sm:gap-3 sm:text-sm">
          <Palette className="h-3.5 w-3.5 text-accent sm:h-4 sm:w-4" />
          Filtres
        </div>
        <div className="space-y-3 rounded-[18px] border border-white/50 bg-white/60 p-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground shadow-inner shadow-white/40 sm:rounded-[22px] sm:p-4">
          <div><div className="mb-2 flex items-center justify-between"><span>Contraste</span><span className="text-accent">{contrast}%</span></div><Slider value={[contrast]} onValueChange={(value) => onContrastChange(Math.round(value[0]))} min={0} max={200} step={1} /></div>
          <div><div className="mb-2 flex items-center justify-between"><span>Luminosité</span><span className="text-accent">{brightness}%</span></div><Slider value={[brightness]} onValueChange={(value) => onBrightnessChange(Math.round(value[0]))} min={0} max={200} step={1} /></div>
        </div>
      </Card>

      <div className="space-y-3 overflow-x-hidden rounded-[20px] border border-white/60 bg-white/70 p-4 shadow-[var(--shadow-card)] backdrop-blur-xl sm:rounded-[24px] sm:p-5 lg:rounded-[28px]">
        <Button variant="outline" className={`h-10 w-full rounded-full border px-4 text-xs font-semibold uppercase tracking-widest transition sm:h-11 sm:px-6 ${torchEnabled ? "border-yellow-400/50 bg-gradient-to-br from-yellow-50 to-amber-50 text-amber-700 shadow-[0_12px_30px_-22px_rgba(250,204,21,0.7)]" : "border-white/60 bg-white/70 text-muted-foreground hover:bg-white"}`} onClick={toggleTorch}>
          <Flashlight className="mr-1.5 h-3.5 w-3.5 sm:mr-2 sm:h-4 sm:w-4" />
          {torchEnabled ? "Lampe éteinte" : "Lampe allumée"}
        </Button>
        <Button variant="outline" className={`h-10 w-full rounded-full border px-4 text-xs font-semibold uppercase tracking-widest transition sm:h-11 sm:px-6 ${timelapseRecording ? "border-red-400/50 bg-gradient-to-br from-red-50 to-pink-50 text-red-700 shadow-[0_12px_30px_-22px_rgba(239,68,68,0.7)]" : "border-white/60 bg-white/70 text-muted-foreground hover:bg-white"}`} onClick={toggleTimelapse}>
          <Video className="mr-1.5 h-3.5 w-3.5 sm:mr-2 sm:h-4 sm:w-4" />
          {timelapseRecording ? "Arrêter Timelapse" : "Démarrer Timelapse"}
        </Button>
      </div>
    </div>
  );
};

export default DrawingTools;
