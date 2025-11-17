import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Camera } from "lucide-react";
import { useNavigate } from "react-router-dom";

const exercises = [
  {
    id: 1,
    title: "Formes gǸomǸtriques de base",
    level: "DǸbutant",
    duration: "15 min",
    description: "Maǩtrisez les cercles, carrǸs et triangles",
    image: "https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=800&h=600&fit=crop",
  },
  {
    id: 2,
    title: "Lignes et perspectives",
    level: "DǸbutant",
    duration: "20 min",
    description: "Apprenez les bases de la perspective",
    image: "https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=800&h=600&fit=crop",
  },
  {
    id: 3,
    title: "Ombres et lumi��res",
    level: "IntermǸdiaire",
    duration: "30 min",
    description: "CrǸez du volume avec les ombres",
    image: "https://images.unsplash.com/photo-1561214115-f2f134cc4912?w=800&h=600&fit=crop",
  },
  {
    id: 4,
    title: "Proportions du visage",
    level: "IntermǸdiaire",
    duration: "45 min",
    description: "Dessinez des portraits rǸalistes",
    image: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800&h=600&fit=crop",
  },
  {
    id: 5,
    title: "Anatomie humaine",
    level: "AvancǸ",
    duration: "60 min",
    description: "Maǩtrisez le corps humain",
    image: "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=800&h=600&fit=crop",
  },
  {
    id: 6,
    title: "Textures rǸalistes",
    level: "AvancǸ",
    duration: "50 min",
    description: "Rendez vos dessins vivants",
    image: "https://images.unsplash.com/photo-1618005198919-d3d4b5a92ead?w=800&h=600&fit=crop",
  },
];

const Exercises = () => {
  const navigate = useNavigate();

  const getLevelStyles = (level: string) => {
    switch (level) {
      case "DǸbutant":
        return "border border-[rgba(168,236,208,0.45)] bg-[rgba(50,120,96,0.8)] text-white";
      case "IntermǸdiaire":
        return "border border-[rgba(255,219,174,0.45)] bg-[rgba(125,86,44,0.7)] text-white";
      case "AvancǸ":
        return "border border-[rgba(255,157,130,0.4)] bg-[rgba(161,64,54,0.7)] text-white";
      default:
        return "border border-white/30 bg-white/10 text-white";
    }
  };

  const startLiveExercise = (focus: string, level: string) => {
    navigate("/live-exercise", { state: { level, focus } });
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="mx-auto w-full max-w-6xl px-4 pb-16 pt-16 text-white sm:px-6 lg:px-8">
        <div className="mb-10 flex flex-wrap items-center justify-between gap-4">
          <Button
            variant="ghost"
            onClick={() => navigate("/")}
            className="h-12 rounded-full border border-white/25 bg-white/10 px-5 text-white shadow-[0_12px_40px_rgba(0,0,0,0.45)] backdrop-blur"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour
          </Button>

          <Button
            onClick={() => startLiveExercise("dessin gǸnǸral", "DǸbutant")}
            className="hidden h-12 rounded-full bg-gradient-to-r from-primary to-secondary px-6 text-sm font-semibold uppercase tracking-wide text-white shadow-[0_18px_55px_rgba(255,161,112,0.5)] transition hover:scale-[1.02] md:flex"
          >
            <Camera className="mr-2 h-4 w-4" />
            Exercice IA personnalisǸ
          </Button>
        </div>

        <div className="forest-card rounded-[40px] border px-6 py-10 shadow-[var(--shadow-soft)] sm:px-10 lg:px-14">
          <div className="flex flex-col gap-10 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1 text-sm font-semibold text-white">
                <span className="h-2 w-2 rounded-full bg-primary" />
                Parcours immersif
              </div>
              <h1 className="text-4xl font-bold leading-tight sm:text-5xl">
                Biblioth��que d'exercices DrawMaster
              </h1>
              <p className="text-lg leading-relaxed text-white/75">
                SǸlectionnez un module pour lancer une sǸance guidǸe, activer la projection AR ou obtenir un coaching instantanǸ.
                Chaque carte rǸunit les rep��res essentiels pour dessiner en toute confiance.
              </p>
            </div>

            <div className="flex flex-col gap-4 rounded-[32px] border border-white/15 bg-white/5 p-6 text-sm text-white shadow-[inset_0_0_45px_rgba(255,255,255,0.06)]">
              <div className="flex items-center justify-between">
                <span className="font-semibold">Sessions suivies</span>
                <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold text-white">+8 cette semaine</span>
              </div>
              <div className="grid gap-3 text-white/70">
                <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/10 px-4 py-3">
                  <span>DǸbutant</span>
                  <span className="font-semibold text-accent">12 modules</span>
                </div>
                <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/10 px-4 py-3">
                  <span>IntermǸdiaire</span>
                  <span className="font-semibold text-secondary">9 modules</span>
                </div>
                <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/10 px-4 py-3">
                  <span>AvancǸ</span>
                  <span className="font-semibold text-primary">6 modules</span>
                </div>
              </div>
              <Button
                onClick={() => startLiveExercise("dessin gǸnǸral", "DǸbutant")}
                className="mt-2 flex h-12 rounded-full items-center justify-center bg-primary text-xs font-semibold uppercase tracking-wider text-primary-foreground shadow-[0_22px_45px_rgba(237,147,65,0.45)] transition hover:-translate-y-0.5"
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
              className="relative overflow-hidden rounded-[32px] border border-white/15 bg-transparent shadow-[var(--shadow-card)] transition duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-soft)]"
            >
              <div className="flex flex-col gap-6 p-6 sm:p-8">
                <div className="relative overflow-hidden rounded-[26px] border border-white/15 bg-white/5">
                  <img
                    src={exercise.image}
                    alt={exercise.title}
                    className="h-56 w-full rounded-[24px] object-cover"
                    loading="lazy"
                  />
                  <Badge
                    className={`absolute left-4 top-4 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${getLevelStyles(exercise.level)}`}
                  >
                    {exercise.level}
                  </Badge>
                  <span className="absolute bottom-4 right-4 rounded-full border border-white/30 bg-black/40 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
                    �?��? {exercise.duration}
                  </span>
                </div>

                <div className="flex flex-col gap-4">
                  <div>
                    <h3 className="text-2xl font-semibold text-white">{exercise.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-white/70">{exercise.description}</p>
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3 text-xs font-medium uppercase tracking-widest text-white/60">
                      <span className="flex items-center gap-1 rounded-full border border-white/20 bg-white/10 px-3 py-1">
                        �YZ� Focus
                      </span>
                      <span>{exercise.level} �� {exercise.duration}</span>
                    </div>

                    <div className="flex flex-col gap-2 sm:flex-row">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => startLiveExercise(exercise.title.toLowerCase(), exercise.level)}
                        className="h-11 rounded-full border-primary/50 bg-white/10 px-5 text-xs font-semibold uppercase tracking-widest text-primary shadow-[0_12px_30px_rgba(237,147,65,0.35)] backdrop-blur transition hover:bg-white/20"
                      >
                        �o� Coach IA
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => navigate("/project", { state: { exerciseId: exercise.id } })}
                        className="h-11 rounded-full bg-gradient-to-r from-primary to-secondary px-6 text-xs font-semibold uppercase tracking-wider text-white shadow-[0_18px_40px_rgba(255,151,118,0.5)] transition hover:scale-[1.02]"
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
