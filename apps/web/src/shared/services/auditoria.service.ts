import { readAuthSession } from "../../features/auth/services/authSession";
import { apiRequest } from "./apiClient";

function obterCpfSessaoLogada(): string | undefined {
  try {
    const session = readAuthSession();
    const cpfDigits = session?.cpf?.replace(/\D/g, "");
    return cpfDigits?.length === 11 ? cpfDigits : undefined;
  } catch {
    return undefined;
  }
}

export function registrarAcaoPortal(motivo: string, cpfExplicito?: string, cpfPagina?: string): void {
  const sanitizado = motivo
    .replace(/[\r\n\t]+/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim()
    .slice(0, 500);

  if (!sanitizado) {
    return;
  }

  const normalizar = (valor?: string): string | undefined => {
    const digits = valor?.replace(/\D/g, "");
    return digits?.length === 11 ? digits : undefined;
  };

  const cpfFinal = normalizar(cpfExplicito)
    ?? obterCpfSessaoLogada()
    ?? normalizar(cpfPagina)
    ?? undefined;

  const body: { motivo: string; cpf?: string } = { motivo: sanitizado };
  if (cpfFinal) {
    body.cpf = cpfFinal;
  }

  apiRequest<void>("/auditoria/acao", {
    method: "POST",
    body: JSON.stringify(body),
  }).catch(() => {});
}
