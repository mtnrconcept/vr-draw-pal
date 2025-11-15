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

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <div className="absolute left-14 top-28 h-72 w-72 rounded-full bg-primary/15 blur-3xl" />
        <div className="absolute right-10 top-20 h-80 w-80 rounded-full bg-secondary/25 blur-3xl" />
        <div className="absolute bottom-16 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-accent/25 blur-3xl" />
      </div>

      <div className="mx-auto w-full max-w-6xl px-4 pb-16 pt-24 sm:px-6 lg:px-8">
        <Card className="mb-10 flex flex-col gap-6 rounded-[40px] border border-white/60 bg-white/80 p-8 shadow-[var(--shadow-soft)] backdrop-blur-xl lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-semibold uppercase tracking-widest text-primary">
              Studio immersif
            </div>
            <h1 className="text-4xl font-bold leading-tight text-foreground sm:text-5xl">DrawMaster VR</h1>
            <p className="max-w-2xl text-base leading-relaxed text-muted-foreground">
              Composez vos séances de projection et de réalité augmentée dans une interface pensée pour les tablettes et casques VR. Ajustez la grille, activez le strobe et laissez le Ghost Mentor guider vos traits.
            </p>
          </div>

          <div className="flex flex-col gap-4 rounded-[28px] border border-white/60 bg-gradient-to-br from-primary/12 via-white/70 to-secondary/12 px-6 py-5 text-sm text-muted-foreground shadow-[var(--shadow-card)]">
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

        <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
          <Card className="flex flex-col gap-6 rounded-[36px] border border-white/60 bg-white/80 p-6 shadow-[var(--shadow-card)] backdrop-blur-xl">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">Modes de dessin</h2>
            <div className="grid gap-3">
              <Button
                variant={activeMode === "classic" ? "default" : "outline"}
                className={`h-14 justify-between rounded-[24px] px-6 text-sm font-semibold uppercase tracking-widest ${activeMode === "classic" ? "bg-primary text-white shadow-[0_18px_40px_-22px_rgba(92,80,255,0.7)]" : "border-white/60 bg-white/70 text-foreground shadow-inner shadow-white/50"}`}
                onClick={() => setActiveMode("classic")}
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/40 text-primary">
                    <Camera className="h-5 w-5" />
                  </span>
                  Mode Classic
                </div>
                <span className="text-xs">Projection directe</span>
              </Button>
              <Button
                variant={activeMode === "ar" ? "default" : "outline"}
                className={`h-14 justify-between rounded-[24px] px-6 text-sm font-semibold uppercase tracking-widest ${activeMode === "ar" ? "bg-secondary text-white shadow-[0_18px_40px_-22px_rgba(255,151,118,0.6)]" : "border-white/60 bg-white/70 text-foreground shadow-inner shadow-white/50"}`}
                onClick={() => setActiveMode("ar")}
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/40 text-secondary">
                    <Anchor className="h-5 w-5" />
                  </span>
                  Mode AR (Anchors)
                </div>
                <span className="text-xs">Réglages avancés</span>
              </Button>
              <Button
                variant="outline"
                className="h-14 justify-between rounded-[24px] px-6 text-sm font-semibold uppercase tracking-widest border-dashed border-white/70 bg-white/50 text-muted-foreground"
                disabled
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/40 text-muted-foreground">
                    <Grid className="h-5 w-5" />
                  </span>
                  Mode VR (Vision Pro)
                </div>
                <span className="text-xs">Bientôt</span>
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
            />
          </Card>

          <Card className="rounded-[36px] border border-white/60 bg-white/80 p-6 shadow-[var(--shadow-soft)] backdrop-blur-xl">
            <Tabs value={activeMode} onValueChange={(value) => setActiveMode(value as "classic" | "ar" | "vr")}
              className="flex h-full flex-col">
              <TabsList className="mb-6 grid grid-cols-2 rounded-[24px] border border-white/60 bg-white/70 p-1 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                <TabsTrigger value="classic" className="rounded-[20px] px-6 py-3 data-[state=active]:bg-primary data-[state=active]:text-white">
                  Mode Classic
                </TabsTrigger>
                <TabsTrigger value="ar" className="rounded-[20px] px-6 py-3 data-[state=active]:bg-secondary data-[state=active]:text-white">
                  Mode AR
                </TabsTrigger>
              </TabsList>

              <div className="flex-1">
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
