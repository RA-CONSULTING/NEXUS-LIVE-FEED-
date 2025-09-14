import * as React from "react";
import { cn } from "@/lib/utils";

type Variant = "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "info";

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: Variant;
}

const Badge = ({ className, variant = "default", ...props }: BadgeProps) => {
  const map: Record<Variant, string> = {
    default: "bg-primary text-primary-foreground",
    secondary: "bg-secondary text-secondary-foreground",
    destructive: "bg-destructive text-destructive-foreground",
    outline: "border",
    success: "bg-green-500 text-green-50",
    warning: "bg-yellow-500 text-yellow-950",
    info: "bg-blue-500 text-blue-50",
  };
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        map[variant],
        className
      )}
      {...props}
    />
  );
};

export { Badge };
export default Badge;
