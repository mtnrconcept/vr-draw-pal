import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Sparkles,
    Grid3x3,
    Eye,
    Lightbulb,
    Bone,
    Box,
    Eraser,
    Pencil,
    Layers
} from "lucide-react";

interface AIOverlayProps {
    enabled: boolean;
    mode: "classic" | "ar" | "vr";
    showGuides?: boolean;
    showGrid?: boolean;
    showAnatomy?: boolean;
    showLighting?: boolean;
    showComments?: boolean;
}

/**
 * Overlay IA qui s'affiche sur le module vidéo
 * Affiche les guides 3D, grilles, commentaires IA, etc.
 */
const AIOverlay = ({
    enabled,
    mode,
    showGuides = false,
    showGrid = false,
    showAnatomy = false,
    showLighting = false,
    showComments = true
}: AIOverlayProps) => {
    const [activeTools, setActiveTools] = useState<string[]>([]);
    const [aiComments, setAiComments] = useState([
        { id: 1, text: "Simulateur d'Éclairage (IA) : Observe comment la lumière frappe les surfaces courbes.", position: { top: "10%", right: "5%" } },
        { id: 2, text: "Analyse de Volume (IA) : Ajoute des lignes courbes pour le volume de la jambe.", position: { bottom: "40%", left: "10%" } },
    ]);

    const [lightingZones, setLightingZones] = useState([
        { name: "Zone Ombre Profonde (Bleu F.)", value: "6B" },
        { name: "Zone Ombre Moyenne (Bleu)", value: "4B" },
        { name: "Zone Demi-Teinte (Cyan)", value: "2B" },
        { name: "Zone Neutre (Gris)", value: "HB" },
        { name: "Zone Lumière Douce (Jaune C.)", value: "H" },
        { name: "Zone Lumière Intense (Jaune V.)", value: "2H" },
        { name: "Zone Éclatante (Blanc)", value: "4H" },
    ]);

    if (!enabled) return null;

    return (
        <div className="absolute inset-0 pointer-events-none">
            {/* Grille 3D */}
            {showGrid && (
                <svg className="absolute inset-0 w-full h-full" style={{ opacity: 0.4 }}>
                    {/* Grille horizontale */}
                    {[...Array(10)].map((_, i) => (
                        <line
                            key={`h-${i}`}
                            x1="0"
                            y1={`${i * 10}%`}
                            x2="100%"
                            y2={`${i * 10}%`}
                            stroke="#10b981"
                            strokeWidth="1"
                            strokeDasharray="5,5"
                        />
                    ))}
                    {/* Grille verticale */}
                    {[...Array(10)].map((_, i) => (
                        <line
                            key={`v-${i}`}
                            x1={`${i * 10}%`}
                            y1="0"
                            x2={`${i * 10}%`}
                            y2="100%"
                            stroke="#10b981"
                            strokeWidth="1"
                            strokeDasharray="5,5"
                        />
                    ))}
                </svg>
            )}

            {/* Guides 3D volumétriques */}
            {showGuides && (
                <svg className="absolute inset-0 w-full h-full" style={{ opacity: 0.6 }}>
                    {/* Cône de perspective */}
                    <path
                        d="M 50% 20% L 30% 80% L 70% 80% Z"
                        fill="rgba(16, 185, 129, 0.1)"
                        stroke="#10b981"
                        strokeWidth="2"
                    />
                    {/* Grille déformée */}
                    <path
                        d="M 20% 30% Q 50% 25% 80% 30%"
                        fill="none"
                        stroke="#10b981"
                        strokeWidth="2"
                    />
                    <path
                        d="M 20% 50% Q 50% 45% 80% 50%"
                        fill="none"
                        stroke="#10b981"
                        strokeWidth="2"
                    />
                    <path
                        d="M 20% 70% Q 50% 65% 80% 70%"
                        fill="none"
                        stroke="#10b981"
                        strokeWidth="2"
                    />
                </svg>
            )}

            {/* Overlay anatomique */}
            {showAnatomy && (
                <svg className="absolute inset-0 w-full h-full" style={{ opacity: 0.5 }}>
                    {/* Squelette simplifié */}
                    <circle cx="50%" cy="30%" r="40" fill="none" stroke="#10b981" strokeWidth="2" />
                    <line x1="50%" y1="35%" x2="50%" y2="70%" stroke="#10b981" strokeWidth="3" />
                    <line x1="50%" y1="45%" x2="35%" y2="60%" stroke="#10b981" strokeWidth="2" />
                    <line x1="50%" y1="45%" x2="65%" y2="60%" stroke="#10b981" strokeWidth="2" />
                </svg>
            )}

            {/* Commentaires IA */}
            {showComments && aiComments.map((comment) => (
                <div
                    key={comment.id}
                    className="absolute pointer-events-auto"
                    style={{
                        top: comment.position.top,
                        right: comment.position.right,
                        bottom: comment.position.bottom,
                        left: comment.position.left
                    }}
                >
                    <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-3 shadow-lg border border-white/60 max-w-xs">
                        <div className="flex items-start gap-2">
                            <Sparkles className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                            <p className="text-xs text-foreground leading-relaxed">{comment.text}</p>
                        </div>
                    </div>
                    {/* Flèche pointant vers la zone */}
                    <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-white/95"></div>
                </div>
            ))}

            {/* Zones de lumière (en bas à gauche) */}
            {showLighting && (
                <div className="absolute bottom-4 left-4 pointer-events-auto">
                    <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-3 shadow-lg border border-white/60 max-w-xs">
                        <div className="space-y-1">
                            {lightingZones.map((zone, index) => (
                                <div key={index} className="flex justify-between items-center text-xs">
                                    <span className="text-foreground">{zone.name}</span>
                                    <span className="font-semibold text-primary">{zone.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Indicateurs de correction en rouge */}
            {showGuides && (
                <>
                    <div className="absolute top-1/3 right-1/4 pointer-events-none">
                        <div className="relative">
                            <div className="w-16 h-16 rounded-full border-4 border-red-500/60 animate-pulse"></div>
                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap">
                                <div className="bg-red-500/90 text-white text-xs px-2 py-1 rounded-full">
                                    Proportion à corriger
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* Ghost hand guide (main fantôme cyan) */}
            {showGuides && (
                <svg className="absolute bottom-1/4 right-1/3 w-32 h-32" style={{ opacity: 0.7 }}>
                    <path
                        d="M 20 80 Q 30 60 40 50 L 45 30 Q 48 20 55 25 L 60 45 Q 65 35 70 40 L 72 55 Q 75 50 78 55 L 75 70 Q 72 80 65 85 L 40 90 Z"
                        fill="rgba(6, 182, 212, 0.3)"
                        stroke="#06b6d4"
                        strokeWidth="2"
                    />
                </svg>
            )}
        </div>
    );
};

export default AIOverlay;
