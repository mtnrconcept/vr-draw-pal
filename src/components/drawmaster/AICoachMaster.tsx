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
    // Ghost Mentor states from parent
    assistanceLevel: "soft" | "medium" | "hard";
    onAssistanceLevelChange: (level: "soft" | "medium" | "hard") => void;
    showGhostLines: boolean;
    onShowGhostLinesChange: (show: boolean) => void;
    showHeatmap: boolean;
    onShowHeatmapChange: (show: boolean) => void;
    showTrajectories: boolean;
    onShowTrajectoriesChange: (show: boolean) => void;
    sensitivity: number;
    onSensitivityChange: (value: number) => void;
    grayscaleMode: boolean;
    onGrayscaleModeChange: (enabled: boolean) => void;
    showPencilGuides: boolean;
    onShowPencilGuidesChange: (show: boolean) => void;
    activePencilFilter: string | null;
    onActivePencilFilterChange: (filter: string | null) => void;
    isolateZone: boolean;
    onIsolateZoneChange: (enabled: boolean) => void;
    errors: number;
    corrections: number;
    accuracy: number | null;
    feedback: string | null;
}

/**
 * AI Coach Master - Hub central pour toutes les fonctionnalités du coach IA
 * Regroupe tous les modules avancés dans une interface organisée par catégories
 */
const AICoachMaster = ({ 
    mode, 
    referenceImage,
    assistanceLevel,
    onAssistanceLevelChange,
    showGhostLines,
    onShowGhostLinesChange,
    showHeatmap,
    onShowHeatmapChange,
    showTrajectories,
    onShowTrajectoriesChange,
    sensitivity,
    onSensitivityChange,
    grayscaleMode,
    onGrayscaleModeChange,
    showPencilGuides,
    onShowPencilGuidesChange,
    activePencilFilter,
    onActivePencilFilterChange,
    isolateZone,
    onIsolateZoneChange,
    errors,
    corrections,
    accuracy,
    feedback
}: AICoachMasterProps) => {

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
                            onAssistanceLevelChange={onAssistanceLevelChange}
                            showGhostLines={showGhostLines}
                            onShowGhostLinesChange={onShowGhostLinesChange}
                            showHeatmap={showHeatmap}
                            onShowHeatmapChange={onShowHeatmapChange}
                            showTrajectories={showTrajectories}
                            onShowTrajectoriesChange={onShowTrajectoriesChange}
                            sensitivity={sensitivity}
                            onSensitivityChange={onSensitivityChange}
                            grayscaleMode={grayscaleMode}
                            onGrayscaleModeChange={onGrayscaleModeChange}
                            showPencilGuides={showPencilGuides}
                            onShowPencilGuidesChange={onShowPencilGuidesChange}
                            activePencilFilter={activePencilFilter}
                            onActivePencilFilterChange={onActivePencilFilterChange}
                            isolateZone={isolateZone}
                            onIsolateZoneChange={onIsolateZoneChange}
                            errors={errors}
                            corrections={corrections}
                            accuracy={accuracy}
                            feedback={feedback}
                        />

                        <ErrorDetection
                            enabled={errorDetectionEnabled}
                            onEnabledChange={setErrorDetectionEnabled}
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
