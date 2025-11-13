import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const LOCAL_MODEL_ENDPOINT = Deno.env.get("LOCAL_MODEL_ENDPOINT");
const LOCAL_MODEL_NAME =
  Deno.env.get("LOCAL_MODEL_NAME") ?? "openai/gpt-oss-20b";

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
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Method not allowed" }),
        {
          status: 405,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        },
      );
    }

    const { level, focus, previousExercises } = await req.json().catch(() => {
      throw new Error("Body JSON invalide");
    });

    if (!LOCAL_MODEL_ENDPOINT) {
      console.error(
        "[generate-exercise] LOCAL_MODEL_ENDPOINT non configuré dans les variables d'environnement Supabase.",
      );
      return new Response(
        JSON.stringify({
          error:
            "Configuration manquante côté serveur : définissez LOCAL_MODEL_ENDPOINT via `supabase secrets set`.",
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

    console.log(
      "[generate-exercise] Request:",
      JSON.stringify({ level, focus, previousExercises }),
    );
    console.log("[generate-exercise] Using local LLM endpoint:", LOCAL_MODEL_ENDPOINT);

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
    // Appel au modèle local LLM avec timeout
    // =========================
    const controller = new AbortController();
    const timeoutMs = 15000;
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    let llmResponse: Response;

    try {
      llmResponse = await fetch(
        LOCAL_MODEL_ENDPOINT,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            // ⚠️ Remplacer par l'ID EXACT renvoyé par /v1/models si différent
            model: LOCAL_MODEL_NAME,
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt },
            ],
            temperature: 0.8,
            max_tokens: 512,
            stream: false,
          }),
          signal: controller.signal,
        },
      );
    } catch (e) {
      clearTimeout(timeoutId);
      console.error("[generate-exercise] Error calling local LLM:", e);

      const isAbort =
        e instanceof DOMException && e.name === "AbortError";

      return new Response(
        JSON.stringify({
          error: isAbort
            ? "Timeout lors de l'appel au modèle local"
            : "Impossible de joindre le modèle local",
        }),
        {
          status: isAbort ? 504 : 502,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        },
      );
    }

    clearTimeout(timeoutId);

    const rawErrorText = await (llmResponse.ok ? Promise.resolve("") : llmResponse.text().catch(() => ""));

    if (!llmResponse.ok) {
      console.error(
        "[generate-exercise] Local LLM HTTP error:",
        llmResponse.status,
        rawErrorText,
      );

      // Cas spécifique: modèle non chargé côté LM Studio / serveur
      if (llmResponse.status === 400 && rawErrorText.includes("Model unloaded")) {
        return new Response(
          JSON.stringify({
            error:
              "Le modèle local est déchargé. Recharge-le dans LM Studio (Keep model in memory) puis réessaie.",
          }),
          {
            status: 503,
            headers: {
              ...corsHeaders,
              "Content-Type": "application/json",
            },
          },
        );
      }

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

      return new Response(
        JSON.stringify({
          error: `Erreur lors de la génération via le modèle local (status ${llmResponse.status})`,
        }),
        {
          status: 502,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        },
      );
    }

    const llmData = await llmResponse.json().catch((e) => {
      console.error("[generate-exercise] Error parsing LLM JSON:", e);
      throw new Error("Réponse JSON invalide du modèle local");
    });

    const content = llmData?.choices?.[0]?.message?.content;

    if (!content || typeof content !== "string") {
      console.error(
        "[generate-exercise] No valid content from local model:",
        JSON.stringify(llmData),
      );
      throw new Error("Réponse du modèle local invalide (pas de content string)");
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
        "[generate-exercise] Failed to parse exercise JSON, raw content:",
        content,
      );
      throw new Error("Format de réponse invalide (JSON strict attendu)");
    }

    console.log("[generate-exercise] Exercise generated:", exercise?.title);

    // Pas de génération d'images pour l'instant
    if (!Array.isArray(exercise.stepImages)) {
      exercise.stepImages = [];
    }
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
