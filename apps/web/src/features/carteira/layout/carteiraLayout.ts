export type CarteiraSide = "front" | "back";

export interface CarteiraLayoutField {
  x: number;
  y: number;
  w: number;
  h: number;
  fontSize?: number;
  fontWeight?: number;
  textAlign?: "left" | "center" | "right";
  centerX?: boolean;
}

export interface CarteiraLayoutConfig {
  version: 1;
  front: {
    foto: CarteiraLayoutField;
    rh: CarteiraLayoutField;
    nome: CarteiraLayoutField;
    cpf: CarteiraLayoutField;
  };
  back: {
    cidade: CarteiraLayoutField;
    impressoData: CarteiraLayoutField;
    validadeData: CarteiraLayoutField;
    qrcode: CarteiraLayoutField;
  };
}

export const CARTEIRA_LAYOUT_STORAGE_KEY = "portal_sintese_carteira_layout_v1";

export const DEFAULT_CARTEIRA_LAYOUT: CarteiraLayoutConfig = {
  version: 1,
  front: {
    foto: { x: 10.8, y: 23.8, w: 22, h: 41 },
    rh: { x: 78, y: 24, w: 18, h: 7, fontSize: 2.8, fontWeight: 700, textAlign: "right" },
    nome: { x: 16.2, y: 73, w: 76, h: 11, fontSize: 5.1, fontWeight: 700, textAlign: "left" },
    cpf: { x: 16.2, y: 86, w: 76, h: 11, fontSize: 4.6, fontWeight: 700, textAlign: "left" }
  },
  back: {
    cidade: { x: 36, y: 3, w: 28, h: 7, fontSize: 4.4, fontWeight: 500, textAlign: "center", centerX: true },
    impressoData: { x: 22, y: 64.5, w: 25, h: 6, fontSize: 2.8, fontWeight: 700, textAlign: "left" },
    validadeData: { x: 64, y: 64.5, w: 27, h: 6, fontSize: 2.8, fontWeight: 700, textAlign: "left" },
    qrcode: { x: 38, y: 73.5, w: 24, h: 24 }
  }
};

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function normalizeField(field: CarteiraLayoutField, fallback: CarteiraLayoutField): CarteiraLayoutField {
  const w = clamp(Number.isFinite(field.w) ? field.w : fallback.w, 3, 100);
  const h = clamp(Number.isFinite(field.h) ? field.h : fallback.h, 3, 100);
  return {
    x: clamp(Number.isFinite(field.x) ? field.x : fallback.x, 0, 100 - w),
    y: clamp(Number.isFinite(field.y) ? field.y : fallback.y, 0, 100 - h),
    w,
    h,
    fontSize: Number.isFinite(field.fontSize ?? NaN) ? field.fontSize : fallback.fontSize,
    fontWeight: Number.isFinite(field.fontWeight ?? NaN) ? field.fontWeight : fallback.fontWeight,
    textAlign: field.textAlign ?? fallback.textAlign,
    centerX: typeof field.centerX === "boolean" ? field.centerX : Boolean(fallback.centerX)
  };
}

export function normalizeCarteiraLayout(input?: Partial<CarteiraLayoutConfig> | null): CarteiraLayoutConfig {
  const source = input ?? {};
  return {
    version: 1,
    front: {
      foto: normalizeField(source.front?.foto ?? DEFAULT_CARTEIRA_LAYOUT.front.foto, DEFAULT_CARTEIRA_LAYOUT.front.foto),
      rh: normalizeField(source.front?.rh ?? DEFAULT_CARTEIRA_LAYOUT.front.rh, DEFAULT_CARTEIRA_LAYOUT.front.rh),
      nome: normalizeField(source.front?.nome ?? DEFAULT_CARTEIRA_LAYOUT.front.nome, DEFAULT_CARTEIRA_LAYOUT.front.nome),
      cpf: normalizeField(source.front?.cpf ?? DEFAULT_CARTEIRA_LAYOUT.front.cpf, DEFAULT_CARTEIRA_LAYOUT.front.cpf)
    },
    back: {
      cidade: normalizeField(source.back?.cidade ?? DEFAULT_CARTEIRA_LAYOUT.back.cidade, DEFAULT_CARTEIRA_LAYOUT.back.cidade),
      impressoData: normalizeField(
        source.back?.impressoData ?? DEFAULT_CARTEIRA_LAYOUT.back.impressoData,
        DEFAULT_CARTEIRA_LAYOUT.back.impressoData
      ),
      validadeData: normalizeField(
        source.back?.validadeData ?? DEFAULT_CARTEIRA_LAYOUT.back.validadeData,
        DEFAULT_CARTEIRA_LAYOUT.back.validadeData
      ),
      qrcode: normalizeField(source.back?.qrcode ?? DEFAULT_CARTEIRA_LAYOUT.back.qrcode, DEFAULT_CARTEIRA_LAYOUT.back.qrcode)
    }
  };
}

export function loadCarteiraLayout(): CarteiraLayoutConfig {
  try {
    const raw = window.localStorage.getItem(CARTEIRA_LAYOUT_STORAGE_KEY);
    if (!raw) {
      return normalizeCarteiraLayout(DEFAULT_CARTEIRA_LAYOUT);
    }
    const parsed = JSON.parse(raw) as Partial<CarteiraLayoutConfig>;
    return normalizeCarteiraLayout(parsed);
  } catch {
    return normalizeCarteiraLayout(DEFAULT_CARTEIRA_LAYOUT);
  }
}

export function saveCarteiraLayout(layout: CarteiraLayoutConfig): void {
  window.localStorage.setItem(CARTEIRA_LAYOUT_STORAGE_KEY, JSON.stringify(normalizeCarteiraLayout(layout)));
}
