import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Palette, Sparkles, Brush, Wand2 } from "lucide-react";
import { useState } from "react";
import { Progress } from "@/components/ui/progress";

interface StyleImitationProps {
    enabled: boolean;
    onEnabledChange: (enabled: boolean) => void;
}

/**
 * Mode "Imitation Stylisée"
 * Tu choisis un artiste/style et l'IA crée un moteur d'analyse stylistique:
 * - Quelles formes privilégier
 * - Quelle gestuelle adopter
 * - Quelles erreurs éviter
 * - Quelle dynamique utiliser
 */
const StyleImitation = ({ enabled, onEnabledChange }: StyleImitationProps) => {
    const [selectedStyle, setSelectedStyle] = useState<string>("pixar");
    const [showFormGuides, setShowFormGuides] = useState(true);
    const [showGestureGuides, setShowGestureGuides] = useState(true);
    const [showErrorPrevention, setShowErrorPrevention] = useState(true);
    const [showDynamicGuides, setShowDynamicGuides] = useState(true);

    const styles = [
        { id: "pixar", name: "Pixar / Disney 3D", icon: "🎬" },
        { id: "zootopia", name: "Zootopia", icon: "🦊" },
        { id: "arcane", name: "Arcane (League of Legends)", icon: "⚡" },
        { id: "michelangelo", name: "Michel-Ange", icon: "🎨" },
        { id: "ghibli", name: "Studio Ghibli", icon: "🌸" },
        { id: "comic", name: "Bande Dessinée Franco-Belge", icon: "📚" },
        { id: "manga", name: "Manga Shōnen", icon: "⚔️" },
        { id: "concept", name: "Concept Art AAA", icon: "🎮" }
    ];

    const styleGuides = {
        pixar: {
            forms: ["Formes rondes et douces", "Proportions exagérées", "Silhouettes claires"],
            gestures: ["Traits fluides et courbes", "Éviter les angles durs", "Squash & Stretch"],
            errors: ["Trop de détails", "Proportions réalistes", "Textures complexes"],
            dynamics: ["Mouvement exagéré", "Expressions faciales amplifiées", "Poses dynamiques"]
        },
        ghibli: {
            forms: ["Lignes organiques", "Détails naturels", "Proportions réalistes"],
            gestures: ["Traits délicats", "Aquarelle suggérée", "Fluidité naturelle"],
            errors: ["Lignes trop rigides", "Couleurs saturées", "Perspective forcée"],
            dynamics: ["Mouvement contemplatif", "Harmonie avec l'environnement", "Subtilité émotionnelle"]
        },
        arcane: {
            forms: ["Géométrie stylisée", "Contraste fort", "Détails texturés"],
            gestures: ["Traits énergiques", "Hachures dynamiques", "Ombres marquées"],
            errors: ["Manque de contraste", "Trop lisse", "Symétrie excessive"],
            dynamics: ["Énergie explosive", "Tension visuelle", "Composition asymétrique"]
        }
    };

    const currentGuide = styleGuides[selectedStyle as keyof typeof styleGuides] || styleGuides.pixar;

    return (
        <Card className="p-4 border-2 border-fuchsia-500/50 bg-gradient-to-br from-fuchsia-950/20 to-pink-950/20">
            <div className="mb-4 flex items-center gap-2">
                <Palette className="h-5 w-5 text-fuchsia-400" />
                <h3 className="text-lg font-semibold text-fuchsia-100">Imitation Stylisée</h3>
                <Switch
                    checked={enabled}
                    onCheckedChange={onEnabledChange}
                    className="ml-auto"
                />
            </div>

            {enabled && (
                <div className="space-y-4">
                    <div>
                        <Label className="text-fuchsia-200">Style artistique</Label>
                        <Select value={selectedStyle} onValueChange={setSelectedStyle}>
                            <SelectTrigger className="mt-2 bg-fuchsia-950/30">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="max-h-[300px]">
                                {styles.map((style) => (
                                    <SelectItem key={style.id} value={style.id}>
                                        <div className="flex items-center gap-2">
                                            <span className="text-lg">{style.icon}</span>
                                            <span>{style.name}</span>
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Sparkles className="h-4 w-4 text-fuchsia-400" />
                                <Label className="text-sm text-fuchsia-300">Guides de formes</Label>
                            </div>
                            <Switch
                                checked={showFormGuides}
                                onCheckedChange={setShowFormGuides}
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Brush className="h-4 w-4 text-fuchsia-400" />
                                <Label className="text-sm text-fuchsia-300">Guides de gestuelle</Label>
                            </div>
                            <Switch
                                checked={showGestureGuides}
                                onCheckedChange={setShowGestureGuides}
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Wand2 className="h-4 w-4 text-fuchsia-400" />
                                <Label className="text-sm text-fuchsia-300">Prévention d'erreurs</Label>
                            </div>
                            <Switch
                                checked={showErrorPrevention}
                                onCheckedChange={setShowErrorPrevention}
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Sparkles className="h-4 w-4 text-fuchsia-400" />
                                <Label className="text-sm text-fuchsia-300">Guides dynamiques</Label>
                            </div>
                            <Switch
                                checked={showDynamicGuides}
                                onCheckedChange={setShowDynamicGuides}
                            />
                        </div>
                    </div>

                    {showFormGuides && (
                        <div className="rounded-lg bg-fuchsia-950/40 p-3 border border-fuchsia-500/30">
                            <h4 className="text-sm font-semibold text-fuchsia-100 mb-2 flex items-center gap-2">
                                <Sparkles className="h-4 w-4" />
                                Formes à privilégier
                            </h4>
                            <ul className="space-y-1 text-xs text-fuchsia-300">
                                {currentGuide.forms.map((form, i) => (
                                    <li key={i}>✓ {form}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {showGestureGuides && (
                        <div className="rounded-lg bg-fuchsia-950/40 p-3 border border-fuchsia-500/30">
                            <h4 className="text-sm font-semibold text-fuchsia-100 mb-2 flex items-center gap-2">
                                <Brush className="h-4 w-4" />
                                Gestuelle recommandée
                            </h4>
                            <ul className="space-y-1 text-xs text-fuchsia-300">
                                {currentGuide.gestures.map((gesture, i) => (
                                    <li key={i}>→ {gesture}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {showErrorPrevention && (
                        <div className="rounded-lg bg-fuchsia-950/40 p-3 border border-red-500/30">
                            <h4 className="text-sm font-semibold text-red-100 mb-2 flex items-center gap-2">
                                <Wand2 className="h-4 w-4" />
                                Erreurs à éviter
                            </h4>
                            <ul className="space-y-1 text-xs text-red-300">
                                {currentGuide.errors.map((error, i) => (
                                    <li key={i}>✗ {error}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {showDynamicGuides && (
                        <div className="rounded-lg bg-fuchsia-950/40 p-3 border border-fuchsia-500/30">
                            <h4 className="text-sm font-semibold text-fuchsia-100 mb-2 flex items-center gap-2">
                                <Sparkles className="h-4 w-4" />
                                Dynamique du style
                            </h4>
                            <ul className="space-y-1 text-xs text-fuchsia-300">
                                {currentGuide.dynamics.map((dynamic, i) => (
                                    <li key={i}>⚡ {dynamic}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    <div className="rounded-lg bg-fuchsia-950/40 p-3 border border-fuchsia-500/30">
                        <h4 className="text-sm font-semibold text-fuchsia-100 mb-2">
                            Conformité au style
                        </h4>
                        <div className="space-y-2">
                            <div>
                                <div className="flex justify-between text-xs mb-1">
                                    <span className="text-fuchsia-300">Formes</span>
                                    <span className="text-fuchsia-400">85%</span>
                                </div>
                                <Progress value={85} className="h-2" />
                            </div>
                            <div>
                                <div className="flex justify-between text-xs mb-1">
                                    <span className="text-fuchsia-300">Gestuelle</span>
                                    <span className="text-fuchsia-400">72%</span>
                                </div>
                                <Progress value={72} className="h-2" />
                            </div>
                            <div>
                                <div className="flex justify-between text-xs mb-1">
                                    <span className="text-fuchsia-300">Dynamique</span>
                                    <span className="text-fuchsia-400">90%</span>
                                </div>
                                <Progress value={90} className="h-2" />
                            </div>
                        </div>
                    </div>

                    <div className="text-xs text-fuchsia-400 bg-fuchsia-950/30 p-2 rounded">
                        🎨 Un mentor artistique sur mesure qui vous guide pour maîtriser le style
                        de vos artistes préférés.
                    </div>
                </div>
            )}
        </Card>
    );
};

export default StyleImitation;
