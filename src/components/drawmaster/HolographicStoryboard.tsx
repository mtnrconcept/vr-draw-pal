import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Film, Camera, Users, Lightbulb as LightIcon, Play, Pause } from "lucide-react";
import { useState } from "react";

interface HolographicStoryboardProps {
    enabled: boolean;
    onEnabledChange: (enabled: boolean) => void;
}

/**
 * Storyboard Holographique & Scène Vivante
 * Tu places dans l'espace VR:
 * - Personnages en volumes
 * - Lumières virtuelles
 * - Caméra dynamique
 * - Décor minimaliste
 * L'IA t'aide à comprendre: composition, profondeur, storytelling visuel, rythme
 */
const HolographicStoryboard = ({ enabled, onEnabledChange }: HolographicStoryboardProps) => {
    const [showCharacters, setShowCharacters] = useState(true);
    const [showLights, setShowLights] = useState(true);
    const [showCamera, setShowCamera] = useState(true);
    const [showDecor, setShowDecor] = useState(true);
    const [cameraAngle, setCameraAngle] = useState(45);
    const [lightIntensity, setLightIntensity] = useState(70);
    const [isPlaying, setIsPlaying] = useState(false);

    const [characters] = useState([
        { id: 1, name: "Personnage 1", position: "Centre" },
        { id: 2, name: "Personnage 2", position: "Gauche" },
        { id: 3, name: "Personnage 3", position: "Droite" }
    ]);

    return (
        <Card className="p-4 border-2 border-pink-500/50 bg-gradient-to-br from-pink-950/20 to-purple-950/20">
            <div className="mb-4 flex items-center gap-2">
                <Film className="h-5 w-5 text-pink-400" />
                <h3 className="text-lg font-semibold text-pink-100">Storyboard Holographique</h3>
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
                            variant={isPlaying ? "destructive" : "default"}
                            onClick={() => setIsPlaying(!isPlaying)}
                            className="flex-1"
                        >
                            {isPlaying ? (
                                <>
                                    <Pause className="h-4 w-4 mr-2" />
                                    Pause
                                </>
                            ) : (
                                <>
                                    <Play className="h-4 w-4 mr-2" />
                                    Lecture
                                </>
                            )}
                        </Button>
                        <Button size="sm" variant="outline" className="flex-1">
                            <Camera className="h-4 w-4 mr-2" />
                            Capturer
                        </Button>
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Users className="h-4 w-4 text-pink-400" />
                                <Label className="text-sm text-pink-300">Personnages volumétriques</Label>
                            </div>
                            <Switch
                                checked={showCharacters}
                                onCheckedChange={setShowCharacters}
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <LightIcon className="h-4 w-4 text-pink-400" />
                                <Label className="text-sm text-pink-300">Lumières virtuelles</Label>
                            </div>
                            <Switch
                                checked={showLights}
                                onCheckedChange={setShowLights}
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Camera className="h-4 w-4 text-pink-400" />
                                <Label className="text-sm text-pink-300">Caméra dynamique</Label>
                            </div>
                            <Switch
                                checked={showCamera}
                                onCheckedChange={setShowCamera}
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Film className="h-4 w-4 text-pink-400" />
                                <Label className="text-sm text-pink-300">Décor minimaliste</Label>
                            </div>
                            <Switch
                                checked={showDecor}
                                onCheckedChange={setShowDecor}
                            />
                        </div>
                    </div>

                    {showCamera && (
                        <div>
                            <Label className="text-pink-200">Angle de caméra</Label>
                            <Slider
                                value={[cameraAngle]}
                                onValueChange={(v) => setCameraAngle(v[0])}
                                min={0}
                                max={360}
                                step={5}
                                className="mt-2"
                            />
                            <span className="text-sm text-pink-300">{cameraAngle}°</span>
                        </div>
                    )}

                    {showLights && (
                        <div>
                            <Label className="text-pink-200">Intensité lumineuse</Label>
                            <Slider
                                value={[lightIntensity]}
                                onValueChange={(v) => setLightIntensity(v[0])}
                                min={0}
                                max={100}
                                step={5}
                                className="mt-2"
                            />
                            <span className="text-sm text-pink-300">{lightIntensity}%</span>
                        </div>
                    )}

                    {showCharacters && (
                        <div className="rounded-lg bg-pink-950/40 p-3 border border-pink-500/30">
                            <h4 className="text-sm font-semibold text-pink-100 mb-2">
                                Personnages dans la scène
                            </h4>
                            <div className="space-y-2">
                                {characters.map((char) => (
                                    <div key={char.id} className="flex items-center justify-between text-xs">
                                        <span className="text-pink-300">{char.name}</span>
                                        <span className="text-pink-400">{char.position}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="rounded-lg bg-pink-950/40 p-3 border border-pink-500/30">
                        <h4 className="text-sm font-semibold text-pink-100 mb-2">
                            Analyse de composition
                        </h4>
                        <div className="space-y-1 text-xs text-pink-300">
                            <p>✓ Règle des tiers respectée</p>
                            <p>✓ Profondeur de champ optimale</p>
                            <p>✓ Équilibre visuel harmonieux</p>
                            <p>⚠ Rythme narratif à améliorer</p>
                        </div>
                    </div>

                    <div className="text-xs text-pink-400 bg-pink-950/30 p-2 rounded">
                        🎬 Visualisez votre planche comme un mini-film 3D volumétrique pour maîtriser
                        la composition et le storytelling visuel.
                    </div>
                </div>
            )}
        </Card>
    );
};

export default HolographicStoryboard;
