import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import ClassicMode from "@/components/drawmaster/ClassicMode";
import ARMode from "@/components/drawmaster/ARMode";
import VRMode from "@/components/drawmaster/VRMode";
import GhostMentor from "@/components/drawmaster/GhostMentor";
import DrawingTools from "@/components/drawmaster/DrawingTools";
import { Camera, Anchor, Grid, Ghost, Menu, X, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { LocalLLMService } from "@/lib/ai/local-llm";

/**
 * DrawMasterVR page brings together the Classic, AR and VR modes in one interface.
 * Users can switch between modes, adjust projection settings via DrawingTools,
 * and optionally enable the Ghost Mentor assistant. The VR mode integrates the
 * new VRMode component, which attempts to start an immersive VR session on
 * supported devices such as Vision Pro or other WebXR‑capable headsets.
 */
const DrawMasterVR = () => {
  const [activeMode, setActiveMode] = useState<"classic" | "ar" | "vr">(
    "classic",
  );
  const [ghostMentorEnabled, setGhostMentorEnabled] = useState(false);
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [gridEnabled, setGridEnabled] = useState(false);
  const [gridOpacity, setGridOpacity] = useState(50);
  const [gridTileCount, setGridTileCount] = useState(6);
  const [strobeEnabled, setStrobeEnabled] = useState(false);
  const [strobeSpeed, setStrobeSpeed] = useState(2);
  const [strobeMinOpacity, setStrobeMinOpacity] = useState(30);
  const [strobeMaxOpacity, setStrobeMaxOpacity] = useState(90);
  const [contrast, setContrast] = useState(100);
  const [brightness, setBrightness] = useState(100);
  const [menuOpen, setMenuOpen] = useState(false);

  // Ghost Mentor State
  const [assistanceLevel, setAssistanceLevel] = useState<"soft" | "medium" | "hard">("medium");
  const [showGhostLines, setShowGhostLines] = useState(true);
  const [showHeatmap, setShowHeatmap] = useState(true);
  const [showTrajectories, setShowTrajectories] = useState(false);
  const [sensitivity, setSensitivity] = useState(50);

  // New Ghost Mentor Features
  const [grayscaleMode, setGrayscaleMode] = useState(false);
  const [showPencilGuides, setShowPencilGuides] = useState(false);
  const [activePencilFilter, setActivePencilFilter] = useState<string | null>(null);
  const [isolateZone, setIsolateZone] = useState(false);

  // Ghost Mentor Metrics
  const [errors, setErrors] = useState(0);
  const [corrections, setCorrections] = useState(0);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Ref to track metrics for the interval without resetting it
  const metricsRef = useRef({ accuracy, errors });
  useEffect(() => {
    metricsRef.current = { accuracy, errors };
  }, [accuracy, errors]);

  // Periodic Ghost Mentor LLM Feedback
  useEffect(() => {
    if (!ghostMentorEnabled) return;

    const interval = setInterval(async () => {
      const { accuracy, errors } = metricsRef.current;
      // Only request feedback if we have valid metrics or if we are in a mode that provides them
      if (accuracy !== null || activeMode === 'classic') {
        try {
          const text = await LocalLLMService.getGhostMentorFeedback({
            accuracy: accuracy || 0,
            errors,
            mode: activeMode
          });
          if (text) setFeedback(text);
        } catch (e) {
          console.error("Ghost Mentor LLM error", e);
        }
      }
    }, 10000); // Update feedback every 10 seconds

    return () => clearInterval(interval);
  }, [ghostMentorEnabled, activeMode]);

  const handleAnalysisUpdate = (update: { errors?: number; corrections?: number; accuracy?: number | null; feedback?: string | null }) => {
    if (update.errors !== undefined) setErrors(update.errors);
    if (update.corrections !== undefined) setCorrections(update.corrections);
    if (update.accuracy !== undefined) setAccuracy(update.accuracy);
    // We prioritize LLM feedback, but if the mode sends specific immediate feedback (like "Tracking lost"), we can use it.
    // For now, let's allow the mode to override feedback if it sends a non-null value, 
    // but the LLM loop will overwrite it periodically.
    if (update.feedback !== undefined && update.feedback !== null) setFeedback(update.feedback);
  };

  const navigate = useNavigate();

  const handleMenuSelect = (action: () => void) => {
    action();
    setMenuOpen(false);
  };

  return (
    <div className="mobile-safe-area relative min-h-screen w-full overflow-x-hidden text-white">
      <div className="stage-navigation stage-navigation--drawmaster">
        <button
          type="button"
          aria-label="Ouvrir le menu DrawMaster"
          className="stage-navigation__trigger"
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
        <div className={`stage-navigation__panel ${menuOpen ? "is-open" : ""}`}>
          <div className="stage-navigation__card">
            <div className="stage-navigation__card-header">
              <span className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                DrawMaster
              </span>
              <button
                type="button"
                className="stage-navigation__close"
                aria-label="Fermer le menu DrawMaster"
                onClick={() => setMenuOpen(false)}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <nav className="stage-navigation__list">
              <button
                type="button"
                className="stage-navigation__link"
                onClick={() => handleMenuSelect(() => navigate("/"))}
              >
                Retour clairière
              </button>
              <button
                type="button"
                className={`stage-navigation__link ${activeMode === "classic" ? "is-active" : ""
                  }`}
                onClick={() => handleMenuSelect(() => setActiveMode("classic"))}
              >
                Mode Classic
              </button>
              <button
                type="button"
                className={`stage-navigation__link ${activeMode === "ar" ? "is-active" : ""
                  }`}
                onClick={() => handleMenuSelect(() => setActiveMode("ar"))}
              >
                Mode AR
              </button>
              <button
                type="button"
                className={`stage-navigation__link ${activeMode === "vr" ? "is-active" : ""
                  }`}
                onClick={() => handleMenuSelect(() => setActiveMode("vr"))}
              >
                Mode VR
              </button>
            </nav>
            <button
              type="button"
              className="stage-navigation__link stage-navigation__link--cta mt-4 text-center"
              onClick={() => handleMenuSelect(() => navigate("/"))}
            >
              Retour à l'accueil
            </button>
          </div>
        </div>
      </div>

      {/* Background gradients for depth and ambience */}
      <div className="pointer-events-none absolute inset-0 -z-10 opacity-70">
        <div className="absolute left-14 top-28 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute right-10 top-20 h-80 w-80 rounded-full bg-secondary/30 blur-3xl" />
        <div className="absolute bottom-16 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-accent/25 blur-3xl" />
      </div>

      <div className="mx-auto w-full max-w-6xl overflow-x-hidden px-4 pb-20 pt-24 sm:px-6 lg:px-8">
        <div className="mb-6 flex w-full justify-start">
          <Button
            variant="outline"
            onClick={() => navigate("/")}
            className="inline-flex items-center gap-2 rounded-full border-white/60 bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-foreground shadow-inner shadow-white/40 backdrop-blur transition hover:bg-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour clairière
          </Button>
        </div>

        {/* Intro card */}
        <Card className="mobile-card mb-12 flex flex-col gap-6 rounded-[40px] border border-white/70 bg-white/85 p-5 shadow-[var(--shadow-soft)] backdrop-blur-xl sm:p-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-semibold uppercase tracking-widest text-primary">
              Studio immersif
            </div>
            <h1 className="text-4xl font-bold leading-tight text-foreground sm:text-5xl">
              DrawMaster VR
            </h1>
            <p className="mx-auto max-w-2xl text-base leading-relaxed text-muted-foreground lg:mx-0">
              Composez vos séances de projection, de réalité augmentée et maintenant de réalité virtuelle Vision Pro dans une interface pensée pour les tablettes et casques VR. Ajustez la grille, activez le strobe et laissez le Ghost Mentor guider vos traits.
            </p>
          </div>

          <div className="flex flex-col gap-5 rounded-[28px] border border-white/60 bg-gradient-to-br from-primary/12 via-white/80 to-secondary/10 px-6 py-5 text-sm text-muted-foreground shadow-[var(--shadow-card)]">
            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-widest">
              <span>Mode actif</span>
              <span className="rounded-full bg-white/70 px-3 py-1 text-primary shadow-inner shadow-white/50">
                {activeMode === "classic"
                  ? "Classic"
                  : activeMode === "ar"
                    ? "AR"
                    : "VR"}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-widest">
              <span>Ghost Mentor</span>
              <Button
                size="sm"
                onClick={() => setGhostMentorEnabled(!ghostMentorEnabled)}
                className={`h-9 rounded-full px-4 text-xs font-semibold uppercase tracking-widest ${ghostMentorEnabled
                  ? "bg-primary text-white"
                  : "border border-white/60 bg-white/70 text-foreground"
                  }`}
              >
                <Ghost className="mr-2 h-4 w-4" />
                {ghostMentorEnabled ? "Activé" : "Inactif"}
              </Button>
            </div>
            <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Outils de projection
            </div>
            <p className="text-sm leading-relaxed">
              Glissez vos références, calibrez la grille et expérimentez le strobe pour un tracé ultra précis. Profitez désormais d'un mode VR immersif optimisé Vision Pro.
            </p>
          </div>
        </Card>

        <div className="space-y-8">
          {/* Module vidéo en premier (pleine largeur) */}
          <Card className="mobile-card rounded-[36px] border border-white/70 bg-white/85 p-4 shadow-[var(--shadow-soft)] backdrop-blur-xl sm:p-6 lg:h-auto h-[calc(110gitvh-1rem)] flex flex-col">
            <Tabs
              value={activeMode}
              onValueChange={(value) =>
                setActiveMode(value as "classic" | "ar" | "vr")
              }
              className="flex h-full w-full flex-col gap-6"
            >
              <TabsList className="mobile-stack-gap mb-2 grid w-full grid-cols-1 gap-2 rounded-[24px] border border-white/60 bg-white/70 p-1.5 text-xs font-semibold uppercase tracking-widest text-muted-foreground sm:grid-cols-3 sm:mb-6 overflow-hidden">
                <TabsTrigger
                  value="classic"
                  className="w-full rounded-[20px] px-6 py-3 text-center text-[11px] data-[state=active]:bg-primary data-[state=active]:text-white sm:text-xs"
                >
                  Mode Classic
                </TabsTrigger>
                <TabsTrigger
                  value="ar"
                  className="w-full rounded-[20px] px-6 py-3 text-center text-[11px] data-[state=active]:bg-secondary data-[state=active]:text-white sm:text-xs"
                >
                  Mode AR
                </TabsTrigger>
                <TabsTrigger
                  value="vr"
                  className="w-full rounded-[20px] px-6 py-3 text-center text-[11px] data-[state=active]:bg-accent data-[state=active]:text-white sm:text-xs"
                >
                  Mode VR
                </TabsTrigger>
              </TabsList>

              <div className="flex-1 space-y-6">
                <TabsContent value="classic" className="mt-0 h-full space-y-4">
                  <ClassicMode
                    referenceImage={referenceImage}
                    ghostMentorEnabled={ghostMentorEnabled}
                    gridEnabled={gridEnabled}
                    gridOpacity={gridOpacity}
                    gridTileCount={gridTileCount}
                    strobeEnabled={strobeEnabled}
                    strobeSpeed={strobeSpeed}
                    strobeMinOpacity={strobeMinOpacity}
                    strobeMaxOpacity={strobeMaxOpacity}
                    contrast={contrast}
                    brightness={brightness}
                    assistanceLevel={assistanceLevel}
                    showGhostLines={showGhostLines}
                    showHeatmap={showHeatmap}
                    showTrajectories={showTrajectories}
                    sensitivity={sensitivity}
                    onAnalysisUpdate={handleAnalysisUpdate}
                    grayscaleMode={grayscaleMode}
                    showPencilGuides={showPencilGuides}
                    activePencilFilter={activePencilFilter}
                    isolateZone={isolateZone}
                  />
                </TabsContent>
                <TabsContent value="ar" className="mt-0 h-full space-y-4">
                  <ARMode
                    referenceImage={referenceImage}
                    gridEnabled={gridEnabled}
                    gridOpacity={gridOpacity}
                    gridTileCount={gridTileCount}
                    strobeEnabled={strobeEnabled}
                    strobeSpeed={strobeSpeed}
                    strobeMinOpacity={strobeMinOpacity}
                    strobeMaxOpacity={strobeMaxOpacity}
                    contrast={contrast}
                    brightness={brightness}
                    assistanceLevel={assistanceLevel}
                    showGhostLines={showGhostLines}
                    showHeatmap={showHeatmap}
                    showTrajectories={showTrajectories}
                    sensitivity={sensitivity}
                    onAnalysisUpdate={handleAnalysisUpdate}
                    grayscaleMode={grayscaleMode}
                    showPencilGuides={showPencilGuides}
                    activePencilFilter={activePencilFilter}
                    isolateZone={isolateZone}
                  />
                </TabsContent>
                <TabsContent value="vr" className="mt-0 h-full space-y-4">
                  <VRMode
                    referenceImage={referenceImage}
                    gridEnabled={gridEnabled}
                    gridOpacity={gridOpacity}
                    gridTileCount={gridTileCount}
                    strobeEnabled={strobeEnabled}
                    strobeSpeed={strobeSpeed}
                    strobeMinOpacity={strobeMinOpacity}
                    strobeMaxOpacity={strobeMaxOpacity}
                    contrast={contrast}
                    brightness={brightness}
                    assistanceLevel={assistanceLevel}
                    showGhostLines={showGhostLines}
                    showHeatmap={showHeatmap}
                    showTrajectories={showTrajectories}
                    sensitivity={sensitivity}
                    onAnalysisUpdate={handleAnalysisUpdate}
                    grayscaleMode={grayscaleMode}
                    showPencilGuides={showPencilGuides}
                    activePencilFilter={activePencilFilter}
                    isolateZone={isolateZone}
                  />
                </TabsContent>
              </div>
            </Tabs>
          </Card>

          {/* Contrôles et outils en dessous */}
          <Card className="mobile-card flex flex-col gap-6 rounded-[36px] border border-white/60 bg-white/85 p-4 shadow-[var(--shadow-card)] backdrop-blur-xl sm:p-6">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
              Modes de dessin
            </h2>
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Button
                variant={activeMode === "classic" ? "default" : "outline"}
                className={`h-auto w-full rounded-[24px] px-5 py-4 text-sm font-semibold uppercase tracking-widest sm:flex-1 ${activeMode === "classic"
                  ? "bg-primary text-white shadow-[0_18px_40px_-22px_rgba(92,80,255,0.7)]"
                  : "border-white/60 bg-white/70 text-foreground shadow-inner shadow-white/50"
                  }`}
                onClick={() => setActiveMode("classic")}
              >
                <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/40 text-primary">
                      <Camera className="h-5 w-5" />
                    </span>
                    <span className="text-sm sm:text-base">Mode Classic</span>
                  </div>
                  <span className="text-[11px] text-white/90 sm:text-xs">
                    Projection directe
                  </span>
                </div>
              </Button>
              <Button
                variant={activeMode === "ar" ? "default" : "outline"}
                className={`h-auto w-full rounded-[24px] px-5 py-4 text-sm font-semibold uppercase tracking-widest sm:flex-1 ${activeMode === "ar"
                  ? "bg-secondary text-white shadow-[0_18px_40px_-22px_rgba(255,151,118,0.6)]"
                  : "border-white/60 bg-white/70 text-foreground shadow-inner shadow-white/50"
                  }`}
                onClick={() => setActiveMode("ar")}
              >
                <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/40 text-secondary">
                      <Anchor className="h-5 w-5" />
                    </span>
                    <span className="text-sm sm:text-base">Mode AR (Anchors)</span>
                  </div>
                  <span className="text-[11px] text-white/90 sm:text-xs">
                    Réglages avancés
                  </span>
                </div>
              </Button>
              <Button
                variant={activeMode === "vr" ? "default" : "outline"}
                className={`h-auto w-full rounded-[24px] px-5 py-4 text-sm font-semibold uppercase tracking-widest sm:flex-1 ${activeMode === "vr"
                  ? "bg-accent text-white shadow-[0_18px_40px_-22px_rgba(124,58,237,0.6)]"
                  : "border-white/60 bg-white/70 text-foreground shadow-inner shadow-white/50"
                  }`}
                onClick={() => setActiveMode("vr")}
              >
                <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/40 text-accent">
                      <Grid className="h-5 w-5" />
                    </span>
                    <span className="text-sm sm:text-base">Mode VR (Vision Pro)</span>
                  </div>
                  <span className="text-[11px] text-white/90 sm:text-xs">
                    Immersion totale
                  </span>
                </div>
              </Button>
            </div>

            {/* Projection tools */}
            <DrawingTools
              referenceImage={referenceImage}
              onImageSelect={setReferenceImage}
              gridEnabled={gridEnabled}
              onGridEnabledChange={setGridEnabled}
              gridOpacity={gridOpacity}
              onGridOpacityChange={setGridOpacity}
              gridTileCount={gridTileCount}
              onGridTileCountChange={setGridTileCount}
              strobeEnabled={strobeEnabled}
              onStrobeEnabledChange={setStrobeEnabled}
              strobeSpeed={strobeSpeed}
              onStrobeSpeedChange={setStrobeSpeed}
              strobeMinOpacity={strobeMinOpacity}
              strobeMaxOpacity={strobeMaxOpacity}
              onStrobeMinOpacityChange={(value) => {
                setStrobeMinOpacity(Math.min(value, strobeMaxOpacity));
              }}
              onStrobeMaxOpacityChange={(value) => {
                setStrobeMaxOpacity(Math.max(value, strobeMinOpacity));
              }}
              contrast={contrast}
              onContrastChange={setContrast}
              brightness={brightness}
              onBrightnessChange={setBrightness}
            />

            {ghostMentorEnabled && (
              <GhostMentor
                mode={activeMode}
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
                errors={errors}
                corrections={corrections}
                accuracy={accuracy}
                feedback={feedback}
              />
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DrawMasterVR;
