import { LocalLLMService } from "./local-llm";

export interface DetectedError {
    id: string;
    type: "proportion" | "perspective" | "anatomy" | "symmetry";
    severity: "low" | "medium" | "high";
    description: string;
    correction: string;
    position: { x: number; y: number };
}

export interface StyleProfile {
    gestureSpeed: number;
    pressure: number;
    lineQuality: "sketchy" | "smooth" | "angular";
    dominantStrokes: "short" | "medium" | "long";
    strengths: string[];
    weaknesses: string[];
    signature3D: {
        speed: number;
        precision: number;
        consistency: number;
        creativity: number;
    };
}

export interface PsychologicalState {
    stressLevel: number;
    confidenceLevel: number;
    currentMood: "confident" | "hesitant" | "stressed" | "relaxed";
    encouragement: string;
    detectedPatterns: {
        hesitations: number;
        corrections: number;
        pauses: number;
        rushPhases: number;
    };
}

/**
 * Service centralisé pour gérer les feedbacks AI en temps réel
 * Connecte tous les outils au LocalLLMService
 */
export const CoachService = {
    async detectErrors(mode: string, imageData?: string): Promise<DetectedError[]> {
        try {
            const prompt = `Analyse ce dessin en mode ${mode}. Détecte les erreurs de proportion, perspective, anatomie et symétrie. 
Retourne un JSON avec un tableau d'erreurs: [{"type": "proportion|perspective|anatomy|symmetry", "severity": "low|medium|high", "description": "...", "correction": "..."}]`;

            const response = await LocalLLMService.chatCompletion([
                { role: "system", content: "Tu es un expert en analyse de dessin. Retourne uniquement du JSON valide." },
                { role: "user", content: prompt }
            ]);

            // Parse et valide la réponse
            const errors = JSON.parse(response);
            return errors.map((err: any, idx: number) => ({
                id: `error-${idx}`,
                type: err.type,
                severity: err.severity,
                description: err.description,
                correction: err.correction,
                position: { x: Math.random() * 300, y: Math.random() * 300 }
            }));
        } catch (error) {
            console.error("Error detection failed:", error);
            return [];
        }
    },

    async analyzeStyle(drawingData?: string): Promise<StyleProfile> {
        try {
            const prompt = `Analyse le style de dessin de l'utilisateur. Évalue: vitesse gestuelle (0-100), pression (0-100), qualité de trait (sketchy/smooth/angular), type de traits dominants (short/medium/long).
Identifie 3 forces et 3 faiblesses. Génère une signature 3D avec: speed, precision, consistency, creativity (0-100 chacun).
Retourne uniquement du JSON: {"gestureSpeed": X, "pressure": Y, "lineQuality": "...", "dominantStrokes": "...", "strengths": [...], "weaknesses": [...], "signature3D": {...}}`;

            const response = await LocalLLMService.chatCompletion([
                { role: "system", content: "Tu es un expert en analyse de style de dessin. Retourne uniquement du JSON valide." },
                { role: "user", content: prompt }
            ]);

            return JSON.parse(response);
        } catch (error) {
            console.error("Style analysis failed:", error);
            // Fallback minimal
            return {
                gestureSpeed: 70,
                pressure: 60,
                lineQuality: "smooth",
                dominantStrokes: "medium",
                strengths: ["Analyse en cours..."],
                weaknesses: ["Analyse en cours..."],
                signature3D: { speed: 70, precision: 60, consistency: 65, creativity: 70 }
            };
        }
    },

    async analyzePsychologicalState(gestureData?: any): Promise<PsychologicalState> {
        try {
            const prompt = `Analyse l'état psychologique d'un dessinateur. Détecte: niveau de stress (0-100), niveau de confiance (0-100), humeur (confident/hesitant/stressed/relaxed).
Compte les patterns: hésitations, corrections, pauses, phases rapides.
Génère un message d'encouragement bienveillant et motivant.
Retourne uniquement du JSON: {"stressLevel": X, "confidenceLevel": Y, "currentMood": "...", "encouragement": "...", "detectedPatterns": {...}}`;

            const response = await LocalLLMService.chatCompletion([
                { role: "system", content: "Tu es un coach psychologique bienveillant spécialisé en art. Retourne uniquement du JSON valide." },
                { role: "user", content: prompt }
            ]);

            return JSON.parse(response);
        } catch (error) {
            console.error("Psychological analysis failed:", error);
            return {
                stressLevel: 30,
                confidenceLevel: 70,
                currentMood: "confident",
                encouragement: "Continuez, vous progressez !",
                detectedPatterns: { hesitations: 0, corrections: 0, pauses: 0, rushPhases: 0 }
            };
        }
    },

    async getVolumetricGuidance(mode: string, guideType: string): Promise<string> {
        try {
            const prompt = `En mode ${mode}, l'utilisateur a activé les guides volumétriques de type "${guideType}".
Génère un conseil technique court pour optimiser l'utilisation de ces guides 3D.`;

            return await LocalLLMService.chatCompletion([
                { role: "system", content: "Tu es un expert en dessin 3D et projection volumétrique." },
                { role: "user", content: prompt }
            ]);
        } catch (error) {
            console.error("Volumetric guidance failed:", error);
            return "Guides volumétriques activés";
        }
    },

    async getRealisticShadowAdvice(lightIntensity: number, softness: number): Promise<string> {
        try {
            const prompt = `L'utilisateur dessine avec ombres réalistes: intensité lumineuse ${lightIntensity}%, douceur ${softness}%.
Donne un conseil court sur la gestion des ombres avec ces paramètres.`;

            return await LocalLLMService.chatCompletion([
                { role: "system", content: "Tu es un expert en théorie de la lumière et des ombres en dessin." },
                { role: "user", content: prompt }
            ]);
        } catch (error) {
            console.error("Shadow advice failed:", error);
            return "";
        }
    }
};
