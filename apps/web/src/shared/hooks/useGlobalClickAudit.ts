import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { registrarAcaoPortal } from "../services/auditoria.service";

const CLICKABLE_SELECTOR = "button, a, [role='button'], input[type='button'], input[type='submit']";
const DEDUP_INTERVAL_MS = 800;

function extrairLabel(el: HTMLElement): string | null {
  if (el instanceof HTMLInputElement) {
    const val = el.value?.trim();
    if (val) {
      return val;
    }
  }

  const ariaLabel = el.getAttribute("aria-label")?.trim();
  if (ariaLabel) {
    return ariaLabel;
  }

  const title = el.getAttribute("title")?.trim();
  if (title) {
    return title;
  }

  const text = el.textContent?.replace(/\s+/g, " ").trim() ?? "";
  if (text.length > 0 && text.length <= 80) {
    return text;
  }

  if (text.length > 80) {
    return text.slice(0, 77) + "...";
  }

  return null;
}

function extrairTipo(el: HTMLElement): string {
  const tag = el.tagName.toLowerCase();
  if (tag === "a") {
    return "link";
  }
  if (tag === "input") {
    const type = (el as HTMLInputElement).type?.toLowerCase();
    return type === "submit" ? "submit" : "botao";
  }
  return "botao";
}

function extrairCpfDaPagina(): string | undefined {
  const inputs = document.querySelectorAll<HTMLInputElement>("input");
  for (const input of inputs) {
    const id = (input.id || "").toLowerCase();
    const name = (input.name || "").toLowerCase();
    const type = (input.type || "").toLowerCase();

    if (type === "password" || type === "hidden") {
      continue;
    }

    if (!id.includes("cpf") && !name.includes("cpf")) {
      continue;
    }

    const digits = input.value.replace(/\D/g, "");
    if (digits.length === 11) {
      return digits;
    }
  }
  return undefined;
}

export function useGlobalClickAudit() {
  const location = useLocation();
  const lastRef = useRef<{ motivo: string; time: number }>({ motivo: "", time: 0 });

  useEffect(() => {
    function handler(event: MouseEvent) {
      const target = event.target as HTMLElement | null;
      if (!target) {
        return;
      }

      const clickable = target.closest<HTMLElement>(CLICKABLE_SELECTOR);
      if (!clickable) {
        return;
      }

      const label = extrairLabel(clickable);
      if (!label) {
        return;
      }

      const tipo = extrairTipo(clickable);
      const pagina = location.pathname;
      const motivo = `Clique: ${tipo} ${label} em ${pagina}`;

      const now = Date.now();
      if (motivo === lastRef.current.motivo && now - lastRef.current.time < DEDUP_INTERVAL_MS) {
        return;
      }
      lastRef.current = { motivo, time: now };

      const cpfPagina = extrairCpfDaPagina();
      void registrarAcaoPortal(motivo, undefined, cpfPagina);
    }

    document.addEventListener("click", handler, { capture: true, passive: true });
    return () => {
      document.removeEventListener("click", handler, true);
    };
  }, [location.pathname]);
}
