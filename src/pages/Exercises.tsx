import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Camera } from "lucide-react";
import { useNavigate } from "react-router-dom";

const exercises = [
  {
    id: 1,
    title: "Formes géométriques de base",
    level: "Débutant",
    duration: "15 min",
    description: "Maîtrisez les cercles, carrés et triangles",
    image: "https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=800&h=600&fit=crop",
  },
  {
    id: 2,
    title: "Lignes et perspectives",
    level: "Débutant",
    duration: "20 min",
    description: "Apprenez les bases de la perspective",
    image: "https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=800&h=600&fit=crop",
  },
  {
    id: 3,
    title: "Ombres et lumières",
    level: "Intermédiaire",
    duration: "30 min",
    description: "Créez du volume avec les ombres",
    image: "https://images.unsplash.com/photo-1561214115-f2f134cc4912?w=800&h=600&fit=crop",
  },
  {
    id: 4,
    title: "Proportions du visage",
    level: "Intermédiaire",
    duration: "45 min",
    description: "Dessinez des portraits réalistes",
    image: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800&h=600&fit=crop",
  },
  {
    id: 5,
    title: "Anatomie humaine",
    level: "Avancé",
    duration: "60 min",
    description: "Maîtrisez le corps humain",
    image: "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=800&h=600&fit=crop",
  },
  {
    id: 6,
    title: "Textures réalistes",
    level: "Avancé",
    duration: "50 min",
    description: "Rendez vos dessins vivants",
    image: "https://images.unsplash.com/photo-1618005198919-d3d4b5a92ead?w=800&h=600&fit=crop",
  },
];

