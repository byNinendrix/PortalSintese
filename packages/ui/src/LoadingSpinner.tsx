interface LoadingSpinnerProps {
  label?: string;
}

export function LoadingSpinner({ label = "Carregando dados..." }: LoadingSpinnerProps) {
  return (
    <div className="flex items-center gap-3">
      <span
        className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-sintese-600"
        aria-hidden="true"
      />
      <span className="text-sm text-slate-600">{label}</span>
    </div>
  );
}

