import { useEffect, useMemo, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Button } from "@sintese/ui";
import { readAuthSession } from "../../auth/services/authSession";
import { digitsOnly, formatCpf } from "../../../shared/utils/masks";
import { useProtocoloRelatorioQuery } from "../hooks/useProtocoloRelatorioQuery";

function fmtDate(value?: string | null): string {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString("pt-BR");
}

function fmtDateTime(value?: string | null): string {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString("pt-BR");
}

function sanitizeLgpdHtml(value?: string | null): string {
  const raw = (value ?? "").trim();
  if (!raw) return "<p>Termo L.G.P.D nao disponivel.</p>";

  const decoded = (() => {
    const textarea = document.createElement("textarea");
    textarea.innerHTML = raw;
    return textarea.value.trim();
  })();

  const source = decoded || raw;
  const appearsHtml = /<\/?[a-z][\s\S]*>/i.test(source);

  if (!appearsHtml) {
    return source
      .replace(/\r\n/g, "\n")
      .split(/\n{2,}/)
      .map((part) => `<p>${part.replace(/\n/g, "<br/>")}</p>`)
      .join("");
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(source, "text/html");

  doc.querySelectorAll("script,style,link,meta").forEach((node) => node.remove());
  doc.querySelectorAll("*").forEach((el) => {
    el.removeAttribute("style");
    el.removeAttribute("class");
    el.removeAttribute("id");
    el.removeAttribute("dir");
    [...el.attributes].forEach((attr) => {
      if (/^on/i.test(attr.name)) {
        el.removeAttribute(attr.name);
      }
    });
  });

  const html = doc.body.innerHTML.trim();
  return html.length > 0 ? html : "<p>Termo L.G.P.D nao disponivel.</p>";
}

function hasText(value?: string | null): boolean {
  return Boolean(value && value.trim().length > 0);
}

function hasMeaningfulText(value?: string | null): boolean {
  if (!hasText(value)) return false;
  const normalized = (value ?? "").trim().toLowerCase();
  return normalized !== "-" && normalized !== "--" && normalized !== "null" && normalized !== "undefined";
}

function Linha({ label, value }: { label: string; value?: string | null }) {
  return (
    <p className="protocolo-line">
      <strong>{label}:</strong>
      <span>{value && value.trim().length > 0 ? value : "-"}</span>
    </p>
  );
}

function LinhaCompact({ label, value }: { label: string; value?: string | null }) {
  return (
    <p className="protocolo-line-compact">
      <strong>{label}:</strong>
      <span>{value && value.trim().length > 0 ? value : "-"}</span>
    </p>
  );
}

function AnexoItem({ title, src }: { title: string; src?: string | null }) {
  return (
    <article className="protocolo-anexo-card">
      <h4>{title}</h4>
      {src ? (
        <img src={src} alt={title} className="protocolo-anexo-img" />
      ) : (
        <div className="protocolo-anexo-empty">Sem imagem</div>
      )}
    </article>
  );
}

export function ProtocoloRelatorioPage() {
  const hasTriggeredAutoPrint = useRef(false);
  const [searchParams] = useSearchParams();
  const protocolo = (searchParams.get("protocolo") ?? "").trim();
  const autoPrint = searchParams.get("autoPrint") === "1";
  const embedded = searchParams.get("embedded") === "1";
  const session = readAuthSession();
  const cpfDigits = useMemo(() => digitsOnly(session?.cpf ?? ""), [session?.cpf]);

  const query = useProtocoloRelatorioQuery(protocolo, cpfDigits, Boolean(protocolo && cpfDigits));
  const relatorio = query.data;
  const vinculo1Linhas = relatorio
    ? [
        { label: "Matricula", value: relatorio.detalhe.matriculaOrgao },
        { label: "Ente publico", value: relatorio.detalhe.entePublico },
        { label: "Funcao", value: relatorio.detalhe.funcaoOrgao },
        { label: "Cargo", value: relatorio.detalhe.cargoOrgao },
        { label: "Regime trabalho", value: relatorio.detalhe.vinculoEmpregaticioOrgao },
        { label: "Nivel carreira", value: relatorio.detalhe.nivelOrgao },
        { label: "Situacao filiacao", value: relatorio.detalhe.situacaoFiliacao },
        { label: "Situacao funcional", value: relatorio.detalhe.situacaoFuncional },
        {
          label: "Data aposentadoria",
          value: relatorio.detalhe.aposentadoriaOrgao ? fmtDate(relatorio.detalhe.aposentadoriaOrgao) : null
        }
      ].filter((item) => hasMeaningfulText(item.value))
    : [];
  const painelLadoLinhas = relatorio
    ? [
        { label: "RG", value: relatorio.detalhe.rgOculto },
        { label: "Data exp.", value: relatorio.detalhe.dataExpRg ? fmtDate(relatorio.detalhe.dataExpRg) : null },
        { label: "Pai", value: relatorio.detalhe.pai },
        { label: "Mae", value: relatorio.detalhe.mae },
        { label: "Telefone", value: relatorio.detalhe.telefone }
      ].filter((item) => hasMeaningfulText(item.value))
    : [];
  const anexos = relatorio
    ? [
        { title: "Comprovante de residencia", src: relatorio.detalhe.fotoResidencia },
        { title: "Contracheque 01", src: relatorio.detalhe.fotoContracheque01 },
        { title: "Documento oficial (frente)", src: relatorio.detalhe.fotoRgFrente },
        { title: "Documento oficial (verso)", src: relatorio.detalhe.fotoRgVerso },
        { title: "Selfie com documento", src: relatorio.detalhe.fotoDocumento },
        { title: "Contracheque 02", src: relatorio.detalhe.fotoContracheque02 }
      ].filter((anexo) => hasMeaningfulText(anexo.src))
    : [];
  const vinculo2Linhas = relatorio
    ? [
        { label: "Matricula", value: relatorio.detalhe.matriculaOrgaoI },
        { label: "Ente publico", value: relatorio.detalhe.entePublicoI },
        { label: "Funcao", value: relatorio.detalhe.funcaoOrgaoI },
        { label: "Cargo", value: relatorio.detalhe.cargoOrgaoI },
        { label: "Regime trabalho", value: relatorio.detalhe.vinculoEmpregaticioOrgaoI },
        { label: "Nivel carreira", value: relatorio.detalhe.nivelOrgaoI },
        { label: "Situacao funcional", value: relatorio.detalhe.situacaoOrgaoI },
        {
          label: "Data aposentadoria",
          value: relatorio.detalhe.aposentadoriaOrgaoI ? fmtDate(relatorio.detalhe.aposentadoriaOrgaoI) : null
        }
      ].filter((item) => hasMeaningfulText(item.value))
    : [];

  useEffect(() => {
    if (!autoPrint || !relatorio || query.isLoading || hasTriggeredAutoPrint.current) {
      return;
    }

    hasTriggeredAutoPrint.current = true;
    const timer = window.setTimeout(() => {
      if (embedded && window.parent && window.parent !== window) {
        window.parent.postMessage({ type: "protocolo-print-triggered" }, window.location.origin);
      }
      window.print();
    }, 250);

    return () => window.clearTimeout(timer);
  }, [autoPrint, embedded, relatorio, query.isLoading]);

  if (!protocolo) {
    return <div className="alert-error">Protocolo invalido.</div>;
  }

  return (
    <section className="protocolo-report-root">
      <div className="protocolo-screen-actions protocolo-print-hide">
        <Button type="button" className="btn-modern-primary" onClick={() => window.print()}>
          Imprimir
        </Button>
        <Link to="/protocolos">
          <Button type="button" className="btn-modern-danger">
            Voltar
          </Button>
        </Link>
      </div>

      {!cpfDigits ? <div className="alert-error">Sessao invalida. Faca login novamente.</div> : null}
      {query.isError ? <div className="alert-error">Nao foi possivel carregar o relatorio do protocolo.</div> : null}
      {query.isLoading ? <div className="carteira-loading">Carregando relatorio...</div> : null}

      {relatorio ? (
        <>
          <article className="protocolo-report-sheet">
            <header className="protocolo-report-header">
              {relatorio.sindicato?.logoImg ? (
                <img src={relatorio.sindicato.logoImg} alt="Logo sindicato" className="protocolo-report-logo" />
              ) : null}
              <div>
                <h1>
                  {relatorio.sindicato?.razaoSocial ??
                    "SINDICATO DOS TRABALHADORES EM EDUCACAO BASICA DA REDE OFICIAL DO ESTADO DE SERGIPE"}
                </h1>
                <h2>{relatorio.detalhe.nrProtocolo ?? `N Protocolo: ${protocolo}`}</h2>
                <p className="protocolo-meta">Gerado em: {fmtDateTime(relatorio.generatedAt)}</p>
              </div>
            </header>

            <section className="protocolo-grid-main">
              <div className="protocolo-panel">
                <h3>Dados pessoais</h3>
                <Linha label="CPF" value={formatCpf(relatorio.detalhe.cpf ?? "")} />
                <Linha label="Nome" value={relatorio.detalhe.nome} />
                <Linha label="Nome social" value={relatorio.detalhe.nomeSocial} />
                <Linha label="Naturalidade" value={relatorio.detalhe.naturalidade} />
                <Linha label="Endereco" value={`${relatorio.detalhe.endereco ?? "-"} ${relatorio.detalhe.numero ?? ""}`.trim()} />
                <Linha label="Complemento" value={relatorio.detalhe.complemento} />
                <Linha label="Bairro" value={relatorio.detalhe.bairro} />
                <Linha label="Cidade / UF" value={`${relatorio.detalhe.cidade ?? "-"} / ${relatorio.detalhe.estado ?? "-"}`} />
                <Linha label="CEP" value={relatorio.detalhe.cep} />
                <Linha label="Celular" value={relatorio.detalhe.celular} />
                <Linha label="Inclusao" value={fmtDateTime(relatorio.detalhe.dataRegistro)} />
                <Linha label="E-mail" value={relatorio.detalhe.emailMaiusculo} />
                <Linha label="Sexo / Genero" value={`${relatorio.detalhe.sexoMaiusculo ?? "-"} / ${relatorio.detalhe.especificarGenero ?? "-"}`} />
              </div>

              <div className="protocolo-panel protocolo-side-panel">
                {relatorio.detalhe.foto ? (
                  <img src={relatorio.detalhe.foto} alt="Foto" className="protocolo-foto" />
                ) : (
                  <div className="protocolo-foto-empty">Sem foto</div>
                )}
                {painelLadoLinhas.map((linha) => (
                  <LinhaCompact key={linha.label} label={linha.label} value={linha.value} />
                ))}
              </div>
            </section>

            <section className="protocolo-block">
              <h3>Vinculo publico 1</h3>
              <div className="protocolo-block-grid">
                {vinculo1Linhas.map((linha) => (
                  <Linha key={linha.label} label={linha.label} value={linha.value} />
                ))}
              </div>
            </section>

            {vinculo2Linhas.length > 0 ? (
              <section className="protocolo-block">
                <h3>Vinculo publico 2</h3>
                <div className="protocolo-block-grid">
                  {vinculo2Linhas.map((linha) => (
                    <Linha key={linha.label} label={linha.label} value={linha.value} />
                  ))}
                </div>
              </section>
            ) : null}

            {anexos.length > 0 ? (
              <section className="protocolo-block">
                <h3>Anexos</h3>
                <div className="protocolo-anexos-grid">
                  {anexos.map((anexo) => (
                    <AnexoItem key={anexo.title} title={anexo.title} src={anexo.src} />
                  ))}
                </div>
              </section>
            ) : null}

            <footer className="protocolo-footer">
              <p className="protocolo-footer-title">AUTORIZACAO PARA DESCONTO DA CONTRIBUICAO SINDICAL</p>
              <p>
                {relatorio.sindicato?.textoAutorizacaoDesconto ??
                  "Autorizo o desconto mensal da contribuicao sindical em meu contracheque."}
              </p>
              <p className="protocolo-footer-sign">{relatorio.detalhe.autorizarDesconto ?? "-"}</p>
            </footer>
          </article>

          <article className="protocolo-report-sheet protocolo-report-lgpd">
            <header className="protocolo-report-header">
              {relatorio.sindicato?.logoImg ? (
                <img src={relatorio.sindicato.logoImg} alt="Logo sindicato" className="protocolo-report-logo" />
              ) : null}
              <div>
                <h1>
                  {relatorio.sindicato?.razaoSocial ??
                    "SINDICATO DOS TRABALHADORES EM EDUCACAO BASICA DA REDE OFICIAL DO ESTADO DE SERGIPE"}
                </h1>
                <h2>L.G.P.D. Lei Geral de Protecao de Dados</h2>
              </div>
            </header>

            <h3 className="protocolo-lgpd-protocolo">{relatorio.detalhe.nrProtocolo ?? `N Protocolo: ${protocolo}`}</h3>

            <section className="protocolo-termo" dangerouslySetInnerHTML={{ __html: sanitizeLgpdHtml(relatorio.detalhe.termoLgpdTexto) }} />
            <p className="protocolo-footer-sign">{relatorio.detalhe.termoLgpdConfirmacao ?? "-"}</p>
          </article>
        </>
      ) : null}
    </section>
  );
}
