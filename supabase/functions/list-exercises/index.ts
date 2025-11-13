import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.42.6?target=deno";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const supabaseClient =
  SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
    ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
        auth: { persistSession: false },
      })
    : null;

const escapeForIlike = (value: string) =>
  value.replace(/[%_]/g, "\\$&");

const escapeForOrFilter = (value: string) =>
  escapeForIlike(value).replace(/,/g, "\\,");

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        ...corsHeaders,
      },
    });
  }

  if (req.method !== "GET") {
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

  if (!supabaseClient) {
    console.error(
      "[list-exercises] SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY non configuré.",
    );
    return new Response(
      JSON.stringify({
        error:
          "Configuration Supabase manquante : définissez SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY.",
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

  try {
    const url = new URL(req.url);
    const level = url.searchParams.get("level");
    const focus = url.searchParams.get("focus");
    const search = url.searchParams.get("q");
    const limitParam = url.searchParams.get("limit");
    const limit = Math.min(Math.max(Number(limitParam) || 20, 1), 100);

    let query = supabaseClient
      .from("drawing_exercises")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (level) {
      query = query.eq("level", level);
    }

    if (focus) {
      query = query.ilike("focus", `%${escapeForIlike(focus)}%`);
    }

    if (search) {
      query = query.or(
        `title.ilike.%${escapeForOrFilter(search)}%,description.ilike.%${escapeForOrFilter(search)}%`,
      );
    }

    const { data, error } = await query;

    if (error) {
      console.error("[list-exercises] Database error:", error);
      return new Response(
        JSON.stringify({ error: "Impossible de récupérer les exercices" }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        },
      );
    }

    const exercises = (data ?? []).map((exercise) => ({
      id: exercise.id,
      title: exercise.title,
      description: exercise.description,
      steps: exercise.steps ?? [],
      tips: exercise.tips ?? [],
      focusPoints: exercise.focus_points ?? [],
      materials: exercise.materials ?? [],
      stepImages: exercise.step_images ?? [],
      duration: exercise.duration,
      difficulty: exercise.difficulty,
      level: exercise.level,
      focus: exercise.focus,
      metadata: exercise.metadata,
      createdAt: exercise.created_at,
    }));

    return new Response(JSON.stringify({ exercises }), {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("[list-exercises] Unexpected error:", error);
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
