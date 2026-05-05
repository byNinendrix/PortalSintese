import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "accent" | "ghost";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: ButtonVariant;
  isLoading?: boolean;
}

const variantClassMap: Record<ButtonVariant, string> = {
  primary: "btn-primary",
  secondary: "btn-secondary",
  accent: "btn-accent",
  ghost: "btn-ghost"
};

export function Button({
  children,
  variant = "primary",
  isLoading = false,
  disabled,
  className = "",
  ...props
}: ButtonProps) {
  const classes = `${variantClassMap[variant]} ${className}`.trim();

  return (
    <button
      type="button"
      className={classes}
      disabled={disabled || isLoading}
      aria-busy={isLoading}
      {...props}
    >
      {isLoading ? "Carregando..." : children}
    </button>
  );
}
