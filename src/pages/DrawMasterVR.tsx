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
    <div className="mobile-safe-area relative min-h-screen overflow-x-hidden text-white">
      <div className="pointer-events-none absolute inset-0 -z-10 opacity-70">
        <div className="absolute left-14 top-28 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute right-10 top-20 h-80 w-80 rounded-full bg-secondary/30 blur-3xl" />
        <div className="absolute bottom-16 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-accent/25 blur-3xl" />
      </div>

      <div className="mx-auto w-full max-w-6xl px-4 pb-20 pt-20 sm:px-6 lg:px-8">
        <Card className="mobile-card mb-12 flex flex-col gap-6 rounded-[40px] border border-white/70 bg-white/85 p-5 shadow-[var(--shadow-soft)] backdrop-blur-xl sm:p-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-semibold uppercase tracking-widest text-primary">
              Studio immersif
            </div>
            <h1 className="text-4xl font-bold leading-tight text-foreground sm:text-5xl">DrawMaster VR</h1>
            <p className="mx-auto max-w-2xl text-base leading-relaxed text-muted-foreground lg:mx-0">
              Composez vos séances de projection et de réalité augmentée dans une interface pensée pour les tablettes et casques VR. Ajustez la grille, activez le strobe et laissez le Ghost Mentor guider vos traits.
            </p>
          </div>

          <div className="flex flex-col gap-5 rounded-[28px] border border-white/60 bg-gradient-to-br from-primary/12 via-white/80 to-secondary/10 px-6 py-5 text-sm text-muted-foreground shadow-[var(--shadow-card)]">
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

        <div className="mobile-grid-collapse grid gap-8 lg:grid-cols-[0.98fr_1.02fr]">
          <Card className="mobile-card flex flex-col gap-6 rounded-[36px] border border-white/60 bg-white/85 p-4 shadow-[var(--shadow-card)] backdrop-blur-xl sm:p-6">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">Modes de dessin</h2>
              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Button
                  variant={activeMode === "classic" ? "default" : "outline"}
                  className={`h-auto w-full rounded-[24px] px-5 py-4 text-sm font-semibold uppercase tracking-widest sm:flex-1 ${activeMode === "classic" ? "bg-primary text-white shadow-[0_18px_40px_-22px_rgba(92,80,255,0.7)]" : "border-white/60 bg-white/70 text-foreground shadow-inner shadow-white/50"}`}
                  onClick={() => setActiveMode("classic")}
                >
                  <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/40 text-primary">
                        <Camera className="h-5 w-5" />
                      </span>
                      <span className="text-sm sm:text-base">Mode Classic</span>
                    </div>
                    <span className="text-[11px] text-white/90 sm:text-xs">Projection directe</span>
                  </div>
                </Button>
                <Button
                  variant={activeMode === "ar" ? "default" : "outline"}
                  className={`h-auto w-full rounded-[24px] px-5 py-4 text-sm font-semibold uppercase tracking-widest sm:flex-1 ${activeMode === "ar" ? "bg-secondary text-white shadow-[0_18px_40px_-22px_rgba(255,151,118,0.6)]" : "border-white/60 bg-white/70 text-foreground shadow-inner shadow-white/50"}`}
                  onClick={() => setActiveMode("ar")}
                >
                  <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/40 text-secondary">
                        <Anchor className="h-5 w-5" />
                      </span>
                      <span className="text-sm sm:text-base">Mode AR (Anchors)</span>
                    </div>
                    <span className="text-[11px] text-white/90 sm:text-xs">Réglages avancés</span>
                  </div>
                </Button>
                <Button
                  variant="outline"
                  className="h-auto w-full rounded-[24px] px-5 py-4 text-sm font-semibold uppercase tracking-widest border-dashed border-white/70 bg-white/50 text-muted-foreground sm:flex-1"
                  disabled
                >
                  <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/40 text-muted-foreground">
                        <Grid className="h-5 w-5" />
                      </span>
                      <span className="text-sm sm:text-base">Mode VR (Vision Pro)</span>
                    </div>
                    <span className="text-[11px] sm:text-xs">Bientôt</span>
                  </div>
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

          <Card className="mobile-card rounded-[36px] border border-white/70 bg-white/85 p-4 shadow-[var(--shadow-soft)] backdrop-blur-xl sm:p-6">
            <Tabs value={activeMode} onValueChange={(value) => setActiveMode(value as "classic" | "ar" | "vr")}
              className="flex h-full w-full flex-col gap-6">
            <TabsList className="mobile-stack-gap mb-2 grid w-full grid-cols-1 gap-2 rounded-[24px] border border-white/60 bg-white/70 p-1.5 text-xs font-semibold uppercase tracking-widest text-muted-foreground sm:grid-cols-2 sm:mb-6 overflow-hidden">
                <TabsTrigger value="classic" className="w-full rounded-[20px] px-6 py-3 text-center text-[11px] data-[state=active]:bg-primary data-[state=active]:text-white sm:text-xs">
                  Mode Classic
                </TabsTrigger>
                <TabsTrigger value="ar" className="w-full rounded-[20px] px-6 py-3 text-center text-[11px] data-[state=active]:bg-secondary data-[state=active]:text-white sm:text-xs">
                  Mode AR
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
