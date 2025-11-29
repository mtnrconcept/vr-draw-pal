/**
 * Service pour communiquer avec le modèle IA local
 * API: https://264f20eaf983.ngrok-free.app
 */

const AI_API_URL = "https://264f20eaf983.ngrok-free.app";

export interface AIAnalysisRequest {
    image?: string; // Base64 encoded image
    prompt: string;
    task: "analyze_drawing" | "detect_errors" | "suggest_corrections" | "analyze_style" | "generate_guides";
}

export interface AIAnalysisResponse {
    success: boolean;
    data: {
        analysis?: string;
        errors?: Array<{
            type: string;
            severity: string;
            description: string;
            correction: string;
            position?: { x: number; y: number };
        }>;
        suggestions?: string[];
        styleProfile?: {
            dominantStyle: string;
            confidence: number;
            characteristics: string[];
        };
        guides?: Array<{
            type: string;
            points: Array<{ x: number; y: number }>;
        }>;
    };
    error?: string;
}

/**
 * Analyse un dessin avec l'IA
 */
export async function analyzeDrawing(
    imageData: string,
    analysisType: AIAnalysisRequest["task"]
): Promise<AIAnalysisResponse> {
    try {
        const response = await fetch(`${AI_API_URL}/api/analyze`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "ngrok-skip-browser-warning": "true",
            },
            body: JSON.stringify({
                image: imageData,
                task: analysisType,
                prompt: getPromptForTask(analysisType),
            }),
        });

        if (!response.ok) {
            throw new Error(`API error: ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error("AI Analysis error:", error);
        return {
            success: false,
            data: {},
            error: error instanceof Error ? error.message : "Unknown error",
        };
    }
}

/**
 * Détecte les erreurs dans un dessin
 */
export async function detectErrors(imageData: string) {
    return analyzeDrawing(imageData, "detect_errors");
}

/**
 * Analyse le style d'un dessin
 */
export async function analyzeStyle(imageData: string) {
    return analyzeDrawing(imageData, "analyze_style");
}

/**
 * Génère des guides de dessin
 */
export async function generateGuides(imageData: string) {
    return analyzeDrawing(imageData, "generate_guides");
}

/**
 * Obtient le prompt approprié pour chaque tâche
 */
function getPromptForTask(task: AIAnalysisRequest["task"]): string {
    const prompts = {
        analyze_drawing: "Analyse ce dessin et fournis des retours constructifs sur la composition, les proportions, et la technique.",
        detect_errors: "Détecte les erreurs de proportions, perspective, anatomie et symétrie dans ce dessin. Fournis des corrections précises.",
        suggest_corrections: "Suggère des corrections spécifiques pour améliorer ce dessin.",
        analyze_style: "Analyse le style artistique de ce dessin. Identifie les influences, techniques et caractéristiques dominantes.",
        generate_guides: "Génère des guides de construction (lignes, formes de base, points clés) pour ce dessin.",
    };
    return prompts[task];
}

/**
 * Convertit un canvas en base64
 */
export function canvasToBase64(canvas: HTMLCanvasElement): string {
    return canvas.toDataURL("image/png").split(",")[1];
}

/**
 * Convertit un élément vidéo en base64
 */
export function videoFrameToBase64(video: HTMLVideoElement): string {
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (ctx) {
        ctx.drawImage(video, 0, 0);
    }
    return canvasToBase64(canvas);
}
