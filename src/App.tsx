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
import AICoachDemo from "./pages/AICoachDemo";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="enchanted-shell">
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
                <Route path="/ai-coach" element={<AICoachDemo />} />
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
