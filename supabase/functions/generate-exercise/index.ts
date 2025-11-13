import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const LOCAL_AI_BASE_URL =
  Deno.env.get("LOCAL_AI_BASE_URL") ?? "https://f292749b4931.ngrok-free.app";

serve(async (req) => {
  // Préflight CORS
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        ...corsHeaders,
      },
    });
  }

  try {
    const { level, focus, previousExercises } = await req.json();

    console.log(
      "[generate-exercise] Incoming request:",
      JSON.stringify({ level, focus, previousExercises }),
    );
    console.log(
      "[generate-exercise] Using local LLM base URL:",
      LOCAL_AI_BASE_URL,
    );

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

    // =========================
    // Appel au modèle local LLM
    // =========================
    const llmResponse = await fetch(
      `${LOCAL_AI_BASE_URL}/v1/chat/completions`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "openai/gpt-oss-20b", // ⚠️ mets ici l'id exact renvoyé par /v1/models
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          temperature: 0.8,
          max_tokens: 512,
          stream: false,
        }),
      },
    );

    if (!llmResponse.ok) {
      const errorText = await llmResponse.text();
      console.error(
        "[generate-exercise] Local LLM error:",
        llmResponse.status,
        errorText,
      );

      if (llmResponse.status === 429) {
        return new Response(
          JSON.stringify({
            error:
              "Trop de requêtes vers le modèle local, veuillez réessayer plus tard.",
          }),
          {
            status: 429,
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
            },
          },
        );
      }

      throw new Error(
        `Erreur lors de la génération de l'exercice via le modèle local (status ${llmResponse.status})`,
      );
    }

    const llmData = await llmResponse.json();
    const content = llmData.choices?.[0]?.message?.content;

    if (!content) {
      console.error(
        "[generate-exercise] Réponse vide ou sans 'content' depuis le modèle local:",
        JSON.stringify(llmData),
      );
      throw new Error("Réponse du modèle local invalide (pas de content)");
    }

    // =========================
    // Parsing du JSON renvoyé
    // =========================
    let exercise: any;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        exercise = JSON.parse(jsonMatch[0]);
      } else {
        exercise = JSON.parse(content);
      }
    } catch (parseError) {
      console.error(
        "[generate-exercise] Failed to parse exercise JSON from local model, raw content:",
        content,
      );
      throw new Error("Format de réponse invalide (JSON strict attendu)");
    }

    console.log("[generate-exercise] Exercise generated:", exercise.title);

    // =======================================
    // Génération d'images (optionnelle)
    // =======================================
    const stepImages: string[] = [];
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!exercise.stepImagePrompts || !Array.isArray(exercise.stepImagePrompts)) {
      console.log(
        "[generate-exercise] Aucun stepImagePrompts valide, skip génération d'images.",
      );
    } else if (!LOVABLE_API_KEY) {
      console.warn(
        "[generate-exercise] LOVABLE_API_KEY manquante, les stepImages resteront vides.",
      );
    } else {
      console.log(
        `[generate-exercise] Generating ${exercise.stepImagePrompts.length} images via Lovable AI...`,
      );

      for (let i = 0; i < exercise.stepImagePrompts.length; i++) {
        try {
          const prompt = exercise.stepImagePrompts[i];
          console.log(
            `[generate-exercise] Generating image ${i + 1}/${
              exercise.stepImagePrompts.length
            }`,
          );

          const imageResponse = await fetch(
            "https://ai.gateway.lovable.dev/v1/chat/completions",
            {
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
                    content: prompt,
                  },
                ],
                modalities: ["image", "text"],
              }),
            },
          );

          if (imageResponse.ok) {
            const imageData = await imageResponse.json();
            const imageUrl =
              imageData.choices?.[0]?.message?.images?.[0]?.image_url?.url;
            if (imageUrl) {
              stepImages.push(imageUrl);
              console.log(
                `[generate-exercise] Image ${i + 1} generated successfully`,
              );
            } else {
              console.warn(
                `[generate-exercise] Image ${i + 1}: pas d'URL retournée`,
              );
              stepImages.push("");
            }
          } else if (imageResponse.status === 402) {
            console.error(
              "[generate-exercise] Insufficient credits for image generation - stopping",
            );
            break;
          } else {
            console.error(
              `[generate-exercise] Failed to generate image ${i + 1}:`,
              imageResponse.status,
              await imageResponse.text(),
            );
            stepImages.push("");
          }
        } catch (imageError) {
          console.error(
            `[generate-exercise] Error generating image ${i + 1}:`,
            imageError,
          );
          stepImages.push("");
        }
      }
    }

    exercise.stepImages = stepImages;
    delete exercise.stepImagePrompts;
    delete exercise.diagramPrompt;

    return new Response(JSON.stringify({ exercise }), {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("[generate-exercise] Global error:", error);

    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      },
    );
  }
});
