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
    const { exerciseTitle, userProgress, specificQuestion } = await req.json();

    if (!LOCAL_MODEL_ENDPOINT) {
      console.error(
        "[analyze-drawing] LOCAL_MODEL_ENDPOINT non configuré dans Supabase.",
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

    console.log("Analyzing drawing progress for:", exerciseTitle);

    const systemPrompt = `Tu es un coach de dessin expert qui analyse la progression des élèves en temps réel.

Tu donnes :
- Des feedbacks constructifs et encourageants
- Des corrections spécifiques et actionnables
- Des astuces pour améliorer immédiatement
- De la motivation adaptée au niveau

Ton style est bienveillant, précis et inspirant. Tu utilises des émojis pertinents (🎨✏️✨👏).`;

    let userPrompt = `L'élève travaille sur : "${exerciseTitle}"`;
    
    if (userProgress) {
      userPrompt += `\nProgression actuelle : ${userProgress}`;
    }
    
    if (specificQuestion) {
      userPrompt += `\nQuestion spécifique : ${specificQuestion}`;
    } else {
      userPrompt += `\nDonne un feedback encourageant et un conseil technique pour progresser.`;
    }

    const response = await fetch(LOCAL_MODEL_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: LOCAL_MODEL_NAME,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Model endpoint error:", response.status, errorText);

      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Trop de requêtes, veuillez réessayer." }), 
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Crédits insuffisants." }), 
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      throw new Error("Erreur lors de l'analyse");
    }

    const data = await response.json();
    const feedback = data.choices[0].message.content;

    console.log("Analysis completed successfully");

    return new Response(JSON.stringify({ feedback }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in analyze-drawing function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), 
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
