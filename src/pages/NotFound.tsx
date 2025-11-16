import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <div className="absolute left-1/4 top-16 h-72 w-72 -translate-x-1/2 rounded-full bg-primary/15 blur-3xl" />
        <div className="absolute right-1/5 top-24 h-80 w-80 rounded-full bg-secondary/20 blur-3xl" />
        <div className="absolute bottom-12 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-accent/25 blur-3xl" />
      </div>

      <div className="flex min-h-screen items-center justify-center px-6">
        <div className="w-full max-w-xl rounded-[40px] border border-white/60 bg-white/80 p-12 text-center shadow-[var(--shadow-soft)] backdrop-blur-xl">
          <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-primary">
            Erreur 404
          </span>
          <h1 className="mt-6 text-4xl font-bold text-foreground">Page introuvable</h1>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            L'univers DrawMaster VR ne contient pas encore cette page. Vérifiez l'URL ou revenez à l'accueil pour continuer votre session créative.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button
              onClick={() => (window.location.href = '/')}
              className="h-12 rounded-full bg-primary px-8 text-sm font-semibold uppercase tracking-widest text-white shadow-[0_18px_40px_-22px_rgba(92,80,255,0.7)] transition hover:scale-[1.01]"
            >
              Retour à l'accueil
            </Button>
            <Button
              variant="outline"
              onClick={() => window.history.back()}
              className="h-12 rounded-full border-white/60 bg-white/70 px-8 text-sm font-semibold uppercase tracking-widest text-foreground shadow-[0_12px_30px_-22px_rgba(15,23,42,0.25)] backdrop-blur transition hover:bg-white"
            >
              Page précédente
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
