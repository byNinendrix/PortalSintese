import { useEffect, useMemo, useState } from "react";

type TimedAlertProps = {
  message: string;
  className?: string;
  durationMs?: number;
  onClose: () => void;
};

export function TimedAlert({ message, className = "alert-info", durationMs = 5000, onClose }: TimedAlertProps) {
  const durationSeconds = useMemo(() => Math.max(1, Math.ceil(durationMs / 1000)), [durationMs]);
  const [remainingSeconds, setRemainingSeconds] = useState(durationSeconds);
  const [progressPercent, setProgressPercent] = useState(100);

  useEffect(() => {
    setRemainingSeconds(durationSeconds);
    setProgressPercent(100);

    const startedAt = Date.now();
    const timer = window.setInterval(() => {
      const elapsedMs = Date.now() - startedAt;
      const nextRemaining = Math.max(0, Math.ceil((durationMs - elapsedMs) / 1000));
      const nextProgress = Math.max(0, 100 - (elapsedMs / durationMs) * 100);

      setRemainingSeconds(nextRemaining);
      setProgressPercent(nextProgress);
    }, 100);

    const closeTimer = window.setTimeout(() => {
      onClose();
    }, durationMs);

    return () => {
      window.clearInterval(timer);
      window.clearTimeout(closeTimer);
    };
  }, [durationMs, durationSeconds, message, onClose]);

  return (
    <div className={`${className} relative mb-3 overflow-hidden`} role="status" aria-live="polite">
      <div className="flex items-start justify-between gap-3">
        <span>{message}</span>
        <span className="rounded-full bg-white/70 px-2 py-0.5 text-xs font-bold text-slate-700">{remainingSeconds}s</span>
      </div>

      <span
        aria-hidden="true"
        className="absolute bottom-0 left-0 h-1 bg-emerald-500/80"
        style={{
          width: `${progressPercent}%`,
          transition: "width 100ms linear"
        }}
      />
    </div>
  );
}

