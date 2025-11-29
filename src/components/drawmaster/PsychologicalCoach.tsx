import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { Heart, Brain, Smile, Frown, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { CoachService } from "@/lib/ai/coach-service";
import { toast } from "sonner";

interface PsychologicalCoachProps {
    enabled: boolean;
    onEnabledChange: (enabled: boolean) => void;
}

/**
 * Coach psychologique intégré avec IA
 * Le dessin implique souvent: peur du trait, hésitation, autocritique, perfectionnisme
 * L'IA détecte les phases de stress via analyse comportementale
 */
const PsychologicalCoach = ({ enabled, onEnabledChange }: PsychologicalCoachProps) => {
    const [stressLevel, setStressLevel] = useState(35);
    const [confidenceLevel, setConfidenceLevel] = useState(65);
    const [detectionSensitivity, setDetectionSensitivity] = useState(70);
    const [showEncouragement, setShowEncouragement] = useState(true);
    const [showBreakReminders, setShowBreakReminders] = useState(true);
    const [currentMood, setCurrentMood] = useState<"confident" | "hesitant" | "stressed" | "relaxed">("confident");
    const [detectedPatterns, setDetectedPatterns] = useState({
        hesitations: 0,
        corrections: 0,
        pauses: 0,
        rushPhases: 0
    });
    const [currentEncouragement, setCurrentEncouragement] = useState("");
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    // Analyse psychologique périodique via IA
    useEffect(() => {
        if (!enabled) return;

        const analyzePsychology = async () => {
            setIsAnalyzing(true);
            try {
                const state = await CoachService.analyzePsychologicalState();
                setStressLevel(state.stressLevel);
                setConfidenceLevel(state.confidenceLevel);
                setCurrentMood(state.currentMood);
                setDetectedPatterns(state.detectedPatterns);
                if (showEncouragement) {
                    setCurrentEncouragement(state.encouragement);
                }
            } catch (error) {
                console.error("Psychological analysis failed:", error);
            } finally {
                setIsAnalyzing(false);
            }
        };

        analyzePsychology();
        const interval = setInterval(analyzePsychology, 20000); // Analyse toutes les 20 secondes

        return () => clearInterval(interval);
    }, [enabled, showEncouragement, detectionSensitivity]);

    const getMoodIcon = () => {
        switch (currentMood) {
            case "confident": return <Smile className="h-5 w-5 text-green-400" />;
            case "hesitant": return <AlertCircle className="h-5 w-5 text-yellow-400" />;
            case "stressed": return <Frown className="h-5 w-5 text-red-400" />;
            case "relaxed": return <Heart className="h-5 w-5 text-blue-400" />;
        }
    };

    const getMoodColor = () => {
        switch (currentMood) {
            case "confident": return "text-green-400";
            case "hesitant": return "text-yellow-400";
            case "stressed": return "text-red-400";
            case "relaxed": return "text-blue-400";
        }
    };

    return (
        <Card className="p-4 border-2 border-rose-500/50 bg-gradient-to-br from-rose-950/20 to-pink-950/20">
            <div className="mb-4 flex items-center gap-2">
                <Brain className="h-5 w-5 text-rose-400" />
                <h3 className="text-lg font-semibold text-rose-100">Coach Psychologique</h3>
                <Switch
                    checked={enabled}
                    onCheckedChange={onEnabledChange}
                    className="ml-auto"
                />
            </div>

            {enabled && (
                <div className="space-y-4">
                    <div className="rounded-lg bg-rose-950/40 p-3 border border-rose-500/30">
                        <div className="flex items-center justify-between mb-2">
                            <h4 className="text-sm font-semibold text-rose-100 flex items-center gap-2">
                                {getMoodIcon()}
                                État émotionnel
                            </h4>
                            <span className={`text-sm font-medium ${getMoodColor()}`}>
                                {currentMood === "confident" ? "Confiant" :
                                    currentMood === "hesitant" ? "Hésitant" :
                                        currentMood === "stressed" ? "Stressé" : "Détendu"}
                            </span>
                        </div>
                    </div>

                    <div>
                        <div className="flex justify-between items-center mb-1">
                            <Label className="text-rose-200">Niveau de stress</Label>
                            <span className={`text-sm font-medium ${stressLevel < 30 ? "text-green-400" :
                                    stressLevel < 60 ? "text-yellow-400" : "text-red-400"
                                }`}>
                                {stressLevel}%
                            </span>
                        </div>
                        <Progress
                            value={stressLevel}
                            className="h-2"
                        />
                    </div>

                    <div>
                        <div className="flex justify-between items-center mb-1">
                            <Label className="text-rose-200">Niveau de confiance</Label>
                            <span className={`text-sm font-medium ${confidenceLevel > 70 ? "text-green-400" :
                                    confidenceLevel > 40 ? "text-yellow-400" : "text-red-400"
                                }`}>
                                {confidenceLevel}%
                            </span>
                        </div>
                        <Progress
                            value={confidenceLevel}
                            className="h-2"
                        />
                    </div>

                    <div>
                        <Label className="text-rose-200">Sensibilité de détection</Label>
                        <Slider
                            value={[detectionSensitivity]}
                            onValueChange={(v) => setDetectionSensitivity(v[0])}
                            min={0}
                            max={100}
                            step={5}
                            className="mt-2"
                        />
                        <span className="text-sm text-rose-300">{detectionSensitivity}%</span>
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Heart className="h-4 w-4 text-rose-400" />
                                <Label className="text-sm text-rose-300">Messages d'encouragement</Label>
                            </div>
                            <Switch
                                checked={showEncouragement}
                                onCheckedChange={setShowEncouragement}
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <AlertCircle className="h-4 w-4 text-rose-400" />
                                <Label className="text-sm text-rose-300">Rappels de pause</Label>
                            </div>
                            <Switch
                                checked={showBreakReminders}
                                onCheckedChange={setShowBreakReminders}
                            />
                        </div>
                    </div>

                    {showEncouragement && (
                        <div className="rounded-lg bg-rose-950/40 p-3 border border-rose-500/30">
                            <div className="flex items-start gap-2">
                                <Heart className="h-5 w-5 text-rose-400 flex-shrink-0 mt-0.5" />
                                <p className="text-sm text-rose-200 leading-relaxed">
                                    {currentEncouragement}
                                </p>
                            </div>
                        </div>
                    )}

                    <div className="rounded-lg bg-rose-950/40 p-3 border border-rose-500/30">
                        <h4 className="text-sm font-semibold text-rose-100 mb-2">
                            Patterns détectés
                        </h4>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="bg-rose-950/60 p-2 rounded">
                                <p className="text-rose-400">Hésitations</p>
                                <p className="text-lg font-bold text-rose-200">{detectedPatterns.hesitations}</p>
                            </div>
                            <div className="bg-rose-950/60 p-2 rounded">
                                <p className="text-rose-400">Corrections</p>
                                <p className="text-lg font-bold text-rose-200">{detectedPatterns.corrections}</p>
                            </div>
                            <div className="bg-rose-950/60 p-2 rounded">
                                <p className="text-rose-400">Pauses</p>
                                <p className="text-lg font-bold text-rose-200">{detectedPatterns.pauses}</p>
                            </div>
                            <div className="bg-rose-950/60 p-2 rounded">
                                <p className="text-rose-400">Phases rapides</p>
                                <p className="text-lg font-bold text-rose-200">{detectedPatterns.rushPhases}</p>
                            </div>
                        </div>
                    </div>

                    <div className="text-xs text-rose-400 bg-rose-950/30 p-2 rounded">
                        💝 L'IA détecte votre état émotionnel et vous accompagne avec bienveillance.
                        Le dessin est un voyage, pas une destination.
                    </div>
                </div>
            )}
        </Card>
    );
};

export default PsychologicalCoach;
