import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { Link } from "react-router-dom";
import { createPortal } from "react-dom";
import { Button } from "@sintese/ui";
import { readAuthSession } from "../../auth/services/authSession";
import { digitsOnly, formatCpf, formatPhoneBr } from "../../../shared/utils/masks";
import { ApiRequestError } from "../../../shared/services/apiClient";
import {
  useAtualizarDadosMutation,
  useAtualizarDadosLookupsQuery,
  useAtualizarDadosPessoaQuery
} from "../hooks/useAtualizarMeusDadosQueries";
import type { AtualizarDadosPessoaResponse, LookupOption, UpdateUserDataRequest } from "@sintese/types";
type AtualizarDadosFormData = {
  sangue: string;
  rg: string;
  dataExpRg: string;
  rgOrgao: string;
  rgUf: string;
  nome: string;
  nomeSocial: string;
  dataNascimento: string;
  sexo: string;
  especificarGenero: string;
  orientacaoSexual: string;
  estadoCivil: string;
  raca: string;
  mae: string;
  pai: string;
  telefone: string;
  celular: string;
  celularIi: string;
  cepAcr: string;
  enderecoAcr: string;
  numeroAcr: string;
  bairroAcr: string;
  complementoAcr: string;
  estadoAcr: string;
  cidadeAcr: string;
};

function formatDateToInput(value: string | null): string {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toISOString().slice(0, 10);
}

function formatCep(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 5) {
    return digits;
  }
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

function withCurrentOption(options: LookupOption[], currentValue: string): LookupOption[] {
  const value = currentValue.trim();
  if (!value) {
    return options;
  }

  const alreadyExists = options.some((option) => option.value === value);
  if (alreadyExists) {
    return options;
  }

  return [{ value, label: value }, ...options];
}
function buildFormData(pessoa: AtualizarDadosPessoaResponse | undefined): AtualizarDadosFormData {
  return {
    sangue: pessoa?.sangueTpRh?.trim() || pessoa?.fatorHr?.trim() || "",
    rg: pessoa?.rg ?? "",
    dataExpRg: formatDateToInput(pessoa?.dataExpRg ?? null),
    rgOrgao: pessoa?.rgOrgao ?? "",
    rgUf: pessoa?.rgUf ?? "",
    nome: pessoa?.nome ?? "",
    nomeSocial: pessoa?.nomeSocial ?? "",
    dataNascimento: formatDateToInput(pessoa?.dataNascimento ?? null),
    sexo: pessoa?.sexo ?? "",
    especificarGenero: pessoa?.especificarGenero ?? "",
    orientacaoSexual: pessoa?.orientacaoSexual ?? "",
    estadoCivil: pessoa?.estadoCivil ?? "",
    raca: pessoa?.raca ?? "",
    mae: pessoa?.mae ?? "",
    pai: pessoa?.pai ?? "",
    telefone: formatPhoneBr(pessoa?.telefone ?? ""),
    celular: formatPhoneBr(pessoa?.celular ?? ""),
    celularIi: formatPhoneBr(pessoa?.celularIi ?? ""),
    cepAcr: formatCep(pessoa?.cepAcr ?? ""),
    enderecoAcr: pessoa?.enderecoAcr ?? "",
    numeroAcr: pessoa?.numeroAcr ?? "",
    bairroAcr: pessoa?.bairroAcr ?? "",
    complementoAcr: pessoa?.complementoAcr ?? "",
    estadoAcr: pessoa?.estadoAcr ?? "",
    cidadeAcr: pessoa?.cidadeAcr ?? ""
  };
}

function areFormDataEqual(a: AtualizarDadosFormData, b: AtualizarDadosFormData): boolean {
  return (
    a.sangue === b.sangue &&
    a.rg === b.rg &&
    a.dataExpRg === b.dataExpRg &&
    a.rgOrgao === b.rgOrgao &&
    a.rgUf === b.rgUf &&
    a.nome === b.nome &&
    a.nomeSocial === b.nomeSocial &&
    a.dataNascimento === b.dataNascimento &&
    a.sexo === b.sexo &&
    a.especificarGenero === b.especificarGenero &&
    a.orientacaoSexual === b.orientacaoSexual &&
    a.estadoCivil === b.estadoCivil &&
    a.raca === b.raca &&
    a.mae === b.mae &&
    a.pai === b.pai &&
    a.telefone === b.telefone &&
    a.celular === b.celular &&
    a.celularIi === b.celularIi &&
    a.cepAcr === b.cepAcr &&
    a.enderecoAcr === b.enderecoAcr &&
    a.numeroAcr === b.numeroAcr &&
    a.bairroAcr === b.bairroAcr &&
    a.complementoAcr === b.complementoAcr &&
    a.estadoAcr === b.estadoAcr &&
    a.cidadeAcr === b.cidadeAcr
  );
}

