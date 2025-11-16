import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Sparkles, Loader2, CheckCircle2, MessageCircle } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { invokeEdgeFunction } from "@/integrations/supabase/client";
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
      const { data, error } = await invokeEdgeFunction("generate-exercise", {
        body: { level, focus },
      });

      if (error) {
        if (error.message?.includes("402") || error.message?.includes("Crédits insuffisants")) {
          toast.error("Crédits Lovable AI insuffisants. Allez dans Settings → Workspace → Usage pour ajouter des crédits.");
          throw new Error("Crédits insuffisants");
        }
        throw error;
      }

      setExercise((data as any).exercise);
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
      const { data, error } = await invokeEdgeFunction("analyze-drawing", {
        body: {
          exerciseTitle: exercise.title,
          userProgress: `Étape ${currentStep + 1}/${exercise.steps.length}`,
          specificQuestion: specificQuestion || question,
        },
      });

      if (error) throw error;

      setFeedback((data as any).feedback);
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
    <div className="relative min-h-screen overflow-x-hidden">
      <div className="absolute inset-0 -z-10">
        <div className="absolute left-14 top-20 h-64 w-64 rounded-full bg-primary/15 blur-3xl" />
        <div className="absolute right-12 top-28 h-72 w-72 rounded-full bg-secondary/20 blur-3xl" />
        <div className="absolute bottom-16 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-accent/25 blur-3xl" />
      </div>

      <div className="mx-auto w-full max-w-5xl px-4 pb-16 pt-24 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="h-12 rounded-full border border-white/50 bg-white/70 px-5 text-foreground shadow-[var(--shadow-card)] backdrop-blur"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour
          </Button>

          <div className="hidden rounded-full bg-white/60 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground shadow-inner shadow-white/50 sm:block">
            Atelier immersif DrawMaster
          </div>
        </div>

        <Card className="mb-10 rounded-[36px] border border-white/60 bg-white/80 p-8 shadow-[var(--shadow-soft)] backdrop-blur-xl">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex-1 space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-3xl font-bold text-foreground sm:text-4xl">{exercise.title}</h1>
                <Badge className="rounded-full bg-primary/20 px-4 py-1 text-sm font-semibold uppercase tracking-widest text-primary">
                  {exercise.difficulty}
                </Badge>
              </div>
              <p className="text-base leading-relaxed text-muted-foreground">
                {exercise.description}
              </p>
              <div className="flex flex-wrap gap-2">
                {exercise.materials?.map((material, i) => (
                  <Badge key={i} variant="outline" className="rounded-full border-white/60 bg-white/70 px-4 py-1 text-xs font-medium text-foreground shadow-inner shadow-white/50">
                    {material}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="flex flex-col items-start gap-3 rounded-[28px] border border-white/60 bg-gradient-to-br from-primary/15 via-white/70 to-secondary/10 px-6 py-5 text-sm text-muted-foreground shadow-[var(--shadow-card)]">
              <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Progression</div>
              <div className="text-3xl font-bold text-primary">
                {currentStep + 1}/{exercise.steps.length}
              </div>
              <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Durée estimée</div>
              <div className="rounded-full bg-white/70 px-4 py-1 text-xs font-semibold text-secondary shadow-inner shadow-white/50">
                ⏱️ {exercise.duration}
              </div>
            </div>
          </div>
        </Card>

        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <Card className="rounded-[32px] border border-white/60 bg-white/80 p-6 shadow-[var(--shadow-card)] backdrop-blur-xl">
            <div className="mb-6 flex items-center gap-3 text-sm font-semibold uppercase tracking-widest text-primary">
              <Sparkles className="h-5 w-5" />
              Étape {currentStep + 1}/{exercise.steps.length}
            </div>

            {exercise.stepImages && exercise.stepImages[currentStep] && (
              <div className="mb-6 overflow-hidden rounded-[28px] border border-white/60">
                <img
                  src={exercise.stepImages[currentStep]}
                  alt={`Croquis étape ${currentStep + 1}`}
                  className="w-full object-cover"
                />
                <div className="bg-white/70 px-4 py-2 text-center text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                  📐 Référence visuelle
                </div>
              </div>
            )}

            <div className="mb-6 rounded-[28px] border border-white/60 bg-gradient-to-br from-primary/12 via-white/80 to-secondary/10 p-6 text-base leading-relaxed text-foreground shadow-inner shadow-white/50">
              {exercise.steps[currentStep]}
            </div>

            {exercise.focusPoints && exercise.focusPoints.length > 0 && (
              <div className="mb-6 rounded-[24px] border border-white/60 bg-white/70 p-6 shadow-inner shadow-white/40">
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Points d'attention</h3>
                <ul className="space-y-2 text-sm leading-relaxed text-foreground">
                  {exercise.focusPoints.map((point, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="mt-1 inline-block h-2 w-2 rounded-full bg-accent" />
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <Button
              onClick={completeStep}
              disabled={!exercise.steps || currentStep >= exercise.steps.length - 1}
              className="h-12 w-full rounded-full bg-gradient-to-r from-primary to-secondary text-sm font-semibold uppercase tracking-widest text-white shadow-[0_18px_40px_-22px_rgba(92,80,255,0.7)] transition hover:scale-[1.01]"
            >
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Étape terminée
            </Button>

            {exercise.steps && currentStep >= exercise.steps.length - 1 && (
              <div className="mt-5 rounded-[24px] border border-accent/40 bg-accent/20 px-6 py-5 text-center text-sm text-accent-foreground">
                <p className="font-semibold">🎉 Exercice terminé !</p>
                <Button
                  onClick={() => navigate('/project')}
                  variant="outline"
                  className="mt-3 h-11 rounded-full border-accent/40 bg-white/70 text-xs font-semibold uppercase tracking-widest text-accent shadow-[0_12px_30px_-22px_rgba(139,220,192,0.55)] backdrop-blur"
                >
                  Passer en mode AR
                </Button>
              </div>
            )}
          </Card>

          <div className="space-y-6">
            <Card className="rounded-[32px] border border-white/60 bg-white/80 p-6 shadow-[var(--shadow-card)] backdrop-blur-xl">
              <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">Conseils du coach</h2>
              <ul className="mt-4 space-y-3">
                {exercise.tips?.map((tip, i) => (
                  <li key={i} className="rounded-[22px] border border-white/60 bg-white/70 px-4 py-3 text-sm leading-relaxed text-foreground shadow-inner shadow-white/50">
                    {tip}
                  </li>
                ))}
              </ul>
            </Card>

            <Card className="rounded-[32px] border border-white/60 bg-white/80 p-6 shadow-[var(--shadow-card)] backdrop-blur-xl">
              <div className="flex items-center gap-3 text-sm font-semibold uppercase tracking-widest text-secondary">
                <MessageCircle className="h-5 w-5" />
                Coach IA
              </div>

              <div className="mt-5 space-y-4">
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Input
                    placeholder="Posez une question..."
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && getFeedback()}
                    className="h-11 rounded-full border-white/60 bg-white/70 px-5 shadow-inner shadow-white/40"
                  />
                  <Button
                    onClick={() => getFeedback()}
                    disabled={isAnalyzing}
                    className="h-11 rounded-full bg-secondary px-6 text-xs font-semibold uppercase tracking-widest text-white shadow-[0_16px_36px_-24px_rgba(255,151,118,0.6)] transition hover:scale-[1.01]"
                  >
                    {isAnalyzing ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Analyser"
                    )}
                  </Button>
                </div>

                {feedback && (
                  <div className="rounded-[24px] border border-white/60 bg-gradient-to-br from-secondary/12 via-white/80 to-accent/15 p-4 text-sm leading-relaxed text-foreground shadow-inner shadow-white/50">
                    {feedback}
                  </div>
                )}
              </div>
            </Card>

            <Card className="rounded-[32px] border border-white/60 bg-white/80 p-6 shadow-[var(--shadow-card)] backdrop-blur-xl">
              <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">Progression détaillée</h2>
              <div className="mt-4 space-y-2">
                {exercise.steps?.map((step, i) => (
                  <div
                    key={i}
                    className={`rounded-[20px] px-4 py-3 text-xs font-semibold uppercase tracking-widest transition ${
                      completedSteps.includes(i)
                        ? "bg-accent/30 text-accent-foreground line-through"
                        : i === currentStep
                        ? "bg-primary/20 text-primary-foreground"
                        : "bg-white/70 text-muted-foreground"
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
