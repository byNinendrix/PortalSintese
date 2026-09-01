export type CertificadoOrientacao = "landscape" | "portrait";

export type CertificadoFrenteCampoId =
  | "textoCertificado"
  | "nomeCongressista"
  | "nomeCongresso"
  | "temaGeral"
  | "periodoCongresso"
  | "local"
  | "funcao"
  | "delegacao"
  | "plenaria"
  | "dataEmissao"
  | "assinaturaOrganizacao";

export type CertificadoVersoCampoId =
  | "tituloProgramacao"
  | "programacaoCongresso"
  | "observacaoProgramacao";

export type CertificadoCampoId = CertificadoFrenteCampoId | CertificadoVersoCampoId;

export type CertificadoFace = "frente" | "verso";

export interface CertificadoLayoutField {
  x: number;
  y: number;
  w: number;
  h: number;
  fontSize: number;
  fontWeight?: number;
  align?: "left" | "center" | "right";
  visible?: boolean;
  texto?: string;
}

export interface CertificadoFaceConfig {
  imagemBase: string | null;
  campos: Record<string, CertificadoLayoutField>;
}

export interface CertificadoLayoutConfig {
  version: 2;
  orientacao: CertificadoOrientacao;
  frente: CertificadoFaceConfig;
  verso: CertificadoFaceConfig;
}

export const CERTIFICADO_LAYOUT_STORAGE_KEY =
  "portal_sintese_certificado_congresso_layout_v2";

export const CERTIFICADO_IMAGEM_MAX_BYTES = 2 * 1024 * 1024;

export const CERTIFICADO_FRENTE_CAMPO_LABELS: Record<CertificadoFrenteCampoId, string> = {
  textoCertificado: "Texto do certificado",
  nomeCongressista: "Nome do congressista",
  nomeCongresso: "Nome do congresso",
  temaGeral: "Tema geral",
  periodoCongresso: "Periodo do congresso",
  local: "Local",
  funcao: "Funcao",
  delegacao: "Delegacao",
  plenaria: "Plenaria",
  dataEmissao: "Data de emissao",
  assinaturaOrganizacao: "Assinatura/organizacao",
};

export const CERTIFICADO_VERSO_CAMPO_LABELS: Record<CertificadoVersoCampoId, string> = {
  tituloProgramacao: "Titulo da programacao",
  programacaoCongresso: "Programacao do congresso",
  observacaoProgramacao: "Observacao da programacao",
};

export const CERTIFICADO_FRENTE_FIELD_OPTIONS: Array<{
  id: CertificadoFrenteCampoId;
  label: string;
}> = Object.entries(CERTIFICADO_FRENTE_CAMPO_LABELS).map(([id, label]) => ({
  id: id as CertificadoFrenteCampoId,
  label,
}));

export const CERTIFICADO_VERSO_FIELD_OPTIONS: Array<{
  id: CertificadoVersoCampoId;
  label: string;
}> = Object.entries(CERTIFICADO_VERSO_CAMPO_LABELS).map(([id, label]) => ({
  id: id as CertificadoVersoCampoId,
  label,
}));

export const CERTIFICADO_PLACEHOLDERS = [
  "{NOME_CONGRESSISTA}",
  "{NOME_CONGRESSO}",
  "{TEMA_GERAL}",
  "{LOCAL}",
  "{PERIODO_CONGRESSO}",
  "{FUNCAO}",
  "{DELEGACAO}",
  "{PLENARIA}",
  "{DATA_EMISSAO}",
] as const;

