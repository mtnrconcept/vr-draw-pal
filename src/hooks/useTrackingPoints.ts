import { useState, useCallback } from "react";
import { TrackingPoint } from "@/lib/opencv/tracker";

export interface TrackingCalibrationResult {
  name: string;
  referenceImage: string;
  trackingPoints: TrackingPoint[];
  overlayImage: string;
  overlayAnchors: TrackingPoint[];
}

export interface TrackingConfiguration {
  id: string;
  name: string;
  referenceImage: string;
  trackingPoints: TrackingPoint[];
  overlayImage: string;
  overlayAnchors: TrackingPoint[];
  created_at: string;
}

export const useTrackingPoints = () => {
  const [configurations, setConfigurations] = useState<TrackingConfiguration[]>([]);
  const [currentConfig, setCurrentConfig] = useState<TrackingConfiguration | null>(null);
  const saveConfiguration = useCallback((configData: TrackingCalibrationResult) => {
    const newConfig: TrackingConfiguration = {
      id: `config_${Date.now()}`,
      name: configData.name,
      referenceImage: configData.referenceImage,
      trackingPoints: configData.trackingPoints,
      overlayImage: configData.overlayImage,
      overlayAnchors: configData.overlayAnchors,
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
