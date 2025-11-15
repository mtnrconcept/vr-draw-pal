import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ClassicMode from "@/components/drawmaster/ClassicMode";
import ARMode from "@/components/drawmaster/ARMode";
import GhostMentor from "@/components/drawmaster/GhostMentor";
import DrawingTools from "@/components/drawmaster/DrawingTools";
import { Camera, Anchor, Ghost, Grid, Zap, Palette } from "lucide-react";

const DrawMasterVR = () => {
  const [activeMode, setActiveMode] = useState<"classic" | "ar" | "vr">("classic");
  const [ghostMentorEnabled, setGhostMentorEnabled] = useState(false);
  const [referenceImage, setReferenceImage] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border p-4">
        <div className="container mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">DrawMaster VR</h1>
          <div className="flex gap-2">
            <Button
              variant={ghostMentorEnabled ? "default" : "outline"}
              size="sm"
              onClick={() => setGhostMentorEnabled(!ghostMentorEnabled)}
            >
              <Ghost className="w-4 h-4 mr-2" />
              Ghost Mentor
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-4">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Mode Selection */}
          <Card className="lg:col-span-1 p-4">
            <h2 className="text-lg font-semibold mb-4">Modes de dessin</h2>
            <div className="space-y-2">
              <Button
                variant={activeMode === "classic" ? "default" : "outline"}
                className="w-full justify-start"
                onClick={() => setActiveMode("classic")}
              >
                <Camera className="w-4 h-4 mr-2" />
                Mode Classic
              </Button>
              <Button
                variant={activeMode === "ar" ? "default" : "outline"}
                className="w-full justify-start"
                onClick={() => setActiveMode("ar")}
              >
                <Anchor className="w-4 h-4 mr-2" />
                Mode AR (Anchors)
              </Button>
              <Button
                variant={activeMode === "vr" ? "default" : "outline"}
                className="w-full justify-start"
                onClick={() => setActiveMode("vr")}
                disabled
              >
                <Grid className="w-4 h-4 mr-2" />
                Mode VR (Vision Pro)
                <span className="ml-auto text-xs text-muted-foreground">Bientôt</span>
              </Button>
            </div>

            <DrawingTools 
              referenceImage={referenceImage}
              onImageSelect={setReferenceImage}
            />
          </Card>

          {/* Main Canvas Area */}
          <Card className="lg:col-span-3 p-4 min-h-[600px]">
            <Tabs value={activeMode} className="w-full">
              <TabsContent value="classic" className="mt-0">
                <ClassicMode
                  referenceImage={referenceImage}
                  ghostMentorEnabled={ghostMentorEnabled}
                />
              </TabsContent>
              <TabsContent value="ar" className="mt-0">
                <ARMode
                  referenceImage={referenceImage}
                />
              </TabsContent>
            </Tabs>

            {ghostMentorEnabled && (
              <GhostMentor
                mode={activeMode}
                referenceImage={referenceImage}
              />
            )}
          </Card>
        </div>
      </main>
    </div>
  );
};

export default DrawMasterVR;
