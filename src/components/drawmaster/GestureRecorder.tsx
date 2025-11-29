import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Video, Play, Pause, SkipBack, SkipForward, TrendingUp } from "lucide-react";
import { useState } from "react";

interface GestureRecorderProps {
    enabled: boolean;
    onEnabledChange: (enabled: boolean) => void;
}

/**
 * Enregistreur de geste : replay cinéma
 * L'IA capture tous tes gestes:
 * - Vitesse, trajectoire, correction, hésitations
 * - Tu peux voir ton dessin dans l'espace en playback
 * - Mode "heatmap" des zones d'erreurs
 * - Timeline pour comparer avant/après une correction
 */
const GestureRecorder = ({ enabled, onEnabledChange }: GestureRecorderProps) => {
    const [isRecording, setIsRecording] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [playbackSpeed, setPlaybackSpeed] = useState(100);
    const [showHeatmap, setShowHeatmap] = useState(true);
    const [showTrajectories, setShowTrajectories] = useState(true);
    const [recordingDuration, setRecordingDuration] = useState(0);
    const [playbackPosition, setPlaybackPosition] = useState(0);

    const toggleRecording = () => {
        if (isRecording) {
            setIsRecording(false);
        } else {
            setIsRecording(true);
            setRecordingDuration(0);
            // Simulate recording
            const interval = setInterval(() => {
                setRecordingDuration(prev => prev + 1);
            }, 1000);
            setTimeout(() => {
                clearInterval(interval);
                setIsRecording(false);
            }, 10000);
        }
    };

    const togglePlayback = () => {
        setIsPlaying(!isPlaying);
    };

    return (
        <Card className="p-4 border-2 border-violet-500/50 bg-gradient-to-br from-violet-950/20 to-fuchsia-950/20">
            <div className="mb-4 flex items-center gap-2">
                <Video className="h-5 w-5 text-violet-400" />
                <h3 className="text-lg font-semibold text-violet-100">Enregistreur de Gestes</h3>
                <Switch
                    checked={enabled}
                    onCheckedChange={onEnabledChange}
                    className="ml-auto"
                />
            </div>

            {enabled && (
                <div className="space-y-4">
                    <div className="flex gap-2">
                        <Button
                            size="sm"
                            variant={isRecording ? "destructive" : "default"}
                            onClick={toggleRecording}
                            className="flex-1"
                        >
                            {isRecording ? (
                                <>
                                    <Pause className="h-4 w-4 mr-2" />
                                    Arrêter ({recordingDuration}s)
                                </>
                            ) : (
                                <>
                                    <Video className="h-4 w-4 mr-2" />
                                    Enregistrer
                                </>
                            )}
                        </Button>
                    </div>

                    {recordingDuration > 0 && !isRecording && (
                        <>
                            <div className="rounded-lg bg-violet-950/40 p-3 border border-violet-500/30">
                                <h4 className="text-sm font-semibold text-violet-100 mb-2">
                                    Enregistrement ({recordingDuration}s)
                                </h4>
                                <div className="flex items-center gap-2">
                                    <Button size="sm" variant="outline" onClick={() => setPlaybackPosition(0)}>
                                        <SkipBack className="h-4 w-4" />
                                    </Button>
                                    <Button size="sm" variant="default" onClick={togglePlayback} className="flex-1">
                                        {isPlaying ? (
                                            <>
                                                <Pause className="h-4 w-4 mr-2" />
                                                Pause
                                            </>
                                        ) : (
                                            <>
                                                <Play className="h-4 w-4 mr-2" />
                                                Lecture
                                            </>
                                        )}
                                    </Button>
                                    <Button size="sm" variant="outline" onClick={() => setPlaybackPosition(recordingDuration)}>
                                        <SkipForward className="h-4 w-4" />
                                    </Button>
                                </div>

                                <div className="mt-3">
                                    <Slider
                                        value={[playbackPosition]}
                                        onValueChange={(v) => setPlaybackPosition(v[0])}
                                        min={0}
                                        max={recordingDuration}
                                        step={0.1}
                                        className="mt-2"
                                    />
                                    <div className="flex justify-between text-xs text-violet-300 mt-1">
                                        <span>{playbackPosition.toFixed(1)}s</span>
                                        <span>{recordingDuration}s</span>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <Label className="text-violet-200">Vitesse de lecture</Label>
                                <Slider
                                    value={[playbackSpeed]}
                                    onValueChange={(v) => setPlaybackSpeed(v[0])}
                                    min={25}
                                    max={200}
                                    step={25}
                                    className="mt-2"
                                />
                                <span className="text-sm text-violet-300">{playbackSpeed}%</span>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <TrendingUp className="h-4 w-4 text-violet-400" />
                                        <Label className="text-sm text-violet-300">Heatmap des erreurs</Label>
                                    </div>
                                    <Switch
                                        checked={showHeatmap}
                                        onCheckedChange={setShowHeatmap}
                                    />
                                </div>

                                <div className="flex items-center justify-between">
                                    <Label className="text-sm text-violet-300">Trajectoires de gestes</Label>
                                    <Switch
                                        checked={showTrajectories}
                                        onCheckedChange={setShowTrajectories}
                                    />
                                </div>
                            </div>

                            <div className="rounded-lg bg-violet-950/40 p-3 border border-violet-500/30">
                                <h4 className="text-sm font-semibold text-violet-100 mb-2">
                                    Analyse des gestes
                                </h4>
                                <div className="space-y-1 text-xs text-violet-300">
                                    <p>📊 Vitesse moyenne: 45 px/s</p>
                                    <p>🎯 Précision: 78%</p>
                                    <p>⚠️ Hésitations détectées: 12</p>
                                    <p>✏️ Corrections appliquées: 8</p>
                                    <p>🔄 Nombre de traits: 34</p>
                                </div>
                            </div>
                        </>
                    )}

                    <div className="text-xs text-violet-400 bg-violet-950/30 p-2 rounded">
                        🎬 Enregistrez vos gestes pour les analyser en replay. Identifiez vos hésitations
                        et comparez avant/après vos corrections.
                    </div>
                </div>
            )}
        </Card>
    );
};

export default GestureRecorder;
