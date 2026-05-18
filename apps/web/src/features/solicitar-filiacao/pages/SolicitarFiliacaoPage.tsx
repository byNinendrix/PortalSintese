import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { Link } from "react-router-dom";
import { createPortal } from "react-dom";
import { Button } from "@sintese/ui";
import type { CreateSolicitacaoFiliacaoRequest, LookupOption } from "@sintese/types";
import { readAuthSession } from "../../auth/services/authSession";
import { digitsOnly, formatCpf, formatPhoneBr } from "../../../shared/utils/masks";
import {
  useSolicitarFiliacaoBootstrapQuery,
  useSolicitarFiliacaoLookupsQuery,
  useSolicitarFiliacaoMutation
} from "../hooks/useSolicitarFiliacaoQueries";

type Step = 1 | 2;

type InssOption = "" | "N" | "S";
type FocusableField = keyof SolicitacaoFormData;

type SolicitacaoFormData = {
  sangueTpRh: string;
  rg: string;
  dataExpRg: string;
  rgOrgao: string;
  rgUf: string;
  nome: string;
  nomeSocial: string;
  dataNascimento: string;
  naturalidade: string;
  sexo: string;
  especificarGenero: string;
  orientacaoSexual: string;
  estadoCivil: string;
  raca: string;
  mae: string;
  pai: string;
  email: string;
  telefone: string;
  celular: string;
  celularIi: string;
  cep: string;
  endereco: string;
  numero: string;
  bairro: string;
  complemento: string;
  estado: string;
  cidade: string;
  matriculaOrgao: string;
  codigoEmpresa: string;
  codigoPredio: string;
  situacaoFuncional: string;
  nivelSalarialOrgao: string;
  cargoOrgao: string;
  profissaoOrgao: string;
  funcaoOrgao: string;
  vinculoOrgao: string;
  cargaHorariaOrgao: string;
  admissaoOrgao: string;
  aposentadoriaOrgao: string;
  descontarInss: InssOption;
  dataDescontoInss: string;
  numeroBeneficioInss: string;
  codigoEspecieInss: string;
  adicionarOutraFiliacao: boolean;
  matriculaOrgaoI: string;
  codigoEmpresaI: string;
  codigoPredioI: string;
  situacaoOrgaoI: string;
  nivelSalarialOrgaoI: string;
  cargoOrgaoI: string;
  profissaoOrgaoI: string;
  funcaoOrgaoI: string;
  vinculoOrgaoI: string;
  cargaHorariaOrgaoI: string;
  admissaoOrgaoI: string;
  aposentadoriaOrgaoI: string;
  descontarInssI: InssOption;
  dataDescontoInssI: string;
  numeroBeneficioInssI: string;
  codigoEspecieInssI: string;
  autorizarDesconto: boolean;
  autorizarLgpd: boolean;
};

type AttachmentKey =
  | "fotoPerfilBase64"
  | "fotoResidenciaBase64"
  | "fotoContracheque01Base64"
  | "fotoContracheque02Base64"
  | "fotoDocumentoBase64"
  | "fotoRgFrenteBase64"
  | "fotoRgVersoBase64";

type AttachmentState = Record<AttachmentKey, string | null>;

type CameraCaptureModalProps = {
  title: string;
  onCancel: () => void;
  onCapture: (dataUrl: string) => void;
};

type TermModalState = {
  title: string;
  content: string;
} | null;

const EMPTY_ATTACHMENTS: AttachmentState = {
  fotoPerfilBase64: null,
  fotoResidenciaBase64: null,
  fotoContracheque01Base64: null,
  fotoContracheque02Base64: null,
  fotoDocumentoBase64: null,
  fotoRgFrenteBase64: null,
  fotoRgVersoBase64: null
};

function formatDateToInput(value: string | null): string {
  if (!value) {
    return "";
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "";
  }
  return parsed.toISOString().slice(0, 10);
}

function formatCep(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 5) {
    return digits;
  }
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toUpperCase();
}

function withCurrentOption(options: LookupOption[], currentValue: string): LookupOption[] {
  const value = currentValue.trim();
  if (!value) {
    return options;
  }
  if (options.some((item) => item.value === value)) {
    return options;
  }
  return [{ value, label: value }, ...options];
}

function buildInitialFormData(): SolicitacaoFormData {
  return {
    sangueTpRh: "",
    rg: "",
    dataExpRg: "",
    rgOrgao: "",
    rgUf: "",
    nome: "",
    nomeSocial: "",
    dataNascimento: "",
    naturalidade: "",
    sexo: "",
    especificarGenero: "",
    orientacaoSexual: "",
    estadoCivil: "",
    raca: "",
    mae: "",
    pai: "",
    email: "",
    telefone: "",
    celular: "",
    celularIi: "",
    cep: "",
    endereco: "",
    numero: "",
    bairro: "",
    complemento: "",
    estado: "",
    cidade: "",
    matriculaOrgao: "",
    codigoEmpresa: "",
    codigoPredio: "",
    situacaoFuncional: "",
    nivelSalarialOrgao: "",
    cargoOrgao: "",
    profissaoOrgao: "",
    funcaoOrgao: "",
    vinculoOrgao: "",
    cargaHorariaOrgao: "",
    admissaoOrgao: "",
    aposentadoriaOrgao: "",
    descontarInss: "",
    dataDescontoInss: "",
    numeroBeneficioInss: "",
    codigoEspecieInss: "",
    adicionarOutraFiliacao: false,
    matriculaOrgaoI: "",
    codigoEmpresaI: "",
    codigoPredioI: "",
    situacaoOrgaoI: "",
    nivelSalarialOrgaoI: "",
    cargoOrgaoI: "",
    profissaoOrgaoI: "",
    funcaoOrgaoI: "",
    vinculoOrgaoI: "",
    cargaHorariaOrgaoI: "",
    admissaoOrgaoI: "",
    aposentadoriaOrgaoI: "",
    descontarInssI: "",
    dataDescontoInssI: "",
    numeroBeneficioInssI: "",
    codigoEspecieInssI: "",
    autorizarDesconto: true,
    autorizarLgpd: true
  };
}

function CameraCaptureModal({ title, onCancel, onCapture }: CameraCaptureModalProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function startCamera() {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error("Seu navegador não suporta captura de câmera.");
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
          audio: false
        });

        if (!active) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
      } catch (cameraError) {
        const message = cameraError instanceof Error ? cameraError.message : "Não foi possível abrir a câmera.";
        setError(message);
      }
    }

    void startCamera();

    return () => {
      active = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, []);

  function handleCapture() {
    if (!videoRef.current) {
      setError("Câmera indisponível para captura.");
      return;
    }

    const width = videoRef.current.videoWidth;
    const height = videoRef.current.videoHeight;
    if (!width || !height) {
      setError("Aguardando inicialização da câmera.");
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) {
      setError("Não foi possível capturar a imagem.");
      return;
    }

    context.drawImage(videoRef.current, 0, 0, width, height);
    onCapture(canvas.toDataURL("image/jpeg", 0.9));
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/75 p-4">
      <div className="w-full max-w-[760px] rounded-2xl bg-white p-4 shadow-2xl">
        <h3 className="mb-3 text-lg font-extrabold text-slate-900">{title}</h3>
        {error ? <p className="alert-error mb-3">{error}</p> : null}

        <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
          <video ref={videoRef} className="h-[360px] w-full object-cover" playsInline muted />
        </div>

        <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <Button type="button" className="btn-modern-primary w-full" onClick={handleCapture}>
            Capturar foto
          </Button>
          <Button type="button" className="btn-modern-danger w-full" onClick={onCancel}>
            Fechar câmera
          </Button>
        </div>
      </div>
    </div>
  );
}

function sanitizeTermsHtml(rawHtml: string): string {
  return rawHtml
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/\son\w+="[^"]*"/gi, "")
    .replace(/\son\w+='[^']*'/gi, "")
    .replace(/\sjavascript:/gi, "");
}

