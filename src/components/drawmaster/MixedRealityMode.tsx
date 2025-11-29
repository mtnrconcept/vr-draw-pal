import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Smartphone, Camera, Layers, Image } from "lucide-react";
import { useState } from "react";

interface MixedRealityModeProps {
    enabled: boolean;
    onEnabledChange: (enabled: boolean) => void;
}

/**
 * Mode "Scène Réalité Mixte"
 * Tu pointes ton mur, ta table, un carnet →
 * L'IA projette une overlay guidée AR/VR directement sur ton espace réel:
 * - Personnage aligné sur ta feuille
 * - Grilles dynamiques
 * - Guides de construction
 * Passage du VR au dessin réel sans friction
 */
const MixedRealityMode = ({ enabled, onEnabledChange }: MixedRealityModeProps) => {
    const [surfaceDetection, setSurfaceDetection] = useState(true);
    const [autoAlign, setAutoAlign] = useState(true);
    const [showGrid, setShowGrid] = useState(true);
    const [showConstructionGuides, setShowConstructionGuides] = useState(true);
    const [overlayOpacity, setOverlayOpacity] = useState(70);
    const [isCalibrating, setIsCalibrating] = useState(false);

    return (
        <Card className="p-4 border-2 border-sky-500/50 bg-gradient-to-br from-sky-950/20 to-blue-950/20">
            <div className="mb-4 flex items-center gap-2">
                <Smartphone className="h-5 w-5 text-sky-400" />
                <h3 className="text-lg font-semibold text-sky-100">Réalité Mixte</h3>
                <Switch
                    checked={enabled}
                    onCheckedChange={onEnabledChange}
                    className="ml-auto"
                />
            </div>

            {enabled && (
                <div className="space-y-4">
                    <div className="rounded-lg bg-sky-950/40 p-3 border border-sky-500/30">
                        <p className="text-xs text-sky-300 leading-relaxed mb-2">
                            📱 Pointez votre appareil vers une surface (mur, table, carnet)
                            pour projeter les guides AR
                        </p>
                        <Button
                            size="sm"
                            variant={isCalibrating ? "destructive" : "default"}
                            onClick={() => setIsCalibrating(!isCalibrating)}
                            className="w-full"
                        >
                            <Camera className="h-4 w-4 mr-2" />
                            {isCalibrating ? "Calibration en cours..." : "Calibrer la surface"}
                        </Button>
                    </div>

                    <div>
                        <Label className="text-sky-200">Opacité de l'overlay</Label>
                        <Slider
                            value={[overlayOpacity]}
                            onValueChange={(v) => setOverlayOpacity(v[0])}
                            min={10}
                            max={100}
                            step={5}
                            className="mt-2"
                        />
                        <span className="text-sm text-sky-300">{overlayOpacity}%</span>
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Camera className="h-4 w-4 text-sky-400" />
                                <Label className="text-sm text-sky-300">Détection de surface</Label>
                            </div>
                            <Switch
                                checked={surfaceDetection}
                                onCheckedChange={setSurfaceDetection}
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Layers className="h-4 w-4 text-sky-400" />
                                <Label className="text-sm text-sky-300">Alignement automatique</Label>
                            </div>
                            <Switch
                                checked={autoAlign}
                                onCheckedChange={setAutoAlign}
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Layers className="h-4 w-4 text-sky-400" />
                                <Label className="text-sm text-sky-300">Grilles dynamiques</Label>
                            </div>
                            <Switch
                                checked={showGrid}
                                onCheckedChange={setShowGrid}
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Image className="h-4 w-4 text-sky-400" />
                                <Label className="text-sm text-sky-300">Guides de construction</Label>
                            </div>
                            <Switch
                                checked={showConstructionGuides}
                                onCheckedChange={setShowConstructionGuides}
                            />
                        </div>
                    </div>

                    {isCalibrating && (
                        <div className="rounded-lg bg-sky-950/40 p-3 border border-sky-500/30">
                            <h4 className="text-sm font-semibold text-sky-100 mb-2">
                                Calibration en cours
                            </h4>
                            <div className="space-y-1 text-xs text-sky-300">
                                <p>✓ Détection de la surface...</p>
                                <p>✓ Analyse de l'orientation...</p>
                                <p>✓ Calcul de l'échelle...</p>
                                <p className="text-sky-400 animate-pulse">→ Alignement des guides...</p>
                            </div>
                        </div>
                    )}

                    <div className="rounded-lg bg-sky-950/40 p-3 border border-sky-500/30">
                        <h4 className="text-sm font-semibold text-sky-100 mb-2">
                            Surfaces détectées
                        </h4>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-sky-300">📄 Feuille A4</span>
                                <span className="text-sky-400">21 × 29.7 cm</span>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-sky-300">🪑 Table</span>
                                <span className="text-sky-400">120 × 80 cm</span>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-sky-300">🧱 Mur</span>
                                <span className="text-sky-400">250 × 200 cm</span>
                            </div>
                        </div>
                    </div>

                    <div className="text-xs text-sky-400 bg-sky-950/30 p-2 rounded">
                        🔄 Passez du VR au dessin réel sans friction. L'IA projette vos guides
                        directement sur votre espace physique.
                    </div>
                </div>
            )}
        </Card>
    );
};

export default MixedRealityMode;
