import { useRef, useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Eraser, Pen, Download, Trash2 } from "lucide-react";

interface DrawingCanvasProps {
    width?: number;
    height?: number;
    onDrawingChange?: (canvas: HTMLCanvasElement) => void;
    showGuides?: boolean;
    guides?: Array<{ type: string; points: Array<{ x: number; y: number }> }>;
    showErrors?: boolean;
    errors?: Array<{ position?: { x: number; y: number }; type: string }>;
}

/**
 * Canvas de dessin interactif avec support des guides et erreurs
 */
const DrawingCanvas = ({
    width = 800,
    height = 600,
    onDrawingChange,
    showGuides = false,
    guides = [],
    showErrors = false,
    errors = [],
}: DrawingCanvasProps) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [brushSize, setBrushSize] = useState(2);
    const [brushColor, setBrushColor] = useState("#000000");
    const [tool, setTool] = useState<"pen" | "eraser">("pen");

    // Initialisation du canvas
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // Fond blanc
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, width, height);
    }, [width, height]);

    // Dessiner les guides et erreurs sur l'overlay
    useEffect(() => {
        const overlayCanvas = overlayCanvasRef.current;
        if (!overlayCanvas) return;

        const ctx = overlayCanvas.getContext("2d");
        if (!ctx) return;

        // Clear overlay
        ctx.clearRect(0, 0, width, height);

        // Dessiner les guides
        if (showGuides && guides.length > 0) {
            guides.forEach((guide) => {
                ctx.strokeStyle = "rgba(0, 255, 255, 0.5)";
                ctx.lineWidth = 2;
                ctx.setLineDash([5, 5]);
                ctx.beginPath();
                guide.points.forEach((point, index) => {
                    if (index === 0) {
                        ctx.moveTo(point.x, point.y);
                    } else {
                        ctx.lineTo(point.x, point.y);
                    }
                });
                ctx.stroke();
                ctx.setLineDash([]);
            });
        }

        // Dessiner les marqueurs d'erreur
        if (showErrors && errors.length > 0) {
            errors.forEach((error) => {
                if (error.position) {
                    ctx.strokeStyle = "rgba(255, 0, 0, 0.7)";
                    ctx.fillStyle = "rgba(255, 0, 0, 0.2)";
                    ctx.lineWidth = 3;
                    ctx.beginPath();
                    ctx.arc(error.position.x, error.position.y, 20, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.stroke();
                }
            });
        }
    }, [showGuides, guides, showErrors, errors, width, height]);

    const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        setIsDrawing(true);
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        ctx.beginPath();
        ctx.moveTo(x, y);
    };

    const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isDrawing) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        if (tool === "eraser") {
            ctx.globalCompositeOperation = "destination-out";
            ctx.lineWidth = brushSize * 4;
        } else {
            ctx.globalCompositeOperation = "source-over";
            ctx.strokeStyle = brushColor;
            ctx.lineWidth = brushSize;
        }

        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.lineTo(x, y);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x, y);
    };

    const stopDrawing = () => {
        setIsDrawing(false);
        const canvas = canvasRef.current;
        if (canvas && onDrawingChange) {
            onDrawingChange(canvas);
        }
    };

    const clearCanvas = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, width, height);

        if (onDrawingChange) {
            onDrawingChange(canvas);
        }
    };

    const downloadDrawing = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const link = document.createElement("a");
        link.download = `drawing-${Date.now()}.png`;
        link.href = canvas.toDataURL();
        link.click();
    };

    return (
        <Card className="p-4 bg-slate-900/50 border-slate-700">
            <div className="mb-4 flex items-center gap-4 flex-wrap">
                <div className="flex gap-2">
                    <Button
                        size="sm"
                        variant={tool === "pen" ? "default" : "outline"}
                        onClick={() => setTool("pen")}
                    >
                        <Pen className="h-4 w-4 mr-2" />
                        Crayon
                    </Button>
                    <Button
                        size="sm"
                        variant={tool === "eraser" ? "default" : "outline"}
                        onClick={() => setTool("eraser")}
                    >
                        <Eraser className="h-4 w-4 mr-2" />
                        Gomme
                    </Button>
                </div>

                <div className="flex items-center gap-2">
                    <label className="text-sm text-slate-300">Taille:</label>
                    <input
                        type="range"
                        min="1"
                        max="20"
                        value={brushSize}
                        onChange={(e) => setBrushSize(Number(e.target.value))}
                        className="w-24"
                    />
                    <span className="text-sm text-slate-400">{brushSize}px</span>
                </div>

                <div className="flex items-center gap-2">
                    <label className="text-sm text-slate-300">Couleur:</label>
                    <input
                        type="color"
                        value={brushColor}
                        onChange={(e) => setBrushColor(e.target.value)}
                        className="w-12 h-8 rounded cursor-pointer"
                    />
                </div>

                <div className="flex gap-2 ml-auto">
                    <Button size="sm" variant="outline" onClick={downloadDrawing}>
                        <Download className="h-4 w-4 mr-2" />
                        Télécharger
                    </Button>
                    <Button size="sm" variant="destructive" onClick={clearCanvas}>
                        <Trash2 className="h-4 w-4 mr-2" />
                        Effacer
                    </Button>
                </div>
            </div>

            <div className="relative" style={{ width, height }}>
                {/* Canvas principal */}
                <canvas
                    ref={canvasRef}
                    width={width}
                    height={height}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    className="absolute top-0 left-0 border border-slate-600 rounded cursor-crosshair bg-white"
                />
                {/* Canvas overlay pour guides et erreurs */}
                <canvas
                    ref={overlayCanvasRef}
                    width={width}
                    height={height}
                    className="absolute top-0 left-0 pointer-events-none"
                />
            </div>
        </Card>
    );
};

export default DrawingCanvas;
