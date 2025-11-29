import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Vibrate, Hand, Zap } from "lucide-react";
import { useState } from "react";

interface HapticGuidanceProps {
    enabled: boolean;
    onEnabledChange: (enabled: boolean) => void;
}

/**
 * Correction tactile : l'IA déplace ta main
 * Option (désactivable) très futuriste:
 * - Légère vibration haptique
 * - Micro-guidage directionnel
 * - Retour kinesthésique pour te "montrer" le bon angle
 * Comme si un maître posait sa main sur la tienne
 */
const HapticGuidance = ({ enabled, onEnabledChange }: HapticGuidanceProps) => {
    const [vibrationIntensity, setVibrationIntensity] = useState(50);
    const [directionalGuidance, setDirectionalGuidance] = useState(true);
    const [kinestheticFeedback, setKinestheticFeedback] = useState(true);
    const [guidanceStrength, setGuidanceStrength] = useState(60);
    const [hapticPattern, setHapticPattern] = useState<"continuous" | "pulse" | "adaptive">("adaptive");

    return (
        <Card className="p-4 border-2 border-teal-500/50 bg-gradient-to-br from-teal-950/20 to-cyan-950/20">
            <div className="mb-4 flex items-center gap-2">
                <Vibrate className="h-5 w-5 text-teal-400" />
                <h3 className="text-lg font-semibold text-teal-100">Guidage Haptique</h3>
                <Switch
                    checked={enabled}
                    onCheckedChange={onEnabledChange}
                    className="ml-auto"
                />
            </div>

            {enabled && (
                <div className="space-y-4">
                    <div className="rounded-lg bg-teal-950/40 p-3 border border-teal-500/30">
                        <p className="text-xs text-teal-300 leading-relaxed">
                            ⚠️ Nécessite un contrôleur VR avec retour haptique avancé
                            (ex: Valve Index, Quest Pro, PSVR2)
                        </p>
                    </div>

                    <div>
                        <Label className="text-teal-200">Intensité des vibrations</Label>
                        <Slider
                            value={[vibrationIntensity]}
                            onValueChange={(v) => setVibrationIntensity(v[0])}
                            min={0}
                            max={100}
                            step={5}
                            className="mt-2"
                        />
                        <span className="text-sm text-teal-300">{vibrationIntensity}%</span>
                    </div>

                    <div>
                        <Label className="text-teal-200">Force du guidage</Label>
                        <Slider
                            value={[guidanceStrength]}
                            onValueChange={(v) => setGuidanceStrength(v[0])}
                            min={0}
                            max={100}
                            step={5}
                            className="mt-2"
                        />
                        <span className="text-sm text-teal-300">{guidanceStrength}%</span>
                        <p className="text-xs text-teal-400 mt-1">
                            Plus élevé = guidage plus prononcé
                        </p>
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Zap className="h-4 w-4 text-teal-400" />
                                <Label className="text-sm text-teal-300">Micro-guidage directionnel</Label>
                            </div>
                            <Switch
                                checked={directionalGuidance}
                                onCheckedChange={setDirectionalGuidance}
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Hand className="h-4 w-4 text-teal-400" />
                                <Label className="text-sm text-teal-300">Retour kinesthésique</Label>
                            </div>
                            <Switch
                                checked={kinestheticFeedback}
                                onCheckedChange={setKinestheticFeedback}
                            />
                        </div>
                    </div>

                    <div>
                        <Label className="text-teal-200">Pattern haptique</Label>
                        <div className="grid grid-cols-3 gap-2 mt-2">
                            <button
                                onClick={() => setHapticPattern("continuous")}
                                className={`p-2 rounded text-xs border ${hapticPattern === "continuous"
                                        ? "bg-teal-600 border-teal-400 text-white"
                                        : "bg-teal-950/30 border-teal-500/30 text-teal-300"
                                    }`}
                            >
                                Continu
                            </button>
                            <button
                                onClick={() => setHapticPattern("pulse")}
                                className={`p-2 rounded text-xs border ${hapticPattern === "pulse"
                                        ? "bg-teal-600 border-teal-400 text-white"
                                        : "bg-teal-950/30 border-teal-500/30 text-teal-300"
                                    }`}
                            >
                                Pulsé
                            </button>
                            <button
                                onClick={() => setHapticPattern("adaptive")}
                                className={`p-2 rounded text-xs border ${hapticPattern === "adaptive"
                                        ? "bg-teal-600 border-teal-400 text-white"
                                        : "bg-teal-950/30 border-teal-500/30 text-teal-300"
                                    }`}
                            >
                                Adaptatif
                            </button>
                        </div>
                    </div>

                    <div className="rounded-lg bg-teal-950/40 p-3 border border-teal-500/30">
                        <h4 className="text-sm font-semibold text-teal-100 mb-2">
                            Guidage actif
                        </h4>
                        <div className="space-y-1 text-xs text-teal-300">
                            <p>✓ Vibration: {vibrationIntensity > 0 ? "Active" : "Désactivée"}</p>
                            <p>✓ Direction: {directionalGuidance ? "Active" : "Désactivée"}</p>
                            <p>✓ Kinesthésie: {kinestheticFeedback ? "Active" : "Désactivée"}</p>
                            <p>✓ Pattern: {hapticPattern === "continuous" ? "Continu" : hapticPattern === "pulse" ? "Pulsé" : "Adaptatif"}</p>
                        </div>
                    </div>

                    <div className="text-xs text-teal-400 bg-teal-950/30 p-2 rounded">
                        ✋ Comme si un maître posait sa main sur la vôtre pour vous montrer le bon geste.
                        Le retour haptique vous guide physiquement vers la perfection.
                    </div>
                </div>
            )}
        </Card>
    );
};

export default HapticGuidance;
