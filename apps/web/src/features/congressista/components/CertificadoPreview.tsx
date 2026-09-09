import type { CSSProperties, MouseEvent as ReactMouseEvent, ReactNode } from "react";
import type { CertificadoCongressista } from "../services/congressista.service";
import type {
  CertificadoFace,
  CertificadoFaceConfig,
  CertificadoLayoutConfig,
  CertificadoLayoutField,
} from "../layout/certificadoLayout";

interface CertificadoFacePreviewProps {
  certificado: CertificadoCongressista;
  faceConfig: CertificadoFaceConfig;
  face: CertificadoFace;
  orientacao: CertificadoLayoutConfig["orientacao"];
  placeholderBold?: Record<string, boolean>;
  className?: string;
  editable?: boolean;
  selectedField?: string | null;
  onFieldMouseDown?: (
    fieldId: string,
    event: ReactMouseEvent<HTMLDivElement>,
  ) => void;
  showGuides?: boolean;
}

interface CertificadoPreviewProps {
  certificado: CertificadoCongressista;
  layout: CertificadoLayoutConfig;
  face?: CertificadoFace;
  className?: string;
  editable?: boolean;
  selectedField?: string | null;
  onFieldMouseDown?: (
    fieldId: string,
    event: ReactMouseEvent<HTMLDivElement>,
  ) => void;
  showGuides?: boolean;
}

function formatarFuncaoCertificado(funcao: string | null | undefined): string {
  if (!funcao) {
    return "-";
  }

  const normalizado = funcao
    .trim()
    .replace(/\s+/g, " ")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();

  const mapa: Record<string, string> = {
    "TITULAR": "Delegado(a) titular",
    "SUPLENTE": "Delegado(a) suplente",
    "NATO": "Delegado(a) nato",
    "SUBSTITUIDO": "Substitu\u00eddo(a)",
    "OBSERVADOR": "Observador(a)",
    "DELEGADO TITULAR": "Delegado(a) titular",
    "DELEGADO SUPLENTE": "Delegado(a) suplente",
    "DELEGADO NATO": "Delegado(a) nato",
    "DELEGADO": "Delegado(a)",
    "CONVIDADO": "Convidado(a)",
    "COORDENADOR": "Coordenador(a)",
    "PALESTRANTE": "Palestrante",
    "PRESIDENTE": "Presidente",
    "SECRETARIO": "Secret\u00e1rio(a)",
    "TESOUREIRO": "Tesoureiro(a)",
    "ASSESSOR": "Assessor(a)",
    "AUXILIAR": "Auxiliar",
    "VISITANTE": "Visitante",
  };

  if (mapa[normalizado]) {
    return mapa[normalizado];
  }

  return funcao
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase()
    .replace(/(?:^|\s)\S/g, (c) => c.toUpperCase());
}

function fallback(value: string | number | null | undefined): string {
  if (value === null || value === undefined) {
    return "-";
  }

  const text = String(value).trim();
  return text || "-";
}

