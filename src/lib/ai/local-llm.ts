import { toast } from "sonner";

const LOCAL_LLM_URL = "/api/llm";
const TEXT_MODEL = import.meta.env.VITE_TEXT_MODEL || "openai/gpt-oss-20b";
const VISION_MODEL = import.meta.env.VITE_VISION_MODEL || "qwen/qwen3-vl-4b";
const IMAGE_GEN_MODEL = import.meta.env.VITE_IMAGE_GEN_MODEL || "llama-3.2-3b-imagegen";

export interface ChatMessage {
    role: "system" | "user" | "assistant";
    content: string;
}

export const LocalLLMService = {
    models: {
        text: TEXT_MODEL,
        vision: VISION_MODEL,
        imageGen: IMAGE_GEN_MODEL,
    },

    async chatCompletion(messages: ChatMessage[], model = TEXT_MODEL) {
        try {
            const response = await fetch(`${LOCAL_LLM_URL}/chat/completions`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    model,
                    messages,
                    temperature: 0.7,
                    max_tokens: -1,
                    stream: false,
                }),
            });

            if (!response.ok) {
                throw new Error(`LLM API Error: ${response.statusText}`);
            }

            const data = await response.json();
            return data.choices[0].message.content;
        } catch (error) {
            console.error("Local LLM Call Failed:", error);
            throw error;
        }
    },

    async generateExercise(level: string, focus: string) {
        const systemPrompt = `Tu es un professeur d'art expert. Génère un exercice de dessin structuré au format JSON valide.
    Le format doit être EXACTEMENT:
    {
      "title": "Titre de l'exercice",
      "description": "Description courte",
      "steps": ["Etape 1", "Etape 2"],
      "tips": ["Conseil 1", "Conseil 2"],
      "focusPoints": ["Point 1", "Point 2"],
      "duration": "XX minutes",
      "materials": ["Crayon", "Papier"],
      "difficulty": "${level}"
    }
    IMPORTANT:
    - Réponds UNIQUEMENT avec le JSON.
    - Pas de markdown (pas de \`\`\`json).
    - Pas de texte avant ou après.
    - Assure-toi que toutes les chaînes de caractères sont bien échappées.`;

        const userPrompt = `Crée un exercice de niveau ${level} focalisé sur : ${focus}.`;

        try {
            const content = await this.chatCompletion([
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt }
            ], TEXT_MODEL);

            console.log("Raw LLM response for exercise:", content);

            let jsonStr = content.trim();
            // Remove markdown code blocks if present
            jsonStr = jsonStr.replace(/```json/g, "").replace(/```/g, "");

            // Find the first '{' and last '}'
            const start = jsonStr.indexOf('{');
            const end = jsonStr.lastIndexOf('}');

            if (start !== -1 && end !== -1) {
                jsonStr = jsonStr.substring(start, end + 1);
            }

            return JSON.parse(jsonStr);
        } catch (error) {
            console.error("Failed to generate exercise:", error);
            toast.error("Erreur de génération de l'exercice via l'IA locale.");
            throw error;
        }
    },

    async analyzeDrawing(context: { exerciseTitle: string; userProgress: string; specificQuestion?: string }) {
        const systemPrompt = "Tu es un mentor de dessin bienveillant et technique. Donne un feedback court, encourageant et précis.";
        const userPrompt = `Je fais l'exercice "${context.exerciseTitle}". J'en suis à : ${context.userProgress}.
    ${context.specificQuestion ? `Ma question : "${context.specificQuestion}"` : "Donne-moi un conseil pour cette étape."}`;

        try {
            const content = await this.chatCompletion([
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt }
            ], TEXT_MODEL);

            return { feedback: content };
        } catch (error) {
            console.error("Failed to analyze drawing:", error);
            throw error;
        }
    },

    async getGhostMentorFeedback(metrics: { accuracy: number; errors: number; mode: string }) {
        const systemPrompt = "Tu es le 'Ghost Mentor', une IA qui aide à dessiner en temps réel. Sois bref (max 1 phrase).";
        const userPrompt = `L'utilisateur est en mode ${metrics.mode}. Précision: ${metrics.accuracy}%. Erreurs détectées: ${metrics.errors}. Donne un conseil immédiat.`;

        try {
            // Use a faster/smaller model if available, or just the text model
            const content = await this.chatCompletion([
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt }
            ], TEXT_MODEL);
            return content;
        } catch (error) {
            return null;
        }
    }
};
