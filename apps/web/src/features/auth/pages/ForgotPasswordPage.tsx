import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Button } from "@sintese/ui";
import { digitsOnly, formatCpf, formatPhoneBr, isValidCpf, normalizeEmail } from "../../../shared/utils/masks";
import { useCheckCpfExistsMutation, useRecoverPasswordMutation } from "../hooks/useAuthMutations";

type RecoveryChannel = "email" | "whatsapp";

type ForgotErrors = {
  cpf?: string;
  email?: string;
  whatsapp?: string;
};

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function ForgotPasswordPage() {
  const recoverMutation = useRecoverPasswordMutation();
  const cpfCheckMutation = useCheckCpfExistsMutation();

  const [cpf, setCpf] = useState("");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [channel, setChannel] = useState<RecoveryChannel>("email");
  const [errors, setErrors] = useState<ForgotErrors>({});
  const [checkedCpf, setCheckedCpf] = useState("");
  const [cpfLocated, setCpfLocated] = useState<boolean | null>(null);
  const [showContactAlert, setShowContactAlert] = useState(false);

  function validateForm(): boolean {
    const nextErrors: ForgotErrors = {};
    const cpfDigits = digitsOnly(cpf);
    const emailNormalized = normalizeEmail(email);
    const whatsappDigits = digitsOnly(whatsapp);

    if (!cpfDigits) {
      nextErrors.cpf = "CPF é obrigatório.";
    } else if (!isValidCpf(cpfDigits)) {
      nextErrors.cpf = "CPF inválido.";
    } else if (cpfLocated === false) {
      nextErrors.cpf = "CPF não localizado. Realize seu cadastro para continuar.";
    }

    if (channel === "email") {
      if (!emailNormalized) {
        nextErrors.email = "E-mail cadastrado é obrigatório.";
      } else if (!isValidEmail(emailNormalized)) {
        nextErrors.email = "Informe um e-mail válido.";
      }
    }

    if (channel === "whatsapp" && !whatsappDigits) {
      nextErrors.whatsapp = "Número de WhatsApp é obrigatório.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleCpfBlur() {
    const cpfDigits = digitsOnly(cpf);

    if (cpfDigits.length !== 11 || !isValidCpf(cpfDigits)) {
      setCpfLocated(null);
      return;
    }

    if (checkedCpf === cpfDigits) {
      return;
    }

    try {
      const response = await cpfCheckMutation.mutateAsync(cpfDigits);
      setCheckedCpf(cpfDigits);

      if (!response.exists) {
        setCpfLocated(false);
        setEmail("");
        setWhatsapp("");
        return;
      }

      setCpfLocated(true);
      setEmail(normalizeEmail(response.email ?? ""));
      setWhatsapp(formatPhoneBr(response.whatsapp ?? ""));
      setErrors((prev) => ({ ...prev, cpf: undefined }));
    } catch {
      // Em caso de falha de conexão, o usuário pode tentar novamente.
    }
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!validateForm()) {
      return;
    }

    recoverMutation.mutate({
      cpf: digitsOnly(cpf),
      preferredChannel: channel,
      email: channel === "email" ? normalizeEmail(email) : undefined,
      whatsapp: channel === "whatsapp" ? digitsOnly(whatsapp) : undefined
    });
  }

  return (
    <>
      <section className="auth-card-modern mx-auto w-full max-w-[560px]">
        <div className="mb-4 flex justify-center px-3 sm:px-4">
          <img
            src="/logo-sintese-oficial.png"
            alt="Logo SINTESE"
            className="block h-auto object-contain"
            style={{ width: "320px", maxWidth: "100%" }}
          />
        </div>

        <h1 className="section-title mb-4">Esqueceu a senha</h1>

        {recoverMutation.isError ? <div className="alert-error mb-3">Falha ao confirmar solicitação.</div> : null}
        {recoverMutation.isSuccess ? (
          <div className="alert-success mb-3">
            {recoverMutation.data?.message ?? "Solicitação enviada com sucesso."}
          </div>
        ) : null}
        {cpfLocated === false ? (
          <div className="alert-warning mb-3">
            O CPF informado não foi localizado em nosso sistema. Por favor, realize seu{" "}
            <Link to="/cadastro" className="font-bold underline">
              cadastro
            </Link>
            .
          </div>
        ) : null}
        {cpfLocated === true ? (
          <div className="alert-info mb-3">
            CPF localizado. E-mail e WhatsApp preenchidos automaticamente para leitura.
          </div>
        ) : null}

        <form className="space-y-3" onSubmit={onSubmit}>
          <label htmlFor="cpf" className="block text-sm text-slate-900">
            Por favor digite seu CPF
          </label>
          <input
            id="cpf"
            value={cpf}
            onChange={(event) => {
              setCpf(formatCpf(event.target.value));
              setCheckedCpf("");
              setCpfLocated(null);
              setEmail("");
              setWhatsapp("");
              setErrors((prev) => ({ ...prev, cpf: undefined }));
            }}
            onBlur={() => {
              void handleCpfBlur();
            }}
            inputMode="numeric"
            placeholder="CPF"
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-lg leading-none text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-sky-600 focus:ring-2 focus:ring-sky-100"
          />
          {cpfCheckMutation.isPending ? <p className="text-xs text-slate-500">Consultando CPF...</p> : null}
          {errors.cpf ? <p className="text-sm text-red-600">{errors.cpf}</p> : null}

          <label htmlFor="email" className="block text-sm text-slate-900">
            E-mail cadastrado
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(event) => {
              setEmail(normalizeEmail(event.target.value));
              setErrors((prev) => ({ ...prev, email: undefined }));
            }}
            readOnly={cpfLocated === true}
            placeholder="E-mail"
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-lg leading-none text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-sky-600 focus:ring-2 focus:ring-sky-100 read-only:bg-slate-100"
          />
          {errors.email ? <p className="text-sm text-red-600">{errors.email}</p> : null}

          <label htmlFor="whatsapp" className="block text-sm text-slate-900">
            Número de WhatsApp
          </label>
          <input
            id="whatsapp"
            value={whatsapp}
            onChange={(event) => {
              setWhatsapp(formatPhoneBr(event.target.value));
              setErrors((prev) => ({ ...prev, whatsapp: undefined }));
            }}
            readOnly={cpfLocated === true}
            inputMode="tel"
            placeholder="Número de WhatsApp"
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-lg leading-none text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-sky-600 focus:ring-2 focus:ring-sky-100 read-only:bg-slate-100"
          />
          {errors.whatsapp ? <p className="text-sm text-red-600">{errors.whatsapp}</p> : null}

          <label htmlFor="channel" className="block text-sm text-slate-900">
            Como deseja receber a nova senha:
          </label>
          <select
            id="channel"
            value={channel}
            onChange={(event) => {
              setChannel(event.target.value as RecoveryChannel);
              setErrors((prev) => ({ ...prev, email: undefined, whatsapp: undefined }));
            }}
            className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-lg leading-none text-slate-700 outline-none transition focus:border-sky-600 focus:ring-2 focus:ring-sky-100"
          >
            <option value="email">E-mail</option>
            <option value="whatsapp">WhatsApp</option>
          </select>

          <Button type="submit" isLoading={recoverMutation.isPending} className="btn-modern-primary mt-1 w-full">
            Confirmar
          </Button>

          <Link to="/login" className="block">
            <Button type="button" className="btn-modern-danger w-full">
              Sair
            </Button>
          </Link>

          <Button type="button" className="btn-modern-primary w-full" onClick={() => setShowContactAlert(true)}>
            Não reconheço esse e-mail/WhatsApp
          </Button>
        </form>

        <p className="mx-auto mt-4 max-w-[460px] rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-center text-sm font-semibold leading-relaxed text-amber-800">
          Para sua segurança, após confirmar, aguarde a mensagem por e-mail ou WhatsApp e verifique se seus contatos
          estão atualizados.
        </p>

        <div className="mt-6 flex justify-center">
          <img src="/Logo%20Rodape.gif" alt="Logo rodapé" className="h-auto w-full max-w-[220px] object-contain" />
        </div>
      </section>

      {showContactAlert ? (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center px-4"
          style={{ background: "rgba(2, 6, 23, 0.55)", backdropFilter: "blur(2px)" }}
        >
          <div
            className="auth-card-modern border-0 bg-white p-6 pb-8 sm:p-7 sm:pb-9"
            style={{ width: "min(92vw, 500px)", borderRadius: "20px", boxShadow: "0 25px 60px rgba(2,6,23,0.35)" }}
          >
            <div
              className="mx-auto mb-4 flex items-center justify-center rounded-full"
              style={{
                width: "88px",
                height: "88px",
                border: "4px solid #fbbf24",
                background: "linear-gradient(180deg, #fffbeb 0%, #fef3c7 100%)",
                color: "#d97706",
                fontSize: "40px",
                fontWeight: 800
              }}
            >
              !
            </div>
            <h2 className="mb-3 text-center text-3xl font-extrabold tracking-tight text-slate-900">Atenção</h2>
            <p className="text-center text-[1.06rem] leading-relaxed text-slate-700">
              Para sua segurança, entre em contato com o{" "}
              <strong className="text-rose-600">Departamento de Filiação</strong> para confirmar sua identidade e
              solicitar a atualização do seu e-mail ou número de WhatsApp.
            </p>

            <div className="mt-10 flex justify-center">
              <Button
                type="button"
                onClick={() => setShowContactAlert(false)}
                className="btn-modern-primary min-w-[170px] px-8 py-2.5 text-base"
              >
                Entendi
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