function formatDateBr(value: string | null | undefined): string {
  if (!value) {
    return "-";
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

function formatPeriodo(certificado: CertificadoCongressista): string {
  const inicio = formatDateBr(certificado.congresso.data_inicio);
  const fim = formatDateBr(certificado.congresso.data_fim);
  return inicio === fim ? inicio : `${inicio} a ${fim}`;
}

function getPlaceholderMap(
  certificado: CertificadoCongressista,
): Record<string, string> {
  return {
    "{NOME_CONGRESSISTA}": fallback(certificado.nome),
    "{NOME_CONGRESSO}": fallback(certificado.congresso.discriminacao),
    "{TEMA_GERAL}": fallback(certificado.congresso.tema_geral),
    "{LOCAL}": fallback(certificado.congresso.local),
    "{PERIODO_CONGRESSO}": formatPeriodo(certificado),
    "{FUNCAO}": formatarFuncaoCertificado(certificado.funcao),
    "{DELEGACAO}": certificado.delegacao ?? "-",
    "{PLENARIA}": certificado.plenaria ?? "-",
    "{DATA_EMISSAO}": formatDateBr(certificado.data_emissao),
  };
}

function replacePlaceholders(
  template: string,
  certificado: CertificadoCongressista,
): string {
  const map = getPlaceholderMap(certificado);
  let result = template;
  for (const [placeholder, value] of Object.entries(map)) {
    result = result.replaceAll(placeholder, value);
  }
  return result;
}

function replacePlaceholdersToNodes(
  template: string,
  certificado: CertificadoCongressista,
  boldMap?: Record<string, boolean>,
): ReactNode {
  const map = getPlaceholderMap(certificado);
  const placeholders = Object.keys(map);
  const pattern = placeholders
    .map((p) => p.replace(/[{}]/g, "\\$&"))
    .join("|");

  if (!pattern) {
    return template;
  }

  const regex = new RegExp(`(${pattern})`, "g");
  const parts = template.split(regex);

  const hasBold = boldMap && parts.some(
    (part) => placeholders.includes(part) && boldMap[part],
  );

  if (!hasBold) {
    let result = template;
    for (const [placeholder, value] of Object.entries(map)) {
      result = result.replaceAll(placeholder, value);
    }
    return result;
  }

  return (
    <span style={{ whiteSpace: "pre-wrap", overflowWrap: "break-word", wordBreak: "normal" }}>
      {parts.map((part, index) => {
        if (placeholders.includes(part)) {
          const value = map[part];
          if (boldMap[part]) {
            return (
              <span key={index} style={{ fontWeight: 700 }}>
                {value}
              </span>
            );
          }
          return value;
        }
        return part;
      })}
    </span>
  );
}

function buildFrenteValues(
  certificado: CertificadoCongressista,
): Record<string, string> {
  return {
    textoCertificado: `Certificamos que {NOME_CONGRESSISTA} participou do {NOME_CONGRESSO}, realizado em {LOCAL}, no periodo de {PERIODO_CONGRESSO}.`,
    nomeCongressista: fallback(certificado.nome),
    nomeCongresso: fallback(certificado.congresso.discriminacao),
    temaGeral: certificado.congresso.tema_geral
      ? `Tema geral: ${certificado.congresso.tema_geral}`
      : "",
    periodoCongresso: `Periodo: ${formatPeriodo(certificado)}`,
    local: `Local: ${fallback(certificado.congresso.local)}`,
    funcao: certificado.funcao
      ? `Funcao: ${formatarFuncaoCertificado(certificado.funcao)}`
      : "",
    delegacao: certificado.delegacao
      ? `Delegacao: ${certificado.delegacao}`
      : "",
    plenaria: certificado.plenaria ? `Plenaria: ${certificado.plenaria}` : "",
    dataEmissao: `Emitido em ${formatDateBr(certificado.data_emissao)}`,
    assinaturaOrganizacao: "",
  };
}

function buildProgramacaoTexto(certificado: CertificadoCongressista): string {
  const programacao = certificado.programacao;
  if (!programacao || programacao.length === 0) {
    return "Programacao nao disponivel.";
  }

  const porData = new Map<string, Array<{ nome: string; cargo: string }>>();
  for (const item of programacao) {
    const dataKey = item.data_palestra
      ? formatDateBr(item.data_palestra)
      : "Data não informada";
    const grupo = porData.get(dataKey) ?? [];
    grupo.push({
      nome: item.nome ?? "Palestrante não informado",
      cargo: item.cargo_funcao ?? "",
    });
    porData.set(dataKey, grupo);
  }

  const linhas: string[] = [];
  for (const [data, itens] of porData) {
    linhas.push(`${data}:`);
    for (const item of itens) {
      const desc = item.cargo ? `${item.nome} — ${item.cargo}` : item.nome;
      linhas.push(`  - ${desc}`);
    }
    linhas.push("");
  }

  return linhas.join("\n").trim();
}

function buildVersoValues(
  certificado: CertificadoCongressista,
): Record<string, string> {
  return {
    tituloProgramacao: `Programacao - ${fallback(certificado.congresso.discriminacao)}`,
    programacaoCongresso: buildProgramacaoTexto(certificado),
    observacaoProgramacao: "",
  };
}

function fieldToStyle(field: CertificadoLayoutField): CSSProperties {
  return {
    position: "absolute",
    left: `${field.x}%`,
    top: `${field.y}%`,
    width: `${field.w}%`,
    minHeight: `${field.h}%`,
    fontSize: `${field.fontSize}cqw`,
    fontWeight: field.fontWeight,
    lineHeight: field.lineHeight ?? 1.2,
    textAlign: field.align,
  };
}

function fieldClass(
  editable: boolean,
  selectedField: string | null,
  fieldId: string,
): string {
  const classes = ["certificado-field"];
  if (editable) {
    classes.push("certificado-editor-field");
    if (selectedField === fieldId) {
      classes.push("certificado-editor-field-selected");
    }
  }
  return classes.join(" ");
}

function CertificadoFacePreview({
  certificado,
  faceConfig,
  face,
  orientacao,
  placeholderBold,
  className,
  editable = false,
  selectedField = null,
  onFieldMouseDown,
  showGuides = false,
}: CertificadoFacePreviewProps) {
  const rawValues =
    face === "frente"
      ? buildFrenteValues(certificado)
      : buildVersoValues(certificado);

  return (
    <article
      className={[
        "certificado-sheet",
        orientacao === "portrait"
          ? "certificado-sheet-portrait"
          : "certificado-sheet-landscape",
        className ?? "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {faceConfig.imagemBase ? (
        <img
          className="certificado-base-image"
          src={faceConfig.imagemBase}
          alt={`Imagem base do certificado (${face})`}
        />
      ) : null}

      {Object.entries(faceConfig.campos).map(([fieldId, field]) => {
        if (field.visible === false) {
          return null;
        }

        const hasTextoFixo =
          fieldId !== "programacaoCongresso" &&
          typeof field.texto === "string" &&
          field.texto.trim().length > 0;

        const rawTemplate = hasTextoFixo
          ? field.texto!
          : (rawValues[fieldId] ?? (editable ? fieldId : ""));

        const isProgramacao = fieldId === "programacaoCongresso";

        let displayContent: ReactNode;
        if (isProgramacao) {
          displayContent = (
            <pre
              style={{
                margin: 0,
                fontFamily: "inherit",
                fontSize: "inherit",
                fontWeight: "inherit",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                lineHeight: 1.5,
              }}
            >
              {rawTemplate}
            </pre>
          );
        } else {
          const rendered = replacePlaceholdersToNodes(
            rawTemplate,
            certificado,
            placeholderBold,
          );
          displayContent = rendered || (editable ? "-" : "");
        }

        return (
          <div
            key={fieldId}
            style={fieldToStyle(field)}
            className={fieldClass(editable, selectedField, fieldId)}
            onMouseDown={
              editable
                ? (event) => onFieldMouseDown?.(fieldId, event)
                : undefined
            }
          >
            {displayContent}
          </div>
        );
      })}

      {showGuides ? (
        <div className="certificado-guide-label">
          {face === "frente" ? "Frente" : "Verso"}
        </div>
      ) : null}
    </article>
  );
}

export function CertificadoPreview({
  certificado,
  layout,
  face,
  className,
  editable = false,
  selectedField = null,
  onFieldMouseDown,
  showGuides = false,
}: CertificadoPreviewProps) {
  const boldMap = layout.placeholderBold;

  if (face) {
    const faceConfig = face === "frente" ? layout.frente : layout.verso;
    return (
      <CertificadoFacePreview
        certificado={certificado}
        faceConfig={faceConfig}
        face={face}
        orientacao={layout.orientacao}
        placeholderBold={boldMap}
        className={className}
        editable={editable}
        selectedField={selectedField}
        onFieldMouseDown={onFieldMouseDown}
        showGuides={showGuides}
      />
    );
  }

  return (
    <>
      <CertificadoFacePreview
        certificado={certificado}
        faceConfig={layout.frente}
        face="frente"
        orientacao={layout.orientacao}
        placeholderBold={boldMap}
        className={className}
        editable={editable}
        selectedField={selectedField}
        onFieldMouseDown={onFieldMouseDown}
        showGuides={showGuides}
      />
      <CertificadoFacePreview
        certificado={certificado}
        faceConfig={layout.verso}
        face="verso"
        orientacao={layout.orientacao}
        placeholderBold={boldMap}
        className={className}
        editable={editable}
        selectedField={selectedField}
        onFieldMouseDown={onFieldMouseDown}
        showGuides={showGuides}
      />
    </>
  );
}
