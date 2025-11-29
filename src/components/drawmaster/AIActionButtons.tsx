import { Button } from "@/components/ui/button";
import { Play, Sparkles, Eye, Image as ImageIcon, Lightbulb } from "lucide-react";

interface AIActionButtonsProps {
    onAction: (action: string) => void;
    activeActions: string[];
}

/**
 * Boutons d'action en bas du module vidéo
 * Style arrondi avec icônes, comme sur les images de référence
 */
const AIActionButtons = ({ onAction, activeActions }: AIActionButtonsProps) => {
    const actions = [
        {
            id: "change-model",
            label: "Changer le Modèle",
            icon: ImageIcon,
            variant: "default" as const
        },
        {
            id: "zone-isolation",
            label: "Activer Isolation de Zone",
            icon: Eye,
            variant: "outline" as const
        },
        {
            id: "ai-help",
            label: "Demander Aide IA",
            icon: Sparkles,
            variant: "outline" as const
        },
        {
            id: "style-active",
            label: "Style 'Animation 3D' Actif",
            icon: Play,
            variant: "default" as const,
            active: true
        },
    ];

    return (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex flex-wrap gap-3 justify-center max-w-2xl px-4">
            {actions.map((action) => {
                const Icon = action.icon;
                const isActive = activeActions.includes(action.id) || action.active;

                return (
                    <Button
                        key={action.id}
                        onClick={() => onAction(action.id)}
                        className={`
              rounded-full px-6 py-3 h-auto
              ${isActive
                                ? "bg-primary text-white shadow-lg"
                                : "bg-white/90 text-foreground border border-white/60 shadow-md"
                            }
              backdrop-blur-sm
              hover:scale-105 transition-all
              text-sm font-semibold
              flex items-center gap-2
            `}
                    >
                        <Icon className="h-4 w-4" />
                        <span className="hidden sm:inline">{action.label}</span>
                        <span className="sm:hidden">{action.label.split(' ')[0]}</span>
                    </Button>
                );
            })}
        </div>
    );
};

export default AIActionButtons;