export const DEFAULT_FRENTE_CAMPOS: Record<CertificadoFrenteCampoId, CertificadoLayoutField> = {
  textoCertificado: {
    x: 12,
    y: 38,
    w: 76,
    h: 18,
    fontSize: 2.2,
    fontWeight: 500,
    align: "center",
    visible: true,
    texto: "Certificamos que {NOME_CONGRESSISTA} participou do {NOME_CONGRESSO}, realizado em {LOCAL}, no periodo de {PERIODO_CONGRESSO}.",
  },
  nomeCongressista: {
    x: 12,
    y: 58,
    w: 76,
    h: 9,
    fontSize: 3.6,
    fontWeight: 800,
    align: "center",
    visible: false,
    texto: "CERTIFICADO",
  },
  nomeCongresso: {
    x: 12,
    y: 58,
    w: 76,
    h: 8,
    fontSize: 2.2,
    fontWeight: 700,
    align: "center",
    visible: false,
  },
  temaGeral: {
    x: 14,
    y: 67,
    w: 72,
    h: 7,
    fontSize: 1.6,
    fontWeight: 500,
    align: "center",
    visible: false,
  },
  periodoCongresso: {
    x: 18,
    y: 76,
    w: 30,
    h: 6,
    fontSize: 1.45,
    fontWeight: 600,
    align: "left",
    visible: false,
  },
  local: {
    x: 52,
    y: 76,
    w: 30,
    h: 6,
    fontSize: 1.45,
    fontWeight: 600,
    align: "left",
    visible: false,
  },
  funcao: {
    x: 18,
    y: 83,
    w: 20,
    h: 5,
    fontSize: 1.25,
    fontWeight: 500,
    align: "left",
    visible: false,
  },
  delegacao: {
    x: 40,
    y: 83,
    w: 22,
    h: 5,
    fontSize: 1.25,
    fontWeight: 500,
    align: "left",
    visible: false,
  },
  plenaria: {
    x: 64,
    y: 83,
    w: 18,
    h: 5,
    fontSize: 1.25,
    fontWeight: 500,
    align: "left",
    visible: false,
  },
  dataEmissao: {
    x: 14,
    y: 91,
    w: 26,
    h: 5,
    fontSize: 1.2,
    fontWeight: 500,
    align: "left",
    visible: false,
  },
  assinaturaOrganizacao: {
    x: 62,
    y: 89,
    w: 24,
    h: 8,
    fontSize: 1.35,
    fontWeight: 700,
    align: "center",
    visible: false,
    texto: "",
  },
};

export const DEFAULT_VERSO_CAMPOS: Record<CertificadoVersoCampoId, CertificadoLayoutField> = {
  tituloProgramacao: {
    x: 10,
    y: 6,
    w: 80,
    h: 8,
    fontSize: 2.8,
    fontWeight: 700,
    align: "center",
    visible: true,
    texto: "",
  },
  programacaoCongresso: {
    x: 6,
    y: 16,
    w: 88,
    h: 68,
    fontSize: 1.4,
    fontWeight: 400,
    align: "left",
    visible: true,
  },
  observacaoProgramacao: {
    x: 10,
    y: 86,
    w: 80,
    h: 10,
    fontSize: 1.2,
    fontWeight: 400,
    align: "center",
    visible: true,
    texto: "",
  },
};

export const DEFAULT_CERTIFICADO_LAYOUT: CertificadoLayoutConfig = {
  version: 2,
  orientacao: "landscape",
  frente: {
    imagemBase: null,
    campos: { ...DEFAULT_FRENTE_CAMPOS },
  },
  verso: {
    imagemBase: null,
    campos: { ...DEFAULT_VERSO_CAMPOS },
  },
};

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizeField(
  field: Partial<CertificadoLayoutField> | undefined,
  fallback: CertificadoLayoutField,
): CertificadoLayoutField {
  const source = field ?? {};
  const w = clamp(Number.isFinite(source.w) ? Number(source.w) : fallback.w, 3, 100);
  const h = clamp(Number.isFinite(source.h) ? Number(source.h) : fallback.h, 3, 100);
  const align = source.align === "left" || source.align === "right" || source.align === "center"
    ? source.align
    : fallback.align;

  return {
    x: clamp(Number.isFinite(source.x) ? Number(source.x) : fallback.x, 0, 100 - w),
    y: clamp(Number.isFinite(source.y) ? Number(source.y) : fallback.y, 0, 100 - h),
    w,
    h,
    fontSize: clamp(
      Number.isFinite(source.fontSize) ? Number(source.fontSize) : fallback.fontSize,
      0.6,
      8,
    ),
    fontWeight: Number.isFinite(source.fontWeight ?? NaN)
      ? Number(source.fontWeight)
      : fallback.fontWeight,
    align,
    visible: typeof source.visible === "boolean" ? source.visible : fallback.visible,
    texto: typeof source.texto === "string" ? source.texto : fallback.texto,
  };
}

function normalizeImagemBase(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  if (
    trimmed.startsWith("data:image/png;base64,") ||
    trimmed.startsWith("data:image/jpeg;base64,")
  ) {
    return trimmed;
  }

  return null;
}

function normalizeFaceCampos(
  sourceCampos: Record<string, unknown>,
  defaults: Record<string, CertificadoLayoutField>,
): Record<string, CertificadoLayoutField> {
  const result: Record<string, CertificadoLayoutField> = {};
  for (const [id, fallbackField] of Object.entries(defaults)) {
    const raw = sourceCampos[id];
    result[id] = normalizeField(
      isPlainObject(raw) ? (raw as Partial<CertificadoLayoutField>) : undefined,
      fallbackField,
    );
  }
  return result;
}

