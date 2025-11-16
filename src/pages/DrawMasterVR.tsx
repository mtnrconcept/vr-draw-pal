import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ClassicMode from "@/components/drawmaster/ClassicMode";
import ARMode from "@/components/drawmaster/ARMode";
import GhostMentor from "@/components/drawmaster/GhostMentor";
import DrawingTools from "@/components/drawmaster/DrawingTools";
import { Camera, Anchor, Ghost, Grid } from "lucide-react";

const DrawMasterVR = () => {
  const [activeMode, setActiveMode] = useState<"classic" | "ar" | "vr">("classic");
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

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-gradient-to-br from-[#f9f7ff] via-white to-[#f2f5ff]">
      <div className="absolute inset-0 -z-10">
        <div className="absolute left-14 top-28 h-72 w-72 rounded-full bg-primary/15 blur-3xl" />
        <div className="absolute right-10 top-20 h-80 w-80 rounded-full bg-secondary/25 blur-3xl" />
        <div className="absolute bottom-16 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-accent/25 blur-3xl" />
      </div>

      <div className="mx-auto w-full max-w-6xl px-3 pb-20 pt-16 sm:px-4 sm:pt-20 md:px-6 lg:px-8">
        <Card className="mb-6 flex flex-col gap-4 rounded-[24px] border border-white/70 bg-white/85 p-4 shadow-[var(--shadow-soft)] backdrop-blur-xl sm:mb-8 sm:gap-6 sm:rounded-[32px] sm:p-6 lg:mb-12 lg:gap-8 lg:rounded-[40px] lg:flex-row lg:items-center lg:justify-between lg:p-8">
          <div className="space-y-3 text-center sm:space-y-4 lg:text-left">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-widest text-primary sm:px-4 sm:py-2 sm:text-sm">
              Studio immersif
            </div>
            <h1 className="text-3xl font-bold leading-tight text-foreground sm:text-4xl lg:text-5xl">DrawMaster VR</h1>
            <p className="mx-auto max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base lg:mx-0">
              Composez vos séances de projection et de réalité augmentée dans une interface pensée pour les tablettes et casques VR. Ajustez la grille, activez le strobe et laissez le Ghost Mentor guider vos traits.
            </p>
          </div>

          <div className="flex flex-col gap-3 rounded-[20px] border border-white/60 bg-gradient-to-br from-primary/12 via-white/80 to-secondary/10 px-4 py-4 text-sm text-muted-foreground shadow-[var(--shadow-card)] sm:gap-4 sm:rounded-[24px] sm:px-5 sm:py-5 lg:rounded-[28px] lg:px-6">
            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-widest">
              <span>Mode actif</span>
              <span className="rounded-full bg-white/70 px-3 py-1 text-primary shadow-inner shadow-white/50">{activeMode === "classic" ? "Classic" : activeMode === "ar" ? "AR" : "VR"}</span>
            </div>
            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-widest">
              <span>Ghost Mentor</span>
              <Button
                size="sm"
                onClick={() => setGhostMentorEnabled(!ghostMentorEnabled)}
                className={`h-9 rounded-full px-4 text-xs font-semibold uppercase tracking-widest ${ghostMentorEnabled ? "bg-primary text-white" : "border border-white/60 bg-white/70 text-foreground"}`}
              >
                <Ghost className="mr-2 h-4 w-4" />
                {ghostMentorEnabled ? "Activé" : "Inactif"}
              </Button>
            </div>
            <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Outils de projection</div>
            <p className="text-sm leading-relaxed">
              Glissez vos références, calibrez la grille et expérimentez le strobe pour un tracé ultra précis.
            </p>
          </div>
        </Card>

        <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-[0.98fr_1.02fr] lg:gap-8">
          <Card className="flex flex-col gap-4 overflow-x-hidden rounded-[24px] border border-white/60 bg-white/85 p-4 shadow-[var(--shadow-card)] backdrop-blur-xl sm:gap-5 sm:rounded-[28px] sm:p-5 lg:gap-6 lg:rounded-[36px] lg:p-6">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground sm:text-sm">Modes de dessin</h2>
            <div className="grid gap-2.5 sm:gap-3">
              <Button
                variant={activeMode === "classic" ? "default" : "outline"}
                className={`h-12 justify-between rounded-[18px] px-4 text-xs font-semibold uppercase tracking-widest sm:h-14 sm:rounded-[20px] sm:px-5 sm:text-sm lg:rounded-[24px] lg:px-6 ${activeMode === "classic" ? "bg-primary text-white shadow-[0_18px_40px_-22px_rgba(92,80,255,0.7)]" : "border-white/60 bg-white/70 text-foreground shadow-inner shadow-white/50"}`}
                onClick={() => setActiveMode("classic")}
              >
                <div className="flex items-center gap-2 sm:gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/40 text-primary sm:h-10 sm:w-10 sm:rounded-2xl">
                    <Camera className="h-4 w-4 sm:h-5 sm:w-5" />
                  </span>
                  <span className="text-left">Mode Classic</span>
                </div>
                <span className="hidden text-xs sm:inline">Projection directe</span>
              </Button>
              <Button
                variant={activeMode === "ar" ? "default" : "outline"}
                className={`h-12 justify-between rounded-[18px] px-4 text-xs font-semibold uppercase tracking-widest sm:h-14 sm:rounded-[20px] sm:px-5 sm:text-sm lg:rounded-[24px] lg:px-6 ${activeMode === "ar" ? "bg-secondary text-white shadow-[0_18px_40px_-22px_rgba(255,151,118,0.6)]" : "border-white/60 bg-white/70 text-foreground shadow-inner shadow-white/50"}`}
                onClick={() => setActiveMode("ar")}
              >
                <div className="flex items-center gap-2 sm:gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/40 text-secondary sm:h-10 sm:w-10 sm:rounded-2xl">
                    <Anchor className="h-4 w-4 sm:h-5 sm:w-5" />
                  </span>
                  <span className="text-left">Mode AR (Anchors)</span>
                </div>
                <span className="hidden text-xs sm:inline">Réglages avancés</span>
              </Button>
              <Button
                variant="outline"
                className="h-12 justify-between rounded-[18px] border-dashed border-white/70 bg-white/50 px-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground sm:h-14 sm:rounded-[20px] sm:px-5 sm:text-sm lg:rounded-[24px] lg:px-6"
                disabled
              >
                <div className="flex items-center gap-2 sm:gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/40 text-muted-foreground sm:h-10 sm:w-10 sm:rounded-2xl">
                    <Grid className="h-4 w-4 sm:h-5 sm:w-5" />
                  </span>
                  <span className="text-left">Mode VR (Vision Pro)</span>
                </div>
                <span className="hidden text-xs sm:inline">Bientôt</span>
              </Button>
            </div>

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
          </Card>

          <Card className="overflow-x-hidden rounded-[24px] border border-white/70 bg-white/85 p-4 shadow-[var(--shadow-soft)] backdrop-blur-xl sm:rounded-[28px] sm:p-5 lg:rounded-[36px] lg:p-6">
            <Tabs value={activeMode} onValueChange={(value) => setActiveMode(value as "classic" | "ar" | "vr")}
              className="flex h-full flex-col">
            <TabsList className="mb-4 grid grid-cols-1 gap-1.5 rounded-[18px] border border-white/60 bg-white/70 p-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground sm:mb-6 sm:grid-cols-2 sm:gap-2 sm:rounded-[20px] sm:p-1.5 sm:text-xs lg:rounded-[24px]">
                <TabsTrigger value="classic" className="rounded-[14px] px-4 py-2 sm:rounded-[16px] sm:px-6 sm:py-3 lg:rounded-[20px] data-[state=active]:bg-primary data-[state=active]:text-white">
                  Mode Classic
                </TabsTrigger>
                <TabsTrigger value="ar" className="rounded-[14px] px-4 py-2 sm:rounded-[16px] sm:px-6 sm:py-3 lg:rounded-[20px] data-[state=active]:bg-secondary data-[state=active]:text-white">
                  Mode AR
                </TabsTrigger>
              </TabsList>

              <div className="flex-1 space-y-4 overflow-x-hidden sm:space-y-6">
                <TabsContent value="classic" className="mt-0 h-full">
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
                  />
                </TabsContent>
                <TabsContent value="ar" className="mt-0 h-full">
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
                  />
                </TabsContent>
              </div>
            </Tabs>

            {ghostMentorEnabled && (
              <GhostMentor
                mode={activeMode}
                referenceImage={referenceImage}
              />
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DrawMasterVR;
