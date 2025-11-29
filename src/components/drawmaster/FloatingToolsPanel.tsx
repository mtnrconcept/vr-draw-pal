import { Pencil, Eraser, Bone, Sparkles } from "lucide-react";

interface FloatingToolsPanelProps {
    visible: boolean;
    position?: { bottom?: string; right?: string; top?: string; left?: string };
}

/**
 * Panneau d'outils flottant
 * Affiche les outils de dessin disponibles avec icônes
 */
const FloatingToolsPanel = ({ visible, position = { bottom: "20%", right: "5%" } }: FloatingToolsPanelProps) => {
    const tools = [
        { id: "smart-pencil", label: "Crayon Intelligent", icon: Pencil },
        { id: "precision-eraser", label: "Gomme de Précision", icon: Eraser },
        { id: "anatomy-guide", label: "Guide d'Anatomie", icon: Bone },
        { id: "metal-texture", label: "Texture Métal", icon: Sparkles },
    ];

    if (!visible) return null;

    return (
        <div
            className="absolute z-20 pointer-events-auto"
            style={position}
        >
            <div className="bg-white/95 backdrop-blur-sm rounded-[24px] p-4 shadow-xl border border-white/60 min-w-[200px]">
                <div className="space-y-2">
                    {tools.map((tool) => {
                        const Icon = tool.icon;
                        return (
                            <div
                                key={tool.id}
                                className="flex items-center gap-3 p-3 rounded-xl hover:bg-primary/10 cursor-pointer transition-colors"
                            >
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                                    <Icon className="h-5 w-5 text-primary" />
                                </div>
                                <span className="text-sm font-medium text-foreground">{tool.label}</span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default FloatingToolsPanel;