function normalizeFace(
  input: unknown,
  defaultFace: CertificadoFaceConfig,
  defaultCampos: Record<string, CertificadoLayoutField>,
): CertificadoFaceConfig {
  const source = isPlainObject(input) ? input : {};
  const sourceCampos: Record<string, unknown> = isPlainObject(source.campos)
    ? (source.campos as Record<string, unknown>)
    : {};

  return {
    imagemBase: normalizeImagemBase(source.imagemBase ?? defaultFace.imagemBase),
    campos: normalizeFaceCampos(sourceCampos, defaultCampos),
  };
}

export function normalizeCertificadoLayout(
  input?: Partial<CertificadoLayoutConfig> | Record<string, unknown> | null,
): CertificadoLayoutConfig {
  const source: Record<string, unknown> = isPlainObject(input) ? input : {};

  const isV1 = (source.version === 1 || source.version === undefined)
    && isPlainObject(source.campos)
    && !isPlainObject(source.frente);

  if (isV1) {
    const v1Campos: Record<string, unknown> = source.campos as Record<string, unknown>;
    return {
      version: 2,
      orientacao: source.orientacao === "portrait" ? "portrait" : "landscape",
      frente: {
        imagemBase: normalizeImagemBase(source.imagemBase),
        campos: normalizeFaceCampos(v1Campos, DEFAULT_FRENTE_CAMPOS),
      },
      verso: normalizeFace(null, DEFAULT_CERTIFICADO_LAYOUT.verso, DEFAULT_VERSO_CAMPOS),
    };
  }

  return {
    version: 2,
    orientacao: source.orientacao === "portrait" ? "portrait" : "landscape",
    frente: normalizeFace(
      source.frente,
      DEFAULT_CERTIFICADO_LAYOUT.frente,
      DEFAULT_FRENTE_CAMPOS,
    ),
    verso: normalizeFace(
      source.verso,
      DEFAULT_CERTIFICADO_LAYOUT.verso,
      DEFAULT_VERSO_CAMPOS,
    ),
  };
}

export function loadCertificadoLayout(): CertificadoLayoutConfig {
  try {
    const raw = window.localStorage.getItem(CERTIFICADO_LAYOUT_STORAGE_KEY);
    if (!raw) {
      return normalizeCertificadoLayout(DEFAULT_CERTIFICADO_LAYOUT);
    }
    return normalizeCertificadoLayout(
      JSON.parse(raw) as Record<string, unknown>,
    );
  } catch {
    return normalizeCertificadoLayout(DEFAULT_CERTIFICADO_LAYOUT);
  }
}

export function saveCertificadoLayout(layout: CertificadoLayoutConfig): void {
  window.localStorage.setItem(
    CERTIFICADO_LAYOUT_STORAGE_KEY,
    JSON.stringify(normalizeCertificadoLayout(layout)),
  );
}

export function getFaceCampos(
  layout: CertificadoLayoutConfig,
  face: CertificadoFace,
): Record<string, CertificadoLayoutField> {
  return face === "frente" ? layout.frente.campos : layout.verso.campos;
}

export function getFaceImagemBase(
  layout: CertificadoLayoutConfig,
  face: CertificadoFace,
): string | null {
  return face === "frente" ? layout.frente.imagemBase : layout.verso.imagemBase;
}

export function setFaceImagemBase(
  layout: CertificadoLayoutConfig,
  face: CertificadoFace,
  imagemBase: string | null,
): CertificadoLayoutConfig {
  const normalized = normalizeImagemBase(imagemBase);
  if (face === "frente") {
    return { ...layout, frente: { ...layout.frente, imagemBase: normalized } };
  }
  return { ...layout, verso: { ...layout.verso, imagemBase: normalized } };
}

export function setFaceField(
  layout: CertificadoLayoutConfig,
  face: CertificadoFace,
  fieldId: string,
  value: CertificadoLayoutField,
): CertificadoLayoutConfig {
  const faceConfig = face === "frente" ? layout.frente : layout.verso;
  const defaults = face === "frente" ? DEFAULT_FRENTE_CAMPOS : DEFAULT_VERSO_CAMPOS;
  const fallbackField = (defaults as Record<string, CertificadoLayoutField>)[fieldId];
  if (!fallbackField) {
    return layout;
  }
  const normalized = normalizeField(value, fallbackField);
  const updatedFace: CertificadoFaceConfig = {
    ...faceConfig,
    campos: { ...faceConfig.campos, [fieldId]: normalized },
  };
  if (face === "frente") {
    return { ...layout, frente: updatedFace };
  }
  return { ...layout, verso: updatedFace };
}
