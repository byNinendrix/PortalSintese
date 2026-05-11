import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Button } from "@sintese/ui";
import { readAuthSession } from "../../auth/services/authSession";
import { digitsOnly, formatCpf } from "../../../shared/utils/masks";
import { useMinhaIdentificacaoQuery } from "../hooks/useMinhaIdentificacaoQuery";
import { useMinhasFiliacoesQuery } from "../hooks/useMinhasFiliacoesQuery";

function getSituacaoBadgeClass(situacao: string): string {
  const normalized = situacao.trim().toUpperCase();

  if (normalized === "ATIVO") {
    return "bg-emerald-50 text-emerald-700 ring-emerald-200";
  }

  if (normalized === "INATIVO") {
    return "bg-rose-50 text-rose-700 ring-rose-200";
  }

  return "bg-amber-50 text-amber-700 ring-amber-200";
}

export function MinhasFiliacoesPage() {
  const session = readAuthSession();
  const cpfDigits = useMemo(() => digitsOnly(session?.cpf ?? ""), [session?.cpf]);

  const profileQuery = useMinhaIdentificacaoQuery(cpfDigits, Boolean(cpfDigits));
  const filiacoesQuery = useMinhasFiliacoesQuery(cpfDigits, Boolean(cpfDigits));

  const profile = profileQuery.data;
  const filiacoes = filiacoesQuery.data ?? [];

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

      <h1 className="section-title mb-4">Minhas Filiações</h1>

      {!cpfDigits ? <div className="alert-error mb-3">Sessão inválida. Faça login novamente.</div> : null}
      {profileQuery.isError ? (
        <div className="alert-error mb-3">Não foi possível carregar seus dados de identificação.</div>
      ) : null}
      {filiacoesQuery.isError ? <div className="alert-error mb-3">Não foi possível carregar suas filiações.</div> : null}

      <div className="space-y-3">
        <div>
          <label htmlFor="filiacoes-cpf" className="mb-1 block text-sm text-slate-900">
            CPF
          </label>
          <input
            id="filiacoes-cpf"
            value={profile?.cpf ? formatCpf(profile.cpf) : formatCpf(cpfDigits)}
            readOnly
            className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-base font-medium text-slate-700 outline-none"
          />
        </div>

        <div>
          <label htmlFor="filiacoes-nome" className="mb-1 block text-sm text-slate-900">
            Nome
          </label>
          <input
            id="filiacoes-nome"
            value={profile?.nome ?? (profileQuery.isLoading ? "Carregando..." : "")}
            readOnly
            className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-base font-semibold text-slate-700 outline-none"
          />
        </div>

        <Link to="/menu-principal" className="block">
          <Button type="button" className="btn-modern-danger w-full">
            Sair
          </Button>
        </Link>
      </div>

      <article className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="mb-4 text-center text-lg font-extrabold tracking-wide text-slate-900">Filiações</h2>

        {filiacoesQuery.isLoading ? <p className="text-sm text-slate-600">Carregando suas filiações...</p> : null}

        {!filiacoesQuery.isLoading && !filiacoesQuery.isError && filiacoes.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm font-semibold text-slate-600">
            Nenhuma filiação encontrada para este CPF.
          </div>
        ) : null}

        <div className="space-y-3">
          {filiacoes.map((filiacao, index) => (
            <section
              key={`${filiacao.matricula}-${filiacao.codigoEmpresa}-${filiacao.codigoPredio}-${index}`}
              className="rounded-xl border border-slate-200 bg-slate-50/70 p-4"
            >
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span
                  className={`inline-flex rounded-full px-3 py-1 text-xs font-extrabold uppercase tracking-wide ring-1 ${getSituacaoBadgeClass(
                    filiacao.situacao
                  )}`}
                >
                  {filiacao.situacao || "SEM SITUAÇÃO"}
                </span>
                <span className="text-base font-extrabold text-slate-900">Matrícula: {filiacao.matricula || "-"}</span>
              </div>

              <dl className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
                <div>
                  <dt className="font-semibold text-slate-500">Empresa</dt>
                  <dd className="font-semibold text-slate-900">
                    {filiacao.codigoEmpresa || "-"} {filiacao.descricaoEmpresa || ""}
                  </dd>
                </div>

                <div>
                  <dt className="font-semibold text-slate-500">Prédio</dt>
                  <dd className="font-semibold text-slate-900">
                    {filiacao.codigoPredio || "-"} {filiacao.descricaoPredio || ""}
                  </dd>
                </div>

                <div>
                  <dt className="font-semibold text-slate-500">Região</dt>
                  <dd className="font-semibold text-slate-900">{filiacao.regiao || "Não informada"}</dd>
                </div>

                <div>
                  <dt className="font-semibold text-slate-500">Tempo de Filiação</dt>
                  <dd className="font-semibold text-slate-900">{filiacao.tempoFiliacao || "Não informado"}</dd>
                </div>
              </dl>
            </section>
          ))}
        </div>
      </article>

      <div className="mt-10 flex justify-center">
        <img src="/Logo%20Rodape.gif" alt="Logo rodapé" className="h-auto w-full max-w-[220px] object-contain" />
      </div>
    </section>
  );
}
