import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Ghost, TrendingUp, Eye, MapPin, Palette, Filter, Layers } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PENCIL_ZONES } from "@/lib/art/pencil-guide";

interface GhostMentorProps {
  mode: "classic" | "ar" | "vr";
  referenceImage: string | null;
  assistanceLevel: "soft" | "medium" | "hard";
  onAssistanceLevelChange: (level: "soft" | "medium" | "hard") => void;
  showGhostLines: boolean;
  onShowGhostLinesChange: (checked: boolean) => void;
  showHeatmap: boolean;
  onShowHeatmapChange: (checked: boolean) => void;
  showTrajectories: boolean;
  onShowTrajectoriesChange: (checked: boolean) => void;
  sensitivity: number;
  onSensitivityChange: (value: number) => void;
  // New Props for Pencil Guide
  grayscaleMode: boolean;
  onGrayscaleModeChange: (checked: boolean) => void;
  showPencilGuides: boolean;
  onShowPencilGuidesChange: (checked: boolean) => void;
  activePencilFilter: string | null;
  onActivePencilFilterChange: (filter: string | null) => void;
  isolateZone: boolean;
  onIsolateZoneChange: (checked: boolean) => void;
  // Real-time metrics passed from parent
  errors: number;
  corrections: number;
  accuracy: number | null;
  feedback: string | null;
}

/**
 * GhostMentor provides a configurable AI coach overlay. It shows adjustable
 * assistance levels, toggles for ghost lines, heatmaps and trajectories.
 * It displays analysis metrics passed down from the active mode.
 */
const GhostMentor = ({
  mode,
  referenceImage,
  assistanceLevel,
  onAssistanceLevelChange,
  showGhostLines,
  onShowGhostLinesChange,
  showHeatmap,
  onShowHeatmapChange,
  showTrajectories,
  onShowTrajectoriesChange,
  sensitivity,
  onSensitivityChange,
  grayscaleMode,
  onGrayscaleModeChange,
  showPencilGuides,
  onShowPencilGuidesChange,
  activePencilFilter,
  onActivePencilFilterChange,
  isolateZone,
  onIsolateZoneChange,
  errors,
  corrections,
  accuracy,
  feedback,
}: GhostMentorProps) => {
  return (
    <div className="mobile-safe-area">
      <Card className="mobile-card mt-4 p-4 border-2 border-primary sm:p-6">
        <div className="mb-4 flex items-center gap-2">
          <Ghost className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Ghost Mentor</h3>
          <span className="ml-auto rounded-full bg-primary/10 px-2 py-1 text-xs text-primary">
            Mode {mode.toUpperCase()}
          </span>
        </div>

        <Tabs
          value={assistanceLevel}
          onValueChange={(v) => onAssistanceLevelChange(v as any)}
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="soft">Soft</TabsTrigger>
            <TabsTrigger value="medium">Medium</TabsTrigger>
            <TabsTrigger value="hard">Hard</TabsTrigger>
          </TabsList>
          <TabsContent value="soft" className="mt-4 space-y-4">
            <p className="text-sm text-muted-foreground">
              Corrections discrètes, intervention minimale pour préserver votre style.
            </p>
          </TabsContent>
          <TabsContent value="medium" className="mt-4 space-y-4">
            <p className="text-sm text-muted-foreground">
              Corrections visibles avec surlignage des erreurs et traits suggérés.
            </p>
          </TabsContent>
          <TabsContent value="hard" className="mt-4 space-y-4">
            <p className="text-sm text-muted-foreground">
              Trajectoires recommandées affichées avant même que vous traciez.
            </p>
          </TabsContent>
        </Tabs>

        <div className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              <Label>Lignes fantômes (Ghost Lines)</Label>
            </div>
            <Switch
              checked={showGhostLines}
              onCheckedChange={onShowGhostLinesChange}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              <Label>Heatmap des erreurs</Label>
            </div>
            <Switch checked={showHeatmap} onCheckedChange={onShowHeatmapChange} />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              <Label>Trajectoires suggérées</Label>
            </div>
            <Switch
              checked={showTrajectories}
              onCheckedChange={onShowTrajectoriesChange}
            />
          </div>

          {/* New Pencil Guide Controls */}
          <div className="border-t border-border pt-4 mt-4">
            <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Assistant Crayon
            </h4>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Mode N&B (Désaturation)</Label>
                <Switch
                  checked={grayscaleMode}
                  onCheckedChange={onGrayscaleModeChange}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>Guide des zones (Crayons)</Label>
                <Switch
                  checked={showPencilGuides}
                  onCheckedChange={onShowPencilGuidesChange}
                />
              </div>

              {showPencilGuides && (
                <div className="space-y-4 rounded-lg bg-muted/50 p-3">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Filter className="h-4 w-4 text-muted-foreground" />
                      <Label className="text-xs text-muted-foreground">Filtrer par crayon</Label>
                    </div>
                    <Select
                      value={activePencilFilter || "all"}
                      onValueChange={(v) => onActivePencilFilterChange(v === "all" ? null : v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Tous les crayons" />
                      </SelectTrigger>
                      <SelectContent className="max-h-[200px]">
                        <SelectItem value="all">Tous les crayons</SelectItem>
                        {PENCIL_ZONES.map((zone) => (
                          <SelectItem key={zone.id} value={zone.pencil}>
                            <div className="flex items-center gap-2">
                              <div
                                className="h-3 w-3 rounded-full border border-white/20"
                                style={{ backgroundColor: `rgb(${zone.color})` }}
                              />
                              <span>{zone.pencil} - {zone.description}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Layers className="h-4 w-4 text-muted-foreground" />
                      <Label className="text-xs text-muted-foreground">Isoler la zone</Label>
                    </div>
                    <Switch
                      checked={isolateZone}
                      onCheckedChange={onIsolateZoneChange}
                      disabled={!activePencilFilter}
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    Activez un filtre pour isoler une zone spécifique.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div>
            <Label>Sensibilité de détection</Label>
            <Slider
              value={[sensitivity]}
              onValueChange={(value) => onSensitivityChange(value[0])}
              min={0}
              max={100}
              step={1}
              className="mt-2"
            />
            <span className="text-sm text-muted-foreground">{sensitivity}%</span>
          </div>
        </div>

        <div className="mt-4 rounded-lg bg-muted p-3">
          <h4 className="mb-2 text-sm font-semibold">Analyse en temps réel</h4>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Erreurs détectées:</span>
              <span className="font-medium">{errors}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Corrections proposées:</span>
              <span className="font-medium">{corrections}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Précision globale:</span>
              <span className="font-medium text-green-600">
                {accuracy !== null ? `${accuracy}%` : "--"}
              </span>
            </div>
          </div>
          {feedback && (
            <div className="mt-3">
              <h5 className="text-sm font-semibold">Feedback IA</h5>
              <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
                {feedback}
              </p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default GhostMentor;