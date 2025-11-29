import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import GhostMentor from "./GhostMentor";
import VolumetricProjection from "./VolumetricProjection";
import StyleCalibration from "./StyleCalibration";
import ShadowCopyMode from "./ShadowCopyMode";
import ErrorDetection from "./ErrorDetection";
import LivingAnatomy from "./LivingAnatomy";
import HolographicStoryboard from "./HolographicStoryboard";
import RealisticShadows from "./RealisticShadows";
import AirDrawingMode from "./AirDrawingMode";
import GestureRecorder from "./GestureRecorder";
import StyleImitation from "./StyleImitation";
import HapticGuidance from "./HapticGuidance";
import ProgressMap from "./ProgressMap";
import MixedRealityMode from "./MixedRealityMode";
import PsychologicalCoach from "./PsychologicalCoach";
import { Sparkles, Brain, Palette, Zap } from "lucide-react";

interface AICoachMasterProps {
    mode: "classic" | "ar" | "vr";
    referenceImage: string | null;
    canvasElement?: HTMLCanvasElement | null;
    onErrorsDetected?: (errors: any[]) => void;
    onGuidesGenerated?: (guides: any[]) => void;
}

/**
 * AI Coach Master - Hub central pour toutes les fonctionnalités du coach IA
 * Regroupe tous les modules avancés dans une interface organisée par catégories
 */
