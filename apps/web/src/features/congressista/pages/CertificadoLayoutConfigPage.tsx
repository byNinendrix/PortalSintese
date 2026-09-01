import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type MouseEvent as ReactMouseEvent,
} from "react";
import { Link } from "react-router-dom";
import { Button } from "@sintese/ui";
import { CertificadoPreview } from "../components/CertificadoPreview";
import {
  CERTIFICADO_FRENTE_FIELD_OPTIONS,
  CERTIFICADO_VERSO_FIELD_OPTIONS,
  CERTIFICADO_IMAGEM_MAX_BYTES,
  CERTIFICADO_PLACEHOLDERS,
  DEFAULT_CERTIFICADO_LAYOUT,
  type CertificadoFace,
  type CertificadoLayoutConfig,
  type CertificadoLayoutField,
  getFaceCampos,
  getFaceImagemBase,
  setFaceField,
  setFaceImagemBase,
  loadCertificadoLayout,
  normalizeCertificadoLayout,
  saveCertificadoLayout,
} from "../layout/certificadoLayout";
import {
  congressistaService,
  type CertificadoCongressista,
} from "../services/congressista.service";

function buildPreviewCertificado(): CertificadoCongressista {
  const inicio = new Date();
  const fim = new Date(inicio);
  fim.setDate(fim.getDate() + 2);
  const dia2 = new Date(inicio);
  dia2.setDate(dia2.getDate() + 1);

  return {
    nome: "CONGRESSISTA SINTESE",
    funcao: "Delegado(a)",
    delegacao: "Aracaju",
    plenaria: "Plenaria geral",
    congresso: {
      id_congresso: 0,
      ano: inicio.getFullYear(),
      discriminacao: "Congresso Estadual do SINTESE",
      tema_geral: "Educacao publica, democracia e valorizacao profissional",
      local: "Aracaju/SE",
      endereco: null,
      data_inicio: inicio.toISOString(),
      data_fim: fim.toISOString(),
      hora_inicio: null,
      hora_fim: null,
      logo: null,
    },
    programacao: [
      {
        nome: "Maria Silva",
        cargo_funcao: "Diretora de Ensino",
        data_palestra: inicio.toISOString(),
      },
      {
        nome: "Joao Santos",
        cargo_funcao: "Professor",
        data_palestra: inicio.toISOString(),
      },
      {
        nome: "Ana Oliveira",
        cargo_funcao: "Coordenadora Pedagogica",
        data_palestra: dia2.toISOString(),
      },
    ],
    data_emissao: new Date().toISOString(),
    credenciado: true,
  };
}

function formatImageLimit(): string {
  return `${Math.floor(CERTIFICADO_IMAGEM_MAX_BYTES / 1024 / 1024)} MB`;
}

