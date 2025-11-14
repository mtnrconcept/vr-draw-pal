import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";

import * as THREE from "three";
import { AprilTagDetector, loadWasm } from "@webarkit/apriltag";

interface ARAnchorsModeProps {
  referenceImage: string | null;
}

export default function ARAnchorsMode({ referenceImage }: ARAnchorsModeProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mountRef = useRef<HTMLDivElement>(null);

  const [detector, setDetector] = useState<AprilTagDetector | null>(null);
  const [streamActive, setStreamActive] = useState(false);
  const [detectedAnchors, setDetectedAnchors] = useState<any[]>([]);
  const [selectedAnchorId, setSelectedAnchorId] = useState<number | null>(null);

  const threeRef = useRef<{
    scene?: THREE.Scene;
    camera?: THREE.PerspectiveCamera;
    renderer?: THREE.WebGLRenderer;
    anchorPlane?: THREE.Mesh;
  }>({});

  // Load WASM + initialize detector
  useEffect(() => {
    loadWasm().then(() => {
      const det = new AprilTagDetector({
        inputImage: { width: 640, height: 480 },
        family: "tag36h11",
      });
      setDetector(det);
      toast.success("Module Anchors chargé (AprilTags)");
    });
  }, []);

  // Start camera
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: 640,
          height: 480,
        },
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

  // Initialize THREE for AR overlays
  const initThree = () => {
    if (!mountRef.current) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      50,
      window.innerWidth / window.innerHeight,
      0.01,
      100
    );
    camera.position.set(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      preserveDrawingBuffer: true,
    });

    renderer.setSize(window.innerWidth, window.innerHeight);
    mountRef.current.innerHTML = "";
    mountRef.current.appendChild(renderer.domElement);

    threeRef.current = { scene, camera, renderer };
  };

  // Add reference image plane once anchor selected
  const placeReferenceImage = (anchor: any) => {
    const { scene } = threeRef.current;
    if (!scene || !referenceImage) return;

    // Remove old plane
    if (threeRef.current.anchorPlane) {
      scene.remove(threeRef.current.anchorPlane);
    }

    const loader = new THREE.TextureLoader();
    loader.load(referenceImage, (texture) => {
      const aspect = texture.image.width / texture.image.height;
      const geometry = new THREE.PlaneGeometry(1, 1 / aspect);

      const material = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        opacity: 0.9,
        side: THREE.DoubleSide,
      });

      const plane = new THREE.Mesh(geometry, material);
      plane.position.set(anchor.centerX / 200 - 1.6, -anchor.centerY / 200 + 1.2, -2);
      plane.rotation.x = -Math.PI * 0.5;

      scene.add(plane);
      threeRef.current.anchorPlane = plane;

      toast.success("Ancre sélectionnée — tracking activé");
    });
  };

  // Detection loop
  useEffect(() => {
    if (!detector || !streamActive) return;

    initThree();

    const detectLoop = () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (!video || !canvas) return;

      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const detections = detector.detect(imageData);

      setDetectedAnchors(detections);

      // Update 3D tracking if an anchor is selected
      if (selectedAnchorId !== null) {
        const anchor = detections.find((d) => d.id === selectedAnchorId);
        if (anchor) {
          placeReferenceImage(anchor);
          renderThree();
        }
      }

      requestAnimationFrame(detectLoop);
    };

    detectLoop();
  }, [detector, streamActive, selectedAnchorId, referenceImage]);

  const renderThree = () => {
    const { scene, camera, renderer } = threeRef.current;
    if (scene && camera && renderer) {
      renderer.render(scene, camera);
    }
  };

  return (
    <div className="space-y-4">
      <Alert>
        <AlertDescription>
          Mode Anchres AR : vous voyez la caméra en direct, l’application détecte
          vos ancres (AprilTags), vous pouvez en sélectionner une pour activer le
          tracking 3D et y attacher votre image.
        </AlertDescription>
      </Alert>

      {/* Live video overlay */}
      <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-black">
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
        ></video>

        {/* Canvas pour la détection */}
        <canvas
          ref={canvasRef}
          width={640}
          height={480}
          className="absolute inset-0 w-full h-full opacity-0"
        />

        {/* THREE.js overlay */}
        <div
          ref={mountRef}
          className="absolute inset-0 pointer-events-none"
        ></div>

        {/* UI overlay detection */}
        {detectedAnchors.length > 0 && (
          <div className="absolute top-2 left-2 bg-white/80 p-2 rounded shadow text-black">
            <p className="font-semibold mb-1">Ancres détectées :</p>
            {detectedAnchors.map((a) => (
              <Button
                key={a.id}
                size="sm"
                className={`mr-2 ${
                  selectedAnchorId === a.id ? "bg-primary" : ""
                }`}
                onClick={() => setSelectedAnchorId(a.id)}
              >
                Ancre #{a.id}
              </Button>
            ))}
          </div>
        )}
      </div>

      {!streamActive && (
        <Button className="w-full" onClick={startCamera}>
          Activer la caméra
        </Button>
      )}

      {selectedAnchorId !== null && referenceImage && (
        <Card className="p-3">
          <p className="font-semibold text-primary">
            Tracking 3D actif sur l’ancre #{selectedAnchorId}
          </p>
          <p className="text-sm opacity-70">
            L’image est maintenant attachée à l’ancre et suivie en 3D.
          </p>
        </Card>
      )}
    </div>
  );
}
