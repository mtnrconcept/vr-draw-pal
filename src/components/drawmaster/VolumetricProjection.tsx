import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Box, Grid3x3, Lightbulb, Sparkles } from "lucide-react";
import { useState } from "react";

interface VolumetricProjectionProps {
    enabled: boolean;
    onEnabledChange: (enabled: boolean) => void;
}

/**
 * Projection volumétrique de lignes guides
 * Déploie des arches 3D, trajectoires flottantes, cônes de perspective, grilles déformées
 * Guides réactifs qui se tordent ou se resserrent selon le trait
 */
const VolumetricProjection = ({ enabled, onEnabledChange }: VolumetricProjectionProps) => {
    const [guideType, setGuideType] = useState<"arches" | "trajectories" | "perspective" | "grid">("arches");
    const [reactivity, setReactivity] = useState(50);
    const [showForceFlow, setShowForceFlow] = useState(true);
    const [showDynamicBalance, setShowDynamicBalance] = useState(true);
    const [gridDensity, setGridDensity] = useState(8);
    const [perspectiveCones, setPerspectiveCones] = useState(3);

    return (
        <Card className="p-4 border-2 border-purple-500/50 bg-gradient-to-br from-purple-950/20 to-blue-950/20">
            <div className="mb-4 flex items-center gap-2">
                <Box className="h-5 w-5 text-purple-400" />
                <h3 className="text-lg font-semibold text-purple-100">Projection Volumétrique</h3>
                <Switch
                    checked={enabled}
                    onCheckedChange={onEnabledChange}
                    className="ml-auto"
                />
            </div>

            {enabled && (
                <div className="space-y-4">
                    <div>
                        <Label className="text-purple-200">Type de guide 3D</Label>
                        <Select value={guideType} onValueChange={(v: any) => setGuideType(v)}>
                            <SelectTrigger className="mt-2 bg-purple-950/30">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="arches">Arches 3D flottantes</SelectItem>
                                <SelectItem value="trajectories">Trajectoires dynamiques</SelectItem>
                                <SelectItem value="perspective">Cônes de perspective</SelectItem>
                                <SelectItem value="grid">Grilles déformées</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {guideType === "grid" && (
                        <div>
                            <Label className="text-purple-200">Densité de la grille</Label>
                            <Slider
                                value={[gridDensity]}
                                onValueChange={(v) => setGridDensity(v[0])}
                                min={4}
                                max={16}
                                step={1}
                                className="mt-2"
                            />
                            <span className="text-sm text-purple-300">{gridDensity}x{gridDensity}</span>
                        </div>
                    )}

                    {guideType === "perspective" && (
                        <div>
                            <Label className="text-purple-200">Nombre de cônes</Label>
                            <Slider
                                value={[perspectiveCones]}
                                onValueChange={(v) => setPerspectiveCones(v[0])}
                                min={1}
                                max={5}
                                step={1}
                                className="mt-2"
                            />
                            <span className="text-sm text-purple-300">{perspectiveCones} cônes</span>
                        </div>
                    )}

                    <div>
                        <Label className="text-purple-200">Réactivité des guides</Label>
                        <Slider
                            value={[reactivity]}
                            onValueChange={(v) => setReactivity(v[0])}
                            min={0}
                            max={100}
                            step={5}
                            className="mt-2"
                        />
                        <span className="text-sm text-purple-300">{reactivity}%</span>
                        <p className="text-xs text-purple-400 mt-1">
                            Les guides se tordent et se resserrent selon votre trait
                        </p>
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-purple-400" />
                            <Label className="text-purple-200">Flux de force</Label>
                        </div>
                        <Switch
                            checked={showForceFlow}
                            onCheckedChange={setShowForceFlow}
                        />
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Grid3x3 className="h-4 w-4 text-purple-400" />
                            <Label className="text-purple-200">Équilibre dynamique des masses</Label>
                        </div>
                        <Switch
                            checked={showDynamicBalance}
                            onCheckedChange={setShowDynamicBalance}
                        />
                    </div>

                    <div className="rounded-lg bg-purple-950/40 p-3 border border-purple-500/30">
                        <p className="text-xs text-purple-300 leading-relaxed">
                            <Lightbulb className="h-3 w-3 inline mr-1" />
                            Visualisez littéralement l'énergie interne du dessin grâce aux guides volumétriques
                            qui s'adaptent en temps réel à votre gestuelle.
                        </p>
                    </div>
                </div>
            )}
        </Card>
    );
};

export default VolumetricProjection;
