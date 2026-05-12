import { useEffect, useMemo, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Button } from "@sintese/ui";
import { digitsOnly, formatCpf } from "../../../shared/utils/masks";
import { readAuthSession } from "../../auth/services/authSession";
import { useFichaCadastralQuery } from "../hooks/useFichaCadastralQuery";

function formatDateTime(value?: string | null): string {
  const raw = (value ?? "").trim();
  if (!raw) {
    return "-";
  }

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) {
    return raw;
  }

  return parsed.toLocaleString("pt-BR");
}

function formatDateTimeCompact(value?: string | null): string {
  const raw = (value ?? "").trim();
  if (!raw) {
    return "-";
  }

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) {
    return raw;
  }

  return parsed.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function toQrCodeSrc(value?: string | null): string | null {
  const raw = (value ?? "").trim();
  if (!raw) {
    return null;
  }

  if (raw.startsWith("data:image/")) {
    return raw;
  }

  if (raw.startsWith("http://") || raw.startsWith("https://")) {
    return raw;
  }

  return null;
}

function fmtDate(value?: string | null): string {
  const raw = (value ?? "").trim();
  if (!raw) return "-";
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return raw;
  return parsed.toLocaleDateString("pt-BR");
}

export function FichaCadastralPage() {
  const hasTriggeredAutoPrint = useRef(false);
  const [searchParams] = useSearchParams();
  const autoPrint = searchParams.get("autoPrint") === "1";
  const session = readAuthSession();
  const cpfDigits = useMemo(() => digitsOnly(session?.cpf ?? ""), [session?.cpf]);
  const usuario = useMemo(() => digitsOnly(session?.cpf ?? ""), [session?.cpf]);

  const fichaQuery = useFichaCadastralQuery(cpfDigits, usuario, Boolean(cpfDigits));
  const ficha = fichaQuery.data;
  const qrcodeSrc = toQrCodeSrc(ficha?.pessoa.qrCodeFicha);

  useEffect(() => {
    if (!autoPrint || !ficha || fichaQuery.isLoading || hasTriggeredAutoPrint.current) {
      return;
    }

    hasTriggeredAutoPrint.current = true;
    const timer = window.setTimeout(() => {
      window.print();
    }, 250);

    return () => {
      window.clearTimeout(timer);
    };
  }, [autoPrint, ficha, fichaQuery.isLoading]);

  return (
    <section className="ficha-screen-shell mx-auto w-full max-w-[1240px] px-3 py-4 sm:px-4 sm:py-6">
      <div className="ficha-print-hide mb-3 flex justify-between gap-3">
        <Button type="button" className="btn-modern-primary" onClick={() => window.print()}>
          Imprimir ficha
        </Button>
        <Link to="/menu-principal">
          <Button type="button" className="btn-modern-danger">
            Voltar ao menu
          </Button>
        </Link>
      </div>

      {!cpfDigits ? <div className="alert-error mb-3">Sessao invalida. Faca login novamente.</div> : null}
      {fichaQuery.isError ? <div className="alert-error mb-3">Nao foi possivel carregar a ficha cadastral.</div> : null}

      {fichaQuery.isLoading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600">Carregando ficha cadastral...</div>
      ) : null}

      {ficha ? (
        <article className="ficha-report-sheet ficha-print-sheet">
          <header className="ficha-report-header">
            <div className="ficha-report-header-left">
              <img
                src={ficha.sindicato?.logoImg ?? "/logo-sintese-oficial.png"}
                alt="Logo sindicato"
                className="ficha-report-logo"
              />
              <div>
                <h1 className="ficha-report-title-org">
                  {ficha.sindicato?.razaoSocial ??
                    "SINDICATO DOS TRABALHADORES EM EDUCACAO BASICA DA REDE OFICIAL DO ESTADO DE SERGIPE"}
                </h1>
                <p className="ficha-report-cnpj">CNPJ: {ficha.sindicato?.cnpj ?? "-"}</p>
              </div>
            </div>

            {qrcodeSrc ? <img src={qrcodeSrc} alt="QR Code da ficha" className="ficha-report-qrcode" /> : null}

            <h2 className="ficha-report-title">FICHA CADASTRAL</h2>
          </header>

          <section className="ficha-dados-wrap">
            <div className="ficha-dados-grid">
              <div><strong>CPF:</strong> {ficha.pessoa.cpfOculto ?? formatCpf(ficha.cpf)}</div>
              <div><strong>NOME:</strong> {ficha.pessoa.nome ?? "-"}</div>
              <div><strong>ESTADO CIVIL:</strong> {ficha.pessoa.estadoCivilDescricao ?? "-"}</div>
              <div><strong>TITULO ELEITOR:</strong> {ficha.pessoa.tituloEleitor ?? "-"}</div>
              <div><strong>NATURALIDADE:</strong> {ficha.pessoa.naturalidade ?? "-"}</div>
              <div><strong>NACIONALIDADE:</strong> {ficha.pessoa.nacionalidade ?? "-"}</div>
              <div><strong>RG:</strong> {ficha.pessoa.rgOculto ?? "-"}</div>
              <div><strong>SEXO:</strong> {ficha.pessoa.sexo ?? "-"}</div>
              <div><strong>PAI:</strong> {ficha.pessoa.pai ?? "-"}</div>
              <div><strong>MAE:</strong> {ficha.pessoa.mae ?? "-"}</div>
              <div className="ficha-span-2"><strong>ENDERECO:</strong> {ficha.pessoa.endereco ?? "-"}</div>
              <div><strong>NUMERO:</strong> {ficha.pessoa.numero ?? "-"}</div>
              <div className="ficha-span-2"><strong>COMPLEMENTO:</strong> {ficha.pessoa.complemento ?? "-"}</div>
              <div><strong>BAIRRO:</strong> {ficha.pessoa.bairro ?? "-"}</div>
              <div><strong>CIDADE:</strong> {ficha.pessoa.cidade ?? "-"}</div>
              <div><strong>ESTADO:</strong> {ficha.pessoa.estado ?? "-"}</div>
              <div><strong>CEP:</strong> {ficha.pessoa.cep ?? "-"}</div>
              <div><strong>TELEFONE:</strong> {ficha.pessoa.telefone ?? "-"}</div>
              <div><strong>CELULAR:</strong> {ficha.pessoa.celular ?? "-"}</div>
              <div><strong>GRAU INSTRUCAO:</strong> {ficha.pessoa.instrucao ?? "-"}</div>
              <div><strong>CARTEIRA:</strong> {formatDateTimeCompact(ficha.pessoa.dataEmisCarteira)}</div>
              <div><strong>VALIDADE:</strong> {formatDateTimeCompact(ficha.pessoa.dataValCarteira)}</div>
              <div><strong>RACA:</strong> {ficha.pessoa.racaDescricao ?? "-"}</div>
              <div><strong>AUTORIZA E-MAIL:</strong> {ficha.pessoa.autorizaEmail ?? "-"}</div>
              <div className="ficha-span-2"><strong>E-MAIL:</strong> {ficha.pessoa.email ?? "-"}</div>
              <div className="ficha-span-2"><strong>NASCIMENTO:</strong> {fmtDate(ficha.pessoa.dataNascimento)} {ficha.pessoa.nascimentoExtenso ?? ""}</div>
            </div>

            <div className="ficha-foto-box">
              {ficha.pessoa.fotoImg ? (
                <img src={ficha.pessoa.fotoImg} alt="Foto do filiado" className="ficha-foto" />
              ) : (
                <div className="ficha-foto-placeholder">Sem foto</div>
              )}
            </div>
          </section>

          <section className="ficha-bloco">
            <h3 className="ficha-bloco-titulo">FILIACAO</h3>
            <table className="ficha-tabela ficha-print-table">
              <thead>
                <tr>
                  <th>SITUACAO</th>
                  <th>MATRICULA</th>
                  <th>ENTE PUBLICO</th>
                  <th>PREDIO</th>
                  <th>FILIADO</th>
                  <th>SINDICALIZADO</th>
                  <th>DESFILIADO</th>
                </tr>
              </thead>
              <tbody>
                {ficha.filiacoes.length === 0 ? (
                  <tr>
                    <td colSpan={7}>Nenhuma filiacao encontrada.</td>
                  </tr>
                ) : (
                  ficha.filiacoes.map((item, index) => (
                    <tr key={`${item.matricula}-${index}`}>
                      <td>{item.situacao ?? "-"}</td>
                      <td>{item.matricula ?? "-"}</td>
                      <td>{item.descEmpresa ?? "-"}</td>
                      <td>{item.descPredio ?? "-"}</td>
                      <td>{item.filiado ?? "-"}</td>
                      <td>{formatDateTimeCompact(item.dataSindicalizacao)}</td>
                      <td>{formatDateTimeCompact(item.dataDesfiliacao)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </section>

          <section className="ficha-bloco">
            <h3 className="ficha-bloco-titulo">DEPENDENTES</h3>
            <table className="ficha-tabela ficha-print-table">
              <thead>
                <tr>
                  <th>NOME</th>
                  <th>GENERO</th>
                  <th>PARENTESCO</th>
                  <th>CPF</th>
                  <th>NASCIMENTO</th>
                </tr>
              </thead>
              <tbody>
                {ficha.dependentes.length === 0 ? (
                  <tr>
                    <td colSpan={5}>Nenhum dependente encontrado.</td>
                  </tr>
                ) : (
                  ficha.dependentes.map((item, index) => (
                    <tr key={`${item.cpfDependente}-${index}`}>
                      <td>{item.nome ?? "-"}</td>
                      <td>{item.sexo ?? "-"}</td>
                      <td>{item.parentesco ?? "-"}</td>
                      <td>{item.cpfDependente ?? "-"}</td>
                      <td>{fmtDate(item.dataNascimento)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </section>
        </article>
      ) : null}
    </section>
  );
}
