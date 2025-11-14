import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Download } from "lucide-react";
import { toast } from "sonner";

interface ARModeProps {
  referenceImage: string | null;
  ghostMentorEnabled: boolean;
}

const ARMode = ({ referenceImage, ghostMentorEnabled }: ARModeProps) => {
  const [isTracking, setIsTracking] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<{
    scene?: any;
    camera?: any;
    renderer?: any;
    markerRoot?: any;
    mesh?: any;
    texture?: any;
    arToolkitSource?: any;
    arToolkitContext?: any;
  }>({});
  const animationFrameRef = useRef<number>();

  // Initialize AR.js with real marker tracking
  useEffect(() => {
    if (!containerRef.current) return;

    const initAR = async () => {
      try {
        // Wait for AR.js to be loaded
        const win = window as any;
        if (!win.THREEx || !win.THREE) {
          toast.error("AR.js n'est pas chargé");
          return;
        }

        const THREE = win.THREE;
        const THREEx = win.THREEx;

        // Create Three.js scene
        const scene = new THREE.Scene();
        
        // Create renderer
        const renderer = new THREE.WebGLRenderer({
          antialias: true,
          alpha: true,
          preserveDrawingBuffer: true
        });
        renderer.setClearColor(new THREE.Color("lightgrey"), 0);
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.domElement.style.position = "absolute";
        renderer.domElement.style.top = "0px";
        renderer.domElement.style.left = "0px";
        containerRef.current?.appendChild(renderer.domElement);

        // Create camera
        const camera = new THREE.Camera();
        scene.add(camera);

        // Initialize AR.js source (video)
        const arToolkitSource = new THREEx.ArToolkitSource({
          sourceType: "webcam",
          sourceWidth: 1280,
          sourceHeight: 960,
          displayWidth: window.innerWidth,
          displayHeight: window.innerHeight,
        });

        arToolkitSource.init(() => {
          setTimeout(() => {
            onResize();
          }, 2000);
        });

        // Handle window resize
        const onResize = () => {
          arToolkitSource.onResizeElement();
          arToolkitSource.copyElementSizeTo(renderer.domElement);
          if (arToolkitContext?.arController) {
            arToolkitSource.copyElementSizeTo(arToolkitContext.arController.canvas);
          }
        };

        window.addEventListener("resize", onResize);

        // Initialize AR.js context
        const arToolkitContext = new THREEx.ArToolkitContext({
          cameraParametersUrl:
            "https://raw.githubusercontent.com/AR-js-org/AR.js/master/data/data/camera_para.dat",
          detectionMode: "mono",
          maxDetectionRate: 60,
          canvasWidth: 1280,
          canvasHeight: 960,
        });

        arToolkitContext.init(() => {
          camera.projectionMatrix.copy(arToolkitContext.getProjectionMatrix());
        });

        // Create marker root (this will follow the marker)
        const markerRoot = new THREE.Group();
        scene.add(markerRoot);

        // Initialize marker controls (Hiro pattern)
        new THREEx.ArMarkerControls(arToolkitContext, markerRoot, {
          type: "pattern",
          patternUrl:
            "https://raw.githubusercontent.com/AR-js-org/AR.js/master/data/data/patt.hiro",
          changeMatrixMode: "cameraTransformMatrix",
        });

        // Add ambient light
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
        scene.add(ambientLight);

        sceneRef.current = {
          scene,
          camera,
          renderer,
          markerRoot,
          arToolkitSource,
          arToolkitContext,
        };

        toast.success("Système AR initialisé");
      } catch (error) {
        console.error("Erreur d'initialisation AR:", error);
        toast.error("Impossible d'initialiser l'AR");
      }
    };

    initAR();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (sceneRef.current.renderer) {
        sceneRef.current.renderer.dispose();
        sceneRef.current.renderer.domElement.remove();
      }
      if (sceneRef.current.texture) {
        sceneRef.current.texture.dispose();
      }
      if (sceneRef.current.arToolkitSource) {
        sceneRef.current.arToolkitSource.domElement?.remove();
      }
    };
  }, []);

  // Add reference image to marker when available
  useEffect(() => {
    if (referenceImage && isTracking && sceneRef.current.markerRoot) {
      const { markerRoot } = sceneRef.current;

      // Remove old mesh if exists
      if (sceneRef.current.mesh) {
        markerRoot.remove(sceneRef.current.mesh);
        sceneRef.current.mesh.geometry.dispose();
        if (Array.isArray(sceneRef.current.mesh.material)) {
          sceneRef.current.mesh.material.forEach((m) => m.dispose());
        } else {
          sceneRef.current.mesh.material.dispose();
        }
      }

      // Load and add new image
      const THREE = (window as any).THREE;
      const loader = new THREE.TextureLoader();
      loader.load(referenceImage, (texture) => {
        sceneRef.current.texture = texture;

        const aspectRatio = texture.image.width / texture.image.height;
        const planeWidth = 1.5; // Size of the plane relative to marker
        const planeHeight = planeWidth / aspectRatio;

        const geometry = new THREE.PlaneGeometry(planeWidth, planeHeight);
        const material = new THREE.MeshBasicMaterial({
          map: texture,
          transparent: true,
          opacity: ghostMentorEnabled ? 0.5 : 0.7,
          side: THREE.DoubleSide,
        });

        const mesh = new THREE.Mesh(geometry, material);

        // Position slightly above the marker
        mesh.position.y = planeHeight / 2;
        mesh.rotation.x = -Math.PI / 2; // Lay flat on the marker

        sceneRef.current.mesh = mesh;
        markerRoot.add(mesh);

        toast.success("Image de référence chargée");
      });
    }
  }, [referenceImage, isTracking, ghostMentorEnabled]);

  // AR.js rendering loop
  useEffect(() => {
    if (!isTracking) return;

    const { scene, camera, renderer, arToolkitSource, arToolkitContext } =
      sceneRef.current;
    if (!scene || !camera || !renderer || !arToolkitSource || !arToolkitContext)
      return;

    const animate = () => {
      if (!isTracking) return;

      animationFrameRef.current = requestAnimationFrame(animate);

      // Update AR.js
      if (arToolkitSource.ready) {
        arToolkitContext.update(arToolkitSource.domElement);
      }

      // Render the scene
      renderer.render(scene, camera);
    };

    animate();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isTracking]);

  const startTracking = () => {
    if (!referenceImage) {
      toast.error("Chargez une image de référence d'abord");
      return;
    }
    setIsTracking(true);
    toast.success("Tracking AR.js démarré");
  };

  const downloadAnchor = () => {
    // Download the Hiro marker (standard AR.js marker)
    const link = document.createElement("a");
    link.href =
      "https://raw.githubusercontent.com/AR-js-org/AR.js/master/data/images/hiro.png";
    link.download = "hiro-marker.png";
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Marqueur Hiro téléchargé - Imprimez-le en 10x10cm minimum");
  };

  return (
    <div className="space-y-4">
      <Alert>
        <AlertDescription>
          Le mode AR utilise AR.js pour un tracking 3D réel sur 6 axes (position
          X,Y,Z + rotation X,Y,Z). Téléchargez le marqueur Hiro, imprimez-le
          (minimum 10x10cm), et positionnez-le sur votre feuille.
        </AlertDescription>
      </Alert>

      <div
        ref={containerRef}
        className="relative w-full aspect-video bg-muted rounded-lg overflow-hidden"
        style={{ touchAction: "none" }}
      >
        {ghostMentorEnabled && isTracking && (
          <div className="absolute top-4 right-4 bg-primary/20 text-primary-foreground px-3 py-1 rounded-full text-sm backdrop-blur-sm z-10">
            Ghost Mentor + AR.js Tracking Actif
          </div>
        )}

        {!isTracking && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-10">
            <div className="text-center text-white space-y-4">
              <p className="mb-4">
                Positionnez le marqueur Hiro dans le champ de vision
              </p>
              <Button onClick={startTracking} disabled={!referenceImage}>
                Démarrer le tracking AR.js
              </Button>
            </div>
          </div>
        )}
      </div>

      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Marqueur AR.js</h3>
          <Button size="sm" variant="outline" onClick={downloadAnchor}>
            <Download className="w-4 h-4 mr-2" />
            Télécharger Marqueur Hiro
          </Button>
        </div>

        <div className="space-y-2 text-sm text-muted-foreground">
          <p>1. Téléchargez le marqueur Hiro</p>
          <p>2. Imprimez-le en taille minimum 10x10cm sur papier blanc</p>
          <p>3. Placez-le sur votre surface de dessin</p>
          <p>4. Chargez une image de référence et démarrez le tracking</p>
          <p className="text-primary font-medium mt-4">
            Le marqueur permet un tracking 6DoF complet : l&apos;image suivra
            tous vos mouvements de caméra
          </p>
        </div>
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