function TermModal({ title, content, onClose }: { title: string; content: string; onClose: () => void }) {
  const hasHtml = /<\/?[a-z][\s\S]*>/i.test(content);
  const safeHtml = hasHtml ? sanitizeTermsHtml(content) : "";
  const modalRoot = typeof document !== "undefined" ? document.body : null;

  if (!modalRoot) {
    return null;
  }

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/75 p-4">
      <div className="w-full max-w-[860px] rounded-2xl bg-white p-4 shadow-2xl">
        <h3 className="mb-3 text-lg font-extrabold text-slate-900">{title}</h3>
        <div className="max-h-[60vh] overflow-y-auto rounded-xl border border-slate-200 bg-white p-3">
          {hasHtml ? (
            <section className="protocolo-termo" dangerouslySetInnerHTML={{ __html: safeHtml }} />
          ) : (
            <p className="whitespace-pre-line text-sm text-slate-800">{content}</p>
          )}
        </div>
        <div className="mt-4">
          <Button type="button" className="btn-modern-danger w-full" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </div>
    </div>,
    modalRoot
  );
}

export function SolicitarFiliacaoPage() {
  const session = readAuthSession();
  const cpfDigits = useMemo(() => digitsOnly(session?.cpf ?? ""), [session?.cpf]);
  const [step, setStep] = useState<Step>(1);
  const [formData, setFormData] = useState<SolicitacaoFormData>(() => buildInitialFormData());
  const [attachments, setAttachments] = useState<AttachmentState>(EMPTY_ATTACHMENTS);
  const [submissionMessage, setSubmissionMessage] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [cepFeedback, setCepFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [isCepLookupLoading, setIsCepLookupLoading] = useState(false);
  const [cameraField, setCameraField] = useState<AttachmentKey | null>(null);
  const [cameraTitle, setCameraTitle] = useState("");
  const [termModal, setTermModal] = useState<TermModalState>(null);
  const autorizarDescontoRef = useRef<HTMLInputElement | null>(null);
  const autorizarLgpdRef = useRef<HTMLInputElement | null>(null);
  const fileInputRefs = useRef<Record<AttachmentKey, HTMLInputElement | null>>({
    fotoPerfilBase64: null,
    fotoResidenciaBase64: null,
    fotoContracheque01Base64: null,
    fotoContracheque02Base64: null,
    fotoDocumentoBase64: null,
    fotoRgFrenteBase64: null,
    fotoRgVersoBase64: null
  });
  const requiredFieldRefs = useRef<Partial<Record<FocusableField, HTMLInputElement | HTMLSelectElement | null>>>({});

  const bootstrapQuery = useSolicitarFiliacaoBootstrapQuery(cpfDigits, Boolean(cpfDigits));
  const selectedUf = formData.estado.trim().toUpperCase() || "SE";
  const lookupsQuery = useSolicitarFiliacaoLookupsQuery(selectedUf, Boolean(cpfDigits));
  const createMutation = useSolicitarFiliacaoMutation();
  const situacoesFuncionais = lookupsQuery.data?.vinculos.situacoesFuncionais ?? [];
  const selectedSituacaoFuncional = situacoesFuncionais.find((item) => item.value === formData.situacaoFuncional);
  const selectedSituacaoFuncionalText = normalizeText(selectedSituacaoFuncional?.label ?? formData.situacaoFuncional);
  const isSituacaoFuncionalAposentado = selectedSituacaoFuncionalText.includes("APOSENT");
  const canChooseInssAuthorization = formData.codigoEmpresa.trim().length > 0 && isSituacaoFuncionalAposentado;
  const shouldRequireInssDetails = canChooseInssAuthorization && formData.descontarInss === "S";
  const selectedSituacaoFuncionalI = situacoesFuncionais.find((item) => item.value === formData.situacaoOrgaoI);
  const selectedSituacaoFuncionalIText = normalizeText(selectedSituacaoFuncionalI?.label ?? formData.situacaoOrgaoI);
  const isSituacaoFuncionalIAposentado = selectedSituacaoFuncionalIText.includes("APOSENT");
  const canChooseInssAuthorizationI =
    formData.adicionarOutraFiliacao && formData.codigoEmpresaI.trim().length > 0 && isSituacaoFuncionalIAposentado;
  const shouldRequireInssDetailsI = canChooseInssAuthorizationI && formData.descontarInssI === "S";

  useEffect(() => {
    if (!bootstrapQuery.data) {
      return;
    }

    setFormData((prev) => ({
      ...prev,
      sangueTpRh: bootstrapQuery.data.sangueTpRh ?? "",
      rg: bootstrapQuery.data.rg ?? "",
      dataExpRg: formatDateToInput(bootstrapQuery.data.dataExpRg),
      rgOrgao: bootstrapQuery.data.rgOrgao ?? "",
      rgUf: bootstrapQuery.data.rgUf ?? "",
      nome: bootstrapQuery.data.nome ?? "",
      nomeSocial: bootstrapQuery.data.nomeSocial ?? "",
      dataNascimento: formatDateToInput(bootstrapQuery.data.dataNascimento),
      naturalidade: bootstrapQuery.data.naturalidade ?? "",
      sexo: bootstrapQuery.data.sexo ?? "",
      especificarGenero: bootstrapQuery.data.especificarGenero ?? "",
      orientacaoSexual: bootstrapQuery.data.orientacaoSexual ?? "",
      estadoCivil: bootstrapQuery.data.estadoCivil ?? "",
      raca: bootstrapQuery.data.raca ?? "",
      mae: bootstrapQuery.data.mae ?? "",
      pai: bootstrapQuery.data.pai ?? "",
      email: bootstrapQuery.data.email ?? "",
      telefone: formatPhoneBr(bootstrapQuery.data.telefone ?? ""),
      celular: formatPhoneBr(bootstrapQuery.data.celular ?? ""),
      celularIi: formatPhoneBr(bootstrapQuery.data.celularIi ?? ""),
      cep: formatCep(bootstrapQuery.data.cep ?? ""),
      endereco: bootstrapQuery.data.endereco ?? "",
      numero: bootstrapQuery.data.numero ?? "",
      bairro: bootstrapQuery.data.bairro ?? "",
      complemento: bootstrapQuery.data.complemento ?? "",
      estado: bootstrapQuery.data.estado ?? "SE",
      cidade: bootstrapQuery.data.cidade ?? "",
      matriculaOrgao: bootstrapQuery.data.matriculaOrgao ?? "",
      codigoEmpresa: bootstrapQuery.data.codigoEmpresa ?? "",
      codigoPredio: bootstrapQuery.data.codigoPredio ?? "",
      situacaoFuncional: bootstrapQuery.data.situacaoFuncional ?? "",
      nivelSalarialOrgao: bootstrapQuery.data.nivelSalarialOrgao ?? "",
      cargoOrgao: bootstrapQuery.data.cargoOrgao ?? "",
      profissaoOrgao: bootstrapQuery.data.profissaoOrgao ?? "",
      funcaoOrgao: bootstrapQuery.data.funcaoOrgao ?? "",
      vinculoOrgao: bootstrapQuery.data.vinculoOrgao ?? "",
      cargaHorariaOrgao: bootstrapQuery.data.cargaHorariaOrgao ?? "",
      admissaoOrgao: formatDateToInput(bootstrapQuery.data.admissaoOrgao),
      aposentadoriaOrgao: formatDateToInput(bootstrapQuery.data.aposentadoriaOrgao),
      descontarInss: bootstrapQuery.data.descontarInss ?? "",
      dataDescontoInss: formatDateToInput(bootstrapQuery.data.dataDescontoInss),
      numeroBeneficioInss: bootstrapQuery.data.numeroBeneficioInss ?? "",
      codigoEspecieInss: bootstrapQuery.data.codigoEspecieInss ?? "",
      adicionarOutraFiliacao: Boolean(bootstrapQuery.data.adicionarOutraFiliacao),
      matriculaOrgaoI: bootstrapQuery.data.matriculaOrgaoI ?? "",
      codigoEmpresaI: bootstrapQuery.data.codigoEmpresaI ?? "",
      codigoPredioI: bootstrapQuery.data.codigoPredioI ?? "",
      situacaoOrgaoI: bootstrapQuery.data.situacaoOrgaoI ?? "",
      nivelSalarialOrgaoI: bootstrapQuery.data.nivelSalarialOrgaoI ?? "",
      cargoOrgaoI: bootstrapQuery.data.cargoOrgaoI ?? "",
      profissaoOrgaoI: bootstrapQuery.data.profissaoOrgaoI ?? "",
      funcaoOrgaoI: bootstrapQuery.data.funcaoOrgaoI ?? "",
      vinculoOrgaoI: bootstrapQuery.data.vinculoOrgaoI ?? "",
      cargaHorariaOrgaoI: bootstrapQuery.data.cargaHorariaOrgaoI ?? "",
      admissaoOrgaoI: formatDateToInput(bootstrapQuery.data.admissaoOrgaoI),
      aposentadoriaOrgaoI: formatDateToInput(bootstrapQuery.data.aposentadoriaOrgaoI),
      descontarInssI: bootstrapQuery.data.descontarInssI ?? "",
      dataDescontoInssI: formatDateToInput(bootstrapQuery.data.dataDescontoInssI),
      numeroBeneficioInssI: bootstrapQuery.data.numeroBeneficioInssI ?? "",
      codigoEspecieInssI: bootstrapQuery.data.codigoEspecieInssI ?? "",
      autorizarDesconto: bootstrapQuery.data.autorizarDesconto ?? true,
      autorizarLgpd: bootstrapQuery.data.autorizarLgpd ?? true
    }));

    setAttachments({
      fotoPerfilBase64: bootstrapQuery.data.fotoPerfilUrl ?? null,
      fotoResidenciaBase64: bootstrapQuery.data.fotoResidenciaUrl ?? null,
      fotoContracheque01Base64: bootstrapQuery.data.fotoContracheque01Url ?? null,
      fotoContracheque02Base64: bootstrapQuery.data.fotoContracheque02Url ?? null,
      fotoDocumentoBase64: bootstrapQuery.data.fotoDocumentoUrl ?? null,
      fotoRgFrenteBase64: bootstrapQuery.data.fotoRgFrenteUrl ?? null,
      fotoRgVersoBase64: bootstrapQuery.data.fotoRgVersoUrl ?? null
    });
  }, [bootstrapQuery.data]);

  useEffect(() => {
    if (canChooseInssAuthorization) {
      return;
    }

    setFormData((prev) => {
      if (!prev.descontarInss && !prev.dataDescontoInss && !prev.numeroBeneficioInss && !prev.codigoEspecieInss) {
        return prev;
      }

      return {
        ...prev,
        descontarInss: "",
        dataDescontoInss: "",
        numeroBeneficioInss: "",
        codigoEspecieInss: ""
      };
    });
  }, [canChooseInssAuthorization]);

  useEffect(() => {
    if (formData.descontarInss === "S") {
      return;
    }

    setFormData((prev) => {
      if (!prev.dataDescontoInss && !prev.numeroBeneficioInss && !prev.codigoEspecieInss) {
        return prev;
      }

      return {
        ...prev,
        dataDescontoInss: "",
        numeroBeneficioInss: "",
        codigoEspecieInss: ""
      };
    });
  }, [formData.descontarInss]);

  useEffect(() => {
    if (canChooseInssAuthorizationI) {
      return;
    }

    setFormData((prev) => {
      if (!prev.descontarInssI && !prev.dataDescontoInssI && !prev.numeroBeneficioInssI && !prev.codigoEspecieInssI) {
        return prev;
      }

      return {
        ...prev,
        descontarInssI: "",
        dataDescontoInssI: "",
        numeroBeneficioInssI: "",
        codigoEspecieInssI: ""
      };
    });
  }, [canChooseInssAuthorizationI]);

  useEffect(() => {
    if (formData.descontarInssI === "S") {
      return;
    }

    setFormData((prev) => {
      if (!prev.dataDescontoInssI && !prev.numeroBeneficioInssI && !prev.codigoEspecieInssI) {
        return prev;
      }

      return {
        ...prev,
        dataDescontoInssI: "",
        numeroBeneficioInssI: "",
        codigoEspecieInssI: ""
      };
    });
  }, [formData.descontarInssI]);

  useEffect(() => {
    if (isSituacaoFuncionalAposentado) {
      return;
    }

    setFormData((prev) => {
      if (!prev.aposentadoriaOrgao) {
        return prev;
      }
      return {
        ...prev,
        aposentadoriaOrgao: ""
      };
    });
  }, [isSituacaoFuncionalAposentado]);

  useEffect(() => {
    if (!formData.adicionarOutraFiliacao || isSituacaoFuncionalIAposentado) {
      return;
    }

    setFormData((prev) => {
      if (!prev.aposentadoriaOrgaoI) {
        return prev;
      }
      return {
        ...prev,
        aposentadoriaOrgaoI: ""
      };
    });
  }, [formData.adicionarOutraFiliacao, isSituacaoFuncionalIAposentado]);

  function focusRequiredField(field: FocusableField, targetStep: Step) {
    const applyFocus = () => {
      const element = requiredFieldRefs.current[field];
      if (!element) {
        return;
      }

      element.scrollIntoView({ behavior: "smooth", block: "center" });
      element.focus();
      if (element instanceof HTMLInputElement && element.type !== "date" && element.type !== "checkbox") {
        element.select();
      }
    };

    if (step !== targetStep) {
      setStep(targetStep);
      setTimeout(applyFocus, 0);
      return;
    }

    applyFocus();
  }

  function setField<K extends keyof SolicitacaoFormData>(field: K, value: SolicitacaoFormData[K]) {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setSubmissionMessage(null);
  }

  function setAttachment(field: AttachmentKey, value: string | null) {
    setAttachments((prev) => ({ ...prev, [field]: value }));
    setSubmissionMessage(null);
  }

  async function handleLookupCep() {
    const cepDigits = formData.cep.replace(/\D/g, "");
    if (cepDigits.length !== 8) {
      setCepFeedback({ type: "error", message: "Informe um CEP válido com 8 dígitos." });
      return;
    }

    try {
      setIsCepLookupLoading(true);
      setCepFeedback(null);
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
        endereco: data.logradouro?.trim() || prev.endereco,
        complemento: data.complemento?.trim() || prev.complemento,
        bairro: data.bairro?.trim() || prev.bairro,
        cidade: data.localidade?.trim() || prev.cidade,
        estado: data.uf?.trim().toUpperCase() || prev.estado
      }));
      setCepFeedback({ type: "success", message: "CEP localizado e endereço preenchido automaticamente." });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro ao consultar CEP.";
      setCepFeedback({ type: "error", message });
    } finally {
      setIsCepLookupLoading(false);
    }
  }

  function openUpload(field: AttachmentKey) {
    fileInputRefs.current[field]?.click();
  }

  async function onUploadFile(field: AttachmentKey, event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    if (!file.type.startsWith("image/")) {
      setSubmissionMessage({ type: "error", message: "Selecione apenas arquivos de imagem." });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setSubmissionMessage({ type: "error", message: "Cada imagem deve ter até 5MB." });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result ?? "");
      setAttachment(field, result);
    };
    reader.readAsDataURL(file);
  }

  function openCamera(field: AttachmentKey, title: string) {
    setCameraField(field);
    setCameraTitle(title);
  }

  function handleCameraCapture(dataUrl: string) {
    if (!cameraField) {
      return;
    }
    setAttachment(cameraField, dataUrl);
    setCameraField(null);
    setCameraTitle("");
  }

  function validateBeforeSubmit(): boolean {
    const requiredStep1 = [
      { key: "nome", label: "Nome Completo" },
      { key: "rg", label: "RG" },
      { key: "mae", label: "Nome da Mãe" },
      { key: "celular", label: "Celular/WhatsApp" },
      { key: "cep", label: "CEP" },
      { key: "endereco", label: "Endereço" },
      { key: "numero", label: "Número" },
      { key: "bairro", label: "Bairro" },
      { key: "estado", label: "UF" },
      { key: "cidade", label: "Cidade" }
    ] as const;

    for (const field of requiredStep1) {
      if (!formData[field.key].trim()) {
        setSubmissionMessage({ type: "error", message: `Preencha o campo obrigatório: ${field.label}.` });
        focusRequiredField(field.key, 1);
        return false;
      }
    }

    const requiredStep2 = [
      { key: "matriculaOrgao", label: "Matrícula" },
      { key: "codigoEmpresa", label: "Ente Público" },
      { key: "codigoPredio", label: "Escola/Órgão" },
      { key: "situacaoFuncional", label: "Situação Funcional" },
      { key: "nivelSalarialOrgao", label: "Nível Carreira" },
      { key: "cargoOrgao", label: "Cargo" },
      { key: "profissaoOrgao", label: "Formação Acadêmica/Profissional" },
      { key: "funcaoOrgao", label: "Função do Magistério" },
      { key: "vinculoOrgao", label: "Regime de Trabalho" }
    ] as const;

    for (const field of requiredStep2) {
      if (!formData[field.key].trim()) {
        setSubmissionMessage({ type: "error", message: `Preencha o campo obrigatório: ${field.label}.` });
        focusRequiredField(field.key, 2);
        return false;
      }
    }

    if (formData.adicionarOutraFiliacao) {
      const requiredStep2Second = [
        { key: "matriculaOrgaoI", label: "Matrícula (2º vínculo)" },
        { key: "codigoEmpresaI", label: "Ente Público (2º vínculo)" },
        { key: "codigoPredioI", label: "Escola/Órgão (2º vínculo)" },
        { key: "situacaoOrgaoI", label: "Situação Funcional (2º vínculo)" },
        { key: "nivelSalarialOrgaoI", label: "Nível Carreira (2º vínculo)" },
        { key: "cargoOrgaoI", label: "Cargo (2º vínculo)" },
        { key: "profissaoOrgaoI", label: "Formação Acadêmica/Profissional (2º vínculo)" },
        { key: "funcaoOrgaoI", label: "Função do Magistério (2º vínculo)" },
        { key: "vinculoOrgaoI", label: "Regime de Trabalho (2º vínculo)" }
      ] as const;

      for (const field of requiredStep2Second) {
        if (!formData[field.key].trim()) {
          setSubmissionMessage({ type: "error", message: `Preencha o campo obrigatório: ${field.label}.` });
          focusRequiredField(field.key, 2);
          return false;
        }
      }
    }

    if (canChooseInssAuthorization && !formData.descontarInss) {
      setSubmissionMessage({ type: "error", message: "Escolha o campo obrigatório: Autorizar INSS." });
      focusRequiredField("descontarInss", 2);
      return false;
    }

    if (shouldRequireInssDetails) {
      const requiredInssFields = [
        { key: "dataDescontoInss", label: "Data INSS" },
        { key: "numeroBeneficioInss", label: "Nº Benefício INSS" },
        { key: "codigoEspecieInss", label: "Código Espécie INSS" }
      ] as const;

      for (const field of requiredInssFields) {
        if (!formData[field.key].trim()) {
          setSubmissionMessage({ type: "error", message: `Preencha o campo obrigatório: ${field.label}.` });
          focusRequiredField(field.key, 2);
          return false;
        }
      }
    }

    if (canChooseInssAuthorizationI && !formData.descontarInssI) {
      setSubmissionMessage({ type: "error", message: "Escolha o campo obrigatório: Autorizar INSS (2º vínculo)." });
      focusRequiredField("descontarInssI", 2);
      return false;
    }

    if (shouldRequireInssDetailsI) {
      const requiredInssFieldsSecond = [
        { key: "dataDescontoInssI", label: "Data INSS (2º vínculo)" },
        { key: "numeroBeneficioInssI", label: "Nº Benefício INSS (2º vínculo)" },
        { key: "codigoEspecieInssI", label: "Código Espécie INSS (2º vínculo)" }
      ] as const;

      for (const field of requiredInssFieldsSecond) {
        if (!formData[field.key].trim()) {
          setSubmissionMessage({ type: "error", message: `Preencha o campo obrigatório: ${field.label}.` });
          focusRequiredField(field.key, 2);
          return false;
        }
      }
    }

    if (!formData.autorizarDesconto) {
      setSubmissionMessage({ type: "error", message: "Você precisa concordar com o termo de autorização do desconto sindical." });
      setStep(2);
      autorizarDescontoRef.current?.focus();
      return false;
    }

    if (!formData.autorizarLgpd) {
      setSubmissionMessage({ type: "error", message: "Você precisa concordar com os termos da L.G.P.D." });
      setStep(2);
      autorizarLgpdRef.current?.focus();
      return false;
    }

    const requiredFiles: Array<{ key: AttachmentKey; label: string }> = [
      { key: "fotoPerfilBase64", label: "Foto Perfil" },
      { key: "fotoResidenciaBase64", label: "Comprovante Residência" },
      { key: "fotoContracheque01Base64", label: "Contra Cheque 01" },
      { key: "fotoRgFrenteBase64", label: "Documento Oficial com Foto - Frente" },
      { key: "fotoRgVersoBase64", label: "Documento Oficial com Foto - Verso" },
      { key: "fotoDocumentoBase64", label: "Selfie c/ Documento Oficial com Foto" }
    ];

    if (formData.adicionarOutraFiliacao) {
      requiredFiles.push({ key: "fotoContracheque02Base64", label: "Contra Cheque 02" });
    }

    const missingFile = requiredFiles.find((item) => !attachments[item.key]);
    if (missingFile) {
      setSubmissionMessage({
        type: "error",
        message: `Anexe o documento obrigatório: ${missingFile.label}.`
      });
      setStep(2);
      return false;
    }

    return true;
  }

  async function handleSubmit() {
    setSubmissionMessage(null);
    if (!validateBeforeSubmit()) {
      return;
    }

    const payload: CreateSolicitacaoFiliacaoRequest = {
      cpf: cpfDigits,
      nome: formData.nome,
      nomeSocial: formData.nomeSocial,
      pai: formData.pai,
      mae: formData.mae,
      naturalidade: formData.naturalidade,
      cep: formData.cep,
      endereco: formData.endereco,
      numero: formData.numero,
      complemento: formData.complemento,
      bairro: formData.bairro,
      cidade: formData.cidade,
      estado: formData.estado,
      telefone: formData.telefone,
      celular: formData.celular,
      celularIi: formData.celularIi,
      dataNascimento: formData.dataNascimento,
      email: formData.email,
      estadoCivil: formData.estadoCivil,
      especificarGenero: formData.especificarGenero,
      orientacaoSexual: formData.orientacaoSexual,
      sexo: formData.sexo,
      rg: formData.rg,
      dataExpRg: formData.dataExpRg,
      sangueTpRh: formData.sangueTpRh,
      rgOrgao: formData.rgOrgao,
      rgUf: formData.rgUf,
      raca: formData.raca,
      matriculaOrgao: formData.matriculaOrgao,
      codigoEmpresa: formData.codigoEmpresa,
      codigoPredio: formData.codigoPredio,
      nivelSalarialOrgao: formData.nivelSalarialOrgao,
      situacaoFuncional: formData.situacaoFuncional,
      cargoOrgao: formData.cargoOrgao,
      funcaoOrgao: formData.funcaoOrgao,
      profissaoOrgao: formData.profissaoOrgao,
      vinculoOrgao: formData.vinculoOrgao,
      cargaHorariaOrgao: formData.cargaHorariaOrgao,
      admissaoOrgao: formData.admissaoOrgao,
      aposentadoriaOrgao: formData.aposentadoriaOrgao,
      adicionarOutraFiliacao: formData.adicionarOutraFiliacao,
      matriculaOrgaoI: formData.matriculaOrgaoI,
      codigoEmpresaI: formData.codigoEmpresaI,
      codigoPredioI: formData.codigoPredioI,
      nivelSalarialOrgaoI: formData.nivelSalarialOrgaoI,
      situacaoOrgaoI: formData.situacaoOrgaoI,
      cargoOrgaoI: formData.cargoOrgaoI,
      funcaoOrgaoI: formData.funcaoOrgaoI,
      profissaoOrgaoI: formData.profissaoOrgaoI,
      vinculoOrgaoI: formData.vinculoOrgaoI,
      cargaHorariaOrgaoI: formData.cargaHorariaOrgaoI,
      admissaoOrgaoI: formData.admissaoOrgaoI,
      aposentadoriaOrgaoI: formData.aposentadoriaOrgaoI,
      descontarInss: formData.descontarInss || undefined,
      dataDescontoInss: formData.dataDescontoInss,
      numeroBeneficioInss: formData.numeroBeneficioInss,
      codigoEspecieInss: formData.codigoEspecieInss,
      descontarInssI: formData.descontarInssI || undefined,
      dataDescontoInssI: formData.dataDescontoInssI,
      numeroBeneficioInssI: formData.numeroBeneficioInssI,
      codigoEspecieInssI: formData.codigoEspecieInssI,
      autorizarDesconto: formData.autorizarDesconto,
      autorizarLgpd: formData.autorizarLgpd,
      termoLgpd: termoLgpdTexto || "ESTOU DE ACORDO COM OS TERMOS DA L.G.P.D.",
      fotoPerfilBase64: attachments.fotoPerfilBase64 ?? undefined,
      fotoResidenciaBase64: attachments.fotoResidenciaBase64 ?? undefined,
      fotoContracheque01Base64: attachments.fotoContracheque01Base64 ?? undefined,
      fotoContracheque02Base64: attachments.fotoContracheque02Base64 ?? undefined,
      fotoDocumentoBase64: attachments.fotoDocumentoBase64 ?? undefined,
      fotoRgFrenteBase64: attachments.fotoRgFrenteBase64 ?? undefined,
      fotoRgVersoBase64: attachments.fotoRgVersoBase64 ?? undefined
    };

    try {
      const response = await createMutation.mutateAsync(payload);
      setSubmissionMessage({
        type: "success",
        message: `${response.message} Protocolo: ${response.protocolo}`
      });
      setStep(1);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Não foi possível enviar a solicitação.";
      setSubmissionMessage({ type: "error", message });
    }
  }

  const lookups = lookupsQuery.data;
  const fatores = withCurrentOption(bootstrapQuery.data?.fatoresSanguineos ?? [], formData.sangueTpRh);
  const ufs = withCurrentOption(lookups?.ufs ?? [], formData.estado.trim());
  const generos = withCurrentOption(lookups?.generos ?? [], formData.sexo.trim());
  const estadosCivis = withCurrentOption(lookups?.estadosCivis ?? [], formData.estadoCivil.trim());
  const racas = withCurrentOption(lookups?.racas ?? [], formData.raca.trim());
  const cidades = withCurrentOption(
    (lookups?.cidades ?? []).map((item) => ({ value: item.value, label: item.label })),
    formData.cidade.trim()
  );
  const termoAutorizacaoDesconto = bootstrapQuery.data?.termoAutorizacaoDesconto?.trim() ?? "";
  const termoLgpdTexto = bootstrapQuery.data?.termoLgpdTexto?.trim() ?? "";
  const termoLgpdDataExtenso = bootstrapQuery.data?.termoLgpdDataExtenso?.trim() ?? "";

  function renderAttachmentCard(field: AttachmentKey, title: string, required = false) {
    const imageUrl = attachments[field];
    return (
      <article className="rounded-xl border border-slate-200 bg-slate-50 p-3">
        <h3 className="mb-2 rounded-md bg-slate-900 px-2 py-1 text-center text-sm font-extrabold text-white">
          {title} {required ? "*" : ""}
        </h3>
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          {imageUrl ? (
            <img src={imageUrl} alt={title} className="h-[180px] w-full object-cover" />
          ) : (
            <div className="flex h-[180px] items-center justify-center text-sm text-slate-500">(Imagem)</div>
          )}
        </div>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <Button type="button" className="btn-modern-primary w-full" onClick={() => openUpload(field)}>
            Anexar
          </Button>
          <Button type="button" className="btn-modern-danger w-full" onClick={() => openCamera(field, title)}>
            Câmera
          </Button>
        </div>
        <input
          ref={(node) => {
            fileInputRefs.current[field] = node;
          }}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(event) => {
            void onUploadFile(field, event);
          }}
        />
      </article>
    );
  }

  const selectClass =
    "w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-base text-slate-800 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100";
  const editableClass =
    "w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-base text-slate-800 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100";
  const requiredEditableClass =
    "w-full rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-2 text-base text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100";
  const lockedClass = "w-full rounded-xl border border-slate-300 bg-slate-100 px-3 py-2 text-base text-slate-700";

  return (
    <section className="auth-card-modern mx-auto w-full max-w-[700px]">
      <div className="mb-4 flex justify-center px-3 sm:px-4">
        <img
          src="/logo-sintese-oficial.png"
          alt="Logo SINTESE"
          className="block h-auto object-contain"
          style={{ width: "320px", maxWidth: "100%" }}
        />
      </div>

      <h1 className="section-title mb-4">Solicitar Filiação</h1>

      {!cpfDigits ? <div className="alert-error mb-3">Sessão inválida. Faça login novamente.</div> : null}
      {bootstrapQuery.isError ? <div className="alert-error mb-3">Não foi possível carregar seus dados iniciais.</div> : null}
      {lookupsQuery.isError ? <div className="alert-error mb-3">Não foi possível carregar as listas da tela.</div> : null}

      {submissionMessage ? (
        <div className={`${submissionMessage.type === "success" ? "alert-success" : "alert-error"} mb-3`} role="status" aria-live="polite">
          {submissionMessage.message}
        </div>
      ) : null}

      {submissionMessage?.type === "error" ? (
        <div className="fixed inset-x-0 bottom-4 z-[9998] flex justify-center px-3">
          <div
            className="w-full max-w-[680px] rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 shadow-lg"
            role="alert"
            aria-live="assertive"
          >
            {submissionMessage.message}
          </div>
        </div>
      ) : null}

      <div className="mb-4 flex gap-2">
        <button
          type="button"
          className={`flex-1 rounded-xl border px-3 py-2 text-sm font-bold ${step === 1 ? "border-red-200 bg-red-50 text-red-600" : "border-slate-300 bg-white text-slate-700"}`}
          onClick={() => setStep(1)}
        >
          Passo (1)
        </button>
        <button
          type="button"
          className={`flex-1 rounded-xl border px-3 py-2 text-sm font-bold ${step === 2 ? "border-red-200 bg-red-50 text-red-600" : "border-slate-300 bg-white text-slate-700"}`}
          onClick={() => setStep(2)}
        >
          Passo (2)
        </button>
      </div>

      <p className="mb-3 text-center text-sm font-semibold text-red-600">Todos os campos com * é obrigatório seu preenchimento.</p>

      {step === 1 ? (
        <>
          <article className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="section-title mb-4">Foto Perfil</h2>
            <div className="mx-auto w-full max-w-[300px] overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
              {attachments.fotoPerfilBase64 ? (
                <img src={attachments.fotoPerfilBase64} alt="Foto perfil" className="h-[260px] w-full object-cover" />
              ) : (
                <div className="flex h-[260px] items-center justify-center text-sm text-slate-500">(Imagem)</div>
              )}
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Button type="button" className="btn-modern-primary w-full" onClick={() => openUpload("fotoPerfilBase64")}>
                Anexar foto
              </Button>
              <Button
                type="button"
                className="btn-modern-danger w-full"
                onClick={() => openCamera("fotoPerfilBase64", "Foto Perfil")}
              >
                Usar câmera
              </Button>
            </div>
            <input
              ref={(node) => {
                fileInputRefs.current.fotoPerfilBase64 = node;
              }}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(event) => {
                void onUploadFile("fotoPerfilBase64", event);
              }}
            />
            <p className="mt-3 text-center text-xs font-semibold text-red-600">Sua foto de perfil será incorporada à sua carteirinha.</p>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="section-title mb-4">Dados Pessoais</h2>
            <div className="grid grid-cols-1 gap-3">
              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm text-slate-900">CPF</label>
                <input value={formatCpf(cpfDigits)} readOnly className={lockedClass} />
              </div>

              <div>
                <label className="mb-1 block text-sm text-slate-900">Tipo/Fator Sanguíneo</label>
                <select value={formData.sangueTpRh} onChange={(event) => setField("sangueTpRh", event.target.value)} className={selectClass}>
                  <option value="">Selecione</option>
                  {fatores.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm text-slate-900">RG *</label>
                <input
                  ref={(node) => {
                    requiredFieldRefs.current.rg = node;
                  }}
                  value={formData.rg}
                  onChange={(event) => setField("rg", event.target.value)}
                  className={requiredEditableClass}
                />
              </div>

              <div>
                <label className="mb-1 block text-sm text-slate-900">Data Expedição</label>
                <input
                  type="date"
                  value={formData.dataExpRg}
                  onChange={(event) => setField("dataExpRg", event.target.value)}
                  className={editableClass}
                />
              </div>

              <div>
                <label className="mb-1 block text-sm text-slate-900">Órgão</label>
                <input value={formData.rgOrgao} onChange={(event) => setField("rgOrgao", event.target.value)} className={editableClass} />
              </div>

              <div>
                <label className="mb-1 block text-sm text-slate-900">UF</label>
                <select value={formData.rgUf} onChange={(event) => setField("rgUf", event.target.value)} className={selectClass}>
                  <option value="">Selecione</option>
                  {ufs.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm text-slate-900">Nome Completo *</label>
                <input
                  ref={(node) => {
                    requiredFieldRefs.current.nome = node;
                  }}
                  value={formData.nome}
                  onChange={(event) => setField("nome", event.target.value)}
                  className={requiredEditableClass}
                />
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm text-slate-900">Nome Social</label>
                <input value={formData.nomeSocial} onChange={(event) => setField("nomeSocial", event.target.value)} className={editableClass} />
              </div>

              <div>
                <label className="mb-1 block text-sm text-slate-900">Data Nascimento</label>
                <input
                  type="date"
                  value={formData.dataNascimento}
                  onChange={(event) => setField("dataNascimento", event.target.value)}
                  className={editableClass}
                />
              </div>

              <div>
                <label className="mb-1 block text-sm text-slate-900">Naturalidade</label>
                <input value={formData.naturalidade} onChange={(event) => setField("naturalidade", event.target.value)} className={editableClass} />
              </div>

              <div>
                <label className="mb-1 block text-sm text-slate-900">Sexo *</label>
                <select value={formData.sexo} onChange={(event) => setField("sexo", event.target.value)} className={requiredEditableClass}>
                  <option value="">Selecione</option>
                  {generos.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm text-slate-900">Especificar o Gênero</label>
                <input
                  value={formData.especificarGenero}
                  onChange={(event) => setField("especificarGenero", event.target.value)}
                  className={editableClass}
                />
              </div>

              <div>
                <label className="mb-1 block text-sm text-slate-900">Orientação Sexual</label>
                <input
                  value={formData.orientacaoSexual}
                  onChange={(event) => setField("orientacaoSexual", event.target.value)}
                  className={editableClass}
                />
              </div>

              <div>
                <label className="mb-1 block text-sm text-slate-900">Estado Cívil *</label>
                <select
                  value={formData.estadoCivil}
                  onChange={(event) => setField("estadoCivil", event.target.value)}
                  className={requiredEditableClass}
                >
                  <option value="">Selecione</option>
                  {estadosCivis.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm text-slate-900">Raça/Etínia</label>
                <select value={formData.raca} onChange={(event) => setField("raca", event.target.value)} className={selectClass}>
                  <option value="">Selecione</option>
                  {racas.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm text-slate-900">Mãe *</label>
                <input
                  ref={(node) => {
                    requiredFieldRefs.current.mae = node;
                  }}
                  value={formData.mae}
                  onChange={(event) => setField("mae", event.target.value)}
                  className={requiredEditableClass}
                />
              </div>

              <div>
                <label className="mb-1 block text-sm text-slate-900">Pai</label>
                <input value={formData.pai} onChange={(event) => setField("pai", event.target.value)} className={editableClass} />
              </div>
            </div>
          </article>

          <article className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="section-title mb-4">Dados Adicionais</h2>
            <div className="grid grid-cols-1 gap-3">
              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm text-slate-900">E-mail</label>
                <input value={formData.email} readOnly className={lockedClass} />
              </div>

              <div>
                <label className="mb-1 block text-sm text-slate-900">Telefone</label>
                <input
                  value={formData.telefone}
                  onChange={(event) => setField("telefone", formatPhoneBr(event.target.value))}
                  className={editableClass}
                />
              </div>

              <div>
                <label className="mb-1 block text-sm text-slate-900">Celular/WhatsApp *</label>
                <input
                  ref={(node) => {
                    requiredFieldRefs.current.celular = node;
                  }}
                  value={formData.celular}
                  onChange={(event) => setField("celular", formatPhoneBr(event.target.value))}
                  className={requiredEditableClass}
                />
              </div>

              <div>
                <label className="mb-1 block text-sm text-slate-900">Celular II</label>
                <input
                  value={formData.celularIi}
                  onChange={(event) => setField("celularIi", formatPhoneBr(event.target.value))}
                  className={editableClass}
                />
              </div>

              <div>
                <label className="mb-1 block text-sm text-slate-900">CEP *</label>
                <input
                  ref={(node) => {
                    requiredFieldRefs.current.cep = node;
                  }}
                  value={formData.cep}
                  onChange={(event) => setField("cep", formatCep(event.target.value))}
                  className={requiredEditableClass}
                />
              </div>

              <div className="sm:col-span-2">
                <Button
                  type="button"
                  className="btn-modern-danger w-full"
                  isLoading={isCepLookupLoading}
                  disabled={isCepLookupLoading}
                  onClick={handleLookupCep}
                >
                  Consultar CEP
                </Button>
                {cepFeedback ? (
                  <p className={`mt-2 text-center text-xs font-semibold ${cepFeedback.type === "success" ? "text-emerald-700" : "text-red-600"}`}>
                    {cepFeedback.message}
                  </p>
                ) : null}
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm text-slate-900">Endereço *</label>
                <input
                  ref={(node) => {
                    requiredFieldRefs.current.endereco = node;
                  }}
                  value={formData.endereco}
                  onChange={(event) => setField("endereco", event.target.value)}
                  className={requiredEditableClass}
                />
              </div>

              <div>
                <label className="mb-1 block text-sm text-slate-900">Nº *</label>
                <input
                  ref={(node) => {
                    requiredFieldRefs.current.numero = node;
                  }}
                  value={formData.numero}
                  onChange={(event) => setField("numero", event.target.value)}
                  className={requiredEditableClass}
                />
              </div>

              <div>
                <label className="mb-1 block text-sm text-slate-900">Bairro *</label>
                <input
                  ref={(node) => {
                    requiredFieldRefs.current.bairro = node;
                  }}
                  value={formData.bairro}
                  onChange={(event) => setField("bairro", event.target.value)}
                  className={requiredEditableClass}
                />
              </div>

              <div>
                <label className="mb-1 block text-sm text-slate-900">Complemento</label>
                <input value={formData.complemento} onChange={(event) => setField("complemento", event.target.value)} className={editableClass} />
              </div>

              <div>
                <label className="mb-1 block text-sm text-slate-900">UF *</label>
                <select
                  ref={(node) => {
                    requiredFieldRefs.current.estado = node;
                  }}
                  value={formData.estado}
                  onChange={(event) => setField("estado", event.target.value)}
                  className={requiredEditableClass}
                >
                  <option value="">Selecione</option>
                  {ufs.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm text-slate-900">Cidade *</label>
                <select
                  ref={(node) => {
                    requiredFieldRefs.current.cidade = node;
                  }}
                  value={formData.cidade}
                  onChange={(event) => setField("cidade", event.target.value)}
                  className={requiredEditableClass}
                >
                  <option value="">Selecione</option>
                  {cidades.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </article>
        </>
      ) : null}

      {step === 2 ? (
        <>
          <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="section-title mb-4">Dados sobre seu vínculo público</h2>
            <div className="grid grid-cols-1 gap-3">
              <div>
                <label className="mb-1 block text-sm text-slate-900">Matrícula *</label>
                <input
                  ref={(node) => {
                    requiredFieldRefs.current.matriculaOrgao = node;
                  }}
                  value={formData.matriculaOrgao}
                  onChange={(event) => setField("matriculaOrgao", event.target.value)}
                  className={requiredEditableClass}
                />
              </div>

              <div>
                <label className="mb-1 block text-sm text-slate-900">Ente Público *</label>
                <select
                  ref={(node) => {
                    requiredFieldRefs.current.codigoEmpresa = node;
                  }}
                  value={formData.codigoEmpresa}
                  onChange={(event) => setField("codigoEmpresa", event.target.value)}
                  className={requiredEditableClass}
                >
                  <option value="">Selecione</option>
                  {(lookups?.vinculos.empresas ?? []).map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm text-slate-900">Escola/Órgão *</label>
                <input
                  ref={(node) => {
                    requiredFieldRefs.current.codigoPredio = node;
                  }}
                  value={formData.codigoPredio}
                  onChange={(event) => setField("codigoPredio", event.target.value)}
                  className={requiredEditableClass}
                />
              </div>

              <div>
                <label className="mb-1 block text-sm text-slate-900">Situação Funcional *</label>
                <select
                  ref={(node) => {
                    requiredFieldRefs.current.situacaoFuncional = node;
                  }}
                  value={formData.situacaoFuncional}
                  onChange={(event) => setField("situacaoFuncional", event.target.value)}
                  className={requiredEditableClass}
                >
                  <option value="">Selecione</option>
                  {(lookups?.vinculos.situacoesFuncionais ?? []).map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm text-slate-900">Nível Carreira *</label>
                <select
                  ref={(node) => {
                    requiredFieldRefs.current.nivelSalarialOrgao = node;
                  }}
                  value={formData.nivelSalarialOrgao}
                  onChange={(event) => setField("nivelSalarialOrgao", event.target.value)}
                  className={requiredEditableClass}
                >
                  <option value="">Selecione</option>
                  {(lookups?.vinculos.niveisCarreira ?? []).map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm text-slate-900">Cargo *</label>
                <select
                  ref={(node) => {
                    requiredFieldRefs.current.cargoOrgao = node;
                  }}
                  value={formData.cargoOrgao}
                  onChange={(event) => setField("cargoOrgao", event.target.value)}
                  className={requiredEditableClass}
                >
                  <option value="">Selecione</option>
                  {(lookups?.vinculos.cargos ?? []).map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm text-slate-900">Formação Acadêmica/Profissional *</label>
                <select
                  ref={(node) => {
                    requiredFieldRefs.current.profissaoOrgao = node;
                  }}
                  value={formData.profissaoOrgao}
                  onChange={(event) => setField("profissaoOrgao", event.target.value)}
                  className={requiredEditableClass}
                >
                  <option value="">Selecione</option>
                  {(lookups?.vinculos.formacoesProfissionais ?? []).map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm text-slate-900">Função do Magistério *</label>
                <select
                  ref={(node) => {
                    requiredFieldRefs.current.funcaoOrgao = node;
                  }}
                  value={formData.funcaoOrgao}
                  onChange={(event) => setField("funcaoOrgao", event.target.value)}
                  className={requiredEditableClass}
                >
                  <option value="">Selecione</option>
                  {(lookups?.vinculos.funcoesMagisterio ?? []).map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm text-slate-900">Regime de Trabalho *</label>
                <select
                  ref={(node) => {
                    requiredFieldRefs.current.vinculoOrgao = node;
                  }}
                  value={formData.vinculoOrgao}
                  onChange={(event) => setField("vinculoOrgao", event.target.value)}
                  className={requiredEditableClass}
                >
                  <option value="">Selecione</option>
                  {(lookups?.vinculos.regimesTrabalho ?? []).map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm text-slate-900">Data Aposentadoria</label>
                <input
                  type="date"
                  value={formData.aposentadoriaOrgao}
                  onChange={(event) => setField("aposentadoriaOrgao", event.target.value)}
                  className={isSituacaoFuncionalAposentado ? editableClass : lockedClass}
                  disabled={!isSituacaoFuncionalAposentado}
                />
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
              <label className="mb-1 block text-sm font-semibold text-slate-900">
                Autorizar INSS{canChooseInssAuthorization ? " *" : ""}
              </label>
              <select
                ref={(node) => {
                  requiredFieldRefs.current.descontarInss = node;
                }}
                value={formData.descontarInss}
                onChange={(event) => setField("descontarInss", event.target.value as InssOption)}
                className={canChooseInssAuthorization ? selectClass : lockedClass}
                disabled={!canChooseInssAuthorization}
              >
                <option value="">
                  {canChooseInssAuthorization ? "Selecione" : "Disponível após Ente Público + Situação Funcional APOSENTADO"}
                </option>
                <option value="S">Sim</option>
                <option value="N">Não</option>
              </select>

              <div className="mt-2 grid grid-cols-1 gap-2">
                <input
                  type="date"
                  ref={(node) => {
                    requiredFieldRefs.current.dataDescontoInss = node;
                  }}
                  value={formData.dataDescontoInss}
                  onChange={(event) => setField("dataDescontoInss", event.target.value)}
                  className={shouldRequireInssDetails ? requiredEditableClass : editableClass}
                  placeholder="Data INSS"
                  disabled={!shouldRequireInssDetails}
                />
                <input
                  ref={(node) => {
                    requiredFieldRefs.current.numeroBeneficioInss = node;
                  }}
                  value={formData.numeroBeneficioInss}
                  onChange={(event) => setField("numeroBeneficioInss", event.target.value)}
                  className={shouldRequireInssDetails ? requiredEditableClass : editableClass}
                  placeholder="Nº Benefício INSS"
                  disabled={!shouldRequireInssDetails}
                />
                <select
                  ref={(node) => {
                    requiredFieldRefs.current.codigoEspecieInss = node;
                  }}
                  value={formData.codigoEspecieInss}
                  onChange={(event) => setField("codigoEspecieInss", event.target.value)}
                  className={shouldRequireInssDetails ? requiredEditableClass : selectClass}
                  disabled={!shouldRequireInssDetails}
                >
                  <option value="">Código Espécie INSS</option>
                  {(lookups?.vinculos.especiesInss ?? []).map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <label className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-slate-900">
              <input
                type="checkbox"
                checked={formData.adicionarOutraFiliacao}
                onChange={(event) => setField("adicionarOutraFiliacao", event.target.checked)}
                className="h-4 w-4 rounded border-slate-300"
              />
              Adicionar 2º vínculo público
            </label>

            {formData.adicionarOutraFiliacao ? (
              <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
                <h3 className="mb-2 text-sm font-extrabold text-slate-900">Dados sobre seu 2º vínculo público</h3>
                <div className="grid grid-cols-1 gap-2">
                  <input
                    ref={(node) => {
                      requiredFieldRefs.current.matriculaOrgaoI = node;
                    }}
                    placeholder="Matrícula *"
                    value={formData.matriculaOrgaoI}
                    onChange={(event) => setField("matriculaOrgaoI", event.target.value)}
                    className={requiredEditableClass}
                  />
                  <select
                    ref={(node) => {
                      requiredFieldRefs.current.codigoEmpresaI = node;
                    }}
                    value={formData.codigoEmpresaI}
                    onChange={(event) => setField("codigoEmpresaI", event.target.value)}
                    className={requiredEditableClass}
                  >
                    <option value="">Ente Público</option>
                    {(lookups?.vinculos.empresas ?? []).map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                  <input
                    ref={(node) => {
                      requiredFieldRefs.current.codigoPredioI = node;
                    }}
                    placeholder="Escola/Órgão *"
                    value={formData.codigoPredioI}
                    onChange={(event) => setField("codigoPredioI", event.target.value)}
                    className={requiredEditableClass}
                  />
                  <select
                    ref={(node) => {
                      requiredFieldRefs.current.situacaoOrgaoI = node;
                    }}
                    value={formData.situacaoOrgaoI}
                    onChange={(event) => setField("situacaoOrgaoI", event.target.value)}
                    className={requiredEditableClass}
                  >
                    <option value="">Situação Funcional *</option>
                    {(lookups?.vinculos.situacoesFuncionais ?? []).map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                  <select
                    ref={(node) => {
                      requiredFieldRefs.current.nivelSalarialOrgaoI = node;
                    }}
                    value={formData.nivelSalarialOrgaoI}
                    onChange={(event) => setField("nivelSalarialOrgaoI", event.target.value)}
                    className={requiredEditableClass}
                  >
                    <option value="">Nível Carreira *</option>
                    {(lookups?.vinculos.niveisCarreira ?? []).map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                  <select
                    ref={(node) => {
                      requiredFieldRefs.current.cargoOrgaoI = node;
                    }}
                    value={formData.cargoOrgaoI}
                    onChange={(event) => setField("cargoOrgaoI", event.target.value)}
                    className={requiredEditableClass}
                  >
                    <option value="">Cargo *</option>
                    {(lookups?.vinculos.cargos ?? []).map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                  <select
                    ref={(node) => {
                      requiredFieldRefs.current.profissaoOrgaoI = node;
                    }}
                    value={formData.profissaoOrgaoI}
                    onChange={(event) => setField("profissaoOrgaoI", event.target.value)}
                    className={requiredEditableClass}
                  >
                    <option value="">Formação Acadêmica/Profissional *</option>
                    {(lookups?.vinculos.formacoesProfissionais ?? []).map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                  <select
                    ref={(node) => {
                      requiredFieldRefs.current.funcaoOrgaoI = node;
                    }}
                    value={formData.funcaoOrgaoI}
                    onChange={(event) => setField("funcaoOrgaoI", event.target.value)}
                    className={requiredEditableClass}
                  >
                    <option value="">Função do Magistério *</option>
                    {(lookups?.vinculos.funcoesMagisterio ?? []).map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                  <select
                    ref={(node) => {
                      requiredFieldRefs.current.vinculoOrgaoI = node;
                    }}
                    value={formData.vinculoOrgaoI}
                    onChange={(event) => setField("vinculoOrgaoI", event.target.value)}
                    className={requiredEditableClass}
                  >
                    <option value="">Regime de Trabalho *</option>
                    {(lookups?.vinculos.regimesTrabalho ?? []).map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                  <input
                    type="date"
                    value={formData.aposentadoriaOrgaoI}
                    onChange={(event) => setField("aposentadoriaOrgaoI", event.target.value)}
                    className={isSituacaoFuncionalIAposentado ? editableClass : lockedClass}
                    disabled={!isSituacaoFuncionalIAposentado}
                  />
                </div>

                <div className="mt-3 rounded-xl border border-slate-200 bg-white p-3">
                  <label className="mb-1 block text-sm font-semibold text-slate-900">
                    Autorizar INSS (2º vínculo){canChooseInssAuthorizationI ? " *" : ""}
                  </label>
                  <select
                    ref={(node) => {
                      requiredFieldRefs.current.descontarInssI = node;
                    }}
                    value={formData.descontarInssI}
                    onChange={(event) => setField("descontarInssI", event.target.value as InssOption)}
                    className={canChooseInssAuthorizationI ? selectClass : lockedClass}
                    disabled={!canChooseInssAuthorizationI}
                  >
                    <option value="">
                      {canChooseInssAuthorizationI ? "Selecione" : "Disponível após Ente Público + Situação Funcional APOSENTADO"}
                    </option>
                    <option value="S">Sim</option>
                    <option value="N">Não</option>
                  </select>

                  <div className="mt-2 grid grid-cols-1 gap-2">
                    <input
                      type="date"
                      ref={(node) => {
                        requiredFieldRefs.current.dataDescontoInssI = node;
                      }}
                      value={formData.dataDescontoInssI}
                      onChange={(event) => setField("dataDescontoInssI", event.target.value)}
                      className={shouldRequireInssDetailsI ? requiredEditableClass : editableClass}
                      placeholder="Data INSS (2º vínculo)"
                      disabled={!shouldRequireInssDetailsI}
                    />
                    <input
                      ref={(node) => {
                        requiredFieldRefs.current.numeroBeneficioInssI = node;
                      }}
                      value={formData.numeroBeneficioInssI}
                      onChange={(event) => setField("numeroBeneficioInssI", event.target.value)}
                      className={shouldRequireInssDetailsI ? requiredEditableClass : editableClass}
                      placeholder="Nº Benefício INSS (2º vínculo)"
                      disabled={!shouldRequireInssDetailsI}
                    />
                    <select
                      ref={(node) => {
                        requiredFieldRefs.current.codigoEspecieInssI = node;
                      }}
                      value={formData.codigoEspecieInssI}
                      onChange={(event) => setField("codigoEspecieInssI", event.target.value)}
                      className={shouldRequireInssDetailsI ? requiredEditableClass : selectClass}
                      disabled={!shouldRequireInssDetailsI}
                    >
                      <option value="">Código Espécie INSS (2º vínculo)</option>
                      {(lookups?.vinculos.especiesInss ?? []).map((item) => (
                        <option key={item.value} value={item.value}>
                          {item.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            ) : null}
          </article>

          <article className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="mb-3 text-center text-base font-semibold text-red-600">As imagens abaixo são essenciais para sua filiação.</p>
            <p className="mb-4 text-center text-base font-semibold text-red-600">Certifique-se de anexá-las.</p>

            <div className="grid grid-cols-1 gap-3">
              {renderAttachmentCard("fotoResidenciaBase64", "Comprovante Residência", true)}
              {renderAttachmentCard("fotoContracheque01Base64", "Contra Cheque 01", true)}
              {formData.adicionarOutraFiliacao ? renderAttachmentCard("fotoContracheque02Base64", "Contra Cheque 02", true) : null}
              {renderAttachmentCard("fotoRgFrenteBase64", "Documento Oficial com Foto - Frente", true)}
              {renderAttachmentCard("fotoRgVersoBase64", "Documento Oficial com Foto - Verso", true)}
              {renderAttachmentCard("fotoDocumentoBase64", "Selfie c/ Documento Oficial com Foto", true)}
            </div>
          </article>

          <article className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <h2 className="section-title mb-4">Termos e Autorizações</h2>
            <label className="mb-2 flex items-start gap-2 text-sm text-slate-900">
              <input
                ref={autorizarDescontoRef}
                type="checkbox"
                className="mt-1 h-4 w-4 rounded border-slate-300"
                checked={formData.autorizarDesconto}
                onChange={(event) => setField("autorizarDesconto", event.target.checked)}
              />
              <button
                type="button"
                className="text-left font-semibold text-sky-700 underline"
                onClick={() =>
                  setTermModal({
                    title: "Termo de autorização do desconto sindical",
                    content: termoAutorizacaoDesconto || "Termo não disponível no momento."
                  })
                }
              >
                Autorizo o desconto da contribuição sindical mensal.
              </button>
            </label>
            <label className="flex items-start gap-2 text-sm text-slate-900">
              <input
                ref={autorizarLgpdRef}
                type="checkbox"
                className="mt-1 h-4 w-4 rounded border-slate-300"
                checked={formData.autorizarLgpd}
                onChange={(event) => setField("autorizarLgpd", event.target.checked)}
              />
              <button
                type="button"
                className="text-left font-semibold text-sky-700 underline"
                onClick={() =>
                  setTermModal({
                    title: "Termos da L.G.P.D.",
                    content: `${termoLgpdTexto || "Termo não disponível no momento."}${termoLgpdDataExtenso ? `\n\n${termoLgpdDataExtenso}` : ""}`
                  })
                }
              >
                Estou de acordo com os termos da L.G.P.D.
              </button>
            </label>
          </article>
        </>
      ) : null}

      {step === 1 ? (
        <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <Link to="/menu-principal" className="block">
            <Button type="button" className="btn-modern-danger w-full">
              Sair
            </Button>
          </Link>
          <Button type="button" className="btn-modern-danger w-full" onClick={() => setStep(2)}>
            {"Avan\u00E7ar"}
          </Button>
        </div>
      ) : null}

      {step === 2 ? (
        <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2">
          <Button type="button" className="btn-modern-danger w-full" onClick={() => setStep(1)}>
            Voltar
          </Button>
          <Button type="button" className="btn-modern-danger w-full" onClick={handleSubmit} isLoading={createMutation.isPending}>
            Confirmar solicitação
          </Button>
        </div>
      ) : null}

      <div className="mt-8 flex justify-center">
        <img src="/Logo%20Rodape.gif" alt="Logo rodapé" className="h-auto w-full max-w-[220px] object-contain" />
      </div>

      {termModal ? <TermModal title={termModal.title} content={termModal.content} onClose={() => setTermModal(null)} /> : null}

      {cameraField ? (
        <CameraCaptureModal
          title={`Captura de imagem - ${cameraTitle}`}
          onCancel={() => {
            setCameraField(null);
            setCameraTitle("");
          }}
          onCapture={handleCameraCapture}
        />
      ) : null}
    </section>
  );
}








