"use client";

interface SparklineProps {
  data: number[];
  color?: string;
  width?: number;
  height?: number;
  strokeWidth?: number;
  showArea?: boolean;
}

export function Sparkline({
  data,
  color = "var(--glow-green)",
  width = 80,
  height = 28,
  strokeWidth = 1.5,
  showArea = true,
}: SparklineProps) {
  if (!data || data.length < 2) return null;

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  const padding = 2;
  const w = width - padding * 2;
  const h = height - padding * 2;

  // Build path
  const points = data.map((val, i) => ({
    x: padding + (i / (data.length - 1)) * w,
    y: padding + h - ((val - min) / range) * h,
  }));

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");

  const areaPath = `${linePath} L ${points[points.length - 1].x.toFixed(1)} ${height - padding} L ${points[0].x.toFixed(1)} ${height - padding} Z`;

  // Trend direction
  const lastVal = data[data.length - 1];
  const prevVal = data[data.length - 2];
  const trending = lastVal >= prevVal;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ display: "block" }}>
      <defs>
        <linearGradient id={`spark-grad-${color.replace(/[^a-z0-9]/gi, "")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.2} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      {showArea && (
        <path
          d={areaPath}
          fill={`url(#spark-grad-${color.replace(/[^a-z0-9]/gi, "")})`}
        />
      )}
      <path
        d={linePath}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* End dot */}
      <circle
        cx={points[points.length - 1].x}
        cy={points[points.length - 1].y}
        r={2}
        fill={color}
      />
    </svg>
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
