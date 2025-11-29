import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Fingerprint, TrendingUp, Target, Zap } from "lucide-react";
import { useState } from "react";
import { CoachService, StyleProfile } from "@/lib/ai/coach-service";
import { toast } from "sonner";

interface StyleCalibrationProps {
    enabled: boolean;
    onCalibrationComplete?: (styleProfile: StyleProfile) => void;
}

/**
 * Calibration automatique du style personnel via IA
 * Analyse le geste, la vitesse, la pression, le style
 * Affiche une "signature visuelle" 3D du style
 * Propose des exercices calibrés pour combler les lacunes
 */
const StyleCalibration = ({ enabled, onCalibrationComplete }: StyleCalibrationProps) => {
    const [isCalibrating, setIsCalibrating] = useState(false);
    const [calibrationProgress, setCalibrationProgress] = useState(0);
    const [styleProfile, setStyleProfile] = useState<StyleProfile | null>(null);

    const startCalibration = async () => {
        setIsCalibrating(true);
        setCalibrationProgress(0);

        // Animation de progression
        const progressInterval = setInterval(() => {
            setCalibrationProgress(prev => Math.min(prev + 5, 95));
        }, 200);

        try {
            // Analyse réelle via IA
            const profile = await CoachService.analyzeStyle();
            
            clearInterval(progressInterval);
            setCalibrationProgress(100);
            setStyleProfile(profile);
            onCalibrationComplete?.(profile);
            toast.success("Calibration de style terminée !");
        } catch (error) {
            clearInterval(progressInterval);
            console.error("Style calibration failed:", error);
            toast.error("Échec de la calibration");
        } finally {
            setIsCalibrating(false);
        }
    };

    if (!enabled) return null;

    return (
        <Card className="p-4 border-2 border-cyan-500/50 bg-gradient-to-br from-cyan-950/20 to-teal-950/20">
            <div className="mb-4 flex items-center gap-2">
                <Fingerprint className="h-5 w-5 text-cyan-400" />
                <h3 className="text-lg font-semibold text-cyan-100">Calibration de Style</h3>
            </div>

            {!styleProfile && !isCalibrating && (
                <div className="space-y-4">
                    <p className="text-sm text-cyan-200">
                        L'IA va analyser votre gestuelle, vitesse, pression et style pour créer
                        votre signature artistique unique en 3D.
                    </p>
                    <Button
                        onClick={startCalibration}
                        className="w-full bg-cyan-600 hover:bg-cyan-700"
                    >
                        <Target className="h-4 w-4 mr-2" />
                        Démarrer la calibration
                    </Button>
                </div>
            )}

            {isCalibrating && (
                <div className="space-y-4">
                    <div>
                        <Label className="text-cyan-200">Analyse en cours...</Label>
                        <Progress value={calibrationProgress} className="mt-2" />
                        <p className="text-xs text-cyan-300 mt-1">{calibrationProgress}%</p>
                    </div>
                    <div className="text-xs text-cyan-400 space-y-1">
                        <p>✓ Analyse de la vitesse gestuelle</p>
                        <p>✓ Détection de la pression</p>
                        <p>✓ Identification du style de trait</p>
                        <p>✓ Cartographie des forces/faiblesses</p>
                    </div>
                </div>
            )}

            {styleProfile && (
                <div className="space-y-4">
                    <div className="rounded-lg bg-cyan-950/40 p-3 border border-cyan-500/30">
                        <h4 className="text-sm font-semibold text-cyan-100 mb-2 flex items-center gap-2">
                            <Zap className="h-4 w-4" />
                            Signature Visuelle 3D
                        </h4>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                                <Label className="text-cyan-300">Vitesse</Label>
                                <Progress value={styleProfile.signature3D.speed} className="h-2 mt-1" />
                                <span className="text-cyan-400">{styleProfile.signature3D.speed}%</span>
                            </div>
                            <div>
                                <Label className="text-cyan-300">Précision</Label>
                                <Progress value={styleProfile.signature3D.precision} className="h-2 mt-1" />
                                <span className="text-cyan-400">{styleProfile.signature3D.precision}%</span>
                            </div>
                            <div>
                                <Label className="text-cyan-300">Consistance</Label>
                                <Progress value={styleProfile.signature3D.consistency} className="h-2 mt-1" />
                                <span className="text-cyan-400">{styleProfile.signature3D.consistency}%</span>
                            </div>
                            <div>
                                <Label className="text-cyan-300">Créativité</Label>
                                <Progress value={styleProfile.signature3D.creativity} className="h-2 mt-1" />
                                <span className="text-cyan-400">{styleProfile.signature3D.creativity}%</span>
                            </div>
                        </div>
                    </div>

                    <div>
                        <h4 className="text-sm font-semibold text-cyan-100 mb-2 flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-green-400" />
                            Forces identifiées
                        </h4>
                        <ul className="text-xs text-cyan-300 space-y-1">
                            {styleProfile.strengths.map((strength, i) => (
                                <li key={i}>✓ {strength}</li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-sm font-semibold text-cyan-100 mb-2 flex items-center gap-2">
                            <Target className="h-4 w-4 text-orange-400" />
                            Axes d'amélioration
                        </h4>
                        <ul className="text-xs text-cyan-300 space-y-1">
                            {styleProfile.weaknesses.map((weakness, i) => (
                                <li key={i}>→ {weakness}</li>
                            ))}
                        </ul>
                    </div>

                    <Button
                        onClick={startCalibration}
                        variant="outline"
                        className="w-full border-cyan-500/50 text-cyan-300 hover:bg-cyan-950/50"
                    >
                        Recalibrer
                    </Button>
                </div>
            )}
        </Card>
    );
};

export default StyleCalibration;
