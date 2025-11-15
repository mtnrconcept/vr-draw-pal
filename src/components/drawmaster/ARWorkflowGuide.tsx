import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import {
  Camera,
  SlidersHorizontal,
  Crosshair,
  MapPinned,
  Grid3X3,
  Scan,
  Layers,
  Monitor,
  RefreshCcw
} from "lucide-react";
import type { ReactNode } from "react";

interface WorkflowStep {
  id: number;
  title: string;
  description: string;
  input: string;
  output: string;
  operations: string[];
  icon: ReactNode;
}

const workflowSteps: WorkflowStep[] = [
  {
    id: 1,
    title: "Caméra",
    description: "Acquisition du flux vidéo brut en 30 ou 60 fps depuis la caméra de l'appareil (getUserMedia).",
    input: "Scène physique filmée par l'utilisateur",
    output: "image(t) — frame vidéo courante",
    operations: ["Sélection de la caméra dorsale", "Initialisation du flux asynchrone"],
    icon: <Camera className="h-4 w-4" />
  },
  {
    id: 2,
    title: "Prétraitement",
    description: "Normalisation des frames pour stabiliser les étapes de vision par ordinateur.",
    input: "image(t)",
    output: "I(t) — image nettoyée et redimensionnée",
    operations: [
      "Resize / crop vers une résolution fixe (ex. 640×480)",
      "Denoise, equalize et correction de lumière",
      "Conversion en niveaux de gris si la détection l'exige"
    ],
    icon: <SlidersHorizontal className="h-4 w-4" />
  },
  {
    id: 3,
    title: "Détection des points / ancres",
    description:
      "Extraction des points d'intérêt sur la feuille via coins dessinés, marqueurs ArUco/AprilTag ou assistance VLM ponctuelle.",
    input: "I(t)",
    output: "{p_img_i(t)} — coordonnées 2D des points détectés",
    operations: [
      "FAST / Harris / Shi–Tomasi ou détection de tags",
      "Filtrage / clustering pour isoler les 4 coins utiles",
      "Option : requête VLM pour initialiser ou corriger les coordonnées"
    ],
    icon: <Crosshair className="h-4 w-4" />
  },
  {
    id: 4,
    title: "Correspondances plan ↔ image",
    description: "Appairage entre les points détectés et le repère 2D défini sur la feuille physique.",
    input: "{p_img_i(t)} et points du plan {p_plane_i}",
    output: "Paires (x_plane, y_plane) ↔ (x_img, y_img)",
    operations: [
      "Définition du repère feuille (0,0)-(W,H)",
      "Tri des points pour respecter l'ordre logique",
      "Association robuste même en présence d'ambiguïtés"
    ],
    icon: <MapPinned className="h-4 w-4" />
  },
  {
    id: 5,
    title: "Estimation de l'homographie",
    description: "Calcul de la matrice 3×3 projetant le plan feuille dans l'espace image.",
    input: "Correspondances plan ↔ image",
    output: "H(t) — matrice d'homographie",
    operations: [
      "cv::findHomography avec RANSAC",
      "Mesure de l'erreur de reprojection",
      "Validation / relance en cas de perte du tracking"
    ],
    icon: <Grid3X3 className="h-4 w-4" />
  },
  {
    id: 6,
    title: "Warp de l'image à projeter",
    description: "Adaptation de l'image de référence pour qu'elle épouse la perspective actuelle de la feuille.",
    input: "Image source S et H(t)",
    output: "S_warped(t) — image projetée",
    operations: [
      "Choix du sens de la transformation (plan → image ou inverse)",
      "warpPerspective sur la texture de référence",
      "Gestion des zones hors champ et masques"
    ],
    icon: <Scan className="h-4 w-4" />
  },
  {
    id: 7,
    title: "Composition AR",
    description: "Fusion de la frame caméra et de l'image projetée avec options d'overlay supplémentaires.",
    input: "I(t) et S_warped(t)",
    output: "Frame AR(t)",
    operations: [
      "Blend alpha configurable",
      "Ajout de grilles, Ghost Mentor ou aides visuelles",
      "Préparation d'UI additionnelles (HUD, curseurs, etc.)"
    ],
    icon: <Layers className="h-4 w-4" />
  },
  {
    id: 8,
    title: "Rendu / affichage",
    description: "Affichage final sur mobile, tablette ou casque XR en exploitant le même pipeline.",
    input: "Frame AR(t)",
    output: "Image affichée à l'utilisateur",
    operations: [
      "Canvas 2D ou WebGL / Three.js sur mobile",
      "Projection sur panneau AR (Vision Pro / VR)",
      "Gestion du rafraîchissement en 30–60 fps"
    ],
    icon: <Monitor className="h-4 w-4" />
  }
];

export default function ARWorkflowGuide() {
  return (
    <Card className="bg-muted/30 border-dashed">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl">Pipeline AR temps réel</CardTitle>
        <CardDescription>
          Référence opérationnelle des 8 blocs nécessaires pour projeter une image de référence sur la feuille dessinée.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <Accordion type="single" collapsible defaultValue="step-1" className="space-y-2">
          {workflowSteps.map((step) => (
            <AccordionItem key={step.id} value={`step-${step.id}`} className="border rounded-lg bg-background">
              <AccordionTrigger className="px-4">
                <div className="flex items-center gap-3 text-left">
                  <Badge variant="secondary" className="font-mono">{step.id.toString().padStart(2, "0")}</Badge>
                  <span className="flex items-center gap-2">
                    {step.icon}
                    <span className="font-semibold">{step.title}</span>
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4">
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                  <div className="grid gap-2 text-sm sm:grid-cols-2">
                    <div>
                      <p className="font-medium text-foreground">Entrée</p>
                      <p className="text-muted-foreground">{step.input}</p>
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Sortie</p>
                      <p className="text-muted-foreground">{step.output}</p>
                    </div>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Opérations clés</p>
                    <ul className="mt-1 space-y-1 text-muted-foreground text-sm list-disc list-inside">
                      {step.operations.map((operation) => (
                        <li key={operation}>{operation}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
      <CardFooter className="pt-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <RefreshCcw className="h-4 w-4" />
          Boucle temps réel : répéter ces étapes à chaque frame (t+1, t+2, …) en surveillant la stabilité du tracking.
        </div>
      </CardFooter>
    </Card>
  );
}
