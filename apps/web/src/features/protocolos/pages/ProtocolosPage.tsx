import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Button } from "@sintese/ui";
import { readAuthSession } from "../../auth/services/authSession";
import { digitsOnly, formatCpf } from "../../../shared/utils/masks";
import { useMinhaIdentificacaoQuery } from "../../minhas-filiacoes/hooks/useMinhaIdentificacaoQuery";
import { useProtocolosQuery } from "../hooks/useProtocolosQuery";

function buildEmpresaLabel(codigo?: string | null, empresa?: string | null): string {
  const cod = (codigo ?? "").trim();
  const nome = (empresa ?? "").trim();
  if (cod && nome) {
    return `${cod} ${nome}`;
  }
  return cod || nome || "-";
}

function getStatusClass(status: string): string {
  const normalized = status.trim().toUpperCase();
  if (normalized.includes("FINAL")) {
    return "bg-emerald-50 text-emerald-700 ring-emerald-200";
  }
  if (normalized.includes("REPROV")) {
    return "bg-rose-50 text-rose-700 ring-rose-200";
  }
  return "bg-amber-50 text-amber-700 ring-amber-200";
}

export function ProtocolosPage() {
  const session = readAuthSession();
  const cpfDigits = useMemo(() => digitsOnly(session?.cpf ?? ""), [session?.cpf]);

  const profileQuery = useMinhaIdentificacaoQuery(cpfDigits, Boolean(cpfDigits));
  const protocolosQuery = useProtocolosQuery(cpfDigits, Boolean(cpfDigits));

  const profile = profileQuery.data;
  const protocolos = protocolosQuery.data ?? [];

  return (
    <section className="auth-card-modern mx-auto w-full max-w-[560px]">
      <div className="mb-4 flex justify-center px-3 sm:px-4">
        <img
          src="/logo-sintese-oficial.png"
          alt="Logo SINTESE"
          className="block h-auto object-contain"
          style={{ width: "320px", maxWidth: "100%" }}
        />
      </div>

      {!cpfDigits ? <div className="alert-error mb-3">Sessão inválida. Faça login novamente.</div> : null}
      {profileQuery.isError ? <div className="alert-error mb-3">Não foi possível carregar seu nome.</div> : null}
      {protocolosQuery.isError ? <div className="alert-error mb-3">Não foi possível carregar seus protocolos.</div> : null}

      <div className="space-y-3">
        <div>
          <label htmlFor="protocolos-cpf" className="mb-1 block text-sm text-slate-900">
            CPF
          </label>
          <input
            id="protocolos-cpf"
            value={profile?.cpf ? formatCpf(profile.cpf) : formatCpf(cpfDigits)}
            readOnly
            className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-base font-medium text-slate-700 outline-none"
          />
        </div>

        <div>
          <label htmlFor="protocolos-nome" className="mb-1 block text-sm text-slate-900">
            Nome
          </label>
          <input
            id="protocolos-nome"
            value={profile?.nome ?? (profileQuery.isLoading ? "Carregando..." : "")}
            readOnly
            className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-base font-semibold text-slate-700 outline-none"
          />
        </div>
      </div>

      <article className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="mb-4 text-center text-base font-extrabold tracking-wide text-slate-900">Relação de Protocolo</h2>

        {protocolosQuery.isLoading ? <p className="text-sm text-slate-600">Carregando protocolos...</p> : null}

        {!protocolosQuery.isLoading && !protocolosQuery.isError && protocolos.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm font-semibold text-slate-600">
            Nenhum protocolo encontrado para este CPF.
          </div>
        ) : null}

        <div className="max-h-[420px] space-y-4 overflow-y-auto pr-1">
          {protocolos.map((item, index) => (
            <section key={`${item.protocolo ?? "sem-protocolo"}-${index}`} className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
              <div className="mb-2 flex items-start gap-2">
                <span className="mt-1 text-slate-900">•</span>
                <p className="break-all text-lg font-extrabold uppercase tracking-wide text-red-600">{item.protocolo ?? "-"}</p>
              </div>

              <div className="mb-3">
                <span className={`inline-flex rounded-full px-3 py-1 text-xs font-extrabold uppercase tracking-wide ring-1 ${getStatusClass(item.status)}`}>
                  {item.status}
                </span>
              </div>

              <div className="space-y-2 text-sm text-slate-900">
                <p className="font-semibold">Matrícula: {item.matricula01 ?? "-"}</p>
                <p>{buildEmpresaLabel(item.codigoEmpresa01, item.empresa01)}</p>
                {item.matricula02 ? <p className="font-semibold">Matrícula 2: {item.matricula02}</p> : null}
                {(item.codigoEmpresa02 || item.empresa02) ? <p>{buildEmpresaLabel(item.codigoEmpresa02, item.empresa02)}</p> : null}
              </div>

              {(item.fotoContracheque01 || item.fotoContracheque02) ? (
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {item.fotoContracheque01 ? (
                    <img
                      src={item.fotoContracheque01}
                      alt="Contracheque 01"
                      className="h-24 w-full rounded-lg border border-slate-300 object-cover"
                    />
                  ) : null}
                  {item.fotoContracheque02 ? (
                    <img
                      src={item.fotoContracheque02}
                      alt="Contracheque 02"
                      className="h-24 w-full rounded-lg border border-slate-300 object-cover"
                    />
                  ) : null}
                </div>
              ) : null}
            </section>
          ))}
        </div>
      </article>

      <div className="mt-4">
        <Link to="/menu-principal" className="block">
          <Button type="button" className="btn-modern-danger w-full">
            Sair
          </Button>
        </Link>
      </div>
    </section>
  );
}

