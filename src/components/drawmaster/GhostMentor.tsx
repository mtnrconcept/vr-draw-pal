import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Ghost, TrendingUp, Eye, MapPin } from "lucide-react";

interface GhostMentorProps {
  mode: "classic" | "ar" | "vr";
  referenceImage: string | null;
}

const GhostMentor = ({ mode, referenceImage }: GhostMentorProps) => {
  const [assistanceLevel, setAssistanceLevel] = useState<"soft" | "medium" | "hard">("medium");
  const [showGhostLines, setShowGhostLines] = useState(true);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [showTrajectories, setShowTrajectories] = useState(false);
  const [sensitivity, setSensitivity] = useState(50);

  return (
    <Card className="mt-4 p-4 border-2 border-primary">
      <div className="flex items-center gap-2 mb-4">
        <Ghost className="w-5 h-5 text-primary" />
        <h3 className="font-semibold text-lg">Ghost Mentor</h3>
        <span className="ml-auto text-xs text-primary bg-primary/10 px-2 py-1 rounded-full">
          Mode {mode.toUpperCase()}
        </span>
      </div>

      <Tabs value={assistanceLevel} onValueChange={(v) => setAssistanceLevel(v as any)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="soft">Soft</TabsTrigger>
          <TabsTrigger value="medium">Medium</TabsTrigger>
          <TabsTrigger value="hard">Hard</TabsTrigger>
        </TabsList>

        <TabsContent value="soft" className="space-y-4 mt-4">
          <p className="text-sm text-muted-foreground">
            Corrections discrètes, intervention minimale pour préserver votre style.
          </p>
        </TabsContent>

        <TabsContent value="medium" className="space-y-4 mt-4">
          <p className="text-sm text-muted-foreground">
            Corrections visibles avec surlignage des erreurs et traits suggérés.
          </p>
        </TabsContent>

        <TabsContent value="hard" className="space-y-4 mt-4">
          <p className="text-sm text-muted-foreground">
            Trajectoires recommandées affichées avant même que vous traciez.
          </p>
        </TabsContent>
      </Tabs>

      <div className="space-y-4 mt-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4" />
            <Label>Lignes fantômes (Ghost Lines)</Label>
          </div>
          <Switch
            checked={showGhostLines}
            onCheckedChange={setShowGhostLines}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4" />
            <Label>Heatmap des erreurs</Label>
          </div>
          <Switch
            checked={showHeatmap}
            onCheckedChange={setShowHeatmap}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            <Label>Trajectoires suggérées</Label>
          </div>
          <Switch
            checked={showTrajectories}
            onCheckedChange={setShowTrajectories}
          />
        </div>

        <div>
          <Label>Sensibilité de détection</Label>
          <Slider
            value={[sensitivity]}
            onValueChange={(value) => setSensitivity(value[0])}
            min={0}
            max={100}
            step={1}
            className="mt-2"
          />
          <span className="text-sm text-muted-foreground">{sensitivity}%</span>
        </div>
      </div>

      <div className="mt-4 p-3 bg-muted rounded-lg">
        <h4 className="text-sm font-semibold mb-2">Analyse en temps réel</h4>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Erreurs détectées:</span>
            <span className="font-medium">0</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Corrections proposées:</span>
            <span className="font-medium">0</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Précision globale:</span>
            <span className="font-medium text-green-600">--</span>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default GhostMentor;
