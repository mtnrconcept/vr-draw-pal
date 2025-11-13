import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { exerciseTitle, userProgress, specificQuestion } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
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

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
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
