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

      try {
        await initializeTracker();
        setTrackingActive(true);
        setHasLostAnchors(false);
        if (!silent) {
          toast.success("Tracking activé");
        }
        return true;
      } catch (error) {
        console.error(error);
        if (!silent) {
          toast.error(
            (error as Error).message ||
              "Impossible d'initialiser le tracking"
          );
        }
        trackerRef.current?.dispose();
        trackerRef.current = null;
        return false;
      } finally {
        if (!silent) {
          setIsInitializingTracking(false);
        }
      }
    },
    [
      configuredPoints.length,
      initializeTracker,
      streamActive,
      trackingReferenceImageUrl,
    ]
  );

  const stopTracking = useCallback(
    (options?: { silent?: boolean }) => {
      setTrackingActive(false);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      trackerRef.current?.dispose();
      trackerRef.current = null;
      smoothingRef.current.reset();
      lastGoodHomographyRef.current = null;
      anchorLossFramesRef.current = 0;
      setHasLostAnchors(false);

      const cv = (window as any).cv;
      if (cv) {
        warpResourcesRef.current.overlayMat?.delete?.();
        warpResourcesRef.current.warpedMat?.delete?.();
      }
      warpResourcesRef.current.overlayMat = null;
      warpResourcesRef.current.warpedMat = null;
      warpResourcesRef.current.warpedCanvas = null;

      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
      }

      if (!options?.silent) {
        toast.success("Tracking arrêté");
      }
    },
    []
  );

  const quickRestartTracking = useCallback(async () => {
    if (quickRestartingRef.current || !trackingActive) {
      return;
    }

    quickRestartingRef.current = true;
    stopTracking({ silent: true });
    await new Promise((resolve) => setTimeout(resolve, 160));
    const restarted = await startTracking({ silent: true });
    if (!restarted) {
      setHasLostAnchors(true);
    }
    quickRestartingRef.current = false;
  }, [startTracking, stopTracking, trackingActive]);

  const handleRepositionAnchors = () => {
    if (!configuredPoints.length) {
      toast.error("Aucune configuration d'ancrage disponible");
      return;
    }

    wasTrackingBeforeCalibrationRef.current = trackingActive;
    if (trackingActive) {
      stopTracking({ silent: true });
    }

    ctx.drawImage(video, 0, 0);
    const imageData = canvas.toDataURL("image/jpeg", 0.9);
    setCapturedImage(imageData);
    stopCamera();
    toast.success("Photo capturée");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    let lastTime = performance.now();
    const targetFPS = 30;
    const frameInterval = 1000 / targetFPS;

    const trackLoop = (currentTime: number) => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas) return;

      const ctx = canvas.getContext("2d", { alpha: false });
      if (!ctx) return;

      const elapsed = currentTime - lastTime;

      if (elapsed >= frameInterval) {
        lastTime = currentTime - (elapsed % frameInterval);

        // 1) Effacer le canvas et dessiner la vidéo
        ctx.fillStyle = "#000000";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.filter = `brightness(${brightness}%) contrast(${contrast}%)`;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        ctx.filter = "none";

        // 2) Récupérer la frame pour le tracker
        const frameImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const tracker = trackerRef.current;
        if (!tracker) {
          animationFrameRef.current = null;
          return;
        }

        const result = tracker.trackFrame(frameImageData);

        setMatchedPoints(result.matchedPoints);
        setTrackingStability(result.stability);

        const stablePointThreshold = Math.max(
          4,
          Math.floor(configuredPoints.length * 0.5)
        );
        const minimumContinuationPoints = Math.max(
          4,
          Math.floor(configuredPoints.length * 0.3)
        );
        const stabilityRatio = Math.max(
          0,
          Math.min(1, result.stability / 100)
        );

        const hasLiveHomography =
          result.isTracking &&
          !!result.homography &&
          result.matchedPoints >= minimumContinuationPoints;

        const trackingConfident =
          hasLiveHomography &&
          result.matchedPoints >= stablePointThreshold &&
          result.stability >= 35;

        // Fonction utilitaire de rendu de l'overlay à partir d'une homographie
        const renderOverlayWithHomography = (finalH: number[]) => {
          // Préparer/mettre à jour les ressources OpenCV
          let { overlayMat, warpedMat, warpedCanvas } =
            warpResourcesRef.current;

          if (!overlayMat) {
            // Création unique du Mat overlay à partir de l'image
            const overlayCanvas = document.createElement("canvas");
            overlayCanvas.width = overlayImage.width;
            overlayCanvas.height = overlayImage.height;
            const overlayCtx = overlayCanvas.getContext("2d", {
              alpha: true,
            })!;
            overlayCtx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
            overlayCtx.drawImage(overlayImage, 0, 0);
            const overlayImageData = overlayCtx.getImageData(
              0,
              0,
              overlayImage.width,
              overlayImage.height
            );
            overlayMat = cv.matFromImageData(overlayImageData);
            warpResourcesRef.current.overlayMat = overlayMat;
          }

          // Mat warpé à la taille du canvas
          if (
            !warpedMat ||
            warpedMat.cols !== canvas.width ||
            warpedMat.rows !== canvas.height
          ) {
            if (warpedMat) warpedMat.delete();
            warpedMat = new cv.Mat(
              canvas.height,
              canvas.width,
              overlayMat.type()
            );
            warpResourcesRef.current.warpedMat = warpedMat;
          }

          // Canvas tampon pour imshow
          if (
            !warpedCanvas ||
            warpedCanvas.width !== canvas.width ||
            warpedCanvas.height !== canvas.height
          ) {
            warpedCanvas = document.createElement("canvas");
            warpedCanvas.width = canvas.width;
            warpedCanvas.height = canvas.height;
            warpResourcesRef.current.warpedCanvas = warpedCanvas;
          }

          // Matrice H
          const HMat = cv.matFromArray(3, 3, cv.CV_64F, finalH);

          // Warp
          cv.warpPerspective(
            overlayMat,
            warpedMat,
            HMat,
            new cv.Size(canvas.width, canvas.height),
            cv.INTER_LINEAR,
            cv.BORDER_CONSTANT,
            new cv.Scalar(0, 0, 0, 0)
          );

          const warpedCtx = warpedCanvas.getContext("2d", {
            alpha: true,
          })!;
          cv.imshow(warpedCanvas, warpedMat);

          ctx.save();
          
          // Calculer l'opacité avec strobe si activé
          let currentOpacity = overlayOpacity[0] / 100;
          if (strobeEnabled) {
            const speed = strobeSpeed;
            const minOpacity = Math.min(strobeMinOpacity, strobeMaxOpacity) / 100;
            const maxOpacity = Math.max(strobeMinOpacity, strobeMaxOpacity) / 100;
            const range = Math.max(maxOpacity - minOpacity, 0);

            // Oscillation sinusoïdale
            const oscillation = (Math.sin(strobeAnimationRef.current) + 1) / 2; // Entre 0 et 1
            currentOpacity = range > 0 ? minOpacity + oscillation * range : minOpacity;
            strobeAnimationRef.current += 0.05 * speed;
          }

          ctx.globalAlpha = currentOpacity;
          ctx.globalCompositeOperation = "source-over";
          ctx.drawImage(warpedCanvas, 0, 0);
          ctx.restore();

          // Dessiner la grille si activée
          if (gridEnabled) {
            ctx.save();
            ctx.strokeStyle = `rgba(255, 255, 255, ${Math.min(Math.max(gridOpacity, 0), 100) / 100})`;
            ctx.lineWidth = 1;

            const tiles = Math.max(gridTileCount, 1);
            const spacingX = canvas.width / tiles;
            const spacingY = canvas.height / tiles;

            // Lignes verticales
            for (let x = 0; x <= canvas.width; x += spacingX) {
              ctx.beginPath();
              ctx.moveTo(x, 0);
              ctx.lineTo(x, canvas.height);
              ctx.stroke();
            }

            // Lignes horizontales
            for (let y = 0; y <= canvas.height; y += spacingY) {
              ctx.beginPath();
              ctx.moveTo(0, y);
              ctx.lineTo(canvas.width, y);
              ctx.stroke();
            }
            ctx.restore();
          }

          // Points de debug éventuels
          if (showDebugPoints) {
            configuredPoints.forEach((refPt, idx) => {
              const h = finalH;
              const w =
                h[6] * refPt.x + h[7] * refPt.y + h[8];
              if (Math.abs(w) < 0.001) return;

              const x = (h[0] * refPt.x + h[1] * refPt.y + h[2]) / w;
              const y = (h[3] * refPt.x + h[4] * refPt.y + h[5]) / w;

              ctx.beginPath();
              ctx.arc(x, y, 8, 0, 2 * Math.PI);
              ctx.fillStyle = "rgba(34, 197, 94, 0.8)";
              ctx.fill();
              ctx.strokeStyle = "#22c55e";
              ctx.lineWidth = 2;
              ctx.stroke();

              ctx.fillStyle = "white";
              ctx.font = "bold 12px sans-serif";
              ctx.textAlign = "center";
              ctx.textBaseline = "middle";
              ctx.fillText((idx + 1).toString(), x, y);
            });
          }

          HMat.delete();
        };

        // 3) Tracking normal → lissage + mémorisation dernière homographie fiable
        if (hasLiveHomography && result.homography) {
          try {
            const rawFinalH = multiplyHomographies(
              result.homography,
              overlayToReferenceHomography
            );
            const blend = trackingConfident
              ? stabilityRatio
              : Math.max(0.15, stabilityRatio * 0.5);
            const finalH = smoothingRef.current.smooth(rawFinalH, blend);
            lastGoodHomographyRef.current = finalH;
            renderOverlayWithHomography(finalH);
          } catch (error) {
            console.error("Warp failed:", error);
          }
        } else if (lastGoodHomographyRef.current) {
          // 4) Tracking incertain → on fige sur la dernière homographie propre
          const frozenH = smoothingRef.current.smooth(
            lastGoodHomographyRef.current,
            1
          );
          renderOverlayWithHomography(frozenH);
        }

        if (lastGoodHomographyRef.current) {
          const lostPointsRecently =
            !trackingConfident ||
            !result.isTracking ||
            result.matchedPoints < minimumContinuationPoints;

          if (lostPointsRecently) {
            anchorLossFramesRef.current += 1;
          } else if (anchorLossFramesRef.current !== 0) {
            anchorLossFramesRef.current = 0;
            if (hasLostAnchors) {
              setHasLostAnchors(false);
            }
          }

          if (
            anchorLossFramesRef.current > 12 &&
            !quickRestartingRef.current &&
            streamActive
          ) {
            if (!hasLostAnchors) {
              setHasLostAnchors(true);
            }
            quickRestartTracking();
            anchorLossFramesRef.current = 0;
          }
        }
      }

      if (trackerRef.current) {
        animationFrameRef.current = requestAnimationFrame(trackLoop);
      } else {
        animationFrameRef.current = null;
      }
    };

    animationFrameRef.current = requestAnimationFrame(trackLoop);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
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
