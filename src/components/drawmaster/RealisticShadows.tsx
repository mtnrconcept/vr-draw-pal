import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sun, Moon, Zap, Palette } from "lucide-react";
import { useState } from "react";

interface RealisticShadowsProps {
    enabled: boolean;
    onEnabledChange: (enabled: boolean) => void;
}

/**
 * Projection d'ombres réalistes en temps réel
 * Tu choisis une lumière → l'IA calcule:
 * - Ombres volumétriques
 * - Réflexions
 * - Rebonds lumineux
 * - Shader stylisé (BD, manga, Pixar, aquarelle...)
 */
const RealisticShadows = ({ enabled, onEnabledChange }: RealisticShadowsProps) => {
    const [lightType, setLightType] = useState<"sun" | "spot" | "ambient" | "point">("sun");
    const [lightAngle, setLightAngle] = useState(45);
    const [lightIntensity, setLightIntensity] = useState(80);
    const [shadowQuality, setShadowQuality] = useState(70);
    const [showReflections, setShowReflections] = useState(true);
    const [showBounceLight, setShowBounceLight] = useState(true);
    const [shaderStyle, setShaderStyle] = useState<"realistic" | "comic" | "manga" | "pixar" | "watercolor">("realistic");

    return (
        <Card className="p-4 border-2 border-amber-500/50 bg-gradient-to-br from-amber-950/20 to-yellow-950/20">
            <div className="mb-4 flex items-center gap-2">
                <Sun className="h-5 w-5 text-amber-400" />
                <h3 className="text-lg font-semibold text-amber-100">Ombres Réalistes</h3>
                <Switch
                    checked={enabled}
                    onCheckedChange={onEnabledChange}
                    className="ml-auto"
                />
            </div>

            {enabled && (
                <div className="space-y-4">
                    <div>
                        <Label className="text-amber-200">Type de lumière</Label>
                        <Select value={lightType} onValueChange={(v: any) => setLightType(v)}>
                            <SelectTrigger className="mt-2 bg-amber-950/30">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="sun">
                                    <div className="flex items-center gap-2">
                                        <Sun className="h-4 w-4" />
                                        Lumière solaire directionnelle
                                    </div>
                                </SelectItem>
                                <SelectItem value="spot">
                                    <div className="flex items-center gap-2">
                                        <Zap className="h-4 w-4" />
                                        Spot concentré
                                    </div>
                                </SelectItem>
                                <SelectItem value="ambient">
                                    <div className="flex items-center gap-2">
                                        <Moon className="h-4 w-4" />
                                        Lumière ambiante
                                    </div>
                                </SelectItem>
                                <SelectItem value="point">
                                    <div className="flex items-center gap-2">
                                        <Zap className="h-4 w-4" />
                                        Point lumineux
                                    </div>
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <Label className="text-amber-200">Angle de lumière</Label>
                        <Slider
                            value={[lightAngle]}
                            onValueChange={(v) => setLightAngle(v[0])}
                            min={0}
                            max={360}
                            step={5}
                            className="mt-2"
                        />
                        <span className="text-sm text-amber-300">{lightAngle}°</span>
                    </div>

                    <div>
                        <Label className="text-amber-200">Intensité lumineuse</Label>
                        <Slider
                            value={[lightIntensity]}
                            onValueChange={(v) => setLightIntensity(v[0])}
                            min={0}
                            max={100}
                            step={5}
                            className="mt-2"
                        />
                        <span className="text-sm text-amber-300">{lightIntensity}%</span>
                    </div>

                    <div>
                        <Label className="text-amber-200">Qualité des ombres</Label>
                        <Slider
                            value={[shadowQuality]}
                            onValueChange={(v) => setShadowQuality(v[0])}
                            min={0}
                            max={100}
                            step={10}
                            className="mt-2"
                        />
                        <span className="text-sm text-amber-300">
                            {shadowQuality < 30 ? "Basse" : shadowQuality < 70 ? "Moyenne" : "Haute"}
                        </span>
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label className="text-sm text-amber-300">Réflexions</Label>
                            <Switch
                                checked={showReflections}
                                onCheckedChange={setShowReflections}
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <Label className="text-sm text-amber-300">Rebonds lumineux</Label>
                            <Switch
                                checked={showBounceLight}
                                onCheckedChange={setShowBounceLight}
                            />
                        </div>
                    </div>

                    <div>
                        <Label className="text-amber-200">Style de rendu (Shader)</Label>
                        <Select value={shaderStyle} onValueChange={(v: any) => setShaderStyle(v)}>
                            <SelectTrigger className="mt-2 bg-amber-950/30">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="realistic">
                                    <div className="flex items-center gap-2">
                                        <Palette className="h-4 w-4" />
                                        Réaliste
                                    </div>
                                </SelectItem>
                                <SelectItem value="comic">
                                    <div className="flex items-center gap-2">
                                        <Palette className="h-4 w-4" />
                                        Bande Dessinée
                                    </div>
                                </SelectItem>
                                <SelectItem value="manga">
                                    <div className="flex items-center gap-2">
                                        <Palette className="h-4 w-4" />
                                        Manga
                                    </div>
                                </SelectItem>
                                <SelectItem value="pixar">
                                    <div className="flex items-center gap-2">
                                        <Palette className="h-4 w-4" />
                                        Pixar / 3D Animation
                                    </div>
                                </SelectItem>
                                <SelectItem value="watercolor">
                                    <div className="flex items-center gap-2">
                                        <Palette className="h-4 w-4" />
                                        Aquarelle
                                    </div>
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="rounded-lg bg-amber-950/40 p-3 border border-amber-500/30">
                        <h4 className="text-sm font-semibold text-amber-100 mb-2">
                            Paramètres d'éclairage actifs
                        </h4>
                        <div className="space-y-1 text-xs text-amber-300">
                            <p>💡 Type: {lightType === "sun" ? "Solaire" : lightType === "spot" ? "Spot" : lightType === "ambient" ? "Ambiant" : "Point"}</p>
                            <p>📐 Angle: {lightAngle}°</p>
                            <p>⚡ Intensité: {lightIntensity}%</p>
                            <p>🎨 Style: {shaderStyle === "realistic" ? "Réaliste" : shaderStyle === "comic" ? "BD" : shaderStyle === "manga" ? "Manga" : shaderStyle === "pixar" ? "Pixar" : "Aquarelle"}</p>
                        </div>
                    </div>

                    <div className="text-xs text-amber-400 bg-amber-950/30 p-2 rounded">
                        ☀️ Dessinez avec un éclairage physiquement cohérent et des shaders stylisés
                        pour comprendre la lumière et les ombres.
                    </div>
                </div>
            )}
        </Card>
    );
};

export default RealisticShadows;
