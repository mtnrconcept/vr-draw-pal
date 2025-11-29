import { Button } from "@/components/ui/button";
import {
    Home,
    MapPin,
    Image,
    Settings,
    Sliders,
    Sparkles,
    Eye,
    Layers,
    Grid3x3,
    Lightbulb,
    Bone,
    Pencil,
    Eraser,
    Palette
} from "lucide-react";

interface AIToolbarProps {
    onToolSelect: (tool: string) => void;
    activeTool: string | null;
    position?: "left" | "right";
}

/**
 * Barre d'outils latérale avec boutons ronds
 * Inspirée du design "Touche-à-Tout"
 */
const AIToolbar = ({ onToolSelect, activeTool, position = "left" }: AIToolbarProps) => {
    const tools = [
        { id: "home", icon: Home, label: "Accueil", color: "bg-green-100 hover:bg-green-200" },
        { id: "position", icon: MapPin, label: "Ma Position", color: "bg-green-100 hover:bg-green-200" },
        { id: "gallery", icon: Image, label: "Galerie", color: "bg-green-100 hover:bg-green-200" },
        { id: "settings", icon: Settings, label: "Galerie", color: "bg-green-100 hover:bg-green-200" },
        { id: "personalize", icon: Sliders, label: "Personnaliser", color: "bg-green-100 hover:bg-green-200" },
    ];

    const aiTools = [
        { id: "guides", icon: Grid3x3, label: "Guides 3D", color: "bg-cyan-100 hover:bg-cyan-200" },
        { id: "anatomy", icon: Bone, label: "Anatomie", color: "bg-emerald-100 hover:bg-emerald-200" },
        { id: "lighting", icon: Lightbulb, label: "Éclairage", color: "bg-amber-100 hover:bg-amber-200" },
        { id: "layers", icon: Layers, label: "Calques", color: "bg-purple-100 hover:bg-purple-200" },
    ];

    const drawingTools = [
        { id: "pencil", icon: Pencil, label: "Crayon Intelligent", color: "bg-blue-100 hover:bg-blue-200" },
        { id: "eraser", icon: Eraser, label: "Gomme Précision", color: "bg-gray-100 hover:bg-gray-200" },
        { id: "palette", icon: Palette, label: "Palette", color: "bg-pink-100 hover:bg-pink-200" },
    ];

    const positionClass = position === "left" ? "left-4" : "right-4";

    return (
        <div className={`absolute ${positionClass} top-1/2 -translate-y-1/2 z-20 flex flex-col gap-3`}>
            {/* Outils principaux */}
            <div className="flex flex-col gap-2 bg-white/80 backdrop-blur-sm rounded-[28px] p-2 shadow-lg border border-white/60">
                {tools.map((tool) => {
                    const Icon = tool.icon;
                    const isActive = activeTool === tool.id;
                    return (
                        <Button
                            key={tool.id}
                            onClick={() => onToolSelect(tool.id)}
                            className={`w-12 h-12 rounded-2xl ${tool.color} ${isActive ? "ring-2 ring-primary ring-offset-2" : ""
                                } transition-all hover:scale-110 p-0 flex items-center justify-center`}
                            title={tool.label}
                        >
                            <Icon className="h-5 w-5 text-foreground" />
                        </Button>
                    );
                })}
            </div>

            {/* Séparateur - Chouette */}
            <div className="flex justify-center">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-lg">
                    <Sparkles className="h-6 w-6 text-white" />
                </div>
            </div>

            {/* Outils IA */}
            <div className="flex flex-col gap-2 bg-white/80 backdrop-blur-sm rounded-[28px] p-2 shadow-lg border border-white/60">
                {aiTools.map((tool) => {
                    const Icon = tool.icon;
                    const isActive = activeTool === tool.id;
                    return (
                        <Button
                            key={tool.id}
                            onClick={() => onToolSelect(tool.id)}
                            className={`w-12 h-12 rounded-2xl ${tool.color} ${isActive ? "ring-2 ring-primary ring-offset-2" : ""
                                } transition-all hover:scale-110 p-0 flex items-center justify-center`}
                            title={tool.label}
                        >
                            <Icon className="h-5 w-5 text-foreground" />
                        </Button>
                    );
                })}
            </div>

            {/* Outils de dessin */}
            <div className="flex flex-col gap-2 bg-white/80 backdrop-blur-sm rounded-[28px] p-2 shadow-lg border border-white/60">
                {drawingTools.map((tool) => {
                    const Icon = tool.icon;
                    const isActive = activeTool === tool.id;
                    return (
                        <Button
                            key={tool.id}
                            onClick={() => onToolSelect(tool.id)}
                            className={`w-12 h-12 rounded-2xl ${tool.color} ${isActive ? "ring-2 ring-primary ring-offset-2" : ""
                                } transition-all hover:scale-110 p-0 flex items-center justify-center`}
                            title={tool.label}
                        >
                            <Icon className="h-5 w-5 text-foreground" />
                        </Button>
                    );
                })}
            </div>
        </div>
    );
};

export default AIToolbar;
