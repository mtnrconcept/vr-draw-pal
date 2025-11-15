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
  const [markedPoints, setMarkedPoints] = useState<TrackingPoint[]>([]);

  const addPoint = useCallback((x: number, y: number) => {
    const newPoint: TrackingPoint = {
      id: `point_${Date.now()}`,
      x,
      y,
      label: `Point ${markedPoints.length + 1}`
    };
    setMarkedPoints(prev => [...prev, newPoint]);
  }, [markedPoints.length]);

  const removeLastPoint = useCallback(() => {
    setMarkedPoints(prev => prev.slice(0, -1));
  }, []);

  const clearPoints = useCallback(() => {
    setMarkedPoints([]);
  }, []);

  const saveConfiguration = useCallback((name: string, referenceImage: string) => {
    const newConfig: TrackingConfiguration = {
      id: `config_${Date.now()}`,
      name,
      referenceImage,
      points: markedPoints,
      created_at: new Date().toISOString()
    };
    setConfigurations(prev => [...prev, newConfig]);
    setCurrentConfig(newConfig);
    return newConfig;
  }, [markedPoints]);

  const loadConfiguration = useCallback((config: TrackingConfiguration) => {
    setCurrentConfig(config);
    setMarkedPoints(config.points);
  }, []);

  return {
    configurations,
    currentConfig,
    markedPoints,
    addPoint,
    removeLastPoint,
    clearPoints,
    saveConfiguration,
    loadConfiguration
  };
};
