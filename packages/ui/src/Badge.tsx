import type { HTMLAttributes } from "react";

type BadgeVariant = "default" | "success" | "warning" | "error" | "info";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: "bg-slate-100 text-slate-700 border border-slate-200",
  success: "bg-emerald-100 text-emerald-700 border border-emerald-200",
  warning: "bg-amber-100 text-amber-700 border border-amber-200",
  error: "bg-red-100 text-red-700 border border-red-200",
  info: "bg-sky-100 text-sky-700 border border-sky-200"
};

export function Badge({ variant = "default", className = "", ...props }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${variantClasses[variant]} ${className}`.trim()}
      {...props}
    />
  );
}