const Exercises = () => {
  const navigate = useNavigate();

  const getLevelStyles = (level: string) => {
    switch (level) {
      case "Débutant":
        return "bg-accent/30 text-accent-foreground border-accent/40";
      case "Intermédiaire":
        return "bg-secondary/25 text-secondary-foreground border-secondary/35";
      case "Avancé":
        return "bg-primary/20 text-primary-foreground border-primary/40";
      default:
        return "bg-muted text-muted-foreground border-muted/60";
    }
  };

  const startLiveExercise = (focus: string, level: string) => {
    navigate('/live-exercise', { state: { level, focus } });
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <div className="absolute inset-0 -z-10">
        <div className="absolute left-[10%] top-12 h-64 w-64 rounded-full bg-primary/15 blur-3xl" />
        <div className="absolute right-[15%] top-28 h-72 w-72 rounded-full bg-secondary/20 blur-3xl" />
        <div className="absolute bottom-8 right-10 h-56 w-56 rounded-full bg-accent/25 blur-3xl" />
      </div>

      <div className="mx-auto w-full max-w-6xl px-4 pb-16 pt-24 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="h-12 rounded-full border border-white/40 bg-white/60 px-5 text-foreground shadow-[var(--shadow-card)] backdrop-blur"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour
          </Button>

          <Button
            onClick={() => startLiveExercise("dessin général", "Débutant")}
            className="hidden h-12 rounded-full bg-gradient-to-r from-primary to-secondary px-6 text-sm font-semibold uppercase tracking-wide text-white shadow-[var(--shadow-soft)] transition hover:scale-[1.02] hover:shadow-2xl md:flex"
          >
            <Camera className="mr-2 h-4 w-4" />
            Exercice IA personnalisé
          </Button>
        </div>

        <div className="rounded-[36px] border border-white/65 bg-white/75 p-8 shadow-[var(--shadow-soft)] backdrop-blur-xl md:p-12">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1 text-sm font-semibold text-primary">
                <span className="h-2 w-2 rounded-full bg-primary" />
                Parcours immersif
              </div>
              <h1 className="text-4xl font-bold leading-tight text-foreground sm:text-5xl">
                Bibliothèque d'exercices DrawMaster
              </h1>
              <p className="text-lg leading-relaxed text-muted-foreground">
                Sélectionnez un module pour lancer une séance guidée, activer la projection AR ou obtenir un coaching instantané.
                Chaque carte réunit les repères essentiels pour dessiner en toute confiance.
              </p>
            </div>

            <div className="flex flex-col gap-4 rounded-[28px] border border-white/60 bg-gradient-to-br from-primary/15 via-white/60 to-secondary/10 p-6 text-sm text-foreground shadow-[var(--shadow-card)]">
              <div className="flex items-center justify-between">
                <span className="font-semibold">Sessions suivies</span>
                <span className="rounded-full bg-white/60 px-3 py-1 text-xs font-semibold text-primary">+8 cette semaine</span>
              </div>
              <div className="grid gap-3 text-muted-foreground">
                <div className="flex items-center justify-between rounded-2xl bg-white/70 px-4 py-3 shadow-inner shadow-white/40">
                  <span>Débutant</span>
                  <span className="font-semibold text-primary">12 modules</span>
                </div>
                <div className="flex items-center justify-between rounded-2xl bg-white/70 px-4 py-3 shadow-inner shadow-white/40">
                  <span>Intermédiaire</span>
                  <span className="font-semibold text-secondary">9 modules</span>
                </div>
                <div className="flex items-center justify-between rounded-2xl bg-white/70 px-4 py-3 shadow-inner shadow-white/40">
                  <span>Avancé</span>
                  <span className="font-semibold text-accent">6 modules</span>
                </div>
              </div>
              <Button
                onClick={() => startLiveExercise("dessin général", "Débutant")}
                className="mt-2 flex h-11 rounded-full items-center justify-center bg-gradient-to-r from-primary to-secondary text-xs font-semibold uppercase tracking-wider text-white shadow-[0_18px_40px_-22px_rgba(92,80,255,0.7)] transition hover:scale-[1.01] hover:shadow-2xl"
              >
                <Camera className="mr-2 h-4 w-4" />
                Lancer le coach IA
              </Button>
            </div>
          </div>
        </div>

        <div className="mt-12 grid gap-8 lg:grid-cols-2">
          {exercises.map((exercise) => (
            <Card
              key={exercise.id}
              className="relative overflow-hidden rounded-[32px] border border-white/55 bg-white/75 shadow-[var(--shadow-card)] backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-soft)]"
            >
              <div className="flex flex-col gap-6 p-6 sm:p-8">
                <div className="relative overflow-hidden rounded-[26px] border border-white/50">
                  <img
                    src={exercise.image}
                    alt={exercise.title}
                    className="h-56 w-full rounded-[24px] object-cover"
                    loading="lazy"
                  />
                  <Badge className={`absolute left-4 top-4 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${getLevelStyles(exercise.level)}`}>
                    {exercise.level}
                  </Badge>
                  <span className="absolute bottom-4 right-4 rounded-full bg-white/70 px-3 py-1 text-xs font-semibold text-foreground backdrop-blur">⏱️ {exercise.duration}</span>
                </div>

                <div className="flex flex-col gap-4">
                  <div>
                    <h3 className="text-2xl font-semibold text-foreground">{exercise.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{exercise.description}</p>
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3 text-xs font-medium uppercase tracking-widest text-muted-foreground">
                      <span className="flex items-center gap-1 rounded-full bg-white/70 px-3 py-1 shadow-inner shadow-white/40">
                        🎯 Focus
                      </span>
                      <span className="text-foreground/70">{exercise.level} · {exercise.duration}</span>
                    </div>

                    <div className="flex flex-col gap-2 sm:flex-row">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => startLiveExercise(exercise.title.toLowerCase(), exercise.level)}
                        className="h-11 rounded-full border-primary/50 bg-white/70 px-5 text-xs font-semibold uppercase tracking-widest text-primary shadow-[0_12px_30px_-20px_rgba(92,80,255,0.6)] backdrop-blur transition hover:bg-white"
                      >
                        ✨ Coach IA
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => navigate('/project', { state: { exerciseId: exercise.id } })}
                        className="h-11 rounded-full bg-gradient-to-r from-primary to-secondary px-6 text-xs font-semibold uppercase tracking-wider text-white shadow-[0_18px_40px_-22px_rgba(255,151,118,0.6)] transition hover:scale-[1.02]"
                      >
                        <Camera className="mr-2 h-4 w-4" />
                        Mode AR
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Exercises;
