import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Button } from "@sintese/ui";
import { readAuthSession } from "../../auth/services/authSession";
import { digitsOnly, formatCpf } from "../../../shared/utils/masks";
import { useMinhaIdentificacaoQuery } from "../../minhas-filiacoes/hooks/useMinhaIdentificacaoQuery";
import { useRegenciaClasseQuery } from "../hooks/useRegenciaClasseQuery";

function formatMoney(value: number | null): string {
  if (value === null || Number.isNaN(value)) {
    return "R$ 0,00";
  }
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

export function RegenciaClassePage() {
  const session = readAuthSession();
  const cpfDigits = useMemo(() => digitsOnly(session?.cpf ?? ""), [session?.cpf]);

  const profileQuery = useMinhaIdentificacaoQuery(cpfDigits, Boolean(cpfDigits));
  const regenciaQuery = useRegenciaClasseQuery(cpfDigits, Boolean(cpfDigits));

  const profile = profileQuery.data;
  const regencia = regenciaQuery.data;

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

      <h1 className="section-title mb-4">Consulta de Cálculo de Regência de Classe</h1>

      {!cpfDigits ? <div className="alert-error mb-3">Sessão inválida. Faça login novamente.</div> : null}
      {profileQuery.isError ? <div className="alert-error mb-3">Não foi possível carregar seu nome.</div> : null}
      {regenciaQuery.isError ? (
        <div className="alert-error mb-3">Não foi possível consultar os dados de regência de classe.</div>
      ) : null}

      <div className="space-y-3">
        <div>
          <label htmlFor="regencia-cpf" className="mb-1 block text-sm text-slate-900">
            CPF
          </label>
          <input
            id="regencia-cpf"
            value={profile?.cpf ? formatCpf(profile.cpf) : formatCpf(cpfDigits)}
            readOnly
            className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-base font-medium text-slate-700 outline-none"
          />
        </div>

        <div>
          <label htmlFor="regencia-nome" className="mb-1 block text-sm text-slate-900">
            Nome
          </label>
          <input
            id="regencia-nome"
            value={profile?.nome ?? (profileQuery.isLoading ? "Carregando..." : "")}
            readOnly
            className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-base font-semibold text-slate-700 outline-none"
          />
        </div>
      </div>

      <article className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        {regenciaQuery.isLoading ? <p className="text-sm text-slate-600">Consultando dados de regência de classe...</p> : null}

        {!regenciaQuery.isLoading && regencia && regencia.hasData ? (
          <div className="rounded-xl bg-[#d77900] px-4 py-5 text-white">
            <div className="flex items-center justify-between gap-4">
              <div className="text-4xl leading-none" aria-hidden="true">
                💰
              </div>
              <div className="text-right">
                <p className="text-lg font-semibold">Valor</p>
                <p className="text-4xl font-extrabold leading-none">{formatMoney(regencia.valorTotal)}</p>
              </div>
            </div>
          </div>
        ) : null}

        {!regenciaQuery.isLoading && regencia && !regencia.hasData ? (
          <div className="alert-info">Não existe dados a ser exibido.</div>
        ) : null}

        <div className="mt-4 space-y-2 text-justify text-[1.05rem] font-semibold leading-8 text-slate-900">
          <p>
            O município irá dar uma entrada de R$ 6.000.000,00 (seis milhões de reais) e a totalidade do restante
            devido será dividido em 30 Parcelas fixas, pagos individualmente a cada professor na sua proporcionalidade.
          </p>
          <p>
            Os valores foram calculados individualmente e corrigidos monetariamente pelo IPCA, com o desconto referente
            à 30% de deságio, conforme aceito pela categoria em assembleia.
          </p>
          <p>
            Obs.: O valor informado é o valor total que será recebido pelo(a) servidor(a). Tal valor está sem a dedução
            de Imposto de Renda, descontos previdenciários e honorários advocatícios.
          </p>
        </div>
      </article>

      <div className="mt-4">
        <Link to="/menu-principal" className="block">
          <Button type="button" className="btn-modern-danger w-full">
            Sair
          </Button>
        </Link>
      </div>

      <div className="mt-8 flex justify-center">
        <img src="/Logo%20Rodape.gif" alt="Logo rodapé" className="h-auto w-full max-w-[220px] object-contain" />
      </div>
    </section>
  );
}

