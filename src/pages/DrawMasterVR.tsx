import { useState } from "react";
import { Layout } from "@/components/Layout";
import DrawingCanvas from "@/components/drawmaster/DrawingCanvas";
import ErrorDetection from "@/components/drawmaster/ErrorDetection";
import StyleCalibration from "@/components/drawmaster/StyleCalibration";
import VolumetricProjection from "@/components/drawmaster/VolumetricProjection";
import ShadowCopyMode from "@/components/drawmaster/ShadowCopyMode";
import LivingAnatomy from "@/components/drawmaster/LivingAnatomy";
import RealisticShadows from "@/components/drawmaster/RealisticShadows";
import HolographicStoryboard from "@/components/drawmaster/HolographicStoryboard";
import AirDrawingMode from "@/components/drawmaster/AirDrawingMode";
import GestureRecorder from "@/components/drawmaster/GestureRecorder";
import StyleImitation from "@/components/drawmaster/StyleImitation";
import PsychologicalCoach from "@/components/drawmaster/PsychologicalCoach";
import ProgressMap from "@/components/drawmaster/ProgressMap";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertTriangle,
  Palette,
  Box,
  Copy,
  Bone,
  Sun,
  Film,
  Wind,
  Video,
  Sparkles,
  Brain,
  TrendingUp,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

