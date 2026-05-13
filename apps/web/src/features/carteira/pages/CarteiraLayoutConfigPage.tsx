import { useEffect, useMemo, useRef, useState, type MouseEvent as ReactMouseEvent } from "react";
import { Link } from "react-router-dom";
import { Button } from "@sintese/ui";
import type { CarteiraLayoutConfig, CarteiraLayoutField, CarteiraSide } from "../layout/carteiraLayout";
import { DEFAULT_CARTEIRA_LAYOUT, loadCarteiraLayout, normalizeCarteiraLayout, saveCarteiraLayout } from "../layout/carteiraLayout";
import { readAuthSession } from "../../auth/services/authSession";
import { digitsOnly } from "../../../shared/utils/masks";
import { useCarteiraQuery } from "../hooks/useCarteiraQuery";
import { CarteiraPreview } from "../components/CarteiraPreview";

type FieldPath =
  | "front.foto"
  | "front.rh"
  | "front.nome"
  | "front.cpf"
  | "back.cidade"
  | "back.impressoData"
  | "back.validadeData"
  | "back.qrcode";

const FIELD_OPTIONS: Array<{ path: FieldPath; label: string }> = [
  { path: "front.foto", label: "Frente: Foto" },
  { path: "front.rh", label: "Frente: RH" },
  { path: "front.nome", label: "Frente: Nome" },
  { path: "front.cpf", label: "Frente: CPF" },
  { path: "back.cidade", label: "Verso: Cidade" },
  { path: "back.impressoData", label: "Verso: Data impressão" },
  { path: "back.validadeData", label: "Verso: Data validade" },
  { path: "back.qrcode", label: "Verso: QR Code" }
];

function splitPath(path: FieldPath): { side: CarteiraSide; key: string } {
  const [side, key] = path.split(".");
  return { side: side as CarteiraSide, key };
}

function getField(layout: CarteiraLayoutConfig, path: FieldPath): CarteiraLayoutField {
  const { side, key } = splitPath(path);
  if (side === "front") {
    return layout.front[key as keyof CarteiraLayoutConfig["front"]];
  }
  return layout.back[key as keyof CarteiraLayoutConfig["back"]];
}

function setField(layout: CarteiraLayoutConfig, path: FieldPath, value: CarteiraLayoutField): CarteiraLayoutConfig {
  const { side, key } = splitPath(path);
  if (side === "front") {
    return normalizeCarteiraLayout({
      ...layout,
      front: {
        ...layout.front,
        [key]: value
      }
    });
  }
  return normalizeCarteiraLayout({
    ...layout,
    back: {
      ...layout.back,
      [key]: value
    }
  });
}

