import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import * as THREE from "three";
import { OpenCVTracker, TrackingPoint } from "@/lib/opencv/tracker";
import PointTrackingManager from "./PointTrackingManager";

interface ARAnchorsModeProps {
  referenceImage: string | null;
  ghostMentorEnabled?: boolean;
}

export default function ARAnchorsMode({ referenceImage }: ARAnchorsModeProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mountRef = useRef<HTMLDivElement>(null);
  const trackerRef = useRef<OpenCVTracker | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const [streamActive, setStreamActive] = useState(false);
  const [trackingActive, setTrackingActive] = useState(false);
  const [trackingStability, setTrackingStability] = useState(0);
  const [matchedPoints, setMatchedPoints] = useState(0);
  const [configuredPoints, setConfiguredPoints] = useState<TrackingPoint[]>([]);
  const [referenceImageUrl, setReferenceImageUrl] = useState<string | null>(null);

  const threeRef = useRef<{
    scene?: THREE.Scene;
    camera?: THREE.PerspectiveCamera;
    renderer?: THREE.WebGLRenderer;
    referencePlane?: THREE.Mesh;
  }>({});

  // Check if OpenCV is loaded
  useEffect(() => {
    const checkOpenCV = () => {
      if ((window as any).cv) {
        toast.success("OpenCV chargé et prêt");
      } else {
        toast.error("OpenCV non disponible. Rechargez la page.");
      }
    };
    
    if (document.readyState === "complete") {
      checkOpenCV();
    } else {
      window.addEventListener("load", checkOpenCV);
      return () => window.removeEventListener("load", checkOpenCV);
    }
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: 1280, height: 720 }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setStreamActive(true);
      toast.success("Caméra activée");
    } catch (err) {
      console.error(err);
      toast.error("Impossible d'accéder à la caméra");
    }
  };

  const initThree = () => {
    if (!mountRef.current) return;

    const scene = new THREE.Scene();
    const canvas = canvasRef.current;
    if (!canvas) return;

    const camera = new THREE.PerspectiveCamera(
      50,
      canvas.width / canvas.height,
      0.1,
      1000
    );
    camera.position.set(0, 0, 5);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(canvas.width, canvas.height);
    mountRef.current.innerHTML = "";
    mountRef.current.appendChild(renderer.domElement);

    threeRef.current = { scene, camera, renderer };
  };

  const updateReferencePlane = (homography: number[]) => {
    const { scene, referencePlane } = threeRef.current;
    if (!scene || !referenceImageUrl) return;

    if (!referencePlane) {
      const loader = new THREE.TextureLoader();
      loader.load(referenceImageUrl, (texture) => {
        const aspect = texture.image.width / texture.image.height;
        const geometry = new THREE.PlaneGeometry(2, 2 / aspect);
        const material = new THREE.MeshBasicMaterial({
          map: texture,
          transparent: true,
          opacity: 0.8,
          side: THREE.DoubleSide
        });

        const plane = new THREE.Mesh(geometry, material);
        scene.add(plane);
        threeRef.current.referencePlane = plane;
      });
    }

    if (referencePlane && homography) {
      const matrix = new THREE.Matrix4();
      matrix.set(
        homography[0], homography[1], 0, homography[2],
        homography[3], homography[4], 0, homography[5],
        0, 0, 1, 0,
        homography[6], homography[7], 0, homography[8]
      );
      referencePlane.matrix.copy(matrix);
      referencePlane.matrixAutoUpdate = false;
    }
  };

  const startTracking = () => {
    if (!streamActive || configuredPoints.length < 4) {
      toast.error("Configurez d'abord les points de tracking");
      return;
    }

    if (!(window as any).cv) {
      toast.error("OpenCV non chargé");
      return;
    }

    initThree();
    trackerRef.current = new OpenCVTracker();

    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    
    trackerRef.current.initializeReferencePoints(imageData, configuredPoints);
    setTrackingActive(true);
    toast.success("Tracking activé");
  };

  useEffect(() => {
    if (!trackingActive || !trackerRef.current || !streamActive) return;

    const trackLoop = () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (!video || !canvas) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

      const result = trackerRef.current!.trackFrame(imageData);
      
      setMatchedPoints(result.matchedPoints);
      setTrackingStability(result.stability);

      if (result.isTracking && result.homography) {
        updateReferencePlane(result.homography);
        renderThree();
      }

      animationFrameRef.current = requestAnimationFrame(trackLoop);
    };

    trackLoop();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [trackingActive, streamActive]);

  const renderThree = () => {
    const { scene, camera, renderer } = threeRef.current;
    if (scene && camera && renderer) {
      renderer.render(scene, camera);
    }
  };

  const handleConfigurationReady = (refImage: string, points: TrackingPoint[]) => {
    setReferenceImageUrl(refImage);
    setConfiguredPoints(points);
    toast.success(`Configuration prête avec ${points.length} points`);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
      <div className="lg:col-span-1 space-y-4">
        <PointTrackingManager onConfigurationReady={handleConfigurationReady} />
      </div>

      <div className="lg:col-span-3 space-y-4">
        <Alert>
          <AlertDescription>
            Mode AR par Points : Dessinez des points sur votre feuille, configurez-les, 
            puis activez le tracking pour projeter votre image de référence.
          </AlertDescription>
        </Alert>

        <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-black">
          <video
            ref={videoRef}
            className="absolute inset-0 w-full h-full object-cover"
          />

          <canvas
            ref={canvasRef}
            width={1280}
            height={720}
            className="absolute inset-0 w-full h-full opacity-0"
          />

          <div
            ref={mountRef}
            className="absolute inset-0 pointer-events-none"
          />

          {trackingActive && (
            <div className="absolute top-2 right-2 bg-black/70 text-white p-3 rounded-lg space-y-1">
              <p className="text-xs font-semibold">Tracking actif</p>
              <div className="flex items-center gap-2">
                <div className="w-24 h-2 bg-white/20 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all"
                    style={{ width: `${trackingStability}%` }}
                  />
                </div>
                <span className="text-xs">{Math.round(trackingStability)}%</span>
              </div>
              <p className="text-xs">Points: {matchedPoints}</p>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          {!streamActive ? (
            <Button className="flex-1" onClick={startCamera}>
              Activer la caméra
            </Button>
          ) : (
            <Button 
              className="flex-1" 
              onClick={startTracking}
              disabled={configuredPoints.length < 4 || trackingActive}
            >
              {trackingActive ? "Tracking actif" : "Démarrer le tracking"}
            </Button>
          )}
        </div>

        {trackingActive && (
          <Card className="p-3 bg-primary/10 border-primary">
            <p className="font-semibold text-sm">Tracking 3D actif</p>
            <p className="text-xs text-muted-foreground">
              L'image de référence est projetée selon vos points de tracking
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