const AICoachMaster = ({ mode, referenceImage, canvasElement, onErrorsDetected, onGuidesGenerated }: AICoachMasterProps) => {
    // Ghost Mentor states
    const [assistanceLevel, setAssistanceLevel] = useState<"soft" | "medium" | "hard">("medium");
    const [showGhostLines, setShowGhostLines] = useState(true);
    const [showHeatmap, setShowHeatmap] = useState(false);
    const [showTrajectories, setShowTrajectories] = useState(false);
    const [sensitivity, setSensitivity] = useState(70);
    const [grayscaleMode, setGrayscaleMode] = useState(false);
    const [showPencilGuides, setShowPencilGuides] = useState(false);
    const [activePencilFilter, setActivePencilFilter] = useState<string | null>(null);
    const [isolateZone, setIsolateZone] = useState(false);

    // Feature toggles
    const [volumetricEnabled, setVolumetricEnabled] = useState(false);
    const [styleCalibrationEnabled, setStyleCalibrationEnabled] = useState(false);
    const [shadowCopyEnabled, setShadowCopyEnabled] = useState(false);
    const [errorDetectionEnabled, setErrorDetectionEnabled] = useState(true);
    const [anatomyEnabled, setAnatomyEnabled] = useState(false);
    const [storyboardEnabled, setStoryboardEnabled] = useState(false);
    const [shadowsEnabled, setShadowsEnabled] = useState(false);
    const [airDrawingEnabled, setAirDrawingEnabled] = useState(false);
    const [gestureRecorderEnabled, setGestureRecorderEnabled] = useState(false);
    const [styleImitationEnabled, setStyleImitationEnabled] = useState(false);
    const [hapticEnabled, setHapticEnabled] = useState(false);
    const [progressMapEnabled, setProgressMapEnabled] = useState(true);
    const [mixedRealityEnabled, setMixedRealityEnabled] = useState(false);
    const [psychoCoachEnabled, setPsychoCoachEnabled] = useState(true);

    return (
        <Card className="p-6 bg-gradient-to-br from-slate-950 to-slate-900 border-2 border-primary">
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-primary flex items-center gap-2">
                    <Sparkles className="h-6 w-6" />
                    Coach IA - DrawMaster VR
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                    Mentor artistique augmenté avec vision par ordinateur et chorégraphie visuelle dynamique
                </p>
            </div>

            <Tabs defaultValue="core" className="w-full">
                <TabsList className="grid w-full grid-cols-4 mb-4">
                    <TabsTrigger value="core" className="flex items-center gap-1">
                        <Brain className="h-4 w-4" />
                        <span className="hidden sm:inline">Core</span>
                    </TabsTrigger>
                    <TabsTrigger value="visual" className="flex items-center gap-1">
                        <Palette className="h-4 w-4" />
                        <span className="hidden sm:inline">Visuel</span>
                    </TabsTrigger>
                    <TabsTrigger value="advanced" className="flex items-center gap-1">
                        <Zap className="h-4 w-4" />
                        <span className="hidden sm:inline">Avancé</span>
                    </TabsTrigger>
                    <TabsTrigger value="wellness" className="flex items-center gap-1">
                        <Sparkles className="h-4 w-4" />
                        <span className="hidden sm:inline">Bien-être</span>
                    </TabsTrigger>
                </TabsList>

                <ScrollArea className="h-[600px] pr-4">
                    <TabsContent value="core" className="space-y-4">
                        <GhostMentor
                            mode={mode}
                            referenceImage={referenceImage}
                            assistanceLevel={assistanceLevel}
                            onAssistanceLevelChange={setAssistanceLevel}
                            showGhostLines={showGhostLines}
                            onShowGhostLinesChange={setShowGhostLines}
                            showHeatmap={showHeatmap}
                            onShowHeatmapChange={setShowHeatmap}
                            showTrajectories={showTrajectories}
                            onShowTrajectoriesChange={setShowTrajectories}
                            sensitivity={sensitivity}
                            onSensitivityChange={setSensitivity}
                            grayscaleMode={grayscaleMode}
                            onGrayscaleModeChange={setGrayscaleMode}
                            showPencilGuides={showPencilGuides}
                            onShowPencilGuidesChange={setShowPencilGuides}
                            activePencilFilter={activePencilFilter}
                            onActivePencilFilterChange={setActivePencilFilter}
                            isolateZone={isolateZone}
                            onIsolateZoneChange={setIsolateZone}
                            errors={0}
                            corrections={0}
                            accuracy={null}
                            feedback={null}
                        />

                        <ErrorDetection
                            enabled={errorDetectionEnabled}
                            onEnabledChange={setErrorDetectionEnabled}
                            canvasElement={canvasElement}
                            onErrorsDetected={onErrorsDetected}
                        />

                        <StyleCalibration
                            enabled={styleCalibrationEnabled}
                            onCalibrationComplete={(profile) => console.log("Style profile:", profile)}
                        />

                        <ShadowCopyMode
                            enabled={shadowCopyEnabled}
                            onEnabledChange={setShadowCopyEnabled}
                        />
                    </TabsContent>

                    <TabsContent value="visual" className="space-y-4">
                        <VolumetricProjection
                            enabled={volumetricEnabled}
                            onEnabledChange={setVolumetricEnabled}
                        />

                        <LivingAnatomy
                            enabled={anatomyEnabled}
                            onEnabledChange={setAnatomyEnabled}
                        />

                        <RealisticShadows
                            enabled={shadowsEnabled}
                            onEnabledChange={setShadowsEnabled}
                        />

                        <HolographicStoryboard
                            enabled={storyboardEnabled}
                            onEnabledChange={setStoryboardEnabled}
                        />

                        <StyleImitation
                            enabled={styleImitationEnabled}
                            onEnabledChange={setStyleImitationEnabled}
                        />
                    </TabsContent>

                    <TabsContent value="advanced" className="space-y-4">
                        <AirDrawingMode
                            enabled={airDrawingEnabled}
                            onEnabledChange={setAirDrawingEnabled}
                        />

                        <GestureRecorder
                            enabled={gestureRecorderEnabled}
                            onEnabledChange={setGestureRecorderEnabled}
                        />

                        <MixedRealityMode
                            enabled={mixedRealityEnabled}
                            onEnabledChange={setMixedRealityEnabled}
                        />

                        {mode === "vr" && (
                            <HapticGuidance
                                enabled={hapticEnabled}
                                onEnabledChange={setHapticEnabled}
                            />
                        )}
                    </TabsContent>

                    <TabsContent value="wellness" className="space-y-4">
                        <PsychologicalCoach
                            enabled={psychoCoachEnabled}
                            onEnabledChange={setPsychoCoachEnabled}
                        />

                        <ProgressMap
                            enabled={progressMapEnabled}
                            onEnabledChange={setProgressMapEnabled}
                        />
                    </TabsContent>
                </ScrollArea>
            </Tabs>
        </Card>
    );
};

export default AICoachMaster;
