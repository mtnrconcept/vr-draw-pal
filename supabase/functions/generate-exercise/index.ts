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
    const { level, focus, previousExercises } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Generating exercise for level:", level, "focus:", focus);

    const systemPrompt = `Tu es un expert en enseignement du dessin. Tu crées des exercices personnalisés progressifs.

Génère un exercice de dessin adapté qui inclut :
1. Un titre accrocheur et motivant
2. Une description détaillée de ce qu'il faut dessiner (formes, composition, éléments)
3. Des instructions étape par étape (4-6 étapes progressives)
4. Des conseils techniques spécifiques
5. Des points d'attention (proportions, perspective, ombres, etc.)
6. Le temps estimé
7. Le matériel nécessaire
8. Une description détaillée pour générer un schéma visuel des étapes

Format JSON attendu :
{
  "title": "Titre de l'exercice",
  "description": "Description détaillée",
  "steps": ["Étape 1", "Étape 2", "Étape 3", "Étape 4"],
  "tips": ["Conseil 1", "Conseil 2"],
  "focusPoints": ["Point clé 1", "Point clé 2"],
  "duration": "20 min",
  "materials": ["Crayon HB", "Gomme"],
  "difficulty": "Débutant|Intermédiaire|Avancé",
  "diagramPrompt": "Description détaillée pour générer un schéma visuel montrant les 4-6 étapes numérotées de construction du dessin, avec des formes de base progressant vers le résultat final, style croquis au crayon sur fond blanc"
}`;

    const userPrompt = `Crée un exercice ${level} focalisé sur : ${focus}.
${previousExercises ? `L'utilisateur a déjà fait : ${previousExercises.join(", ")}. Propose quelque chose de différent et progressif.` : ""}

Réponds UNIQUEMENT avec le JSON, sans texte avant ou après.`;

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
        temperature: 0.8,
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
      
      throw new Error("Erreur lors de la génération de l'exercice");
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    // Extraire le JSON de la réponse
    let exercise;
    try {
      // Nettoyer le contenu pour extraire le JSON
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        exercise = JSON.parse(jsonMatch[0]);
      } else {
        exercise = JSON.parse(content);
      }
    } catch (parseError) {
      console.error("Failed to parse exercise JSON:", content);
      throw new Error("Format de réponse invalide");
    }

    console.log("Exercise generated successfully:", exercise.title);

    // Générer le schéma visuel des étapes
    let stepDiagramUrl = null;
    if (exercise.diagramPrompt) {
      try {
        console.log("Generating step diagram...");
        const imageResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash-image-preview",
            messages: [
              {
                role: "user",
                content: exercise.diagramPrompt
              }
            ],
            modalities: ["image", "text"]
          }),
        });

        if (imageResponse.ok) {
          const imageData = await imageResponse.json();
          stepDiagramUrl = imageData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
          console.log("Step diagram generated successfully");
        } else {
          console.error("Failed to generate step diagram:", imageResponse.status);
        }
      } catch (imageError) {
        console.error("Error generating step diagram:", imageError);
      }
    }

    exercise.stepDiagram = stepDiagramUrl;

    return new Response(JSON.stringify({ exercise }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in generate-exercise function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), 
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
