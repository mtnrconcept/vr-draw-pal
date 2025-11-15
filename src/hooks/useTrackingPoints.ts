import { useState, useCallback } from "react";
import { TrackingPoint } from "@/lib/opencv/tracker";

export interface TrackingConfiguration {
  id: string;
  name: string;
  referenceImage: string;
  points: TrackingPoint[];
  created_at: string;
}

export const useTrackingPoints = () => {
  const [configurations, setConfigurations] = useState<TrackingConfiguration[]>([]);
  const [currentConfig, setCurrentConfig] = useState<TrackingConfiguration | null>(null);
  const saveConfiguration = useCallback((name: string, referenceImage: string, points: TrackingPoint[]) => {
    const newConfig: TrackingConfiguration = {
      id: `config_${Date.now()}`,
      name,
      referenceImage,
      points,
      created_at: new Date().toISOString()
    };
    setConfigurations(prev => [...prev, newConfig]);
    setCurrentConfig(newConfig);
    return newConfig;
  }, []);

  const loadConfiguration = useCallback((config: TrackingConfiguration) => {
    setCurrentConfig(config);
  }, []);

  return {
    configurations,
    currentConfig,
    saveConfiguration,
    loadConfiguration
  };
};
