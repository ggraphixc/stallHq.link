interface StoreAvatarProps {
  name: string;
  logoUrl?: string | null;
  size?: "sm" | "md" | "lg" | "xl";
  rounded?: "full" | "2xl";
}

const sizeMap = {
  sm: "w-8 h-8 text-xs",
  md: "w-10 h-10 text-sm",
  lg: "w-14 h-14 text-lg",
  xl: "w-20 h-20 text-xl",
};

const radiusMap = {
  full: "rounded-full",
  "2xl": "rounded-2xl",
};

export function StoreAvatar({ name, logoUrl, size = "md", rounded = "full" }: StoreAvatarProps) {
  const initial = name?.charAt(0)?.toUpperCase() || "?";

  if (logoUrl) {
    return (
      <img
        src={logoUrl}
        alt={name}
        className={`${sizeMap[size]} ${radiusMap[rounded]} object-cover border-2 border-[var(--bg-card)]`}
      />
    );
  }

  return (
    <div
      className={`${sizeMap[size]} ${radiusMap[rounded]} bg-gradient-to-br from-[var(--glow-purple)] to-[var(--glow-cyan)] flex items-center justify-center font-bold text-white border-2 border-[var(--bg-card)]`}
    >
      {initial}
    </div>
  );
}
