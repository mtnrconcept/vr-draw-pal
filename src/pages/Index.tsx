import { Button } from "@/components/ui/button";
import { Camera, Palette, BookOpen, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";

const featureCards = [
  {
    title: "Projection AR tactile",
    description:
      "Utilisez votre caméra pour projeter des références, caler une grille et bloquer vos volumes en quelques gestes.",
    icon: <Camera className="h-6 w-6" />,
    accent: "from-primary/20 via-transparent to-black/10",
  },
  {
    title: "Assistant IA express",
    description:
      "Recevez des critiques constructives, des rappels d'anatomie ou des variations d'éclairage à la demande.",
    icon: <Sparkles className="h-6 w-6" />,
    accent: "from-secondary/25 via-transparent to-black/10",
  },
  {
    title: "Parcours progressifs",
    description:
      "Une bibliothèque d'exercices scénarisés pour structurer votre progression du croquis au rendu final.",
    icon: <BookOpen className="h-6 w-6" />,
    accent: "from-accent/25 via-transparent to-black/10",
  },
];

const Index = () => {
  const navigate = useNavigate();
  const ritualTags = ["Ghost Mentor", "Calibrage strobe", "Guidage VR/AR"];

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-12 px-4 pb-24 text-foreground sm:px-6 lg:px-10">
        <header className="forest-card relative overflow-hidden rounded-[48px] border px-6 py-10 shadow-[var(--shadow-soft)] sm:px-10 lg:px-14">
          <div className="forest-grid" aria-hidden="true" />
          <div className="absolute -right-32 top-6 hidden h-64 w-64 rounded-full bg-primary/20 blur-3xl lg:block" />
          <div className="absolute -left-28 bottom-0 hidden h-72 w-72 rounded-full bg-secondary/25 blur-3xl lg:block" />

          <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-7 text-left">
              <div className="flex flex-wrap gap-3">
                <div className="forest-chip inline-flex items-center gap-2">
                  <Palette className="h-4 w-4" />
                  Studio DrawMaster VR
                </div>
                <div className="forest-chip inline-flex items-center gap-2 bg-primary/20 text-primary-foreground">
                  <Sparkles className="h-4 w-4" />
                  Nouveau décor forêt
                </div>
              </div>
              <h1 className="text-4xl font-extrabold leading-tight sm:text-5xl lg:text-6xl">
                Projetez. Esquissez. Progressez depuis une clairière enchantée.
              </h1>
              <p className="max-w-2xl text-lg leading-relaxed text-white/70">
                Composez vos séances de dessin immersives entouré·e de feuillages lumineux. Laissez la parallax du décor guider
                votre concentration pendant que l'assistant IA orchestre vos exercices.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <Button
                  size="lg"
                  onClick={() => navigate("/exercises")}
                  className="h-14 rounded-full bg-primary px-8 text-base font-semibold text-primary-foreground shadow-[0_25px_60px_rgba(237,147,65,0.45)] transition hover:-translate-y-0.5 hover:bg-primary/90"
                >
                  <BookOpen className="mr-2 h-5 w-5" />
                  Explorer les exercices
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => navigate("/project")}
                  className="h-14 rounded-full border-white/30 bg-white/10 px-8 text-base font-semibold text-foreground shadow-[0_14px_45px_rgba(0,0,0,0.45)] transition hover:bg-white/15"
                >
                  <Camera className="mr-2 h-5 w-5" />
                  Mode projection AR
                </Button>
              </div>

              <div className="flex flex-wrap gap-3 text-sm text-white/70">
                {ritualTags.map((tag) => (
                  <div key={tag} className="forest-pill">
                    {tag}
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-5">
              <div className="relative overflow-hidden rounded-[32px] border border-white/15 bg-white/5 p-6 shadow-[inset_0_0_40px_rgba(255,255,255,0.05)]">
                <div className="mb-4 flex items-center justify-between text-sm text-white/70">
                  <span>Progression hebdomadaire</span>
                  <span className="rounded-full bg-primary/30 px-3 py-1 text-xs font-semibold text-primary-foreground">+24%</span>
                </div>
                <p className="text-3xl font-semibold text-white">15 séances AR terminées</p>
                <p className="mt-3 text-sm text-white/70">
                  Reprenez là où vous vous êtes arrêté·e et laissez la clairière vous rappeler vos objectifs.
                </p>
                <div className="mt-6 h-1.5 rounded-full bg-white/10">
                  <div className="h-full w-4/5 rounded-full bg-primary" />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-[30px] border border-white/15 bg-white/5 p-5 shadow-[inset_0_0_60px_rgba(255,255,255,0.04)]">
                  <Sparkles className="mb-3 h-6 w-6 text-secondary" />
                  <h3 className="text-lg font-semibold text-white">Coaching IA</h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/70">
                    Analyse instantanée de vos croquis avec recommandations personnalisées.
                  </p>
                </div>
                <div className="rounded-[30px] border border-white/15 bg-white/5 p-5 shadow-[inset_0_0_60px_rgba(255,255,255,0.04)]">
                  <Camera className="mb-3 h-6 w-6 text-primary" />
                  <h3 className="text-lg font-semibold text-white">Projection fluide</h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/70">
                    Ajustez l'opacité, la grille et la lumière selon la profondeur de la scène.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="flex flex-1 flex-col gap-12">
          <section>
            <div className="grid gap-6 md:grid-cols-3">
              {featureCards.map((feature, index) => (
                <div
                  key={feature.title}
                  className="group forest-card relative overflow-hidden rounded-[36px] border p-6 shadow-[var(--shadow-card)] transition-transform duration-300 hover:-translate-y-1"
                  style={{ transitionDelay: `${index * 60}ms` }}
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${feature.accent} opacity-60`} />
                  <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-primary shadow-inner shadow-black/40 backdrop-blur">
                    {feature.icon}
                  </div>
                  <h3 className="relative mt-5 text-xl font-semibold text-white">{feature.title}</h3>
                  <p className="relative mt-3 text-sm leading-relaxed text-white/70">{feature.description}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="relative overflow-hidden rounded-[48px] border border-white/20 bg-gradient-to-r from-[rgba(12,38,28,0.92)] via-[rgba(18,44,36,0.9)] to-[rgba(48,79,54,0.9)] p-10 text-center text-white shadow-[var(--shadow-soft)]">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.12),transparent_45%)]" />
            <div className="relative space-y-6">
              <h2 className="text-3xl font-bold sm:text-4xl">Prêt·e à débuter votre prochaine séance immersive ?</h2>
              <p className="mx-auto max-w-2xl text-base text-white/80 sm:text-lg">
                Activez la projection AR, choisissez un exercice guidé et laissez le décor vous envelopper pendant que le coach IA rythme vos gestes.
              </p>
              <div className="flex flex-col justify-center gap-3 sm:flex-row">
                <Button
                  size="lg"
                  onClick={() => navigate("/exercises")}
                  className="h-14 rounded-full bg-white px-8 text-base font-semibold text-primary shadow-[0_18px_40px_rgba(255,255,255,0.35)] transition hover:bg-white/90"
                >
                  Lancer un exercice guidé
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => navigate("/drawmaster")}
                  className="h-14 rounded-full border-white/60 bg-white/10 px-8 text-base font-semibold text-white transition hover:bg-white/20"
                >
                  Découvrir DrawMaster VR
                </Button>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};

export default Index;
