import { useEffect, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";

export interface VanishingPoint {
  id: string;
  x: number; // percentage 0-100
  y: number; // percentage 0-100
}

export interface PerspectiveGridProps {
  enabled: boolean;
  horizonPosition: number; // percentage from top 0-100
  vanishingPoints: VanishingPoint[];
  onVanishingPointsChange: (points: VanishingPoint[]) => void;
  lineCount: number;
  gridOpacity: number;
  containerWidth: number;
  containerHeight: number;
}

const PerspectiveGrid = ({
  enabled,
  horizonPosition,
  vanishingPoints,
  onVanishingPointsChange,
  lineCount,
  gridOpacity,
  containerWidth,
  containerHeight,
}: PerspectiveGridProps) => {
  const [draggingPointId, setDraggingPointId] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!enabled || !draggingPointId) return;

    const handlePointerMove = (e: PointerEvent) => {
      if (!svgRef.current) return;

      const rect = svgRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;

      onVanishingPointsChange(
        vanishingPoints.map((point) =>
          point.id === draggingPointId
            ? { ...point, x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) }
            : point
        )
      );
    };

    const handlePointerUp = () => {
      setDraggingPointId(null);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [draggingPointId, vanishingPoints, onVanishingPointsChange, enabled]);

  if (!enabled || !containerWidth || !containerHeight) return null;

  const calculatePerspectiveLines = () => {
    const lines: { x1: number; y1: number; x2: number; y2: number }[] = [];

    vanishingPoints.forEach((point) => {
      const vpX = (point.x / 100) * containerWidth;
      const vpY = (point.y / 100) * containerHeight;

      // Create lines radiating from vanishing point to all edges
      const angles: number[] = [];
      for (let i = 0; i < lineCount; i++) {
        angles.push((i / (lineCount - 1)) * Math.PI * 2);
      }

      angles.forEach((angle) => {
        const dx = Math.cos(angle);
        const dy = Math.sin(angle);

        // Calculate intersection with container edges
        let endX = vpX;
        let endY = vpY;
        const maxDistance = Math.max(containerWidth, containerHeight) * 2;

        endX = vpX + dx * maxDistance;
        endY = vpY + dy * maxDistance;

        // Clip to container bounds
        if (endX < 0) {
          const t = -vpX / dx;
          endX = 0;
          endY = vpY + dy * t;
        } else if (endX > containerWidth) {
          const t = (containerWidth - vpX) / dx;
          endX = containerWidth;
          endY = vpY + dy * t;
        }

        if (endY < 0) {
          const t = -vpY / dy;
          endY = 0;
          endX = vpX + dx * t;
        } else if (endY > containerHeight) {
          const t = (containerHeight - vpY) / dy;
          endY = containerHeight;
          endX = vpX + dx * t;
        }

        lines.push({
          x1: vpX,
          y1: vpY,
          x2: endX,
          y2: endY,
        });
      });
    });

    return lines;
  };

  const perspectiveLines = calculatePerspectiveLines();
  const horizonY = (horizonPosition / 100) * containerHeight;

  return (
    <svg
      ref={svgRef}
      className="absolute inset-0 pointer-events-none"
      style={{
        width: "100%",
        height: "100%",
        opacity: gridOpacity / 100,
      }}
      viewBox={`0 0 ${containerWidth} ${containerHeight}`}
      preserveAspectRatio="none"
    >
      {/* Horizon line */}
      <line
        x1="0"
        y1={horizonY}
        x2={containerWidth}
        y2={horizonY}
        stroke="hsl(var(--accent))"
        strokeWidth="2"
        opacity="0.8"
      />

      {/* Perspective lines */}
      {perspectiveLines.map((line, i) => (
        <line
          key={`line-${i}`}
          x1={line.x1}
          y1={line.y1}
          x2={line.x2}
          y2={line.y2}
          stroke="hsl(var(--accent))"
          strokeWidth="1"
          opacity="0.4"
        />
      ))}

      {/* Vanishing points (draggable) */}
      {vanishingPoints.map((point) => {
        const vpX = (point.x / 100) * containerWidth;
        const vpY = (point.y / 100) * containerHeight;

        return (
          <g key={point.id}>
            {/* Outer glow circle */}
            <circle
              cx={vpX}
              cy={vpY}
              r="20"
              fill="hsl(var(--accent))"
              opacity="0.2"
              className="pointer-events-auto cursor-move"
              onPointerDown={(e: ReactPointerEvent) => {
                e.stopPropagation();
                setDraggingPointId(point.id);
              }}
            />
            {/* Main circle */}
            <circle
              cx={vpX}
              cy={vpY}
              r="12"
              fill="hsl(var(--accent))"
              stroke="white"
              strokeWidth="2"
              className="pointer-events-auto cursor-move"
              onPointerDown={(e: ReactPointerEvent) => {
                e.stopPropagation();
                setDraggingPointId(point.id);
              }}
            />
            {/* Center dot */}
            <circle
              cx={vpX}
              cy={vpY}
              r="3"
              fill="white"
              className="pointer-events-none"
            />
          </g>
        );
      })}
    </svg>
  );
};

export default PerspectiveGrid;
