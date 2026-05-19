import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Button } from "@sintese/ui";
import { digitsOnly, formatCpf, formatPhoneBr, isValidCpf, normalizeEmail } from "../../../shared/utils/masks";
import { ApiRequestError } from "../../../shared/services/apiClient";
import { useCheckCpfExistsMutation, useRegisterMutation } from "../hooks/useAuthMutations";

type PasswordChannel = "email" | "whatsapp";

type RegisterErrors = {
  cpf?: string;
  email?: string;
  whatsapp?: string;
};

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
}

export function RegisterPage() {
  const registerMutation = useRegisterMutation();
  const cpfCheckMutation = useCheckCpfExistsMutation();

  const [cpf, setCpf] = useState("");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [channel, setChannel] = useState<PasswordChannel>("email");
  const [errors, setErrors] = useState<RegisterErrors>({});
  const [cpfAlreadyExists, setCpfAlreadyExists] = useState(false);
  const [checkedCpf, setCheckedCpf] = useState("");

  function validateForm(): boolean {
    const nextErrors: RegisterErrors = {};
    const cpfDigits = digitsOnly(cpf);
    const normalizedEmail = normalizeEmail(email);
    const whatsappDigits = digitsOnly(whatsapp);

    if (!cpfDigits) {
      nextErrors.cpf = "CPF é obrigatório.";
    } else if (!isValidCpf(cpfDigits)) {
      nextErrors.cpf = "CPF inválido.";
    } else if (cpfAlreadyExists) {
      nextErrors.cpf = "Já existe cadastro com este CPF. Use a tela de redefinição de senha.";
    }

    if (channel === "email") {
      if (!normalizedEmail) {
        nextErrors.email = "E-mail é obrigatório para receber a 1ª senha por e-mail.";
      } else if (!isValidEmail(normalizedEmail)) {
        nextErrors.email = "Informe um e-mail válido.";
      }
    }

    if (channel === "whatsapp" && !whatsappDigits) {
      nextErrors.whatsapp = "WhatsApp é obrigatório para receber a 1ª senha por WhatsApp.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleCpfBlur() {
    const cpfDigits = digitsOnly(cpf);

    if (cpfDigits.length !== 11 || !isValidCpf(cpfDigits)) {
      setCpfAlreadyExists(false);
      return;
    }

    if (checkedCpf === cpfDigits) {
      return;
    }

    try {
      const response = await cpfCheckMutation.mutateAsync(cpfDigits);
      setCheckedCpf(cpfDigits);
      setCpfAlreadyExists(response.exists);
      if (response.exists) {
        setErrors((prev) => ({
          ...prev,
          cpf: "Já existe cadastro com este CPF. Volte e use Redefinir senha."
        }));
      }
    } catch {
      // Silently ignore validation-check failures and let submission validations continue.
    }
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!validateForm()) {
      return;
    }

    const cpfDigits = digitsOnly(cpf);
    const normalizedEmail = normalizeEmail(email);
    const whatsappDigits = digitsOnly(whatsapp);

    registerMutation.mutate({
      cpf: cpfDigits,
      email: normalizedEmail || undefined,
      whatsapp: whatsappDigits || undefined,
      preferredChannel: channel,
      fullName: "Cadastro Web",
      password: `primeiro-acesso-${channel}`
    }, {
      onError: (error) => {
        if (error instanceof ApiRequestError && error.status === 409) {
          setCpfAlreadyExists(true);
          setErrors((prev) => ({
            ...prev,
            cpf: "CPF/usuario ja cadastrado. Verifique e-mail ou WhatsApp, ou use Redefinir senha."
          }));
        }
      }
    });
  }

  const registerErrorMessage =
    registerMutation.isError && registerMutation.error instanceof ApiRequestError && registerMutation.error.status === 409
      ? "CPF/usuario ja cadastrado. Verifique e-mail ou WhatsApp, ou use Redefinir senha."
      : registerMutation.isError
        ? "Falha ao confirmar cadastro. Tente novamente."
        : null;

  return (
    <section className="auth-card-modern mx-auto w-full max-w-[560px]">
      <div className="mb-4 flex justify-center px-3 sm:px-4">
        <img
          src="/logo-sintese-oficial.png"
          alt="Logo SINTESE"
          className="block h-auto object-contain"
          style={{ width: "320px", maxWidth: "100%" }}
        />
      </div>

      <h1 className="section-title mb-4">Efetuar Cadastro Web</h1>

      {registerErrorMessage ? <div className="alert-error mb-3">{registerErrorMessage}</div> : null}
      {registerMutation.isSuccess ? (
        <div className="alert-success mb-3">
          Cadastro confirmado com sucesso. Volte para a tela principal, informe seu CPF e senha e clique em Acessar.
        </div>
      ) : null}
      {cpfAlreadyExists ? (
        <div className="alert-warning mb-3">
          Já existe cadastro com este CPF. Recomendamos usar a tela de{" "}
          <Link to="/recuperar-senha" className="font-bold underline">
            Redefinir senha
          </Link>
          .
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
            setCpfAlreadyExists(false);
            setErrors((prev) => ({ ...prev, cpf: undefined }));
          }}
          onBlur={() => {
            void handleCpfBlur();
          }}
          inputMode="numeric"
          placeholder="CPF"
          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-lg leading-none text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-sky-600 focus:ring-2 focus:ring-sky-100"
        />
        {cpfCheckMutation.isPending ? <p className="text-xs text-slate-500">Validando CPF no cadastro...</p> : null}
        {errors.cpf ? <p className="text-sm text-red-600">{errors.cpf}</p> : null}

        <label htmlFor="email" className="block text-sm text-slate-900">
          Por favor digite seu e-mail
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(event) => {
            setEmail(normalizeEmail(event.target.value));
            setErrors((prev) => ({ ...prev, email: undefined }));
          }}
          placeholder="E-mail"
          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-lg leading-none text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-sky-600 focus:ring-2 focus:ring-sky-100"
        />
        {errors.email ? <p className="text-sm text-red-600">{errors.email}</p> : null}

        <label htmlFor="whatsapp" className="block text-sm text-slate-900">
          Por favor digite seu WhatsApp
        </label>
        <input
          id="whatsapp"
          value={whatsapp}
          onChange={(event) => {
            setWhatsapp(formatPhoneBr(event.target.value));
            setErrors((prev) => ({ ...prev, whatsapp: undefined }));
          }}
          inputMode="tel"
          placeholder="Número de WhatsApp"
          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-lg leading-none text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-sky-600 focus:ring-2 focus:ring-sky-100"
        />
        {errors.whatsapp ? <p className="text-sm text-red-600">{errors.whatsapp}</p> : null}

        <label htmlFor="channel" className="block text-sm text-slate-900">
          Como deseja receber a 1ª senha:
        </label>
        <select
          id="channel"
          value={channel}
          onChange={(event) => {
            setChannel(event.target.value as PasswordChannel);
            setErrors((prev) => ({ ...prev, email: undefined, whatsapp: undefined }));
          }}
          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-lg leading-none text-slate-700 outline-none transition focus:border-sky-600 focus:ring-2 focus:ring-sky-100"
        >
          <option value="email">E-mail</option>
          <option value="whatsapp">WhatsApp</option>
        </select>

        {channel === "whatsapp" ? (
          <div className="alert-info">Validação ativa: o campo WhatsApp não pode ficar vazio.</div>
        ) : null}

        <Button type="submit" isLoading={registerMutation.isPending} className="btn-modern-primary mt-1 w-full">
          Confirmar
        </Button>

        <Link to="/login" className="block">
          <Button type="button" className="btn-modern-danger w-full">
            Sair
          </Button>
        </Link>
      </form>

      <p className="mx-auto mt-4 max-w-[460px] rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-center text-sm font-semibold leading-relaxed text-amber-800">
        Prezado(a), sua primeira senha será enviada ao e-mail cadastrado ou, se preferir, pelo WhatsApp.
        Certifique-se de que seus contatos estão atualizados.
      </p>

      <div className="mt-6 flex justify-center">
        <img src="/Logo%20Rodape.gif" alt="Logo rodapé" className="h-auto w-full max-w-[220px] object-contain" />
      </div>
    </section>
  );
}
