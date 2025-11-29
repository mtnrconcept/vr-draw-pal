import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Copy, Ruler, Clock, TrendingDown } from "lucide-react";
import { useState } from "react";

interface ShadowCopyModeProps {
    enabled: boolean;
    onEnabledChange: (enabled: boolean) => void;
    masterStroke?: any; // The ideal stroke to follow
}

/**
 * Mode "Shadow-Copy" : tu dessines dans l'ombre du maître
 * - Trait idéal en fantôme semi-transparent
 * - Ton trait en temps réel, superposé
 * - Retour en couleur dynamique sur les écarts (angle, longueur, rythme)
 * - Mesure de précision chirurgicale
 */
const ShadowCopyMode = ({ enabled, onEnabledChange, masterStroke }: ShadowCopyModeProps) => {
    const [ghostOpacity, setGhostOpacity] = useState(40);
    const [showAngleDeviation, setShowAngleDeviation] = useState(true);
    const [showLengthDeviation, setShowLengthDeviation] = useState(true);
    const [showRhythmDeviation, setShowRhythmDeviation] = useState(true);
    const [deviationSensitivity, setDeviationSensitivity] = useState(70);

    // Mock real-time metrics
    const [metrics] = useState({
        angleDeviation: 12, // degrees
        lengthDeviation: 8, // percentage
        rhythmScore: 85, // 0-100
        overallPrecision: 78 // 0-100
    });

    return (
        <Card className="p-4 border-2 border-indigo-500/50 bg-gradient-to-br from-indigo-950/20 to-violet-950/20">
            <div className="mb-4 flex items-center gap-2">
                <Copy className="h-5 w-5 text-indigo-400" />
                <h3 className="text-lg font-semibold text-indigo-100">Mode Shadow-Copy</h3>
                <Switch
                    checked={enabled}
                    onCheckedChange={onEnabledChange}
                    className="ml-auto"
                />
            </div>

            {enabled && (
                <div className="space-y-4">
                    <div>
                        <Label className="text-indigo-200">Opacité du trait fantôme</Label>
                        <Slider
                            value={[ghostOpacity]}
                            onValueChange={(v) => setGhostOpacity(v[0])}
                            min={10}
                            max={80}
                            step={5}
                            className="mt-2"
                        />
                        <span className="text-sm text-indigo-300">{ghostOpacity}%</span>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-indigo-200">Indicateurs de déviation</Label>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Ruler className="h-4 w-4 text-indigo-400" />
                                <Label className="text-sm text-indigo-300">Écart d'angle</Label>
                            </div>
                            <Switch
                                checked={showAngleDeviation}
                                onCheckedChange={setShowAngleDeviation}
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <TrendingDown className="h-4 w-4 text-indigo-400" />
                                <Label className="text-sm text-indigo-300">Écart de longueur</Label>
                            </div>
                            <Switch
                                checked={showLengthDeviation}
                                onCheckedChange={setShowLengthDeviation}
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-indigo-400" />
                                <Label className="text-sm text-indigo-300">Rythme</Label>
                            </div>
                            <Switch
                                checked={showRhythmDeviation}
                                onCheckedChange={setShowRhythmDeviation}
                            />
                        </div>
                    </div>

                    <div>
                        <Label className="text-indigo-200">Sensibilité de détection</Label>
                        <Slider
                            value={[deviationSensitivity]}
                            onValueChange={(v) => setDeviationSensitivity(v[0])}
                            min={0}
                            max={100}
                            step={5}
                            className="mt-2"
                        />
                        <span className="text-sm text-indigo-300">{deviationSensitivity}%</span>
                    </div>

                    <div className="rounded-lg bg-indigo-950/40 p-4 border border-indigo-500/30">
                        <h4 className="text-sm font-semibold text-indigo-100 mb-3">
                            Précision chirurgicale
                        </h4>
                        <div className="space-y-2 text-xs">
                            <div className="flex justify-between items-center">
                                <span className="text-indigo-300">Écart d'angle:</span>
                                <span className={`font-medium ${metrics.angleDeviation < 15 ? 'text-green-400' : 'text-orange-400'}`}>
                                    {metrics.angleDeviation}°
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-indigo-300">Écart de longueur:</span>
                                <span className={`font-medium ${metrics.lengthDeviation < 10 ? 'text-green-400' : 'text-orange-400'}`}>
                                    {metrics.lengthDeviation}%
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-indigo-300">Score de rythme:</span>
                                <span className={`font-medium ${metrics.rhythmScore > 80 ? 'text-green-400' : 'text-yellow-400'}`}>
                                    {metrics.rhythmScore}/100
                                </span>
                            </div>
                            <div className="mt-3 pt-3 border-t border-indigo-500/30">
                                <div className="flex justify-between items-center">
                                    <span className="text-indigo-200 font-semibold">Précision globale:</span>
                                    <span className={`font-bold text-lg ${metrics.overallPrecision > 85 ? 'text-green-400' :
                                            metrics.overallPrecision > 70 ? 'text-yellow-400' : 'text-orange-400'
                                        }`}>
                                        {metrics.overallPrecision}%
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="text-xs text-indigo-400 bg-indigo-950/30 p-2 rounded">
                        💡 Le trait fantôme montre le chemin idéal. Suivez-le pour améliorer votre précision.
                    </div>
                </div>
            )}
        </Card>
    );
};

export default ShadowCopyMode;
