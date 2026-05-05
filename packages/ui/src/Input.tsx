import type { InputHTMLAttributes } from "react";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  id: string;
  error?: string;
  helperText?: string;
  maskHint?: string;
}

export function Input({
  label,
  id,
  error,
  helperText,
  maskHint,
  className = "",
  ...props
}: InputProps) {
  return (
    <div className="w-full">
      <label htmlFor={id} className="form-label">
        {label}
      </label>
      <input id={id} className={`form-input ${className}`.trim()} {...props} />
      {helperText ? <p className="mt-1 text-xs text-slate-500">{helperText}</p> : null}
      {maskHint ? <p className="mt-1 text-xs text-slate-500">Máscara prevista: {maskHint}</p> : null}
      {error ? <p className="mt-1 text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
