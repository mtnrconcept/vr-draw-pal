import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Hand, Sparkles, Play, Pause, RotateCcw } from "lucide-react";
import { useState } from "react";

interface AirDrawingModeProps {
    enabled: boolean;
    onEnabledChange: (enabled: boolean) => void;
}

/**
 * Mode "Dessine dans l'air" à la manière des sculpteurs
 * Tu fais des gestes dans le vide:
 * - L'IA reconstruit un volume en fils 3D lumineux, comme du métal chauffé
 * - Tu aplatis ensuite ce volume en une projection 2D pour dessiner
 * Outil parfait pour comprendre la perspective par le mouvement
 */
const AirDrawingMode = ({ enabled, onEnabledChange }: AirDrawingModeProps) => {
    const [isRecording, setIsRecording] = useState(false);
    const [wireframeStyle, setWireframeStyle] = useState<"glowing" | "metal" | "neon">("glowing");
    const [showProjection, setShowProjection] = useState(false);
    const [capturedGestures, setCapturedGestures] = useState(0);

    const startRecording = () => {
        setIsRecording(true);
        // Simulate gesture capture
        const interval = setInterval(() => {
            setCapturedGestures(prev => prev + 1);
        }, 500);

        setTimeout(() => {
            clearInterval(interval);
            setIsRecording(false);
        }, 5000);
    };

    const resetGestures = () => {
        setCapturedGestures(0);
        setShowProjection(false);
    };

    return (
        <Card className="p-4 border-2 border-blue-500/50 bg-gradient-to-br from-blue-950/20 to-cyan-950/20">
            <div className="mb-4 flex items-center gap-2">
                <Hand className="h-5 w-5 text-blue-400" />
                <h3 className="text-lg font-semibold text-blue-100">Dessin dans l'Air</h3>
                <Switch
                    checked={enabled}
                    onCheckedChange={onEnabledChange}
                    className="ml-auto"
                />
            </div>

            {enabled && (
                <div className="space-y-4">
                    <div className="flex gap-2">
                        <Button
                            size="sm"
                            variant={isRecording ? "destructive" : "default"}
                            onClick={isRecording ? () => setIsRecording(false) : startRecording}
                            className="flex-1"
                            disabled={isRecording}
                        >
                            {isRecording ? (
                                <>
                                    <Pause className="h-4 w-4 mr-2" />
                                    Enregistrement...
                                </>
                            ) : (
                                <>
                                    <Play className="h-4 w-4 mr-2" />
                                    Capturer gestes
                                </>
                            )}
                        </Button>
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={resetGestures}
                            disabled={capturedGestures === 0}
                        >
                            <RotateCcw className="h-4 w-4" />
                        </Button>
                    </div>

                    <div className="rounded-lg bg-blue-950/40 p-3 border border-blue-500/30">
                        <div className="flex items-center justify-between mb-2">
                            <h4 className="text-sm font-semibold text-blue-100">
                                Gestes capturés
                            </h4>
                            <span className="text-lg font-bold text-blue-400">
                                {capturedGestures}
                            </span>
                        </div>
                        {isRecording && (
                            <div className="flex items-center gap-2 text-xs text-blue-300">
                                <Sparkles className="h-4 w-4 animate-pulse" />
                                <span>Tracez des formes dans l'air...</span>
                            </div>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label className="text-blue-200">Style de fil 3D</Label>
                        <div className="grid grid-cols-3 gap-2">
                            <Button
                                size="sm"
                                variant={wireframeStyle === "glowing" ? "default" : "outline"}
                                onClick={() => setWireframeStyle("glowing")}
                                className="text-xs"
                            >
                                ✨ Lumineux
                            </Button>
                            <Button
                                size="sm"
                                variant={wireframeStyle === "metal" ? "default" : "outline"}
                                onClick={() => setWireframeStyle("metal")}
                                className="text-xs"
                            >
                                🔥 Métal chauffé
                            </Button>
                            <Button
                                size="sm"
                                variant={wireframeStyle === "neon" ? "default" : "outline"}
                                onClick={() => setWireframeStyle("neon")}
                                className="text-xs"
                            >
                                💫 Néon
                            </Button>
                        </div>
                    </div>

                    <div className="flex items-center justify-between">
                        <Label className="text-sm text-blue-300">Projection 2D</Label>
                        <Switch
                            checked={showProjection}
                            onCheckedChange={setShowProjection}
                            disabled={capturedGestures === 0}
                        />
                    </div>

                    {showProjection && capturedGestures > 0 && (
                        <div className="rounded-lg bg-blue-950/40 p-3 border border-blue-500/30">
                            <h4 className="text-sm font-semibold text-blue-100 mb-2">
                                Projection 2D générée
                            </h4>
                            <div className="aspect-video bg-blue-950/60 rounded border border-blue-500/20 flex items-center justify-center">
                                <div className="text-center text-xs text-blue-400">
                                    <Sparkles className="h-8 w-8 mx-auto mb-2 text-blue-300" />
                                    <p>Volume 3D aplati en dessin 2D</p>
                                </div>
                            </div>
                            <Button size="sm" className="w-full mt-2" variant="outline">
                                Appliquer au canvas
                            </Button>
                        </div>
                    )}

                    <div className="text-xs text-blue-400 bg-blue-950/30 p-2 rounded">
                        ✋ Dessinez dans l'air pour créer des volumes 3D lumineux, puis aplatissez-les
                        en projection 2D. Parfait pour comprendre la perspective par le mouvement.
                    </div>
                </div>
            )}
        </Card>
    );
};

export default AirDrawingMode;
