import { useEffect, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { Button, LoadingSpinner } from "@sintese/ui";
import { TimedAlert } from "../../../shared/components/TimedAlert";
import { digitsOnly, formatCpf } from "../../../shared/utils/masks";
import { CertificadoPreview } from "../components/CertificadoPreview";
import {
  DEFAULT_CERTIFICADO_LAYOUT,
  normalizeCertificadoLayout,
  type CertificadoLayoutConfig,
} from "../layout/certificadoLayout";
import {
  congressistaService,
  type CertificadoCongressista,
  type CongressoAtivo,
  type ConsultaCongressistaAtivo,
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
    minute: "2-digit",
  }).format(parsed);
}

function formatBirthDateInput(value: string): string {
  const digits = digitsOnly(value).slice(0, 8);
  if (digits.length <= 2) {
    return digits;
  }
  if (digits.length <= 4) {
    return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  }
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

function parseBirthDateInput(value: string): string | null {
  const digits = digitsOnly(value);
  if (digits.length !== 8) {
    return null;
  }

  const day = Number(digits.slice(0, 2));
  const month = Number(digits.slice(2, 4));
  const year = Number(digits.slice(4));
  const date = new Date(Date.UTC(year, month - 1, day));
  const today = new Date();
  const todayUtc = Date.UTC(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day ||
    date.getTime() > todayUtc
  ) {
    return null;
  }

  return `${year.toString().padStart(4, "0")}-${digits.slice(2, 4)}-${digits.slice(0, 2)}`;
}

type PalestranteCongressista = NonNullable<
  CongressoAtivo["palestrantes"]
>[number];

function agruparPalestrantesPorData(
  palestrantes: PalestranteCongressista[],
): Array<{ data: string | null; palestrantes: PalestranteCongressista[] }> {
  const grupos = new Map<string, PalestranteCongressista[]>();

  palestrantes.forEach((palestrante) => {
    const data =
      palestrante.data_palestra?.match(/^\d{4}-\d{2}-\d{2}/)?.[0] ?? null;
    const chave = data ?? "__sem_data__";
    const grupo = grupos.get(chave) ?? [];
    grupo.push(palestrante);
    grupos.set(chave, grupo);
  });

  return Array.from(grupos.entries())
    .sort(([dataA], [dataB]) => {
      if (dataA === "__sem_data__") return 1;
      if (dataB === "__sem_data__") return -1;
      return dataA.localeCompare(dataB);
    })
    .map(([chave, grupo]) => ({
      data: chave === "__sem_data__" ? null : chave,
      palestrantes: grupo,
    }));
}

function getTodayDateKey(): string {
  const today = new Date();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${today.getFullYear()}-${month}-${day}`;
}

function InfoRow({
  label,
  value,
  className = "",
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div
      className={`rounded-xl border border-slate-200 bg-white px-3 py-2 ${className}`}
    >
      <dt className="text-xs font-semibold uppercase text-slate-500">
        {label}
      </dt>
      <dd className="mt-1 text-sm font-semibold text-slate-900">{value}</dd>
    </div>
  );
}

type DependentesCongressista = NonNullable<
  NonNullable<ConsultaCongressistaAtivo["congressista"]>["dependentes"]
>;
type DependenteCongressista = DependentesCongressista[number];

function BoolDescRow({
  label,
  flag,
  descLabel,
  descValue,
}: {
  label: string;
  flag?: boolean;
  descLabel: string;
  descValue?: string | null;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
      <dt className="text-xs font-semibold uppercase text-slate-500">
        {label}
      </dt>
      <dd className="mt-1 text-sm font-semibold text-slate-900">
        {flag ? "Sim" : "Não"}
      </dd>
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

function DependentesBlock({
  dependentes,
}: {
  dependentes: DependenteCongressista[];
}) {
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
          <p className="text-xs font-semibold uppercase text-slate-500">
            Dependentes
          </p>
          <p className="mt-0.5 text-xs text-slate-400">
            {quantidade > 0
              ? "Clique para ver a lista"
              : "Nenhum dependente cadastrado"}
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
                  <p className="text-sm font-extrabold text-slate-900">
                    {fallback(dependente.nome)}
                  </p>
                  <dl className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <InfoRow
                      label="Gênero"
                      value={fallback(dependente.genero)}
                    />
                    <InfoRow label="Idade" value={fallback(dependente.idade)} />
                    <InfoRow label="Faixa" value={fallback(dependente.faixa)} />
                    <InfoRow
                      label="Nascimento"
                      value={fallback(dependente.nascimento_extenso)}
                    />
                  </dl>
                  <div className="mt-2 rounded-xl border border-slate-200 bg-white px-3 py-2">
                    <p className="text-xs font-semibold uppercase text-slate-500">
                      Hospedagem
                    </p>
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
                      <p className="text-xs font-semibold uppercase text-slate-500">
                        Observação
                      </p>
                      <p className="mt-1 text-sm text-slate-800 break-words whitespace-pre-wrap">
                        {dependente.observacao}
                      </p>
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm font-semibold text-slate-900">
              Nenhum dependente cadastrado.
            </p>
          )}
        </div>
      ) : null}
    </div>
  );
}

function yesNo(value: boolean): string {
  return value ? "Sim" : "Não";
}

function hasPrintableText(value: string | null | undefined): boolean {
  return Boolean(value && value.trim().length > 0);
}

function CertificadoPrintArea({
  certificado,
  layout,
}: {
  certificado: CertificadoCongressista | null;
  layout: CertificadoLayoutConfig;
}) {
  if (!certificado) {
    return null;
  }

  return (
    <div className="certificado-print-area" aria-label="Certificado">
      <CertificadoPreview certificado={certificado} layout={layout} />
    </div>
  );
}

export function CongressistaPage() {
  const [congresso, setCongresso] = useState<CongressoAtivo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [cpfDigits, setCpfDigits] = useState("");
  const [dataNascimentoInput, setDataNascimentoInput] = useState("");
  const [isConsulting, setIsConsulting] = useState(false);
  const [consulta, setConsulta] = useState<ConsultaCongressistaAtivo | null>(
    null,
  );
  const [notice, setNotice] = useState<NoticeState | null>(null);
  const [presencasConfirmadas, setPresencasConfirmadas] = useState<string[]>(
    [],
  );
  const [presencaModalData, setPresencaModalData] = useState<string | null>(
    null,
  );
  const [presencaUsuario, setPresencaUsuario] = useState("");
  const [presencaSenha, setPresencaSenha] = useState("");
  const [presencaErro, setPresencaErro] = useState<string | null>(null);
  const [isConfirmingPresenca, setIsConfirmingPresenca] = useState(false);
  const [certificado, setCertificado] =
    useState<CertificadoCongressista | null>(null);
  const [certificadoLayout, setCertificadoLayout] =
    useState<CertificadoLayoutConfig>(() =>
      normalizeCertificadoLayout(DEFAULT_CERTIFICADO_LAYOUT),
    );
  const [certificadoErro, setCertificadoErro] = useState<string | null>(null);
  const [isGerandoCertificado, setIsGerandoCertificado] = useState(false);
  const [shouldPrintCertificado, setShouldPrintCertificado] = useState(false);

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
        message: "Informe o CPF do congressista para continuar.",
      });
      return;
    }

    if (cpfDigits.length !== 11) {
      setConsulta(null);
      setNotice({
        className: "alert-warning",
        message: "O CPF deve conter 11 dígitos.",
      });
      return;
    }

    const dataNascimento = parseBirthDateInput(dataNascimentoInput);
    if (!dataNascimento) {
      setConsulta(null);
      setNotice({
        className: "alert-warning",
        message:
          "Informe uma data de nascimento válida, sem usar uma data futura.",
      });
      return;
    }

    setIsConsulting(true);
    setConsulta(null);
    setNotice(null);

    try {
      const result = await congressistaService.consultarCongressistaAtivo(
        cpfDigits,
        dataNascimento,
      );
      setConsulta(result);
      setCertificado(null);
      setCertificadoErro(null);
      setShouldPrintCertificado(false);
      setPresencasConfirmadas(result.presencas_confirmadas ?? []);
      setNotice({
        className: result.encontrado ? "alert-success" : "alert-warning",
        message: result.encontrado
          ? result.mensagem
          : "Não foi possível validar os dados informados.",
      });
    } catch {
      setConsulta(null);
      setCertificado(null);
      setCertificadoErro(null);
      setShouldPrintCertificado(false);
      setPresencasConfirmadas([]);
      setNotice({
        className: "alert-error",
        message:
          "Não foi possível realizar a consulta no momento. Tente novamente mais tarde.",
      });
    } finally {
      setIsConsulting(false);
    }
  }

  useEffect(() => {
    if (!certificado || !shouldPrintCertificado) {
      return;
    }

    const timer = window.setTimeout(() => {
      if (typeof window.print !== "function") {
        setCertificadoErro(
          "Nao foi possivel abrir a impressao automaticamente neste navegador.",
        );
        setShouldPrintCertificado(false);
        return;
      }

      try {
        window.print();
      } catch {
        setCertificadoErro(
          "Nao foi possivel abrir a impressao automaticamente neste navegador.",
        );
      } finally {
        setShouldPrintCertificado(false);
      }
    }, 250);

    return () => window.clearTimeout(timer);
  }, [certificado, shouldPrintCertificado]);

  async function imprimirCertificado() {
    const dataNascimento = parseBirthDateInput(dataNascimentoInput);

    if (cpfDigits.length !== 11 || !dataNascimento) {
      setCertificadoErro(
        "Consulte novamente o congressista antes de imprimir o certificado.",
      );
      return;
    }

    setIsGerandoCertificado(true);
    setCertificadoErro(null);

    try {
      const [result, remoteLayout] = await Promise.all([
        congressistaService.solicitarCertificadoCongressista({
          cpf: cpfDigits,
          data_nascimento: dataNascimento,
        }),
        congressistaService.getCertificadoLayout().catch(() => null),
      ]);

      const layoutFinal = remoteLayout
        ? normalizeCertificadoLayout(remoteLayout)
        : normalizeCertificadoLayout(DEFAULT_CERTIFICADO_LAYOUT);

      setCertificadoLayout(layoutFinal);
      setCertificado(result);
      setShouldPrintCertificado(true);
    } catch (error) {
      setShouldPrintCertificado(false);
      setCertificado(null);
      setCertificadoErro(
        error instanceof Error
          ? error.message
          : "Nao foi possivel gerar o certificado no momento.",
      );
    } finally {
      setIsGerandoCertificado(false);
    }
  }

  function openPresencaModal(data: string | null) {
    if (!data || data > getTodayDateKey()) {
      return;
    }

    setPresencaModalData(data);
    setPresencaUsuario("");
    setPresencaSenha("");
    setPresencaErro(null);
  }

  function closePresencaModal() {
    if (isConfirmingPresenca) {
      return;
    }

    setPresencaModalData(null);
    setPresencaUsuario("");
    setPresencaSenha("");
    setPresencaErro(null);
  }

  async function submitPresenca(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!presencaModalData || !consulta?.congressista?.id_congressista) {
      setPresencaErro("Não foi possível validar o congressista consultado.");
      return;
    }

    if (!presencaUsuario.trim() || !presencaSenha) {
      setPresencaErro("Informe usuário e senha para confirmar a presença.");
      return;
    }

    setIsConfirmingPresenca(true);
    setPresencaErro(null);

    try {
      const response = await congressistaService.carimbarPresenca(
        consulta.congressista.id_congressista,
        presencaModalData,
        presencaUsuario.trim(),
        presencaSenha,
      );
      setPresencasConfirmadas((prev) =>
        prev.includes(presencaModalData) ? prev : [...prev, presencaModalData],
      );
      setPresencaModalData(null);
      setPresencaUsuario("");
      setPresencaSenha("");
      setNotice({ className: "alert-success", message: response.mensagem });
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes("A presença já foi confirmada para esta data.")
      ) {
        setPresencasConfirmadas((prev) =>
          prev.includes(presencaModalData)
            ? prev
            : [...prev, presencaModalData],
        );
        setPresencaModalData(null);
        setPresencaUsuario("");
        setPresencaSenha("");
      }
      setPresencaErro(
        error instanceof Error
          ? error.message
          : "Não foi possível confirmar a presença no momento.",
      );
    } finally {
      setIsConfirmingPresenca(false);
    }
  }

  return (
    <section className="auth-card-modern w-full">
      <style>{`
        @keyframes congressista-carro-andando {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(6px); }
        }

        .congressista-carro-animado {
          animation: congressista-carro-andando 1.2s ease-in-out infinite;
        }

        @media (prefers-reduced-motion: reduce) {
          .congressista-carro-animado {
            animation: none;
          }
        }

        .certificado-print-area {
          display: none;
        }

        @media print {
          @page {
            size: A4 landscape;
            margin: 0;
          }

          body * {
            visibility: hidden !important;
          }

          .certificado-print-area,
          .certificado-print-area * {
            visibility: visible !important;
          }

          .certificado-print-area {
            display: block;
            position: fixed;
            inset: 0;
            width: 100%;
            height: auto;
            overflow: visible;
          }

          .certificado-print-area .certificado-sheet {
            width: 100vw !important;
            max-width: 100vw !important;
            height: 100vh !important;
            page-break-after: always;
            break-after: page;
          }

          .certificado-print-area .certificado-sheet:last-child {
            page-break-after: auto;
            break-after: auto;
          }
        }
      `}</style>
      <div className="mb-4 flex justify-center px-3 sm:px-4">
        <img
          src="/logo-sintese-oficial.png"
          alt="Logo SINTESE"
          className="block h-auto object-contain"
          style={{ width: "320px", maxWidth: "100%" }}
        />
      </div>

      <h1 className="section-title mb-4">Congressista</h1>

      {isLoading ? (
        <LoadingSpinner label="Carregando congresso ativo..." />
      ) : null}

      {hasError ? (
        <div className="alert-error mb-3">
          Não foi possível carregar os dados do congresso ativo.
        </div>
      ) : null}

      {!isLoading && !hasError && !congresso ? (
        <div className="alert-info mb-3">
          Nenhum congresso ativo encontrado no momento.
        </div>
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
            <p className="text-xs font-semibold uppercase text-slate-500">
              Congresso ativo
            </p>
            <h2 className="mt-1 text-lg font-extrabold leading-tight text-slate-900">
              {fallback(congresso.discriminacao)}
            </h2>
            {congresso.tema_geral ? (
              <p className="mt-2 text-sm font-medium leading-snug text-slate-700">
                {congresso.tema_geral}
              </p>
            ) : null}
          </div>

          <dl className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <InfoRow label="Ano" value={fallback(congresso.ano)} />
            <InfoRow label="Local" value={fallback(congresso.local)} />
            <InfoRow
              label="Endereço"
              value={fallback(congresso.endereco)}
              className="sm:col-span-2"
            />
            <InfoRow
              label="Data de início"
              value={formatDateBr(congresso.data_inicio)}
            />
            <InfoRow
              label="Data de fim"
              value={formatDateBr(congresso.data_fim)}
            />
            <InfoRow
              label="Hora de início"
              value={formatTimeBr(congresso.hora_inicio)}
            />
            <InfoRow
              label="Hora de fim"
              value={formatTimeBr(congresso.hora_fim)}
            />
          </dl>
          {congresso.endereco ? (
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(congresso.endereco)}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex w-full items-center justify-center rounded-xl bg-sky-600 px-4 py-3 text-sm font-extrabold text-white shadow-md transition duration-200 hover:scale-[1.01] hover:bg-sky-700 hover:shadow-lg active:scale-[0.99] focus:outline-none focus:ring-2 focus:ring-sky-300"
            >
              <span className="inline-flex items-center justify-center gap-2">
                <span aria-hidden="true" className="congressista-carro-animado">
                  🚗
                </span>
                <span>Como chegar ao local</span>
              </span>
            </a>
          ) : null}
          <a
            href="https://sintese.org.br/xix-congresso/#tdi_104"
            target="_blank"
            rel="noreferrer"
            className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-sky-200 bg-white px-4 py-3 text-sm font-extrabold text-sky-800 shadow-sm transition duration-200 hover:border-sky-300 hover:bg-sky-50 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-sky-300"
          >
            <span aria-hidden="true">📅</span>
            <span>Ver programação do congresso</span>
          </a>
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
          <label
            htmlFor="cpf-congressista"
            className="mb-1 block text-sm text-slate-900"
          >
            CPF do congressista
          </label>
          <input
            id="cpf-congressista"
            value={formatCpf(cpfDigits)}
            onChange={(event) => {
              setCpfDigits(digitsOnly(event.target.value).slice(0, 11));
              setConsulta(null);
              setCertificado(null);
              setCertificadoErro(null);
              setShouldPrintCertificado(false);
              setNotice(null);
            }}
            inputMode="numeric"
            autoComplete="off"
            placeholder="000.000.000-00"
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-lg text-slate-700 outline-none transition focus:border-sky-600 focus:ring-2 focus:ring-sky-100 sm:text-xl"
          />
        </div>

        <div>
          <label
            htmlFor="data-nascimento-congressista"
            className="mb-1 block text-sm text-slate-900"
          >
            Data de nascimento
          </label>
          <input
            id="data-nascimento-congressista"
            value={dataNascimentoInput}
            onChange={(event) => {
              setDataNascimentoInput(formatBirthDateInput(event.target.value));
              setConsulta(null);
              setCertificado(null);
              setCertificadoErro(null);
              setShouldPrintCertificado(false);
              setNotice(null);
            }}
            inputMode="numeric"
            autoComplete="bday"
            placeholder="DD/MM/AAAA"
            maxLength={10}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-lg text-slate-700 outline-none transition focus:border-sky-600 focus:ring-2 focus:ring-sky-100 sm:text-xl"
          />
        </div>

        <Button
          type="submit"
          className="btn-modern-primary w-full"
          isLoading={isConsulting}
          disabled={isConsulting}
        >
          Consultar dados do congressista
        </Button>

        {consulta?.encontrado && consulta.congressista ? (
          <div className="surface-card space-y-3 p-4">
            <p className="text-sm font-bold text-emerald-700">
              Congressista localizado para este congresso.
            </p>
            {consulta.congressista.desistiu ? (
              <div className="rounded-xl border border-amber-300 bg-amber-50 px-3 py-2 text-amber-950">
                <p className="text-sm font-extrabold">
                  ATEN&Ccedil;&Atilde;O: este cadastro de congressista
                  est&aacute; marcado como desistente.
                </p>
                <p className="mt-1 text-xs font-semibold">
                  Os dados permanecem dispon&iacute;veis apenas para consulta.
                </p>
              </div>
            ) : null}
            <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2">
              <p className="text-xs font-semibold uppercase text-emerald-700">
                Nome
              </p>
              <p className="mt-1 text-base font-extrabold text-slate-900">
                {fallback(consulta.congressista.nome)}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
              <p className="text-xs font-semibold uppercase text-slate-500">
                Grupo de estudo
              </p>
              <p className="mt-1 text-sm font-semibold leading-snug text-slate-900">
                {fallback(consulta.congressista.grupo_estudo?.descricao)}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
              <p className="text-xs font-semibold uppercase text-slate-500">
                Hospedagem
              </p>
              <p className="mt-1 text-sm font-semibold leading-snug text-slate-900">
                {fallback(consulta.congressista.hospedagem?.descricao)}
              </p>
            </div>
            {certificadoErro ? (
              <div className="alert-warning">{certificadoErro}</div>
            ) : null}
            <DependentesBlock
              dependentes={consulta.congressista.dependentes ?? []}
            />
            <dl className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <InfoRow
                label="Gênero"
                value={fallback(consulta.congressista.sexo)}
              />
              <InfoRow
                label="Função"
                value={fallback(consulta.congressista.funcao)}
              />
              <InfoRow
                label="Delegação"
                value={fallback(consulta.congressista.delegacao)}
              />
              <InfoRow
                label="Plenária"
                value={fallback(consulta.congressista.plenaria)}
              />
              <InfoRow
                label="Tamanho da camisa"
                value={fallback(consulta.congressista.tamanho_camisa)}
              />
              <InfoRow
                label="Solicitou creche"
                value={yesNo(consulta.congressista.creche)}
              />
              <InfoRow
                label="Desistiu"
                value={yesNo(consulta.congressista.desistiu)}
              />
              <InfoRow
                label="Credenciado"
                value={yesNo(consulta.congressista.credenciado)}
              />
              <InfoRow
                label="Solicitou transporte"
                value={yesNo(consulta.congressista.transporte)}
              />
            </dl>
            {congresso?.palestrantes && congresso.palestrantes.length > 0 ? (
              <section className="mt-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Palestrantes
                </p>
                <div className="mt-3 space-y-3">
                  {agruparPalestrantesPorData(congresso.palestrantes).map(
                    (grupo) =>
                      (() => {
                        const confirmado = grupo.data
                          ? presencasConfirmadas.includes(grupo.data)
                          : false;
                        const disponivel = grupo.data
                          ? grupo.data <= getTodayDateKey()
                          : false;
                        const credenciado = consulta.congressista?.credenciado === true;
                        const containerClass = confirmado
                          ? "border-emerald-200 bg-emerald-50"
                          : credenciado && grupo.data && !disponivel
                            ? "border-emerald-100 bg-emerald-50/60"
                            : credenciado && grupo.data
                              ? "border-emerald-200 bg-emerald-50"
                              : grupo.data && !disponivel
                                ? "border-slate-200 bg-slate-50"
                                : "border-rose-200 bg-rose-50";

                        return (
                          <div
                            key={grupo.data ?? "sem-data"}
                            className={`rounded-xl border p-4 ${containerClass}`}
                          >
                            <h3 className="text-sm font-extrabold text-slate-800">
                              {grupo.data
                                ? formatDateBr(grupo.data)
                                : "Data não informada"}
                            </h3>
                            <div className="mt-2 grid grid-cols-1 gap-3">
                              {grupo.palestrantes.map((palestrante, index) => (
                                <article
                                  key={`${palestrante.nome ?? "palestrante"}-${index}`}
                                  className="rounded-xl border border-slate-200 bg-white p-3"
                                >
                                  <h4 className="text-sm font-extrabold text-slate-900">
                                    {fallback(palestrante.nome)}
                                  </h4>
                                  <p className="mt-1 text-sm text-slate-700">
                                    {fallback(palestrante.cargo_funcao)}
                                  </p>
                                </article>
                              ))}
                            </div>
                            <button
                              type="button"
                              title="Funcionalidade em breve"
                              disabled={
                                !grupo.data ||
                                !disponivel ||
                                confirmado ||
                                isConfirmingPresenca
                              }
                              onClick={() => openPresencaModal(grupo.data)}
                              className="mt-4 inline-flex w-full items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-extrabold text-emerald-800 transition hover:bg-emerald-100 focus:outline-none focus:ring-2 focus:ring-emerald-300 disabled:cursor-not-allowed disabled:opacity-70"
                            >
                              <span aria-hidden="true" className="mr-2">
                                ✅
                              </span>
                              {confirmado
                                ? "Presença confirmada"
                                : disponivel
                                  ? "Carimbar presença"
                                  : "Disponível na data da palestra"}
                            </button>
                          </div>
                        );
                      })(),
                  )}
                </div>
              </section>
            ) : null}
            {consulta.congressista.credenciado === true ? (
              <div className="rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-sky-50 px-3 py-4">
                <Button
                  type="button"
                  className="btn-modern-primary w-full animate-pulse-subtle"
                  isLoading={isGerandoCertificado}
                  disabled={isGerandoCertificado}
                  onClick={() => void imprimirCertificado()}
                >
                  {isGerandoCertificado ? "Gerando certificado..." : "\uD83D\uDCDC Imprimir certificado"}
                </Button>
              </div>
            ) : (
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
                <p className="text-sm font-semibold text-slate-600">
                  Certificado ainda não disponível.
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  O credenciamento deste congressista ainda não foi registrado no sistema para o congresso ativo.
                </p>
              </div>
            )}
          </div>
        ) : null}

        <Link to="/login" className="block">
          <Button type="button" className="btn-modern-danger w-full">
            Voltar ao login
          </Button>
        </Link>
      </form>

      {presencaModalData
        ? createPortal(
            <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4">
              <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="carimbar-presenca-titulo"
                className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl"
              >
                <h2
                  id="carimbar-presenca-titulo"
                  className="text-lg font-extrabold text-slate-900"
                >
                  Carimbar presença
                </h2>
                <p className="mt-1 text-sm text-slate-600">
                  Data da palestra: {formatDateBr(presencaModalData)}
                </p>
                <form className="mt-4 space-y-3" onSubmit={submitPresenca}>
                  <div>
                    <label
                      htmlFor="presenca-usuario"
                      className="mb-1 block text-sm font-semibold text-slate-700"
                    >
                      Usuário
                    </label>
                    <input
                      id="presenca-usuario"
                      value={presencaUsuario}
                      onChange={(event) =>
                        setPresencaUsuario(event.target.value)
                      }
                      autoComplete="username"
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-100"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="presenca-senha"
                      className="mb-1 block text-sm font-semibold text-slate-700"
                    >
                      Senha
                    </label>
                    <input
                      id="presenca-senha"
                      type="password"
                      value={presencaSenha}
                      onChange={(event) => setPresencaSenha(event.target.value)}
                      autoComplete="current-password"
                      className="w-full rounded-xl border border-slate-300 px-3 py-2 text-slate-900 outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-100"
                    />
                  </div>
                  {presencaErro ? (
                    <div className="alert-error">{presencaErro}</div>
                  ) : null}
                  <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={closePresencaModal}
                      disabled={isConfirmingPresenca}
                    >
                      Cancelar
                    </Button>
                    <Button type="submit" isLoading={isConfirmingPresenca}>
                      Confirmar presença
                    </Button>
                  </div>
                </form>
              </div>
            </div>,
            document.body,
          )
        : null}
      <CertificadoPrintArea certificado={certificado} layout={certificadoLayout} />
    </section>
  );
}
