import { Star } from "lucide-react";

interface RatingDisplayProps {
  rating: number;
  count?: number;
  size?: "sm" | "md" | "lg";
}

export function RatingDisplay({
  rating,
  count,
  size = "sm",
}: RatingDisplayProps) {
  const starSize = size === "lg" ? "w-5 h-5" : size === "md" ? "w-4 h-4" : "w-3.5 h-3.5";
  const textSize = size === "lg" ? "text-sm" : "text-xs";

  return (
    <div className="flex items-center gap-1.5">
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((value) => (
          <Star
            key={value}
            className={`${starSize} ${
              value <= Math.round(rating)
                ? "text-[var(--glow-amber)]"
                : "text-[var(--text-muted)]"
            }`}
            fill={value <= Math.round(rating) ? "currentColor" : "none"}
          />
        ))}
      </div>
      <span className={`${textSize} text-[var(--text-muted)]`}>
        {rating.toFixed(1)}
        {count !== undefined && (
          <span className="ml-0.5">({count})</span>
        )}
      </span>
    </div>
  );
}
