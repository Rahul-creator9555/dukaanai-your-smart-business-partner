import { Store } from "lucide-react";

interface BrandMarkProps {
  size?: "sm" | "md" | "lg";
  showName?: boolean;
}

const sizes = {
  sm: { box: "h-10 w-10", icon: "h-5 w-5", text: "text-lg" },
  md: { box: "h-14 w-14", icon: "h-7 w-7", text: "text-2xl" },
  lg: { box: "h-20 w-20", icon: "h-10 w-10", text: "text-4xl" },
};

export function BrandMark({ size = "md", showName = true }: BrandMarkProps) {
  const s = sizes[size];
  return (
    <div className="flex items-center gap-3">
      <div
        className={`${s.box} grid place-items-center rounded-2xl bg-primary text-primary-foreground shadow-elevation-2`}
      >
        <Store className={s.icon} strokeWidth={2.4} />
      </div>
      {showName && (
        <span className={`${s.text} font-semibold tracking-tight text-foreground font-[var(--font-display)]`}>
          Dukaan<span className="text-primary">AI</span>
        </span>
      )}
    </div>
  );
}
