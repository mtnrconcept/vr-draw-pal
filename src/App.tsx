import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Exercises from "./pages/Exercises";
import Project from "./pages/Project";
import LiveExercise from "./pages/LiveExercise";
import DrawMasterVR from "./pages/DrawMasterVR";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const root = document.documentElement;

    const updateSafeZone = () => {
      const logo = document.querySelector<HTMLElement>(".enchanted-logo");
      if (!logo) return;
      const rect = logo.getBoundingClientRect();
      const safeZone = Math.max(rect.bottom + 20, 200);
      root.style.setProperty("--logo-safe-zone", `${safeZone}px`);
    };

    const handleLoad = () => updateSafeZone();
    const logoImg = document.querySelector<HTMLImageElement>(".enchanted-logo img");

    updateSafeZone();
    window.addEventListener("resize", updateSafeZone);
    logoImg?.addEventListener("load", handleLoad);

    return () => {
      window.removeEventListener("resize", updateSafeZone);
      logoImg?.removeEventListener("load", handleLoad);
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="enchanted-shell">
          <div className="enchanted-logo">
            <img src="/logo2.png" alt="Touche-à-Tout" draggable={false} />
          </div>
          <div className="enchanted-content">
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/exercises" element={<Exercises />} />
                <Route path="/project" element={<Project />} />
                <Route path="/live-exercise" element={<LiveExercise />} />
                <Route path="/drawmaster" element={<DrawMasterVR />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </div>
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
