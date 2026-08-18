import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Button, LoadingSpinner } from "@sintese/ui";
import { TimedAlert } from "../../../shared/components/TimedAlert";
import { digitsOnly, formatCpf } from "../../../shared/utils/masks";
import {
  congressistaService,
  type CongressoAtivo,
  type ConsultaCongressistaAtivo
} from "../services/congressista.service";

type NoticeState = {
  message: string;
  className: "alert-info" | "alert-warning" | "alert-success" | "alert-error";
};

function fallback(value: string | number | null | undefined): string {
  if (value === null || value === undefined) {
    return "Não informado";
  }

  const text = String(value).trim();
  return text || "Não informado";
}

function formatDateBr(value: string | null): string {
  if (!value) {
    return "Não informado";
  }

  const isoDate = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoDate) {
    return `${isoDate[3]}/${isoDate[2]}/${isoDate[1]}`;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return fallback(value);
  }

  return new Intl.DateTimeFormat("pt-BR", { timeZone: "UTC" }).format(parsed);
}

function formatTimeBr(value: string | null): string {
  if (!value) {
    return "Não informado";
  }

  const timeMatch = value.match(/(?:T|\b)(\d{2}):(\d{2})(?::\d{2})?/);
  if (timeMatch) {
    return `${timeMatch[1]}:${timeMatch[2]}`;
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return fallback(value);
  }

  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit"
  }).format(parsed);
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
      <dt className="text-xs font-semibold uppercase text-slate-500">{label}</dt>
      <dd className="mt-1 text-sm font-semibold text-slate-900">{value}</dd>
    </div>
  );
}

type DependentesCongressista = NonNullable<NonNullable<ConsultaCongressistaAtivo["congressista"]>["dependentes"]>;
type DependenteCongressista = DependentesCongressista[number];

