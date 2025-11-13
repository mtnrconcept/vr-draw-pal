import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve((req: Request) => {
  // Préflight CORS
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        ...corsHeaders,
      },
    });
  }

  // Ping log ultra simple côté Edge (si tu ne le vois pas, la requête n'arrive pas dans la fonction)
  console.log("[generate-exercise PING] Method:", req.method);

  // On ignore complètement le body, pas de JSON, pas d'async → zéro chance de blocage
  const exercise = {
    title: "Exercice Débutant – STUB",
    description:
      "Exercice STUB ultra-simple généré par la fonction Edge sans aucun appel LLM.",
    steps: [
      "Étape 1: Préparation du poste de travail.",
      "Étape 2: Tracer une grille légère.",
      "Étape 3: Construire les formes de base.",
      "Étape 4: Placer les grandes ombres.",
      "Étape 5: Ajouter les détails.",
      "Étape 6: Finitions.",
    ],
    stepImages: [],
    tips: [
      "Garde ton trait léger au début.",
      "Travaille du général vers le détail.",
    ],
    focusPoints: ["Volumes", "Valeurs tonales"],
    duration: "20-30 min",
    materials: ["Crayon HB", "Gomme", "Papier"],
    difficulty: "Débutant",
  };

  const body = JSON.stringify({ exercise });

  return new Response(body, {
    status: 200,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
});