async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("Não foi possível processar a imagem selecionada."));
    reader.readAsDataURL(file);
  });
}

export function AtualizarMeusDadosPage() {
  const session = readAuthSession();
  const cpfDigits = useMemo(() => digitsOnly(session?.cpf ?? ""), [session?.cpf]);

  const pessoaQuery = useAtualizarDadosPessoaQuery(cpfDigits, Boolean(cpfDigits));
  const pessoa = pessoaQuery.data;
  const photoInputRef = useRef<HTMLInputElement>(null);
  const objectUrlRef = useRef<string | null>(null);
  const [initialFormData, setInitialFormData] = useState<AtualizarDadosFormData>(() => buildFormData(undefined));
  const [formData, setFormData] = useState<AtualizarDadosFormData>(() => buildFormData(undefined));
  const [initialPhotoUrl, setInitialPhotoUrl] = useState<string | null>(null);
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | null>(null);
  const [selectedPhotoFile, setSelectedPhotoFile] = useState<File | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [photoLoadError, setPhotoLoadError] = useState(false);
  const [isCepLookupLoading, setIsCepLookupLoading] = useState(false);
  const [cepLookupFeedback, setCepLookupFeedback] = useState<{ type: "success" | "error"; message: string } | null>(
    null
  );
  const [saveFeedback, setSaveFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [addressChangeConfirmModal, setAddressChangeConfirmModal] = useState<{
    message: string;
    resolve: (confirmed: boolean) => void;
  } | null>(null);
  const updateMutation = useAtualizarDadosMutation(cpfDigits);

  useEffect(() => {
    return () => {
      if (addressChangeConfirmModal) {
        addressChangeConfirmModal.resolve(false);
      }
    };
  }, [addressChangeConfirmModal]);

  useEffect(() => {
    if (!pessoa) {
      return;
    }

    const nextFormData = buildFormData(pessoa);
    if (objectUrlRef.current?.startsWith("blob:")) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    const persistedPhotoUrl = pessoa.fotoPerfilUrl ?? null;
    setInitialFormData(nextFormData);
    setFormData(nextFormData);
    setInitialPhotoUrl(persistedPhotoUrl);
    setPhotoPreviewUrl(persistedPhotoUrl);
    setSelectedPhotoFile(null);
    setPhotoError(null);
    setPhotoLoadError(false);
    setCepLookupFeedback(null);
  }, [pessoa]);

  useEffect(() => {
    return () => {
      if (objectUrlRef.current?.startsWith("blob:")) {
        URL.revokeObjectURL(objectUrlRef.current);
      }
    };
  }, []);

  function setField<K extends keyof AtualizarDadosFormData>(field: K, value: AtualizarDadosFormData[K]) {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setSaveFeedback(null);
    setCepLookupFeedback(null);
  }

  function openPhotoPicker() {
    photoInputRef.current?.click();
  }

  function onPhotoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setPhotoError("Selecione um arquivo de imagem válido (JPG, PNG ou WEBP).");
      event.target.value = "";
      return;
    }

    const maxSizeInBytes = 5 * 1024 * 1024;
    if (file.size > maxSizeInBytes) {
      setPhotoError("A imagem deve ter no máximo 5 MB.");
      event.target.value = "";
      return;
    }

    if (objectUrlRef.current?.startsWith("blob:")) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }

    const previewUrl = URL.createObjectURL(file);
    objectUrlRef.current = previewUrl;
    setPhotoPreviewUrl(previewUrl);
    setSelectedPhotoFile(file);
    setPhotoError(null);
    setPhotoLoadError(false);
    setSaveFeedback(null);
  }

  async function handleLookupCep() {
    const cepDigits = formData.cepAcr.replace(/\D/g, "");
    if (cepDigits.length !== 8) {
      setCepLookupFeedback({ type: "error", message: "Informe um CEP válido com 8 dígitos." });
      const cepInput = document.getElementById("dados-cep") as HTMLElement | null;
      cepInput?.focus();
      return;
    }

    try {
      setIsCepLookupLoading(true);
      setCepLookupFeedback(null);

      const response = await fetch(`https://viacep.com.br/ws/${cepDigits}/json/`);
      if (!response.ok) {
        throw new Error("Não foi possível consultar o CEP no momento.");
      }

      const data = (await response.json()) as {
        erro?: boolean;
        logradouro?: string;
        complemento?: string;
        bairro?: string;
        localidade?: string;
        uf?: string;
      };

      if (data.erro) {
        throw new Error("CEP não encontrado.");
      }

      setFormData((prev) => ({
        ...prev,
        enderecoAcr: data.logradouro?.trim() || prev.enderecoAcr,
        complementoAcr: data.complemento?.trim() || prev.complementoAcr,
        bairroAcr: data.bairro?.trim() || prev.bairroAcr,
        cidadeAcr: data.localidade?.trim() || prev.cidadeAcr,
        estadoAcr: data.uf?.trim().toUpperCase() || prev.estadoAcr
      }));
      setSaveFeedback(null);
      setCepLookupFeedback({ type: "success", message: "CEP localizado e campos preenchidos automaticamente." });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha ao consultar CEP.";
      setCepLookupFeedback({ type: "error", message });
    } finally {
      setIsCepLookupLoading(false);
    }
  }

  const ufCidade = useMemo(() => (formData.estadoAcr.trim().toUpperCase() || "SE"), [formData.estadoAcr]);
  const lookupsQuery = useAtualizarDadosLookupsQuery(ufCidade, Boolean(cpfDigits));
  const lookups = lookupsQuery.data;

  const fatoresSanguineosOptions = withCurrentOption(lookups?.fatoresSanguineos ?? [], formData.sangue);
  const ufOptions = withCurrentOption(lookups?.ufs ?? [], formData.estadoAcr.trim());
  const sexoOptions = withCurrentOption(lookups?.generos ?? [], formData.sexo.trim());
  const estadoCivilOptions = withCurrentOption(lookups?.estadosCivis ?? [], formData.estadoCivil.trim());
  const racaOptions = withCurrentOption(lookups?.racas ?? [], formData.raca.trim());
  const cidadeOptions = withCurrentOption(
    (lookups?.cidades ?? []).map((item) => ({ value: item.value, label: item.label })),
    formData.cidadeAcr.trim()
  );
  const hasPhotoChanges = useMemo(() => {
    if (selectedPhotoFile) {
      return true;
    }
    return (photoPreviewUrl ?? "") !== (initialPhotoUrl ?? "");
  }, [selectedPhotoFile, photoPreviewUrl, initialPhotoUrl]);
  const hasFormChanges = useMemo(() => !areFormDataEqual(formData, initialFormData), [formData, initialFormData]);
  const canSaveChanges = Boolean(cpfDigits) && !pessoaQuery.isLoading && (hasFormChanges || hasPhotoChanges);

  function validateRequiredFields(): boolean {
    const requiredFields = [
      { id: "dados-nome", label: "Nome Completo", value: formData.nome },
      { id: "dados-endereco", label: "Endereço", value: formData.enderecoAcr },
      { id: "dados-numero", label: "Número", value: formData.numeroAcr },
      { id: "dados-bairro", label: "Bairro", value: formData.bairroAcr },
      { id: "dados-uf", label: "UF", value: formData.estadoAcr },
      { id: "dados-cidade", label: "Cidade", value: formData.cidadeAcr }
    ];

    const missingField = requiredFields.find((field) => field.value.trim().length === 0);
    if (!missingField) {
      return true;
    }

    const target = document.getElementById(missingField.id) as HTMLElement | null;
    target?.focus();
    setSaveFeedback({
      type: "error",
      message: `Preencha o campo obrigatório: ${missingField.label}.`
    });
    return false;
  }

  async function handleSaveChanges() {
    setSaveFeedback(null);

    if (!canSaveChanges) {
      return;
    }

    if (!validateRequiredFields()) {
      return;
    }

    const applySuccessResult = (message: string) => {
      setInitialFormData(formData);
      setInitialPhotoUrl(photoPreviewUrl);
      setSelectedPhotoFile(null);
      if (photoInputRef.current) {
        photoInputRef.current.value = "";
      }
      setSaveFeedback({ type: "success", message });
    };

    const payloadBase: UpdateUserDataRequest = {
      cpf: cpfDigits,
      nome: formData.nome,
      sangueTpRh: formData.sangue,
      rg: formData.rg,
      dataExpRg: formData.dataExpRg,
      rgOrgao: formData.rgOrgao,
      rgUf: formData.rgUf,
      nomeSocial: formData.nomeSocial,
      dataNascimento: formData.dataNascimento,
      sexo: formData.sexo,
      especificarGenero: formData.especificarGenero,
      orientacaoSexual: formData.orientacaoSexual,
      estadoCivil: formData.estadoCivil,
      raca: formData.raca,
      mae: formData.mae,
      pai: formData.pai,
      telefone: formData.telefone,
      celular: formData.celular,
      celularIi: formData.celularIi,
      cepAcr: formData.cepAcr,
      enderecoAcr: formData.enderecoAcr,
      numeroAcr: formData.numeroAcr,
      bairroAcr: formData.bairroAcr,
      complementoAcr: formData.complementoAcr,
      estadoAcr: formData.estadoAcr,
      cidadeAcr: formData.cidadeAcr
    };

    try {
      payloadBase.fotoPerfilBase64 = selectedPhotoFile ? await fileToDataUrl(selectedPhotoFile) : undefined;
      const result = await updateMutation.mutateAsync(payloadBase);
      applySuccessResult(result.message);
    } catch (error) {
      if (
        error instanceof ApiRequestError &&
        error.status === 409 &&
        error.code === "ENDERECO_SOLICITACAO_PENDENTE"
      ) {
        const confirmarSubstituicao = await new Promise<boolean>((resolve) => {
          setAddressChangeConfirmModal({
            message: error.message,
            resolve
          });
        });

        if (!confirmarSubstituicao) {
          setSaveFeedback({
            type: "error",
            message: "Solicitação atual de alteração de endereço mantida. Nenhuma substituição foi realizada."
          });
          return;
        }

        try {
          const result = await updateMutation.mutateAsync({
            ...payloadBase,
            confirmarSubstituicaoSolicitacaoEndereco: true
          });
          applySuccessResult(result.message);
        } catch (replacementError) {
          const message =
            replacementError instanceof Error ? replacementError.message : "Não foi possível salvar os dados.";
          setSaveFeedback({ type: "error", message });
        }

        return;
      }

      const message = error instanceof Error ? error.message : "Não foi possível salvar os dados.";
      setSaveFeedback({ type: "error", message });
    }
  }

  const editableFieldClass =
    "w-full rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-2 text-base text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100";
  const editableFieldStrongClass =
    "w-full rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-2 text-base font-semibold text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100";
  const lockedFieldClass =
    "w-full rounded-xl border border-slate-300 bg-slate-100 px-3 py-2 text-base text-slate-700 outline-none";
  const lockedFieldStrongClass =
    "w-full rounded-xl border border-slate-300 bg-slate-100 px-3 py-2 text-base font-medium text-slate-700 outline-none";
  const addressChangeModalElement =
    addressChangeConfirmModal && typeof document !== "undefined"
      ? createPortal(
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/55 px-4">
            <div className="w-full max-w-[520px] rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_24px_64px_rgba(2,6,23,0.35)]">
              <h3 className="text-lg font-extrabold text-slate-900">Substituir solicitação de endereço?</h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-700">{addressChangeConfirmModal.message}</p>
              <p className="mt-2 text-sm font-semibold text-amber-700">
                Ao substituir, o prazo de análise será reiniciado.
              </p>
              <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2">
                <Button
                  type="button"
                  className="btn-modern-danger w-full"
                  onClick={() => {
                    addressChangeConfirmModal.resolve(true);
                    setAddressChangeConfirmModal(null);
                  }}
                >
                  Sim, substituir
                </Button>
                <Button
                  type="button"
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2 font-bold text-slate-700 transition hover:bg-slate-50"
                  onClick={() => {
                    addressChangeConfirmModal.resolve(false);
                    setAddressChangeConfirmModal(null);
                  }}
                >
                  Não, manter atual
                </Button>
              </div>
            </div>
          </div>,
          document.body
        )
      : null;

  return (
    <section className="auth-card-modern mx-auto w-full max-w-[680px]">
      <div className="mb-4 flex justify-center px-3 sm:px-4">
        <img
          src="/logo-sintese-oficial.png"
          alt="Logo SINTESE"
          className="block h-auto object-contain"
          style={{ width: "320px", maxWidth: "100%" }}
        />
      </div>

      <p className="mb-3 text-center text-sm font-semibold text-red-600">
        Todos os campos com * são obrigatórios para atualização.
      </p>
      <p className="mb-3 rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-2 text-center text-xs font-semibold text-emerald-800">
        Campos em verde podem ser editados. CPF e E-mail são bloqueados.
      </p>

      <h1 className="section-title mb-4">Atualizar Meus Dados</h1>

      {!cpfDigits ? <div className="alert-error mb-3">Sessão inválida. Faça login novamente.</div> : null}
      {pessoaQuery.isError ? <div className="alert-error mb-3">Não foi possível carregar os dados da pessoa.</div> : null}
      {lookupsQuery.isError ? <div className="alert-error mb-3">Não foi possível carregar as listas da tela.</div> : null}

      <article className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="section-title mb-4">Foto Perfil</h2>
        <div className="flex justify-center">
          <div className="w-full max-w-[280px] overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 shadow-sm">
            {photoPreviewUrl && !photoLoadError ? (
              <img
                src={photoPreviewUrl}
                alt="Foto de perfil do filiado"
                className="h-[260px] w-full object-cover"
                onError={() => setPhotoLoadError(true)}
              />
            ) : (
              <div className="flex h-[260px] w-full items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 text-sm font-semibold text-slate-500">
                Foto não disponível
              </div>
            )}
          </div>
        </div>
        <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={onPhotoChange} />
        <div className="mt-3 flex flex-wrap justify-center gap-2">
          <Button type="button" className="btn-modern-danger px-4 py-2" onClick={openPhotoPicker}>
            Alterar foto
          </Button>
        </div>
        {photoError ? <p className="mt-2 text-center text-xs font-semibold text-red-600">{photoError}</p> : null}
        <p className="mt-2 text-center text-xs text-slate-500">Formatos aceitos: JPG, PNG ou WEBP. Tamanho máximo: 5 MB.</p>
        <p className="mt-3 text-center text-xs font-semibold text-red-600">
          Sua foto de perfil será incorporada à sua carteirinha.
        </p>
      </article>

      <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="section-title mb-4">Dados Pessoais</h2>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="dados-cpf" className="mb-1 block text-sm text-slate-900">
              CPF
            </label>
            <input
              id="dados-cpf"
              value={pessoa?.cpf ? formatCpf(pessoa.cpf) : formatCpf(cpfDigits)}
              readOnly
              className={lockedFieldStrongClass}
            />
          </div>

          <div>
            <label htmlFor="dados-sangue" className="mb-1 block text-sm text-slate-900">
              Tipo/Fator Sanguíneo
            </label>
            <select
              id="dados-sangue"
              value={formData.sangue}
              onChange={(event) => setField("sangue", event.target.value)}
              className={editableFieldClass}
            >
              <option value="">Selecione</option>
              {fatoresSanguineosOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="dados-rg" className="mb-1 block text-sm text-slate-900">
              RG
            </label>
            <input
              id="dados-rg"
              value={formData.rg}
              onChange={(event) => setField("rg", event.target.value)}
              className={editableFieldClass}
            />
          </div>

          <div>
            <label htmlFor="dados-data-exp" className="mb-1 block text-sm text-slate-900">
              Data Expedição
            </label>
            <input
              id="dados-data-exp"
              type="date"
              value={formData.dataExpRg}
              onChange={(event) => setField("dataExpRg", event.target.value)}
              className={editableFieldClass}
            />
          </div>

          <div>
            <label htmlFor="dados-orgao" className="mb-1 block text-sm text-slate-900">
              Órgão
            </label>
            <input
              id="dados-orgao"
              value={formData.rgOrgao}
              onChange={(event) => setField("rgOrgao", event.target.value)}
              className={editableFieldClass}
            />
          </div>

          <div>
            <label htmlFor="dados-rg-uf" className="mb-1 block text-sm text-slate-900">
              UF RG
            </label>
            <input
              id="dados-rg-uf"
              value={formData.rgUf}
              onChange={(event) => setField("rgUf", event.target.value)}
              className={editableFieldClass}
            />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="dados-nome" className="mb-1 block text-sm text-slate-900">
              Nome Completo *
            </label>
            <input
              id="dados-nome"
              value={formData.nome}
              onChange={(event) => setField("nome", event.target.value)}
              className={editableFieldStrongClass}
            />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="dados-nome-social" className="mb-1 block text-sm text-slate-900">
              Nome Social
            </label>
            <input
              id="dados-nome-social"
              value={formData.nomeSocial}
              onChange={(event) => setField("nomeSocial", event.target.value)}
              className={editableFieldClass}
            />
          </div>

          <div>
            <label htmlFor="dados-nascimento" className="mb-1 block text-sm text-slate-900">
              Data Nascimento
            </label>
            <input
              id="dados-nascimento"
              type="date"
              value={formData.dataNascimento}
              onChange={(event) => setField("dataNascimento", event.target.value)}
              className={editableFieldClass}
            />
          </div>

          <div>
            <label htmlFor="dados-sexo" className="mb-1 block text-sm text-slate-900">
              Sexo
            </label>
            <select
              id="dados-sexo"
              value={formData.sexo}
              onChange={(event) => setField("sexo", event.target.value)}
              className={editableFieldClass}
            >
              <option value="">Selecione</option>
              {sexoOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="dados-especificar-genero" className="mb-1 block text-sm text-slate-900">
              Especificar Gênero
            </label>
            <input
              id="dados-especificar-genero"
              value={formData.especificarGenero}
              onChange={(event) => setField("especificarGenero", event.target.value)}
              className={editableFieldClass}
            />
          </div>

          <div>
            <label htmlFor="dados-orientacao" className="mb-1 block text-sm text-slate-900">
              Orientação Sexual
            </label>
            <input
              id="dados-orientacao"
              value={formData.orientacaoSexual}
              onChange={(event) => setField("orientacaoSexual", event.target.value)}
              className={editableFieldClass}
            />
          </div>

          <div>
            <label htmlFor="dados-estado-civil" className="mb-1 block text-sm text-slate-900">
              Estado Civil
            </label>
            <select
              id="dados-estado-civil"
              value={formData.estadoCivil}
              onChange={(event) => setField("estadoCivil", event.target.value)}
              className={editableFieldClass}
            >
              <option value="">Selecione</option>
              {estadoCivilOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="dados-raca" className="mb-1 block text-sm text-slate-900">
              Raça/Etínia
            </label>
            <select
              id="dados-raca"
              value={formData.raca}
              onChange={(event) => setField("raca", event.target.value)}
              className={editableFieldClass}
            >
              <option value="">Selecione</option>
              {racaOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="dados-mae" className="mb-1 block text-sm text-slate-900">
              Mãe
            </label>
            <input
              id="dados-mae"
              value={formData.mae}
              onChange={(event) => setField("mae", event.target.value)}
              className={editableFieldClass}
            />
          </div>

          <div>
            <label htmlFor="dados-pai" className="mb-1 block text-sm text-slate-900">
              Pai
            </label>
            <input
              id="dados-pai"
              value={formData.pai}
              onChange={(event) => setField("pai", event.target.value)}
              className={editableFieldClass}
            />
          </div>
        </div>
      </article>

      <article className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="section-title mb-4">Dados Adicionais</h2>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="dados-email" className="mb-1 block text-sm text-slate-900">
              E-mail
            </label>
            <input
              id="dados-email"
              value={pessoa?.email ?? ""}
              readOnly
              className={lockedFieldClass}
            />
          </div>

          <div>
            <label htmlFor="dados-telefone" className="mb-1 block text-sm text-slate-900">
              Telefone
            </label>
            <input
              id="dados-telefone"
              value={formData.telefone}
              onChange={(event) => setField("telefone", formatPhoneBr(event.target.value))}
              className={editableFieldClass}
            />
          </div>

          <div>
            <label htmlFor="dados-celular" className="mb-1 block text-sm text-slate-900">
              Celular/WhatsApp
            </label>
            <input
              id="dados-celular"
              value={formData.celular}
              onChange={(event) => setField("celular", formatPhoneBr(event.target.value))}
              className={editableFieldClass}
            />
          </div>

          <div>
            <label htmlFor="dados-celular2" className="mb-1 block text-sm text-slate-900">
              Celular II
            </label>
            <input
              id="dados-celular2"
              value={formData.celularIi}
              onChange={(event) => setField("celularIi", formatPhoneBr(event.target.value))}
              className={editableFieldClass}
            />
          </div>

          <div>
            <label htmlFor="dados-cep" className="mb-1 block text-sm text-slate-900">
              CEP
            </label>
            <input
              id="dados-cep"
              value={formData.cepAcr}
              onChange={(event) => setField("cepAcr", formatCep(event.target.value))}
              className={editableFieldClass}
            />
          </div>

          <div className="sm:col-span-2">
            <Button
              type="button"
              className="btn-modern-danger w-full rounded-xl py-2 text-base font-bold"
              onClick={handleLookupCep}
              isLoading={isCepLookupLoading}
              disabled={isCepLookupLoading}
            >
              Consultar CEP
            </Button>
            {cepLookupFeedback ? (
              <p
                className={`mt-2 text-center text-xs font-semibold ${
                  cepLookupFeedback.type === "success" ? "text-emerald-700" : "text-red-600"
                }`}
              >
                {cepLookupFeedback.message}
              </p>
            ) : null}
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="dados-endereco" className="mb-1 block text-sm text-slate-900">
              Endereço *
            </label>
            <input
              id="dados-endereco"
              value={formData.enderecoAcr}
              onChange={(event) => setField("enderecoAcr", event.target.value)}
              className={editableFieldClass}
            />
          </div>

          <div>
            <label htmlFor="dados-numero" className="mb-1 block text-sm text-slate-900">
              Número *
            </label>
            <input
              id="dados-numero"
              value={formData.numeroAcr}
              onChange={(event) => setField("numeroAcr", event.target.value)}
              className={editableFieldClass}
            />
          </div>

          <div>
            <label htmlFor="dados-bairro" className="mb-1 block text-sm text-slate-900">
              Bairro *
            </label>
            <input
              id="dados-bairro"
              value={formData.bairroAcr}
              onChange={(event) => setField("bairroAcr", event.target.value)}
              className={editableFieldClass}
            />
          </div>

          <div>
            <label htmlFor="dados-complemento" className="mb-1 block text-sm text-slate-900">
              Complemento
            </label>
            <input
              id="dados-complemento"
              value={formData.complementoAcr}
              onChange={(event) => setField("complementoAcr", event.target.value)}
              className={editableFieldClass}
            />
          </div>

          <div>
            <label htmlFor="dados-uf" className="mb-1 block text-sm text-slate-900">
              UF *
            </label>
            <select
              id="dados-uf"
              value={formData.estadoAcr}
              onChange={(event) => setField("estadoAcr", event.target.value)}
              className={editableFieldClass}
            >
              <option value="">Selecione</option>
              {ufOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="dados-cidade" className="mb-1 block text-sm text-slate-900">
              Cidade *
            </label>
            <select
              id="dados-cidade"
              value={formData.cidadeAcr}
              onChange={(event) => setField("cidadeAcr", event.target.value)}
              className={editableFieldClass}
            >
              <option value="">Selecione</option>
              {cidadeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </article>

      <p className="mt-4 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-semibold leading-relaxed text-amber-900">
        Importante: alterações em dados de endereço (CEP, endereço, número, bairro, complemento, UF e cidade)
        passarão por análise da equipe responsável antes da confirmação final. O prazo de análise é de até 72 horas
        úteis (não conta finais de semana nem feriados), para garantir a segurança cadastral e manter o contato
        correto com a entidade.
      </p>

      {saveFeedback ? (
        <div
          className={`${saveFeedback.type === "success" ? "alert-success" : "alert-error"} mt-3`}
          role="status"
          aria-live="polite"
        >
          {saveFeedback.message}
        </div>
      ) : null}

      <div className="mt-4 grid grid-cols-1 gap-2">
        <Button
          type="button"
          className="btn-modern-danger w-full"
          disabled={!canSaveChanges || updateMutation.isPending}
          isLoading={updateMutation.isPending}
          onClick={handleSaveChanges}
        >
          Salvar atualização
        </Button>
        <Link to="/menu-principal" className="block">
          <Button type="button" className="btn-modern-danger w-full">
            Sair
          </Button>
        </Link>
      </div>

      <div className="mt-10 flex justify-center">
        <img src="/Logo%20Rodape.gif" alt="Logo rodapé" className="h-auto w-full max-w-[220px] object-contain" />
      </div>

      {addressChangeModalElement}
    </section>
  );
}










