"use client";

import { useState, useRef } from "react";

interface SparklineProps {
  data: number[];
  prevData?: number[]; // last week comparison (faded line behind)
  labels?: string[];   // day labels for tooltip (e.g. ["Mon","Tue",...])
  color?: string;
  width?: number;
  height?: number;
  strokeWidth?: number;
  showArea?: boolean;
  valuePrefix?: string; // e.g. "₦" or ""
}

export function Sparkline({
  data,
  prevData,
  labels,
  color = "var(--glow-green)",
  width = 80,
  height = 28,
  strokeWidth = 1.5,
  showArea = true,
  valuePrefix = "",
}: SparklineProps) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  if (!data || data.length < 2) return null;

  // Combine current + prev data for consistent scaling
  const allValues = prevData ? [...data, ...prevData] : data;
  const max = Math.max(...allValues);
  const min = Math.min(...allValues);
  const range = max - min || 1;

  const padding = 2;
  const w = width - padding * 2;
  const h = height - padding * 2;

  const toPoints = (values: number[]) =>
    values.map((val, i) => ({
      x: padding + (i / (values.length - 1)) * w,
      y: padding + h - ((val - min) / range) * h,
    }));

  const points = toPoints(data);
  const prevPoints = prevData ? toPoints(prevData) : null;

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
  const areaPath = `${linePath} L ${points[points.length - 1].x.toFixed(1)} ${height - padding} L ${points[0].x.toFixed(1)} ${height - padding} Z`;
  const prevLinePath = prevPoints ? prevPoints.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ") : null;

  // Day labels
  const dayLabels = labels || (() => {
    const names = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const now = new Date();
    return data.map((_, i) => {
      const d = new Date(now);
      d.setDate(d.getDate() - (data.length - 1 - i));
      return names[d.getDay()];
    });
  })();

  // Gradient ID must be unique per instance
  const gradId = `spark-${Math.random().toString(36).slice(2, 8)}`;

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!svgRef.current) return;
    const rect = svgRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const idx = Math.round(((x - padding) / w) * (data.length - 1));
    setHoverIdx(Math.max(0, Math.min(data.length - 1, idx)));
  };

  // Hover tooltip position
  const tooltipX = hoverIdx !== null ? points[hoverIdx].x : 0;
  const tooltipY = hoverIdx !== null ? points[hoverIdx].y : 0;
  const tooltipVal = hoverIdx !== null ? data[hoverIdx] : 0;
  const tooltipLabel = hoverIdx !== null ? dayLabels[hoverIdx] : "";

  return (
    <div style={{ position: "relative" }}>
      <svg
        ref={svgRef}
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        style={{ display: "block", cursor: "crosshair" }}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoverIdx(null)}
      >
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.2} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>

        {/* Previous week line (faded) */}
        {prevLinePath && (
          <path
            d={prevLinePath}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth * 0.7}
            strokeOpacity={0.25}
            strokeDasharray="3 2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* Current week area */}
        {showArea && (
          <path d={areaPath} fill={`url(#${gradId})`} />
        )}

        {/* Current week line */}
        <path
          d={linePath}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Hover crosshair */}
        {hoverIdx !== null && (
          <>
            <line
              x1={tooltipX}
              y1={padding}
              x2={tooltipX}
              y2={height - padding}
              stroke="var(--text-muted)"
              strokeWidth={0.5}
              strokeOpacity={0.4}
            />
            <circle
              cx={tooltipX}
              cy={tooltipY}
              r={3}
              fill="var(--bg-secondary)"
              stroke={color}
              strokeWidth={1.5}
            />
          </>
        )}

        {/* End dot */}
        <circle
          cx={points[points.length - 1].x}
          cy={points[points.length - 1].y}
          r={2}
          fill={color}
        />
      </svg>

      {/* Hover tooltip */}
      {hoverIdx !== null && (
        <div style={{
          position: "absolute",
          left: `${tooltipX}px`,
          top: `${Math.max(0, tooltipY - 28)}px`,
          transform: "translateX(-50%)",
          background: "var(--bg-secondary)",
          border: "1px solid var(--border-subtle)",
          borderRadius: "0.375rem",
          padding: "0.125rem 0.375rem",
          fontSize: "0.5625rem",
          fontWeight: 600,
          color: color,
          whiteSpace: "nowrap",
          pointerEvents: "none",
          zIndex: 10,
          boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
          lineHeight: 1.4,
          textAlign: "center",
        }}>
          <div style={{ color: "var(--text-muted)", fontWeight: 400 }}>{tooltipLabel}</div>
          <div>{valuePrefix}{tooltipVal.toLocaleString()}</div>
        </div>
      )}
    </div>
  );
}

/**
 * Generate 7 daily data points from a day-keyed record.
 * Fills missing days with 0.
 */
export function get7DayData(dayData: Record<string, number>): number[] {
  const result: number[] = [];
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split("T")[0];
    result.push(dayData[key] || 0);
  }
  return result;
}

/**
 * Generate day labels for the last N days.
 */
export function get7DayLabels(): string[] {
  const names = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const result: string[] = [];
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    result.push(names[d.getDay()]);
  }
  return result;
}