export function CertificadoLayoutConfigPage() {
  const previewCertificado = useMemo(() => buildPreviewCertificado(), []);
  const [layout, setLayout] = useState<CertificadoLayoutConfig>(() =>
    loadCertificadoLayout(),
  );
  const [activeFace, setActiveFace] = useState<CertificadoFace>("frente");
  const [selected, setSelected] = useState<string>("nomeCongressista");
  const [notice, setNotice] = useState<string | null>(null);
  const [noticeType, setNoticeType] = useState<"success" | "warning" | "error">(
    "success",
  );
  const [isSavingGlobal, setIsSavingGlobal] = useState(false);
  const dragRef = useRef<{
    fieldId: string;
    face: CertificadoFace;
    startX: number;
    startY: number;
    startField: CertificadoLayoutField;
    rect: DOMRect;
  } | null>(null);

  const fieldOptions =
    activeFace === "frente"
      ? CERTIFICADO_FRENTE_FIELD_OPTIONS
      : CERTIFICADO_VERSO_FIELD_OPTIONS;

  const faceCampos = getFaceCampos(layout, activeFace);
  const currentField = faceCampos[selected] ?? null;

  function showNotice(
    message: string,
    type: "success" | "warning" | "error" = "success",
  ) {
    setNotice(message);
    setNoticeType(type);
    window.setTimeout(() => setNotice(null), 3200);
  }

  function updateCurrentField(patch: Partial<CertificadoLayoutField>) {
    if (!currentField) return;
    setLayout((prev) =>
      setFaceField(prev, activeFace, selected, { ...currentField, ...patch }),
    );
  }

  function updateOrientacao(orientacao: CertificadoLayoutConfig["orientacao"]) {
    setLayout((prev) => normalizeCertificadoLayout({ ...prev, orientacao }));
  }

  function updateImagemBase(imagemBase: string | null) {
    setLayout((prev) => setFaceImagemBase(prev, activeFace, imagemBase));
  }

  function updatePlaceholderBold(placeholder: string, bold: boolean) {
    setLayout((prev) => ({
      ...prev,
      placeholderBold: { ...prev.placeholderBold, [placeholder]: bold },
    }));
  }

  function handleFieldMouseDown(
    fieldId: string,
    event: ReactMouseEvent<HTMLDivElement>,
  ) {
    setSelected(fieldId);
    const container = (
      event.currentTarget.closest(".certificado-sheet") as HTMLElement | null
    )?.getBoundingClientRect();

    if (!container) {
      return;
    }

    const campos = getFaceCampos(layout, activeFace);
    const field = campos[fieldId];
    if (!field) return;

    dragRef.current = {
      fieldId,
      face: activeFace,
      startX: event.clientX,
      startY: event.clientY,
      startField: { ...field },
      rect: container,
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
    const nextField: CertificadoLayoutField = {
      ...current.startField,
      x: current.startField.x + dxPct,
      y: current.startField.y + dyPct,
    };

    setLayout((prev) =>
      setFaceField(prev, current.face, current.fieldId, nextField),
    );
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

  useEffect(() => {
    let mounted = true;

    async function loadGlobalLayout() {
      try {
        const remoteLayout = await congressistaService.getCertificadoLayout();
        if (!mounted || !remoteLayout) {
          return;
        }
        const normalized = normalizeCertificadoLayout(remoteLayout);
        setLayout(normalized);
        saveCertificadoLayout(normalized);
      } catch {
        if (mounted) {
          showNotice(
            "Nao foi possivel carregar o layout global. O layout local foi mantido.",
            "warning",
          );
        }
      }
    }

    void loadGlobalLayout();
    return () => {
      mounted = false;
    };
  }, []);

  function switchFace(face: CertificadoFace) {
    setActiveFace(face);
    const opts =
      face === "frente"
        ? CERTIFICADO_FRENTE_FIELD_OPTIONS
        : CERTIFICADO_VERSO_FIELD_OPTIONS;
    setSelected(opts[0]?.id ?? "");
  }

  async function saveLayout() {
    const normalized = normalizeCertificadoLayout(layout);
    saveCertificadoLayout(normalized);
    setIsSavingGlobal(true);

    try {
      await congressistaService.saveCertificadoLayout(normalized);
      setLayout(normalized);
      showNotice("Layout do certificado salvo com sucesso (frente e verso).");
    } catch {
      showNotice(
        "Layout salvo apenas neste dispositivo. Nao foi possivel salvar no servidor.",
        "warning",
      );
    } finally {
      setIsSavingGlobal(false);
    }
  }

  function resetLayout() {
    const normalized = normalizeCertificadoLayout(DEFAULT_CERTIFICADO_LAYOUT);
    setLayout(normalized);
    saveCertificadoLayout(normalized);
    showNotice("Layout redefinido para o padrao (frente e verso).");
  }

  function onImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    if (file.type !== "image/png" && file.type !== "image/jpeg") {
      showNotice("Use uma imagem PNG ou JPEG.", "error");
      return;
    }

    if (file.size > CERTIFICADO_IMAGEM_MAX_BYTES) {
      showNotice(`A imagem deve ter ate ${formatImageLimit()}.`, "error");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      if (
        !result.startsWith("data:image/png;base64,") &&
        !result.startsWith("data:image/jpeg;base64,")
      ) {
        showNotice("Nao foi possivel validar a imagem enviada.", "error");
        return;
      }

      updateImagemBase(result);
      showNotice(
        `Imagem da ${activeFace} carregada. Salve o layout para publicar.`,
      );
    };
    reader.onerror = () => {
      showNotice("Nao foi possivel ler a imagem enviada.", "error");
    };
    reader.readAsDataURL(file);
  }

  const faceImagemBase = getFaceImagemBase(layout, activeFace);

  return (
    <section className="page-container">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            Configuracao do Certificado do Congresso
          </h1>
          <p className="text-sm text-slate-600">
            Configure frente e verso do certificado. Arraste os campos e ajuste
            as medidas.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" className="btn-secondary" onClick={resetLayout}>
            Resetar padrao
          </Button>
          <Button
            type="button"
            className="btn-modern-primary"
            onClick={() => void saveLayout()}
            disabled={isSavingGlobal}
            isLoading={isSavingGlobal}
          >
            Salvar layout
          </Button>
          <Link to="/configuracoes-layout" className="block">
            <Button type="button" className="btn-modern-danger">
              Voltar
            </Button>
          </Link>
        </div>
      </div>

      <div className="mb-4 flex gap-2">
        <button
          type="button"
          className={`rounded-xl border px-4 py-2 text-sm font-bold transition ${
            activeFace === "frente"
              ? "border-sky-600 bg-sky-50 text-sky-800"
              : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
          }`}
          onClick={() => switchFace("frente")}
        >
          Frente
        </button>
        <button
          type="button"
          className={`rounded-xl border px-4 py-2 text-sm font-bold transition ${
            activeFace === "verso"
              ? "border-sky-600 bg-sky-50 text-sky-800"
              : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
          }`}
          onClick={() => switchFace("verso")}
        >
          Verso
        </button>
      </div>

      {notice ? (
        <div
          className={`mb-3 ${
            noticeType === "error"
              ? "alert-error"
              : noticeType === "warning"
                ? "alert-warning"
                : "alert-success"
          }`}
        >
          {notice}
        </div>
      ) : null}

      <div className="certificado-editor-grid">
        <div className="surface-card p-4">
          <CertificadoPreview
            certificado={previewCertificado}
            layout={layout}
            face={activeFace}
            className="certificado-sheet-editor"
            editable
            selectedField={selected}
            onFieldMouseDown={handleFieldMouseDown}
            showGuides
          />
        </div>

        <aside className="surface-card p-4">
          <div className="mb-4 space-y-3">
            <label className="block text-xs font-semibold uppercase text-slate-600">
              Orientacao
              <select
                className="form-input mt-1"
                value={layout.orientacao}
                onChange={(event) =>
                  updateOrientacao(
                    event.target.value === "portrait"
                      ? "portrait"
                      : "landscape",
                  )
                }
              >
                <option value="landscape">Horizontal</option>
                <option value="portrait">Vertical</option>
              </select>
            </label>

            <label className="block text-xs font-semibold uppercase text-slate-600">
              Imagem base ({activeFace})
              <input
                className="form-input mt-1"
                type="file"
                accept="image/png,image/jpeg"
                onChange={onImageChange}
              />
            </label>

            {faceImagemBase ? (
              <Button
                type="button"
                variant="secondary"
                onClick={() => updateImagemBase(null)}
              >
                Remover imagem ({activeFace})
              </Button>
            ) : null}
          </div>

          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-700">
            Campos ({activeFace})
          </h2>
          <div className="space-y-1.5">
            {fieldOptions.map((item) => {
              const itemField = getFaceCampos(layout, activeFace)[item.id];
              const isVisible = itemField?.visible !== false;
              return (
                <button
                  key={item.id}
                  type="button"
                  className={`certificado-editor-field-btn flex w-full items-center justify-between gap-2 ${
                    selected === item.id
                      ? "certificado-editor-field-btn-active"
                      : ""
                  }`}
                  onClick={() => setSelected(item.id)}
                >
                  <span className="truncate text-left">{item.label}</span>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      isVisible
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-slate-100 text-slate-400"
                    }`}
                  >
                    {isVisible ? "Visivel" : "Oculto"}
                  </span>
                </button>
              );
            })}
          </div>

          {currentField ? (
            <div className="mt-4 grid grid-cols-2 gap-2">
              <div
                className={`col-span-2 flex items-center justify-between rounded-xl border-2 px-3 py-2.5 transition ${
                  currentField.visible !== false
                    ? "border-emerald-300 bg-emerald-50"
                    : "border-slate-200 bg-slate-50"
                }`}
              >
                <span className="text-xs font-bold text-slate-700">
                  Exibir este campo no certificado
                </span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={currentField.visible !== false}
                  onClick={() =>
                    updateCurrentField({ visible: currentField.visible === false })
                  }
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none ${
                    currentField.visible !== false
                      ? "bg-emerald-500"
                      : "bg-slate-300"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${
                      currentField.visible !== false ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
              {selected !== "programacaoCongresso" ? (
                <label className="col-span-2 text-xs font-semibold text-slate-600">
                  Texto fixo do campo
                  <textarea
                    className="form-input mt-1 min-h-[72px] resize-y font-mono text-xs"
                    value={currentField.texto ?? ""}
                    onChange={(event) =>
                      updateCurrentField({ texto: event.target.value })
                    }
                    placeholder={
                      selected === "textoCertificado"
                        ? "Certificamos que {NOME_CONGRESSISTA} participou do {NOME_CONGRESSO}..."
                        : selected === "nomeCongressista"
                          ? "CERTIFICADO"
                          : "Texto a exibir (suporta placeholders)"
                    }
                  />
                  <span className="mt-0.5 block text-[10px] font-normal text-slate-400">
                    Se vazio, o valor dinamico padrao sera usado. Suporta placeholders.
                  </span>
                </label>
              ) : null}
              <label className="text-xs font-semibold text-slate-600">
                X (%)
                <input
                  className="form-input mt-1"
                  type="number"
                  step="0.1"
                  value={currentField.x}
                  onChange={(event) =>
                    updateCurrentField({ x: Number(event.target.value) })
                  }
                />
              </label>
              <label className="text-xs font-semibold text-slate-600">
                Y (%)
                <input
                  className="form-input mt-1"
                  type="number"
                  step="0.1"
                  value={currentField.y}
                  onChange={(event) =>
                    updateCurrentField({ y: Number(event.target.value) })
                  }
                />
              </label>
              <label className="text-xs font-semibold text-slate-600">
                Largura (%)
                <input
                  className="form-input mt-1"
                  type="number"
                  step="0.1"
                  value={currentField.w}
                  onChange={(event) =>
                    updateCurrentField({ w: Number(event.target.value) })
                  }
                />
              </label>
              <label className="text-xs font-semibold text-slate-600">
                Altura (%)
                <input
                  className="form-input mt-1"
                  type="number"
                  step="0.1"
                  value={currentField.h}
                  onChange={(event) =>
                    updateCurrentField({ h: Number(event.target.value) })
                  }
                />
              </label>
              <label className="text-xs font-semibold text-slate-600">
                Fonte (cqw)
                <input
                  className="form-input mt-1"
                  type="number"
                  step="0.1"
                  value={currentField.fontSize}
                  onChange={(event) =>
                    updateCurrentField({
                      fontSize: Number(event.target.value),
                    })
                  }
                />
              </label>
              <label className="text-xs font-semibold text-slate-600">
                Peso
                <input
                  className="form-input mt-1"
                  type="number"
                  step="100"
                  value={currentField.fontWeight ?? 500}
                  onChange={(event) =>
                    updateCurrentField({
                      fontWeight: Number(event.target.value),
                    })
                  }
                />
              </label>
              <label className="col-span-2 text-xs font-semibold text-slate-600">
                Alinhamento
                <select
                  className="form-input mt-1"
                  value={currentField.align ?? "left"}
                  onChange={(event) =>
                    updateCurrentField({
                      align:
                        event.target.value === "right"
                          ? "right"
                          : event.target.value === "center"
                            ? "center"
                            : "left",
                    })
                  }
                >
                  <option value="left">Esquerda</option>
                  <option value="center">Centro</option>
                  <option value="right">Direita</option>
                </select>
              </label>
              <div className="col-span-2" />
            </div>
          ) : null}

          {activeFace === "frente" ? (
            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-xs font-bold uppercase text-slate-500">
                Placeholders disponiveis
              </p>
              <p className="mt-1 text-xs text-slate-600">
                Use no campo &quot;Texto do certificado&quot; para dados
                dinamicos. Ative &quot;Negrito&quot; para destacar o valor
                substituido:
              </p>
              <ul className="mt-2 space-y-1.5">
                {CERTIFICADO_PLACEHOLDERS.map((p) => {
                  const isBold = layout.placeholderBold?.[p] ?? false;
                  return (
                    <li
                      key={p}
                      className="flex items-center justify-between gap-2"
                    >
                      <span className="font-mono text-xs text-sky-700">
                        {p}
                      </span>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={isBold}
                        aria-label={`Negrito para ${p}`}
                        onClick={() => updatePlaceholderBold(p, !isBold)}
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus:outline-none ${
                          isBold ? "bg-sky-500" : "bg-slate-300"
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform ${
                            isBold ? "translate-x-4" : "translate-x-0.5"
                          }`}
                        />
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : null}
        </aside>
      </div>
    </section>
  );
}
