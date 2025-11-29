import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RotateCcw, Lightbulb, Layers } from "lucide-react";
import { useState, useEffect } from "react";
import { CoachService, DetectedError } from "@/lib/ai/coach-service";
import { toast } from "sonner";

interface ErrorDetectionProps {
    enabled: boolean;
    onEnabledChange: (enabled: boolean) => void;
    mode: "classic" | "ar" | "vr";
}

/**
 * Détection d'erreur en temps réel avec correction holographique
 * Via AI et vision par ordinateur:
 * - Détecte les proportions erronées
 * - Fait "pivoter" des volumes fantômes autour du trait
 * - Propose une version corrigée sous forme de sculpture transparente
 */
const ErrorDetection = ({ enabled, onEnabledChange, mode }: ErrorDetectionProps) => {
    const [detectionSensitivity, setDetectionSensitivity] = useState(70);
    const [showHolographicCorrection, setShowHolographicCorrection] = useState(true);
    const [autoCorrect, setAutoCorrect] = useState(false);
    const [volumeRotation, setVolumeRotation] = useState(true);
    const [errors, setErrors] = useState<DetectedError[]>([]);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    // Analyse périodique des erreurs avec l'IA
    useEffect(() => {
        if (!enabled) return;

        const analyzeErrors = async () => {
            setIsAnalyzing(true);
            try {
                const detectedErrors = await CoachService.detectErrors(mode);
                setErrors(detectedErrors);
            } catch (error) {
                console.error("Error detection failed:", error);
                toast.error("Échec de l'analyse des erreurs");
            } finally {
                setIsAnalyzing(false);
            }
        };

        analyzeErrors();
        const interval = setInterval(analyzeErrors, 15000); // Analyse toutes les 15 secondes

        return () => clearInterval(interval);
    }, [enabled, mode, detectionSensitivity]);

    const getSeverityColor = (severity: string) => {
        switch (severity) {
            case "high": return "text-red-400 border-red-500/50";
            case "medium": return "text-orange-400 border-orange-500/50";
            case "low": return "text-yellow-400 border-yellow-500/50";
            default: return "text-gray-400 border-gray-500/50";
        }
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case "proportion": return "📏";
            case "perspective": return "🔷";
            case "anatomy": return "🦴";
            case "symmetry": return "⚖️";
            default: return "⚠️";
        }
    };

    return (
        <Card className="p-4 border-2 border-red-500/50 bg-gradient-to-br from-red-950/20 to-orange-950/20">
            <div className="mb-4 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-400" />
                <h3 className="text-lg font-semibold text-red-100">Détection d'Erreurs IA</h3>
                <Switch
                    checked={enabled}
                    onCheckedChange={onEnabledChange}
                    className="ml-auto"
                />
            </div>

            {enabled && (
                <div className="space-y-4">
                    <div>
                        <Label className="text-red-200">Sensibilité de détection</Label>
                        <Slider
                            value={[detectionSensitivity]}
                            onValueChange={(v) => setDetectionSensitivity(v[0])}
                            min={0}
                            max={100}
                            step={5}
                            className="mt-2"
                        />
                        <span className="text-sm text-red-300">{detectionSensitivity}%</span>
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Layers className="h-4 w-4 text-red-400" />
                                <Label className="text-sm text-red-300">Correction holographique</Label>
                            </div>
                            <Switch
                                checked={showHolographicCorrection}
                                onCheckedChange={setShowHolographicCorrection}
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <RotateCcw className="h-4 w-4 text-red-400" />
                                <Label className="text-sm text-red-300">Rotation de volumes fantômes</Label>
                            </div>
                            <Switch
                                checked={volumeRotation}
                                onCheckedChange={setVolumeRotation}
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Lightbulb className="h-4 w-4 text-red-400" />
                                <Label className="text-sm text-red-300">Auto-correction</Label>
                            </div>
                            <Switch
                                checked={autoCorrect}
                                onCheckedChange={setAutoCorrect}
                            />
                        </div>
                    </div>

                    <div className="rounded-lg bg-red-950/40 p-3 border border-red-500/30">
                        <h4 className="text-sm font-semibold text-red-100 mb-3 flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4" />
                            {isAnalyzing ? "Analyse en cours..." : `Erreurs détectées (${errors.length})`}
                        </h4>
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                            {errors.length === 0 && !isAnalyzing && (
                                <p className="text-xs text-red-300">Aucune erreur détectée pour le moment</p>
                            )}
                            {errors.map((error) => (
                                <div
                                    key={error.id}
                                    className={`p-2 rounded border ${getSeverityColor(error.severity)} bg-black/20`}
                                >
                                    <div className="flex items-start gap-2">
                                        <span className="text-lg">{getTypeIcon(error.type)}</span>
                                        <div className="flex-1 text-xs">
                                            <p className="font-semibold text-red-100">{error.description}</p>
                                            <p className="text-red-300 mt-1">
                                                💡 {error.correction}
                                            </p>
                                            <div className="flex gap-2 mt-2">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="h-6 text-xs border-red-500/50 text-red-300 hover:bg-red-950/50"
                                                >
                                                    Voir correction 3D
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="h-6 text-xs border-green-500/50 text-green-300 hover:bg-green-950/50"
                                                >
                                                    Appliquer
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="text-xs text-red-400 bg-red-950/30 p-2 rounded flex items-start gap-2">
                        <Lightbulb className="h-4 w-4 flex-shrink-0 mt-0.5" />
                        <span>
                            L'IA analyse votre dessin en temps réel et propose des corrections sous forme
                            de sculptures transparentes que vous pouvez pivoter dans l'espace 3D.
                        </span>
                    </div>
                </div>
            )}
        </Card>
    );
};

export default ErrorDetection;
