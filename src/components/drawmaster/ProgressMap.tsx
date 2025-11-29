import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, BarChart3, Calendar, Award } from "lucide-react";
import { useState } from "react";

interface ProgressMapProps {
    enabled: boolean;
    onEnabledChange: (enabled: boolean) => void;
}

/**
 * Mode "Cartographie du progrès"
 * Vue 3D holographique de ton évolution:
 * - Proportions
 * - Palette de couleurs
 * - Trait
 * - Fluidité
 * - Temps par zone
 * Dashboard créatif volumétrique
 */
const ProgressMap = ({ enabled, onEnabledChange }: ProgressMapProps) => {
    const [timeRange, setTimeRange] = useState<"week" | "month" | "year">("month");

    const progressData = {
        proportions: { current: 78, previous: 65, trend: "+13%" },
        colorPalette: { current: 82, previous: 75, trend: "+7%" },
        lineQuality: { current: 85, previous: 80, trend: "+5%" },
        fluidity: { current: 72, previous: 68, trend: "+4%" },
        speed: { current: 88, previous: 82, trend: "+6%" }
    };

    const achievements = [
        { id: 1, name: "Maître des proportions", unlocked: true, icon: "🎯" },
        { id: 2, name: "Coloriste expert", unlocked: true, icon: "🎨" },
        { id: 3, name: "Trait fluide", unlocked: false, icon: "✏️" },
        { id: 4, name: "Vitesse éclair", unlocked: true, icon: "⚡" }
    ];

    return (
        <Card className="p-4 border-2 border-green-500/50 bg-gradient-to-br from-green-950/20 to-emerald-950/20">
            <div className="mb-4 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-400" />
                <h3 className="text-lg font-semibold text-green-100">Cartographie du Progrès</h3>
            </div>

            <div className="space-y-4">
                <div className="flex gap-2">
                    <Button
                        size="sm"
                        variant={timeRange === "week" ? "default" : "outline"}
                        onClick={() => setTimeRange("week")}
                        className="flex-1"
                    >
                        <Calendar className="h-4 w-4 mr-1" />
                        Semaine
                    </Button>
                    <Button
                        size="sm"
                        variant={timeRange === "month" ? "default" : "outline"}
                        onClick={() => setTimeRange("month")}
                        className="flex-1"
                    >
                        <Calendar className="h-4 w-4 mr-1" />
                        Mois
                    </Button>
                    <Button
                        size="sm"
                        variant={timeRange === "year" ? "default" : "outline"}
                        onClick={() => setTimeRange("year")}
                        className="flex-1"
                    >
                        <Calendar className="h-4 w-4 mr-1" />
                        Année
                    </Button>
                </div>

                <div className="rounded-lg bg-green-950/40 p-4 border border-green-500/30">
                    <h4 className="text-sm font-semibold text-green-100 mb-3 flex items-center gap-2">
                        <BarChart3 className="h-4 w-4" />
                        Évolution des compétences
                    </h4>

                    <div className="space-y-3">
                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <Label className="text-xs text-green-300">Proportions</Label>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-green-400">{progressData.proportions.trend}</span>
                                    <span className="text-sm font-bold text-green-200">{progressData.proportions.current}%</span>
                                </div>
                            </div>
                            <Progress value={progressData.proportions.current} className="h-2" />
                        </div>

                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <Label className="text-xs text-green-300">Palette de couleurs</Label>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-green-400">{progressData.colorPalette.trend}</span>
                                    <span className="text-sm font-bold text-green-200">{progressData.colorPalette.current}%</span>
                                </div>
                            </div>
                            <Progress value={progressData.colorPalette.current} className="h-2" />
                        </div>

                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <Label className="text-xs text-green-300">Qualité du trait</Label>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-green-400">{progressData.lineQuality.trend}</span>
                                    <span className="text-sm font-bold text-green-200">{progressData.lineQuality.current}%</span>
                                </div>
                            </div>
                            <Progress value={progressData.lineQuality.current} className="h-2" />
                        </div>

                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <Label className="text-xs text-green-300">Fluidité</Label>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-green-400">{progressData.fluidity.trend}</span>
                                    <span className="text-sm font-bold text-green-200">{progressData.fluidity.current}%</span>
                                </div>
                            </div>
                            <Progress value={progressData.fluidity.current} className="h-2" />
                        </div>

                        <div>
                            <div className="flex justify-between items-center mb-1">
                                <Label className="text-xs text-green-300">Vitesse d'exécution</Label>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-green-400">{progressData.speed.trend}</span>
                                    <span className="text-sm font-bold text-green-200">{progressData.speed.current}%</span>
                                </div>
                            </div>
                            <Progress value={progressData.speed.current} className="h-2" />
                        </div>
                    </div>
                </div>

                <div className="rounded-lg bg-green-950/40 p-3 border border-green-500/30">
                    <h4 className="text-sm font-semibold text-green-100 mb-2 flex items-center gap-2">
                        <Award className="h-4 w-4" />
                        Succès débloqués
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                        {achievements.map((achievement) => (
                            <div
                                key={achievement.id}
                                className={`p-2 rounded border text-center ${achievement.unlocked
                                        ? "bg-green-950/60 border-green-500/50"
                                        : "bg-gray-950/60 border-gray-500/30 opacity-50"
                                    }`}
                            >
                                <div className="text-2xl mb-1">{achievement.icon}</div>
                                <p className="text-xs text-green-300">{achievement.name}</p>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="rounded-lg bg-green-950/40 p-3 border border-green-500/30">
                    <h4 className="text-sm font-semibold text-green-100 mb-2">
                        Statistiques du {timeRange === "week" ? "semaine" : timeRange === "month" ? "mois" : "année"}
                    </h4>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="bg-green-950/60 p-2 rounded">
                            <p className="text-green-400">Dessins créés</p>
                            <p className="text-lg font-bold text-green-200">24</p>
                        </div>
                        <div className="bg-green-950/60 p-2 rounded">
                            <p className="text-green-400">Temps total</p>
                            <p className="text-lg font-bold text-green-200">18h</p>
                        </div>
                        <div className="bg-green-950/60 p-2 rounded">
                            <p className="text-green-400">Corrections</p>
                            <p className="text-lg font-bold text-green-200">156</p>
                        </div>
                        <div className="bg-green-950/60 p-2 rounded">
                            <p className="text-green-400">Précision moy.</p>
                            <p className="text-lg font-bold text-green-200">82%</p>
                        </div>
                    </div>
                </div>

                <div className="text-xs text-green-400 bg-green-950/30 p-2 rounded">
                    📊 Visualisez votre évolution comme un dashboard créatif volumétrique.
                    Suivez vos progrès et débloquez des succès !
                </div>
            </div>
        </Card>
    );
};

export default ProgressMap;
