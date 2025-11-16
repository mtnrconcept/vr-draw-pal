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
    <div className="mobile-safe-area space-y-6 mobile-stack-gap">
      <div className="mobile-card rounded-[28px] border border-white/60 bg-white/70 p-4 shadow-[var(--shadow-card)] backdrop-blur-xl sm:p-5">
        <Label htmlFor="image-upload" className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Image de référence
        </Label>
        <input
          id="image-upload"
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageUpload}
        />
        <Button
          variant="outline"
          className="mt-4 h-11 w-full rounded-full border border-dashed border-primary/40 bg-white/70 px-6 text-xs font-semibold uppercase tracking-widest text-primary shadow-[0_12px_30px_-22px_rgba(92,80,255,0.5)] backdrop-blur transition hover:bg-white"
          onClick={() => document.getElementById("image-upload")?.click()}
        >
          <Upload className="mr-2 h-4 w-4" />
          {referenceImage ? "Changer l'image" : "Charger une image"}
        </Button>
      </div>

      <Card className="mobile-card space-y-4 rounded-[28px] border border-white/60 bg-white/70 p-4 shadow-[var(--shadow-card)] backdrop-blur-xl sm:p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
            <Grid className="h-4 w-4 text-primary" />
            Grille
          </div>
          <Switch
            checked={gridEnabled}
            onCheckedChange={onGridEnabledChange}
          />
        </div>
        {gridEnabled && (
          <div className="space-y-4 rounded-[22px] border border-white/50 bg-white/60 p-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground shadow-inner shadow-white/50">
            <div>
              <div className="mb-2 flex items-center justify-between">
                <span>Opacité</span>
                <span className="text-primary">{gridOpacity}%</span>
              </div>
              <Slider
                value={[gridOpacity]}
                onValueChange={(value) => onGridOpacityChange(value[0])}
                min={0}
                max={100}
                step={1}
              />
            </div>
            <div>
              <div className="mb-2 flex items-center justify-between">
                <span>Nombre de carreaux</span>
                <span className="text-primary">{gridTileCount} × {gridTileCount}</span>
              </div>
              <Slider
                value={[gridTileCount]}
                onValueChange={(value) =>
                  onGridTileCountChange(Math.round(value[0]))
                }
                min={2}
                max={20}
                step={1}
              />
            </div>
          </div>
        )}
      </Card>

      <Card className="mobile-card space-y-4 rounded-[28px] border border-white/60 bg-white/70 p-4 shadow-[var(--shadow-card)] backdrop-blur-xl sm:p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
            <Zap className="h-4 w-4 text-secondary" />
            Strobe
          </div>
          <Switch
            checked={strobeEnabled}
            onCheckedChange={onStrobeEnabledChange}
          />
        </div>
        {strobeEnabled && (
          <div className="space-y-4 rounded-[22px] border border-white/50 bg-white/60 p-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground shadow-inner shadow-white/50">
            <div>
              <div className="mb-2 flex items-center justify-between">
                <span>Vitesse</span>
                <span className="text-secondary">{strobeSpeed} Hz</span>
              </div>
              <Slider
                value={[strobeSpeed]}
                onValueChange={(value) => onStrobeSpeedChange(value[0])}
                min={1}
                max={10}
                step={0.5}
              />
            </div>
            <div>
              <div className="mb-2 flex items-center justify-between">
                <span>Opacité minimale</span>
                <span className="text-secondary">{strobeMinOpacity}%</span>
              </div>
              <Slider
                value={[strobeMinOpacity]}
                onValueChange={(value) =>
                  onStrobeMinOpacityChange(
                    Math.min(Math.round(value[0]), strobeMaxOpacity)
                  )
                }
                min={0}
                max={100}
                step={1}
              />
            </div>
            <div>
              <div className="mb-2 flex items-center justify-between">
                <span>Opacité maximale</span>
                <span className="text-secondary">{strobeMaxOpacity}%</span>
              </div>
              <Slider
                value={[strobeMaxOpacity]}
                onValueChange={(value) =>
                  onStrobeMaxOpacityChange(
                    Math.max(Math.round(value[0]), strobeMinOpacity)
                  )
                }
                min={0}
                max={100}
                step={1}
              />
            </div>
          </div>
        )}
      </Card>

      <Card className="mobile-card space-y-4 rounded-[28px] border border-white/60 bg-white/70 p-4 shadow-[var(--shadow-card)] backdrop-blur-xl sm:p-5">
        <div className="flex items-center gap-3 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
          <Palette className="h-4 w-4 text-accent" />
          Filtres
        </div>
        <div className="space-y-3 rounded-[22px] border border-white/50 bg-white/60 p-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground shadow-inner shadow-white/40">
          <div>
            <div className="mb-2 flex items-center justify-between">
              <span>Contraste</span>
              <span className="text-accent">{contrast}%</span>
            </div>
            <Slider
              value={[contrast]}
              onValueChange={(value) => onContrastChange(Math.round(value[0]))}
              min={0}
              max={200}
              step={1}
            />
          </div>
          <div>
            <div className="mb-2 flex items-center justify-between">
              <span>Luminosité</span>
              <span className="text-accent">{brightness}%</span>
            </div>
            <Slider
              value={[brightness]}
              onValueChange={(value) => onBrightnessChange(Math.round(value[0]))}
              min={0}
              max={200}
              step={1}
            />
          </div>
        </div>
      </Card>

      <div className="space-y-3 rounded-[28px] border border-white/60 bg-white/70 p-5 shadow-[var(--shadow-card)] backdrop-blur-xl">
        <Button
          variant="outline"
          className="h-11 w-full rounded-full border-white/60 bg-white/70 px-6 text-xs font-semibold uppercase tracking-widest text-foreground shadow-[0_12px_30px_-22px_rgba(15,23,42,0.25)] backdrop-blur transition hover:bg-white"
          onClick={toggleTorch}
        >
          <Flashlight className="mr-2 h-4 w-4" />
          {torchEnabled ? "Éteindre" : "Allumer"} la lampe
        </Button>

        <Button
          variant={timelapseRecording ? "destructive" : "outline"}
          className={`h-11 w-full rounded-full px-6 text-xs font-semibold uppercase tracking-widest ${timelapseRecording ? "" : "border-white/60 bg-white/70 text-foreground shadow-[0_12px_30px_-22px_rgba(15,23,42,0.25)] backdrop-blur transition hover:bg-white"}`}
          onClick={toggleTimelapse}
        >
          <Video className="mr-2 h-4 w-4" />
          {timelapseRecording ? "Arrêter" : "Démarrer"} Time-lapse
        </Button>
      </div>
    </div>
  );
};

export default DrawingTools;
