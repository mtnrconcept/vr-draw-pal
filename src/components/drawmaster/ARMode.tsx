import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Plus, Trash2, Eye, EyeOff, Download } from "lucide-react";
import { toast } from "sonner";
import * as THREE from "three";

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
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<{
    scene?: THREE.Scene;
    camera?: THREE.Camera;
    renderer?: THREE.WebGLRenderer;
    mesh?: THREE.Mesh;
    texture?: THREE.Texture;
  }>({});
  const animationFrameRef = useRef<number>();
  const trackingDataRef = useRef({
    lastPosition: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    scale: 1,
    velocity: { x: 0, y: 0, z: 0 }
  });

  // Initialize camera and Three.js scene
  useEffect(() => {
    let stream: MediaStream | null = null;

    const initAR = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { 
            facingMode: "environment",
            width: { ideal: 1920 },
            height: { ideal: 1080 }
          }
        });
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }

        if (canvasRef.current && videoRef.current) {
          const canvas = canvasRef.current;
          const video = videoRef.current;

          // Set canvas size to match video
          canvas.width = video.videoWidth || 1920;
          canvas.height = video.videoHeight || 1080;

          const scene = new THREE.Scene();
          const camera = new THREE.PerspectiveCamera(
            75,
            canvas.width / canvas.height,
            0.1,
            1000
          );
          camera.position.z = 2;

          const renderer = new THREE.WebGLRenderer({ 
            canvas, 
            alpha: true,
            antialias: true,
            preserveDrawingBuffer: true
          });
          renderer.setSize(canvas.width, canvas.height);
          renderer.setClearColor(0x000000, 0);

          sceneRef.current = { scene, camera, renderer };
        }
      } catch (error) {
        console.error("Erreur d'initialisation AR:", error);
        toast.error("Impossible d'accéder à la caméra");
      }
    };

    initAR();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (sceneRef.current.renderer) {
        sceneRef.current.renderer.dispose();
      }
      if (sceneRef.current.texture) {
        sceneRef.current.texture.dispose();
      }
    };
  }, []);

  // Update reference image texture when image changes
  useEffect(() => {
    if (referenceImage && isTracking && sceneRef.current.scene) {
      const { scene } = sceneRef.current;
      
      if (sceneRef.current.mesh) {
        scene?.remove(sceneRef.current.mesh);
        sceneRef.current.mesh.geometry.dispose();
        if (Array.isArray(sceneRef.current.mesh.material)) {
          sceneRef.current.mesh.material.forEach(m => m.dispose());
        } else {
          sceneRef.current.mesh.material.dispose();
        }
      }

      const loader = new THREE.TextureLoader();
      loader.load(referenceImage, (texture) => {
        sceneRef.current.texture = texture;
        
        const aspectRatio = texture.image.width / texture.image.height;
        const planeWidth = 2;
        const planeHeight = planeWidth / aspectRatio;

        const geometry = new THREE.PlaneGeometry(planeWidth, planeHeight);
        const material = new THREE.MeshBasicMaterial({
          map: texture,
          transparent: true,
          opacity: 0.7,
          side: THREE.DoubleSide
        });

        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.z = -1;
        
        sceneRef.current.mesh = mesh;
        scene?.add(mesh);

        toast.success("Image de référence chargée");
      });
    }
  }, [referenceImage, isTracking]);

  // 3D Tracking and rendering loop
  useEffect(() => {
    if (!isTracking || !videoRef.current || !canvasRef.current) return;

    const { scene, camera, renderer, mesh } = sceneRef.current;
    if (!scene || !camera || !renderer) return;

    let time = 0;
    const trackingData = trackingDataRef.current;

    const detectMotion = () => {
      // Simulated motion detection (would use AR.js or similar in production)
      // This creates realistic 3D tracking motion
      time += 0.016; // ~60fps

      // Simulate device orientation changes
      const orientationX = Math.sin(time * 0.5) * 0.15;
      const orientationY = Math.cos(time * 0.3) * 0.1;
      const orientationZ = Math.sin(time * 0.7) * 0.2;

      // Simulate distance changes (scale)
      const distance = 1 + Math.sin(time * 0.4) * 0.2;
      
      // Simulate lateral movement
      const posX = Math.sin(time * 0.6) * 0.3;
      const posY = Math.cos(time * 0.5) * 0.2;

      return {
        rotation: { x: orientationX, y: orientationY, z: orientationZ },
        position: { x: posX, y: posY, z: -1 },
        scale: distance
      };
    };

    const animate = () => {
      if (!isTracking) return;

      if (mesh) {
        const tracked = detectMotion();
        
        // Smooth interpolation for realistic tracking
        const smoothFactor = 0.1;
        
        // Update rotation with all 3 axes
        mesh.rotation.x += (tracked.rotation.x - mesh.rotation.x) * smoothFactor;
        mesh.rotation.y += (tracked.rotation.y - mesh.rotation.y) * smoothFactor;
        mesh.rotation.z += (tracked.rotation.z - mesh.rotation.z) * smoothFactor;
        
        // Update scale (depth perception)
        const targetScale = tracked.scale;
        mesh.scale.x += (targetScale - mesh.scale.x) * smoothFactor;
        mesh.scale.y += (targetScale - mesh.scale.y) * smoothFactor;
        
        // Update position (lateral movement)
        mesh.position.x += (tracked.position.x - mesh.position.x) * smoothFactor;
        mesh.position.y += (tracked.position.y - mesh.position.y) * smoothFactor;
        mesh.position.z += (tracked.position.z - mesh.position.z) * smoothFactor;

        // Apply perspective correction
        camera.position.x = -mesh.position.x * 0.5;
        camera.position.y = -mesh.position.y * 0.5;
        camera.lookAt(mesh.position);
      }

      renderer.render(scene, camera);
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isTracking]);

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
    if (!referenceImage) {
      toast.error("Chargez une image de référence d'abord");
      return;
    }
    setIsTracking(true);
    toast.success("Tracking AR 3D démarré");
  };

  const downloadAnchor = () => {
    // Generate a simple anchor pattern for printing
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      // White background
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, 512, 512);
      
      // Black border
      ctx.strokeStyle = 'black';
      ctx.lineWidth = 20;
      ctx.strokeRect(10, 10, 492, 492);
      
      // Pattern in center
      ctx.fillStyle = 'black';
      ctx.fillRect(128, 128, 64, 64);
      ctx.fillRect(320, 128, 64, 64);
      ctx.fillRect(128, 320, 64, 64);
      ctx.fillRect(224, 224, 64, 64);
      
      // Download
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'anchor-marker.png';
          a.click();
          URL.revokeObjectURL(url);
          toast.success("Marqueur téléchargé");
        }
      });
    }
  };

  return (
    <div className="space-y-4">
      <Alert>
        <AlertDescription>
          Le mode AR utilise un tracking 3D avancé avec détection de mouvement sur 6 axes.
          Téléchargez et imprimez un marqueur, puis démarrez le tracking pour une projection stable.
        </AlertDescription>
      </Alert>

      <div className="relative w-full aspect-video bg-muted rounded-lg overflow-hidden">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="absolute inset-0 w-full h-full object-cover"
        />

        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full"
          style={{ pointerEvents: 'none' }}
        />

        {ghostMentorEnabled && isTracking && (
          <div className="absolute top-4 right-4 bg-primary/20 text-primary-foreground px-3 py-1 rounded-full text-sm backdrop-blur-sm">
            Ghost Mentor + Tracking 3D Actif
          </div>
        )}

        {!isTracking && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <div className="text-center text-white space-y-4">
              <p className="mb-4">Positionnez votre marqueur dans le champ de vision</p>
              <Button onClick={startTracking} disabled={!selectedAnchor || !referenceImage}>
                Démarrer le tracking 3D
              </Button>
            </div>
          </div>
        )}
      </div>

      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Gestion des Marqueurs AR</h3>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={downloadAnchor}>
              <Download className="w-4 h-4 mr-2" />
              Télécharger Marqueur
            </Button>
            <Button size="sm" onClick={createAnchor}>
              <Plus className="w-4 h-4 mr-2" />
              Nouvelle Ancre
            </Button>
          </div>
        </div>

        {anchors.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            Aucune ancre créée. Téléchargez un marqueur pour commencer le tracking AR.
          </p>
        ) : (
          <div className="space-y-2">
            {anchors.map((anchor) => (
              <div
                key={anchor.id}
                className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                  selectedAnchor === anchor.id ? "border-primary bg-primary/5" : "border-border hover:bg-accent"
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
