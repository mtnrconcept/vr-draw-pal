import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus, Settings } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import TrackingCalibration, { TrackingCalibrationResult } from "./TrackingCalibration";
import { useTrackingPoints, TrackingConfiguration } from "@/hooks/useTrackingPoints";

interface PointTrackingManagerProps {
  onConfigurationReady: (config: TrackingConfiguration) => void;
}

export default function PointTrackingManager({ onConfigurationReady }: PointTrackingManagerProps) {
  const [isCalibrating, setIsCalibrating] = useState(false);
  const { configurations, currentConfig, saveConfiguration, loadConfiguration } = useTrackingPoints();

  const handleCalibrationComplete = (result: TrackingCalibrationResult) => {
    const configName = result.name || `Config ${configurations.length + 1}`;
    const config = saveConfiguration({
      ...result,
      name: configName
    });
    onConfigurationReady(config);
    setIsCalibrating(false);
  };

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Points de Tracking</h3>
          <Button size="sm" onClick={() => setIsCalibrating(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Configurer
          </Button>
        </div>

        {currentConfig && (
          <Card className="p-3 bg-primary/10 border-primary">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium text-sm">{currentConfig.name}</p>
                <p className="text-xs text-muted-foreground">
                  {currentConfig.trackingPoints.length} points de tracking
                </p>
              </div>
              <Settings className="w-4 h-4 text-primary" />
            </div>
          </Card>
        )}

        {!currentConfig && (
          <Card className="p-4 text-center">
            <p className="text-sm text-muted-foreground mb-2">
              Aucune configuration active
            </p>
            <p className="text-xs text-muted-foreground">
              Dessinez des points sur votre feuille puis configurez le tracking
            </p>
          </Card>
        )}

        {configurations.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Configurations sauvegardées</p>
            {configurations.map(config => (
              <Button
                key={config.id}
                variant={currentConfig?.id === config.id ? "default" : "outline"}
                size="sm"
                className="w-full justify-start"
                onClick={() => {
                  loadConfiguration(config);
                  onConfigurationReady(config);
                }}
              >
                {config.name} ({config.trackingPoints.length} pts)
              </Button>
            ))}
          </div>
        )}
      </div>

      <Dialog open={isCalibrating} onOpenChange={setIsCalibrating}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Configurer le suivi des points</DialogTitle>
            <DialogDescription>
              Calibrez les points de référence pour permettre le suivi AR précis de votre
              dessin.
            </DialogDescription>
          </DialogHeader>
          <TrackingCalibration
            onComplete={handleCalibrationComplete}
            onCancel={() => setIsCalibrating(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