export function CarteiraLayoutConfigPage() {
  const session = readAuthSession();
  const cpfDigits = useMemo(() => digitsOnly(session?.cpf ?? ""), [session?.cpf]);
  const query = useCarteiraQuery(cpfDigits, Boolean(cpfDigits));

  const [layout, setLayout] = useState<CarteiraLayoutConfig>(() => loadCarteiraLayout());
  const [selected, setSelected] = useState<FieldPath>("front.nome");
  const [notice, setNotice] = useState<string | null>(null);
  const dragRef = useRef<{ side: CarteiraSide; key: string; startX: number; startY: number; startField: CarteiraLayoutField; rect: DOMRect } | null>(null);

  const currentField = getField(layout, selected);

  function updateCurrentField(patch: Partial<CarteiraLayoutField>) {
    setLayout((prev) => setField(prev, selected, { ...getField(prev, selected), ...patch }));
  }

  function handleFieldMouseDown(side: CarteiraSide, fieldId: string, event: ReactMouseEvent<HTMLDivElement>) {
    const path = `${side}.${fieldId}` as FieldPath;
    setSelected(path);
    const container = (event.currentTarget.closest(".carteira-face") as HTMLElement | null)?.getBoundingClientRect();
    if (!container) {
      return;
    }
    const field = getField(layout, path);
    dragRef.current = {
      side,
      key: fieldId,
      startX: event.clientX,
      startY: event.clientY,
      startField: { ...field },
      rect: container
    };
    window.addEventListener("mousemove", handleDragMove);
    window.addEventListener("mouseup", handleDragEnd);
    event.preventDefault();
  }

  function handleDragMove(event: MouseEvent) {
    const current = dragRef.current;
    if (!current) {
      return;
    }
    const dxPct = ((event.clientX - current.startX) / current.rect.width) * 100;
    const dyPct = ((event.clientY - current.startY) / current.rect.height) * 100;
    const path = `${current.side}.${current.key}` as FieldPath;
    const nextField: CarteiraLayoutField = {
      ...current.startField,
      x: current.startField.x + dxPct,
      y: current.startField.y + dyPct
    };
    setLayout((prev) => setField(prev, path, nextField));
  }

  function handleDragEnd() {
    dragRef.current = null;
    window.removeEventListener("mousemove", handleDragMove);
    window.removeEventListener("mouseup", handleDragEnd);
  }

  useEffect(() => {
    return () => {
      window.removeEventListener("mousemove", handleDragMove);
      window.removeEventListener("mouseup", handleDragEnd);
    };
  }, []);

  function saveLayout() {
    saveCarteiraLayout(layout);
    setNotice("Layout salvo com sucesso.");
    window.setTimeout(() => setNotice(null), 2200);
  }

  function resetLayout() {
    setLayout(DEFAULT_CARTEIRA_LAYOUT);
    setNotice("Layout redefinido para o padrao.");
    window.setTimeout(() => setNotice(null), 2200);
  }

  return (
    <section className="page-container">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Configuração da Carteira</h1>
          <p className="text-sm text-slate-600">Atalho no Menu Principal: Ctrl+Shift+Q. Arraste os campos sobre a frente e o verso.</p>
        </div>
        <div className="flex gap-2">
          <Button type="button" className="btn-secondary" onClick={resetLayout}>
            Resetar padrão
          </Button>
          <Button type="button" className="btn-modern-primary" onClick={saveLayout}>
            Salvar layout
          </Button>
          <Link to="/menu-principal" className="block">
            <Button type="button" className="btn-modern-danger">Voltar</Button>
          </Link>
        </div>
      </div>

      {notice ? <div className="alert-success mb-3">{notice}</div> : null}
      {query.isError ? <div className="alert-error mb-3">Não foi possível carregar os dados de pré-visualização da carteira.</div> : null}
      {query.isLoading ? <div className="carteira-loading">Carregando preview...</div> : null}

      {query.data ? (
        <div className="carteira-editor-grid">
          <div className="surface-card p-4">
            <CarteiraPreview
              carteira={query.data}
              layout={layout}
              className="carteira-sheet carteira-sheet-editor"
              editable
              selectedField={selected}
              onFieldMouseDown={handleFieldMouseDown}
              showGuides
            />
          </div>

          <aside className="surface-card p-4">
            <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-700">Campos</h2>
            <div className="space-y-2">
              {FIELD_OPTIONS.map((item) => (
                <button
                  key={item.path}
                  type="button"
                  className={`carteira-editor-field-btn ${selected === item.path ? "carteira-editor-field-btn-active" : ""}`}
                  onClick={() => setSelected(item.path)}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <label className="text-xs font-semibold text-slate-600">
                X (%)
                <input
                  className="form-input mt-1"
                  type="number"
                  step="0.1"
                  value={currentField.x}
                  disabled={Boolean(currentField.centerX)}
                  onChange={(e) => updateCurrentField({ x: Number(e.target.value) })}
                />
              </label>
              <label className="text-xs font-semibold text-slate-600">
                Y (%)
                <input className="form-input mt-1" type="number" step="0.1" value={currentField.y} onChange={(e) => updateCurrentField({ y: Number(e.target.value) })} />
              </label>
              <label className="col-span-2 flex items-center gap-2 text-xs font-semibold text-slate-600">
                <input
                  type="checkbox"
                  checked={Boolean(currentField.centerX)}
                  onChange={(e) => updateCurrentField({ centerX: e.target.checked })}
                />
                Centralizar no eixo X
              </label>
              <label className="text-xs font-semibold text-slate-600">
                Largura (%)
                <input className="form-input mt-1" type="number" step="0.1" value={currentField.w} onChange={(e) => updateCurrentField({ w: Number(e.target.value) })} />
              </label>
              <label className="text-xs font-semibold text-slate-600">
                Altura (%)
                <input className="form-input mt-1" type="number" step="0.1" value={currentField.h} onChange={(e) => updateCurrentField({ h: Number(e.target.value) })} />
              </label>
              <label className="col-span-2 text-xs font-semibold text-slate-600">
                Fonte (cqw)
                <input
                  className="form-input mt-1"
                  type="number"
                  step="0.1"
                  value={currentField.fontSize ?? 2.8}
                  onChange={(e) => updateCurrentField({ fontSize: Number(e.target.value) })}
                />
              </label>
            </div>
          </aside>
        </div>
      ) : null}
    </section>
  );
}
