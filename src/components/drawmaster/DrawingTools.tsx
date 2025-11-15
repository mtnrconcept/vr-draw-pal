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
  Camera, 
  Flashlight, 
  Video,
  Upload,
  Sun,
  Contrast
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
}: DrawingToolsProps) => {
  const [contrast, setContrast] = useState(100);
  const [brightness, setBrightness] = useState(100);
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
    <div className="mt-6 space-y-4">
      <h3 className="font-semibold">Outils de dessin</h3>

      {/* Image upload */}
      <div>
        <Label htmlFor="image-upload">Image de référence</Label>
        <input
          id="image-upload"
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageUpload}
        />
        <Button
          variant="outline"
          className="w-full mt-2"
          onClick={() => document.getElementById("image-upload")?.click()}
        >
          <Upload className="w-4 h-4 mr-2" />
          {referenceImage ? "Changer l'image" : "Charger une image"}
        </Button>
      </div>

      {/* Grid */}
      <Card className="p-3 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Grid className="w-4 h-4" />
            <Label>Grille</Label>
          </div>
          <Switch
            checked={gridEnabled}
            onCheckedChange={onGridEnabledChange}
          />
        </div>
        {gridEnabled && (
          <div>
            <Label className="text-xs">Opacité</Label>
            <Slider
              value={[gridOpacity]}
              onValueChange={(value) => onGridOpacityChange(value[0])}
              min={0}
              max={100}
              step={1}
              className="mt-1"
            />
            <span className="text-xs text-muted-foreground">{gridOpacity}%</span>
            <div className="mt-3">
              <Label className="text-xs">Nombre de carreaux</Label>
              <Slider
                value={[gridTileCount]}
                onValueChange={(value) =>
                  onGridTileCountChange(Math.round(value[0]))
                }
                min={2}
                max={20}
                step={1}
                className="mt-1"
              />
              <span className="text-xs text-muted-foreground">
                {gridTileCount} × {gridTileCount}
              </span>
            </div>
          </div>
        )}
      </Card>

      {/* Strobe */}
      <Card className="p-3 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4" />
            <Label>Strobe</Label>
          </div>
          <Switch
            checked={strobeEnabled}
            onCheckedChange={onStrobeEnabledChange}
          />
        </div>
        {strobeEnabled && (
          <div>
            <Label className="text-xs">Vitesse (Hz)</Label>
            <Slider
              value={[strobeSpeed]}
              onValueChange={(value) => onStrobeSpeedChange(value[0])}
              min={1}
              max={10}
              step={0.5}
              className="mt-1"
            />
            <span className="text-xs text-muted-foreground">{strobeSpeed} Hz</span>
            <div className="mt-3 space-y-3">
              <div>
                <Label className="text-xs">Opacité minimale</Label>
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
                  className="mt-1"
                />
                <span className="text-xs text-muted-foreground">
                  {strobeMinOpacity}%
                </span>
              </div>
              <div>
                <Label className="text-xs">Opacité maximale</Label>
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
                  className="mt-1"
                />
                <span className="text-xs text-muted-foreground">
                  {strobeMaxOpacity}%
                </span>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Filters */}
      <Card className="p-3 space-y-3">
        <div className="flex items-center gap-2">
          <Palette className="w-4 h-4" />
          <Label>Filtres</Label>
        </div>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Contrast className="w-3 h-3" />
            <Label className="text-xs">Contraste</Label>
          </div>
          <Slider
            value={[contrast]}
            onValueChange={(value) => setContrast(value[0])}
            min={0}
            max={200}
            step={1}
          />
          <span className="text-xs text-muted-foreground">{contrast}%</span>
        </div>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sun className="w-3 h-3" />
            <Label className="text-xs">Luminosité</Label>
          </div>
          <Slider
            value={[brightness]}
            onValueChange={(value) => setBrightness(value[0])}
            min={0}
            max={200}
            step={1}
          />
          <span className="text-xs text-muted-foreground">{brightness}%</span>
        </div>
      </Card>

      {/* Camera controls */}
      <div className="space-y-2">
        <Button
          variant="outline"
          className="w-full"
          onClick={toggleTorch}
        >
          <Flashlight className="w-4 h-4 mr-2" />
          {torchEnabled ? "Éteindre" : "Allumer"} la lampe
        </Button>

        <Button
          variant={timelapseRecording ? "destructive" : "outline"}
          className="w-full"
          onClick={toggleTimelapse}
        >
          <Video className="w-4 h-4 mr-2" />
          {timelapseRecording ? "Arrêter" : "Démarrer"} Time-lapse
        </Button>
      </div>
    </div>
  );
};

export default DrawingTools;
