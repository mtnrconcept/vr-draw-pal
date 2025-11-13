import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const LOCAL_MODEL_ENDPOINT =
  Deno.env.get("LOCAL_MODEL_ENDPOINT") ??
  "https://e7c27e33b478.ngrok-free.app/v1/chat/completions";
const LOCAL_MODEL_NAME =
  Deno.env.get("LOCAL_MODEL_NAME") ?? "openai/gpt-oss-20b";
const LOCAL_IMAGE_ENDPOINT = Deno.env.get("LOCAL_IMAGE_ENDPOINT");
const LOCAL_IMAGE_MODEL =
  Deno.env.get("LOCAL_IMAGE_MODEL") ?? LOCAL_MODEL_NAME;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { level, focus, previousExercises } = await req.json();

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
        model: LOCAL_MODEL_NAME,
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

    // Récupérer des images de croquis depuis internet
    const stepImages: string[] = [];
    if (exercise.stepImagePrompts && Array.isArray(exercise.stepImagePrompts)) {
      console.log(`Finding ${exercise.stepImagePrompts.length} sketch images from the web...`);

      // Bibliothèque d'URLs d'images de croquis de haute qualité
      const sketchImageLibrary = [
        "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800&h=800&fit=crop", // sketch drawing
        "https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=800&h=800&fit=crop", // pencil sketch
        "https://images.unsplash.com/photo-1544967082-d9d25d867d66?w=800&h=800&fit=crop", // drawing process
        "https://images.unsplash.com/photo-1542232430-e2e3f1c9e1a4?w=800&h=800&fit=crop", // sketching
        "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&h=800&fit=crop", // art sketch
        "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800&h=800&fit=crop&q=80", // detailed sketch
        "https://images.unsplash.com/photo-1515378960530-7c0da6231fb1?w=800&h=800&fit=crop", // pencil drawing art
        "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=800&h=800&fit=crop", // sketch art
        "https://images.unsplash.com/photo-1452860606245-08befc0ff44b?w=800&h=800&fit=crop", // drawing hands
        "https://images.unsplash.com/photo-1611312449408-fcece27cdbb7?w=800&h=800&fit=crop", // sketch tutorial
        "https://images.unsplash.com/photo-1507301885994-df2c89134c0d?w=800&h=800&fit=crop", // pencil art
        "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=800&h=800&fit=crop", // drawing guide
      ];

      for (let i = 0; i < exercise.stepImagePrompts.length; i++) {
        try {
          // Utiliser une image différente pour chaque étape en rotation
          const imageUrl = sketchImageLibrary[i % sketchImageLibrary.length];
          stepImages.push(imageUrl);
          console.log(`Image ${i + 1}/${exercise.stepImagePrompts.length} assigned from library`);
        } catch (imageError) {
          console.error(`Error assigning image ${i + 1}:`, imageError);
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
