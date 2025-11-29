import { useState, useRef } from "react";
import { Layout } from "@/components/Layout";
import AICoachMaster from "@/components/drawmaster/AICoachMaster";
import DrawingCanvas from "@/components/drawmaster/DrawingCanvas";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, Eye, Palette, Video } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

/**
 * Page de démonstration du Coach IA DrawMaster
 * Présente toutes les fonctionnalités futuristes du coach IA VR
 * AVEC canvas de dessin interactif et visualisations en temps réel
 */
const AICoachDemo = () => {
    const [mode, setMode] = useState<"classic" | "ar" | "vr">("vr");
    const [referenceImage, setReferenceImage] = useState<string | null>(null);
    const [canvasElement, setCanvasElement] = useState<HTMLCanvasElement | null>(null);
    const [detectedErrors, setDetectedErrors] = useState<any[]>([]);
    const [guides, setGuides] = useState<any[]>([]);

    const handleDrawingChange = (canvas: HTMLCanvasElement) => {
        setCanvasElement(canvas);
    };

    return (
        <Layout>
            <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 p-4 sm:p-8">
                {/* Hero Section */}
                <div className="max-w-7xl mx-auto mb-8">
                    <div className="text-center mb-8">
                        <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent mb-4">
                            Coach IA DrawMaster VR
                        </h1>
                        <p className="text-lg text-slate-300 max-w-3xl mx-auto">
                            Un mentor artistique augmenté qui fusionne pédagogie, vision par ordinateur,
                            et chorégraphie visuelle dynamique pour révolutionner l'apprentissage du dessin en VR.
                        </p>
                    </div>

                    {/* Mode Selection */}
                    <Card className="p-6 bg-slate-900/50 border-purple-500/30 backdrop-blur-sm mb-8">
                        <div className="flex flex-col sm:flex-row items-center gap-4">
                            <div className="flex-1 w-full">
                                <label className="text-sm font-medium text-slate-300 mb-2 block">
                                    Mode de dessin
                                </label>
                                <Select value={mode} onValueChange={(v: any) => setMode(v)}>
                                    <SelectTrigger className="bg-slate-800 border-slate-700">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="classic">
                                            <div className="flex items-center gap-2">
                                                <Palette className="h-4 w-4" />
                                                Mode Classique
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="ar">
                                            <div className="flex items-center gap-2">
                                                <Eye className="h-4 w-4" />
                                                Mode AR (Réalité Augmentée)
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="vr">
                                            <div className="flex items-center gap-2">
                                                <Sparkles className="h-4 w-4" />
                                                Mode VR (Réalité Virtuelle)
                                            </div>
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex-1 w-full">
                                <label className="text-sm font-medium text-slate-300 mb-2 block">
                                    Image de référence
                                </label>
                                <Button
                                    variant="outline"
                                    className="w-full bg-slate-800 border-slate-700 hover:bg-slate-700"
                                    onClick={() => {
                                        // Simulate image upload
                                        setReferenceImage("/placeholder-reference.jpg");
                                    }}
                                >
                                    {referenceImage ? "Changer l'image" : "Charger une image"}
                                </Button>
                            </div>
                        </div>
                    </Card>

                    {/* Features Overview */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                        <Card className="p-4 bg-gradient-to-br from-purple-950/50 to-purple-900/30 border-purple-500/30">
                            <h3 className="font-semibold text-purple-300 mb-2">🎯 Core Features</h3>
                            <ul className="text-xs text-slate-400 space-y-1">
                                <li>• Ghost Mentor holographique</li>
                                <li>• Détection d'erreurs IA</li>
                                <li>• Calibration de style</li>
                                <li>• Mode Shadow-Copy</li>
                            </ul>
                        </Card>

                        <Card className="p-4 bg-gradient-to-br from-pink-950/50 to-pink-900/30 border-pink-500/30">
                            <h3 className="font-semibold text-pink-300 mb-2">🎨 Visual Tools</h3>
                            <ul className="text-xs text-slate-400 space-y-1">
                                <li>• Projection volumétrique 3D</li>
                                <li>• Anatomie vivante (IRM)</li>
                                <li>• Ombres réalistes</li>
                                <li>• Storyboard holographique</li>
                            </ul>
                        </Card>

                        <Card className="p-4 bg-gradient-to-br from-cyan-950/50 to-cyan-900/30 border-cyan-500/30">
                            <h3 className="font-semibold text-cyan-300 mb-2">⚡ Advanced</h3>
                            <ul className="text-xs text-slate-400 space-y-1">
                                <li>• Dessin dans l'air</li>
                                <li>• Enregistreur de gestes</li>
                                <li>• Réalité mixte AR/VR</li>
                                <li>• Guidage haptique</li>
                            </ul>
                        </Card>

                        <Card className="p-4 bg-gradient-to-br from-emerald-950/50 to-emerald-900/30 border-emerald-500/30">
                            <h3 className="font-semibold text-emerald-300 mb-2">💝 Wellness</h3>
                            <ul className="text-xs text-slate-400 space-y-1">
                                <li>• Coach psychologique</li>
                                <li>• Cartographie du progrès</li>
                                <li>• Détection de stress</li>
                                <li>• Encouragements adaptatifs</li>
                            </ul>
                        </Card>
                    </div>
                </div>

                {/* Main Interface with Tabs */}
                <div className="max-w-7xl mx-auto">
                    <Tabs defaultValue="canvas" className="w-full">
                        <TabsList className="grid w-full grid-cols-2 mb-4">
                            <TabsTrigger value="canvas" className="flex items-center gap-2">
                                <Palette className="h-4 w-4" />
                                Canvas de Dessin
                            </TabsTrigger>
                            <TabsTrigger value="coach" className="flex items-center gap-2">
                                <Sparkles className="h-4 w-4" />
                                Coach IA
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="canvas">
                            <DrawingCanvas
                                width={800}
                                height={600}
                                onDrawingChange={handleDrawingChange}
                                showGuides={guides.length > 0}
                                guides={guides}
                                showErrors={detectedErrors.length > 0}
                                errors={detectedErrors}
                            />

                            <Card className="mt-4 p-4 bg-slate-900/50 border-slate-700">
                                <h3 className="text-sm font-semibold text-slate-200 mb-2 flex items-center gap-2">
                                    <Video className="h-4 w-4" />
                                    Statut en temps réel
                                </h3>
                                <div className="grid grid-cols-3 gap-4 text-xs">
                                    <div>
                                        <p className="text-slate-400">Canvas actif</p>
                                        <p className="text-green-400 font-medium">{canvasElement ? "✓ Oui" : "✗ Non"}</p>
                                    </div>
                                    <div>
                                        <p className="text-slate-400">Erreurs détectées</p>
                                        <p className="text-orange-400 font-medium">{detectedErrors.length}</p>
                                    </div>
                                    <div>
                                        <p className="text-slate-400">Guides actifs</p>
                                        <p className="text-cyan-400 font-medium">{guides.length}</p>
                                    </div>
                                </div>
                            </Card>
                        </TabsContent>

                        <TabsContent value="coach">
                            <AICoachMaster
                                mode={mode}
                                referenceImage={referenceImage}
                                canvasElement={canvasElement}
                                onErrorsDetected={setDetectedErrors}
                                onGuidesGenerated={setGuides}
                            />
                        </TabsContent>
                    </Tabs>
                </div>

                {/* Footer Info */}
                <div className="max-w-7xl mx-auto mt-8">
                    <Card className="p-6 bg-slate-900/50 border-slate-700/30 backdrop-blur-sm">
                        <h3 className="text-lg font-semibold text-slate-200 mb-3">
                            🚀 Fonctionnalités Implémentées
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-sm text-slate-400">
                            <div>✅ Ghost-Mentor holographique dynamique</div>
                            <div>✅ Projection volumétrique 3D</div>
                            <div>✅ Calibration automatique du style</div>
                            <div>✅ Mode Shadow-Copy avec précision</div>
                            <div>✅ Détection d'erreur + correction 3D</div>
                            <div>✅ Mode Anatomie Vivante (IRM)</div>
                            <div>✅ Storyboard Holographique</div>
                            <div>✅ Ombres réalistes + shaders</div>
                            <div>✅ Dessin dans l'air (sculpteur)</div>
                            <div>✅ Enregistreur de geste + replay</div>
                            <div>✅ Imitation stylisée (8 styles)</div>
                            <div>✅ Guidage haptique VR</div>
                            <div>✅ Cartographie du progrès 3D</div>
                            <div>✅ Réalité Mixte AR/VR</div>
                            <div>✅ Coach psychologique IA</div>
                            <div className="text-green-400 font-semibold">✅ Canvas interactif LIVE</div>
                            <div className="text-green-400 font-semibold">✅ Analyse IA en temps réel</div>
                            <div className="text-green-400 font-semibold">✅ API locale connectée</div>
                        </div>
                    </Card>
                </div>
            </div>
        </Layout>
    );
};

export default AICoachDemo;
