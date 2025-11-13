import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const LOCAL_MODEL_ENDPOINT = Deno.env.get("LOCAL_MODEL_ENDPOINT");
const LOCAL_MODEL_NAME =
  Deno.env.get("LOCAL_MODEL_NAME") ?? "openai/gpt-oss-20b";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();

    if (!LOCAL_MODEL_ENDPOINT) {
      console.error(
        "[drawing-coach] LOCAL_MODEL_ENDPOINT non configuré dans Supabase.",
      );
      return new Response(
        JSON.stringify({
          error:
            "Configuration serveur manquante : définissez LOCAL_MODEL_ENDPOINT via `supabase secrets set`.",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const systemPrompt = `Tu es un coach de dessin expert et bienveillant. Tu aides les artistes de tous niveaux à progresser en dessin.

Tes rôles :
- Donner des conseils techniques précis et pratiques
- Analyser les dessins avec un regard constructif
- Proposer des exercices adaptés au niveau
- Encourager et motiver les apprenants
- Expliquer les principes fondamentaux du dessin (proportions, perspective, ombres, etc.)

Ton style :
- Enthousiaste et encourageant
- Pédagogue et patient
- Concis mais complet
- Tu utilises des émojis pertinents (🎨✏️🖌️)
- Tu donnes des conseils actionnables immédiatement

Domaines d'expertise :
- Anatomie et proportions
- Perspective et composition
- Ombres et lumières
- Textures et détails
- Techniques (crayon, fusain, encre, etc.)
- Observation et croquis rapides`;

    const response = await fetch(LOCAL_MODEL_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: LOCAL_MODEL_NAME,
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        temperature: 0.7,
        max_tokens: -1,
        stream: false,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Trop de requêtes, veuillez réessayer plus tard." }), 
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Crédits insuffisants. Veuillez ajouter des crédits." }), 
          {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      
      const errorText = await response.text();
      console.error("Model endpoint error:", response.status, errorText);
      throw new Error("Erreur lors de la communication avec l'assistant IA");
    }

    const data = await response.json();
    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in drawing-coach function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), 
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
