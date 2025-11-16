import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Camera, Plus, Trash2, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface Anchor {
  id: string;
  name: string;
  description: string | null;
  image_url: string;
  pattern_url: string | null;
  created_at: string;
}

interface AnchorManagerProps {
  onSelectAnchor: (anchor: Anchor) => void;
  selectedAnchorId: string | null;
}

const AnchorManager = ({ onSelectAnchor, selectedAnchorId }: AnchorManagerProps) => {
  const [anchors, setAnchors] = useState<Anchor[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCameraMode, setIsCameraMode] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load anchors
  useEffect(() => {
    loadAnchors();
  }, []);

  const loadAnchors = async () => {
    const { data, error } = await supabase.from("anchors").select("*").order("created_at", { ascending: false });

    if (error) {
      console.error("Erreur chargement ancres:", error);
      return;
    }

    setAnchors(data || []);
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsCameraMode(true);
    } catch (error) {
      console.error("Erreur caméra:", error);
      toast.error("Impossible d'accéder à la caméra");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraMode(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0);
    const imageData = canvas.toDataURL("image/jpeg", 0.9);
    setCapturedImage(imageData);
    stopCamera();
    toast.success("Photo capturée");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setCapturedImage(event.target?.result as string);
      toast.success("Image chargée");
    };
    reader.readAsDataURL(file);
  };

  const saveAnchor = async () => {
    if (!capturedImage || !name.trim()) {
      toast.error("Nom et image requis");
      return;
    }

    setIsUploading(true);

    try {
      // Convert base64 to blob
      const response = await fetch(capturedImage);
      const blob = await response.blob();

      // Upload to storage
      const fileName = `${Date.now()}-${name.replace(/\s+/g, "-")}.jpg`;
      const { error: uploadError } = await supabase.storage.from("anchors").upload(fileName, blob);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage.from("anchors").getPublicUrl(fileName);

      // Save to database
      const { error: dbError, data: anchorData } = await supabase
        .from("anchors")
        .insert({
          name: name.trim(),
          description: description.trim() || null,
          image_url: urlData.publicUrl,
        })
        .select()
        .single();

      if (dbError) throw dbError;

      toast.success("Ancre créée avec succès");
      setAnchors([anchorData, ...anchors]);
      resetForm();
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Erreur sauvegarde ancre:", error);
      toast.error("Impossible de sauvegarder l'ancre");
    } finally {
      setIsUploading(false);
    }
  };

  const deleteAnchor = async (id: string, imageUrl: string) => {
    try {
      // Delete from storage
      const fileName = imageUrl.split("/").pop();
      if (fileName) {
        await supabase.storage.from("anchors").remove([fileName]);
      }

      // Delete from database
      const { error } = await supabase.from("anchors").delete().eq("id", id);

      if (error) throw error;

      setAnchors(anchors.filter((a) => a.id !== id));
      toast.success("Ancre supprimée");
    } catch (error) {
      console.error("Erreur suppression:", error);
      toast.error("Impossible de supprimer l'ancre");
    }
  };

  const resetForm = () => {
    setCapturedImage(null);
    setName("");
    setDescription("");
    stopCamera();
  };

  return (
    <div className="space-y-4 w-full max-w-full overflow-y-auto">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Bibliothèque d'Ancres</h3>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={() => setIsDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Nouvelle Ancre
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Créer une ancre personnalisée</DialogTitle>
              <DialogDescription>
                Capturez ou importez une image détaillée pour générer une ancre utilisable en réalité augmentée.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 pb-2">
              {!capturedImage && !isCameraMode && (
                <div className="grid grid-cols-2 gap-4">
                  <Button variant="outline" className="h-32" onClick={startCamera}>
                    <div className="flex flex-col items-center gap-2">
                      <Camera className="w-8 h-8" />
                      <span>Prendre une photo</span>
                    </div>
                  </Button>
                  <Button variant="outline" className="h-32" onClick={() => fileInputRef.current?.click()}>
                    <div className="flex flex-col items-center gap-2">
                      <ImageIcon className="w-8 h-8" />
                      <span>Charger une image</span>
                    </div>
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                </div>
              )}

              {isCameraMode && (
                <div className="space-y-4">
                  <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                    <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={capturePhoto} className="flex-1">
                      <Camera className="w-4 h-4 mr-2" />
                      Capturer
                    </Button>
                    <Button variant="outline" onClick={stopCamera}>
                      Annuler
                    </Button>
                  </div>
                </div>
              )}

              {capturedImage && (
                <div className="space-y-4">
                  <div className="relative aspect-video rounded-lg overflow-hidden">
                    <img src={capturedImage} alt="Captured" className="w-full h-full object-cover" />
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="name">Nom de l'ancre *</Label>
                      <Input
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Ex: Mon logo, Marqueur table, etc."
                      />
                    </div>

                    <div>
                      <Label htmlFor="description">Description (optionnel)</Label>
                      <Textarea
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Ajoutez une description pour retrouver facilement cette ancre..."
                        rows={3}
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button onClick={saveAnchor} disabled={isUploading} className="flex-1">
                        {isUploading ? "Enregistrement..." : "Enregistrer l'ancre"}
                      </Button>
                      <Button variant="outline" onClick={resetForm}>
                        Recommencer
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <canvas ref={canvasRef} className="hidden" />

      {anchors.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground">
          <p>Aucune ancre créée</p>
          <p className="text-sm mt-2">
            Créez votre première ancre en prenant une photo d'un objet avec des détails visibles
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pb-2">
          {anchors.map((anchor) => (
            <Card
              key={anchor.id}
              className={`relative cursor-pointer transition-all hover:shadow-lg ${
                selectedAnchorId === anchor.id ? "ring-2 ring-primary" : ""
              }`}
              onClick={() => onSelectAnchor(anchor)}
            >
              <div className="aspect-square overflow-hidden rounded-t-lg">
                <img src={anchor.image_url} alt={anchor.name} className="w-full h-full object-cover" />
              </div>
              <div className="p-3">
                <h4 className="font-medium text-sm truncate">{anchor.name}</h4>
                {anchor.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{anchor.description}</p>
                )}
              </div>
              <Button
                size="sm"
                variant="destructive"
                className="absolute top-2 right-2"
                onClick={(e) => {
                  e.stopPropagation();
                  deleteAnchor(anchor.id, anchor.image_url);
                }}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AnchorManager;
