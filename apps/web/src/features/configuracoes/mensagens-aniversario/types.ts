export interface MensagemAniversario {
  id: string;
  titulo: string;
  texto: string;
  imagemBase64?: string | null;
  imagemNome?: string | null;
  ativo: boolean;
  criadoEm: string;
  atualizadoEm: string;
}
