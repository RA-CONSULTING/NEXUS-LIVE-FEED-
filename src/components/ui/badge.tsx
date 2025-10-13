import * as React from "react";
import { cn } from "@/lib/utils";

type Variant = "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "info";

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: Variant;
}

const Badge = ({ className, variant = "default", ...props }: BadgeProps) => {
  const map: Record<Variant, string> = {
    default: "border border-white/20 bg-gradient-to-r from-sky-500/80 via-blue-500/60 to-fuchsia-500/70 text-white",
    secondary: "border border-white/15 bg-white/10 text-slate-200",
    destructive: "border border-rose-400/60 bg-rose-500/25 text-rose-100",
    outline: "border border-white/25 text-slate-200",
    success: "border border-emerald-400/60 bg-emerald-500/25 text-emerald-100",
    warning: "border border-amber-300/60 bg-amber-500/25 text-amber-100",
    info: "border border-sky-400/60 bg-sky-500/25 text-sky-100",
  };
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium backdrop-blur",
        map[variant],
        className
      )}
      {...props}
    />
  );
};

export { Badge };
export default Badge;
