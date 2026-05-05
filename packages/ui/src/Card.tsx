import type { HTMLAttributes, ReactNode } from "react";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  header?: ReactNode;
  body?: ReactNode;
  footer?: ReactNode;
  children?: ReactNode;
}

export function Card({ header, body, footer, children, className = "", ...props }: CardProps) {
  return (
    <div className={`ds-card ${className}`.trim()} {...props}>
      {header ? <div className="mb-3 border-b border-slate-100 pb-3">{header}</div> : null}
      {body ? <div>{body}</div> : children}
      {footer ? <div className="mt-3 border-t border-slate-100 pt-3">{footer}</div> : null}
    </div>
  );
}
