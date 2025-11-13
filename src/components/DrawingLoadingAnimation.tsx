import { useEffect, useState } from "react";
import handSketch from "@/assets/hand-sketch-loading.jpg";
import pencilImage from "@/assets/pencil-drawing.png";

export const DrawingLoadingAnimation = () => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) return 0;
        return prev + 1;
      });
    }, 50);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-background via-background to-muted/20">
      {/* Animated background particles */}
      <div className="absolute inset-0 opacity-30">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-primary rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${2 + Math.random() * 2}s`,
            }}
          />
        ))}
      </div>

      {/* Main drawing container */}
      <div className="relative z-10 w-full max-w-4xl px-8">
        {/* Drawing reveal effect */}
        <div className="relative rounded-2xl overflow-hidden shadow-2xl bg-white">
          {/* The hand sketch with progressive reveal */}
          <div className="relative aspect-video">
            <img
              src={handSketch}
              alt="Hand sketch in progress"
              className="w-full h-full object-cover"
            />
            
            {/* Progressive reveal overlay */}
            <div
              className="absolute inset-0 bg-white transition-all duration-300 ease-out"
              style={{
                clipPath: `polygon(0 0, ${progress}% 0, ${progress}% 100%, 0 100%)`,
                opacity: 0,
              }}
            />
            
            {/* Drawing line effect */}
            <div
              className="absolute top-0 bottom-0 w-1 bg-gradient-to-b from-transparent via-primary to-transparent transition-all duration-100 ease-linear"
              style={{
                left: `${progress}%`,
                boxShadow: "0 0 20px hsl(var(--primary))",
              }}
            />

            {/* Animated pencil */}
            <div
              className="absolute transition-all duration-100 ease-linear"
              style={{
                left: `${progress}%`,
                top: "50%",
                transform: "translate(-50%, -50%) rotate(-45deg)",
              }}
            >
              <img
                src={pencilImage}
                alt="Pencil"
                className="w-16 h-16 object-contain drop-shadow-2xl animate-pulse"
                style={{
                  filter: "drop-shadow(0 4px 20px rgba(0,0,0,0.3))",
                }}
              />
              
              {/* Pencil glow effect */}
              <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
            </div>

            {/* Sparkle effects */}
            {progress > 20 && (
              <div
                className="absolute w-3 h-3 animate-ping"
                style={{
                  left: `${progress - 5}%`,
                  top: `${40 + Math.sin(progress / 10) * 20}%`,
                }}
              >
                <div className="w-full h-full bg-primary rounded-full opacity-75" />
              </div>
            )}
          </div>

          {/* Progress bar */}
          <div className="absolute bottom-0 left-0 right-0 h-2 bg-muted/30">
            <div
              className="h-full bg-gradient-to-r from-primary via-secondary to-accent transition-all duration-100 ease-linear relative overflow-hidden"
              style={{ width: `${progress}%` }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
            </div>
          </div>
        </div>

        {/* Loading text with typing effect */}
        <div className="mt-8 text-center space-y-4">
          <h2 className="text-3xl font-bold text-foreground animate-fade-in">
            Création de votre exercice personnalisé
          </h2>
          <div className="flex items-center justify-center gap-2 text-muted-foreground animate-fade-in">
            <div className="flex gap-1">
              <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
            <p className="text-lg">Notre IA génère des croquis progressifs hyper réalistes</p>
          </div>
          <div className="text-sm text-muted-foreground/80 animate-pulse">
            ✨ Analyse des techniques de dessin réaliste en cours...
          </div>
        </div>
      </div>

      {/* Decorative corner elements */}
      <div className="absolute top-8 left-8 w-24 h-24 border-t-4 border-l-4 border-primary/30 rounded-tl-3xl" />
      <div className="absolute bottom-8 right-8 w-24 h-24 border-b-4 border-r-4 border-secondary/30 rounded-br-3xl" />
    </div>
  );
};
