interface StoreAvatarProps {
  name: string;
  logoUrl?: string | null;
  size?: "sm" | "md" | "lg" | "xl";
  rounded?: "full" | "2xl";
}

const sizeMap: Record<string, { box: string; fontSize: string }> = {
  sm: { box: "2rem", fontSize: "0.75rem" },
  md: { box: "2.5rem", fontSize: "0.875rem" },
  lg: { box: "3.5rem", fontSize: "1.125rem" },
  xl: { box: "5rem", fontSize: "1.25rem" },
};

const radiusMap: Record<string, string> = {
  full: "50%",
  "2xl": "0.75rem",
};

export function StoreAvatar({ name, logoUrl, size = "md", rounded = "full" }: StoreAvatarProps) {
  const initial = name?.charAt(0)?.toUpperCase() || "?";
  const s = sizeMap[size] || sizeMap.md;
  const br = radiusMap[rounded] || "50%";

  if (logoUrl) {
    return (
      <img
        src={logoUrl}
        alt={name}
        style={{
          width: s.box,
          height: s.box,
          borderRadius: br,
          objectFit: "cover",
          border: "2px solid var(--bg-card)",
          flexShrink: 0,
        }}
      />
    );
  }

  return (
    <div
      style={{
        width: s.box,
        height: s.box,
        borderRadius: br,
        background: "linear-gradient(135deg, var(--glow-purple), var(--glow-cyan))",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 700,
        fontSize: s.fontSize,
        color: "white",
        border: "2px solid var(--bg-card)",
        flexShrink: 0,
      }}
    >
      {initial}
    </div>
  );
}
