import { Button } from "@/components/ui/button";
import { Camera, Palette, BookOpen, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-y-10 left-1/2 h-[480px] w-[480px] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute bottom-10 left-8 h-52 w-52 rounded-full bg-secondary/20 blur-3xl" />
        <div className="absolute top-24 right-16 h-56 w-56 rounded-full bg-accent/30 blur-3xl" />
      </div>

      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 pb-16 pt-24 sm:px-6 lg:px-8">
        <header className="rounded-[36px] border border-white/60 bg-white/80 p-8 shadow-[var(--shadow-soft)] backdrop-blur-xl md:p-12">
          <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-6 text-left">
              <div className="inline-flex items-center gap-3 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
                <Palette className="h-4 w-4" />
                Studio DrawMaster VR
              </div>
              <h1 className="text-4xl font-bold leading-tight text-foreground sm:text-5xl lg:text-6xl">
                Projetez. Esquissez. Progressez avec un coach de réalité augmentée.
              </h1>
              <p className="max-w-xl text-lg leading-relaxed text-muted-foreground">
                Composez vos séances de dessin dans un espace immersif. Retrouvez vos outils, l'assistant IA et les exercices guidés dans une interface douce et tactile inspirée par le studio DrawMaster VR.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <Button
                  size="lg"
                  onClick={() => navigate('/exercises')}
                  className="h-14 rounded-full bg-primary px-8 text-base font-semibold shadow-[0_18px_40px_-20px_rgba(92,80,255,0.7)] transition hover:translate-y-[-2px] hover:bg-primary/90"
                >
                  <BookOpen className="mr-2 h-5 w-5" />
                  Explorer les exercices
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => navigate('/project')}
                  className="h-14 rounded-full border-white/70 bg-white/60 px-8 text-base font-semibold text-primary shadow-[0_16px_40px_-24px_rgba(24,20,60,0.3)] backdrop-blur-lg transition hover:bg-white"
                >
                  <Camera className="mr-2 h-5 w-5" />
                  Mode projection AR
                </Button>
              </div>
            </div>

            <div className="grid gap-5">
              <div className="rounded-[28px] border border-white/60 bg-gradient-to-br from-white/90 via-white/70 to-primary/10 p-6 shadow-[var(--shadow-card)] backdrop-blur-2xl">
                <div className="mb-4 flex items-center justify-between text-sm text-muted-foreground">
                  <span>Progression hebdomadaire</span>
                  <span className="rounded-full bg-primary/15 px-3 py-1 text-xs font-semibold text-primary">+24%</span>
                </div>
                <p className="text-xl font-semibold text-foreground">15 séances AR terminées</p>
                <p className="mt-2 text-sm text-muted-foreground">Reprenez là où vous vous êtes arrêté et continuez votre série de dessins immersifs.</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-[26px] border border-white/50 bg-white/75 p-5 shadow-[var(--shadow-card)] backdrop-blur-2xl">
                  <Sparkles className="mb-3 h-6 w-6 text-secondary" />
                  <h3 className="text-lg font-semibold text-foreground">Coaching IA</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    Analyse instantanée de vos croquis avec recommandations personnalisées.
                  </p>
                </div>
                <div className="rounded-[26px] border border-white/50 bg-white/75 p-5 shadow-[var(--shadow-card)] backdrop-blur-2xl">
                  <Camera className="mb-3 h-6 w-6 text-primary" />
                  <h3 className="text-lg font-semibold text-foreground">Projection fluide</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    Ajustez l'opacité, la grille et la lumière en un glissement pour tracer avec précision.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="mt-12 flex flex-1 flex-col gap-12">
          <section>
            <div className="grid gap-6 md:grid-cols-3">
              {[{
                title: "Projection AR tactile",
                description: "Utilisez votre caméra pour projeter des références, caler une grille et bloquer vos volumes en quelques gestes.",
                icon: <Camera className="h-6 w-6" />,
                accent: "from-primary/15 to-primary/5",
              }, {
                title: "Assistant IA express",
                description: "Recevez des critiques constructives, des rappels d'anatomie ou des variations d'éclairage à la demande.",
                icon: <Sparkles className="h-6 w-6" />,
                accent: "from-secondary/20 to-secondary/5",
              }, {
                title: "Parcours progressifs",
                description: "Une bibliothèque d'exercices scénarisés pour structurer votre progression du croquis au rendu final.",
                icon: <BookOpen className="h-6 w-6" />,
                accent: "from-accent/20 to-accent/5",
              }].map((feature, index) => (
                <div
                  key={feature.title}
                  className={`group rounded-[30px] border border-white/60 bg-gradient-to-br ${feature.accent} p-6 shadow-[var(--shadow-card)] backdrop-blur-xl transition-transform duration-300 hover:-translate-y-1`}
                  style={{ transitionDelay: `${index * 60}ms` }}
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/70 text-primary shadow-inner shadow-white/40">
                    {feature.icon}
                  </div>
                  <h3 className="mt-5 text-xl font-semibold text-foreground">{feature.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{feature.description}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[32px] border border-white/60 bg-gradient-to-br from-primary/95 to-secondary/90 p-10 text-center shadow-[var(--shadow-soft)] text-white">
            <h2 className="text-3xl font-bold sm:text-4xl">Prêt à débuter votre prochaine séance immersive ?</h2>
            <p className="mx-auto mt-4 max-w-2xl text-base text-white/80 sm:text-lg">
              Activez la projection AR, choisissez un exercice guidé et laissez le coach IA vous accompagner étape par étape.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Button
                size="lg"
                onClick={() => navigate('/exercises')}
                className="h-14 rounded-full bg-white px-8 text-base font-semibold text-primary shadow-[0_18px_40px_-22px_rgba(255,255,255,0.7)] transition hover:bg-white/90"
              >
                Lancer un exercice guidé
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => navigate('/drawmaster')}
                className="h-14 rounded-full border-white/70 bg-white/10 px-8 text-base font-semibold text-white transition hover:bg-white/20"
              >
                Découvrir DrawMaster VR
              </Button>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};

export default Index;
