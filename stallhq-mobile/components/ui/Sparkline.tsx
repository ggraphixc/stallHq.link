import React from "react";
import Svg, { Path, Defs, LinearGradient, Stop } from "react-native-svg";

interface SparklineProps {
  data: number[];
  color: string;
  width?: number;
  height?: number;
  strokeWidth?: number;
}

/**
 * Minimal line sparkline with a soft gradient fill — matches the web's
 * Sparkline used on dashboard stat cards.
 */
export function Sparkline({
  data,
  color,
  width = 110,
  height = 26,
  strokeWidth = 1.5,
}: SparklineProps) {
  if (!data || data.length < 2) {
    return <Svg width={width} height={height} />;
  }

  const pad = 2;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  const points = data.map((val, i) => ({
    x: pad + (i / (data.length - 1)) * (width - pad * 2),
    y: pad + (height - pad * 2) - ((val - min) / range) * (height - pad * 2),
  }));

  const line = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(" ");
  const area = `${line} L ${points[points.length - 1].x.toFixed(1)} ${(height - pad).toFixed(1)} L ${points[0].x.toFixed(1)} ${(height - pad).toFixed(1)} Z`;

  return (
    <Svg width={width} height={height}>
      <Defs>
        <LinearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0%" stopColor={color} stopOpacity={0.25} />
          <Stop offset="100%" stopColor={color} stopOpacity={0} />
        </LinearGradient>
      </Defs>
      <Path d={area} fill="url(#sparkFill)" />
      <Path
        d={line}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
