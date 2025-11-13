import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const LOCAL_MODEL_ENDPOINT = "https://f292749b4931.ngrok-free.app/v1/chat/completions";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { level, focus, previousExercises } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    console.log("Generating exercise for level:", level, "focus:", focus);

    const systemPrompt = `Tu es un expert en enseignement du dessin réaliste, inspiré des méthodes professionnelles.

Génère un exercice de dessin avec une progression étape par étape RÉALISTE :

MÉTHODOLOGIE (inspirée des techniques professionnelles):
1. TOUJOURS commencer par les proportions et la grille (méthode des proportions)
2. Puis les formes de base et lignes principales (construction géométrique)
3. Ensuite les valeurs et ombres de base (tons principaux)
4. Ajouter les détails progressivement (raffinement)
5. Finir par les détails fins et ajustements (finalisation)

Format JSON attendu :
{
  "title": "Titre de l'exercice",
  "description": "Description détaillée et réaliste",
  "steps": [
    "Étape 1: Grille et proportions - Dessinez légèrement la grille de construction et placez les proportions principales",
    "Étape 2: Formes de base - Construisez les formes géométriques simples (cercles, ovales, lignes)",
    "Étape 3: Structure et volumes - Affinez les formes et ajoutez les volumes principaux",
    "Étape 4: Ombres et valeurs - Appliquez les tons principaux et les ombres de base",
    "Étape 5: Détails moyens - Ajoutez les détails intermédiaires et affinez les textures",
    "Étape 6: Finitions - Renforcez les contrastes, ajoutez les détails fins et faites les ajustements finaux"
  ],
  "stepImagePrompts": [
    "Croquis au crayon sur fond blanc: Grille légère avec lignes de construction et marqueurs de proportions pour [sujet], vue [angle], style esquisse technique",
    "Croquis au crayon sur fond blanc: Formes géométriques de base (cercles, ovales, rectangles) construisant [sujet], lignes de construction visibles, style schématique",
    "Croquis au crayon sur fond blanc: Forme générale de [sujet] avec volumes principaux définis, traits de construction encore visibles, style croquis structuré",
    "Dessin au crayon sur fond blanc: [Sujet] avec ombres principales et valeurs tonales appliquées, contraste modéré, style réaliste en développement",
    "Dessin au crayon sur fond blanc: [Sujet] avec détails intermédiaires, textures commencées, ombres nuancées, style réaliste avancé",
    "Dessin au crayon fini sur fond blanc: [Sujet] complètement détaillé, contrastes riches, textures finies, rendu réaliste professionnel"
  ],
  "tips": ["Conseil technique 1", "Conseil technique 2"],
  "focusPoints": ["Point clé 1", "Point clé 2"],
  "duration": "30-45 min",
  "materials": ["Crayon HB", "Crayon 2B", "Crayon 4B", "Gomme", "Estompe"],
  "difficulty": "Débutant|Intermédiaire|Avancé"
}`;

    const userPrompt = `Crée un exercice ${level} focalisé sur : ${focus}.
${previousExercises ? `L'utilisateur a déjà fait : ${previousExercises.join(", ")}. Propose quelque chose de différent et progressif.` : ""}

Réponds UNIQUEMENT avec le JSON, sans texte avant ou après.`;

    const response = await fetch(LOCAL_MODEL_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-20b",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: -1,
        stream: false,
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

    // Générer un croquis pour chaque étape
    const stepImages: string[] = [];
    if (exercise.stepImagePrompts && Array.isArray(exercise.stepImagePrompts)) {
      console.log(`Generating ${exercise.stepImagePrompts.length} step-by-step images...`);

      for (let i = 0; i < exercise.stepImagePrompts.length; i++) {
        try {
          if (!LOVABLE_API_KEY) {
            console.warn("LOVABLE_API_KEY not configured - skipping image generation");
            stepImages.push("");
            continue;
          }
          const prompt = exercise.stepImagePrompts[i];
          console.log(`Generating image ${i + 1}/${exercise.stepImagePrompts.length}...`);

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
                  content: prompt
                }
              ],
              modalities: ["image", "text"]
            }),
          });

          if (imageResponse.ok) {
            const imageData = await imageResponse.json();
            const imageUrl = imageData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
            if (imageUrl) {
              stepImages.push(imageUrl);
              console.log(`Image ${i + 1} generated successfully`);
            } else {
              stepImages.push("");
            }
          } else if (imageResponse.status === 402) {
            console.error("Insufficient credits for image generation - stopping");
            // Retourner l'exercice avec les images générées jusqu'ici
            break;
          } else {
            console.error(`Failed to generate image ${i + 1}:`, imageResponse.status);
            stepImages.push("");
          }
        } catch (imageError) {
          console.error(`Error generating image ${i + 1}:`, imageError);
          stepImages.push("");
        }
      }
    }

    exercise.stepImages = stepImages;
    delete exercise.stepImagePrompts; // Ne pas envoyer les prompts au client
    delete exercise.diagramPrompt; // Ancienne propriété

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
