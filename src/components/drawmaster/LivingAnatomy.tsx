import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bone, Eye, Layers, Activity } from "lucide-react";
import { useState } from "react";

interface LivingAnatomyProps {
    enabled: boolean;
    onEnabledChange: (enabled: boolean) => void;
}

/**
 * Mode Anatomie Vivante
 * Tu dessines un personnage → l'IA peut:
 * - Afficher un squelette 3D articulé
 * - Révéler la musculature en couches volumiques
 * - Synchroniser le tout avec la pose que tu dessines
 * Le modèle devient translucide, comme un IRM artistique
 */
const LivingAnatomy = ({ enabled, onEnabledChange }: LivingAnatomyProps) => {
    const [anatomyLayer, setAnatomyLayer] = useState<"skeleton" | "muscles" | "both" | "surface">("skeleton");
    const [layerOpacity, setLayerOpacity] = useState(60);
    const [showJoints, setShowJoints] = useState(true);
    const [showMuscleGroups, setShowMuscleGroups] = useState(true);
    const [syncWithPose, setSyncWithPose] = useState(true);
    const [xrayMode, setXrayMode] = useState(false);

    return (
        <Card className="p-4 border-2 border-emerald-500/50 bg-gradient-to-br from-emerald-950/20 to-teal-950/20">
            <div className="mb-4 flex items-center gap-2">
                <Bone className="h-5 w-5 text-emerald-400" />
                <h3 className="text-lg font-semibold text-emerald-100">Anatomie Vivante</h3>
                <Switch
                    checked={enabled}
                    onCheckedChange={onEnabledChange}
                    className="ml-auto"
                />
            </div>

            {enabled && (
                <div className="space-y-4">
                    <div>
                        <Label className="text-emerald-200">Couche anatomique</Label>
                        <Select value={anatomyLayer} onValueChange={(v: any) => setAnatomyLayer(v)}>
                            <SelectTrigger className="mt-2 bg-emerald-950/30">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="skeleton">
                                    <div className="flex items-center gap-2">
                                        <Bone className="h-4 w-4" />
                                        Squelette uniquement
                                    </div>
                                </SelectItem>
                                <SelectItem value="muscles">
                                    <div className="flex items-center gap-2">
                                        <Activity className="h-4 w-4" />
                                        Musculature uniquement
                                    </div>
                                </SelectItem>
                                <SelectItem value="both">
                                    <div className="flex items-center gap-2">
                                        <Layers className="h-4 w-4" />
                                        Squelette + Muscles
                                    </div>
                                </SelectItem>
                                <SelectItem value="surface">
                                    <div className="flex items-center gap-2">
                                        <Eye className="h-4 w-4" />
                                        Surface + Anatomie
                                    </div>
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <Label className="text-emerald-200">Opacité des couches</Label>
                        <Slider
                            value={[layerOpacity]}
                            onValueChange={(v) => setLayerOpacity(v[0])}
                            min={10}
                            max={100}
                            step={5}
                            className="mt-2"
                        />
                        <span className="text-sm text-emerald-300">{layerOpacity}%</span>
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label className="text-sm text-emerald-300">Afficher les articulations</Label>
                            <Switch
                                checked={showJoints}
                                onCheckedChange={setShowJoints}
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <Label className="text-sm text-emerald-300">Groupes musculaires</Label>
                            <Switch
                                checked={showMuscleGroups}
                                onCheckedChange={setShowMuscleGroups}
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <Label className="text-sm text-emerald-300">Synchroniser avec la pose</Label>
                            <Switch
                                checked={syncWithPose}
                                onCheckedChange={setSyncWithPose}
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <Label className="text-sm text-emerald-300">Mode IRM (X-Ray)</Label>
                            <Switch
                                checked={xrayMode}
                                onCheckedChange={setXrayMode}
                            />
                        </div>
                    </div>

                    <div className="rounded-lg bg-emerald-950/40 p-3 border border-emerald-500/30">
                        <h4 className="text-sm font-semibold text-emerald-100 mb-2">
                            Groupes musculaires actifs
                        </h4>
                        <div className="grid grid-cols-2 gap-2 text-xs text-emerald-300">
                            <div className="flex items-center gap-1">
                                <div className="h-2 w-2 rounded-full bg-red-500"></div>
                                <span>Deltoïdes</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <div className="h-2 w-2 rounded-full bg-orange-500"></div>
                                <span>Pectoraux</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <div className="h-2 w-2 rounded-full bg-yellow-500"></div>
                                <span>Trapèzes</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <div className="h-2 w-2 rounded-full bg-green-500"></div>
                                <span>Biceps</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                                <span>Quadriceps</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <div className="h-2 w-2 rounded-full bg-purple-500"></div>
                                <span>Abdominaux</span>
                            </div>
                        </div>
                    </div>

                    <div className="text-xs text-emerald-400 bg-emerald-950/30 p-2 rounded">
                        🦴 Le modèle anatomique s'adapte en temps réel à votre dessin, comme un IRM artistique translucide.
                    </div>
                </div>
            )}
        </Card>
    );
};

export default LivingAnatomy;