function BoolDescRow({ label, flag, descLabel, descValue }: {
  label: string;
  flag?: boolean;
  descLabel: string;
  descValue?: string | null;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
      <dt className="text-xs font-semibold uppercase text-slate-500">{label}</dt>
      <dd className="mt-1 text-sm font-semibold text-slate-900">{flag ? "Sim" : "Não"}</dd>
      {flag ? (
        <div className="mt-1">
          <dt className="text-xs font-medium text-slate-500">{descLabel}</dt>
          <dd className="mt-0.5 text-sm text-slate-800 break-words whitespace-pre-wrap">
            {descValue || "Não informado"}
          </dd>
        </div>
      ) : null}
    </div>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      className={`h-5 w-5 text-slate-500 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}

function DependentesBlock({ dependentes }: { dependentes: DependenteCongressista[] }) {
  const [aberto, setAberto] = useState(false);
  const quantidade = dependentes.length;

  return (
    <div className="rounded-xl border border-slate-200 bg-white">
      <button
        type="button"
        className="flex w-full items-center justify-between gap-2 px-3 py-3 text-left"
        aria-expanded={aberto}
        onClick={() => setAberto((prev) => !prev)}
      >
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase text-slate-500">Dependentes</p>
          <p className="mt-0.5 text-xs text-slate-400">
            {quantidade > 0 ? "Clique para ver a lista" : "Nenhum dependente cadastrado"}
          </p>
        </div>
        <span className="flex items-center gap-2">
          <span className="inline-flex h-6 min-w-[1.5rem] items-center justify-center rounded-full bg-slate-100 px-2 text-xs font-bold text-slate-700">
            {quantidade}
          </span>
          <ChevronIcon open={aberto} />
        </span>
      </button>

      {aberto ? (
        <div className="border-t border-slate-100 px-3 pb-3 pt-2">
          {quantidade > 0 ? (
            <div className="space-y-2">
              {dependentes.map((dependente, index) => (
                <div
                  key={dependente.id_congressista_dep ?? index}
                  className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-3"
                >
                  <p className="text-sm font-extrabold text-slate-900">{fallback(dependente.nome)}</p>
                  <dl className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <InfoRow label="Gênero" value={fallback(dependente.genero)} />
                    <InfoRow label="Idade" value={fallback(dependente.idade)} />
                    <InfoRow label="Faixa" value={fallback(dependente.faixa)} />
                    <InfoRow label="Nascimento" value={fallback(dependente.nascimento_extenso)} />
                  </dl>
                  <div className="mt-2 rounded-xl border border-slate-200 bg-white px-3 py-2">
                    <p className="text-xs font-semibold uppercase text-slate-500">Hospedagem</p>
                    <p className="mt-1 text-sm font-semibold leading-snug text-slate-900">
                      {fallback(dependente.hospedagem?.descricao)}
                    </p>
                  </div>
                  <dl className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <BoolDescRow
                      label="Possui deficiência"
                      flag={dependente.possui_deficiencia}
                      descLabel="Qual?"
                      descValue={dependente.descricao_deficiencia}
                    />
                    <BoolDescRow
                      label="Possui problema de saúde"
                      flag={dependente.problema_saude}
                      descLabel="Qual?"
                      descValue={dependente.descricao_saude}
                    />
                    <BoolDescRow
                      label="Possui alergia"
                      flag={dependente.alergia}
                      descLabel="Qual?"
                      descValue={dependente.descricao_alergia}
                    />
                    <BoolDescRow
                      label="Possui restrição alimentar"
                      flag={dependente.restricao_alimentar}
                      descLabel="Qual?"
                      descValue={dependente.descricao_alimentar}
                    />
                    <BoolDescRow
                      label="Utiliza medicamento"
                      flag={dependente.utiliza_medicamento}
                      descLabel="Qual/Quais horários?"
                      descValue={dependente.descricao_medicamento}
                    />
                  </dl>
                  {dependente.observacao ? (
                    <div className="mt-2 rounded-xl border border-slate-200 bg-white px-3 py-2">
                      <p className="text-xs font-semibold uppercase text-slate-500">Observação</p>
                      <p className="mt-1 text-sm text-slate-800 break-words whitespace-pre-wrap">
                        {dependente.observacao}
                      </p>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm font-semibold text-slate-900">Nenhum dependente cadastrado.</p>
          )}
        </div>
      ) : null}
    </div>
  );
}

function yesNo(value: boolean): string {
  return value ? "Sim" : "Não";
}

export function CongressistaPage() {
  const [congresso, setCongresso] = useState<CongressoAtivo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [cpfDigits, setCpfDigits] = useState("");
  const [isConsulting, setIsConsulting] = useState(false);
  const [consulta, setConsulta] = useState<ConsultaCongressistaAtivo | null>(null);
  const [notice, setNotice] = useState<NoticeState | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadCongressoAtivo() {
      try {
        const data = await congressistaService.getCongressoAtivo();
        if (mounted) {
          setCongresso(data);
          setHasError(false);
        }
      } catch {
        if (mounted) {
          setCongresso(null);
          setHasError(true);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    void loadCongressoAtivo();
    return () => {
      mounted = false;
    };
  }, []);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!cpfDigits) {
      setConsulta(null);
      setNotice({
        className: "alert-warning",
        message: "Informe o CPF do congressista para continuar."
      });
      return;
    }

    if (cpfDigits.length !== 11) {
      setConsulta(null);
      setNotice({
        className: "alert-warning",
        message: "O CPF deve conter 11 dígitos."
      });
      return;
    }

    setIsConsulting(true);
    setConsulta(null);
    setNotice(null);

    try {
      const result = await congressistaService.consultarCongressistaAtivo(cpfDigits);
      setConsulta(result);
      setNotice({
        className: result.encontrado ? "alert-success" : "alert-warning",
        message: result.mensagem
      });
    } catch {
      setConsulta(null);
      setNotice({
        className: "alert-error",
        message: "Não foi possível consultar o congressista no momento. Tente novamente."
      });
    } finally {
      setIsConsulting(false);
    }
  }

  return (
    <section className="auth-card-modern w-full">
      <div className="mb-4 flex justify-center px-3 sm:px-4">
        <img
          src="/logo-sintese-oficial.png"
          alt="Logo SINTESE"
          className="block h-auto object-contain"
          style={{ width: "320px", maxWidth: "100%" }}
        />
      </div>

      <h1 className="section-title mb-4">Congressista</h1>

      {isLoading ? <LoadingSpinner label="Carregando congresso ativo..." /> : null}

      {hasError ? (
        <div className="alert-error mb-3">Não foi possível carregar os dados do congresso ativo.</div>
      ) : null}

      {!isLoading && !hasError && !congresso ? (
        <div className="alert-info mb-3">Nenhum congresso ativo encontrado no momento.</div>
      ) : null}

      {congresso ? (
        <article className="surface-card mb-4 space-y-3 p-4">
          {congresso.logo ? (
            <div className="flex justify-center">
              <img
                src={congresso.logo}
                alt="Logo do congresso"
                className="max-h-28 max-w-full rounded-xl border border-slate-200 bg-white object-contain p-2"
              />
            </div>
          ) : null}

          <div>
            <p className="text-xs font-semibold uppercase text-slate-500">Congresso ativo</p>
            <h2 className="mt-1 text-lg font-extrabold leading-tight text-slate-900">
              {fallback(congresso.discriminacao)}
            </h2>
            {congresso.tema_geral ? (
              <p className="mt-2 text-sm font-medium leading-snug text-slate-700">{congresso.tema_geral}</p>
            ) : null}
          </div>

          <dl className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <InfoRow label="Ano" value={fallback(congresso.ano)} />
            <InfoRow label="Local" value={fallback(congresso.local)} />
            <InfoRow label="Data de início" value={formatDateBr(congresso.data_inicio)} />
            <InfoRow label="Data de fim" value={formatDateBr(congresso.data_fim)} />
            <InfoRow label="Hora de início" value={formatTimeBr(congresso.hora_inicio)} />
            <InfoRow label="Hora de fim" value={formatTimeBr(congresso.hora_fim)} />
          </dl>
        </article>
      ) : null}

      {notice ? (
        <TimedAlert
          message={notice.message}
          className={`${notice.className} mb-3`}
          durationMs={5000}
          onClose={() => setNotice(null)}
        />
      ) : null}

      <form className="space-y-3" onSubmit={onSubmit}>
        <div>
          <label htmlFor="cpf-congressista" className="mb-1 block text-sm text-slate-900">
            CPF do congressista
          </label>
          <input
            id="cpf-congressista"
            value={formatCpf(cpfDigits)}
            onChange={(event) => {
              setCpfDigits(digitsOnly(event.target.value).slice(0, 11));
              setConsulta(null);
              setNotice(null);
            }}
            inputMode="numeric"
            autoComplete="off"
            placeholder="000.000.000-00"
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-lg text-slate-700 outline-none transition focus:border-sky-600 focus:ring-2 focus:ring-sky-100 sm:text-xl"
          />
        </div>

        <Button type="submit" className="btn-modern-primary w-full" isLoading={isConsulting} disabled={isConsulting}>
          Consultar dados do congressista
        </Button>

        {consulta?.encontrado && consulta.congressista ? (
          <div className="surface-card space-y-3 p-4">
            <p className="text-sm font-bold text-emerald-700">Congressista localizado para este congresso.</p>
            {consulta.congressista.desistiu ? (
              <div className="rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-amber-950">
                <p className="text-sm font-extrabold">
                  ATEN&Ccedil;&Atilde;O: este cadastro de congressista est&aacute; marcado como desistente.
                </p>
                <p className="mt-1 text-xs font-semibold">
                  Os dados permanecem dispon&iacute;veis apenas para consulta.
                </p>
              </div>
            ) : null}
            <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2">
              <p className="text-xs font-semibold uppercase text-emerald-700">Nome</p>
              <p className="mt-1 text-base font-extrabold text-slate-900">
                {fallback(consulta.congressista.nome)}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
              <p className="text-xs font-semibold uppercase text-slate-500">Grupo de estudo</p>
              <p className="mt-1 text-sm font-semibold leading-snug text-slate-900">
                {fallback(consulta.congressista.grupo_estudo?.descricao)}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
              <p className="text-xs font-semibold uppercase text-slate-500">Hospedagem</p>
              <p className="mt-1 text-sm font-semibold leading-snug text-slate-900">
                {fallback(consulta.congressista.hospedagem?.descricao)}
              </p>
            </div>
            <DependentesBlock dependentes={consulta.congressista.dependentes ?? []} />
            <dl className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <InfoRow label="Gênero" value={fallback(consulta.congressista.sexo)} />
              <InfoRow label="Função" value={fallback(consulta.congressista.funcao)} />
              <InfoRow label="Delegação" value={fallback(consulta.congressista.delegacao)} />
              <InfoRow label="Plenária" value={fallback(consulta.congressista.plenaria)} />
              <InfoRow label="Solicitou creche" value={yesNo(consulta.congressista.creche)} />
              <InfoRow label="Desistiu" value={yesNo(consulta.congressista.desistiu)} />
              <InfoRow label="Credenciado" value={yesNo(consulta.congressista.credenciado)} />
              <InfoRow label="Solicitou transporte" value={yesNo(consulta.congressista.transporte)} />
            </dl>
          </div>
        ) : null}

        <Link to="/login" className="block">
          <Button type="button" className="btn-modern-danger w-full">
            Voltar ao login
          </Button>
        </Link>
      </form>
    </section>
  );
}
