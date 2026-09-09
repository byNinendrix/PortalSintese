import type { MensagemAniversario } from "./types";

const STORAGE_KEY = "portal_sintese_mensagens_aniversario_v1";

export const MENSAGEM_IMAGEM_MAX_BYTES = 2 * 1024 * 1024;

export function loadMensagens(): MensagemAniversario[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

export function saveMensagens(mensagens: MensagemAniversario[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(mensagens));
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function createMensagem(
  data: Pick<MensagemAniversario, "titulo" | "texto" | "imagemBase64" | "imagemNome">,
): MensagemAniversario {
  const now = new Date().toISOString();
  return {
    id: generateId(),
    titulo: data.titulo.trim(),
    texto: data.texto.trim(),
    imagemBase64: data.imagemBase64 ?? null,
    imagemNome: data.imagemNome ?? null,
    ativo: true,
    criadoEm: now,
    atualizadoEm: now,
  };
}

export function updateMensagem(
  mensagens: MensagemAniversario[],
  id: string,
  data: Partial<Pick<MensagemAniversario, "titulo" | "texto" | "imagemBase64" | "imagemNome" | "ativo">>,
): MensagemAniversario[] {
  return mensagens.map((m) => {
    if (m.id !== id) return m;
    return {
      ...m,
      ...data,
      titulo: data.titulo !== undefined ? data.titulo.trim() : m.titulo,
      texto: data.texto !== undefined ? data.texto.trim() : m.texto,
      atualizadoEm: new Date().toISOString(),
    };
  });
}

export function removeMensagem(
  mensagens: MensagemAniversario[],
  id: string,
): MensagemAniversario[] {
  return mensagens.filter((m) => m.id !== id);
}

export function toggleMensagemAtivo(
  mensagens: MensagemAniversario[],
  id: string,
): MensagemAniversario[] {
  return mensagens.map((m) => {
    if (m.id !== id) return m;
    return { ...m, ativo: !m.ativo, atualizadoEm: new Date().toISOString() };
  });
}
