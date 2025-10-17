import * as React from "react";
import { cn } from "@/lib/utils";

type Variant = "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "info";

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: Variant;
}

const Badge = ({ className, variant = "default", ...props }: BadgeProps) => {
  const map: Record<Variant, string> = {
    default:
      "border border-[rgba(214,172,121,0.35)] bg-gradient-to-r from-[#a67c52]/80 via-[#8f6b44]/70 to-[#6b8a5e]/75 text-[#fbf6ec]",
    secondary: "border border-[rgba(214,172,121,0.2)] bg-[rgba(58,44,31,0.45)] text-[#f0e6d8]",
    destructive: "border border-[rgba(180,82,52,0.45)] bg-[rgba(180,82,52,0.2)] text-[#fbe9e2]",
    outline: "border border-[rgba(214,172,121,0.35)] text-[#e8dccc]",
    success: "border border-[rgba(90,124,74,0.45)] bg-[rgba(79,107,64,0.25)] text-[#e6f1de]",
    warning: "border border-[rgba(217,155,84,0.45)] bg-[rgba(217,155,84,0.22)] text-[#fdf3e4]",
    info: "border border-[rgba(142,164,126,0.45)] bg-[rgba(142,164,126,0.22)] text-[#f2f6ed]",
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