const DrawMasterVR = () => {
  // Canvas state
  const [canvasElement, setCanvasElement] = useState<HTMLCanvasElement | null>(null);
  const [detectedErrors, setDetectedErrors] = useState<any[]>([]);
  const [guides, setGuides] = useState<any[]>([]);

  // Toolbar state
  const [toolbarCollapsed, setToolbarCollapsed] = useState(false);

  // Tool toggles
  const [errorDetectionEnabled, setErrorDetectionEnabled] = useState(true);
  const [styleCalibrationEnabled, setStyleCalibrationEnabled] = useState(false);
  const [volumetricEnabled, setVolumetricEnabled] = useState(false);
  const [shadowCopyEnabled, setShadowCopyEnabled] = useState(false);
  const [anatomyEnabled, setAnatomyEnabled] = useState(false);
  const [shadowsEnabled, setShadowsEnabled] = useState(false);
  const [storyboardEnabled, setStoryboardEnabled] = useState(false);
  const [airDrawingEnabled, setAirDrawingEnabled] = useState(false);
  const [gestureRecorderEnabled, setGestureRecorderEnabled] = useState(false);
  const [styleImitationEnabled, setStyleImitationEnabled] = useState(false);
  const [psychoCoachEnabled, setPsychoCoachEnabled] = useState(false);
  const [progressMapEnabled, setProgressMapEnabled] = useState(false);

  const handleDrawingChange = (canvas: HTMLCanvasElement) => {
    setCanvasElement(canvas);
  };

  const tools = [
    {
      id: 'errors',
      name: 'Détection Erreurs',
      icon: AlertTriangle,
      enabled: errorDetectionEnabled,
      setEnabled: setErrorDetectionEnabled,
      color: 'text-red-400',
      bgColor: 'bg-red-950/20'
    },
    {
      id: 'style',
      name: 'Calibration Style',
      icon: Palette,
      enabled: styleCalibrationEnabled,
      setEnabled: setStyleCalibrationEnabled,
      color: 'text-purple-400',
      bgColor: 'bg-purple-950/20'
    },
    {
      id: 'volumetric',
      name: 'Guides 3D',
      icon: Box,
      enabled: volumetricEnabled,
      setEnabled: setVolumetricEnabled,
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-950/20'
    },
    {
      id: 'shadow',
      name: 'Shadow-Copy',
      icon: Copy,
      enabled: shadowCopyEnabled,
      setEnabled: setShadowCopyEnabled,
      color: 'text-indigo-400',
      bgColor: 'bg-indigo-950/20'
    },
    {
      id: 'anatomy',
      name: 'Anatomie Vivante',
      icon: Bone,
      enabled: anatomyEnabled,
      setEnabled: setAnatomyEnabled,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-950/20'
    },
    {
      id: 'shadows',
      name: 'Ombres Réalistes',
      icon: Sun,
      enabled: shadowsEnabled,
      setEnabled: setShadowsEnabled,
      color: 'text-amber-400',
      bgColor: 'bg-amber-950/20'
    },
    {
      id: 'storyboard',
      name: 'Storyboard 3D',
      icon: Film,
      enabled: storyboardEnabled,
      setEnabled: setStoryboardEnabled,
      color: 'text-pink-400',
      bgColor: 'bg-pink-950/20'
    },
    {
      id: 'air',
      name: 'Dessin Air',
      icon: Wind,
      enabled: airDrawingEnabled,
      setEnabled: setAirDrawingEnabled,
      color: 'text-blue-400',
      bgColor: 'bg-blue-950/20'
    },
    {
      id: 'gesture',
      name: 'Enregistreur',
      icon: Video,
      enabled: gestureRecorderEnabled,
      setEnabled: setGestureRecorderEnabled,
      color: 'text-orange-400',
      bgColor: 'bg-orange-950/20'
    },
    {
      id: 'imitation',
      name: 'Imitation Style',
      icon: Sparkles,
      enabled: styleImitationEnabled,
      setEnabled: setStyleImitationEnabled,
      color: 'text-fuchsia-400',
      bgColor: 'bg-fuchsia-950/20'
    },
    {
      id: 'psycho',
      name: 'Coach Psycho',
      icon: Brain,
      enabled: psychoCoachEnabled,
      setEnabled: setPsychoCoachEnabled,
      color: 'text-rose-400',
      bgColor: 'bg-rose-950/20'
    },
    {
      id: 'progress',
      name: 'Progression',
      icon: TrendingUp,
      enabled: progressMapEnabled,
      setEnabled: setProgressMapEnabled,
      color: 'text-green-400',
      bgColor: 'bg-green-950/20'
    },
  ];

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950">
        <div className="flex h-screen">
          {/* Left Toolbar */}
          <div className={`${toolbarCollapsed ? 'w-16' : 'w-64'} transition-all duration-300 bg-slate-900/50 border-r border-slate-700 backdrop-blur-sm`}>
            <div className="p-4 border-b border-slate-700 flex items-center justify-between">
              {!toolbarCollapsed && (
                <h2 className="text-lg font-bold text-purple-400">Outils IA</h2>
              )}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setToolbarCollapsed(!toolbarCollapsed)}
                className="text-slate-400 hover:text-purple-400"
              >
                {toolbarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
              </Button>
            </div>

            <ScrollArea className="h-[calc(100vh-73px)]">
              <div className="p-2 space-y-1">
                {tools.map((tool) => {
                  const Icon = tool.icon;
                  return (
                    <Button
                      key={tool.id}
                      variant={tool.enabled ? "default" : "ghost"}
                      className={`w-full justify-start ${tool.enabled
                          ? `${tool.bgColor} ${tool.color} border border-current`
                          : 'text-slate-400 hover:text-slate-200'
                        } ${toolbarCollapsed ? 'px-2' : ''}`}
                      onClick={() => tool.setEnabled(!tool.enabled)}
                    >
                      <Icon className={`h-4 w-4 ${toolbarCollapsed ? '' : 'mr-2'}`} />
                      {!toolbarCollapsed && <span className="text-sm">{tool.name}</span>}
                    </Button>
                  );
                })}
              </div>
            </ScrollArea>
          </div>

          {/* Main Content */}
          <div className="flex-1 overflow-hidden">
            <div className="h-full flex flex-col">
              {/* Header */}
              <div className="p-4 bg-slate-900/50 border-b border-slate-700 backdrop-blur-sm">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
                  DrawMaster VR - Coach IA
                </h1>
                <p className="text-sm text-slate-400 mt-1">
                  Mentor artistique augmenté avec vision par ordinateur
                </p>
              </div>

              {/* Canvas and Tools */}
              <div className="flex-1 overflow-auto p-4">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-full">
                  {/* Canvas - Takes 2 columns */}
                  <div className="lg:col-span-2">
                    <DrawingCanvas
                      width={800}
                      height={600}
                      onDrawingChange={handleDrawingChange}
                      showGuides={guides.length > 0}
                      guides={guides}
                      showErrors={detectedErrors.length > 0}
                      errors={detectedErrors}
                    />

                    {/* Status Bar */}
                    <Card className="mt-4 p-3 bg-slate-900/50 border-slate-700">
                      <div className="grid grid-cols-3 gap-4 text-xs">
                        <div>
                          <p className="text-slate-400">Canvas</p>
                          <p className={`font-medium ${canvasElement ? 'text-green-400' : 'text-red-400'}`}>
                            {canvasElement ? '✓ Actif' : '✗ Inactif'}
                          </p>
                        </div>
                        <div>
                          <p className="text-slate-400">Erreurs</p>
                          <p className="text-orange-400 font-medium">{detectedErrors.length}</p>
                        </div>
                        <div>
                          <p className="text-slate-400">Guides</p>
                          <p className="text-cyan-400 font-medium">{guides.length}</p>
                        </div>
                      </div>
                    </Card>
                  </div>

                  {/* Tools Panel - 1 column */}
                  <div className="lg:col-span-1">
                    <ScrollArea className="h-[calc(100vh-180px)]">
                      <div className="space-y-4">
                        {errorDetectionEnabled && (
                          <ErrorDetection
                            enabled={errorDetectionEnabled}
                            onEnabledChange={setErrorDetectionEnabled}
                            canvasElement={canvasElement}
                            onErrorsDetected={setDetectedErrors}
                          />
                        )}

                        {styleCalibrationEnabled && (
                          <StyleCalibration
                            enabled={styleCalibrationEnabled}
                            onCalibrationComplete={(profile) => console.log("Style:", profile)}
                          />
                        )}

                        {volumetricEnabled && (
                          <VolumetricProjection
                            enabled={volumetricEnabled}
                            onEnabledChange={setVolumetricEnabled}
                          />
                        )}

                        {shadowCopyEnabled && (
                          <ShadowCopyMode
                            enabled={shadowCopyEnabled}
                            onEnabledChange={setShadowCopyEnabled}
                          />
                        )}

                        {anatomyEnabled && (
                          <LivingAnatomy
                            enabled={anatomyEnabled}
                            onEnabledChange={setAnatomyEnabled}
                          />
                        )}

                        {shadowsEnabled && (
                          <RealisticShadows
                            enabled={shadowsEnabled}
                            onEnabledChange={setShadowsEnabled}
                          />
                        )}

                        {storyboardEnabled && (
                          <HolographicStoryboard
                            enabled={storyboardEnabled}
                            onEnabledChange={setStoryboardEnabled}
                          />
                        )}

                        {airDrawingEnabled && (
                          <AirDrawingMode
                            enabled={airDrawingEnabled}
                            onEnabledChange={setAirDrawingEnabled}
                          />
                        )}

                        {gestureRecorderEnabled && (
                          <GestureRecorder
                            enabled={gestureRecorderEnabled}
                            onEnabledChange={setGestureRecorderEnabled}
                          />
                        )}

                        {styleImitationEnabled && (
                          <StyleImitation
                            enabled={styleImitationEnabled}
                            onEnabledChange={setStyleImitationEnabled}
                          />
                        )}

                        {psychoCoachEnabled && (
                          <PsychologicalCoach
                            enabled={psychoCoachEnabled}
                            onEnabledChange={setPsychoCoachEnabled}
                          />
                        )}

                        {progressMapEnabled && (
                          <ProgressMap
                            enabled={progressMapEnabled}
                            onEnabledChange={setProgressMapEnabled}
                          />
                        )}
                      </div>
                    </ScrollArea>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default DrawMasterVR;
