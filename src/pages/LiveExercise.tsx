import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Sparkles, Loader2, CheckCircle2, MessageCircle } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";

interface Exercise {
  title: string;
  description: string;
  steps: string[];
  tips: string[];
  focusPoints: string[];
  duration: string;
  materials: string[];
  difficulty: string;
}

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

      if (error) throw error;
      
      setExercise(data.exercise);
      toast.success("Exercice généré ! 🎨");
    } catch (error) {
      console.error("Error:", error);
      toast.error("Erreur lors de la génération de l'exercice");
    } finally {
      setIsLoading(false);
    }
  };

  const completeStep = () => {
    if (!exercise || currentStep >= exercise.steps.length - 1) return;
    
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
    } catch (error) {
      console.error("Error:", error);
      toast.error("Erreur lors de l'analyse");
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Génération de votre exercice personnalisé...</p>
        </div>
      </div>
    );
  }

  if (!exercise) {
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
            {exercise.materials.map((material, i) => (
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
              Étape actuelle
            </h2>
            
            <div className="bg-gradient-to-br from-primary/10 to-secondary/10 rounded-lg p-6 mb-4">
              <p className="text-lg leading-relaxed text-card-foreground">
                {exercise.steps[currentStep]}
              </p>
            </div>

            {/* Focus Points */}
            {exercise.focusPoints.length > 0 && (
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
              disabled={currentStep >= exercise.steps.length - 1}
              className="w-full bg-primary hover:bg-primary/90"
            >
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Étape terminée
            </Button>

            {currentStep >= exercise.steps.length - 1 && (
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
                {exercise.tips.map((tip, i) => (
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
                {exercise.steps.map((step, i) => (
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
