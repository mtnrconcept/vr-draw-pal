import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Download } from "lucide-react";
import { toast } from "sonner";
import * as THREE from "three";
// @ts-ignore - AR.js types not available
import * as THREEx from "@ar-js-org/ar.js/three.js/build/ar-threex";

interface ARModeProps {
  referenceImage: string | null;
  ghostMentorEnabled: boolean;
}

type SceneState = {
  scene?: THREE.Scene;
  camera?: THREE.Camera;
  renderer?: THREE.WebGLRenderer;
  markerRoot?: THREE.Group;
  mesh?: THREE.Mesh;
  texture?: THREE.Texture;
  arToolkitSource?: any;
  arToolkitContext?: any;
  resizeHandler?: () => void;
};

const ARMode = ({ referenceImage, ghostMentorEnabled }: ARModeProps) => {
  const [isTracking, setIsTracking] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<SceneState>({});
  const animationFrameRef = useRef<number>();
  const initializedRef = useRef(false);

  /**
   * Initialisation AR.js (appelée une seule fois, sur clic utilisateur)
   */
  const initAR = async () => {
    if (initializedRef.current) return;
    if (!containerRef.current) return;

    setIsInitializing(true);

    try {
      // Create Three.js scene
      const scene = new THREE.Scene();

      // Create renderer
      const renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        preserveDrawingBuffer: true,
      });
      renderer.setClearColor(new THREE.Color("lightgrey"), 0);
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.domElement.style.position = "absolute";
      renderer.domElement.style.top = "0px";
      renderer.domElement.style.left = "0px";
      containerRef.current.appendChild(renderer.domElement);

      // Create camera
      const camera = new THREE.Camera();
      scene.add(camera);

      // Initialize AR.js source (video)
      const arToolkitSource = new (THREEx as any).ArToolkitSource({
        sourceType: "webcam",
        // important pour mobile : tu peux forcer la back camera via constraints si besoin
        // sourceWidth: 1280,
        // sourceHeight: 960,
        displayWidth: window.innerWidth,
        displayHeight: window.innerHeight,
      });

      // On resize handler
      const resizeHandler = () => {
        arToolkitSource.onResizeElement();
        arToolkitSource.copyElementSizeTo(renderer.domElement);
        if (arToolkitContext.arController) {
          arToolkitSource.copyElementSizeTo(
            arToolkitContext.arController.canvas
          );
        }
      };

      // Initialize AR.js context
      const arToolkitContext = new (THREEx as any).ArToolkitContext({
        cameraParametersUrl:
          "https://raw.githubusercontent.com/AR-js-org/AR.js/master/data/data/camera_para.dat",
        detectionMode: "mono",
        maxDetectionRate: 60,
        canvasWidth: 1280,
        canvasHeight: 960,
      });

      // Init camera + projection matrix une fois le contexte prêt
      arToolkitContext.init(() => {
        camera.projectionMatrix.copy(arToolkitContext.getProjectionMatrix());
      });

      // Init video source APRÈS le clic utilisateur
      // -> cela déclenche getUserMedia dans un contexte user-gesture
      arToolkitSource.init(() => {
        resizeHandler();
      });

      window.addEventListener("resize", resizeHandler);

      // Create marker root (this will follow the marker)
      const markerRoot = new THREE.Group();
      scene.add(markerRoot);

      // Initialize marker controls (Hiro pattern)
      new (THREEx as any).ArMarkerControls(arToolkitContext, markerRoot, {
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
        resizeHandler,
      };

      initializedRef.current = true;
      toast.success("Système AR initialisé, la caméra devrait s’activer.");
    } catch (error) {
      console.error("Erreur d'initialisation AR:", error);
      toast.error("Impossible d'initialiser l'AR (caméra / permissions ?)");
    } finally {
      setIsInitializing(false);
    }
  };

  /**
   * Nettoyage global à l’unmount
   */
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      const {
        renderer,
        texture,
        arToolkitSource,
        resizeHandler,
        arToolkitContext,
      } = sceneRef.current;

      if (renderer) {
        renderer.dispose();
        renderer.domElement.remove();
      }
      if (texture) {
        texture.dispose();
      }
      if (arToolkitSource && arToolkitSource.domElement) {
        arToolkitSource.domElement.remove();
      }
      if (resizeHandler) {
        window.removeEventListener("resize", resizeHandler);
      }
      if (arToolkitContext && arToolkitContext.arController) {
        arToolkitContext.arController.dispose?.();
      }
    };
  }, []);

  /**
   * Ajout / mise à jour de l’image de référence sur le marqueur
   */
  useEffect(() => {
    if (
      referenceImage &&
      isTracking &&
      sceneRef.current.markerRoot &&
      sceneRef.current.scene
    ) {
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

        // Position slightly au-dessus du marker
        mesh.position.y = planeHeight / 2;
        mesh.rotation.x = -Math.PI / 2; // Lay flat on the marker

        sceneRef.current.mesh = mesh;
        markerRoot.add(mesh);

        toast.success("Image de référence chargée sur le marqueur");
      });
    }
  }, [referenceImage, isTracking, ghostMentorEnabled]);

  /**
   * Boucle de rendu AR.js
   */
  useEffect(() => {
    if (!isTracking) return;

    const {
      scene,
      camera,
      renderer,
      arToolkitSource,
      arToolkitContext,
    } = sceneRef.current;

    if (!scene || !camera || !renderer || !arToolkitSource || !arToolkitContext)
      return;

    const animate = () => {
      if (!isTracking) return;

      animationFrameRef.current = requestAnimationFrame(animate);

      if (arToolkitSource.ready) {
        arToolkitContext.update(arToolkitSource.domElement);
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isTracking]);

  /**
   * Démarrage du tracking (et init AR si nécessaire)
   */
  const startTracking = async () => {
    if (!referenceImage) {
      toast.error("Chargez une image de référence d'abord");
      return;
    }

    // Init AR (caméra) sur clic utilisateur
    await initAR();

    if (!initializedRef.current) {
      // si init a échoué (permissions refusées, etc.)
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
          (minimum 10x10cm), et positionnez-le sur votre feuille. La caméra ne
          s'activera qu&apos;à la première pression sur &quot;Démarrer le
          tracking&quot; (exigence navigateur).
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
              <p className="mb-2">
                Positionnez le marqueur Hiro dans le champ de vision
              </p>
              <p className="mb-4 text-xs opacity-80">
                Au clic, la caméra sera sollicitée. Acceptez l&apos;accès pour
                activer l&apos;AR.
              </p>
              <Button
                onClick={startTracking}
                disabled={!referenceImage || isInitializing}
              >
                {isInitializing
                  ? "Initialisation AR..."
                  : "Démarrer le tracking AR.js"}
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
            tous vos mouvements de caméra.
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
