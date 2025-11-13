import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Sparkles, Loader2, CheckCircle2, MessageCircle } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { DrawingLoadingAnimation } from "@/components/DrawingLoadingAnimation";

interface Exercise {
  title: string;
  description: string;
  steps: string[];
  tips: string[];
  focusPoints: string[];
  duration: string;
  materials: string[];
  difficulty: string;
  stepImages?: string[];
}

const fallbackExercise: Exercise = {
  title: "Étude du visage réaliste",
  description:
    "Un atelier guidé pas à pas pour apprendre à construire un visage réaliste en respectant les proportions et les volumes.",
  steps: [
    "Trace légèrement un ovale pour définir la forme globale du visage, puis dessine une ligne verticale centrale et une ligne horizontale au milieu pour placer les yeux.",
    "Ajoute deux lignes horizontales supplémentaires : une à mi-distance entre la ligne des yeux et le menton pour placer le nez, et une autre au-dessus pour positionner la ligne des sourcils.",
    "Dessine la forme générale des yeux sur la ligne centrale, puis ajoute la base du nez en utilisant la ligne inférieure comme repère. Ébauche ensuite la bouche en t'appuyant sur la distance entre le nez et le menton.",
    "Affines les volumes en ajoutant les pommettes, la mâchoire et les oreilles alignées sur les yeux et le nez. Termine en renforçant les ombres principales pour donner du relief.",
  ],
  tips: [
    "Garde ton crayon léger au début pour pouvoir ajuster facilement les proportions.",
    "Observe la symétrie du visage mais accepte de légères asymétries pour un rendu naturel.",
    "Utilise l'estompe uniquement après avoir posé les bonnes valeurs d'ombre et de lumière.",
  ],
  focusPoints: [
    "Alignement des yeux, du nez et de la bouche sur l'axe central.",
    "Gestion des volumes : pommettes, mâchoire et front.",
    "Transitions douces entre zones d'ombre et de lumière.",
  ],
  duration: "25 minutes",
  materials: ["Crayon HB", "Gomme mie de pain", "Estompe", "Feuille A4"],
  difficulty: "Intermédiaire",
  stepImages: [
    "https://images.unsplash.com/photo-1545239351-1141bd82e8a6?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=800&q=80",
    "https://images.unsplash.com/photo-1520975922131-97788e79fcd0?auto=format&fit=crop&w=800&q=80",
  ],
};

