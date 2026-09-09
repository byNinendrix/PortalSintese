import { useCallback, useEffect, useRef, useState } from "react";
import type { MensagemAniversario } from "./types";
import {
  createMensagem,
  loadMensagens,
  MENSAGEM_IMAGEM_MAX_BYTES,
  removeMensagem,
  saveMensagens,
  toggleMensagemAtivo,
  updateMensagem,
} from "./mensagemAniversarioStorage";

const ACCEPTED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"];
const PREVIEW_NOME = "Maria Silva";

interface FormState {
  titulo: string;
  texto: string;
  imagemBase64: string | null;
  imagemNome: string | null;
}

const EMPTY_FORM: FormState = {
  titulo: "",
  texto: "",
  imagemBase64: null,
  imagemNome: null,
};

export function MensagensAniversarioPage() {
  const [mensagens, setMensagens] = useState<MensagemAniversario[]>(() => loadMensagens());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [showForm, setShowForm] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    saveMensagens(mensagens);
  }, [mensagens]);

  const resetForm = useCallback(() => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setShowForm(false);
    setErrors([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  function startCreate() {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setShowForm(true);
    setErrors([]);
  }

  function startEdit(msg: MensagemAniversario) {
    setForm({
      titulo: msg.titulo,
      texto: msg.texto,
      imagemBase64: msg.imagemBase64 ?? null,
      imagemNome: msg.imagemNome ?? null,
    });
    setEditingId(msg.id);
    setShowForm(true);
    setErrors([]);
  }

  function validate(): string[] {
    const errs: string[] = [];
    if (!form.titulo.trim()) errs.push("Titulo e obrigatorio.");
    if (!form.texto.trim()) errs.push("Mensagem e obrigatoria.");
    return errs;
  }

  function handleSave() {
    const errs = validate();
    if (errs.length > 0) {
      setErrors(errs);
      return;
    }

    if (editingId) {
      setMensagens((prev) =>
        updateMensagem(prev, editingId, {
          titulo: form.titulo,
          texto: form.texto,
          imagemBase64: form.imagemBase64,
          imagemNome: form.imagemNome,
        }),
      );
    } else {
      const nova = createMensagem({
        titulo: form.titulo,
        texto: form.texto,
        imagemBase64: form.imagemBase64,
        imagemNome: form.imagemNome,
      });
      setMensagens((prev) => [...prev, nova]);
    }

    resetForm();
  }

  function handleRemove(id: string) {
    if (!window.confirm("Tem certeza que deseja remover esta mensagem?")) return;
    setMensagens((prev) => removeMensagem(prev, id));
    if (editingId === id) resetForm();
  }

  function handleToggle(id: string) {
    setMensagens((prev) => toggleMensagemAtivo(prev, id));
  }

  function handleImageChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      setErrors(["Formato de imagem invalido. Aceitos: PNG, JPG, JPEG, WEBP."]);
      event.target.value = "";
      return;
    }

    if (file.size > MENSAGEM_IMAGEM_MAX_BYTES) {
      setErrors(["Imagem muito grande. Tamanho maximo: 2MB."]);
      event.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setForm((prev) => ({
        ...prev,
        imagemBase64: reader.result as string,
        imagemNome: file.name,
      }));
      setErrors([]);
    };
    reader.readAsDataURL(file);
  }

  function handleRemoveImage() {
    setForm((prev) => ({ ...prev, imagemBase64: null, imagemNome: null }));
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function renderPreview(texto: string) {
    return texto.replace(/#NOME#/g, PREVIEW_NOME);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* ─── Header ─── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-100 to-orange-50 text-xl">
            {"\uD83C\uDF82"}
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800">
              Mensagens de aniversario
            </h2>
            <p className="text-xs text-slate-400">
              {mensagens.length === 0
                ? "Nenhuma mensagem cadastrada"
                : `${mensagens.length} mensage${mensagens.length === 1 ? "m" : "ns"} cadastrada${mensagens.length === 1 ? "" : "s"}`}
            </p>
          </div>
        </div>
        {!showForm && (
          <button
            type="button"
            className="btn-modern-primary flex items-center gap-1.5"
            onClick={startCreate}
          >
            <span className="text-base leading-none">+</span>
            Nova mensagem
          </button>
        )}
      </div>

      {/* ─── Formulario ─── */}
      {showForm && (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 px-6 py-4">
            <h3 className="text-sm font-bold text-slate-800">
              {editingId ? "Editar mensagem" : "Nova mensagem"}
            </h3>
            <p className="mt-0.5 text-xs text-slate-400">
              {editingId
                ? "Altere os campos abaixo e salve."
                : "Preencha os campos para criar uma nova mensagem de aniversario."}
            </p>
          </div>

          <div className="space-y-5 px-6 py-5">
            {errors.length > 0 && (
              <div className="alert-error">
                {errors.map((err, i) => (
                  <p key={i}>{err}</p>
                ))}
              </div>
            )}

            <div>
              <label className="form-label">Titulo</label>
              <input
                className="form-input mt-1"
                type="text"
                value={form.titulo}
                onChange={(e) => setForm((prev) => ({ ...prev, titulo: e.target.value }))}
                placeholder="Ex: Aniversario - Mensagem padrao"
                maxLength={120}
              />
            </div>

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              <div className="space-y-3">
                <div>
                  <label className="form-label">Mensagem</label>
                  <textarea
                    className="form-input mt-1 min-h-[160px] resize-y font-mono text-xs leading-relaxed"
                    value={form.texto}
                    onChange={(e) => setForm((prev) => ({ ...prev, texto: e.target.value }))}
                    placeholder={"Parabens, #NOME#!\nHoje e seu aniversario e o SINTESE deseja muita saude, alegria e conquistas."}
                    maxLength={2000}
                  />
                </div>

                <div className="rounded-xl border border-sky-200/80 bg-gradient-to-br from-sky-50 to-blue-50 px-4 py-3">
                  <p className="flex items-center gap-1.5 text-xs font-bold text-sky-800">
                    <span className="text-sm">{"\uD83D\uDCA1"}</span> Variaveis disponiveis
                  </p>
                  <div className="mt-2 inline-block rounded-lg bg-white/80 px-2.5 py-1 font-mono text-xs font-bold text-sky-700 shadow-sm">
                    #NOME#
                  </div>
                  <p className="mt-2 text-[11px] leading-relaxed text-sky-600">
                    Use <span className="font-mono font-bold">#NOME#</span> no texto para inserir automaticamente o nome do aniversariante.
                  </p>
                </div>
              </div>

              {form.texto.trim() ? (
                <div>
                  <p className="form-label">Preview da mensagem</p>
                  <div className="mt-1 rounded-xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50 to-green-50 p-4">
                    <div className="mb-2 flex items-center gap-1.5">
                      <span className="text-xs">{"\uD83D\uDC41\uFE0F"}</span>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">
                        Visualizacao
                      </span>
                    </div>
                    <div className="rounded-lg bg-white/90 px-4 py-3 shadow-sm">
                      <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
                        {renderPreview(form.texto)}
                      </p>
                      {form.imagemBase64 && (
                        <img
                          src={form.imagemBase64}
                          alt="Anexo"
                          className="mt-3 max-h-32 rounded-lg border border-slate-200 object-cover"
                        />
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center rounded-xl border-2 border-dashed border-slate-200 p-6">
                  <p className="text-center text-xs text-slate-400">
                    Digite a mensagem ao lado para ver o preview aqui.
                  </p>
                </div>
              )}
            </div>

            <div>
              <label className="form-label">Anexo de imagem (opcional)</label>
              <div className="mt-1 rounded-xl border border-slate-200 bg-slate-50 p-3">
                <input
                  ref={fileInputRef}
                  className="block w-full text-xs text-slate-500 file:mr-3 file:rounded-lg file:border-0 file:bg-sky-50 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-sky-700 hover:file:bg-sky-100"
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleImageChange}
                />
                <p className="mt-1.5 text-[10px] text-slate-400">
                  Formatos aceitos: PNG, JPG, JPEG ou WEBP. Tamanho maximo: 2MB.
                </p>
              </div>
              {form.imagemBase64 && (
                <div className="mt-3 flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-3">
                  <img
                    src={form.imagemBase64}
                    alt="Preview do anexo"
                    className="h-14 w-14 rounded-lg border border-slate-100 object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium text-slate-600">{form.imagemNome}</p>
                    <button
                      type="button"
                      className="mt-1 text-[11px] font-semibold text-rose-600 hover:text-rose-700"
                      onClick={handleRemoveImage}
                    >
                      Remover anexo
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-2 border-t border-slate-100 px-6 py-4">
            <button type="button" className="btn-modern-primary" onClick={handleSave}>
              {editingId ? "Salvar alteracoes" : "Criar mensagem"}
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={resetForm}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* ─── Estado vazio ─── */}
      {mensagens.length === 0 && !showForm && (
        <div className="rounded-2xl border-2 border-dashed border-slate-200 px-6 py-16 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 text-3xl">
            {"\uD83C\uDF82"}
          </div>
          <p className="text-sm font-semibold text-slate-600">
            Nenhuma mensagem de aniversario cadastrada
          </p>
          <p className="mx-auto mt-1 max-w-xs text-xs text-slate-400">
            Crie mensagens personalizadas que serao enviadas aos aniversariantes via WhatsApp.
          </p>
          <button
            type="button"
            className="btn-modern-primary mt-5"
            onClick={startCreate}
          >
            Criar primeira mensagem
          </button>
        </div>
      )}

      {/* ─── Lista de mensagens ─── */}
      {mensagens.length > 0 && (
        <div className="space-y-3">
          {mensagens.map((msg) => (
            <div
              key={msg.id}
              className={`rounded-xl border bg-white shadow-sm transition duration-200 ${
                !msg.ativo
                  ? "border-slate-100 opacity-60"
                  : "border-slate-200 hover:shadow-md"
              }`}
            >
              <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-start">
                {msg.imagemBase64 && (
                  <img
                    src={msg.imagemBase64}
                    alt="Anexo"
                    className="h-14 w-14 shrink-0 rounded-lg border border-slate-100 object-cover"
                  />
                )}

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="truncate text-sm font-bold text-slate-800">
                      {msg.titulo}
                    </h4>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        msg.ativo
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-slate-100 text-slate-400"
                      }`}
                    >
                      {msg.ativo ? "Ativo" : "Inativo"}
                    </span>
                  </div>
                  <p className="mt-1.5 line-clamp-2 whitespace-pre-wrap text-xs leading-relaxed text-slate-500">
                    {renderPreview(msg.texto)}
                  </p>
                  {msg.imagemNome && !msg.imagemBase64 && (
                    <p className="mt-1 text-[10px] text-slate-400">
                      Anexo: {msg.imagemNome}
                    </p>
                  )}
                </div>

                <div className="flex shrink-0 items-center gap-1.5 sm:ml-2">
                  <button
                    type="button"
                    className={`rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition ${
                      msg.ativo
                        ? "border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100"
                        : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                    }`}
                    onClick={() => handleToggle(msg.id)}
                  >
                    {msg.ativo ? "Desativar" : "Ativar"}
                  </button>
                  <button
                    type="button"
                    className="rounded-lg border border-sky-200 bg-sky-50 px-2.5 py-1.5 text-xs font-semibold text-sky-700 transition hover:bg-sky-100"
                    onClick={() => startEdit(msg)}
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    className="rounded-lg border border-rose-200 bg-rose-50 px-2.5 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
                    onClick={() => handleRemove(msg.id)}
                  >
                    Remover
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
