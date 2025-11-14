import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Plus, Trash2, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

interface Anchor {
  id: string;
  name: string;
  image: string;
  position: { x: number; y: number };
  isActive: boolean;
}

interface ARModeProps {
  referenceImage: string | null;
  ghostMentorEnabled: boolean;
}

const ARMode = ({ referenceImage, ghostMentorEnabled }: ARModeProps) => {
  const [anchors, setAnchors] = useState<Anchor[]>([]);
  const [selectedAnchor, setSelectedAnchor] = useState<string | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const initCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" }
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error("Erreur d'accès à la caméra:", error);
        toast.error("Impossible d'accéder à la caméra");
      }
    };

    initCamera();

    return () => {
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const createAnchor = () => {
    const newAnchor: Anchor = {
      id: `anchor-${Date.now()}`,
      name: `Ancre ${anchors.length + 1}`,
      image: "",
      position: { x: 0, y: 0 },
      isActive: false
    };
    setAnchors([...anchors, newAnchor]);
    toast.success("Nouvelle ancre créée");
  };

  const deleteAnchor = (id: string) => {
    setAnchors(anchors.filter(a => a.id !== id));
    if (selectedAnchor === id) {
      setSelectedAnchor(null);
    }
    toast.success("Ancre supprimée");
  };

  const toggleAnchor = (id: string) => {
    setAnchors(anchors.map(a => 
      a.id === id ? { ...a, isActive: !a.isActive } : a
    ));
  };

  const startTracking = () => {
    if (!selectedAnchor) {
      toast.error("Sélectionnez une ancre pour commencer le tracking");
      return;
    }
    setIsTracking(true);
    toast.success("Tracking AR démarré");
  };

  return (
    <div className="space-y-4">
      <Alert>
        <AlertDescription>
          Le mode AR utilise des repères visuels (anchors) pour stabiliser la projection de l'image de référence. 
          Créez une ancre, placez-la sur votre support, puis l'image suivra l'ancre automatiquement.
        </AlertDescription>
      </Alert>

      <div className="relative w-full aspect-video bg-muted rounded-lg overflow-hidden">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />

        {isTracking && referenceImage && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <img
              src={referenceImage}
              alt="Reference"
              className="max-w-full max-h-full opacity-70"
            />
            {ghostMentorEnabled && (
              <div className="absolute top-4 right-4 bg-primary/20 text-primary-foreground px-3 py-1 rounded-full text-sm">
                Ghost Mentor Actif
              </div>
            )}
          </div>
        )}

        {!isTracking && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <div className="text-center text-white">
              <p className="mb-4">Positionnez votre ancre dans le champ de vision</p>
              <Button onClick={startTracking} disabled={!selectedAnchor || !referenceImage}>
                Démarrer le tracking AR
              </Button>
            </div>
          </div>
        )}
      </div>

      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Gestion des Anchors</h3>
          <Button size="sm" onClick={createAnchor}>
            <Plus className="w-4 h-4 mr-2" />
            Nouvelle Ancre
          </Button>
        </div>

        {anchors.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            Aucune ancre créée. Créez une ancre pour commencer le tracking AR.
          </p>
        ) : (
          <div className="space-y-2">
            {anchors.map((anchor) => (
              <div
                key={anchor.id}
                className={`flex items-center justify-between p-3 rounded-lg border ${
                  selectedAnchor === anchor.id ? "border-primary bg-primary/5" : "border-border"
                }`}
                onClick={() => setSelectedAnchor(anchor.id)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                    {anchor.image ? (
                      <img src={anchor.image} alt={anchor.name} className="w-full h-full object-cover rounded" />
                    ) : (
                      <span className="text-xs text-muted-foreground">Ancre</span>
                    )}
                  </div>
                  <div>
                    <p className="font-medium">{anchor.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {anchor.isActive ? "Active" : "Inactive"}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleAnchor(anchor.id);
                    }}
                  >
                    {anchor.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteAnchor(anchor.id);
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {isTracking && (
        <Button
          variant="destructive"
          className="w-full"
          onClick={() => {
            setIsTracking(false);
            toast.info("Tracking AR arrêté");
          }}
        >
          Arrêter le tracking
        </Button>
      )}
    </div>
  );
};

export default ARMode;