const LiveExercise = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { level, focus } = location.state || { level: "Débutant", focus: "formes de base" };
  
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [feedback, setFeedback] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [question, setQuestion] = useState("");

  useEffect(() => {
    generateExercise();
  }, []);

  const generateExercise = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-exercise", {
        body: { level, focus },
      });

      if (error) {
        if (error.message?.includes("402") || error.message?.includes("Crédits insuffisants")) {
          toast.error("Crédits Lovable AI insuffisants. Allez dans Settings → Workspace → Usage pour ajouter des crédits.");
          throw new Error("Crédits insuffisants");
        }
        throw error;
      }

      setExercise(data.exercise);
      toast.success("Exercice généré ! 🎨");
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error("Error generating exercise:", errorMessage);
      if (!errorMessage.includes("Crédits insuffisants")) {
        toast.info("Impossible de contacter l'assistant, chargement d'un exercice hors-ligne ✨");
      }
      setExercise(fallbackExercise);
    } finally {
      setIsLoading(false);
    }
  };

  const completeStep = () => {
    if (!exercise || !exercise.steps || currentStep >= exercise.steps.length - 1) return;
    
    setCompletedSteps([...completedSteps, currentStep]);
    setCurrentStep(currentStep + 1);
    toast.success("Étape validée ! 👏");
    
    // Feedback automatique
    if (currentStep === Math.floor(exercise.steps.length / 2)) {
      getFeedback();
    }
  };

  const getFeedback = async (specificQuestion?: string) => {
    if (!exercise) return;

    setIsAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke("analyze-drawing", {
        body: { 
          exerciseTitle: exercise.title,
          userProgress: `Étape ${currentStep + 1}/${exercise.steps.length}`,
          specificQuestion: specificQuestion || question,
        },
      });

      if (error) throw error;

      setFeedback(data.feedback);
      setQuestion("");
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error("Error analyzing drawing:", errorMessage);
      setFeedback(
        "Je ne peux pas analyser ton dessin pour le moment, mais continue en t'appuyant sur les conseils fournis. Pose-moi une question spécifique et je te guiderai avec des astuces générales !"
      );
      toast.info("Analyse hors-ligne indisponible, affichage de conseils généraux.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (isLoading) {
    return <DrawingLoadingAnimation />;
  }

  if (!exercise || !exercise.steps || exercise.steps.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-destructive">Erreur lors du chargement de l'exercice</p>
          <Button onClick={() => navigate(-1)}>Retour</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Header */}
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour
        </Button>

        {/* Exercise Info */}
        <Card className="p-6 mb-6 border-border shadow-[var(--shadow-card)]">
          <div className="flex items-start justify-between mb-4">
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-3xl font-bold text-card-foreground">{exercise.title}</h1>
                <Badge className="bg-primary text-primary-foreground">
                  {exercise.difficulty}
                </Badge>
              </div>
              <p className="text-muted-foreground">{exercise.description}</p>
            </div>
            <div className="text-right ml-4">
              <div className="text-2xl font-bold text-primary">
                {currentStep + 1}/{exercise.steps.length}
              </div>
              <div className="text-sm text-muted-foreground">⏱️ {exercise.duration}</div>
            </div>
          </div>

          {/* Materials */}
          <div className="flex flex-wrap gap-2 mb-4">
            {exercise.materials?.map((material, i) => (
              <Badge key={i} variant="outline" className="border-accent text-accent-foreground">
                {material}
              </Badge>
            ))}
          </div>
        </Card>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Current Step */}
          <Card className="p-6 border-border shadow-[var(--shadow-card)]">
            <h2 className="text-xl font-semibold mb-4 text-card-foreground flex items-center">
              <Sparkles className="mr-2 h-5 w-5 text-primary" />
              Étape {currentStep + 1}/{exercise.steps.length}
            </h2>
            
            {/* Step-by-step Image */}
            {exercise.stepImages && exercise.stepImages[currentStep] && (
              <div className="mb-4 rounded-lg overflow-hidden border-2 border-primary/20 shadow-lg bg-white">
                <img 
                  src={exercise.stepImages[currentStep]} 
                  alt={`Croquis étape ${currentStep + 1}`}
                  className="w-full h-auto"
                />
                <div className="p-2 bg-gradient-to-r from-primary/10 to-secondary/10 text-center">
                  <p className="text-xs font-semibold text-muted-foreground">
                    📐 Référence visuelle - Étape {currentStep + 1}
                  </p>
                </div>
              </div>
            )}
            
            <div className="bg-gradient-to-br from-primary/10 to-secondary/10 rounded-lg p-6 mb-4">
              <p className="text-lg leading-relaxed text-card-foreground">
                {exercise.steps[currentStep]}
              </p>
            </div>

            {/* Focus Points */}
            {exercise.focusPoints && exercise.focusPoints.length > 0 && (
              <div className="mb-4">
                <h3 className="font-semibold mb-2 text-sm text-muted-foreground">Points d'attention :</h3>
                <ul className="space-y-1">
                  {exercise.focusPoints.map((point, i) => (
                    <li key={i} className="text-sm text-card-foreground flex items-start">
                      <span className="text-accent mr-2">•</span>
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <Button 
              onClick={completeStep}
              disabled={!exercise.steps || currentStep >= exercise.steps.length - 1}
              className="w-full bg-primary hover:bg-primary/90"
            >
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Étape terminée
            </Button>

            {exercise.steps && currentStep >= exercise.steps.length - 1 && (
              <div className="mt-4 p-4 bg-accent/10 rounded-lg text-center">
                <p className="text-accent-foreground font-semibold">🎉 Exercice terminé !</p>
                <Button 
                  onClick={() => navigate('/project')}
                  variant="outline"
                  className="mt-2"
                >
                  Passer en mode AR
                </Button>
              </div>
            )}
          </Card>

          {/* Tips & Feedback */}
          <div className="space-y-6">
            {/* Tips */}
            <Card className="p-6 border-border shadow-[var(--shadow-card)]">
              <h2 className="text-xl font-semibold mb-4 text-card-foreground">💡 Conseils</h2>
              <ul className="space-y-3">
                {exercise.tips?.map((tip, i) => (
                  <li key={i} className="text-sm text-card-foreground bg-muted rounded-lg p-3">
                    {tip}
                  </li>
                ))}
              </ul>
            </Card>

            {/* AI Feedback */}
            <Card className="p-6 border-border shadow-[var(--shadow-card)]">
              <h2 className="text-xl font-semibold mb-4 text-card-foreground flex items-center">
                <MessageCircle className="mr-2 h-5 w-5 text-secondary" />
                Coach IA
              </h2>
              
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Posez une question..."
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && getFeedback()}
                  />
                  <Button 
                    onClick={() => getFeedback()}
                    disabled={isAnalyzing}
                    className="bg-secondary hover:bg-secondary/90"
                  >
                    {isAnalyzing ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Analyser"
                    )}
                  </Button>
                </div>

                {feedback && (
                  <div className="bg-gradient-to-br from-secondary/10 to-accent/10 rounded-lg p-4">
                    <p className="text-sm leading-relaxed text-card-foreground whitespace-pre-wrap">
                      {feedback}
                    </p>
                  </div>
                )}
              </div>
            </Card>

            {/* Progress */}
            <Card className="p-6 border-border shadow-[var(--shadow-card)]">
              <h2 className="text-xl font-semibold mb-4 text-card-foreground">📊 Progression</h2>
              <div className="space-y-2">
                {exercise.steps?.map((step, i) => (
                  <div 
                    key={i}
                    className={`p-3 rounded-lg text-sm ${
                      completedSteps.includes(i) 
                        ? "bg-accent/20 text-accent-foreground line-through" 
                        : i === currentStep
                        ? "bg-primary/20 text-primary-foreground font-semibold"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {i + 1}. {step.substring(0, 50)}...
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveExercise;
